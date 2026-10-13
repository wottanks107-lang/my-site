'use client'
import { useActionState, useEffect, useState } from 'react'
import { Pencil, Plus, TrendingUp } from 'lucide-react'
import {
  addGoalTaskAction, deleteGoalAction, deleteGoalTaskAction,
  saveGoalAction, toggleGoalTaskAction,
} from '@/lib/actions/goals'
import { IDLE } from '@/lib/actions/types'
import ActionForm from '@/components/dashboard/ActionForm'
import ConfirmDelete from '@/components/dashboard/ConfirmDelete'
import Modal from '@/components/dashboard/Modal'
import { useToast } from '@/components/dashboard/Toast'
import { CheckboxField, RangeField, SelectField, TextAreaField, TextField } from '@/components/dashboard/Fields'
import type { GoalTask } from '@/lib/types'
import { GOAL_STATUS_LABEL, PRIORITY_LABEL } from '@/lib/types'
import type { GoalWithTasks } from '@/lib/repositories'

const STATUS_OPTIONS = (Object.keys(GOAL_STATUS_LABEL) as (keyof typeof GOAL_STATUS_LABEL)[])
  .map(value => ({ value, label: GOAL_STATUS_LABEL[value] }))
const PRIORITY_OPTIONS = (Object.keys(PRIORITY_LABEL) as (keyof typeof PRIORITY_LABEL)[])
  .map(value => ({ value, label: PRIORITY_LABEL[value] }))

function SubtaskRow({ task }: { task: GoalTask }) {
  return (
    <div className={'subtask' + (task.done ? ' done' : '')}>
      <ActionForm action={toggleGoalTaskAction}>
        <input type="hidden" name="id" value={task.id} />
        <input type="hidden" name="goal_id" value={task.goal_id} />
        <input
          type="checkbox"
          name="done"
          defaultChecked={task.done}
          onChange={event => event.currentTarget.form?.requestSubmit()}
          aria-label={`Отметить подзадачу: ${task.title}`}
        />
      </ActionForm>
      <span style={{ flex: 1 }}>{task.title}</span>
      <ConfirmDelete
        id={task.id}
        action={deleteGoalTaskAction}
        title="Удалить подзадачу?"
        description={task.title}
      />
    </div>
  )
}

