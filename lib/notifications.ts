export async function requestNotificationPermissions(): Promise<boolean> {
  return false
}

export async function scheduleWorkoutReminder(hour: number = 9) {}

export async function cancelWorkoutReminder() {}

export async function sendPRNotification(exerciseName: string, weight: number, unit: string = 'kg') {}

export async function sendWeeklySummary(sessions: number, volume: number, unit: string = 'kg') {}

export async function scheduleWeeklySummary() {}