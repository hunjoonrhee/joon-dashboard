'use client'

import ProjectsTab from '@/components/tabs/ProjectsTab'
import { supabase } from '@/lib/supabase'
import type { Project, ProjectTask } from '@/types'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [triggerAdd, setTriggerAdd] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    Promise.all([
      supabase.from('projects').select('*').order('order_index'),
      supabase.from('project_tasks').select('*').order('order_index'),
    ]).then(([p, pt]) => {
      if (p.data) setProjects(p.data)
      if (pt.data) setProjectTasks(pt.data)
    })
  }, [refreshKey])

  // 헤더 버튼 → ?add=true 쿼리 감지
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setTriggerAdd(true)
      router.replace(window.location.pathname)
    }
  }, [searchParams, router])

  return (
    <main className="mx-auto px-4 py-4">
      <ProjectsTab
        projects={projects}
        projectTasks={projectTasks}
        onRefresh={() => setRefreshKey((k) => k + 1)}
        triggerAdd={triggerAdd}
        onTriggerAddDone={() => setTriggerAdd(false)}
      />
    </main>
  )
}
