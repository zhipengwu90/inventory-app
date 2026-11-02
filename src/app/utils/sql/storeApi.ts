// Admin-only store settings: name, members and shopping places. Mirrors the
// iOS app's StoreService.swift. Each function throws on failure.

import { createClient } from "../supabase/client";
import { Member, StoreRole } from "../types";

const supabase = createClient();

const check = <T>(result: {
  data: T;
  error: { message: string } | null;
}): T => {
  if (result.error) throw new Error(result.error.message);
  return result.data;
};

/** Name and contact details. Blank contact fields are cleared. */
export const updateStore = async (
  storeId: string,
  details: { name: string; phone: string; email: string; address: string },
) => {
  const clean = (value: string) => value.trim() || null;
  check(
    await supabase
      .from("stores")
      .update({
        name: details.name.trim(),
        phone: clean(details.phone),
        email: clean(details.email),
        address: clean(details.address),
      })
      .eq("id", storeId),
  );
};

// MARK: Members

export const fetchMembers = async (storeId: string): Promise<Member[]> =>
  check(
    await supabase.rpc("list_members", { p_store_id: storeId }),
  ) as Member[];

/** Adds an existing account by email, or changes its role if it's already a member. */
export const addMember = async (
  storeId: string,
  email: string,
  role: StoreRole,
) => {
  check(
    await supabase.rpc("add_member", {
      p_store_id: storeId,
      p_email: email,
      p_role: role,
    }),
  );
};

export const setMemberRole = async (
  storeId: string,
  userId: string,
  role: StoreRole,
) => {
  check(
    await supabase.rpc("set_member_role", {
      p_store_id: storeId,
      p_user_id: userId,
      p_role: role,
    }),
  );
};

export const removeMember = async (storeId: string, userId: string) => {
  check(
    await supabase.rpc("remove_member", {
      p_store_id: storeId,
      p_user_id: userId,
    }),
  );
};

// MARK: Shopping places and areas

export const addPlace = async (storeId: string, name: string) => {
  check(
    await supabase.from("shopping_places").insert({ store_id: storeId, name }),
  );
};

export const renamePlace = async (placeId: number, name: string) => {
  check(
    await supabase.from("shopping_places").update({ name }).eq("id", placeId),
  );
};

/** Also deletes its areas; its items keep no shopping place. */
export const deletePlace = async (placeId: number) => {
  check(await supabase.from("shopping_places").delete().eq("id", placeId));
};

/** Renaming carries through to every item in this area. */
export const renameArea = async (areaId: number, name: string) => {
  check(
    await supabase.from("item_place_v2").update({ item_place: name }).eq("id", areaId),
  );
};

export const deleteArea = async (areaId: number) => {
  check(await supabase.from("item_place_v2").delete().eq("id", areaId));
};
