import type { ParsedCell } from '@/types/database'
import CellOutputView from './CellOutputView'

interface Props {
  cells: ParsedCell[]
}

export default function NotebookFullView({ cells }: Props) {
  return (
    <div className="space-y-2">
      {cells.map((cell, i) => (
        <div
          key={i}
          className={`rounded border ${cell.type === 'code' ? 'bg-gray-900 text-gray-100' : 'bg-white'} p-3`}
        >
          {cell.type === 'code' ? (
            <pre className="text-xs font-mono whitespace-pre-wrap">{cell.source || '(vacío)'}</pre>
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{cell.source}</p>
          )}
          {cell.outputs?.map((out, j) => <CellOutputView key={j} output={out} />)}
        </div>
      ))}
    </div>
  )
}
