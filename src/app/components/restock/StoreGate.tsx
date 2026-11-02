"use client";
import React, { Fragment, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Store, WifiOff } from "lucide-react";
import { createClient } from "@/app/utils/supabase/client";
import { Btn, Empty, Spinner } from "./ui";
import { useToast } from "./Toast";
import { createStore, loadStores, useStore } from "./useStore";

/** Pages only admins can open; shoppers are sent to the shopping list. */
const isAdminOnly = (path: string) =>
  path === "/" || path.startsWith("/stats") || path.startsWith("/store");

/**
 * Wraps signed-in pages: loads the user's stores, asks users with none to get
 * added or create one, keeps shoppers to their pages, and remounts the page
 * when the store changes so it reloads that store's data.
 */
export default function StoreGate({ children }: { children: React.ReactNode }) {
  const { memberships, current, isAdmin, error } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const blocked = current !== null && !isAdmin && isAdminOnly(pathname);

  useEffect(() => {
    if (memberships === null) loadStores();
  }, [memberships]);

  useEffect(() => {
    if (blocked) router.replace("/shoppinglist");
  }, [blocked, router]);

  if (error && memberships === null)
    return (
      <Empty
        icon={<WifiOff className="h-12 w-12" />}
        title="Couldn't Load Your Stores"
        message={error}
      >
        <Btn onClick={() => loadStores()}>Try Again</Btn>
      </Empty>
    );
  if (memberships === null || blocked) return <Spinner />;
  if (!current) return <NoStore />;
  return <Fragment key={current.store_id}>{children}</Fragment>;
}

function NoStore() {
  const toast = useToast();
  const { isSuperAdmin } = useStore();
  const [email, setEmail] = React.useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const create = async () => {
    const name = prompt("Store name")?.trim();
    if (!name) return;
    try {
      await createStore(name);
    } catch (error) {
      toast.error(error);
    }
  };

  return (
    <Empty
      icon={<Store className="h-12 w-12" />}
      title="No Store Yet"
      message={
        isSuperAdmin
          ? "Create the first store to get started."
          : `Ask a store admin to add ${email ?? "your email"} to their store.`
      }
    >
      {isSuperAdmin && <Btn onClick={create}>Create a Store</Btn>}
      <Btn variant="plain" onClick={() => loadStores()}>
        Check Again
      </Btn>
    </Empty>
  );
}
