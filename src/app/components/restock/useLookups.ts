"use client";
import { useCallback, useEffect, useState } from "react";
import {
  fetchAreas,
  fetchCategories,
  fetchPlaces,
} from "@/app/utils/sql/restockApi";
import { Area, ShoppingPlace } from "@/app/utils/types";
import { currentStoreId, shopperId } from "./useStore";

export interface Lookups {
  categories: string[];
  /** Where the store buys things (Costco, Superstore…). */
  places: ShoppingPlace[];
  /** Shopping place names, in the store's order. */
  stores: string[];
  /** Areas inside the shopping places, like aisles. */
  areas: Area[];
}

const empty: Lookups = { categories: [], places: [], stores: [], areas: [] };
// One cache per store; the page remounts when the store changes.
const cache = new Map<string, Lookups>();

/** Category, shopping place and area choices, loaded once per store and shared across pages. */
export function useLookups() {
  const storeId = currentStoreId();
  const [lookups, setLookups] = useState<Lookups>(
    (storeId && cache.get(storeId)) || empty,
  );

  const reload = useCallback(async () => {
    if (!storeId) return;
    const [categories, places, areas] = await Promise.all([
      fetchCategories().catch(() => []),
      fetchPlaces().catch(() => []),
      // Shoppers can't read areas.
      shopperId() ? Promise.resolve([]) : fetchAreas().catch(() => []),
    ]);
    const next = { categories, places, stores: places.map((p) => p.name), areas };
    cache.set(storeId, next);
    setLookups(next);
  }, [storeId]);

  useEffect(() => {
    if (storeId && !cache.has(storeId)) reload();
  }, [storeId, reload]);

  return { ...lookups, reload };
}
