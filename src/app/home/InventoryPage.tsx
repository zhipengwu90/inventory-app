"use client";
// Inventory: browse stock, count it ("Count Stock") and build a shopping list
// from low items. Mirrors the iOS InventoryView.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Circle,
  ListChecks,
  Package,
  Plus,
  Search,
  ShoppingCart,
  SlidersHorizontal,
} from "lucide-react";
import {
  categoryOf,
  colorFor,
  Item,
  minOf,
  needOf,
  ShoppingEntry,
  stockOf,
} from "../utils/types";
import {
  addToShoppingList,
  fetchItems,
  fetchShoppingList,
  recordCount,
  replaceShoppingList,
  updateMinAmount,
} from "../utils/sql/restockApi";
import {
  AdjustSheet,
  ItemDetailSheet,
  ItemEditorSheet,
} from "../components/restock/ItemSheets";
import {
  Badge,
  Btn,
  Confirm,
  Empty,
  Spinner,
  StatTile,
  Stepper,
  Thumb,
} from "../components/restock/ui";
import { useToast } from "../components/restock/Toast";
import { useLookups } from "../components/restock/useLookups";
import { LIST_CHANGED } from "../components/NavBar";
import { setNavLock } from "../components/restock/navLock";

type Mode = "browse" | "count" | "plan";
type Filter =
  { kind: "all" } | { kind: "low" } | { kind: "category"; name: string };

