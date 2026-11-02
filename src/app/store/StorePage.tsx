"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Btn, Confirm, Group, inputClass, selectClass, Spinner } from "../components/restock/ui";
import { useToast } from "../components/restock/Toast";
import { useLookups } from "../components/restock/useLookups";
import { loadStores, useStore } from "../components/restock/useStore";
import { addArea } from "../utils/sql/restockApi";
import {
  addMember,
  addPlace,
  deleteArea,
  deletePlace,
  fetchMembers,
  removeMember,
  renameArea,
  renamePlace,
  setMemberRole,
  updateStore,
} from "../utils/sql/storeApi";
import { Area, Member, ShoppingPlace, StoreRole } from "../utils/types";

const roleTitle = (role: StoreRole) => (role === "admin" ? "Admin" : "Shopper");

/**
 * Admin-only settings for the current store: its name, who's in it and with
 * which role, and the shopping places (with their areas) it buys from.
 * Mirrors the iOS app's StoreSettingsView.
 */
export default function StorePage() {
  const toast = useToast();
  const lookups = useLookups();
  const { current, userId } = useStore();
  const storeId = current?.store_id ?? "";

  const [name, setName] = useState(current?.name ?? "");
  const [phone, setPhone] = useState(current?.phone ?? "");
  const [contactEmail, setContactEmail] = useState(current?.email ?? "");
  const [address, setAddress] = useState(current?.address ?? "");
  const [members, setMembers] = useState<Member[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StoreRole>("shopper");
  const [newPlace, setNewPlace] = useState("");
  const [openPlace, setOpenPlace] = useState<number | null>(null);
  const [placeToDelete, setPlaceToDelete] = useState<ShoppingPlace | null>(null);
  const [busy, setBusy] = useState(false);

  /** Runs a change, shows any error, and reports whether it worked. */
  const work = useCallback(
    async (action: () => Promise<void>) => {
      setBusy(true);
      try {
        await action();
        return true;
      } catch (error) {
        toast.error(error);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [toast],
  );

  // Once per store; `busy` isn't touched so the form doesn't flicker.
  useEffect(() => {
    if (!storeId) return;
    fetchMembers(storeId)
      .then(setMembers)
      .catch((error) => {
        setMembers([]);
        toast.error(error);
      });
  }, [storeId, toast]);

  /** Saves the name and contact details if any of them changed. */
  const saveDetails = () =>
    work(async () => {
      if (!current || !name.trim()) return;
      const same = (value: string, saved: string | null) =>
        (value.trim() || null) === (saved || null);
      if (
        name.trim() === current.name &&
        same(phone, current.phone) &&
        same(contactEmail, current.email) &&
        same(address, current.address)
      )
        return;
      await updateStore(storeId, { name, phone, email: contactEmail, address });
      await loadStores();
      toast.success("Store details saved");
    });

  const add = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    const ok = await work(async () => {
      await addMember(storeId, trimmed, role);
      setMembers(await fetchMembers(storeId));
    });
    if (ok) {
      setEmail("");
      toast.success(`${trimmed} added`);
    }
  };

  const changeRole = (member: Member, next: StoreRole) =>
    work(async () => {
      await setMemberRole(storeId, member.user_id, next);
      setMembers(await fetchMembers(storeId));
      if (member.user_id === userId) await loadStores();
    });

  const remove = (member: Member) =>
    work(async () => {
      if (!confirm(`Remove ${member.email} from ${current?.name}?`)) return;
      await removeMember(storeId, member.user_id);
      setMembers(await fetchMembers(storeId));
      if (member.user_id === userId) await loadStores();
    });

  const createPlace = async () => {
    const trimmed = newPlace.trim();
    if (!trimmed) return;
    if (await work(() => addPlace(storeId, trimmed))) {
      setNewPlace("");
      await lookups.reload();
    }
  };

  const changePlace = async (place: ShoppingPlace) => {
    const next = prompt("Rename shopping place", place.name)?.trim();
    if (!next || next === place.name) return;
    if (await work(() => renamePlace(place.id, next))) await lookups.reload();
  };

  const removePlace = async (place: ShoppingPlace) => {
    setPlaceToDelete(null);
    if (await work(() => deletePlace(place.id))) await lookups.reload();
  };

  const createArea = async (place: ShoppingPlace) => {
    const area = prompt(`New area in ${place.name} (e.g. Aisle 9)`)?.trim();
    if (!area) return;
    if (await work(async () => void (await addArea(area, place.id))))
      await lookups.reload();
  };

  const changeArea = async (area: Area) => {
    const next = prompt("Rename area", area.item_place)?.trim();
    if (!next || next === area.item_place) return;
    if (await work(() => renameArea(area.id, next))) await lookups.reload();
  };

  const removeArea = async (areaId: number) => {
    if (await work(() => deleteArea(areaId))) await lookups.reload();
  };

  if (!current) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-[34px] font-bold leading-tight sm:text-3xl">
        Store Settings
      </h1>

      <Group header="Store name">
        <div className="flex items-center gap-2 px-4 py-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveDetails}
            onKeyDown={(e) => e.key === "Enter" && saveDetails()}
            className={`${inputClass} text-left`}
          />
        </div>
      </Group>

      <Group
        header="Contact"
        footer="Shoppers can call, text, email or get directions from the shopping list."
      >
        {(
          [
            ["Phone", phone, setPhone, "tel"],
            ["Email", contactEmail, setContactEmail, "email"],
            ["Address", address, setAddress, "text"],
          ] as const
        ).map(([label, value, setValue, type]) => (
          <label key={label} className="flex items-center gap-3 px-4 py-2">
            <span className="w-20 shrink-0 text-[15px]">{label}</span>
            <input
              type={type}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={saveDetails}
              onKeyDown={(e) => e.key === "Enter" && saveDetails()}
              placeholder="Optional"
              className={`${inputClass} text-left`}
            />
          </label>
        ))}
      </Group>

      <Group
        header="Members"
        footer="Admins can do everything. Shoppers only see the shopping list and their own trips, check items off and finish the trip."
      >
        {members === null ? (
          <div className="px-4 py-3 text-sm text-gray-500">Loading…</div>
        ) : (
          members.map((member) => (
            <div key={member.user_id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate">{member.email}</div>
                {member.user_id === userId && (
                  <div className="text-xs text-gray-500">You</div>
                )}
              </div>
              <select
                className={`${selectClass} w-auto`}
                value={member.role}
                disabled={busy}
                onChange={(e) => changeRole(member, e.target.value as StoreRole)}
              >
                <option value="admin">Admin</option>
                <option value="shopper">Shopper</option>
              </select>
              <button
                onClick={() => remove(member)}
                disabled={busy}
                aria-label={`Remove ${member.email}`}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Email of an existing account"
            className={`${inputClass} min-w-0 flex-1 text-left`}
          />
          <select
            className={`${selectClass} w-auto`}
            value={role}
            onChange={(e) => setRole(e.target.value as StoreRole)}
          >
            <option value="shopper">{roleTitle("shopper")}</option>
            <option value="admin">{roleTitle("admin")}</option>
          </select>
          <Btn size="sm" onClick={add} disabled={!email.trim()} loading={busy}>
            <UserPlus className="h-4 w-4" /> Add
          </Btn>
        </div>
      </Group>

      <Group
        header="Shopping places"
        footer="Each place has its own areas, like aisles. Items pick a place, then an area in it."
      >
        {lookups.places.map((place) => {
          const areas = lookups.areas.filter((a) => a.shopping_place_id === place.id);
          const open = openPlace === place.id;
          return (
            <div key={place.id}>
              <div className="flex items-center gap-2 px-4 py-2.5">
                <button
                  onClick={() => setOpenPlace(open ? null : place.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  {open ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="truncate font-medium">{place.name}</span>
                  <span className="text-sm text-gray-500">
                    {areas.length} area{areas.length === 1 ? "" : "s"}
                  </span>
                </button>
                <Btn variant="plain" size="sm" onClick={() => changePlace(place)}>
                  Rename
                </Btn>
                <button
                  onClick={() => setPlaceToDelete(place)}
                  aria-label={`Delete ${place.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {open && (
                <div className="bg-black/[0.02] pb-2 pl-10 pr-4">
                  {areas.map((area) => (
                    <div key={area.id} className="flex items-center gap-3 py-1.5 text-sm">
                      <button
                        onClick={() => changeArea(area)}
                        className="min-w-0 flex-1 truncate text-left hover:text-brand"
                        title="Rename"
                      >
                        {area.item_place}
                      </button>
                      <button
                        onClick={() => changeArea(area)}
                        aria-label={`Rename ${area.item_place}`}
                        className="text-gray-300 hover:text-brand"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeArea(area.id)}
                        aria-label={`Delete ${area.item_place}`}
                        className="text-gray-300 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <Btn variant="plain" size="sm" onClick={() => createArea(place)}>
                    New Area…
                  </Btn>
                </div>
              )}
            </div>
          );
        })}
        <div className="flex items-center gap-2 px-4 py-3">
          <input
            value={newPlace}
            onChange={(e) => setNewPlace(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createPlace()}
            placeholder="New shopping place"
            className={`${inputClass} min-w-0 flex-1 text-left`}
          />
          <Btn size="sm" onClick={createPlace} disabled={!newPlace.trim()}>
            Add
          </Btn>
        </div>
      </Group>

      <Confirm
        open={placeToDelete !== null}
        title={`Delete ${placeToDelete?.name ?? ""}?`}
        message="Its areas are deleted too, and its items will need a new shopping place."
        confirmLabel="Delete Place"
        onConfirm={() => placeToDelete && removePlace(placeToDelete)}
        onClose={() => setPlaceToDelete(null)}
      />
    </div>
  );
}
