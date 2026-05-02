export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      books: {
        Row: {
          id: string
          user_id: string
          title: string
          author: string
          year: number
          cover_image: string | null
          description: string | null
          region: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          author: string
          year: number
          cover_image?: string | null
          description?: string | null
          region: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          author?: string
          year?: number
          cover_image?: string | null
          description?: string | null
          region?: string
          created_at?: string
          updated_at?: string
        }
      }
      book_notes: {
        Row: {
          id: string
          user_id: string
          book_id: string
          title: string
          content: string
          page_number: number | null
          chapter: string | null
          quote: string | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          title: string
          content: string
          page_number?: number | null
          chapter?: string | null
          quote?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          title?: string
          content?: string
          page_number?: number | null
          chapter?: string | null
          quote?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          description?: string | null
          created_at?: string
        }
      }
      book_relations: {
        Row: {
          id: string
          user_id: string
          source_book_id: string
          target_book_id: string
          relation_type: 'influences' | 'continues' | 'contrasts' | 'references' | 'inspired_by' | 'custom'
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          source_book_id: string
          target_book_id: string
          relation_type: 'influences' | 'continues' | 'contrasts' | 'references' | 'inspired_by' | 'custom'
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          source_book_id?: string
          target_book_id?: string
          relation_type?: 'influences' | 'continues' | 'contrasts' | 'references' | 'inspired_by' | 'custom'
          description?: string | null
          created_at?: string
        }
      }
      timeline_events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          year: number
          month: number | null
          day: number | null
          regions: string[]
          related_book_ids: string[]
          related_note_ids: string[]
          importance: 'low' | 'medium' | 'high'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          year: number
          month?: number | null
          day?: number | null
          regions?: string[]
          related_book_ids?: string[]
          related_note_ids?: string[]
          importance: 'low' | 'medium' | 'high'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          year?: number
          month?: number | null
          day?: number | null
          regions?: string[]
          related_book_ids?: string[]
          related_note_ids?: string[]
          importance?: 'low' | 'medium' | 'high'
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