export default function InventoryPage() {
  const router = useRouter();
  const toast = useToast();
  const lookups = useLookups();

  const [items, setItems] = useState<Item[] | null>(null);
  const [list, setList] = useState<ShoppingEntry[]>([]);
  const [mode, setMode] = useState<Mode>("browse");
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [search, setSearch] = useState("");

  // Count mode drafts and plan selections, keyed by item id.
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [minimums, setMinimums] = useState<Record<number, number>>({});
  const [plan, setPlan] = useState<Record<number, number>>({});

  const [detail, setDetail] = useState<Item | null>(null);
  const [editing, setEditing] = useState<{ item: Item | null } | null>(null);
  const [adjusting, setAdjusting] = useState<Item | null>(null);
  const [confirm, setConfirm] = useState<
    "discard" | "trip" | "replace" | "stale" | null
  >(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextItems, nextList] = await Promise.all([
        fetchItems(),
        fetchShoppingList(),
      ]);
      setItems(nextItems);
      setList(nextList);
      return { items: nextItems, list: nextList };
    } catch (error) {
      toast.error(error);
      setItems((current) => current ?? []);
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onList = useMemo(() => new Set(list.map((e) => e.item_id)), [list]);
  // Items already checked off, meaning a trip is under way.
  const picked = list.filter((e) => e.shopped).length;
  const low = useMemo(
    () => (items ?? []).filter((i) => needOf(i) > 0),
    [items],
  );

  const categories = useMemo(() => {
    const used = new Set((items ?? []).map(categoryOf));
    const known = lookups.categories.filter((c) => used.has(c));
    return [
      ...known,
      ...Array.from(used)
        .filter((c) => !known.includes(c))
        .sort(),
    ];
  }, [items, lookups.categories]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (items ?? []).filter((item) => {
      if (filter.kind === "low" && needOf(item) === 0) return false;
      if (filter.kind === "category" && categoryOf(item) !== filter.name)
        return false;
      return (
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.item_place ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, filter, search]);

  const changeCount = useMemo(() => {
    const byId = new Map((items ?? []).map((i) => [i.id, i]));
    const ids = new Set<number>();
    Object.entries(counts).forEach(
      ([id, v]) =>
        byId.get(+id) && stockOf(byId.get(+id)!) !== v && ids.add(+id),
    );
    Object.entries(minimums).forEach(
      ([id, v]) => byId.get(+id) && minOf(byId.get(+id)!) !== v && ids.add(+id),
    );
    return ids.size;
  }, [items, counts, minimums]);

  // Warn before leaving the page with unsaved counts.
  useEffect(() => {
    if (mode !== "count" || changeCount === 0) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [mode, changeCount]);

  // Block switching tabs (and going back) while counting.
  useEffect(() => {
    if (mode !== "count") return;
    setNavLock({ locked: true, reason: "Finish counting first" });
    return () => setNavLock({ locked: false });
  }, [mode]);

  // Opened from the empty Shopping page with ?plan=1.
  useEffect(() => {
    if (
      items &&
      new URLSearchParams(window.location.search).get("plan") === "1"
    ) {
      startPlanning();
      router.replace("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // MARK: Actions

  const endMode = () => {
    setMode("browse");
    setCounts({});
    setMinimums({});
    setPlan({});
  };

  const requestCounting = () => {
    // Finishing an open trip later would add bought amounts on top of the new count.
    if (list.length > 0) setConfirm("trip");
    else startCounting();
  };

  const startCounting = () => {
    endMode();
    setMode("count");
  };

  const startPlanning = () => {
    setPlan(Object.fromEntries(low.map((i) => [i.id, needOf(i)])));
    setFilter({ kind: "all" });
    setMode("plan");
  };

  const saveCounts = async () => {
    setSaving(true);
    const byId = new Map((items ?? []).map((i) => [i.id, i]));
    let saved = false;
    try {
      await Promise.all([
        ...Object.entries(minimums)
          .filter(([id, v]) => byId.get(+id) && minOf(byId.get(+id)!) !== v)
          .map(([id, v]) => updateMinAmount(+id, v)),
        ...Object.entries(counts)
          .filter(([id, v]) => byId.get(+id) && stockOf(byId.get(+id)!) !== v)
          .map(([id, v]) => recordCount(+id, v, stockOf(byId.get(+id)!))),
      ]);
      toast.success("Inventory saved");
      endMode();
      saved = true;
    } catch (error) {
      toast.error(error);
    }
    const next = await load();
    setSaving(false);
    if (saved && next && next.list.length > 0) setConfirm("stale");
  };

  // An existing list was built from the old minimum and doesn't update itself.
  const onItemSaved = async (before: Item | null) => {
    const next = await load();
    const after = next?.items.find((i) => i.id === before?.id);
    if (before && after && minOf(after) !== minOf(before) && next!.list.length > 0)
      setConfirm("stale");
  };

  const createList = async () => {
    setSaving(true);
    const names = new Map((items ?? []).map((i) => [i.id, i.name]));
    const rows = Object.entries(plan)
      .sort(([a], [b]) =>
        (names.get(+a) ?? "").localeCompare(names.get(+b) ?? ""),
      )
      .map(([id, amount]) => ({ item_id: +id, amount: Math.max(amount, 1) }));
    try {
      await replaceShoppingList(rows);
      window.dispatchEvent(new Event(LIST_CHANGED));
      toast.success(`Shopping list ready · ${rows.length} items`);
      endMode();
      router.push("/shoppinglist");
    } catch (error) {
      toast.error(error);
    }
    setSaving(false);
  };

  const addOne = async (item: Item) => {
    try {
      await addToShoppingList(item.id, Math.max(needOf(item), 1));
      window.dispatchEvent(new Event(LIST_CHANGED));
      toast.success(`${item.name} added to list`);
      setList(await fetchShoppingList());
    } catch (error) {
      toast.error(error);
    }
  };

  // MARK: Render

  if (!items) return <Spinner />;

  const sections = categories
    .map((name) => ({
      name,
      items: visible.filter((i) => categoryOf(i) === name),
    }))
    .filter((s) => s.items.length > 0);

  const title =
    mode === "count"
      ? "Count Stock"
      : mode === "plan"
        ? "Build Shopping List"
        : "Inventory";

  return (
    <div>
      {/* Title and actions */}
      <div className="mb-4 flex items-end justify-between gap-3">
        <h1 className="text-[34px] font-bold leading-tight sm:text-3xl">
          {title}
        </h1>
        {mode === "browse" ? (
          <div className="flex gap-2">
            <Btn
              variant="outline"
              onClick={requestCounting}
              aria-label="Count Stock"
            >
              <ListChecks className="h-[18px] w-[18px]" />
              <span className="sm:hidden">Count Stock</span>
            </Btn>
            <Btn
              onClick={() => setEditing({ item: null })}
              aria-label="New Item"
            >
              <Plus className="h-[18px] w-[18px]" />
              <span className="sm:hidden">New Item</span>
            </Btn>
          </div>
        ) : (
          <Btn
            variant="outline"
            onClick={() =>
              mode === "count" && changeCount > 0
                ? setConfirm("discard")
                : endMode()
            }
          >
            Cancel
          </Btn>
        )}
      </div>

      {mode === "browse" && !search && (
        <div className="mb-4 flex gap-3">
          <StatTile
            icon={<Package className="h-5 w-5" />}
            value={items.length}
            label="Items"
            tint="#249E6B"
            onClick={() => setFilter({ kind: "all" })}
          />
          <StatTile
            icon={<AlertTriangle className="h-5 w-5" />}
            value={low.length}
            label="Running low"
            tint="#FF9500"
            active={filter.kind === "low"}
            onClick={() =>
              setFilter(
                filter.kind === "low" ? { kind: "all" } : { kind: "low" },
              )
            }
          />
          <StatTile
            icon={<ShoppingCart className="h-5 w-5" />}
            value={list.length}
            label="On list"
            tint="#5856D6"
            onClick={() => router.push("/shoppinglist")}
          />
        </div>
      )}

      {mode !== "browse" && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-brand/10 p-3.5 text-sm text-gray-600">
          {mode === "count" ? (
            <ListChecks className="h-6 w-6 shrink-0 text-brand" />
          ) : (
            <ShoppingCart className="h-6 w-6 shrink-0 text-brand" />
          )}
          {mode === "count"
            ? "Tap − or + to set what's on the shelf. Tap an item to change its minimum."
            : "Low items are already selected. Tap to add or remove, and adjust how many to buy."}
        </div>
      )}

      {/* Search and filters stay pinned while scrolling */}
      <div className="sticky top-14 z-20 md:top-0 -mx-6 bg-[#F2F2F7]/90 px-6 pb-3 pt-1 backdrop-blur sm:-mx-4 sm:px-4">
        <div className="flex items-center gap-2 rounded-xl bg-black/[0.06] px-3">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items or locations"
            className="h-10 w-full bg-transparent text-[15px] outline-none placeholder:text-gray-500"
          />
        </div>
        <div className="mt-2.5 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
          <Chip
            label="All"
            count={items.length}
            tint="#249E6B"
            active={filter.kind === "all"}
            onClick={() => setFilter({ kind: "all" })}
          />
          <Chip
            label="Low"
            count={low.length}
            tint="#FF9500"
            active={filter.kind === "low"}
            onClick={() =>
              setFilter(
                filter.kind === "low" ? { kind: "all" } : { kind: "low" },
              )
            }
          />
          {categories.map((name) => {
            const active = filter.kind === "category" && filter.name === name;
            return (
              <Chip
                key={name}
                label={name}
                count={items.filter((i) => categoryOf(i) === name).length}
                tint={colorFor(name)}
                active={active}
                onClick={() =>
                  setFilter(
                    active ? { kind: "all" } : { kind: "category", name },
                  )
                }
              />
            );
          })}
        </div>
      </div>

      {/* Item sections */}
      {items.length === 0 ? (
        <Empty
          icon={<Package className="h-12 w-12" />}
          title="No Items Yet"
          message="Add the things you keep at home to start tracking stock."
        >
          <Btn onClick={() => setEditing({ item: null })}>Add First Item</Btn>
        </Empty>
      ) : sections.length === 0 ? (
        <Empty
          icon={<Search className="h-12 w-12" />}
          title={search ? `No Results for “${search}”` : "All Stocked Up"}
          message={
            search
              ? "Check the spelling or try a new search."
              : "Nothing here needs restocking."
          }
        />
      ) : (
        <div className="mt-2 space-y-5 pb-20">
          {sections.map((section) => (
            <section key={section.name}>
              <div className="mb-1.5 flex items-center gap-2 px-4 text-sm font-semibold text-gray-500">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: colorFor(section.name) }}
                />
                {section.name}
                <span className="ml-auto text-gray-400">
                  {section.items.length}
                </span>
              </div>
              <div className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white">
                {section.items.map((item) =>
                  mode === "browse" ? (
                    <BrowseRow
                      key={item.id}
                      item={item}
                      onList={onList.has(item.id)}
                      onOpen={() => setDetail(item)}
                    />
                  ) : mode === "count" ? (
                    <CountRow
                      key={item.id}
                      item={item}
                      count={counts[item.id] ?? stockOf(item) ?? 0}
                      minimum={minimums[item.id] ?? minOf(item)}
                      changed={
                        (counts[item.id] !== undefined &&
                          counts[item.id] !== stockOf(item)) ||
                        (minimums[item.id] !== undefined &&
                          minimums[item.id] !== minOf(item))
                      }
                      onCount={(v) =>
                        setCounts((c) => ({ ...c, [item.id]: v }))
                      }
                      onAdjust={() => setAdjusting(item)}
                    />
                  ) : (
                    <PlanRow
                      key={item.id}
                      item={item}
                      amount={plan[item.id]}
                      onChange={(amount) =>
                        setPlan((p) => {
                          const next = { ...p };
                          if (amount === undefined) delete next[item.id];
                          else next[item.id] = amount;
                          return next;
                        })
                      }
                    />
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Bottom action bar for count and plan modes */}
      {mode !== "browse" && (
        <div className="fixed inset-x-0 bottom-6 z-30 flex justify-center px-6 md:bottom-24">
          {/* Solid backing so the list doesn't show through a disabled button */}
          <div className="w-full max-w-md rounded-full bg-[#F2F2F7]">
            {mode === "count" ? (
              <Btn
                size="lg"
                className="w-full shadow-lg"
                disabled={changeCount === 0}
                loading={saving}
                onClick={saveCounts}
              >
                <Check className="h-5 w-5" />
                {changeCount === 0
                  ? "No Changes"
                  : `Save ${changeCount} Change${changeCount === 1 ? "" : "s"}`}
              </Btn>
            ) : (
              <Btn
                size="lg"
                className="w-full shadow-lg"
                disabled={Object.keys(plan).length === 0}
                loading={saving}
                onClick={() =>
                  list.length > 0 ? setConfirm("replace") : createList()
                }
              >
                <ShoppingCart className="h-5 w-5" />
                {Object.keys(plan).length === 0
                  ? "Select Items"
                  : `Create List · ${Object.keys(plan).length} Items`}
              </Btn>
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ItemDetailSheet
        item={detail ? (items.find((i) => i.id === detail.id) ?? null) : null}
        onList={!!detail && onList.has(detail.id)}
        onClose={() => setDetail(null)}
        onEdit={() => setEditing({ item: detail })}
        onAddToList={addOne}
      />
      <ItemEditorSheet
        open={!!editing}
        item={editing?.item ?? null}
        lookups={lookups}
        onClose={() => setEditing(null)}
        onSaved={() => onItemSaved(editing?.item ?? null)}
        onDeleted={() => {
          setDetail(null);
          load();
        }}
        onLookupsChanged={lookups.reload}
      />
      <AdjustSheet
        item={adjusting}
        count={
          adjusting ? (counts[adjusting.id] ?? stockOf(adjusting) ?? 0) : 0
        }
        minimum={adjusting ? (minimums[adjusting.id] ?? minOf(adjusting)) : 0}
        onChange={(count, minimum) => {
          if (!adjusting) return;
          setCounts((c) => ({ ...c, [adjusting.id]: count }));
          setMinimums((m) => ({ ...m, [adjusting.id]: minimum }));
        }}
        onClose={() => setAdjusting(null)}
      />
      <Confirm
        open={confirm === "discard"}
        title="Discard your changes?"
        message={`You've changed ${changeCount} item${changeCount === 1 ? "" : "s"}. These counts haven't been saved.`}
        confirmLabel="Discard Changes"
        destructive
        onConfirm={endMode}
        onClose={() => setConfirm(null)}
      />
      <Confirm
        open={confirm === "trip"}
        title="Shopping Trip Not Finished"
        message={`Your shopping list still has ${list.length} item${list.length === 1 ? "" : "s"}. If you've already bought them, finish the trip in Shopping first so they aren't counted twice.`}
        confirmLabel="Go to Shopping"
        onConfirm={() => router.push("/shoppinglist")}
        onClose={() => setConfirm(null)}
        extra={
          <Btn
            variant="tinted"
            onClick={() => {
              setConfirm(null);
              startCounting();
            }}
          >
            Count Anyway
          </Btn>
        }
      />
      <Confirm
        open={confirm === "replace"}
        title="Replace the current shopping list?"
        message={`Your shopping list already has ${list.length} items. Creating a new list removes them.${
          picked > 0
            ? ` Shopping has started, and the ${picked} item${picked === 1 ? "" : "s"} checked off so far will be lost.`
            : ""
        }`}
        confirmLabel="Replace List"
        destructive
        onConfirm={createList}
        onClose={() => setConfirm(null)}
      />
      <Confirm
        open={confirm === "stale"}
        title="Shopping List Is Out of Date"
        message={`Your shopping list was created before these changes, so it won't reflect them. Rebuild the list to include them.${
          picked > 0
            ? ` Shopping has started: rebuilding clears the ${picked} item${picked === 1 ? "" : "s"} checked off so far.`
            : ""
        }`}
        confirmLabel="Rebuild List"
        destructive={picked > 0}
        onConfirm={() => {
          setDetail(null);
          startPlanning();
        }}
        onClose={() => setConfirm(null)}
        showCancel={false}
        extra={
          <Btn variant="plain" onClick={() => setConfirm(null)}>
            Keep Current List
          </Btn>
        }
      />
    </div>
  );
}

// MARK: Pieces

function Chip({
  label,
  count,
  tint,
  active,
  onClick,
}: {
  label: string;
  count: number;
  tint: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active ? "text-white shadow-sm" : "bg-white text-gray-900"
      }`}
      style={active ? { background: tint } : undefined}
    >
      {label}
      <span className={active ? "text-white/80" : "text-gray-400"}>
        {count}
      </span>
    </button>
  );
}

function StockReadout({ item }: { item: Item }) {
  const stock = stockOf(item);
  const isLow = needOf(item) > 0;
  return (
    <div
      className="text-right"
      aria-label={`${stock ?? "Not counted"} in stock, minimum ${minOf(item)}`}
    >
      <div
        className={`text-xl font-semibold tabular-nums leading-tight ${isLow ? "text-low" : ""}`}
      >
        {stock ?? "—"}
      </div>
      <div className="text-[11px] text-gray-500">min {minOf(item)}</div>
    </div>
  );
}

function BrowseRow({
  item,
  onList,
  onOpen,
}: {
  item: Item;
  onList: boolean;
  onOpen: () => void;
}) {
  const need = needOf(item);
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-black/[0.02]"
    >
      <Thumb
        name={item.name}
        url={item.img_url}
        category={item.item_category}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{item.name}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
          {need > 0 && <Badge tint="#FF9500">Buy {need}</Badge>}
          {onList && (
            <ShoppingCart
              className="h-3.5 w-3.5 text-[#5856D6]"
              aria-label="On shopping list"
            />
          )}
          <span className="truncate">
            {item.item_place ?? item.shopping_place}
          </span>
        </div>
      </div>
      <StockReadout item={item} />
    </button>
  );
}

function CountRow({
  item,
  count,
  minimum,
  changed,
  onCount,
  onAdjust,
}: {
  item: Item;
  count: number;
  minimum: number;
  changed: boolean;
  onCount: (value: number) => void;
  onAdjust: () => void;
}) {
  // What would still need buying at the count being entered.
  const need = Math.max(0, minimum - count);
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <button
        onClick={onAdjust}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <Thumb
          name={item.name}
          url={item.img_url}
          category={item.item_category}
          size={38}
        />
        <div className="min-w-0">
          <div className="truncate font-medium">{item.name}</div>
          <div
            className={`flex items-center gap-1 text-xs ${changed ? "text-brand" : "text-gray-500"}`}
          >
            Min {minimum}
            {need > 0 && (
              <span className="font-semibold text-low">· Buy {need}</span>
            )}
            <SlidersHorizontal className="h-3 w-3" />
          </div>
        </div>
      </button>
      <Stepper
        value={count}
        onChange={onCount}
        highlighted={changed}
        label={`${item.name} count`}
      />
    </div>
  );
}

function PlanRow({
  item,
  amount,
  onChange,
}: {
  item: Item;
  amount: number | undefined;
  onChange: (amount: number | undefined) => void;
}) {
  const selected = amount !== undefined;
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <button
        onClick={() =>
          onChange(selected ? undefined : Math.max(needOf(item), 1))
        }
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        aria-pressed={selected}
      >
        {selected ? (
          <Check
            className="h-6 w-6 shrink-0 rounded-full bg-brand p-1 text-white"
            strokeWidth={3}
          />
        ) : (
          <Circle className="h-6 w-6 shrink-0 text-gray-300" />
        )}
        <Thumb
          name={item.name}
          url={item.img_url}
          category={item.item_category}
          size={38}
        />
        <div className="min-w-0">
          <div className="truncate font-medium">{item.name}</div>
          <div
            className={`text-xs ${needOf(item) > 0 ? "text-low" : "text-gray-500"}`}
          >
            Have {stockOf(item) ?? 0} · min {minOf(item)}
          </div>
        </div>
      </button>
      {selected && (
        <Stepper
          value={amount!}
          min={1}
          onChange={onChange}
          label={`${item.name} amount`}
        />
      )}
    </div>
  );
}
