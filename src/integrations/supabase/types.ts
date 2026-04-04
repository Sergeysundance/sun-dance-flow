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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          class_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "schedule_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          active: boolean
          address: string
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          address?: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          address?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      directions: {
        Row: {
          active: boolean
          branch_id: string | null
          color: string
          created_at: string
          description: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          branch_id?: string | null
          color?: string
          created_at?: string
          description?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          branch_id?: string | null
          color?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "directions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      faq: {
        Row: {
          active: boolean
          answer: string
          created_at: string
          id: string
          question: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          answer?: string
          created_at?: string
          id?: string
          question: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          answer?: string
          created_at?: string
          id?: string
          question?: string
          sort_order?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pending_teacher_registrations: {
        Row: {
          bio: string
          created_at: string
          direction_ids: string[]
          email: string
          first_name: string
          id: string
          last_name: string
          middle_name: string
          phone: string
          user_id: string
        }
        Insert: {
          bio?: string
          created_at?: string
          direction_ids?: string[]
          email?: string
          first_name: string
          id?: string
          last_name?: string
          middle_name?: string
          phone?: string
          user_id: string
        }
        Update: {
          bio?: string
          created_at?: string
          direction_ids?: string[]
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          middle_name?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string | null
          bonus_points: number
          created_at: string
          discount_percent: number
          first_name: string
          id: string
          last_name: string
          middle_name: string
          notes: string | null
          phone: string
          preferred_directions: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          bonus_points?: number
          created_at?: string
          discount_percent?: number
          first_name?: string
          id?: string
          last_name?: string
          middle_name?: string
          notes?: string | null
          phone?: string
          preferred_directions?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          bonus_points?: number
          created_at?: string
          discount_percent?: number
          first_name?: string
          id?: string
          last_name?: string
          middle_name?: string
          notes?: string | null
          phone?: string
          preferred_directions?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          active: boolean
          area: number
          branch_id: string | null
          capacity: number
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          area?: number
          branch_id?: string | null
          capacity?: number
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          area?: number
          branch_id?: string | null
          capacity?: number
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_classes: {
        Row: {
          branch_id: string | null
          cancelled: boolean
          created_at: string
          date: string
          direction_id: string
          end_time: string
          id: string
          max_spots: number
          room_id: string
          start_time: string
          teacher_id: string
        }
        Insert: {
          branch_id?: string | null
          cancelled?: boolean
          created_at?: string
          date: string
          direction_id: string
          end_time: string
          id?: string
          max_spots?: number
          room_id: string
          start_time: string
          teacher_id: string
        }
        Update: {
          branch_id?: string | null
          cancelled?: boolean
          created_at?: string
          date?: string
          direction_id?: string
          end_time?: string
          id?: string
          max_spots?: number
          room_id?: string
          start_time?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_classes_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_classes_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_classes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_deductions: {
        Row: {
          booking_id: string
          created_at: string
          deducted_at: string
          hours_deducted: number
          id: string
          user_subscription_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          deducted_at?: string
          hours_deducted?: number
          id?: string
          user_subscription_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          deducted_at?: string
          hours_deducted?: number
          id?: string
          user_subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_deductions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_deductions_user_subscription_id_fkey"
            columns: ["user_subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_types: {
        Row: {
          active: boolean
          class_duration: number
          created_at: string
          description: string
          duration_days: number
          hours_count: number | null
          id: string
          name: string
          old_price: number | null
          price: number
          type: string
        }
        Insert: {
          active?: boolean
          class_duration?: number
          created_at?: string
          description?: string
          duration_days?: number
          hours_count?: number | null
          id?: string
          name: string
          old_price?: number | null
          price?: number
          type?: string
        }
        Update: {
          active?: boolean
          class_duration?: number
          created_at?: string
          description?: string
          duration_days?: number
          hours_count?: number | null
          id?: string
          name?: string
          old_price?: number | null
          price?: number
          type?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          active: boolean
          bio: string
          branch_ids: string[]
          created_at: string
          direction_ids: string[]
          discount_percent: number
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string
          photo_url: string
          telegram_id: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          bio?: string
          branch_ids?: string[]
          created_at?: string
          direction_ids?: string[]
          discount_percent?: number
          email?: string
          first_name: string
          id?: string
          last_name?: string
          phone?: string
          photo_url?: string
          telegram_id?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          bio?: string
          branch_ids?: string[]
          created_at?: string
          direction_ids?: string[]
          discount_percent?: number
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string
          photo_url?: string
          telegram_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      trial_requests: {
        Row: {
          branch_id: string | null
          comment: string | null
          created_at: string
          direction_id: string | null
          id: string
          name: string
          payment_id: string | null
          phone: string
          status: string
          user_id: string | null
        }
        Insert: {
          branch_id?: string | null
          comment?: string | null
          created_at?: string
          direction_id?: string | null
          id?: string
          name: string
          payment_id?: string | null
          phone: string
          status?: string
          user_id?: string | null
        }
        Update: {
          branch_id?: string | null
          comment?: string | null
          created_at?: string
          direction_id?: string | null
          id?: string
          name?: string
          payment_id?: string | null
          phone?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_requests_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_requests_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          active: boolean
          created_at: string
          expires_at: string
          hours_remaining: number
          hours_total: number
          id: string
          purchased_at: string
          subscription_type_id: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          expires_at: string
          hours_remaining: number
          hours_total: number
          id?: string
          purchased_at?: string
          subscription_type_id: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          expires_at?: string
          hours_remaining?: number
          hours_total?: number
          id?: string
          purchased_at?: string
          subscription_type_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_subscription_type_id_fkey"
            columns: ["subscription_type_id"]
            isOneToOne: false
            referencedRelation: "subscription_types"
            referencedColumns: ["id"]
          },
        ]
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
