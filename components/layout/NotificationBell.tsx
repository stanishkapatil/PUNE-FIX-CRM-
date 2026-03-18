"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCircle2 } from "lucide-react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { firebaseAuth, firebaseDb } from "../../lib/firebase/client";

type Notif = {
  id: string;
  title: string;
  message: string;
  type: string;
  case_id?: string | null;
  alert_id?: string | null;
  created_at?: any;
  read_at?: any;
};

function docToNotif(d: QueryDocumentSnapshot<DocumentData>): Notif {
  const data = d.data() as any;
  return {
    id: d.id,
    title: String(data.title ?? ""),
    message: String(data.message ?? ""),
    type: String(data.type ?? "system"),
    case_id: data.case_id ?? null,
    alert_id: data.alert_id ?? null,
    created_at: data.created_at ?? null,
    read_at: data.read_at ?? null,
  };
}

function formatTime(ts: any): string {
  try {
    const date: Date =
      ts?.toDate?.() ??
      (typeof ts?.seconds === "number" ? new Date(ts.seconds * 1000) : null) ??
      (typeof ts === "string" ? new Date(ts) : null) ??
      null;
    if (!date || Number.isNaN(date.getTime())) return "";
    return date.toLocaleString();
  } catch {
    return "";
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const unsubAuth = firebaseAuth.onAuthStateChanged((user) => {
      setItems([]);
      setUnreadCount(0);

      if (!user) return;

      const base = collection(firebaseDb, "notifications", user.uid, "items");

      const qLatest = query(base, orderBy("created_at", "desc"), limit(10));
      const unsubLatest = onSnapshot(qLatest, (snap) => {
        setItems(snap.docs.map(docToNotif));
      });

      const qUnread = query(base, where("read_at", "==", null));
      const unsubUnread = onSnapshot(qUnread, (snap) => {
        setUnreadCount(snap.size);
      });

      return () => {
        unsubLatest();
        unsubUnread();
      };
    });

    return () => unsubAuth();
  }, []);

  const hasUnread = unreadCount > 0;

  const title = useMemo(() => (hasUnread ? `${unreadCount} unread notifications` : "Notifications"), [hasUnread, unreadCount]);

  const markRead = async (notifId: string) => {
    const user = firebaseAuth.currentUser;
    if (!user) return;
    const ref = collection(firebaseDb, "notifications", user.uid, "items");
    const docRef = (await import("firebase/firestore")).doc(ref, notifId);
    await updateDoc(docRef, { read_at: serverTimestamp() });
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100 text-[#1B2A4A]"
        aria-label={title}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {hasUnread ? (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#DC2626] text-white text-xs leading-5 text-center font-semibold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-24px)] rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">Notifications</div>
            <div className="text-xs text-slate-500">{hasUnread ? `${unreadCount} unread` : "All caught up"}</div>
          </div>

          <div className="max-h-[420px] overflow-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-600">
                <div className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <CheckCircle2 className="h-5 w-5 text-slate-500" aria-hidden="true" />
                </div>
                No notifications yet.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((n) => {
                  const isUnread = n.read_at == null;
                  const href = n.case_id ? `/cases/${n.case_id}` : n.alert_id ? `/dashboard?alert=${n.alert_id}` : "#";
                  return (
                    <li key={n.id}>
                      <Link
                        href={href}
                        onClick={async () => {
                          if (isUnread) await markRead(n.id);
                          setOpen(false);
                        }}
                        className={[
                          "block px-4 py-3 hover:bg-slate-50",
                          isUnread ? "bg-blue-50/40" : "bg-white",
                        ].join(" ")}
                      >
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900 truncate">{n.title}</div>
                              {isUnread ? (
                                <span className="inline-block h-2 w-2 rounded-full bg-[#2563EB]" aria-label="Unread" />
                              ) : null}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-600 line-clamp-2">{n.message}</div>
                            <div className="mt-1 text-[11px] text-slate-400">{formatTime(n.created_at)}</div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

