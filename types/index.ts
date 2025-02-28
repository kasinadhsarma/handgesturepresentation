export interface UserProfile {
  id: string
  username: string
  email: string
  name?: string
  avatar?: string
  preferences?: {
    theme?: 'light' | 'dark'
    gestureSpeed?: 'slow' | 'medium' | 'fast'
    defaultAnnotationColor?: string
  }
  stats?: {
    totalPresentations: number
    totalAnnotations: number
    lastActive: string
  }
}

export interface DashboardStats {
  recent_presentations: {
    id: string
    title: string
    last_viewed: string
    total_slides: number
    annotations_count: number
  }[]
  activity_summary: {
    total_presentations: number
    total_slides_viewed: number
    total_annotations: number
    total_gestures_detected: number
    active_days_streak: number
  }
  preferences: UserProfile['preferences']
}

export interface User extends UserProfile {
  created_at: string
  updated_at: string
}

export interface Presentation {
  id: string
  title: string
  slides: Slide[]
}

export interface Slide {
  id: string
  content: string
  annotations: Annotation[]
}

export interface DrawingData {
  points: { x: number; y: number }[]
  color: string
  lineWidth: number
}

export interface TextData {
  text: string
  position: { x: number; y: number }
  fontSize: number
  color: string
}

export interface Annotation {
  type: 'drawing' | 'text'
  data: DrawingData | TextData
}
