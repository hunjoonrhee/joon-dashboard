export interface Session {
  id: string
  date: string
  title: string
  category: string
  duration_minutes: number | null
  notes: string | null
  til: string | null
  tags: string[]
  created_at: string
}

export interface Topic {
  id: string
  category: string
  name: string
  completed: boolean
  goal_id: string | null
  created_at: string
}

export interface Goal {
  id: string
  name: string
  description: string | null
  status: 'in_progress' | 'completed' | 'planned'
  is_focus: boolean
  priority: 'urgent' | 'high' | 'medium' | 'low'
  created_at: string
}

export interface StudyItem {
  id: string
  session_id: string
  keyword: string
  created_at: string
}