function GoalForm({ goal, onClose }: { goal: GoalWithTasks | null; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(saveGoalAction, IDLE)
  const toast = useToast()

  useEffect(() => {
    if (state.ok) {
      toast(goal ? 'Цель обновлена' : 'Цель добавлена')
      onClose()
    } else if (state.error) {
      toast(state.error, 'error')
    }
    // onClose намеренно не в зависимостях: функция пересоздаётся каждый рендер,
    // а эффект должен срабатывать только на смену результата экшена.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <Modal open title={goal ? 'Изменить цель' : 'Новая цель'} onClose={onClose}>
      <form action={formAction} className="form-grid">
        <input type="hidden" name="id" value={goal?.id ?? ''} />

        <TextField name="title" label="Название" defaultValue={goal?.title} required placeholder="Python" />
        <div className="form-cols">
          <TextField name="category" label="Категория" defaultValue={goal?.category} placeholder="Развитие" />
          <TextField name="deadline" label="Дедлайн" type="date" defaultValue={goal?.deadline} />
        </div>

        <TextAreaField name="description" label="Описание" rows={3} defaultValue={goal?.description} />

        <div className="form-cols">
          <TextField name="metric_from" label="Сейчас" defaultValue={goal?.metric_from} placeholder="0 ₽" />
          <TextField name="metric_to" label="Цель" defaultValue={goal?.metric_to} placeholder="50 000 ₽/мес" />
        </div>

        <RangeField name="progress" label="Прогресс" defaultValue={goal?.progress ?? 0}
          hint="Если у цели есть подзадачи, прогресс пересчитывается по ним" />

        <div className="form-cols">
          <SelectField name="status" label="Статус" defaultValue={goal?.status} options={STATUS_OPTIONS} />
          <SelectField name="priority" label="Приоритет" defaultValue={goal?.priority} options={PRIORITY_OPTIONS} />
        </div>

        <CheckboxField name="is_public" label="Показывать на публичном сайте" defaultChecked={goal?.is_public} />

        <div className="modal-foot">
          <button type="button" className="btn ghost sm" onClick={onClose}>Отмена</button>
          <button className="btn fill sm" disabled={pending}>{pending ? 'Сохраняю…' : 'Сохранить'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function GoalsManager({ goals, error }: { goals: GoalWithTasks[]; error: string | null }) {
  const [editing, setEditing] = useState<GoalWithTasks | null>(null)
  const [creating, setCreating] = useState(false)

  const active = goals.filter(goal => goal.status !== 'done')
  const done = goals.filter(goal => goal.status === 'done')
  const average = goals.length
    ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length)
    : 0

  return (
    <>
      <div className="dash-grid" style={{ marginBottom: 26 }}>
        <div className="panel">
          <span className="muted" style={{ fontSize: 13 }}>Активных целей</span>
          <span className="kpi" style={{ marginTop: 8 }}>{active.length}</span>
        </div>
        <div className="panel">
          <span className="muted" style={{ fontSize: 13 }}>Достигнуто</span>
          <span className="kpi" style={{ marginTop: 8 }}>{done.length}</span>
        </div>
        <div className="panel">
          <span className="muted" style={{ fontSize: 13 }}>Средний прогресс</span>
          <span className="kpi" style={{ marginTop: 8 }}>{average}%</span>
        </div>
        <div className="panel" style={{ justifyContent: 'space-between' }}>
          <span className="muted" style={{ fontSize: 13 }}>Новая цель</span>
          <button type="button" className="btn fill sm" style={{ marginTop: 12 }} onClick={() => setCreating(true)}>
            <Plus size={15} aria-hidden /> Добавить
          </button>
        </div>
      </div>

      {!error && goals.length === 0 && (
        <p className="empty">Целей пока нет. Нажми «Добавить» — например, «Доход 0 → 50 000 ₽/мес».</p>
      )}

      <div className="list">
        {goals.map(goal => (
          <article key={goal.id} className="panel accent">
            <div className="panel-top">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="badge gray">{GOAL_STATUS_LABEL[goal.status]}</span>
                {goal.priority === 'high' && <span className="badge">высокий приоритет</span>}
                {goal.category && <span className="muted" style={{ fontSize: 12.5 }}>{goal.category}</span>}
              </div>
              <div className="row-actions">
                <button type="button" className="icon-btn" onClick={() => setEditing(goal)} aria-label="Изменить цель">
                  <Pencil size={15} aria-hidden />
                </button>
                <ConfirmDelete
                  id={goal.id}
                  action={deleteGoalAction}
                  title="Удалить цель?"
                  description={`«${goal.title}» и все её подзадачи будут удалены. Отменить нельзя.`}
                />
              </div>
            </div>

            <h3>{goal.title}</h3>
            {goal.description && <p style={{ marginTop: 10 }}>{goal.description}</p>}

            <div className="progress"><i style={{ width: `${goal.progress}%` }} /></div>
            <div className="progress-row">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={13} aria-hidden />
                {goal.metric_from || goal.metric_to
                  ? `${goal.metric_from ?? '—'} → ${goal.metric_to ?? '—'}`
                  : 'Прогресс'}
              </span>
              <span>{goal.progress}%</span>
            </div>
            {goal.deadline && (
              <span className="muted" style={{ fontSize: 12.5 }}>Дедлайн: {goal.deadline}</span>
            )}

            {goal.goal_tasks.length > 0 && (
              <div className="subtasks">
                {goal.goal_tasks.map(task => <SubtaskRow key={task.id} task={task} />)}
              </div>
            )}

            <ActionForm action={addGoalTaskAction} className="row" style={{ marginTop: 14 }} resetOnSuccess>
              <input type="hidden" name="goal_id" value={goal.id} />
              <input name="title" placeholder="Новая подзадача" required style={{ flex: 1, minWidth: 180 }} />
              <button className="btn sm ghost"><Plus size={14} aria-hidden /> Добавить</button>
            </ActionForm>
          </article>
        ))}
      </div>

      {creating && <GoalForm goal={null} onClose={() => setCreating(false)} />}
      {editing && <GoalForm goal={editing} onClose={() => setEditing(null)} />}
    </>
  )
}
