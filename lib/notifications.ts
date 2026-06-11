import * as Notifications from 'expo-notifications'
import * as Haptics from 'expo-haptics'
import type { WorkoutPlan } from '../store'

const { SchedulableTriggerInputTypes: T } = Notifications

// Show alerts even when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: current } = await Notifications.getPermissionsAsync()
  if (current === 'granted') return true
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

// ─── Workout / rest-day daily reminders ───────────────────────────────────────

const REMINDER_PREFIX = 'workout-reminder-'

// Schedule one weekly notification per day of the week.
// weeklySchedule[0]=Mon … [6]=Sun; -1=rest, >=0=workout slot index.
// planDays maps slot → day details for the notification body.
export async function scheduleWeeklyReminders(
  weeklySchedule: number[],
  planDays: WorkoutPlan['days'],
  hour: number = 8,
): Promise<void> {
  await cancelWorkoutReminder()

  // expo-notifications weekday: 1=Sun, 2=Mon, …, 7=Sat
  // Our dow: 0=Mon … 6=Sun  →  expoWeekday = ((dow + 1) % 7) + 1
  for (let dow = 0; dow < 7; dow++) {
    const slot = weeklySchedule[dow]
    const isRest = slot === -1
    const expoWeekday = ((dow + 1) % 7) + 1

    const title = isRest ? '😴 Rest Day' : '💪 Workout Day'
    const body = isRest
      ? 'Recovery is training too. Rest up and come back stronger.'
      : planDays[slot]
        ? `${planDays[slot].dayName} · ${planDays[slot].focus} — time to train!`
        : 'Time to hit the gym!'

    await Notifications.scheduleNotificationAsync({
      identifier: `${REMINDER_PREFIX}${dow}`,
      content: { title, body, data: { type: 'workout-reminder', isRest } },
      trigger: { type: T.WEEKLY, weekday: expoWeekday, hour, minute: 0 },
    })
  }
}

// Fallback: schedule a simple daily reminder when no plan is active.
export async function scheduleWorkoutReminder(hour: number = 8): Promise<void> {
  await cancelWorkoutReminder()
  for (let expoWeekday = 1; expoWeekday <= 7; expoWeekday++) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${REMINDER_PREFIX}${expoWeekday}`,
      content: {
        title: '💪 Workout Reminder',
        body: "Time to train! Open the app to see today's workout.",
      },
      trigger: { type: T.WEEKLY, weekday: expoWeekday, hour, minute: 0 },
    })
  }
}

export async function cancelWorkoutReminder(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  await Promise.all(
    scheduled
      .filter(n => n.identifier.startsWith(REMINDER_PREFIX))
      .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier))
  )
}

// ─── Rest-timer notification ───────────────────────────────────────────────────

const TIMER_ID = 'rest-timer-done'

// Fires when the between-set rest finishes, even if the app is backgrounded.
export async function scheduleTimerNotification(seconds: number): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(TIMER_ID).catch(() => {})
  await Notifications.scheduleNotificationAsync({
    identifier: TIMER_ID,
    content: {
      title: '⏱ Rest Over!',
      body: 'Get back to your next set! 💪',
      sound: true,
    },
    trigger: { type: T.TIME_INTERVAL, seconds, repeats: false },
  })
}

export async function cancelTimerNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(TIMER_ID).catch(() => {})
}

// Haptic buzz when the timer finishes while the app is in the foreground
export async function vibrateTimerDone(): Promise<void> {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
}

// ─── PR & weekly summary ───────────────────────────────────────────────────────

export async function sendPRNotification(
  exerciseName: string,
  weight: number,
  unit: string = 'kg',
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🏆 New Personal Record!',
      body: `${exerciseName}: ${weight} ${unit}`,
    },
    trigger: null,
  })
}

export async function sendWeeklySummary(
  sessions: number,
  volume: number,
  unit: string = 'kg',
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 Weekly Summary',
      body: `${sessions} session${sessions !== 1 ? 's' : ''} · ${Math.round(volume)} ${unit} lifted this week. Keep it up!`,
    },
    trigger: null,
  })
}

export async function scheduleWeeklySummary(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('weekly-summary').catch(() => {})
  await Notifications.scheduleNotificationAsync({
    identifier: 'weekly-summary',
    content: {
      title: '📊 Weekly Wrap-up',
      body: 'Check your training summary for this week.',
    },
    trigger: { type: T.WEEKLY, weekday: 1, hour: 20, minute: 0 }, // Sunday 20:00
  })
}
