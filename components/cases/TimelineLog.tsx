"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquarePlus } from "lucide-react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { firebaseAuth, firebaseDb } from "../../lib/firebase/client";

type Entry = {
  id: string;
  type: string;
  message: string;
  actor_name?: string | null;
  created_at?: any;
};

function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === "function") return v.toDate();
  if (typeof v?.seconds === "number") return new Date(v.seconds * 1000);
  if (typeof v?._seconds === "number") return new Date(v._seconds * 1000);
  return null;
}

function fmt(ts: any): string {
  const d = toDate(ts);
  if (!d) return "";
  return d.toLocaleString();
}

function docToEntry(d: QueryDocumentSnapshot<DocumentData>): Entry {
  const data = d.data() as any;
  return {
    id: d.id,
    type: String(data.type ?? ""),
    message: String(data.message ?? ""),
    actor_name: data.actor_name ?? null,
    created_at: data.created_at ?? null,
  };
}

async function authedPatch(caseId: string, body: unknown) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();
  const res = await fetch(`/api/v1/cases/${caseId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error || "Failed to update case");
  return json;
}

export function TimelineLog({ caseId }: { caseId: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [livePaused, setLivePaused] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(firebaseDb, "cases", caseId, "timeline"), orderBy("created_at", "desc"));
    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        setLivePaused(snap.metadata.fromCache);
        setEntries(snap.docs.map(docToEntry));
        setLoading(false);
      },
      () => {
        setLivePaused(true);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [caseId]);

  const canSave = useMemo(() => note.trim().length >= 3 && !saving, [note, saving]);

  const addNote = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await authedPatch(caseId, { note: note.trim() });
      setNote("");
    } catch (e: any) {
      setError(e?.message || "Failed to add note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">Timeline</div>
          {livePaused ? <div className="text-xs text-amber-700">Live updates paused</div> : <div className="text-xs text-slate-500">Live updates</div>}
        </div>
      </div>

      <div className="p-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-sm font-semibold text-[#1B2A4A]">Internal note</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Add an internal note for the case timeline…"
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            {error ? <div className="text-xs text-red-700">{error}</div> : <div className="text-xs text-slate-500">Visible to staff only</div>}
            <button
              type="button"
              onClick={() => void addNote()}
              disabled={!canSave}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />}
              Add Note
            </button>
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="text-sm text-slate-600 inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading timeline…
            </div>
          ) : entries.length === 0 ? (
            <div className="text-sm text-slate-600">No timeline entries yet.</div>
          ) : (
            <ol className="relative border-l border-slate-200 ml-2 space-y-4">
              {entries.map((e) => (
                <li key={e.id} className="ml-4">
                  <div className="absolute -left-[7px] mt-1.5 h-3.5 w-3.5 rounded-full bg-[#2563EB] border-2 border-white shadow" />
                  <div className="text-xs text-slate-500">{fmt(e.created_at)}</div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-900">{e.message}</div>
                  <div className="mt-0.5 text-xs text-slate-600">
                    {e.actor_name ? <>By <span className="font-semibold">{e.actor_name}</span></> : "System"}
                    {e.type ? <span className="text-slate-400"> • {e.type}</span> : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

