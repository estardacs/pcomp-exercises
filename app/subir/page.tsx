'use client'

import { useState, useCallback } from 'react'
import { parseFilename } from '@/lib/filename-parser'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface FileRow {
  file: File
  parsed: ReturnType<typeof parseFilename>
}

export default function SubirPage() {
  const [rows, setRows] = useState<FileRow[]>([])
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null)

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    addFiles(Array.from(e.dataTransfer.files))
  }, [])

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []))
  }

  function addFiles(files: File[]) {
    const ipynbs = files.filter(f => f.name.endsWith('.ipynb'))
    setRows(prev => {
      const existing = new Set(prev.map(r => r.file.name))
      const newRows = ipynbs
        .filter(f => !existing.has(f.name))
        .map(f => ({ file: f, parsed: parseFilename(f.name) }))
      return [...prev, ...newRows]
    })
    setResult(null)
  }

  async function handleUpload() {
    setUploading(true)
    setResult(null)
    const fd = new FormData()
    rows.forEach(r => fd.append('files', r.file))
    const res = await fetch('/api/submissions', { method: 'POST', body: fd })
    const data = await res.json()
    setResult(data)
    setRows([])
    setUploading(false)
  }

  const valid = rows.filter(r => r.parsed)
  const invalid = rows.filter(r => !r.parsed)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-800 text-sm">← Dashboard</Link>
        <h1 className="font-semibold">Subir notebooks</h1>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <p className="text-lg font-medium text-gray-600">Arrastra los .ipynb aquí</p>
          <p className="text-sm text-gray-400 mt-1">o haz click para seleccionar archivos</p>
          <input
            id="file-input"
            type="file"
            multiple
            accept=".ipynb"
            className="hidden"
            onChange={onPick}
          />
        </div>

        {/* Preview */}
        {rows.length > 0 && (
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <span className="font-medium">{rows.length} archivos listos</span>
              <div className="flex gap-2">
                {invalid.length > 0 && (
                  <Badge variant="destructive">{invalid.length} con error</Badge>
                )}
                <Badge className="bg-green-600">{valid.length} válidos</Badge>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-2 text-left">Archivo</th>
                    <th className="px-4 py-2 text-left">Ejercicio</th>
                    <th className="px-4 py-2 text-left">Alumno</th>
                    <th className="px-4 py-2 text-left">RUT</th>
                    <th className="px-4 py-2 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map(({ file, parsed }) => (
                    <tr key={file.name} className={!parsed ? 'bg-red-50' : ''}>
                      <td className="px-4 py-2 font-mono text-xs text-gray-600 max-w-[200px] truncate">{file.name}</td>
                      <td className="px-4 py-2">{parsed?.exercise ?? '-'}</td>
                      <td className="px-4 py-2">{parsed ? `${parsed.apellido}, ${parsed.nombre}` : '-'}</td>
                      <td className="px-4 py-2 font-mono text-xs">{parsed?.rut ?? '-'}</td>
                      <td className="px-4 py-2">
                        {parsed
                          ? <Badge className="bg-green-600 text-xs">✓ Válido</Badge>
                          : <Badge variant="destructive" className="text-xs">Nombre inválido</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRows([])}>Limpiar</Button>
              <Button onClick={handleUpload} disabled={uploading || valid.length === 0}>
                {uploading ? 'Subiendo…' : `Subir ${valid.length} archivo${valid.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white rounded-lg border p-4 space-y-2">
            <p className="font-medium text-green-700">
              ✓ {result.created} notebook{result.created !== 1 ? 's' : ''} subido{result.created !== 1 ? 's' : ''}
            </p>
            {result.errors.length > 0 && (
              <div className="space-y-1">
                {result.errors.map((e, i) => (
                  <p key={i} className="text-sm text-red-600">{e}</p>
                ))}
              </div>
            )}
            <Link href="/asignaciones">
              <Button size="sm" className="mt-2">Ir a asignaciones →</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
