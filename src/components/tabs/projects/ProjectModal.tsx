'use client';

import Modal from '@/components/Modal';
import { cancelBtnCls, inputCls, labelCls, saveBtnCls } from '@/lib/styles';
import type { Project } from '@/types';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ProjectForm {
  name: string;
  description: string;
  status: Project['status'];
}

interface Props {
  mode: 'add' | 'edit';
  form: ProjectForm;
  saving: boolean;
  onChange: (form: ProjectForm) => void;
  onSave: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function ProjectModal({ mode, form, saving, onChange, onSave, onDelete, onClose }: Props) {
  const t = useTranslations('projects');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');

  return (
    <Modal title={mode === 'add' ? t('addProject') : t('editProject')} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div>
          <label className={labelCls}>{t('name')}</label>
          <input
            type="text"
            className={inputCls}
            placeholder={t('namePlaceholder')}
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>{t('description')}</label>
          <input
            type="text"
            className={inputCls}
            placeholder={t('descriptionPlaceholder')}
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>{t('status')}</label>
          <select
            className={inputCls}
            value={form.status}
            onChange={(e) => onChange({ ...form, status: e.target.value as Project['status'] })}
          >
            <option value="in_progress">{tStatus('in_progress')}</option>
            <option value="completed">{tStatus('completed')}</option>
            <option value="planned">{tStatus('planned')}</option>
          </select>
        </div>
      </div>
      <div className="flex justify-between pt-1">
        {mode === 'edit' && onDelete ? (
          <button onClick={onDelete} className="text-red-400 hover:text-red-600 transition-colors">
            <Trash2 size={16} />
          </button>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className={cancelBtnCls}>
            {tCommon('cancel')}
          </button>
          <button onClick={onSave} disabled={saving} className={saveBtnCls}>
            {saving ? tCommon('saving') : tCommon('save')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
