// Every Supabase call the redesigned pages make, scoped to the current store.
// Mirrors the iOS app's InventoryService.swift so both clients read and write
// data the same way. The database's access rules decide what each role sees.
// Each function throws on failure; pages catch and show a toast.

import { createClient } from "../supabase/client";
import imageCompression from "browser-image-compression";
import {
  Area,
  dayString,
  HistoryEntry,
  Item,
  ItemDraft,
  Receipt,
  ShoppingEntry,
  ShoppingPlace,
  TripItem,
} from "../types";
import { currentStoreId, shopperId } from "@/app/components/restock/useStore";

const supabase = createClient();

const store = (): string => {
  const id = currentStoreId();
  if (!id) throw new Error("Choose a store first.");
  return id;
};

const check = <T>(result: {
  data: T;
  error: { message: string } | null;
}): T => {
  if (result.error) throw new Error(result.error.message);
  return result.data;
};

// MARK: Items

/** Items with only their latest stock count (getInventoryList). */
export const fetchItems = async (): Promise<Item[]> =>
  check(
    await supabase
      .from("item_list_v2")
      .select("*, current_inventory:current_inventory_v2(*)")
      .eq("store_id", store())
      .order("name", { ascending: true })
      .order("timestamps", {
        referencedTable: "current_inventory",
        ascending: false,
      })
      .limit(1, { referencedTable: "current_inventory" }),
  ) as Item[];

/** Items with their full stock history, oldest first (getAllItem). */
export const fetchItemsWithHistory = async (): Promise<Item[]> =>
  check(
    await supabase
      .from("item_list_v2")
      .select("*, current_inventory:current_inventory_v2(*)")
      .eq("store_id", store())
      .order("name", { ascending: true })
      .order("timestamps", {
        referencedTable: "current_inventory",
        ascending: true,
      }),
  ) as Item[];

const draftRow = (draft: ItemDraft) => ({
  name: draft.name.trim(),
  ...(draft.price === null ? {} : { price: draft.price }),
  item_category: draft.item_category,
  shopping_place_id: draft.shopping_place_id,
  item_place_id: draft.item_place_id,
  comment: draft.comment,
  img_url: draft.img_url,
  min_amount: draft.min_amount,
});

export const addItem = async (draft: ItemDraft) => {
  check(
    await supabase
      .from("item_list_v2")
      .insert({ ...draftRow(draft), store_id: store() }),
  );
};

export const updateItem = async (id: number, draft: ItemDraft) => {
  check(await supabase.from("item_list_v2").update(draftRow(draft)).eq("id", id));
};

export const deleteItem = async (id: number) => {
  check(await supabase.from("item_list_v2").delete().eq("id", id));
};

export const updateMinAmount = async (itemId: number, min: number) => {
  check(
    await supabase
      .from("item_list_v2")
      .update({ min_amount: min })
      .eq("id", itemId),
  );
};

/** Records a new stock count (updateInventory). The store comes from the item. */
export const recordCount = async (
  itemId: number,
  count: number,
  previous: number | null,
) => {
  check(
    await supabase.from("current_inventory_v2").insert({
      item_id: itemId,
      count_amount: count,
      previous_total: previous,
      date: dayString(),
    }),
  );
};

// MARK: Lookups

export const fetchCategories = async (): Promise<string[]> =>
  (
    check(await supabase.rpc("get_item_category_enum")) as {
      enum_value: string;
    }[]
  ).map((r) => r.enum_value);

/** The store's shopping places, alphabetical with "Other" last. */
export const fetchPlaces = async (): Promise<ShoppingPlace[]> => {
  const rows = check(
    await supabase
      .from("shopping_places")
      .select("id, name")
      .eq("store_id", store())
      .order("name"),
  ) as ShoppingPlace[];
  return [
    ...rows.filter((p) => p.name !== "Other"),
    ...rows.filter((p) => p.name === "Other"),
  ];
};

/** Areas inside the store's shopping places. Shoppers get none. */
export const fetchAreas = async (): Promise<Area[]> =>
  check(
    await supabase
      .from("item_place_v2")
      .select("id, item_place, shopping_place_id")
      .eq("store_id", store())
      .order("item_place"),
  ) as Area[];

export const addArea = async (name: string, placeId: number): Promise<Area> =>
  check(
    await supabase
      .from("item_place_v2")
      .insert({ item_place: name, shopping_place_id: placeId })
      .select("id, item_place, shopping_place_id")
      .single(),
  ) as Area;

// MARK: Images

/** Compresses to 500px / 0.5 MB and uploads to the store's folder in item_photo_v2. */
export const uploadImage = async (
  file: File,
  itemName: string,
): Promise<string> => {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 500,
    useWebWorker: true,
  });
  const base = itemName.trim().replace(/\s+/g, "_") || "newItem";
  const fileName = `${store()}/${base}_${Date.now()}.jpg`;
  check(
    await supabase.storage
      .from("item_photo_v2")
      .upload(fileName, compressed, { contentType: "image/jpeg" }),
  );
  return supabase.storage.from("item_photo_v2").getPublicUrl(fileName).data
    .publicUrl;
};

