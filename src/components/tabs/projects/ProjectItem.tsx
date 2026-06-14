'use client';

import { projectStatusStyle, taskStatusStyle } from '@/lib/statusConfig';
import type { Project, ProjectTask } from '@/types';
import { ChevronDown, ChevronRight, Pencil, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
  project: Project;
  tasks: ProjectTask[];
  isOpen: boolean;
  pct: number;
  onToggle: () => void;
  onEditProject: () => void;
  onAddTask: () => void;
  onEditTask: (task: ProjectTask) => void;
}

export default function ProjectItem({
  project,
  tasks,
  isOpen,
  pct,
  onToggle,
  onEditProject,
  onAddTask,
  onEditTask,
}: Props) {
  const t = useTranslations('projects');
  const tStatus = useTranslations('status');

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <button
                onClick={onToggle}
                className="text-gray-400 flex-shrink-0"
              >
                {isOpen ? (
                  <ChevronDown size={15} />
                ) : (
                  <ChevronRight size={15} />
                )}
              </button>
              <p className="text-sm font-semibold text-gray-800 truncate">
                {project.name}
              </p>
            </div>
            {project.description && (
              <p className="text-xs text-gray-400 mt-0.5 ml-5">
                {project.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${projectStatusStyle[project.status]}`}
            >
              {tStatus(project.status)}
            </span>
            <button
              onClick={onEditProject}
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
            <p className="text-xs text-gray-400 font-medium">{t('tasks')}</p>
            <button
              onClick={onAddTask}
              className="text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              <Plus size={15} />
            </button>
          </div>
          <div className="flex flex-col">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-4 py-2.5 border-t border-gray-50"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                    task.status === 'completed'
                      ? 'bg-green-400 border-green-400'
                      : task.status === 'in_progress'
                        ? 'bg-indigo-500 border-indigo-500'
                        : 'border-gray-200'
                  }`}
                >
                  {task.status === 'completed' && (
                    <span className="text-white text-xs">✓</span>
                  )}
                  {task.status === 'in_progress' && (
                    <span className="text-white text-xs">▶</span>
                  )}
                </div>
                <p
                  className={`text-sm flex-1 ${
                    task.status === 'completed'
                      ? 'line-through text-gray-300'
                      : task.status === 'in_progress'
                        ? 'text-gray-800 font-medium'
                        : 'text-gray-500'
                  }`}
                >
                  {task.name}
                </p>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${taskStatusStyle[task.status]}`}
                  >
                    {tStatus(task.status)}
                  </span>
                  <button
                    onClick={() => onEditTask(task)}
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
  );
}
