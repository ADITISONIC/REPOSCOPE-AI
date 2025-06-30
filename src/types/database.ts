export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          username: string
          email: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          username: string
          email: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          email?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      analysis_memories: {
        Row: {
          id: string
          user_id: string
          repo_url: string
          repo_name: string
          repo_owner: string
          description: string | null
          analyzed_at: string
          last_accessed_at: string
          is_favorite: boolean
          tech_stack: string[]
          tech_stack_detailed: any
          structure: any
          analysis: any
          architecture_diagram: any | null
          tags: string[]
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          repo_url: string
          repo_name: string
          repo_owner: string
          description?: string | null
          analyzed_at?: string
          last_accessed_at?: string
          is_favorite?: boolean
          tech_stack: string[]
          tech_stack_detailed: any
          structure: any
          analysis: any
          architecture_diagram?: any | null
          tags?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          repo_url?: string
          repo_name?: string
          repo_owner?: string
          description?: string | null
          analyzed_at?: string
          last_accessed_at?: string
          is_favorite?: boolean
          tech_stack?: string[]
          tech_stack_detailed?: any
          structure?: any
          analysis?: any
          architecture_diagram?: any | null
          tags?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          memory_id: string
          user_id: string
          type: 'question' | 'file_analysis' | 'test_generation' | 'architecture'
          question: string
          answer: string
          context: any | null
          created_at: string
        }
        Insert: {
          id?: string
          memory_id: string
          user_id: string
          type: 'question' | 'file_analysis' | 'test_generation' | 'architecture'
          question: string
          answer: string
          context?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          memory_id?: string
          user_id?: string
          type?: 'question' | 'file_analysis' | 'test_generation' | 'architecture'
          question?: string
          answer?: string
          context?: any | null
          created_at?: string
        }
      }
      test_artifacts: {
        Row: {
          id: string
          memory_id: string
          user_id: string
          file_name: string
          function_name: string
          test_framework: string
          test_cases: string
          created_at: string
        }
        Insert: {
          id?: string
          memory_id: string
          user_id: string
          file_name: string
          function_name: string
          test_framework: string
          test_cases: string
          created_at?: string
        }
        Update: {
          id?: string
          memory_id?: string
          user_id?: string
          file_name?: string
          function_name?: string
          test_framework?: string
          test_cases?: string
          created_at?: string
        }
      }
      documentation_artifacts: {
        Row: {
          id: string
          memory_id: string
          user_id: string
          type: 'readme' | 'onboarding' | 'api'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          memory_id: string
          user_id: string
          type: 'readme' | 'onboarding' | 'api'
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          memory_id?: string
          user_id?: string
          type?: 'readme' | 'onboarding' | 'api'
          content?: string
          created_at?: string
        }
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
  }
}