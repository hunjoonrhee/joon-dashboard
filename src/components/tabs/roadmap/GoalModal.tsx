'use client'

import Modal from '@/components/Modal'
import { cancelBtnCls, inputCls, labelCls, saveBtnCls } from '@/lib/styles'
import type { Goal } from '@/types'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface GoalForm {
  name: string
  description: string
  status: Goal['status']
  priority: Goal['priority']
  is_focus: boolean
}

interface Props {
  mode: 'add' | 'edit'
  form: GoalForm
  saving: boolean
  onChange: (form: GoalForm) => void
  onSave: () => void
  onDelete?: () => void
  onClose: () => void
}

export default function GoalModal({ mode, form, saving, onChange, onSave, onDelete, onClose }: Props) {
  const t = useTranslations('goals')
  const tCommon = useTranslations('common')
  const tStatus = useTranslations('status')
  const tPriority = useTranslations('priority')

  return (
    <Modal title={mode === 'add' ? t('addModal') : t('editModal')} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div>
          <label className={labelCls}>{t('name')}</label>
          <input type="text" className={inputCls} placeholder="예: Angular Level 3" value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>{t('description')}</label>
          <input type="text" className={inputCls} placeholder="예: 6월 재시험" value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className={labelCls}>{t('priority')}</label>
            <select className={inputCls} value={form.priority} onChange={(e) => onChange({ ...form, priority: e.target.value as Goal['priority'] })}>
              <option value="urgent">{tPriority('urgent')}</option>
              <option value="high">{tPriority('high')}</option>
              <option value="medium">{tPriority('medium')}</option>
              <option value="low">{tPriority('low')}</option>
            </select>
          </div>
          <div className="flex-1">
            <label className={labelCls}>{t('status')}</label>
            <select className={inputCls} value={form.status} onChange={(e) => onChange({ ...form, status: e.target.value as Goal['status'] })}>
              <option value="in_progress">{tStatus('in_progress')}</option>
              <option value="completed">{tStatus('completed')}</option>
              <option value="planned">{tStatus('planned')}</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_focus" checked={form.is_focus} onChange={(e) => onChange({ ...form, is_focus: e.target.checked })} />
          <label htmlFor="is_focus" className="text-sm text-gray-600">{t('focus')}</label>
        </div>
      </div>
      <div className="flex justify-between pt-1">
        {mode === 'edit' && onDelete
          ? <button onClick={onDelete} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
          : <div />
        }
        <div className="flex gap-2">
          <button onClick={onClose} className={cancelBtnCls}>{tCommon('cancel')}</button>
          <button onClick={onSave} disabled={saving} className={saveBtnCls}>{saving ? tCommon('saving') : tCommon('save')}</button>
        </div>
      </div>
    </Modal>
  )
}
