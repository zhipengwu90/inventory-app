// Shared data types and helpers. Mirrors the iOS app's Models.swift so both
// clients read and write Supabase the same way.

export interface InventoryRecord {
  id: number;
  item_id: number | null;
  count_amount: number | null;
  previous_total: number | null;
  shopped_amount: number | null;
  total_number: number | null;
  used_amount: number | null;
  date: string | null;
  timestamps: string | null;
  shopping_id: string | null;
}

export interface Item {
  id: number;
  name: string;
  price: number | null;
  item_category: string | null;
  /** Shopping place and area names, filled by the database from the ids. */
  shopping_place: string | null;
  item_place: string | null;
  shopping_place_id: number | null;
  item_place_id: number | null;
  comment: string | null;
  img_url: string | null;
  min_amount: number | null;
  /** Latest record first for the inventory list; oldest first for Insights. */
  current_inventory: InventoryRecord[];
}

export interface ShoppingEntry {
  id: number;
  item_id: number;
  amount: number;
  shopped: boolean | null;
  item_list: Item | null;
}

export interface HistoryEntry {
  id: number;
  created_at: string;
  shopping_id: string | null;
  shopping_place: string | null;
  total_cost: number | null;
  gst: number | null;
  hst: number | null;
  comment: string | null;
}

/** One item of a finished shopping list (shopping_list_history). */
export interface TripItem {
  id: number;
  shopping_id: string;
  item_id: number | null;
  item_name: string;
  shopping_place: string | null;
  amount: number;
  price: number | null;
  /** Checked off during the trip. */
  bought: boolean;
  /** Added to inventory at Finish Trip, even if not checked off. */
  added_to_stock: boolean;
  /** Photo as it was on the trip; shoppers can't read items no longer on the list. */
  img_url: string | null;
  item_list: Pick<Item, "id" | "name" | "img_url" | "item_category"> | null;
}

/** Item form fields. The database fills the place and area names from the ids. */
export interface ItemDraft {
  name: string;
  price: number | null;
  item_category: string;
  shopping_place_id: number | null;
  /** An area in the chosen shopping place. */
  item_place_id: number | null;
  comment: string;
  img_url: string;
  min_amount: number;
}

// MARK: Stores

export type StoreRole = "admin" | "shopper";

/** A store the signed-in user belongs to (my_stores), with its contact details. */
export interface Membership {
  store_id: string;
  name: string;
  role: StoreRole;
  phone: string | null;
  email: string | null;
  address: string | null;
}

/** Someone in a store, as an admin sees them (list_members). */
export interface Member {
  user_id: string;
  email: string;
  role: StoreRole;
}

/** Where a store buys things (shopping_places). */
export interface ShoppingPlace {
  id: number;
  name: string;
}

/** An area inside a shopping place, like an aisle (item_place). */
export interface Area {
  id: number;
  item_place: string;
  shopping_place_id: number;
}

export interface Receipt {
  total_cost: number | null;
  gst: number | null;
  hst: number | null;
  comment: string;
}

/** A trip in History: the per-store rows of one Finish Trip plus its saved list. */
export interface Trip {
  id: string;
  date: Date;
  receipts: HistoryEntry[];
  items: TripItem[];
}

// MARK: Items

const num = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/** Stock on hand after a record: the counted amount plus anything bought since. */
export const recordTotal = (record?: InventoryRecord | null): number | null => {
  if (!record) return null;
  const total = num(record.total_number);
  if (total !== null) return total;
  const count = num(record.count_amount);
  return count === null ? null : count + (num(record.shopped_amount) ?? 0);
};

/** Latest stock count, or null when the item has never been counted. */
export const stockOf = (item: Item): number | null =>
  recordTotal(item.current_inventory?.[0]);

export const minOf = (item: Item): number => num(item.min_amount) ?? 0;

/** How many to buy to get back up to the minimum. */
export const needOf = (item: Item): number =>
  Math.max(0, minOf(item) - (stockOf(item) ?? 0));

