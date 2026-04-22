import { Alert } from 'react-native'

function handleNotification(response) {
  const data = response.notification.request.content.data

  if (data?.type === 'alert') {
    Alert.alert(
      'Gas Alert',
      `${data.chain}: Gas is at ${data.value} gwei`,
      [{ text: 'OK' }]
    )
  }
}

export function setupNotificationHandlers() {
  try {
    const { ExpoPushToken, Notifications } = require('expo-notifications')

    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification)
    })

    Notifications.addNotificationResponseReceivedListener(handleNotification)

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    })
  } catch (err) {
    console.log('expo-notifications not available:', err.message)
  }
}

export async function registerForPushNotificationsAsync() {
  let token

  try {
    const { Notifications } = require('expo-notifications')
    const { Platform } = require('react-native')

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      })
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted')
      return null
    }

    const { data } = await Notifications.getExpoPushTokenAsync()
    token = data
    console.log('Push token:', token)
    return token
  } catch (err) {
    console.log('Push notifications not available:', err.message)
    return null
  }
}

export default {
  setupNotificationHandlers,
  registerForPushNotificationsAsync,
}
