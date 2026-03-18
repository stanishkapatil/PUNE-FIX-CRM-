import "server-only";

import { randomUUID } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "../firebase/admin";
import type { NotificationItem, NotificationType } from "../../types";

export type NewNotificationInput = Omit<NotificationItem, "id" | "user_id" | "created_at" | "read_at"> & {
  type: NotificationType;
  title: string;
  message: string;
  case_id?: string;
  alert_id?: string;
};

function notifCollection(userId: string) {
  return getFirebaseAdminDb().collection("notifications").doc(userId).collection("items");
}

export async function saveNotification(
  userId: string,
  notification: NewNotificationInput,
): Promise<{ notifId: string }> {
  if (!userId?.trim()) throw new Error("saveNotification: userId is required");
  if (!notification?.title?.trim()) throw new Error("saveNotification: title is required");
  if (!notification?.message?.trim()) throw new Error("saveNotification: message is required");
  if (!notification?.type?.trim()) throw new Error("saveNotification: type is required");

  const notifId = randomUUID();
  const ref = notifCollection(userId).doc(notifId);

  await ref.set({
    id: notifId,
    user_id: userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    case_id: notification.case_id ?? null,
    alert_id: notification.alert_id ?? null,
    created_at: FieldValue.serverTimestamp(),
    read_at: null,
  });

  return { notifId };
}

export async function markAsRead(userId: string, notifId: string): Promise<void> {
  if (!userId?.trim()) throw new Error("markAsRead: userId is required");
  if (!notifId?.trim()) throw new Error("markAsRead: notifId is required");

  const ref = notifCollection(userId).doc(notifId);
  await ref.set({ read_at: FieldValue.serverTimestamp() }, { merge: true });
}

export async function getUnreadCount(userId: string): Promise<number> {
  if (!userId?.trim()) throw new Error("getUnreadCount: userId is required");

  const snap = await notifCollection(userId).where("read_at", "==", null).get();
  return snap.size;
}

