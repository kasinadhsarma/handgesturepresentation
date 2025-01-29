export interface User {
  id: string
  username: string
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

export interface Annotation {
  type: 'drawing' | 'text'
  data: any
}

