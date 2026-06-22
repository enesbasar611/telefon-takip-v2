/**
 * Utility for cross-tab communication using BroadcastChannel
 */

export const NOTIFICATION_CHANNEL = "notification_sync_channel";

export type NotificationEvent =
    | { type: "REFRESH_NOTIFICATIONS" }
    | { type: "MARK_AS_READ"; notificationId: string }
    | { type: "MARK_ALL_READ" }
    | { type: "SNOOZE_NOTIFICATION"; notificationId: string };

let channel: BroadcastChannel | null = null;

const getChannel = () => {
    if (typeof window === "undefined") return null;
    if (!channel) {
        channel = new BroadcastChannel(NOTIFICATION_CHANNEL);
    }
    return channel;
};

export const broadcastNotificationEvent = (event: NotificationEvent) => {
    const ch = getChannel();
    if (ch) {
        ch.postMessage(event);
    }
};

export const subscribeToNotificationEvents = (callback: (event: NotificationEvent) => void) => {
    const ch = getChannel();
    if (!ch) return () => { };

    const handler = (event: MessageEvent) => {
        callback(event.data);
    };

    ch.addEventListener("message", handler);
    return () => ch.removeEventListener("message", handler);
};
