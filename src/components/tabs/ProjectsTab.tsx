'use client'

import {
  projectStatusLabel,
  projectStatusStyle,
  taskStatusLabel,
  taskStatusStyle,
} from '@/lib/statusConfig'
import { cancelBtnCls, inputCls, labelCls, saveBtnCls } from '@/lib/styles'
import { supabase } from '@/lib/supabase'
import type { Project, ProjectTask } from '@/types'
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import Modal from '../Modal'

interface Props {
  projects: Project[]
  projectTasks: ProjectTask[]
  onRefresh: () => void
}

const emptyProjectForm = {
  name: '',
  description: '',
  status: 'in_progress' as Project['status'],
}

const emptyTaskForm = {
  name: '',
  status: 'planned' as ProjectTask['status'],
}

export default function ProjectsTab({
  projects,
  projectTasks,
  onRefresh,
}: Props) {
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({
    [projects[0]?.id ?? '']: true,
  })
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

  const toggleProject = (id: string) =>
    setOpenProjects((prev) => ({ ...prev, [id]: !prev[id] }))

  const openProjectModal = (type: 'add' | 'edit', project?: Project) => {
    if (type === 'edit' && project) {
      setSelectedProject(project)
      setProjectForm({
        name: project.name,
        description: project.description ?? '',
        status: project.status,
      })
    } else {
      setSelectedProject(null)
      setProjectForm(emptyProjectForm)
    }
    setProjectModal(type)
  }

  const openTaskModal = (
    type: 'add' | 'edit',
    projectId: string,
    task?: ProjectTask
  ) => {
    setSelectedProjectId(projectId)
    if (type === 'edit' && task) {
      setSelectedTask(task)
      setTaskForm({ name: task.name, status: task.status })
    } else {
      setSelectedTask(null)
      setTaskForm(emptyTaskForm)
    }
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
    if (projectModal === 'add') {
      await supabase
        .from('projects')
        .insert({ ...payload, order_index: projects.length })
    } else if (selectedProject) {
      await supabase
        .from('projects')
        .update(payload)
        .eq('id', selectedProject.id)
    }
    setSaving(false)
    closeProjectModal()
    onRefresh()
  }

  const removeProject = async () => {
    if (!selectedProject) return
    await supabase.from('projects').delete().eq('id', selectedProject.id)
    closeProjectModal()
    onRefresh()
  }

  const saveTask = async () => {
    if (!selectedProjectId) return
    setSaving(true)
    const payload = { name: taskForm.name, status: taskForm.status }
    if (taskModal === 'add') {
      const tasks = getTasks(selectedProjectId)
      await supabase
        .from('project_tasks')
        .insert({
          ...payload,
          project_id: selectedProjectId,
          order_index: tasks.length,
        })
    } else if (selectedTask) {
      await supabase
        .from('project_tasks')
        .update(payload)
        .eq('id', selectedTask.id)
    }
    setSaving(false)
    closeTaskModal()
    onRefresh()
  }

  const removeTask = async () => {
    if (!selectedTask) return
    await supabase.from('project_tasks').delete().eq('id', selectedTask.id)
    closeTaskModal()
    onRefresh()
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            프로젝트
          </p>
          <button
            onClick={() => openProjectModal('add')}
            className="text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>

        {projects.map((p) => {
          const tasks = getTasks(p.id)
          const pct = getPct(p.id)
          const isOpen = openProjects[p.id] ?? false
          return (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleProject(p.id)}
                        className="text-gray-400 flex-shrink-0"
                      >
                        {isOpen ? (
                          <ChevronDown size={15} />
                        ) : (
                          <ChevronRight size={15} />
                        )}
                      </button>
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {p.name}
                      </p>
                    </div>
                    {p.description && (
                      <p className="text-xs text-gray-400 mt-0.5 ml-5">
                        {p.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${projectStatusStyle[p.status]}`}
                    >
                      {projectStatusLabel[p.status]}
                    </span>
                    <button
                      onClick={() => openProjectModal('edit', p)}
                      className="text-gray-400 hover:text-indigo-500 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-5">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{pct}%</span>
                  <span className="text-xs text-gray-300">
                    {tasks.filter((t) => t.status === 'completed').length}/
                    {tasks.length}
                  </span>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-gray-100">
                  <div className="flex items-center justify-between px-4 py-2">
                    <p className="text-xs text-gray-400 font-medium">태스크</p>
                    <button
                      onClick={() => openTaskModal('add', p.id)}
                      className="text-indigo-500 hover:text-indigo-700 transition-colors"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                  <div className="flex flex-col">
                    {tasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 px-4 py-2.5 border-t border-gray-50"
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                            t.status === 'completed'
                              ? 'bg-green-400 border-green-400'
                              : t.status === 'in_progress'
                                ? 'bg-indigo-500 border-indigo-500'
                                : 'border-gray-200'
                          }`}
                        >
                          {t.status === 'completed' && (
                            <span className="text-white text-xs">✓</span>
                          )}
                          {t.status === 'in_progress' && (
                            <span className="text-white text-xs">▶</span>
                          )}
                        </div>
                        <p
                          className={`text-sm flex-1 ${
                            t.status === 'completed'
                              ? 'line-through text-gray-300'
                              : t.status === 'in_progress'
                                ? 'text-gray-800 font-medium'
                                : 'text-gray-500'
                          }`}
                        >
                          {t.name}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${taskStatusStyle[t.status]}`}
                          >
                            {taskStatusLabel[t.status]}
                          </span>
                          <button
                            onClick={() => openTaskModal('edit', p.id, t)}
                            className="text-gray-300 hover:text-indigo-500 transition-colors"
                          >
                            <Pencil size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {projectModal && (
        <Modal
          title={projectModal === 'add' ? '프로젝트 추가' : '프로젝트 수정'}
          onClose={closeProjectModal}
        >
          <div className="flex flex-col gap-3">
            <div>
              <label className={labelCls}>프로젝트 이름</label>
              <input
                type="text"
                className={inputCls}
                placeholder="예: Smart Travel Planner"
                value={projectForm.name}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelCls}>설명</label>
              <input
                type="text"
                className={inputCls}
                placeholder="예: Angular 21 · FTL Demo"
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className={labelCls}>상태</label>
              <select
                className={inputCls}
                value={projectForm.status}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    status: e.target.value as Project['status'],
                  })
                }
              >
                <option value="in_progress">진행 중</option>
                <option value="completed">완료</option>
                <option value="planned">예정</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between pt-1">
            {projectModal === 'edit' ? (
              <button
                onClick={removeProject}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <button onClick={closeProjectModal} className={cancelBtnCls}>
                취소
              </button>
              <button
                onClick={saveProject}
                disabled={saving}
                className={saveBtnCls}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {taskModal && (
        <Modal
          title={taskModal === 'add' ? '태스크 추가' : '태스크 수정'}
          onClose={closeTaskModal}
        >
          <div className="flex flex-col gap-3">
            <div>
              <label className={labelCls}>태스크 이름</label>
              <input
                type="text"
                className={inputCls}
                placeholder="예: US5 — 활동 중첩 FormArray"
                value={taskForm.name}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelCls}>상태</label>
              <select
                className={inputCls}
                value={taskForm.status}
                onChange={(e) =>
                  setTaskForm({
                    ...taskForm,
                    status: e.target.value as ProjectTask['status'],
                  })
                }
              >
                <option value="planned">예정</option>
                <option value="in_progress">진행 중</option>
                <option value="completed">완료</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between pt-1">
            {taskModal === 'edit' ? (
              <button
                onClick={removeTask}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <button onClick={closeTaskModal} className={cancelBtnCls}>
                취소
              </button>
              <button
                onClick={saveTask}
                disabled={saving}
                className={saveBtnCls}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
