import type { CellOutput } from '@/types/database'

export default function CellOutputView({ output }: { output: CellOutput }) {
  if (output.kind === 'image' && output.image) {
    return (
      <div className="border border-gray-200 rounded overflow-hidden bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/png;base64,${output.image}`} alt="output" className="max-w-full" />
      </div>
    )
  }
  if (output.kind === 'error') {
    return (
      <pre className="text-xs font-mono bg-red-50 text-red-700 rounded px-3 py-2 whitespace-pre-wrap border border-red-200">
        {output.text}
      </pre>
    )
  }
  if (output.kind === 'text' && output.text) {
    return (
      <pre className="text-xs font-mono bg-white text-gray-800 rounded px-3 py-2 whitespace-pre-wrap border border-gray-200">
        {output.text}
      </pre>
    )
  }
  return null
}
