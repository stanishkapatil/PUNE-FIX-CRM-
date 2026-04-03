"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { collection, getCountFromServer, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase";

type Row = { category: string; count: number };

const CATEGORIES: Array<{ key: string; label: string }> = [
  { key: "Water Supply", label: "Water" },
  { key: "Roads & Infrastructure", label: "Roads" },
  { key: "Electricity", label: "Electricity" },
  { key: "Sanitation", label: "Sanitation" },
  { key: "Tax & Finance", label: "Tax" },
  { key: "General", label: "General" },
];

export function CategoryChart() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const chartData = useMemo(
    () => CATEGORIES.map((c) => ({ category: c.label, count: data.find((d) => d.category === c.key)?.count ?? 0 })),
    [data],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const casesCol = collection(db, "cases");
        const openStatuses = ["received", "analysed", "assigned", "in_progress", "resolved"];

        const counts = await Promise.all(
          CATEGORIES.map(async (c) => {
            const snap = await getCountFromServer(
              query(casesCol, where("status", "in", openStatuses), where("category", "==", c.key)),
            );
            return { category: c.key, count: snap.data().count } as Row;
          }),
        );

        if (!cancelled) setData(counts);
      } catch {
        if (!cancelled) setData(CATEGORIES.map((c) => ({ category: c.key, count: 0 })));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
        <div className="text-sm font-semibold text-slate-900">Cases by Category</div>
        <div className="text-xs text-slate-500">Open case volume distribution</div>
      </div>

      <div className="p-4 sm:p-5 h-[320px]">
        {loading ? (
          <div className="h-full w-full rounded-lg bg-slate-100 animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="#64748B" />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748B" allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: "#E2E8F0" }}
                cursor={{ fill: "rgba(37, 99, 235, 0.08)" }}
              />
              <Bar dataKey="count" fill="#2563EB" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

