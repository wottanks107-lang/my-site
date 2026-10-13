'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Field, Finance, KEYS, Key, Rows, SCHEMA, isOpts, uid, useCol, useSaveStatus,
} from '@/lib/store'

/** Как показать значение поля человеку (коды статусов превращаем в подписи). */
const show = (f: Field, v: unknown) => (isOpts(f.t) ? (f.labels?.[String(v)] ?? v) : v)

function Crud({ k }: { k: Key }) {
  const sc = SCHEMA[k]
  const [rows, set] = useCol<Rows>(k)
  const [ed, setEd] = useState<Rows | null>(null)

  const blank = (): Rows => ({
    id: '',
    ...Object.fromEntries(sc.fields.map(f => [f.n, isOpts(f.t) ? f.t[0] : f.t === 'number' ? 0 : ''])),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ed) return
    set(ed.id ? rows.map(r => (r.id === ed.id ? ed : r)) : [...rows, { ...ed, id: uid() }])
    setEd(null)
  }

  const move = (i: number, d: number) => {
    const next = [...rows]
    const j = i + d
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    set(next)
  }

  return <div>
    <div className="row">
      <button className="btn fill" onClick={() => setEd(blank())}>+ Добавить запись</button>
      {ed && <span className="meta" style={{ alignSelf: 'center' }}>{ed.id ? 'Редактирование записи' : 'Новая запись'}</span>}
    </div>

    {ed && <form onSubmit={submit}>
      {sc.fields.map(f => <label key={f.n}>{f.l}
        {f.t === 'area'
          ? <textarea rows={3} value={String(ed[f.n] ?? '')} onChange={e => setEd({ ...ed, [f.n]: e.target.value })} />
          : isOpts(f.t)
            ? <select value={String(ed[f.n] ?? f.t[0])} onChange={e => setEd({ ...ed, [f.n]: e.target.value })}>
                {f.t.map(o => <option key={o} value={o}>{f.labels?.[o] ?? o}</option>)}
              </select>
            : f.t === 'number' && f.max === 100
              ? <div>
                  <input type="range" min={0} max={100} value={Number(ed[f.n]) || 0}
                    onChange={e => setEd({ ...ed, [f.n]: Number(e.target.value) })} />
                  <span className="meta">{Number(ed[f.n]) || 0}%</span>
                </div>
              : <input type={f.t} value={String(ed[f.n] ?? '')} required
                  onChange={e => setEd({ ...ed, [f.n]: f.t === 'number' ? Number(e.target.value) : e.target.value })} />}
        {f.hint && <span className="meta" style={{ fontSize: 12 }}>{f.hint}</span>}
      </label>)}
      <div className="row">
        <button className="btn fill">Сохранить</button>
        <button type="button" className="btn" onClick={() => setEd(null)}>Отмена</button>
      </div>
    </form>}

    <div className="wrap"><table><tbody>
      {rows.map((r, i) => <tr key={r.id}>
        <td>{sc.fields.map(f => show(f, r[f.n])).filter(v => v !== '' && v !== undefined && v !== null).join(' · ').slice(0, 160)}</td>
        <td style={{ whiteSpace: 'nowrap' }}>
          <button className="x" title="Поднять выше" onClick={() => move(i, -1)}>↑</button>
          <button className="x" title="Опустить ниже" onClick={() => move(i, 1)}>↓</button>
          <button className="x" onClick={() => setEd(r)}>Изменить</button>
          <button className="x" onClick={() => confirm('Удалить запись?') && set(rows.filter(x => x.id !== r.id))}>Удалить</button>
        </td></tr>)}
      {rows.length === 0 && <tr><td>Пока пусто.</td></tr>}
    </tbody></table></div>

    {k === 'finance' && <FinSummary rows={rows as unknown as Finance[]} />}
  </div>
}

function FinSummary({ rows }: { rows: Finance[] }) {
  const I = rows.reduce((a, x) => a + Number(x.income || 0), 0)
  const X = rows.reduce((a, x) => a + Number(x.expense || 0), 0)
  const S = rows.reduce((a, x) => a + Number(x.sales || 0), 0)
  const mx = Math.max(50000, ...rows.map(x => Math.abs(Number(x.income || 0) - Number(x.expense || 0))))
  const w = 600 / Math.max(rows.length, 6)
  const R = (n: number) => n.toLocaleString('ru-RU') + ' ₽'
  return <div style={{ marginTop: 40 }}>
    <div className="grid">{[['Доход', R(I)], ['Расходы', R(X)], ['Чистый результат', R(I - X)], ['Продаж', S], ['Цель', '50 000 ₽/мес']].map(([l, v]) => <div key={l} className="card"><span className="meta">{l}</span><h3 style={{ fontSize: 28 }}>{v}</h3></div>)}</div>
    <div className="card" style={{ marginTop: 16 }}>
      <svg viewBox="0 0 600 160" width="100%" role="img" aria-label="Чистый результат по месяцам">
        <line x1="0" x2="600" y1="130" y2="130" stroke="#222" />
        {rows.length === 0
          ? <text x="300" y="80" textAnchor="middle">Нет данных — добавь первый месяц</text>
          : rows.map((x, i) => {
              const v = Number(x.income || 0) - Number(x.expense || 0)
              const h = Math.abs(v) / mx * 110
              return <g key={x.id}>
                <rect x={i * w + 8} y={v >= 0 ? 130 - h : 130} width={w - 16} height={Math.max(h, 2)} fill={v >= 0 ? '#E5202E' : '#555'} />
                <text x={i * w + w / 2} y="150" textAnchor="middle">{x.month}</text>
              </g>
            })}
      </svg>
    </div>
  </div>
}

export default function AdminClient() {
  const [k, setK] = useState<Key>(KEYS[0])
  const { status, error } = useSaveStatus()
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
    router.refresh()
  }

  return <div className="adm">
    <p><Link href="/" className="red">← На сайт</Link></p>
    <div className="admhead">
      <h1 style={{ fontSize: 48, margin: '8px 0 0' }}>Админка</h1>
      <div className="row" style={{ marginTop: 0, alignItems: 'center' }}>
        <span className="meta">{status === 'saving' ? 'Сохраняю…' : status === 'saved' ? 'Сохранено ✓' : status === 'error' ? 'Ошибка: ' + error : ''}</span>
        <button className="btn" onClick={logout}>Выйти</button>
      </div>
    </div>
    <p style={{ marginTop: 20 }}>
      Данные хранятся на сервере в файле <code>data/content.json</code>, поэтому правки видят все посетители.
      После сохранения обнови страницу сайта, чтобы увидеть изменения.
    </p>
    <div className="chips">
      {KEYS.map(x => <button key={x} className={'btn' + (x === k ? ' on' : '')} onClick={() => setK(x)}>{SCHEMA[x].label}</button>)}
    </div>
    <Crud key={k} k={k} />
  </div>
}
