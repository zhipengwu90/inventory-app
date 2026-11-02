"use client";
// Shopping list extras: contacting the store, and (for admins) choosing who
// the list is assigned to. Mirrors the iOS app's StoreContactMenu and
// ShoppingListView's AssignRow / AssignListSheet.

import React, { useEffect, useRef, useState } from "react";
import { Check, Mail, Map, MessageSquare, Phone, UserRound, Users } from "lucide-react";
import { Member, Membership } from "@/app/utils/types";
import { fetchMembers } from "@/app/utils/sql/storeApi";
import { setAssignees } from "@/app/utils/sql/restockApi";
import { Btn, Sheet } from "./ui";
import { useToast } from "./Toast";

/** Keeps a leading + and the digits, so "(604) 555-0100" dials. */
const dialable = (phone: string) => phone.replace(/[^\d+]/g, "");

/** Call, text, email or get directions to the store. */
export function StoreContact({ store }: { store: Membership }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!store.phone && !store.email && !store.address) return null;

  const links: [string, string, React.ElementType][] = [];
  if (store.phone) {
    links.push([`Call ${store.phone}`, `tel:${dialable(store.phone)}`, Phone]);
    links.push([`Text ${store.phone}`, `sms:${dialable(store.phone)}`, MessageSquare]);
  }
  if (store.email) links.push([store.email, `mailto:${store.email}`, Mail]);
  if (store.address)
    links.push([
      store.address,
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`,
      Map,
    ]);

  return (
    <div className="relative" ref={ref}>
      <Btn variant="tinted" onClick={() => setOpen((o) => !o)} aria-label="Contact store">
        <Phone className="h-[18px] w-[18px]" />
        <span className="sm:hidden">Contact</span>
      </Btn>
      {open && (
        <div className="absolute right-0 top-12 z-20 w-72 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5">
          <div className="truncate px-3 py-1.5 text-xs font-semibold uppercase text-gray-400">
            {store.name}
          </div>
          {links.map(([label, href, Icon]) => (
            <a
              key={href}
              href={href}
              target={href.startsWith("https") ? "_blank" : undefined}
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium hover:bg-black/5"
            >
              <Icon className="h-4 w-4 shrink-0 text-brand" />
              <span className="truncate">{label}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/** Who the list is assigned to, with a button to change it. Admins only. */
export function AssignBar({
  storeId,
  assigneeIds,
  onChanged,
}: {
  storeId: string;
  assigneeIds: string[];
  onChanged: (ids: string[]) => void;
}) {
  const toast = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchMembers(storeId).then(setMembers).catch(toast.error);
  }, [storeId, toast]);

  const assigned = members.filter((m) => assigneeIds.includes(m.user_id));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left"
      >
        {assigned.length === 0 ? (
          <UserRound className="h-6 w-6 shrink-0 text-orange-500" />
        ) : (
          <Users className="h-6 w-6 shrink-0 text-brand" />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">
            {assigned.length === 0 ? "Not assigned" : "Assigned to"}
          </div>
          <div className="truncate text-xs text-gray-500">
            {assigned.length === 0
              ? "Shoppers can't see this list until you assign it."
              : assigned.map((m) => m.email).join(", ")}
          </div>
        </div>
        <span className="text-sm font-semibold text-brand">
          {assigned.length === 0 ? "Assign" : "Change"}
        </span>
      </button>
      <AssignSheet
        open={open}
        members={members}
        assigneeIds={assigneeIds}
        onClose={() => setOpen(false)}
        onSaved={(ids) => {
          setOpen(false);
          onChanged(ids);
        }}
      />
    </>
  );
}

function AssignSheet({
  open,
  members,
  assigneeIds,
  onClose,
  onSaved,
}: {
  open: boolean;
  members: Member[];
  assigneeIds: string[];
  onClose: () => void;
  onSaved: (ids: string[]) => void;
}) {
  const toast = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const shoppers = members.filter((m) => m.role === "shopper");

  useEffect(() => {
    if (open) setSelected(assigneeIds);
  }, [open, assigneeIds]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const unchanged =
    selected.length === assigneeIds.length &&
    selected.every((id) => assigneeIds.includes(id));

  const save = async () => {
    setSaving(true);
    try {
      await setAssignees(selected);
      toast.success(selected.length === 0 ? "List unassigned" : "List assigned");
      onSaved(selected);
    } catch (error) {
      toast.error(error);
    }
    setSaving(false);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Assign List"
      left={
        <Btn variant="plain" size="sm" onClick={onClose}>
          Cancel
        </Btn>
      }
      right={
        <Btn size="sm" loading={saving} disabled={unchanged} onClick={save}>
          Save
        </Btn>
      }
    >
      {shoppers.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">
          No shoppers yet. Add shoppers to this store in Store Settings.
        </p>
      ) : (
        <>
          <div className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white">
            {shoppers.map((m) => (
              <button
                key={m.user_id}
                onClick={() => toggle(m.user_id)}
                aria-pressed={selected.includes(m.user_id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="truncate">{m.email}</span>
                {selected.includes(m.user_id) && <Check className="h-5 w-5 text-brand" />}
              </button>
            ))}
          </div>
          <p className="mt-2 px-4 text-xs text-gray-500">
            They see the whole list, check items off and finish the trip. The
            assignment ends when the trip is finished.
          </p>
        </>
      )}
    </Sheet>
  );
}