// MARK: Shopping list

export const fetchShoppingList = async (): Promise<ShoppingEntry[]> => {
  const rows = check(
    await supabase
      .from("shopping_list_v2")
      .select("*, item_list:item_list_v2(*)")
      .eq("store_id", store()),
  ) as ShoppingEntry[];
  return rows.sort((a, b) =>
    (a.item_list?.name ?? "").localeCompare(b.item_list?.name ?? ""),
  );
};

/** Adds one item, refusing duplicates (addShoppingItem). */
export const addToShoppingList = async (itemId: number, amount: number) => {
  const existing = check(
    await supabase.from("shopping_list_v2").select("id").eq("item_id", itemId),
  ) as unknown[];
  if (existing.length > 0)
    throw new Error("That item is already on the shopping list.");
  check(
    await supabase
      .from("shopping_list_v2")
      .insert({ item_id: itemId, amount: Math.max(amount, 1) }),
  );
};

export const clearShoppingList = async () => {
  check(await supabase.from("shopping_list_v2").delete().eq("store_id", store()));
};

/** Replaces the whole list (deleteOldShopping + generateShopList). */
export const replaceShoppingList = async (
  rows: { item_id: number; amount: number }[],
) => {
  await clearShoppingList();
  if (rows.length > 0) check(await supabase.from("shopping_list_v2").insert(rows));
};

/** Checks an item off. Goes through the database so shoppers can do it too. */
export const setShopped = async (entryId: number, shopped: boolean) => {
  check(
    await supabase.rpc("set_shopped", {
      p_entry_id: entryId,
      p_shopped: shopped,
    }),
  );
};

export const setShoppingAmount = async (entryId: number, amount: number) => {
  check(
    await supabase.from("shopping_list_v2").update({ amount }).eq("id", entryId),
  );
};

export const removeFromShoppingList = async (entryId: number) => {
  check(await supabase.from("shopping_list_v2").delete().eq("id", entryId));
};

/** Who the store's list is assigned to. Shoppers see the list only while assigned. */
export const fetchAssignees = async (): Promise<string[]> =>
  (
    check(
      await supabase
        .from("shopping_list_assignees")
        .select("user_id")
        .eq("store_id", store()),
    ) as { user_id: string }[]
  ).map((r) => r.user_id);

/** Replaces who the list is assigned to. Admins only. */
export const setAssignees = async (userIds: string[]) => {
  check(
    await supabase.rpc("set_list_assignees", {
      p_store_id: store(),
      p_user_ids: userIds,
    }),
  );
};

/**
 * Finishes the trip in one step on the server: saves the whole list to
 * History, adds bought amounts to stock, logs a trip per shopping place and
 * clears the list. `alsoBought` holds unchecked entries an admin confirmed were
 * bought anyway; the database ignores it for shoppers, so items they couldn't
 * find never go into stock.
 * Returns false when nothing was bought and the list was only cleared.
 */
export const finishTrip = async (alsoBought: Set<number>): Promise<boolean> => {
  const shoppingId = check(
    await supabase.rpc("finish_trip", {
      p_store_id: store(),
      p_also_bought: Array.from(alsoBought),
    }),
  ) as string | null;
  return shoppingId !== null;
};

// MARK: History

export const fetchHistory = async (): Promise<HistoryEntry[]> => {
  let query = supabase
    .from("shopping_history_v2")
    .select("*")
    .eq("store_id", store());
  const shopper = shopperId();
  if (shopper) query = query.eq("shopper_id", shopper);
  return check(
    await query.order("created_at", { ascending: false }),
  ) as HistoryEntry[];
};

/** Saved lists; quiet if the archive table hasn't been created yet. */
export const fetchTripItems = async (): Promise<TripItem[]> => {
  let query = supabase
    .from("shopping_list_history_v2")
    .select("*, item_list:item_list_v2(id, name, img_url, item_category)")
    .eq("store_id", store());
  const shopper = shopperId();
  if (shopper) query = query.eq("shopper_id", shopper);
  const { data, error } = await query.order("item_name");
  return error ? [] : (data as TripItem[]);
};

/** Receipt amounts; shoppers can only change their own trips. */
export const updateReceipt = async (id: number, receipt: Receipt) => {
  check(
    await supabase.rpc("update_trip_receipt", {
      p_id: id,
      p_total: receipt.total_cost,
      p_gst: receipt.gst,
      p_hst: receipt.hst,
      p_comment: receipt.comment,
    }),
  );
};

/** Hand-logged trip (addHistory). */
export const addHistory = async (
  date: Date,
  place: string,
  receipt: Receipt,
) => {
  check(
    await supabase.from("shopping_history_v2").insert({
      created_at: date.toISOString(),
      shopping_place: place,
      store_id: store(),
      shopping_id: "None",
      paid: true,
      ...receipt,
    }),
  );
};
