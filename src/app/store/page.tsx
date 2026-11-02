import { redirect } from "next/navigation";
import StorePage from "./StorePage";
import { createClient } from "../utils/supabase/server";

export default async function StoreSettings() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  // Admin-only; StoreGate sends shoppers to the shopping list.
  return <StorePage />;
}
