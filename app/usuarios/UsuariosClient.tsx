'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Profile } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

interface Props {
  users: Profile[]
  currentUserId: string
}

export default function UsuariosClient({ users, currentUserId }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'ayudante' | 'profesor'>('ayudante')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [togglingRole, setTogglingRole] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    setName(''); setEmail(''); setPassword(''); setRole('ayudante')
    router.refresh()
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ ok: false, text: 'Las contraseñas no coinciden' })
      return
    }
    setChangingPassword(true)
    setPasswordMsg(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setChangingPassword(false)
    if (error) {
      setPasswordMsg({ ok: false, text: error.message })
    } else {
      setPasswordMsg({ ok: true, text: 'Contraseña actualizada' })
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  async function toggleRole(u: Profile) {
    setTogglingRole(u.id)
    const newRole = u.role === 'profesor' ? 'ayudante' : 'profesor'
    await fetch('/api/usuarios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, role: newRole }),
    })
    setTogglingRole(null)
    router.refresh()
  }

  async function deleteUser(id: string) {
    setDeleting(id)
    const res = await fetch('/api/usuarios', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    setDeleting(null)
    if (!res.ok) { setError(data.error); return }
    router.refresh()
  }

  const profesores = users.filter(u => u.role === 'profesor')
  const ayudantes = users.filter(u => u.role === 'ayudante')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-800 text-sm">← Dashboard</Link>
        <h1 className="font-semibold">Usuarios</h1>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">

        {/* Change own password */}
        <div className="bg-white border rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-base">Cambiar mi contraseña</h2>
          <form onSubmit={changePassword} className="space-y-3">
            <div>
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input id="new-password" type="password" value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" required minLength={6} />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirmar contraseña</Label>
              <Input id="confirm-password" type="password" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña" required minLength={6} />
            </div>
            {passwordMsg && (
              <p className={`text-sm ${passwordMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{passwordMsg.text}</p>
            )}
            <Button type="submit" disabled={changingPassword} variant="outline" className="w-full">
              {changingPassword ? 'Guardando…' : 'Cambiar contraseña'}
            </Button>
          </form>
        </div>

        {/* Create user */}
        <div className="bg-white border rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-base">Agregar usuario</h2>
          <form onSubmit={createUser} className="space-y-3">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ana García" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ana@uc.cl" required />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" required minLength={6} />
            </div>
            <div>
              <Label>Rol</Label>
              <div className="flex gap-2 mt-1">
                {(['ayudante', 'profesor'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 py-2 rounded-md text-sm border transition-colors ${
                      role === r
                        ? r === 'profesor'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {r === 'profesor' ? 'Profesor' : 'Ayudante'}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Creando…' : 'Crear usuario'}
            </Button>
          </form>
        </div>

        {/* User list */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-base">Usuarios registrados</h2>
          </div>
          {users.length === 0 ? (
            <p className="px-6 py-4 text-sm text-gray-400">Sin usuarios aún.</p>
          ) : (
            <>
              {[{ label: 'Profesores', list: profesores }, { label: 'Ayudantes', list: ayudantes }].map(({ label, list }) => (
                list.length > 0 && (
                  <div key={label}>
                    <p className="px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b">{label}</p>
                    <ul className="divide-y">
                      {list.map(u => (
                        <li key={u.id} className="flex items-center justify-between px-6 py-3 gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-sm font-medium truncate">{u.name}</p>
                            {u.id === currentUserId && (
                              <Badge variant="outline" className="text-xs shrink-0">Tú</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => toggleRole(u)}
                              disabled={togglingRole === u.id}
                              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                                u.role === 'profesor'
                                  ? 'text-purple-700 border-purple-200 bg-purple-50 hover:bg-purple-100'
                                  : 'text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100'
                              }`}
                            >
                              {togglingRole === u.id ? '…' : u.role === 'profesor' ? 'Profesor' : 'Ayudante'}
                            </button>
                            {u.id !== currentUserId && (
                              <Button variant="ghost" size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => deleteUser(u.id)}
                                disabled={deleting === u.id}>
                                {deleting === u.id ? 'Eliminando…' : 'Eliminar'}
                              </Button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              ))}
            </>
          )}
        </div>

      </main>
    </div>
  )
}
