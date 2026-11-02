"use client";
// Shopping list: check items off as you shop (saved instantly), adjust amounts,
// add items, and finish the trip. Mirrors the iOS ShoppingListView.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Check,
  Circle,
  MapPin,
  Plus,
  PlusCircle,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  X,
} from "lucide-react";
import {
  colorFor,
  currency,
  Item,
  lineTotal,
  locationOf,
  minOf,
  needOf,
  ShoppingEntry,
  stockOf,
  storeOf,
} from "../utils/types";
import {
  addToShoppingList,
  fetchAssignees,
  fetchItems,
  fetchShoppingList,
  finishTrip,
  removeFromShoppingList,
  setShopped,
  setShoppingAmount,
} from "../utils/sql/restockApi";
import {
  ItemDetailSheet,
  ItemEditorSheet,
} from "../components/restock/ItemSheets";
import {
  BigStepper,
  Btn,
  Confirm,
  Empty,
  Sheet,
  Spinner,
  Stepper,
  Thumb,
} from "../components/restock/ui";
import { useToast } from "../components/restock/Toast";
import { useLookups } from "../components/restock/useLookups";
import { useStore } from "../components/restock/useStore";
import {
  AssignBar,
  StoreContact,
} from "../components/restock/ShoppingExtras";
import { LIST_CHANGED } from "../components/NavBar";

