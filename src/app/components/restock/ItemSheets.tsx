"use client";
// Item detail and add/edit dialogs, shared by the Inventory and Shopping pages
// (replaces home/components/ItemDetail, AddItem and shoppinglist/parts/AddNewItem).
import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  Check,
  Clock,
  MapPin,
  Plus,
  ShoppingCart,
  Square,
  Store,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import {
  categoryOf,
  colorFor,
  currency,
  Item,
  ItemDraft,
  minOf,
  needOf,
  recordDate,
  stockOf,
} from "@/app/utils/types";
import {
  addArea,
  addItem,
  deleteItem,
  updateItem,
  uploadImage,
} from "@/app/utils/sql/restockApi";
import {
  Badge,
  BigStepper,
  Btn,
  Confirm,
  Field,
  Group,
  inputClass,
  selectClass,
  Sheet,
  Thumb,
} from "./ui";
import { useToast } from "./Toast";
import { Lookups } from "./useLookups";

// MARK: Detail

export function ItemDetailSheet({
  item,
  onList,
  onClose,
  onEdit,
  onAddToList,
}: {
  item: Item | null;
  onList: boolean;
  onClose: () => void;
  onEdit: () => void;
  onAddToList: (item: Item) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [zoom, setZoom] = useState(false);
  if (!item) return null;

  const stock = stockOf(item);
  const need = needOf(item);
  const lastCounted = item.current_inventory?.[0]
    ? recordDate(item.current_inventory[0])
    : null;

  const info: [string, React.ReactNode, React.ElementType, string][] = [
    ["Category", item.item_category, Square, colorFor(item.item_category)],
    ["Shopping place", item.shopping_place, Store, "#5856D6"],
    ["Area", item.item_place, MapPin, "#30B0C7"],
    [
      "Price",
      item.price != null ? currency(Number(item.price)) : null,
      Tag,
      "#34C759",
    ],
  ];
  if (lastCounted)
    info.push([
      "Last counted",
      lastCounted.toLocaleDateString(),
      Clock,
      "#FF9500",
    ]);

  return (
    <Sheet
      open
      onClose={onClose}
      title=""
      right={
        <Btn variant="plain" size="sm" onClick={onEdit}>
          Edit
        </Btn>
      }
    >
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <button
          onClick={() => item.img_url && setZoom(true)}
          disabled={!item.img_url}
          aria-label="View photo"
        >
          <Thumb
            name={item.name}
            url={item.img_url}
            category={item.item_category}
            size={132}
          />
        </button>
        <h1 className="text-2xl font-bold">{item.name}</h1>
        {need > 0 && (
          <span className="flex items-center gap-1 text-sm font-semibold text-low">
            <AlertTriangle className="h-4 w-4" /> Running low
          </span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          ["In stock", stock ?? "—", need > 0 ? "text-low" : ""],
          ["Minimum", minOf(item), ""],
          ["To buy", need, need > 0 ? "text-low" : "text-gray-400"],
        ].map(([label, value, tone]) => (
          <div
            key={label as string}
            className="rounded-2xl bg-white py-3 text-center"
          >
            <div className={`text-2xl font-bold tabular-nums ${tone}`}>
              {value}
            </div>
            <div className="text-xs font-medium text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      <Btn
        size="lg"
        className="mt-4 w-full"
        disabled={onList}
        loading={adding}
        onClick={async () => {
          setAdding(true);
          await onAddToList(item);
          setAdding(false);
        }}
      >
        {onList ? (
          <Check className="h-5 w-5" />
        ) : (
          <ShoppingCart className="h-5 w-5" />
        )}
        {onList
          ? "On Shopping List"
          : `Add ${Math.max(need, 1)} to Shopping List`}
      </Btn>

      <Group className="mt-4">
        {info.map(([label, value, Icon, tint]) => (
          <div key={label} className="flex items-center gap-3 px-3 py-2.5">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ color: tint, background: `${tint}22` }}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-gray-500">{label}</span>
            <span className="ml-auto text-right">{value || "—"}</span>
          </div>
        ))}
      </Group>

      {item.comment && (
        <div className="mt-4 rounded-2xl bg-white p-4">
          <div className="mb-1 text-sm font-semibold text-gray-500">Notes</div>
          <p className="whitespace-pre-wrap">{item.comment}</p>
        </div>
      )}

      {zoom && item.img_url && (
        <div
          className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/90 p-6"
          onClick={() => setZoom(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.img_url}
            alt={item.name}
            className="max-h-full max-w-full object-contain"
          />
          <button
            className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white"
            aria-label="Close photo"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
    </Sheet>
  );
}

// MARK: Editor

const emptyDraft: ItemDraft = {
  name: "",
  price: null,
  item_category: "",
  shopping_place_id: null,
  item_place_id: null,
  comment: "",
  img_url: "",
  min_amount: 0,
};

export function ItemEditorSheet({
  open,
  item,
  initialName = "",
  lookups,
  onClose,
  onSaved,
  onDeleted,
  onLookupsChanged,
}: {
  open: boolean;
  item: Item | null;
  initialName?: string;
  lookups: Lookups;
  onClose: () => void;
  onSaved: (name: string) => void;
  onDeleted?: () => void;
  onLookupsChanged: () => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft);
  const [priceText, setPriceText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // The shopping place changed and its old area was cleared.
  const [areaNeedsPicking, setAreaNeedsPicking] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const isNew = item === null;

  useEffect(() => {
    if (!open) return;
    setDraft(
      item
        ? {
            name: item.name,
            price: item.price,
            item_category: item.item_category ?? "",
            shopping_place_id: item.shopping_place_id,
            item_place_id: item.item_place_id,
            comment: item.comment ?? "",
            img_url: item.img_url ?? "",
            min_amount: minOf(item),
          }
        : { ...emptyDraft, name: initialName },
    );
    setPriceText(item?.price != null ? String(item.price) : "");
    setFile(null);
    setPreview(null);
    setAreaNeedsPicking(false);
  }, [open, item, initialName]);

  const set = <K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const valid =
    draft.name.trim() !== "" &&
    draft.item_category !== "" &&
    draft.shopping_place_id !== null;

  const placeAreas = lookups.areas.filter(
    (a) => a.shopping_place_id === draft.shopping_place_id,
  );
  const placeName = lookups.places.find(
    (p) => p.id === draft.shopping_place_id,
  )?.name;

  // An area belongs to one shopping place, so a new place means picking again.
  const choosePlace = (placeId: number | null) => {
    const keepArea = lookups.areas.some(
      (a) => a.id === draft.item_place_id && a.shopping_place_id === placeId,
    );
    if (draft.item_place_id !== null && !keepArea) setAreaNeedsPicking(true);
    setDraft((d) => ({
      ...d,
      shopping_place_id: placeId,
      item_place_id: keepArea ? d.item_place_id : null,
    }));
  };

  // Keep a value the item already has even if it's missing from the lookup list.
  const options = (values: string[], current: string | null) =>
    !current || values.includes(current) ? values : [...values, current];

  const save = async () => {
    setSaving(true);
    try {
      const price =
        priceText.trim() === "" ? null : Number(priceText.replace(",", "."));
      let next = { ...draft, price: Number.isFinite(price) ? price : null };
      if (file)
        next = { ...next, img_url: await uploadImage(file, draft.name) };
      if (item) await updateItem(item.id, next);
      else await addItem(next);
      toast.success(isNew ? `${next.name.trim()} added` : "Changes saved");
      onSaved(next.name.trim());
      onClose();
    } catch (error) {
      toast.error(error);
    }
    setSaving(false);
  };

  const remove = async () => {
    if (!item) return;
    setSaving(true);
    try {
      await deleteItem(item.id);
      toast.success(`${item.name} deleted`);
      onClose();
      onDeleted?.();
    } catch (error) {
      toast.error(error);
    }
    setSaving(false);
  };

  const newArea = async () => {
    const placeId = draft.shopping_place_id;
    if (placeId === null) return;
    const name = prompt(`New area in ${placeName} (e.g. Aisle 9)`)?.trim();
    if (!name) return;
    try {
      const area = await addArea(name, placeId);
      onLookupsChanged();
      set("item_place_id", area.id);
      setAreaNeedsPicking(false);
    } catch (error) {
      toast.error(error);
    }
  };

  const photo = preview ?? (draft.img_url || null);

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title={isNew ? "New Item" : "Edit Item"}
        left={
          <Btn variant="plain" size="sm" onClick={onClose}>
            Cancel
          </Btn>
        }
        right={
          <Btn size="sm" disabled={!valid} loading={saving} onClick={save}>
            {isNew ? "Add" : "Save"}
          </Btn>
        }
      >
        <div className="flex flex-col items-center gap-3 pb-5">
          <div className="relative">
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-[28px] bg-black/5">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <Camera className="h-9 w-9 text-gray-300" />
              )}
            </div>
            {photo && (
              <button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  set("img_url", "");
                }}
                className="absolute -right-2 -top-2 rounded-full bg-black/60 p-1 text-white"
                aria-label="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Btn
            variant="outline"
            size="sm"
            onClick={() => fileInput.current?.click()}
          >
            <Camera className="h-4 w-4" />
            {photo ? "Change Photo" : "Add Photo"}
          </Btn>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const picked = e.target.files?.[0];
              if (!picked) return;
              setFile(picked);
              setPreview(URL.createObjectURL(picked));
              e.target.value = "";
            }}
          />
        </div>

        <Group>
          <div className="px-4 py-3">
            <input
              autoFocus={isNew && !initialName}
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Name"
              className="w-full bg-transparent text-lg font-semibold outline-none placeholder:text-gray-400"
            />
          </div>
          <Field label="Price">
            <input
              inputMode="decimal"
              value={priceText}
              onChange={(e) => setPriceText(e.target.value)}
              placeholder="Optional"
              className={inputClass}
            />
          </Field>
        </Group>

        <Group
          header="Organize"
          className="mt-5"
          footer={
            areaNeedsPicking && placeName
              ? `Pick an area in ${placeName}, or leave it as None.`
              : undefined
          }
        >
          <Field label="Category">
            <select
              className={selectClass}
              value={draft.item_category}
              onChange={(e) => set("item_category", e.target.value)}
            >
              {!draft.item_category && <option value="">Choose…</option>}
              {options(lookups.categories, draft.item_category).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Shopping place">
            <select
              className={selectClass}
              value={draft.shopping_place_id ?? ""}
              onChange={(e) =>
                choosePlace(e.target.value ? Number(e.target.value) : null)
              }
            >
              {draft.shopping_place_id === null && (
                <option value="">Choose…</option>
              )}
              {lookups.places.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Area">
            <select
              className={selectClass}
              value={draft.item_place_id ?? ""}
              disabled={draft.shopping_place_id === null}
              onChange={(e) => {
                set("item_place_id", e.target.value ? Number(e.target.value) : null);
                if (e.target.value) setAreaNeedsPicking(false);
              }}
            >
              <option value="">None</option>
              {placeAreas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.item_place}
                </option>
              ))}
            </select>
          </Field>
          <button
            onClick={newArea}
            disabled={draft.shopping_place_id === null}
            className="flex w-full items-center gap-2 px-4 py-3 text-[15px] font-medium text-brand disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> New Area…
          </button>
        </Group>

        <Group
          className="mt-5"
          footer="When stock drops below this number, the item shows as running low."
        >
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-[15px]">Keep at least</span>
            <div className="flex items-center gap-3">
              <span className="tabular-nums text-gray-500">
                {draft.min_amount}
              </span>
              <div className="flex overflow-hidden rounded-lg bg-black/5">
                <button
                  className="px-3 py-1.5 text-lg"
                  onClick={() =>
                    set("min_amount", Math.max(0, draft.min_amount - 1))
                  }
                  aria-label="Decrease minimum"
                >
                  −
                </button>
                <span className="w-px bg-black/10" />
                <button
                  className="px-3 py-1.5 text-lg"
                  onClick={() => set("min_amount", draft.min_amount + 1)}
                  aria-label="Increase minimum"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </Group>

        <Group header="Notes" className="mt-5">
          <textarea
            value={draft.comment}
            onChange={(e) => set("comment", e.target.value)}
            placeholder="Brand, size, where to find it…"
            rows={3}
            className="w-full resize-none bg-transparent px-4 py-3 text-[15px] outline-none placeholder:text-gray-400"
          />
        </Group>

        {!isNew && (
          <Group className="mt-5">
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex w-full items-center justify-center gap-2 py-3 font-medium text-red-600"
            >
              <Trash2 className="h-4 w-4" /> Delete Item
            </button>
          </Group>
        )}
      </Sheet>

      <Confirm
        open={confirmDelete}
        title={`Delete ${draft.name}?`}
        message="This removes the item and can't be undone."
        confirmLabel="Delete Item"
        destructive
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  );
}

// MARK: Adjust (count mode)

export function AdjustSheet({
  item,
  count,
  minimum,
  onChange,
  onClose,
}: {
  item: Item | null;
  count: number;
  minimum: number;
  onChange: (count: number, minimum: number) => void;
  onClose: () => void;
}) {
  if (!item) return null;
  return (
    <Sheet
      open
      onClose={onClose}
      title={item.name}
      maxWidth="xs"
      left={<span />}
      right={
        <Btn size="sm" onClick={onClose}>
          Done
        </Btn>
      }
    >
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="flex items-center gap-2">
          <Thumb
            name={item.name}
            url={item.img_url}
            category={item.item_category}
            size={40}
          />
          <Badge tint={colorFor(item.item_category)}>{categoryOf(item)}</Badge>
        </div>
        <BigStepper
          title="On hand"
          value={count}
          onChange={(v) => onChange(v, minimum)}
        />
        <div className="h-px w-full bg-black/10" />
        <BigStepper
          title="Keep at least"
          value={minimum}
          onChange={(v) => onChange(count, v)}
        />
      </div>
    </Sheet>
  );
}
