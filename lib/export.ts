import * as FileSystem from 'expo-file-system'
import { Session, Exercise } from '../store'

export async function exportToCSV(sessions: Session[], exercises: Exercise[]) {
  const rows: string[] = []
  rows.push('Date,Exercise,Muscle,Set,Reps,Weight (kg),Volume (kg)')

  for (const session of sessions) {
    for (const entry of session.entries) {
      entry.sets.forEach((set, i) => {
        const volume = set.reps * set.weight
        rows.push([
          session.date,
          `"${entry.exercise.name}"`,
          `"${entry.exercise.muscle}"`,
          i + 1,
          set.reps,
          set.weight,
          volume,
        ].join(','))
      })
    }
  }

  const csv = rows.join('\n')
  const filename = `repd-export-${new Date().toISOString().slice(0, 10)}.csv`
  const uri = FileSystem.Paths.document.uri + '/' + filename

  const file = new FileSystem.File(uri)
  await file.write(csv)

  // Lazy load sharing to avoid native module crash on import
  const Sharing = await import('expo-sharing')
  const canShare = await Sharing.isAvailableAsync()
  if (!canShare) throw new Error('Sharing not available on this device')

  await Sharing.shareAsync(uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export your Repd data',
    UTI: 'public.comma-separated-values-text',
  })
}