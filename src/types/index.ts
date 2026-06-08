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

export interface Setting {
  id: string
  key: string
  value: string
  created_at: string
}

export interface TodayItem {
  id: string
  name: string
  tag: string | null
  completed: boolean
  date: string
  source_type: 'manual' | 'topic' | 'task'
  source_id: string | null
  created_at: string
}
export interface Project {
  id: string
  name: string
  description: string | null
  status: 'in_progress' | 'completed' | 'planned'
  order_index: number
  created_at: string
}

export interface ProjectTask {
  id: string
  project_id: string
  name: string
  status: 'planned' | 'in_progress' | 'completed'
  order_index: number
  created_at: string
}
