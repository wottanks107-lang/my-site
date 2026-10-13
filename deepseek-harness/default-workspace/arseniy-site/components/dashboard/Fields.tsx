// Поля форм dashboard. Обычные неконтролируемые элементы: значения читает
// серверный экшен из FormData, поэтому состояние в браузере не нужно.
'use client'
import { useState } from 'react'

type Base = {
  name: string
  label: string
  hint?: string
  required?: boolean
  defaultValue?: string | number | null
}

export function TextField({ name, label, hint, required, defaultValue, placeholder, type = 'text', min, max }: Base & {
  placeholder?: string; type?: string; min?: number; max?: number
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
      />
      {hint && <span className="hint">{hint}</span>}
    </label>
  )
}

export function TextAreaField({ name, label, hint, required, defaultValue, rows = 4, placeholder }: Base & {
  rows?: number; placeholder?: string
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea name={name} rows={rows} defaultValue={defaultValue ?? ''} required={required} placeholder={placeholder} />
      {hint && <span className="hint">{hint}</span>}
    </label>
  )
}

export function SelectField({ name, label, hint, defaultValue, options }: Base & {
  options: { value: string; label: string }[]
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} defaultValue={String(defaultValue ?? options[0]?.value ?? '')}>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {hint && <span className="hint">{hint}</span>}
    </label>
  )
}

/** Ползунок с живым значением. */
export function RangeField({ name, label, hint, defaultValue = 0 }: Base) {
  const [value, setValue] = useState(Number(defaultValue) || 0)
  return (
    <label className="field">
      <span>{label}</span>
      <div className="range-row">
        <input type="range" name={name} min={0} max={100} value={value} onChange={event => setValue(Number(event.target.value))} />
        <output>{value}%</output>
      </div>
      {hint && <span className="hint">{hint}</span>}
    </label>
  )
}

export function CheckboxField({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="check">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span>{label}</span>
    </label>
  )
}
