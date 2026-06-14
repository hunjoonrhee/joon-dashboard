export const goalStatusStyle = {
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  planned: 'bg-gray-100 text-gray-500',
} as const;

export const goalStatusLabel = {
  in_progress: '진행 중',
  completed: '완료',
  planned: '예정',
} as const;

export const priorityStyle = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-gray-100 text-gray-500',
} as const;

export const priorityLabel = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
} as const;

export const projectStatusStyle = {
  in_progress: 'bg-indigo-50 text-indigo-600',
  completed: 'bg-green-50 text-green-600',
  planned: 'bg-gray-100 text-gray-500',
} as const;

export const projectStatusLabel = {
  in_progress: '진행 중',
  completed: '완료',
  planned: '예정',
} as const;

export const taskStatusStyle = {
  completed: 'bg-green-50 text-green-600',
  in_progress: 'bg-indigo-50 text-indigo-600',
  planned: 'bg-gray-100 text-gray-400',
} as const;

export const taskStatusLabel = {
  completed: '완료',
  in_progress: '진행 중',
  planned: '예정',
} as const;
