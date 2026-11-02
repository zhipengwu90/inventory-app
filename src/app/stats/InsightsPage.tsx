"use client";
// Insights: spending by month and store (was CostChart) and each item's stock
// over time (was the Stats item chart). Mirrors the iOS InsightsView.
import React, { useEffect, useMemo, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { ChartsReferenceLine } from "@mui/x-charts/ChartsReferenceLine";
import { BarChart3 } from "lucide-react";
import {
  colorFor,
  currency,
  HistoryEntry,
  Item,
  minOf,
  recordDate,
  recordTotal,
  storeName,
  toNumber,
} from "../utils/types";
import { fetchHistory, fetchItemsWithHistory } from "../utils/sql/restockApi";
import { Spinner, Thumb } from "../components/restock/ui";
import { useToast } from "../components/restock/Toast";

const ranges = [
  { label: "6M", months: 6 },
  { label: "1Y", months: 12 },
  { label: "All", months: null },
] as const;

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export default function InsightsPage() {
  const toast = useToast();
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [range, setRange] = useState<(typeof ranges)[number]>(ranges[0]);
  const [itemId, setItemId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([fetchHistory(), fetchItemsWithHistory()])
      .then(([nextHistory, nextItems]) => {
        setHistory(nextHistory);
        setItems(nextItems);
        // Default to the item with the most history.
        const richest = [...nextItems].sort(
          (a, b) => b.current_inventory.length - a.current_inventory.length,
        )[0];
        setItemId(richest?.id ?? null);
      })
      .catch((error) => {
        toast.error(error);
        setHistory([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spend = useMemo(() => {
    const now = new Date();
    const start = range.months
      ? new Date(now.getFullYear(), now.getMonth() - (range.months - 1), 1)
      : null;
    const totals = new Map<string, Map<string, number>>();
    (history ?? []).forEach((entry) => {
      const cost = toNumber(entry.total_cost);
      const date = new Date(entry.created_at);
      if (!cost || cost <= 0 || (start && date < start)) return;
      const key = monthKey(date);
      const month = totals.get(key) ?? new Map<string, number>();
      month.set(storeName(entry), (month.get(storeName(entry)) ?? 0) + cost);
      totals.set(key, month);
    });
    const months = Array.from(totals.keys()).sort();
    const stores = Array.from(
      new Set(Array.from(totals.values()).flatMap((m) => Array.from(m.keys()))),
    ).sort();
    const dataset = months.map((key) => {
      const [y, m] = key.split("-").map(Number);
      const row: Record<string, string | number> = {
        month: new Date(y, m - 1, 1).toLocaleDateString(undefined, {
          month: "short",
        }),
      };
      stores.forEach((s) => (row[s] = totals.get(key)?.get(s) ?? 0));
      return row;
    });
    const byStore = stores
      .map((s) => ({
        store: s,
        total: dataset.reduce((sum, row) => sum + Number(row[s]), 0),
      }))
      .sort((a, b) => b.total - a.total);
    const total = byStore.reduce((sum, s) => sum + s.total, 0);
    return {
      dataset,
      stores,
      byStore,
      total,
      months: Math.max(months.length, 1),
    };
  }, [history, range]);

  if (!history) return <Spinner />;

  const item = items.find((i) => i.id === itemId) ?? null;
  const points = (item?.current_inventory ?? [])
    .map((record) => ({
      date: recordDate(record),
      stock: recordTotal(record),
      used: toNumber(record.used_amount),
    }))
    .filter(
      (p): p is { date: Date; stock: number; used: number | null } =>
        p.date !== null && p.stock !== null,
    );
  const used = points.map((p) => p.used ?? 0).filter((u) => u > 0);
  const top = spend.byStore[0]?.total ?? 1;

  return (
    <div className="space-y-5 pb-6">
      <h1 className="text-[34px] font-bold leading-tight sm:text-3xl">
        Insights
      </h1>

      {/* Spending */}
      <section className="rounded-3xl bg-white p-5 sm:p-4">
        <div className="font-semibold">Spending</div>
        <div className="text-4xl font-bold tabular-nums">
          {currency(spend.total)}
        </div>
        <div className="text-sm text-gray-500">
          about {currency(spend.total / spend.months)} a month
        </div>

        <div
          className="mt-4 grid grid-cols-3 rounded-xl bg-black/[0.06] p-0.5"
          role="tablist"
        >
          {ranges.map((r) => (
            <button
              key={r.label}
              role="tab"
              aria-selected={range.label === r.label}
              onClick={() => setRange(r)}
              className={`rounded-[10px] py-1.5 text-sm font-semibold ${range.label === r.label ? "bg-white shadow-sm" : "text-gray-600"}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {spend.dataset.length === 0 ? (
          <EmptyChart message="Add totals to your trips in History to see spending here." />
        ) : (
          <div className="-mx-2 mt-2">
            <BarChart
              height={260}
              dataset={spend.dataset}
              xAxis={[{ scaleType: "band", dataKey: "month" }]}
              yAxis={[{ valueFormatter: (v: number) => `$${Math.round(v)}` }]}
              series={spend.stores.map((s) => ({
                dataKey: s,
                label: s,
                stack: "total",
                color: colorFor(s),
                valueFormatter: (v: number | null) => (v ? currency(v) : "—"),
              }))}
              borderRadius={6}
              margin={{ top: 16, right: 8, bottom: 56, left: 48 }}
              slotProps={{
                legend: {
                  direction: "row",
                  position: { vertical: "bottom", horizontal: "middle" },
                  itemMarkWidth: 10,
                  itemMarkHeight: 10,
                  labelStyle: { fontSize: 12 },
                },
              }}
            />
          </div>
        )}
      </section>

      {/* By store */}
      {spend.byStore.length > 0 && (
        <section className="space-y-3 rounded-3xl bg-white p-5 sm:p-4">
          <div className="font-semibold">By Store</div>
          {spend.byStore.map(({ store, total }) => (
            <div key={store}>
              <div className="flex justify-between text-sm">
                <span className="font-medium">{store}</span>
                <span className="tabular-nums text-gray-500">
                  {currency(total)}
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-black/5">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(3, (total / top) * 100)}%`,
                    background: colorFor(store),
                  }}
                />
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Stock over time */}
      <section className="rounded-3xl bg-white p-5 sm:p-4">
        <div className="font-semibold">Stock Over Time</div>
        <div className="text-xs text-gray-500">
          Counts and usage recorded for each item
        </div>

        <label className="mt-3 flex items-center gap-2.5 rounded-xl bg-black/[0.06] p-2">
          <Thumb
            name={item?.name ?? "?"}
            url={item?.img_url}
            category={item?.item_category}
            size={32}
          />
          <select
            value={itemId ?? ""}
            onChange={(e) => setItemId(Number(e.target.value))}
            className="w-full cursor-pointer bg-transparent text-sm font-semibold outline-none"
            aria-label="Item"
          >
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>

        {points.length < 2 ? (
          <EmptyChart message="Count this item a few times to see its trend." />
        ) : (
          <>
            <div className="-mx-2 mt-2">
              <LineChart
                height={220}
                xAxis={[
                  {
                    data: points.map((p) => p.date),
                    scaleType: "time",
                    valueFormatter: (d: Date) =>
                      d.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      }),
                  },
                ]}
                yAxis={[{ min: 0, tickMinStep: 1 }]}
                series={[
                  {
                    data: points.map((p) => p.stock),
                    area: true,
                    color: "#249E6B",
                    label: "In stock",
                    curve: "monotoneX",
                  },
                ]}
                margin={{ top: 16, right: 12, bottom: 28, left: 36 }}
                slotProps={{ legend: { hidden: true } }}
                sx={{ "& .MuiAreaElement-root": { fillOpacity: 0.15 } }}
              >
                {item && minOf(item) > 0 && (
                  <ChartsReferenceLine
                    y={minOf(item)}
                    label={`min ${minOf(item)}`}
                    labelAlign="start"
                    lineStyle={{ stroke: "#FF9500", strokeDasharray: "5 4" }}
                    labelStyle={{
                      fill: "#FF9500",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                )}
              </LineChart>
            </div>
            {used.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  ["Used in total", used.reduce((a, b) => a + b, 0)],
                  [
                    "Per count",
                    (used.reduce((a, b) => a + b, 0) / used.length).toFixed(1),
                  ],
                  ["Counts", points.length],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl bg-black/[0.04] py-2 text-center"
                  >
                    <div className="font-semibold tabular-nums">{value}</div>
                    <div className="text-[11px] text-gray-500">{label}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 text-center text-sm text-gray-500">
      <BarChart3 className="h-8 w-8 text-gray-300" />
      {message}
    </div>
  );
}
