"use client";
// History: past trips with their saved shopping lists, by trip or by store,
// and each store's receipt (total, GST, HST). Mirrors the iOS HistoryView.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Plus,
  ShoppingCart,
  Store,
  XCircle,
} from "lucide-react";
import {
  colorFor,
  currency,
  groupTrips,
  HistoryEntry,
  itemsAt,
  Receipt,
  shopperOf,
  storeName,
  toNumber,
  Trip,
  TripItem,
  tripTotal,
} from "../utils/types";
import {
  addHistory,
  fetchHistory,
  fetchTripItems,
  updateReceipt,
} from "../utils/sql/restockApi";
import {
  Btn,
  Empty,
  Field,
  Group,
  inputClass,
  selectClass,
  Sheet,
  Spinner,
  StatTile,
  Thumb,
} from "../components/restock/ui";
import { useToast } from "../components/restock/Toast";
import { useLookups } from "../components/restock/useLookups";
import { useStore } from "../components/restock/useStore";

type Route = { tripId: string; store?: string };

export default function HistoryPage() {
  const toast = useToast();
  const lookups = useLookups();
  // Shoppers see only their own trips and can't log one by hand.
  const { isAdmin } = useStore();
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [tripItems, setTripItems] = useState<TripItem[]>([]);
  const [grouping, setGrouping] = useState<"trip" | "store">("trip");
  const [route, setRoute] = useState<Route | null>(null);
  const [editing, setEditing] = useState<{ entry: HistoryEntry | null } | null>(
    null,
  );

  const load = useCallback(async () => {
    try {
      const [nextHistory, nextItems] = await Promise.all([
        fetchHistory(),
        fetchTripItems(),
      ]);
      setHistory(nextHistory);
      setTripItems(nextItems);
    } catch (error) {
      toast.error(error);
      setHistory((current) => current ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const trips = useMemo(
    () => groupTrips(history ?? [], tripItems),
    [history, tripItems],
  );

  if (!history) return <Spinner />;

  const now = new Date();
  const thisMonth = trips.filter(
    (t) =>
      t.date.getMonth() === now.getMonth() &&
      t.date.getFullYear() === now.getFullYear(),
  );
  const openTrip = route
    ? (trips.find((t) => t.id === route.tripId) ?? null)
    : null;

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-3">
        <h1 className="text-[34px] font-bold leading-tight sm:text-3xl">
          History
        </h1>
        {isAdmin && (
          <Btn
            onClick={() => setEditing({ entry: null })}
            aria-label="Log Trip"
          >
            <Plus className="h-[18px] w-[18px]" />
            <span className="sm:hidden">Log Trip</span>
          </Btn>
        )}
      </div>

      {trips.length === 0 ? (
        <Empty
          icon={<Clock className="h-12 w-12" />}
          title="No Trips Yet"
          message="When you finish a shopping trip, its list shows up here."
        >
          {isAdmin && (
            <Btn onClick={() => setEditing({ entry: null })}>Log a Trip</Btn>
          )}
        </Empty>
      ) : (
        <div className="space-y-5">
          <div className="flex gap-3">
            <StatTile
              icon={<Calendar className="h-5 w-5" />}
              value={currency(
                thisMonth.reduce((s, t) => s + tripTotal(t.receipts), 0),
              )}
              label="Spent this month"
              tint="#249E6B"
            />
            <StatTile
              icon={<ShoppingCart className="h-5 w-5" />}
              value={thisMonth.length}
              label="Trips this month"
              tint="#5856D6"
            />
          </div>

          <div
            className="grid grid-cols-2 rounded-xl bg-black/[0.06] p-0.5"
            role="tablist"
          >
            {(["trip", "store"] as const).map((value) => (
              <button
                key={value}
                role="tab"
                aria-selected={grouping === value}
                onClick={() => setGrouping(value)}
                className={`rounded-[10px] py-1.5 text-sm font-semibold ${grouping === value ? "bg-white shadow-sm" : "text-gray-600"}`}
              >
                {value === "trip" ? "By Trip" : "By Store"}
              </button>
            ))}
          </div>

          {grouping === "trip" ? (
            <ByTrip trips={trips} onOpen={setRoute} />
          ) : (
            <ByStore trips={trips} onOpen={setRoute} />
          )}
        </div>
      )}

      <TripSheet
        trip={openTrip}
        store={route?.store}
        onClose={() => setRoute(null)}
        onEdit={(entry) => setEditing({ entry })}
      />
      <ReceiptSheet
        open={!!editing}
        entry={editing?.entry ?? null}
        stores={lookups.stores}
        onClose={() => setEditing(null)}
        onSaved={load}
      />
    </div>
  );
}

// MARK: Lists

function ByTrip({
  trips,
  onOpen,
}: {
  trips: Trip[];
  onOpen: (route: Route) => void;
}) {
  const months = new Map<string, Trip[]>();
  trips.forEach((trip) => {
    const key = trip.date.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
    months.set(key, [...(months.get(key) ?? []), trip]);
  });
  return (
    <>
      {Array.from(months.entries()).map(([month, monthTrips]) => (
        <Group
          key={month}
          header={
            <SectionHeader
              title={month}
              total={monthTrips.reduce((s, t) => s + tripTotal(t.receipts), 0)}
            />
          }
        >
          {monthTrips.map((trip) => {
            const total = tripTotal(trip.receipts);
            return (
              <TripRow
                key={trip.id}
                date={trip.date}
                title={trip.receipts.map(storeName).join(" · ")}
                items={trip.items}
                shopper={trip.receipts.map(shopperOf).find(Boolean) ?? null}
                total={total > 0 ? total : null}
                onClick={() => onOpen({ tripId: trip.id })}
              />
            );
          })}
        </Group>
      ))}
    </>
  );
}

function ByStore({
  trips,
  onOpen,
}: {
  trips: Trip[];
  onOpen: (route: Route) => void;
}) {
  const stores = new Map<string, { trip: Trip; receipt: HistoryEntry }[]>();
  trips.forEach((trip) =>
    trip.receipts.forEach((receipt) => {
      const name = storeName(receipt);
      stores.set(name, [...(stores.get(name) ?? []), { trip, receipt }]);
    }),
  );
  return (
    <>
      {Array.from(stores.keys())
        .sort()
        .map((name) => {
          const visits = stores.get(name) ?? [];
          return (
            <Group
              key={name}
              header={
                <SectionHeader
                  title={name}
                  tint={colorFor(name)}
                  total={visits.reduce(
                    (s, v) => s + (toNumber(v.receipt.total_cost) ?? 0),
                    0,
                  )}
                />
              }
            >
              {visits.map(({ trip, receipt }) => (
                <TripRow
                  key={receipt.id}
                  date={new Date(receipt.created_at)}
                  title={new Date(receipt.created_at).toLocaleDateString(
                    undefined,
                    { weekday: "long", month: "short", day: "numeric" },
                  )}
                  items={itemsAt(trip, name)}
                  shopper={shopperOf(receipt)}
                  total={toNumber(receipt.total_cost)}
                  onClick={() => onOpen({ tripId: trip.id, store: name })}
                />
              ))}
            </Group>
          );
        })}
    </>
  );
}

function SectionHeader({
  title,
  total,
  tint,
}: {
  title: string;
  total: number;
  tint?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {tint && <Store className="h-4 w-4" style={{ color: tint }} />}
      <span>{title}</span>
      {total > 0 && (
        <span className="ml-auto tabular-nums text-gray-400">
          {currency(total)}
        </span>
      )}
    </div>
  );
}

function TripRow({
  date,
  title,
  items,
  shopper,
  total,
  onClick,
}: {
  date: Date;
  title: string;
  items: TripItem[];
  shopper: string | null;
  total: number | null;
  onClick: () => void;
}) {
  const bought = items.filter((i) => i.bought).length;
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-black/[0.02]"
    >
      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand/10">
        <span className="text-[10px] font-bold uppercase text-brand">
          {date.toLocaleDateString(undefined, { month: "short" })}
        </span>
        <span className="text-lg font-bold leading-none tabular-nums">
          {date.getDate()}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{title}</div>
        <div className="truncate text-xs text-gray-500">
          {items.length > 0 && (
            <span className={bought < items.length ? "text-low" : ""}>
              {bought} of {items.length} bought
            </span>
          )}
          {shopper && (items.length > 0 ? ` · ${shopper}` : shopper)}
        </div>
      </div>
      {total !== null ? (
        <span className="font-semibold tabular-nums">{currency(total)}</span>
      ) : (
        <span className="text-sm font-medium text-brand">Add total</span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
    </button>
  );
}

// MARK: Trip detail

function TripSheet({
  trip,
  store,
  onClose,
  onEdit,
}: {
  trip: Trip | null;
  store?: string;
  onClose: () => void;
  onEdit: (entry: HistoryEntry) => void;
}) {
  if (!trip) return null;
  const receipts = trip.receipts.filter(
    (r) => !store || storeName(r) === store,
  );
  const items = store ? itemsAt(trip, store) : trip.items;
  const total = tripTotal(receipts);
  const bought = items.filter((i) => i.bought).length;
  const shopper = trip.receipts.map(shopperOf).find(Boolean);

  return (
    <Sheet open onClose={onClose} title={store ?? "Trip"}>
      <div className="mb-5 px-1">
        <div className="text-lg font-semibold">
          {trip.date.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </div>
        {shopper && (
          <div className="text-sm text-gray-500">Shopped by {shopper}</div>
        )}
        <div className="mt-3 flex gap-3">
          <StatTile
            icon={<FileText className="h-5 w-5" />}
            value={total > 0 ? currency(total) : "—"}
            label="Spent"
            tint="#249E6B"
          />
          <StatTile
            icon={<CheckCircle2 className="h-5 w-5" />}
            value={items.length ? `${bought}/${items.length}` : "—"}
            label="Bought"
            tint={bought < items.length ? "#FF9500" : "#34C759"}
          />
        </div>
      </div>

      <div className="space-y-5">
        {receipts.map((receipt) => {
          const name = storeName(receipt);
          const storeItems = itemsAt(trip, name);
          const empty =
            receipt.total_cost == null &&
            receipt.gst == null &&
            receipt.hst == null;
          return (
            <Group
              key={receipt.id}
              header={
                <div className="flex items-center gap-2">
                  <Store
                    className="h-4 w-4"
                    style={{ color: colorFor(name) }}
                  />
                  {name}
                  <button
                    onClick={() => onEdit(receipt)}
                    className="ml-auto font-semibold text-brand"
                  >
                    Edit
                  </button>
                </div>
              }
            >
              {empty ? (
                <button
                  onClick={() => onEdit(receipt)}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-brand"
                >
                  <FileText className="h-4 w-4" /> Add receipt total, GST and
                  HST
                </button>
              ) : (
                <div className="space-y-1 px-4 py-3">
                  <Line
                    label="Total"
                    value={toNumber(receipt.total_cost)}
                    bold
                  />
                  {receipt.gst != null && (
                    <Line label="GST" value={toNumber(receipt.gst)} />
                  )}
                  {receipt.hst != null && (
                    <Line label="HST" value={toNumber(receipt.hst)} />
                  )}
                  {receipt.comment && (
                    <p className="pt-1 text-sm text-gray-500">
                      {receipt.comment}
                    </p>
                  )}
                </div>
              )}
              {storeItems.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500">
                  {trip.items.length === 0
                    ? "No list was saved for this trip."
                    : "Nothing from this store."}
                </div>
              )}
              {storeItems.map((item) => (
                <TripItemRow key={item.id} item={item} />
              ))}
            </Group>
          );
        })}
      </div>
    </Sheet>
  );
}

function Line({
  label,
  value,
  bold,
}: {
  label: string;
  value: number | null;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${bold ? "font-semibold" : "text-sm text-gray-500"}`}
    >
      <span>{label}</span>
      <span className="tabular-nums text-gray-900">
        {value != null ? currency(value) : "—"}
      </span>
    </div>
  );
}

function TripItemRow({ item }: { item: TripItem }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <Thumb
        name={item.item_name}
        url={item.item_list?.img_url ?? item.img_url}
        category={item.item_list?.item_category}
        size={36}
        dim={!item.bought}
      />
      <div className="min-w-0 flex-1">
        <div
          className={`truncate font-medium ${item.bought ? "" : "text-gray-400"}`}
        >
          {item.item_name}
        </div>
        <div className="text-xs text-gray-500">
          ×{item.amount}
          {item.price != null && ` · ${currency(Number(item.price))} each`}
        </div>
      </div>
      <div className="text-right">
        <span
          className={`flex items-center justify-end gap-1 text-xs font-semibold ${item.bought ? "text-green-600" : "text-low"}`}
        >
          {item.bought ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {item.bought ? "Bought" : "Not bought"}
        </span>
        {!item.bought && item.added_to_stock && (
          <span className="text-[11px] text-gray-500">Added to stock</span>
        )}
      </div>
    </div>
  );
}

// MARK: Receipt editor

function ReceiptSheet({
  open,
  entry,
  stores,
  onClose,
  onSaved,
}: {
  open: boolean;
  entry: HistoryEntry | null;
  stores: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [date, setDate] = useState("");
  const [store, setStore] = useState("");
  const [total, setTotal] = useState("");
  const [gst, setGst] = useState("");
  const [hst, setHst] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const isNew = entry === null;

  const fmt = (v: unknown) =>
    toNumber(v) === null ? "" : toNumber(v)!.toFixed(2);
  useEffect(() => {
    if (!open) return;
    setDate(new Date().toLocaleDateString("en-CA"));
    setStore("");
    setTotal(fmt(entry?.total_cost));
    setGst(fmt(entry?.gst));
    setHst(fmt(entry?.hst));
    setComment(entry?.comment ?? "");
  }, [open, entry]);

  const amount = (text: string) =>
    text.trim() === "" ? null : toNumber(text.replace(",", "."));

  const save = async () => {
    const receipt: Receipt = {
      total_cost: amount(total),
      gst: amount(gst),
      hst: amount(hst),
      comment,
    };
    setSaving(true);
    try {
      if (entry) await updateReceipt(entry.id, receipt);
      else await addHistory(new Date(`${date}T12:00:00`), store, receipt);
      toast.success(isNew ? "Trip added" : "Receipt saved");
      onSaved();
      onClose();
    } catch (error) {
      toast.error(error);
    }
    setSaving(false);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={entry ? storeName(entry) : "Log a Trip"}
      left={
        <Btn variant="plain" size="sm" onClick={onClose}>
          Cancel
        </Btn>
      }
      right={
        <Btn
          size="sm"
          loading={saving}
          disabled={isNew && !store}
          onClick={save}
        >
          Save
        </Btn>
      }
    >
      <div className="flex flex-col items-center py-4">
        <span className="text-sm text-gray-500">Receipt total</span>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-semibold text-gray-400">$</span>
          <input
            autoFocus={isNew || entry?.total_cost == null}
            inputMode="decimal"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            placeholder="0.00"
            className="w-48 bg-transparent text-5xl font-bold tabular-nums outline-none placeholder:text-gray-300"
          />
        </div>
      </div>

      <Group header="Tax" footer="Leave blank if it isn't on the receipt.">
        <Field label="GST">
          <input
            inputMode="decimal"
            value={gst}
            onChange={(e) => setGst(e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </Field>
        <Field label="HST">
          <input
            inputMode="decimal"
            value={hst}
            onChange={(e) => setHst(e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </Field>
      </Group>

      <Group className="mt-5">
        {entry ? (
          <>
            <Field label="Store">
              <span className="text-gray-500">{storeName(entry)}</span>
            </Field>
            <Field label="Date">
              <span className="text-gray-500">
                {new Date(entry.created_at).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </Field>
            {shopperOf(entry) && (
              <Field label="Shopper">
                <span className="text-gray-500">{shopperOf(entry)}</span>
              </Field>
            )}
          </>
        ) : (
          <>
            <Field label="Date">
              <input
                type="date"
                value={date}
                max={new Date().toLocaleDateString("en-CA")}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Store">
              <select
                className={selectClass}
                value={store}
                onChange={(e) => setStore(e.target.value)}
              >
                {!store && <option value="">Choose…</option>}
                {stores.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </>
        )}
      </Group>

      <Group header="Notes" className="mt-5">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What was it for?"
          rows={3}
          className="w-full resize-none bg-transparent px-4 py-3 text-[15px] outline-none placeholder:text-gray-400"
        />
      </Group>
    </Sheet>
  );
}
