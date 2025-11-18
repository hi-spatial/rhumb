// Base PageProps that all pages inherit
export type PageProps<T = Record<string, unknown>> = {
  auth: {
    user: User | null
  }
  ai_defaults?: {
    has_custom_endpoint?: boolean
  }
  flash: {
    success?: string
    error?: string
    notice?: string
    alert?: string
  }
  errors: Record<string, string>
  locale?: string
  translations?: {
    auth: {
      login: string
      register: string
      logout: string
      email: string
      password: string
      password_confirmation: string
      name: string
      remember_me: string
      forgot_password: string
      already_have_account: string
      dont_have_account: string
      sign_in: string
      sign_up: string
      sign_out: string
    }
    dashboard: {
      title: string
      welcome: string
      admin_panel: string
    }
    common: {
      save: string
      cancel: string
      edit: string
      delete: string
      create: string
      update: string
      back: string
    }
  }
} & T

// User interface
export type AiProvider = 'openai' | 'gemini' | 'custom'

export interface User {
  id: string // UUID
  name: string
  email: string
  role: 'user' | 'admin'
  ai_provider?: AiProvider
  ai_metadata?: Record<string, unknown>
  has_ai_api_key?: boolean
  requires_personal_key?: boolean
}

// Analysis types
export type AnalysisType = 'heat_island' | 'land_cover' | 'land_cover_change' | 'air_pollution'
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type MessageRole = 'user' | 'assistant' | 'system'

export interface AnalysisSession {
  id: string
  ai_provider: AiProvider
  analysis_type: AnalysisType
  status: AnalysisStatus
  area_of_interest: GeoJSON.Geometry | GeoJSON.Feature | GeoJSON.FeatureCollection
  metadata: Record<string, unknown>
  provider_metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AnalysisMessage {
  id: string
  role: MessageRole
  content: string
  payload: Record<string, unknown>
  created_at: string
}

export interface DashboardStats {
  total_sessions: number
  active_sessions: number
  completed_sessions: number
  last_used_at?: string | null
}

export interface DashboardSessionSummary {
  id: string
  analysis_type: AnalysisType
  ai_provider: AiProvider
  status: AnalysisStatus
  created_at: string
}

export interface AiProviderSummary {
  provider: AiProvider
  requires_personal_key: boolean
  has_personal_key: boolean
}

// GeoJSON types (basic)
export interface GeoJSONGeometry {
  type: string
  coordinates: number[] | number[][] | number[][][]
}

export interface GeoJSONFeature {
  type: 'Feature'
  geometry: GeoJSONGeometry
  properties?: Record<string, unknown>
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}