export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      chat_messages: {
        Row: {
          body: string;
          created_at: string;
          game_id: string;
          id: string;
          sender_color: string | null;
          sender_name: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          game_id: string;
          id?: string;
          sender_color?: string | null;
          sender_name: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          game_id?: string;
          id?: string;
          sender_color?: string | null;
          sender_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      game_moves: {
        Row: {
          color: string;
          created_at: string;
          fen_after: string;
          game_id: string;
          id: string;
          ms_left: number | null;
          ply: number;
          san: string;
          uci: string;
        };
        Insert: {
          color: string;
          created_at?: string;
          fen_after: string;
          game_id: string;
          id?: string;
          ms_left?: number | null;
          ply: number;
          san: string;
          uci: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          fen_after?: string;
          game_id?: string;
          id?: string;
          ms_left?: number | null;
          ply?: number;
          san?: string;
          uci?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_moves_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      game_tokens: {
        Row: {
          color: string;
          created_at: string;
          game_id: string;
          id: string;
          session_id: string;
          token: string;
        };
        Insert: {
          color: string;
          created_at?: string;
          game_id: string;
          id?: string;
          session_id: string;
          token: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          game_id?: string;
          id?: string;
          session_id?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_tokens_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      games: {
        Row: {
          black_ms: number;
          black_name: string | null;
          black_session: string | null;
          code: string;
          created_at: string;
          draw_offer_by: string | null;
          ended_at: string | null;
          fen: string;
          id: string;
          increment: number;
          is_public: boolean;
          last_move_at: string | null;
          minutes: number;
          pgn: string;
          rated: boolean;
          rematch_game_code: string | null;
          rematch_offer_by: string | null;
          result: string | null;
          result_reason: string | null;
          started_at: string | null;
          status: string;
          turn: string;
          updated_at: string;
          white_ms: number;
          white_name: string | null;
          white_session: string | null;
        };
        Insert: {
          black_ms?: number;
          black_name?: string | null;
          black_session?: string | null;
          code: string;
          created_at?: string;
          draw_offer_by?: string | null;
          ended_at?: string | null;
          fen?: string;
          id?: string;
          increment?: number;
          is_public?: boolean;
          last_move_at?: string | null;
          minutes?: number;
          pgn?: string;
          rated?: boolean;
          rematch_game_code?: string | null;
          rematch_offer_by?: string | null;
          result?: string | null;
          result_reason?: string | null;
          started_at?: string | null;
          status?: string;
          turn?: string;
          updated_at?: string;
          white_ms?: number;
          white_name?: string | null;
          white_session?: string | null;
        };
        Update: {
          black_ms?: number;
          black_name?: string | null;
          black_session?: string | null;
          code?: string;
          created_at?: string;
          draw_offer_by?: string | null;
          ended_at?: string | null;
          fen?: string;
          id?: string;
          increment?: number;
          is_public?: boolean;
          last_move_at?: string | null;
          minutes?: number;
          pgn?: string;
          rated?: boolean;
          rematch_game_code?: string | null;
          rematch_offer_by?: string | null;
          result?: string | null;
          result_reason?: string | null;
          started_at?: string | null;
          status?: string;
          turn?: string;
          updated_at?: string;
          white_ms?: number;
          white_name?: string | null;
          white_session?: string | null;
        };
        Relationships: [];
      };
      matchmaking_queue: {
        Row: {
          created_at: string;
          game_id: string | null;
          id: string;
          increment: number;
          minutes: number;
          player_name: string;
          rated: boolean;
          session_id: string;
        };
        Insert: {
          created_at?: string;
          game_id?: string | null;
          id?: string;
          increment: number;
          minutes: number;
          player_name: string;
          rated?: boolean;
          session_id: string;
        };
        Update: {
          created_at?: string;
          game_id?: string | null;
          id?: string;
          increment?: number;
          minutes?: number;
          player_name?: string;
          rated?: boolean;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matchmaking_queue_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      session_stats: {
        Row: {
          draws: number;
          games: number;
          id: string;
          last_active: string;
          losses: number;
          name: string;
          rating: number;
          session_id: string;
          wins: number;
        };
        Insert: {
          draws?: number;
          games?: number;
          id?: string;
          last_active?: string;
          losses?: number;
          name: string;
          rating?: number;
          session_id: string;
          wins?: number;
        };
        Update: {
          draws?: number;
          games?: number;
          id?: string;
          last_active?: string;
          losses?: number;
          name?: string;
          rating?: number;
          session_id?: string;
          wins?: number;
        };
        Relationships: [];
      };
      tournament_games: {
        Row: {
          black_session: string | null;
          created_at: string;
          game_id: string | null;
          id: string;
          result: string | null;
          round: number;
          status: string;
          tournament_id: string;
          white_session: string | null;
        };
        Insert: {
          black_session?: string | null;
          created_at?: string;
          game_id?: string | null;
          id?: string;
          result?: string | null;
          round: number;
          status?: string;
          tournament_id: string;
          white_session?: string | null;
        };
        Update: {
          black_session?: string | null;
          created_at?: string;
          game_id?: string | null;
          id?: string;
          result?: string | null;
          round?: number;
          status?: string;
          tournament_id?: string;
          white_session?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tournament_games_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_games_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
        ];
      };
      tournament_players: {
        Row: {
          id: string;
          name: string;
          seed: number | null;
          session_id: string;
          tournament_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          seed?: number | null;
          session_id: string;
          tournament_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          seed?: number | null;
          session_id?: string;
          tournament_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tournament_players_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
        ];
      };
      tournament_standings: {
        Row: {
          buchholz: number;
          draws: number;
          id: string;
          losses: number;
          name: string;
          points: number;
          session_id: string;
          tournament_id: string;
          wins: number;
        };
        Insert: {
          buchholz?: number;
          draws?: number;
          id?: string;
          losses?: number;
          name: string;
          points?: number;
          session_id: string;
          tournament_id: string;
          wins?: number;
        };
        Update: {
          buchholz?: number;
          draws?: number;
          id?: string;
          losses?: number;
          name?: string;
          points?: number;
          session_id?: string;
          tournament_id?: string;
          wins?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tournament_standings_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
        ];
      };
      tournaments: {
        Row: {
          code: string;
          created_at: string;
          created_by_session: string | null;
          ended_at: string | null;
          id: string;
          increment: number;
          max_players: number;
          minutes: number;
          name: string;
          rounds: number;
          started_at: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by_session?: string | null;
          ended_at?: string | null;
          id?: string;
          increment?: number;
          max_players?: number;
          minutes?: number;
          name: string;
          rounds?: number;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by_session?: string | null;
          ended_at?: string | null;
          id?: string;
          increment?: number;
          max_players?: number;
          minutes?: number;
          name?: string;
          rounds?: number;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cleanup_old_data: { Args: never; Returns: undefined };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
