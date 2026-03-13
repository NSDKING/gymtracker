import * as Notifications from 'expo-notifications'

 
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })
} catch (e) {
  console.warn('Notifications not available', e)
}
 

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') return true
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

// Schedule a daily workout reminder at a specific hour
export async function scheduleWorkoutReminder(hour: number = 9) {
  await Notifications.cancelAllScheduledNotificationsAsync()
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to train 💪',
      body: 'Log your session and keep the streak alive.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    },
  })
}

export async function cancelWorkoutReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync()
}

// Fire an instant PR alert
export async function sendPRNotification(exerciseName: string, weight: number, unit: string = 'kg') {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🏆 New Personal Record!',
      body: `You hit a new PR on ${exerciseName}: ${weight}${unit}`,
      sound: true,
    },
    trigger: null, // immediate
  })
}

// Send weekly summary
export async function sendWeeklySummary(sessions: number, volume: number, unit: string = 'kg') {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 Your week in review',
      body: `${sessions} session${sessions !== 1 ? 's' : ''} · ${volume > 999 ? `${(volume / 1000).toFixed(1)}k` : volume}${unit} lifted`,
      sound: true,
    },
    trigger: null,
  })
}

// Schedule weekly summary every Sunday at 8pm
export async function scheduleWeeklySummary() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 Weekly Summary',
      body: "Check how your week went — open Repd to see your stats.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday
      hour: 20,
      minute: 0,
    },
  })
}