export default function ShoppingPage() {
  const router = useRouter();
  const toast = useToast();
  const lookups = useLookups();
  // Shoppers only check items off and finish the trip.
  const { isAdmin, current } = useStore();

  const [list, setList] = useState<ShoppingEntry[] | null>(null);
  // Who the list is assigned to; shoppers only see it while assigned.
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [amountFor, setAmountFor] = useState<ShoppingEntry | null>(null);
  const [detail, setDetail] = useState<Item | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextList, nextItems, nextAssignees] = await Promise.all([
        fetchShoppingList(),
        isAdmin ? fetchItems() : Promise.resolve([]),
        fetchAssignees(),
      ]);
      setList(nextList);
      setItems(nextItems);
      setAssigneeIds(nextAssignees);
    } catch (error) {
      toast.error(error);
      setList((current) => current ?? []);
    }
    window.dispatchEvent(new Event(LIST_CHANGED));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = (id: number, change: Partial<ShoppingEntry>) =>
    setList(
      (current) =>
        current?.map((e) => (e.id === id ? { ...e, ...change } : e)) ?? null,
    );

  // Changes save immediately; the screen updates first and rolls back on failure.
  const toggle = async (entry: ShoppingEntry) => {
    update(entry.id, { shopped: !entry.shopped });
    try {
      await setShopped(entry.id, !entry.shopped);
      window.dispatchEvent(new Event(LIST_CHANGED));
    } catch (error) {
      update(entry.id, { shopped: entry.shopped });
      toast.error(error);
    }
  };

  const changeAmount = async (entry: ShoppingEntry, amount: number) => {
    update(entry.id, { amount });
    try {
      await setShoppingAmount(entry.id, amount);
    } catch (error) {
      update(entry.id, { amount: entry.amount });
      toast.error(error);
    }
  };

  const remove = async (entry: ShoppingEntry) => {
    setList((current) => current?.filter((e) => e.id !== entry.id) ?? null);
    try {
      await removeFromShoppingList(entry.id);
      window.dispatchEvent(new Event(LIST_CHANGED));
    } catch (error) {
      toast.error(error);
      load();
    }
  };

  const finish = async (alsoBought: Set<number> = new Set()) => {
    if (!list) return;
    setFinishing(true);
    try {
      const logged = await finishTrip(alsoBought);
      window.dispatchEvent(new Event(LIST_CHANGED));
      if (logged) {
        toast.success("Trip saved · add the receipt total in History");
        router.push("/shoppingHistory");
      } else {
        toast.success("Shopping list cleared");
        await load();
      }
    } catch (error) {
      toast.error(error);
      await load();
    }
    setFinishing(false);
  };

  const picked = useMemo(() => (list ?? []).filter((e) => e.shopped), [list]);
  const unpicked = useMemo(
    () => (list ?? []).filter((e) => !e.shopped),
    [list],
  );

  const sections = useMemo(() => {
    const byStore = new Map<string, ShoppingEntry[]>();
    (list ?? []).forEach((e) =>
      byStore.set(storeOf(e), [...(byStore.get(storeOf(e)) ?? []), e]),
    );
    const order = [
      ...lookups.stores.filter((s) => byStore.has(s)),
      ...Array.from(byStore.keys())
        .filter((s) => !lookups.stores.includes(s))
        .sort(),
    ];
    return order.map((store) => ({ store, entries: byStore.get(store) ?? [] }));
  }, [list, lookups.stores]);

  if (!list) return <Spinner />;

  const estimate = list.reduce((sum, e) => sum + lineTotal(e), 0);
  const allPicked = picked.length === list.length;

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-3">
        <h1 className="text-[34px] font-bold leading-tight sm:text-3xl">
          Shopping
        </h1>
        <div className="flex items-center gap-2">
          {current && <StoreContact store={current} />}
          {isAdmin && (
            <Btn onClick={() => setAdding(true)} aria-label="Add Item">
              <Plus className="h-[18px] w-[18px]" />
              <span className="sm:hidden">Add Item</span>
            </Btn>
          )}
        </div>
      </div>

      {isAdmin && current && list.length > 0 && (
        <div className="mb-5">
          <AssignBar
            storeId={current.store_id}
            assigneeIds={assigneeIds}
            onChanged={setAssigneeIds}
          />
        </div>
      )}

      {list.length === 0 && !isAdmin ? (
        <Empty
          icon={<ShoppingCart className="h-12 w-12" />}
          title="No List Assigned to You"
          message="When an admin assigns you a shopping list, it shows up here."
        />
      ) : list.length === 0 ? (
        <Empty
          icon={<ShoppingCart className="h-12 w-12" />}
          title="Your List Is Empty"
          message="Build a list from items that are running low, or add things one by one."
        >
          <Btn onClick={() => router.push("/?plan=1")}>
            Build from Inventory
          </Btn>
          <Btn variant="plain" onClick={() => setAdding(true)}>
            Add an Item
          </Btn>
        </Empty>
      ) : (
        <div className="space-y-5 pb-28">
          {/* Progress */}
          <div className="rounded-2xl bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-2xl font-bold">
                  {allPicked
                    ? "All picked!"
                    : `${list.length - picked.length} to go`}
                </div>
                <div className="text-sm text-gray-500">
                  {picked.length} of {list.length} items in the cart
                </div>
              </div>
              {estimate > 0 && (
                <div className="text-right">
                  <div className="text-xl font-semibold tabular-nums">
                    {currency(estimate)}
                  </div>
                  <div className="text-xs text-gray-500">estimated</div>
                </div>
              )}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5">
              <div
                className={`h-full rounded-full transition-all ${allPicked ? "bg-green-500" : "bg-brand"}`}
                style={{ width: `${(picked.length / list.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Stores, grouped by location inside */}
          {sections.map(({ store, entries }) => {
            const subtotal = entries.reduce((sum, e) => sum + lineTotal(e), 0);
            const locations = Array.from(new Set(entries.map(locationOf))).sort(
              (a, b) =>
                a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b),
            );
            return (
              <section key={store}>
                <div className="mb-1.5 flex items-center gap-2 px-4 text-sm font-semibold text-gray-500">
                  <Store
                    className="h-4 w-4"
                    style={{ color: colorFor(store) }}
                  />
                  {store}
                  <span className="text-gray-400">
                    {entries.filter((e) => e.shopped).length}/{entries.length}
                  </span>
                  {subtotal > 0 && (
                    <span className="ml-auto tabular-nums">
                      {currency(subtotal)}
                    </span>
                  )}
                </div>
                <div className="overflow-hidden rounded-2xl bg-white">
                  {locations.map((location) => (
                    <div key={location}>
                      {(locations.length > 1 || location !== "Other") && (
                        <div className="flex items-center gap-1 px-4 pb-1 pt-3 text-xs font-semibold text-gray-500">
                          <MapPin className="h-3 w-3" />
                          {location}
                        </div>
                      )}
                      <div className="divide-y divide-black/5">
                        {entries
                          .filter((e) => locationOf(e) === location)
                          .map((entry) => (
                            <ShoppingRow
                              key={entry.id}
                              entry={entry}
                              onToggle={() => toggle(entry)}
                              onAmount={
                                isAdmin ? () => setAmountFor(entry) : undefined
                              }
                              onOpen={
                                isAdmin
                                  ? () =>
                                      setDetail(
                                        items.find(
                                          (i) => i.id === entry.item_id,
                                        ) ?? entry.item_list,
                                      )
                                  : undefined
                              }
                              onRemove={isAdmin ? () => remove(entry) : undefined}
                            />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {list.length > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-30 flex justify-center px-6 md:bottom-24">
          <Btn
            size="lg"
            className="w-full max-w-md shadow-lg"
            loading={finishing}
            // Admins review unchecked items so nothing bought is missed. For
            // shoppers, unchecked means not found and never goes into stock.
            onClick={() =>
              unpicked.length === 0 || !isAdmin
                ? setConfirmFinish(true)
                : setReviewing(true)
            }
          >
            <BadgeCheck className="h-5 w-5" />
            {picked.length === 0
              ? "Finish Trip"
              : `Finish Trip · ${picked.length} Picked`}
          </Btn>
        </div>
      )}

      {/* Dialogs */}
      <AmountSheet
        entry={amountFor}
        onClose={() => setAmountFor(null)}
        onSave={changeAmount}
      />
      <AddItemSheet
        open={adding}
        items={items}
        onList={new Set(list.map((e) => e.item_id))}
        onClose={() => setAdding(false)}
        onAdded={load}
        onItemsChanged={async () => setItems(await fetchItems())}
        lookups={lookups}
      />
      <ReviewSheet
        open={reviewing}
        unpicked={unpicked}
        pickedCount={picked.length}
        onClose={() => setReviewing(false)}
        onFinish={(alsoBought) => {
          setReviewing(false);
          finish(alsoBought);
        }}
      />
      <Confirm
        open={confirmFinish}
        title="Finish this shopping trip?"
        message={finishMessage(picked.length, unpicked.length)}
        confirmLabel={picked.length === 0 ? "Clear List" : "Finish Trip"}
        onConfirm={() => finish()}
        onClose={() => setConfirmFinish(false)}
      />
      <ItemDetailSheet
        item={detail}
        onList
        onClose={() => setDetail(null)}
        onEdit={() => setEditing(detail)}
        onAddToList={async () => {}}
      />
      <ItemEditorSheet
        open={!!editing}
        item={editing}
        lookups={lookups}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setDetail(null);
          load();
        }}
        onDeleted={() => {
          setDetail(null);
          load();
        }}
        onLookupsChanged={lookups.reload}
      />
    </div>
  );
}

// MARK: Rows

const finishMessage = (picked: number, unpicked: number) => {
  const items = (n: number) => `${n} item${n === 1 ? "" : "s"}`;
  if (unpicked === 0)
    return `All ${items(picked)} will be added to stock and the trip will be saved to History.`;
  if (picked === 0)
    return "Nothing is checked off, so nothing will be added to stock. The list will be cleared.";
  return `${picked} checked ${picked === 1 ? "item" : "items"} will be added to stock. ${unpicked} not checked off will be saved as not found.`;
};

function ShoppingRow({
  entry,
  onToggle,
  onAmount,
  onOpen,
  onRemove,
}: {
  entry: ShoppingEntry;
  onToggle: () => void;
  /** Left out for shoppers, who can't change the list. */
  onAmount?: () => void;
  onOpen?: () => void;
  onRemove?: () => void;
}) {
  const item = entry.item_list;
  const done = !!entry.shopped;
  return (
    <div className="group flex items-center gap-2 py-1.5 pl-2 pr-3">
      <button
        onClick={onToggle}
        aria-label={done ? `Unpick ${item?.name}` : `Pick ${item?.name}`}
        aria-pressed={done}
        className="flex h-11 w-11 shrink-0 items-center justify-center"
      >
        {done ? (
          <Check
            className="h-7 w-7 rounded-full bg-green-500 p-1 text-white"
            strokeWidth={3}
          />
        ) : (
          <Circle className="h-7 w-7 text-gray-300" />
        )}
      </button>
      <button
        onClick={onOpen ?? onToggle}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <Thumb
          name={item?.name ?? "?"}
          url={item?.img_url}
          category={item?.item_category}
          size={40}
          dim={done}
        />
        <div className="min-w-0">
          <div
            className={`line-clamp-2 font-medium ${done ? "text-gray-400 line-through" : ""}`}
          >
            {item?.name ?? "Unknown item"}
          </div>
          {item?.price != null && (
            <div className="text-xs text-gray-500">
              {currency(Number(item.price))} each
            </div>
          )}
        </div>
      </button>
      <button
        onClick={onAmount}
        disabled={!onAmount}
        aria-label={`Quantity ${entry.amount}${onAmount ? ", change" : ""}`}
        className={`rounded-full px-3 py-1.5 text-sm font-bold tabular-nums ${done ? "bg-brand/5 text-gray-400" : "bg-brand/15 text-brand"}`}
      >
        ×{entry.amount}
      </button>
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label={`Remove ${item?.name} from list`}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// MARK: Dialogs

function AmountSheet({
  entry,
  onClose,
  onSave,
}: {
  entry: ShoppingEntry | null;
  onClose: () => void;
  onSave: (entry: ShoppingEntry, amount: number) => void;
}) {
  const [amount, setAmount] = useState(1);
  useEffect(() => {
    if (entry) setAmount(Math.max(entry.amount, 1));
  }, [entry]);
  if (!entry) return null;
  return (
    <Sheet
      open
      onClose={onClose}
      title={entry.item_list?.name ?? "Amount"}
      maxWidth="xs"
      right={
        <Btn
          size="sm"
          onClick={() => {
            onSave(entry, amount);
            onClose();
          }}
        >
          Done
        </Btn>
      }
    >
      <div className="py-8">
        <BigStepper
          title="How many to buy?"
          value={amount}
          onChange={setAmount}
          min={1}
        />
      </div>
    </Sheet>
  );
}

function AddItemSheet({
  open,
  items,
  onList,
  onClose,
  onAdded,
  onItemsChanged,
  lookups,
}: {
  open: boolean;
  items: Item[];
  onList: Set<number>;
  onClose: () => void;
  onAdded: () => void;
  onItemsChanged: () => Promise<void>;
  lookups: ReturnType<typeof useLookups>;
}) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [amount, setAmount] = useState(1);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pendingName, setPendingName] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedId(null);
    }
  }, [open]);

  // Select an item right after it's created here.
  useEffect(() => {
    if (!pendingName) return;
    const created = items.find((i) => i.name === pendingName);
    if (created) {
      setSearch("");
      setSelectedId(created.id);
      setAmount(1);
      setPendingName(null);
    }
  }, [items, pendingName]);

  const query = search.trim();
  // Low items first, then everything else; items already on the list last.
  const rank = (item: Item) =>
    onList.has(item.id) ? 2 : needOf(item) > 0 ? 0 : 1;
  const results = items
    .filter((i) => !query || i.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  const selected = items.find((i) => i.id === selectedId);

  const add = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await addToShoppingList(selected.id, amount);
      window.dispatchEvent(new Event(LIST_CHANGED));
      toast.success(`${selected.name} added to list`);
      onAdded();
      onClose();
    } catch (error) {
      toast.error(error);
    }
    setSaving(false);
  };

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title="Add to List"
        left={
          <Btn variant="plain" size="sm" onClick={onClose}>
            Cancel
          </Btn>
        }
        footer={
          selected && (
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">
                  {selected.name}
                </div>
                <div className="text-xs text-gray-500">Quantity</div>
              </div>
              <Stepper
                value={amount}
                min={1}
                onChange={setAmount}
                label="Quantity"
              />
              <Btn loading={saving} onClick={add}>
                Add
              </Btn>
            </div>
          )
        }
      >
        {/* Search and "create" stay pinned at the top */}
        <div className="sticky -top-4 z-10 -mx-4 -mt-4 space-y-2 bg-[#F2F2F7] px-4 pb-3 pt-4">
          <div className="flex items-center gap-2 rounded-xl bg-black/[0.06] px-3">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items"
              className="h-10 w-full bg-transparent text-[15px] outline-none placeholder:text-gray-500"
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setCreating(true)}
            className="flex w-full items-center gap-2.5 rounded-xl bg-brand/10 px-4 py-3 text-left text-sm font-semibold text-brand"
          >
            <PlusCircle className="h-5 w-5 shrink-0" />
            <span className="truncate">
              {query ? `Create “${query}”` : "Can't find it? Create a new item"}
            </span>
          </button>
        </div>

        <div className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white">
          {results.map((item) => {
            const already = onList.has(item.id);
            return (
              <button
                key={item.id}
                disabled={already}
                onClick={() => {
                  setSelectedId(item.id);
                  setAmount(Math.max(needOf(item), 1));
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left disabled:opacity-50"
              >
                <Thumb
                  name={item.name}
                  url={item.img_url}
                  category={item.item_category}
                  size={38}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate">{item.name}</div>
                  <div
                    className={`text-xs ${needOf(item) > 0 && !already ? "text-low" : "text-gray-500"}`}
                  >
                    {already
                      ? "Already on list"
                      : `Have ${stockOf(item) ?? 0} · min ${minOf(item)}`}
                  </div>
                </div>
                {selectedId === item.id && (
                  <Check
                    className="h-6 w-6 rounded-full bg-brand p-1 text-white"
                    strokeWidth={3}
                  />
                )}
              </button>
            );
          })}
          {results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              No items match “{query}”.
            </div>
          )}
        </div>
      </Sheet>

      <ItemEditorSheet
        open={creating}
        item={null}
        initialName={query}
        lookups={lookups}
        onClose={() => setCreating(false)}
        onSaved={async (name) => {
          setPendingName(name);
          await onItemsChanged();
        }}
        onLookupsChanged={lookups.reload}
      />
    </>
  );
}

/** Finishing with unchecked items: tick any that were actually bought. */
function ReviewSheet({
  open,
  unpicked,
  pickedCount,
  onClose,
  onFinish,
}: {
  open: boolean;
  unpicked: ShoppingEntry[];
  pickedCount: number;
  onClose: () => void;
  onFinish: (alsoBought: Set<number>) => void;
}) {
  const [bought, setBought] = useState<Set<number>>(new Set());
  useEffect(() => {
    if (open) setBought(new Set());
  }, [open]);

  const adding = pickedCount + bought.size;
  const skipped = unpicked.length - bought.size;
  const allTicked = bought.size === unpicked.length;
  const summary =
    adding === 0
      ? "Nothing will be added to stock. The list will be cleared."
      : `${adding} item${adding === 1 ? "" : "s"} added to stock${skipped > 0 ? ` · ${skipped} left low for next time` : ""}`;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`${unpicked.length} Not Checked Off`}
      left={
        <Btn variant="plain" size="sm" onClick={onClose}>
          Cancel
        </Btn>
      }
      right={
        <Btn
          variant="plain"
          size="sm"
          onClick={() =>
            setBought(
              allTicked ? new Set() : new Set(unpicked.map((e) => e.id)),
            )
          }
        >
          {allTicked ? "None" : "All"}
        </Btn>
      }
      footer={
        <div className="space-y-2">
          <p className="text-center text-xs text-gray-500">{summary}</p>
          <Btn size="lg" className="w-full" onClick={() => onFinish(bought)}>
            <BadgeCheck className="h-5 w-5" />
            {adding === 0 ? "Clear List" : "Finish Trip"}
          </Btn>
        </div>
      }
    >
      <div className="mb-2 px-1">
        <div className="text-sm font-semibold">Did you buy any of these?</div>
        <div className="text-xs text-gray-500">
          Tick what you bought to add it to stock. Unticked items stay low and
          come back on your next list.
        </div>
      </div>
      <div className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white">
        {unpicked.map((entry) => {
          const isBought = bought.has(entry.id);
          return (
            <button
              key={entry.id}
              aria-pressed={isBought}
              onClick={() =>
                setBought((current) => {
                  const next = new Set(current);
                  if (next.has(entry.id)) next.delete(entry.id);
                  else next.add(entry.id);
                  return next;
                })
              }
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left"
            >
              {isBought ? (
                <Check
                  className="h-6 w-6 shrink-0 rounded-full bg-green-500 p-1 text-white"
                  strokeWidth={3}
                />
              ) : (
                <Circle className="h-6 w-6 shrink-0 text-gray-300" />
              )}
              <Thumb
                name={entry.item_list?.name ?? "?"}
                url={entry.item_list?.img_url}
                category={entry.item_list?.item_category}
                size={38}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">
                  {entry.item_list?.name}
                </div>
                <div
                  className={`text-xs ${isBought ? "text-green-600" : "text-low"}`}
                >
                  {isBought ? "Bought · add to stock" : "Not found · stays low"}
                </div>
              </div>
              <span className="text-sm font-bold tabular-nums text-gray-500">
                ×{entry.amount}
              </span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
