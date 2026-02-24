/**
 * vote — Supabase Edge Function
 *
 * Verifies Firebase ID tokens and inserts poll votes with the verified UID.
 * This is the ONLY way to insert votes — the public INSERT policy is removed.
 *
 * Security:
 * - Firebase JWT verified via Google's public X509 certificates
 * - UID extracted from verified token (never trusted from frontend)
 * - One vote per user per poll enforced by unique DB index
 * - Service role key bypasses RLS for insert
 * - CORS hardened with OPTIONS preflight
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode as decodeBase64Url } from "https://deno.land/std@0.168.0/encoding/base64url.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── CORS Headers ────────────────────────────────────────────────────────────
const corsHeaders = (req: Request) => ({
    "Access-Control-Allow-Origin": req.headers.get("origin") || "*",
    "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
});

// ─── Google Public Key Cache ─────────────────────────────────────────────────
const GOOGLE_CERTS_URL =
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const CLOCK_SKEW_SECONDS = 300; // 5 minutes

interface CertCache {
    keys: Record<string, string>;
    fetchedAt: number;
}

let certCache: CertCache | null = null;

async function fetchGoogleCerts(): Promise<Record<string, string>> {
    const res = await fetch(GOOGLE_CERTS_URL);
    if (!res.ok) {
        throw new Error(`Failed to fetch Google certs: ${res.status}`);
    }
    const certs: Record<string, string> = await res.json();
    certCache = { keys: certs, fetchedAt: Date.now() };
    return certs;
}

async function getGoogleCerts(forceRefresh = false): Promise<Record<string, string>> {
    if (forceRefresh || !certCache || Date.now() - certCache.fetchedAt > CACHE_TTL_MS) {
        return await fetchGoogleCerts();
    }
    return certCache.keys;
}

// ─── JWT Utilities ───────────────────────────────────────────────────────────

function decodeJwtUnverified(token: string): {
    header: { alg: string; kid: string; typ?: string };
    payload: Record<string, unknown>;
} {
    const parts = token.split(".");
    if (parts.length !== 3) {
        throw new Error("Invalid JWT: expected 3 parts");
    }
    const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0])));
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1])));
    return { header, payload };
}

function extractSPKI(certDer: Uint8Array): ArrayBuffer {
    let offset = 0;

    function readTag(): { tag: number; length: number; headerLen: number } {
        const tag = certDer[offset];
        offset++;
        let length = 0;
        let headerLen = 2;
        if (certDer[offset] & 0x80) {
            const numBytes = certDer[offset] & 0x7f;
            offset++;
            headerLen += numBytes;
            for (let i = 0; i < numBytes; i++) {
                length = (length << 8) | certDer[offset];
                offset++;
            }
        } else {
            length = certDer[offset];
            offset++;
        }
        return { tag, length, headerLen };
    }

    function skipElement(): void {
        const { length } = readTag();
        offset += length;
    }

    readTag(); // Outer SEQUENCE
    readTag(); // tbsCertificate SEQUENCE

    if ((certDer[offset] & 0xe0) === 0xa0) skipElement(); // version
    skipElement(); // serialNumber
    skipElement(); // signature algorithm
    skipElement(); // issuer
    skipElement(); // validity
    skipElement(); // subject

    // SubjectPublicKeyInfo
    const spkiStart = offset;
    const spkiTag = readTag();
    const spkiTotalLen = spkiTag.headerLen + spkiTag.length;
    return certDer.slice(spkiStart, spkiStart + spkiTotalLen).buffer;
}

async function importPublicKey(pem: string): Promise<CryptoKey> {
    const pemContents = pem
        .replace(/-----BEGIN CERTIFICATE-----/g, "")
        .replace(/-----END CERTIFICATE-----/g, "")
        .replace(/\s/g, "");
    const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
    return await crypto.subtle.importKey(
        "spki",
        extractSPKI(binaryDer),
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["verify"]
    );
}

async function verifyFirebaseToken(
    token: string,
    projectId: string
): Promise<Record<string, unknown>> {
    const { header, payload } = decodeJwtUnverified(token);

    console.log("[DEBUG] JWT header kid:", header.kid, "alg:", header.alg);
    console.log("[DEBUG] JWT claims — aud:", payload.aud, "iss:", payload.iss, "sub:", payload.sub);
    console.log("[DEBUG] JWT exp:", payload.exp, "now:", Math.floor(Date.now() / 1000));
    console.log("[DEBUG] Expected project_id:", projectId);

    const kid = header.kid;
    if (!kid) throw new Error("JWT missing kid in header");

    let certs = await getGoogleCerts();
    let pem = certs[kid];
    console.log("[DEBUG] Cert found for kid:", !!pem, "available kids:", Object.keys(certs));

    if (!pem) {
        certs = await getGoogleCerts(true);
        pem = certs[kid];
        if (!pem) throw new Error(`No matching public key for kid: ${kid}`);
    }

    const parts = token.split(".");
    const signatureInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = decodeBase64Url(parts[2]);

    let publicKey: CryptoKey;
    try {
        publicKey = await importPublicKey(pem);
    } catch (_e) {
        console.log("[DEBUG] Initial key import failed, refreshing certs...");
        certs = await getGoogleCerts(true);
        pem = certs[kid];
        if (!pem) throw new Error("Failed to import public key after refresh");
        publicKey = await importPublicKey(pem);
    }

    const valid = await crypto.subtle.verify(
        "RSASSA-PKCS1-v1_5",
        publicKey,
        signature,
        signatureInput
    );
    console.log("[DEBUG] Signature valid:", valid);

    if (!valid) {
        const freshCerts = await getGoogleCerts(true);
        const freshPem = freshCerts[kid];
        if (freshPem) {
            const freshKey = await importPublicKey(freshPem);
            const retryValid = await crypto.subtle.verify(
                "RSASSA-PKCS1-v1_5",
                freshKey,
                signature,
                signatureInput
            );
            console.log("[DEBUG] Retry signature valid:", retryValid);
            if (!retryValid) throw new Error("JWT signature verification failed after retry");
        } else {
            throw new Error("JWT signature verification failed");
        }
    }

    // Validate claims
    const expectedIssuer = `https://securetoken.google.com/${projectId}`;
    if (payload.iss !== expectedIssuer) {
        throw new Error(`Invalid issuer: expected ${expectedIssuer}, got ${payload.iss}`);
    }
    if (payload.aud !== projectId) {
        throw new Error(`Invalid audience: expected ${projectId}, got ${payload.aud}`);
    }

    const now = Math.floor(Date.now() / 1000);
    const exp = payload.exp as number;
    if (!exp || now > exp + CLOCK_SKEW_SECONDS) {
        throw new Error(`Token has expired: exp=${exp}, now=${now}, skew=${CLOCK_SKEW_SECONDS}`);
    }

    const sub = payload.sub as string;
    if (!sub || sub.trim() === "") {
        throw new Error("Token missing sub (user ID)");
    }

    console.log("[DEBUG] Token verification SUCCESS — uid:", sub);
    return payload;
}

// ─── Edge Function Handler ───────────────────────────────────────────────────

serve(async (req: Request) => {
    console.log("🔥 VOTE HANDLER EXECUTING 🔥");
    console.log("---- VOTE FUNCTION HIT ----");
    console.log("[DEBUG] Method:", req.method);

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        console.log("[DEBUG] CORS preflight — returning OK");
        return new Response("ok", { headers: corsHeaders(req) });
    }

    try {
        // ── Extract & verify token ───────────────────────────────────────────
        const authHeader = req.headers.get("authorization");
        console.log("[DEBUG] AUTH HEADER:", authHeader ? `Bearer <${authHeader.length} chars>` : "MISSING");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log("[DEBUG] REJECTED: Missing or malformed Authorization header");
            return new Response(
                JSON.stringify({ error: "Missing or invalid Authorization header" }),
                { status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
            );
        }

        const token = authHeader.split(" ")[1];
        console.log("[DEBUG] TOKEN EXISTS:", !!token, "length:", token?.length);

        const projectId = Deno.env.get("FIREBASE_PROJECT_ID");
        console.log("[DEBUG] FIREBASE_PROJECT_ID:", projectId || "NOT SET");
        if (!projectId) {
            console.error("FIREBASE_PROJECT_ID secret not set");
            return new Response(
                JSON.stringify({ error: "Server configuration error" }),
                { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
            );
        }

        let payload: Record<string, unknown>;
        try {
            payload = await verifyFirebaseToken(token, projectId);
        } catch (verifyError) {
            console.error("[DEBUG] Token verification FAILED:", (verifyError as Error).message);
            return new Response(
                JSON.stringify({ error: "Unauthorized", detail: (verifyError as Error).message }),
                { status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
            );
        }

        const firebaseUid = payload.sub as string;
        console.log("[DEBUG] Verified UID:", firebaseUid);

        // ── Parse request body ───────────────────────────────────────────────
        let body: { poll_id?: string; selected_option?: string };
        try {
            body = await req.json();
        } catch (_e) {
            return new Response(
                JSON.stringify({ error: "Invalid JSON body" }),
                { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
            );
        }

        const { poll_id, selected_option } = body;

        if (!poll_id || !selected_option) {
            return new Response(
                JSON.stringify({ error: "Missing poll_id or selected_option" }),
                { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
            );
        }

        // ── Insert vote via service role ─────────────────────────────────────
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Check poll status (active, not ended)
        const { data: pollData, error: pollError } = await supabase
            .from("polls")
            .select("id, is_active, ends_at")
            .eq("id", poll_id)
            .single();

        if (pollError || !pollData) {
            return new Response(
                JSON.stringify({ error: "Poll not found" }),
                { status: 404, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
            );
        }

        if (!pollData.is_active) {
            return new Response(
                JSON.stringify({ error: "This poll is currently paused" }),
                { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
            );
        }

        if (pollData.ends_at && new Date(pollData.ends_at) <= new Date()) {
            return new Response(
                JSON.stringify({ error: "This poll has ended" }),
                { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
            );
        }

        // Insert the vote
        const { error: insertError } = await supabase.from("poll_votes").insert({
            poll_id,
            user_id: firebaseUid,
            user_identifier: firebaseUid, // backward compat with existing column
            selected_option,
        });

        if (insertError) {
            // Duplicate vote (unique constraint violation)
            if (insertError.code === "23505") {
                return new Response(
                    JSON.stringify({ error: "You have already voted on this poll" }),
                    { status: 409, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
                );
            }
            console.error("Insert error:", insertError.message);
            return new Response(
                JSON.stringify({ error: insertError.message }),
                { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, uid: firebaseUid }),
            { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("Unexpected error:", (err as Error).message);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
        );
    }
});
