'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      if (r.ok) { router.replace('/admin'); router.refresh(); return }
      const j = await r.json().catch(() => ({}))
      setErr(j?.error || 'Не удалось войти')
    } catch {
      setErr('Ошибка сети')
    }
    setBusy(false)
  }

  return <div className="adm" style={{ maxWidth: 420, paddingTop: '16vh' }}>
    <p><Link href="/" className="red">← На сайт</Link></p>
    <h1 style={{ fontSize: 42, margin: '12px 0 8px' }}>Вход в админку</h1>
    <p>Введи пароль владельца сайта.</p>
    <form onSubmit={submit}>
      <label>Пароль
        <input type="password" value={pw} autoFocus required autoComplete="current-password"
          onChange={e => setPw(e.target.value)} />
      </label>
      {err && <p className="red" style={{ margin: 0 }}>{err}</p>}
      <button className="btn fill" disabled={busy}>{busy ? 'Проверяю…' : 'Войти'}</button>
    </form>
    <p className="meta" style={{ marginTop: 28 }}>
      Пароль задаётся в файле <code>.env.local</code> → <code>ADMIN_PASSWORD</code>.
    </p>
  </div>
}
