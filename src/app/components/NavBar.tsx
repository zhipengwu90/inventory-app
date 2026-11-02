"use client";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Check,
  History,
  LogOut,
  Package,
  Plus,
  Settings,
  ShoppingCart,
} from "lucide-react";
import { createClient } from "../utils/supabase/client";
import { NAV_LOCK, NavLock } from "./restock/navLock";
import { Btn, Confirm } from "./restock/ui";
import { useToast } from "./restock/Toast";
import {
  createStore,
  resetStores,
  switchStore,
  useStore,
} from "./restock/useStore";

const allTabs = [
  { href: "/", label: "Inventory", icon: Package, adminOnly: true },
  { href: "/shoppinglist", label: "Shopping", icon: ShoppingCart },
  { href: "/shoppingHistory", label: "History", icon: History },
  { href: "/stats", label: "Insights", icon: BarChart3, adminOnly: true },
];

/** Pages fire this after changing the shopping list so the tab badge updates. */
export const LIST_CHANGED = "restock:list-changed";

const NavBar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const { memberships, current, isAdmin, isSuperAdmin } = useStore();
  // Shoppers only see the list and their own trips.
  const tabs = allTabs.filter((tab) => isAdmin || !tab.adminOnly);
  const [email, setEmail] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // Set by pages that must not be left mid-task (Count Stock).
  const [lock, setLock] = useState<NavLock>({ locked: false });
  const [blocked, setBlocked] = useState<string | null>(null);
  const pushedGuard = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  // Unpicked items on the shopping list, shown as a badge on the Shopping tab.
  useEffect(() => {
    const supabase = createClient();
    const storeId = current?.store_id;
    const load = async () => {
      if (!storeId) return setRemaining(0);
      const { data } = await supabase
        .from("shopping_list_v2")
        .select("shopped")
        .eq("store_id", storeId);
      setRemaining(
        (data ?? []).filter((row: { shopped: boolean | null }) => !row.shopped)
          .length,
      );
    };
    load();
    window.addEventListener(LIST_CHANGED, load);
    return () => window.removeEventListener(LIST_CHANGED, load);
  }, [pathname, current?.store_id]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  useEffect(() => {
    const onLock = (e: Event) => setLock((e as CustomEvent<NavLock>).detail);
    window.addEventListener(NAV_LOCK, onLock);
    return () => window.removeEventListener(NAV_LOCK, onLock);
  }, []);

  // Browser back (or swipe back) while locked: stay put and ask instead.
  useEffect(() => {
    if (!lock.locked) return;
    // A duplicate history entry absorbs the first back press. Next.js keeps its
    // own routing state in history.state, so copy it into the duplicate.
    window.history.pushState(window.history.state, "", window.location.href);
    pushedGuard.current = true;
    const onPop = () => {
      window.history.pushState(window.history.state, "", window.location.href);
      setBlocked("back");
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // Unlocked normally (saved or cancelled): drop the duplicate entry.
      if (pushedGuard.current) {
        pushedGuard.current = false;
        window.history.back();
      }
    };
  }, [lock.locked]);

  const guard = (e: React.MouseEvent, href: string) => {
    if (!lock.locked || isActive(href)) return;
    e.preventDefault();
    setBlocked(href);
  };

  const leaveAnyway = () => {
    const target = blocked;
    setBlocked(null);
    // Skip the history clean-up; we're navigating away ourselves.
    pushedGuard.current = false;
    setLock({ locked: false });
    if (target === "back") window.history.go(-2);
    else if (target) router.push(target);
  };

  const signOut = async () => {
    if (!confirm("Sign out of Restock?")) return;
    await createClient().auth.signOut();
    resetStores();
    router.push("/login");
    router.refresh();
  };

  const newStore = async () => {
    setMenuOpen(false);
    const name = prompt("Store name")?.trim();
    if (!name) return;
    try {
      await createStore(name);
      toast.success(`${name} created`);
    } catch (error) {
      toast.error(error);
    }
  };

  const pickStore = (id: string) => {
    setMenuOpen(false);
    if (id === current?.store_id) return;
    if (lock.locked)
      return toast.error("Save or cancel counting before switching stores.");
    switchStore(id);
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-30 md:relative border-b border-black/5 bg-[#F2F2F7]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6 sm:px-4">
          <Link
            href="/"
            onClick={(e) => guard(e, "/")}
            className="flex items-center gap-2 text-[17px] font-bold"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand text-white">
              <Package className="h-[18px] w-[18px]" />
            </span>
            Restock
          </Link>

          <nav className="flex items-center gap-1 rounded-full bg-black/5 p-1 md:hidden">
            {tabs.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={(e) => guard(e, href)}
                aria-disabled={lock.locked && !isActive(href)}
                className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  isActive(href)
                    ? "bg-white text-brand shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                } ${lock.locked && !isActive(href) ? "opacity-40" : ""}`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {href === "/shoppinglist" && remaining > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-[18px] text-white">
                    {remaining}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Account"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/15 font-bold uppercase text-brand"
            >
              {email?.charAt(0) ?? "?"}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-11 w-64 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5">
                {current && (
                  <div className="border-b border-black/5 pb-2">
                    <div className="px-3 pb-1 pt-1 text-xs font-semibold uppercase text-gray-400">
                      Store
                    </div>
                    {(memberships ?? []).map((m) => (
                      <button
                        key={m.store_id}
                        onClick={() => pickStore(m.store_id)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-black/5"
                      >
                        <span className="flex-1 truncate font-semibold">
                          {m.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {m.role === "admin" ? "Admin" : "Shopper"}
                        </span>
                        {m.store_id === current.store_id && (
                          <Check className="h-4 w-4 text-brand" />
                        )}
                      </button>
                    ))}
                    {isAdmin && (
                      <Link
                        href="/store"
                        onClick={(e) => {
                          setMenuOpen(false);
                          guard(e, "/store");
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-black/5"
                      >
                        <Settings className="h-4 w-4" />
                        Store Settings
                      </Link>
                    )}
                    {isSuperAdmin && (
                    <button
                      onClick={newStore}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-black/5"
                    >
                      <Plus className="h-4 w-4" />
                      New Store…
                    </button>
                    )}
                  </div>
                )}
                <div className="truncate px-3 py-2 text-sm text-gray-500">
                  {email}
                </div>
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Phone tab bar */}
      <nav
        className={`fixed inset-x-3 bottom-3 z-30 hidden ${tabs.length === 4 ? "grid-cols-4" : "grid-cols-2"} rounded-full bg-white/85 p-1.5 shadow-lg ring-1 ring-black/5 backdrop-blur md:grid`}
      >
        {tabs.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={(e) => guard(e, href)}
            aria-disabled={lock.locked && !isActive(href)}
            className={`relative flex flex-col items-center gap-0.5 rounded-full py-1.5 text-[11px] font-semibold ${
              isActive(href) ? "bg-brand/10 text-brand" : "text-gray-700"
            } ${lock.locked && !isActive(href) ? "opacity-40" : ""}`}
          >
            <Icon className="h-[22px] w-[22px]" />
            {label}
            {href === "/shoppinglist" && remaining > 0 && (
              <span className="absolute right-[22%] top-0.5 rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-[18px] text-white">
                {remaining}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <Confirm
        open={blocked !== null}
        title={lock.reason ?? "Finish counting first"}
        message="Save your counts or cancel counting before leaving this page."
        confirmLabel="Keep Counting"
        showCancel={false}
        onConfirm={() => {}}
        onClose={() => setBlocked(null)}
        extra={
          <Btn variant="danger" onClick={leaveAnyway}>
            Leave Without Saving
          </Btn>
        }
      />
    </>
  );
};

export default NavBar;
