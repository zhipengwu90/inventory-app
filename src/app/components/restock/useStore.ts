"use client";
import { useSyncExternalStore } from "react";
import { createClient } from "@/app/utils/supabase/client";
import { Membership } from "@/app/utils/types";

// The stores the signed-in user belongs to and the one being shown. Shared by
// every page; restockApi scopes its queries to the current store. Mirrors the
// iOS app's SessionStore.

interface StoreState {
  /** Null until loaded. */
  memberships: Membership[] | null;
  currentId: string | null;
  userId: string | null;
  /** Only the super admin creates stores, and is an admin of every store. */
  isSuperAdmin: boolean;
  error: string | null;
}

const STORAGE_KEY = "restock:store";
let state: StoreState = {
  memberships: null,
  currentId: null,
  userId: null,
  isSuperAdmin: false,
  error: null,
};
const listeners = new Set<() => void>();

const setState = (change: Partial<StoreState>) => {
  state = { ...state, ...change };
  listeners.forEach((listener) => listener());
};

const remembered = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const remember = (id: string | null) => {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
  } catch {}
};

const currentMembership = () =>
  state.memberships?.find((m) => m.store_id === state.currentId) ?? null;

/** For restockApi: the store every query is scoped to. */
export const currentStoreId = () => state.currentId;
/** For restockApi: set for shoppers, whose history is limited to their own trips. */
export const shopperId = () =>
  currentMembership()?.role === "admin" ? null : state.userId;

/** Loads the user's stores and picks the remembered one, else the first. */
export async function loadStores() {
  const supabase = createClient();
  const [{ data: auth }, { data, error }, superAdmin] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc("my_stores"),
    supabase.rpc("is_super_admin"),
  ]);
  if (error) {
    setState({ error: error.message });
    return;
  }
  const memberships = (data ?? []) as Membership[];
  const wanted = state.currentId ?? remembered();
  const currentId =
    memberships.find((m) => m.store_id === wanted)?.store_id ??
    memberships[0]?.store_id ??
    null;
  remember(currentId);
  setState({
    memberships,
    currentId,
    userId: auth.user?.id ?? null,
    isSuperAdmin: superAdmin.data === true,
    error: null,
  });
}

/** On sign-out, so the next user starts fresh. */
export function resetStores() {
  setState({
    memberships: null,
    currentId: null,
    userId: null,
    isSuperAdmin: false,
    error: null,
  });
}

export function switchStore(id: string) {
  if (!state.memberships?.some((m) => m.store_id === id)) return;
  remember(id);
  setState({ currentId: id });
}

/** Creates a store with the user as its admin and switches to it. Super admin only. */
export async function createStore(name: string) {
  const { data, error } = await createClient().rpc("create_store", {
    p_name: name.trim(),
  });
  if (error) throw new Error(error.message);
  await loadStores();
  switchStore(data as string);
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useStore() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
  const current =
    snapshot.memberships?.find((m) => m.store_id === snapshot.currentId) ??
    null;
  return {
    ...snapshot,
    current,
    /** Admins see and change everything; shoppers only check off the list and finish trips. */
    isAdmin: current?.role === "admin",
  };
}
