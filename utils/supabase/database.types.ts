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
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    avatar_url: string | null
                    subscription_plan: 'free' | 'pro' | 'enterprise'
                    subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due'
                    tokens_used: number
                    tokens_limit: number
                    interviews_completed: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    avatar_url?: string | null
                    subscription_plan?: 'free' | 'pro' | 'enterprise'
                    subscription_status?: 'active' | 'inactive' | 'cancelled' | 'past_due'
                    tokens_used?: number
                    tokens_limit?: number
                    interviews_completed?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    subscription_plan?: 'free' | 'pro' | 'enterprise'
                    subscription_status?: 'active' | 'inactive' | 'cancelled' | 'past_due'
                    tokens_used?: number
                    tokens_limit?: number
                    interviews_completed?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            job_details: {
                Row: {
                    id: string
                    user_id: string
                    job_title: string
                    job_description: string
                    skills: Json
                    years_experience: number
                    resume_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    job_title: string
                    job_description: string
                    skills: Json
                    years_experience: number
                    resume_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    job_title?: string
                    job_description?: string
                    skills?: Json
                    years_experience?: number
                    resume_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            interviews: {
                Row: {
                    id: string
                    user_id: string
                    job_detail_id: string
                    level: number
                    status: 'pending' | 'in_progress' | 'completed'
                    score: number | null
                    tokens_used: number
                    completed_at: string | null
                    created_at: string
                    updated_at: string
                    responses: Json | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    job_detail_id: string
                    level: number
                    status?: 'pending' | 'in_progress' | 'completed'
                    score?: number | null
                    tokens_used?: number
                    completed_at?: string | null
                    created_at?: string
                    updated_at?: string
                    responses?: Json | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    job_detail_id?: string
                    level?: number
                    status?: 'pending' | 'in_progress' | 'completed'
                    score?: number | null
                    tokens_used?: number
                    completed_at?: string | null
                    created_at?: string
                    updated_at?: string
                    responses?: Json | null
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
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
