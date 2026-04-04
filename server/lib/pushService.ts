import webPush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BNprpveZnyHtp8Ovu-ybpHTWHAOctfC2tUzY8yUxmsyCcjaFttzzQNYlD2i6zNcS_0sVXOtca-mepyfL6oOeZiA";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "5zHcIugrYqZRE_lGTuTSv17hCXKkF3hLQI_EVPP1A5c";

webPush.setVapidDetails(
  'mailto:admin@azvirt.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export async function sendWebPush(subscription: webPush.PushSubscription, payload: any) {
  try {
    await webPush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (error) {
    console.error("[WebPush] Error sending push notification:", error);
    return { success: false, error };
  }
}
