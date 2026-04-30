import { createClient } from '@supabase/supabase-js'
import { parseNotebook } from '../lib/notebook-parser'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data: submissions, error } = await supabase
    .from('submissions')
    .select('id, filename, notebook_storage_path')

  if (error) { console.error(error); process.exit(1) }
  if (!submissions?.length) { console.log('No submissions found.'); return }

  console.log(`Re-parsing ${submissions.length} notebooks...`)
  let ok = 0, failed = 0

  for (const sub of submissions) {
    if (!sub.notebook_storage_path) {
      console.log(`  SKIP ${sub.filename} (no storage path)`)
      failed++
      continue
    }

    const { data: fileData, error: dlErr } = await supabase.storage
      .from('notebooks')
      .download(sub.notebook_storage_path)

    if (dlErr || !fileData) {
      console.log(`  FAIL ${sub.filename}: ${dlErr?.message}`)
      failed++
      continue
    }

    const text = await fileData.text()
    let raw: unknown
    try { raw = JSON.parse(text) } catch {
      console.log(`  FAIL ${sub.filename}: invalid JSON`)
      failed++
      continue
    }

    const notebook_json = parseNotebook(raw)
    const { error: updateErr } = await supabase
      .from('submissions')
      .update({ notebook_json })
      .eq('id', sub.id)

    if (updateErr) {
      console.log(`  FAIL ${sub.filename}: ${updateErr.message}`)
      failed++
    } else {
      console.log(`  OK   ${sub.filename} → ${notebook_json.questions.length} preguntas`)
      ok++
    }
  }

  console.log(`\nDone: ${ok} OK, ${failed} failed`)
}

main()
