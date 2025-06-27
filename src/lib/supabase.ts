import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string
          user_id: string
          tavus_conversation_id: string
          status: 'active' | 'ended' | 'error'
          created_at: string
          ended_at: string | null
          metadata: any
          conversation_type: 'video'
        }
        Insert: {
          id?: string
          user_id: string
          tavus_conversation_id: string
          status?: 'active' | 'ended' | 'error'
          created_at?: string
          ended_at?: string | null
          metadata?: any
          conversation_type?: 'video'
        }
        Update: {
          id?: string
          user_id?: string
          tavus_conversation_id?: string
          status?: 'active' | 'ended' | 'error'
          created_at?: string
          ended_at?: string | null
          metadata?: any
          conversation_type?: 'video'
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}