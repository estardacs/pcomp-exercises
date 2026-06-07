// Run with: npx tsx scripts/seed-exercises.ts
import { createClient } from '@supabase/supabase-js'
import rubrica from '../data/rubrica.json'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seed() {
  console.log('Seeding exercises…')

  for (const [id, data] of Object.entries(rubrica as Record<string, {
    title: string; module: string; total_points: number; questions: unknown[]
  }>)) {
    const { error } = await supabase.from('exercises').upsert({
      id,
      title: data.title,
      module: data.module,
      total_points: data.total_points,
      is_optional: data.total_points === 0 || ['E09', 'E10', 'E13a', 'E13b', 'E14'].includes(id),
      rubrica: data,
    }, { onConflict: 'id' })

    if (error) console.error(`  ✗ ${id}:`, error.message)
    else console.log(`  ✓ ${id} - ${data.title}`)
  }

  console.log('Done.')
}

seed()
