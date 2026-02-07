export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: string
          key: string
          value: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          caption: string | null
          created_at: string
          house_slug: string
          id: string
          type: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          house_slug: string
          id?: string
          type: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          house_slug?: string
          id?: string
          type?: string
          url?: string
        }
        Relationships: []
      }
      polls: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          show_results: boolean
          options: Json
          question: string
          votes: Json
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          show_results?: boolean
          options?: Json
          question: string
          votes?: Json
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          show_results?: boolean
          options?: Json
          question?: string
          votes?: Json
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          id: string
          poll_id: string
          user_identifier: string
          selected_option: string
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          user_identifier: string
          selected_option: string
          created_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          user_identifier?: string
          selected_option?: string
          created_at?: string
        }
        Relationships: []
      }
      sport_events: {
        Row: {
          id: string
          game: string
          category: string
          vayu: number
          aakash: number
          prithvi: number
          agni: number
          jal: number
          created_at: string
        }
        Insert: {
          id?: string
          game: string
          category: string
          vayu?: number
          aakash?: number
          prithvi?: number
          agni?: number
          jal?: number
          created_at?: string
        }
        Update: {
          id?: string
          game?: string
          category?: string
          vayu?: number
          aakash?: number
          prithvi?: number
          agni?: number
          jal?: number
          created_at?: string
        }
        Relationships: []
      }
      score_events: {
        Row: {
          created_at: string
          day_label: string | null
          event_date: string
          event_name: string
          house_slug: string
          id: string
          points: number
        }
        Insert: {
          created_at?: string
          day_label?: string | null
          event_date?: string
          event_name: string
          house_slug: string
          id?: string
          points: number
        }
        Update: {
          created_at?: string
          day_label?: string | null
          event_date?: string
          event_name?: string
          house_slug?: string
          id?: string
          points?: number
        }
        Relationships: []
      }
      scoreboard: {
        Row: {
          created_at: string
          draws: number
          house_name: string
          house_slug: string
          id: string
          losses: number
          points: number
          updated_at: string
          wins: number
        }
        Insert: {
          created_at?: string
          draws?: number
          house_name: string
          house_slug: string
          id?: string
          losses?: number
          points?: number
          updated_at?: string
          wins?: number
        }
        Update: {
          created_at?: string
          draws?: number
          house_name?: string
          house_slug?: string
          id?: string
          losses?: number
          points?: number
          updated_at?: string
          wins?: number
        }
        Relationships: []
      }
      houses: {
        Row: {
          id: string
          slug: string
          name: string
          color: string
          description: string
          profile_image_url: string | null
          instagram_url: string | null
          members_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          color: string
          description: string
          profile_image_url?: string | null
          instagram_url?: string | null
          members_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          color?: string
          description?: string
          profile_image_url?: string | null
          instagram_url?: string | null
          members_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      house_media: {
        Row: {
          id: string
          house: string
          media_type: string
          platform: string | null
          original_url: string | null
          embed_url: string | null
          image_url: string | null
          thumbnail_url: string | null
          description: string | null
          poll_id: string | null
          is_pinned: boolean
          created_at: string
        }
        Insert: {
          id?: string
          house: string
          media_type: string
          platform?: string | null
          original_url?: string | null
          embed_url?: string | null
          image_url?: string | null
          thumbnail_url?: string | null
          description?: string | null
          poll_id?: string | null
          is_pinned?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          house?: string
          media_type?: string
          platform?: string | null
          original_url?: string | null
          embed_url?: string | null
          image_url?: string | null
          thumbnail_url?: string | null
          description?: string | null
          poll_id?: string | null
          is_pinned?: boolean
          created_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          actor_user_id: string | null
          actor_email: string | null
          action: string
          entity_type: string
          entity_id: string | null
          house_name: string | null
          old_data: Json | null
          new_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_user_id?: string | null
          actor_email?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          house_name?: string | null
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_user_id?: string | null
          actor_email?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          house_name?: string | null
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      sports_settings: {
        Row: {
          id: string
          sports_reveal_on: boolean
          sports_reveal_started_at: string | null
          overall_reveal_on: boolean
          overall_reveal_started_at: string | null
          celebration_window_hours: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sports_reveal_on?: boolean
          sports_reveal_started_at?: string | null
          overall_reveal_on?: boolean
          overall_reveal_started_at?: string | null
          celebration_window_hours?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sports_reveal_on?: boolean
          sports_reveal_started_at?: string | null
          overall_reveal_on?: boolean
          overall_reveal_started_at?: string | null
          celebration_window_hours?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      arena_matches: {
        Row: {
          id: string
          sport: string
          match_title: string
          house_a_key: string
          house_b_key: string
          organizer_house_key: string
          status: 'UPCOMING' | 'LIVE' | 'COMPLETED'
          result_type: 'WIN' | 'DRAW' | 'NO_RESULT' | null
          winner_house_key: string | null
          sequence_number: number
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          sport: string
          match_title: string
          house_a_key: string
          house_b_key: string
          organizer_house_key: string
          status?: 'UPCOMING' | 'LIVE' | 'COMPLETED'
          result_type?: 'WIN' | 'DRAW' | 'NO_RESULT' | null
          winner_house_key?: string | null
          sequence_number?: number
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          sport?: string
          match_title?: string
          house_a_key?: string
          house_b_key?: string
          organizer_house_key?: string
          status?: 'UPCOMING' | 'LIVE' | 'COMPLETED'
          result_type?: 'WIN' | 'DRAW' | 'NO_RESULT' | null
          winner_house_key?: string | null
          sequence_number?: number
          created_at?: string
          completed_at?: string | null
        }
        Relationships: []
      }
      common_matches: {
        Row: {
          id: string
          sport: string
          match_title: string
          organizer_house_key: string
          status: 'UPCOMING' | 'LIVE' | 'COMPLETED'
          result_type: 'POSITIONS' | 'DRAW' | 'NO_RESULT' | null
          winner_house_key: string | null
          runner_up_house_key: string | null
          sequence_number: number
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          sport: string
          match_title: string
          organizer_house_key: string
          status?: 'UPCOMING' | 'LIVE' | 'COMPLETED'
          result_type?: 'POSITIONS' | 'DRAW' | 'NO_RESULT' | null
          winner_house_key?: string | null
          runner_up_house_key?: string | null
          sequence_number?: number
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          sport?: string
          match_title?: string
          organizer_house_key?: string
          status?: 'UPCOMING' | 'LIVE' | 'COMPLETED'
          result_type?: 'POSITIONS' | 'DRAW' | 'NO_RESULT' | null
          winner_house_key?: string | null
          runner_up_house_key?: string | null
          sequence_number?: number
          created_at?: string
          completed_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
