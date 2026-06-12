'use client'

import ProjectsTab from '@/components/tabs/ProjectsTab'
import { useProjectTasks, useProjects } from '@/lib/queries'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ProjectsPage() {
  const queryClient = useQueryClient()
  const { data: projects = [] } = useProjects()
  const { data: projectTasks = [] } = useProjectTasks()
  const [triggerAdd, setTriggerAdd] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

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
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}
        triggerAdd={triggerAdd}
        onTriggerAddDone={() => setTriggerAdd(false)}
      />
    </main>
  )
}
