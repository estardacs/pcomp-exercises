import { createClient } from '@supabase/supabase-js'
import { parseNotebook } from '../lib/notebook-parser'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data } = await supabase.from('submissions').select('id, filename, notebook_storage_path').limit(1)
  const sub = data![0]
  console.log('File:', sub.filename)

  const { data: file } = await supabase.storage.from('notebooks').download(sub.notebook_storage_path)
  const text = await file!.text()
  const nb = JSON.parse(text)

  console.log('Total cells:', nb.cells.length)

  // Check separator detection
  let sepIdx = -1
  for (let i = 0; i < nb.cells.length; i++) {
    const c = nb.cells[i]
    const src = Array.isArray(c.source) ? c.source.join('') : c.source
    const firstLine = src.split('\n')[0].trim()
    if (c.cell_type === 'markdown') {
      const matches = /^#{1,3}\s*Ahora Usted/i.test(firstLine)
      if (matches) { sepIdx = i; console.log(`Separator at [${i}]: ${JSON.stringify(firstLine)}`); break }
    }
  }
  if (sepIdx === -1) console.log('NO SEPARATOR FOUND - checking all markdown cells:')

  nb.cells.forEach((c: { cell_type: string; source: string | string[] }, i: number) => {
    if (c.cell_type !== 'markdown') return
    const src = Array.isArray(c.source) ? c.source.join('') : c.source
    const firstLine = src.split('\n')[0].trim()
    console.log(`  [${i}] ${JSON.stringify(firstLine)}`)
  })

  const result = parseNotebook(nb)
  console.log('\nParseNotebook result:')
  console.log('  questions:', result.questions.length)
  result.questions.forEach(q => console.log(`  Q${q.n}: ${q.title} (${q.max_points}pt) cells=${q.cells.length} empty=${q.is_empty}`))
}

main()
