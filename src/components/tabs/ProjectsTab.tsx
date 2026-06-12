'use client'

import { useToast } from '@/components/Toast'
import { supabase } from '@/lib/supabase'
import type { Project, ProjectTask } from '@/types'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import ProjectItem from './projects/ProjectItem'
import ProjectModal from './projects/ProjectModal'
import TaskModal from './projects/TaskModal'
import ProjectSkillModal from './projects/ProjectSkillModal'

interface Props {
  projects: Project[]
  projectTasks: ProjectTask[]
  onRefresh: () => void
  triggerAdd?: boolean
  onTriggerAddDone?: () => void
}

const emptyProjectForm = {
  name: '',
  description: '',
  status: 'in_progress' as Project['status'],
}
const emptyTaskForm = { name: '', status: 'planned' as ProjectTask['status'] }

export default function ProjectsTab({
  projects,
  projectTasks,
  onRefresh,
  triggerAdd,
  onTriggerAddDone,
}: Props) {
  const t = useTranslations('projects')
  const tToast = useTranslations('toast')
  const { show } = useToast()

  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>(
    Object.fromEntries(
      projects
        .filter((p) => p.status === 'in_progress')
        .map((p) => [p.id, true])
    )
  )
  const [projectModal, setProjectModal] = useState<'add' | 'edit' | null>(null)
  const [taskModal, setTaskModal] = useState<'add' | 'edit' | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  )
  const [projectForm, setProjectForm] = useState(emptyProjectForm)
  const [taskForm, setTaskForm] = useState(emptyTaskForm)
  const [saving, setSaving] = useState(false)
  const [skillModal, setSkillModal] = useState<{
    projectId: string
    projectName: string
  } | null>(null)

  useEffect(() => {
    if (triggerAdd) {
      openProjectModal('add')
      onTriggerAddDone?.()
    }
  }, [triggerAdd])

  const getTasks = (projectId: string) =>
    projectTasks.filter((t) => t.project_id === projectId)
  const getPct = (projectId: string) => {
    const tasks = getTasks(projectId)
    if (tasks.length === 0) return 0
    return Math.round(
      (tasks.filter((t) => t.status === 'completed').length / tasks.length) *
        100
    )
  }

  const openProjectModal = (type: 'add' | 'edit', project?: Project) => {
    setSelectedProject(project ?? null)
    setProjectForm(
      project
        ? {
            name: project.name,
            description: project.description ?? '',
            status: project.status,
          }
        : emptyProjectForm
    )
    setProjectModal(type)
  }

  const openTaskModal = (
    type: 'add' | 'edit',
    projectId: string,
    task?: ProjectTask
  ) => {
    setSelectedProjectId(projectId)
    setSelectedTask(task ?? null)
    setTaskForm(task ? { name: task.name, status: task.status } : emptyTaskForm)
    setTaskModal(type)
  }

  const closeProjectModal = () => {
    setProjectModal(null)
    setSelectedProject(null)
    setProjectForm(emptyProjectForm)
  }
  const closeTaskModal = () => {
    setTaskModal(null)
    setSelectedTask(null)
    setSelectedProjectId(null)
    setTaskForm(emptyTaskForm)
  }

  const saveProject = async () => {
    setSaving(true)
    const payload = {
      name: projectForm.name,
      description: projectForm.description || null,
      status: projectForm.status,
    }
    try {
      if (projectModal === 'add') {
        await supabase
          .from('projects')
          .insert({ ...payload, order_index: projects.length })
        show(tToast('projectAdded'), { type: 'success' })
      } else if (selectedProject) {
        await supabase
          .from('projects')
          .update(payload)
          .eq('id', selectedProject.id)
        show(tToast('projectEdited'), { type: 'success' })
        // 완료로 바뀌면 스킬 태깅 모달 트리거
        if (
          payload.status === 'completed' &&
          selectedProject.status !== 'completed'
        ) {
          closeProjectModal()
          onRefresh()
          setSkillModal({
            projectId: selectedProject.id,
            projectName: selectedProject.name,
          })
          setSaving(false)
          return
        }
      }
      closeProjectModal()
      onRefresh()
    } catch {
      show(tToast('saveFailed'), { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const removeProject = async () => {
    if (!selectedProject) return
    try {
      await supabase.from('projects').delete().eq('id', selectedProject.id)
      show(tToast('projectDeleted'), { type: 'info' })
      closeProjectModal()
      onRefresh()
    } catch {
      show(tToast('deleteFailed'), { type: 'error' })
    }
  }

  const saveTask = async () => {
    if (!selectedProjectId) return
    setSaving(true)
    const payload = { name: taskForm.name, status: taskForm.status }
    try {
      if (taskModal === 'add') {
        await supabase.from('project_tasks').insert({
          ...payload,
          project_id: selectedProjectId,
          order_index: getTasks(selectedProjectId).length,
        })
        show(tToast('taskAdded'), { type: 'success' })
      } else if (selectedTask) {
        await supabase
          .from('project_tasks')
          .update(payload)
          .eq('id', selectedTask.id)
        show(tToast('taskEdited'), { type: 'success' })
      }
      closeTaskModal()
      onRefresh()
    } catch {
      show(tToast('saveFailed'), { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const removeTask = async () => {
    if (!selectedTask) return
    try {
      await supabase.from('project_tasks').delete().eq('id', selectedTask.id)
      show(tToast('taskDeleted'), { type: 'info' })
      closeTaskModal()
      onRefresh()
    } catch {
      show(tToast('deleteFailed'), { type: 'error' })
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {t('title')}
          </p>
          <button
            onClick={() => openProjectModal('add')}
            className="text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
        {projects.map((p) => (
          <ProjectItem
            key={p.id}
            project={p}
            tasks={getTasks(p.id)}
            isOpen={openProjects[p.id] ?? false}
            pct={getPct(p.id)}
            onToggle={() =>
              setOpenProjects((prev) => ({ ...prev, [p.id]: !prev[p.id] }))
            }
            onEditProject={() => openProjectModal('edit', p)}
            onAddTask={() => openTaskModal('add', p.id)}
            onEditTask={(task) => openTaskModal('edit', p.id, task)}
          />
        ))}
      </div>

      {projectModal && (
        <ProjectModal
          mode={projectModal}
          form={projectForm}
          saving={saving}
          onChange={setProjectForm}
          onSave={saveProject}
          onDelete={projectModal === 'edit' ? removeProject : undefined}
          onClose={closeProjectModal}
        />
      )}
      {taskModal && (
        <TaskModal
          mode={taskModal}
          form={taskForm}
          saving={saving}
          onChange={setTaskForm}
          onSave={saveTask}
          onDelete={taskModal === 'edit' ? removeTask : undefined}
          onClose={closeTaskModal}
        />
      )}
      {skillModal && (
        <ProjectSkillModal
          projectId={skillModal.projectId}
          projectName={skillModal.projectName}
          onClose={() => setSkillModal(null)}
          onSaved={() => {
            setSkillModal(null)
            onRefresh()
          }}
        />
      )}
    </>
  )
}