export const categoryOf = (item: Item): string =>
  item.item_category || "Uncategorized";

export const recordDate = (record: InventoryRecord): Date | null => {
  const raw = record.timestamps ?? record.date;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

// MARK: Shopping

export const storeOf = (entry: ShoppingEntry): string =>
  entry.item_list?.shopping_place || "Other";
export const locationOf = (entry: ShoppingEntry): string =>
  entry.item_list?.item_place || "Other";
export const lineTotal = (entry: ShoppingEntry): number =>
  (num(entry.item_list?.price) ?? 0) * Math.max(entry.amount || 1, 1);

// MARK: History

/** Rows from one Finish Trip share a shopping_id; hand-logged rows stand alone. */
export const tripKey = (entry: HistoryEntry): string =>
  entry.shopping_id && entry.shopping_id !== "None"
    ? entry.shopping_id
    : `entry-${entry.id}`;

/** The web and iOS apps build shopping ids as `<email-username>-<millis>`. */
export const shopperOf = (entry: HistoryEntry): string | null =>
  entry.shopping_id && entry.shopping_id !== "None"
    ? entry.shopping_id.split("-")[0]
    : null;

export const storeName = (entry: HistoryEntry): string =>
  entry.shopping_place || "Unknown store";

export const groupTrips = (
  history: HistoryEntry[],
  tripItems: TripItem[],
): Trip[] => {
  const itemsByTrip = new Map<string, TripItem[]>();
  tripItems.forEach((item) => {
    itemsByTrip.set(item.shopping_id, [
      ...(itemsByTrip.get(item.shopping_id) ?? []),
      item,
    ]);
  });
  const receiptsByTrip = new Map<string, HistoryEntry[]>();
  history.forEach((entry) => {
    const key = tripKey(entry);
    receiptsByTrip.set(key, [...(receiptsByTrip.get(key) ?? []), entry]);
  });
  return Array.from(receiptsByTrip.entries())
    .map(([id, receipts]) => ({
      id,
      date: new Date(
        Math.max(...receipts.map((r) => new Date(r.created_at).getTime())),
      ),
      receipts: receipts.sort((a, b) =>
        storeName(a).localeCompare(storeName(b)),
      ),
      items: itemsByTrip.get(id) ?? [],
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const tripTotal = (receipts: HistoryEntry[]): number =>
  receipts.reduce((sum, r) => sum + (num(r.total_cost) ?? 0), 0);

/** A store's items, bought first. */
export const itemsAt = (trip: Trip, store: string): TripItem[] =>
  trip.items
    .filter((item) => (item.shopping_place || "Unknown store") === store)
    .sort(
      (a, b) =>
        Number(b.bought) - Number(a.bought) ||
        a.item_name.localeCompare(b.item_name),
    );

// MARK: Formatting

export const currency = (value: number): string =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "CAD",
    currencyDisplay: "narrowSymbol",
  }).format(value);

export const toNumber = num;

/** Local calendar day as yyyy-MM-dd (matches the original updateInventory helper). */
export const dayString = (date = new Date()): string =>
  date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

/** Stable colours per category/store so they never shuffle (same hash as iOS). */
const palette = [
  "#30B0C7",
  "#FF9500",
  "#5856D6",
  "#FF2D55",
  "#00C7BE",
  "#AF52DE",
  "#007AFF",
  "#A2845E",
  "#32ADE6",
  "#FF3B30",
  "#34C759",
  "#FFCC00",
];
export const colorFor = (name?: string | null): string => {
  if (!name) return "#8E8E93";
  // 64-bit wrapping arithmetic, exactly like Swift's `&+` on Int, so colours match iOS.
  let hash = BigInt(5381);
  for (const ch of name) {
    hash = BigInt.asIntN(
      64,
      (hash << BigInt(5)) + hash + BigInt(ch.codePointAt(0) ?? 0),
    );
  }
  const index = (hash < BigInt(0) ? -hash : hash) % BigInt(palette.length);
  return palette[Number(index)];
};
