/**
 * Confirm Delete Modal Component
 * 
 * A reusable confirmation dialog for delete actions across the Admin Panel.
 * 
 * Features:
 * - Warning icon with danger styling
 * - Dynamic item name in message
 * - Loading state during deletion
 * - Cancel (safe) and Delete (destructive) actions
 * - Clicking outside acts as Cancel
 */

import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Callback when open state changes (e.g., clicking outside) */
    onOpenChange: (open: boolean) => void;
    /** Name/type of item being deleted (e.g., "this poll", "this match") */
    itemName: string;
    /** Callback to execute the deletion */
    onConfirm: () => void;
    /** Whether deletion is in progress */
    isDeleting?: boolean;
}

/**
 * A reusable delete confirmation modal that follows UX best practices:
 * - Clear, specific messaging about what will be deleted
 * - Warning indicator with danger styling
 * - Disabled buttons during deletion with loading indicator
 * - Cancel as the safe default action
 */
const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    open,
    onOpenChange,
    itemName,
    onConfirm,
    isDeleting = false,
}) => {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Confirm Deletion
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                        <span className="block">
                            Are you sure you want to delete {itemName}?
                        </span>
                        <span className="block text-destructive font-medium">
                            This action cannot be undone.
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault(); // Prevent auto-close
                            onConfirm();
                        }}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default ConfirmDeleteModal;
