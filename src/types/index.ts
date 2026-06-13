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
  tags: string[]
  roadmap_id: string | null
  stage_level: number | null
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

export interface StudyForm {
  title: string
  date: string
  duration_minutes: string
  tags: string
  til: string
}

export interface Note {
  id: string
  title: string
  content: string
  mood: string | null
  created_at: string
  updated_at: string
}

// AI 로드맵
export interface RoadmapSkill {
  name: string
  description: string
  tags: string[]
}

export interface RoadmapStage {
  level: number
  title: string
  description: string
  skills: RoadmapSkill[]
}

export interface AiRoadmap {
  id: string
  goal: string
  career_level: string
  stages: RoadmapStage[]
  adopted: boolean
  created_at: string
}

// 프로젝트 실전 스킬
export interface ProjectSkill {
  id: string
  project_id: string
  tags: string[]
  created_at: string
}

// 자격증
export interface Certification {
  id: string
  name: string
  issuer: string | null
  tags: string[]
  issued_at: string | null
  created_at: string
}
