import React from "react";
import { redirect } from "next/navigation";
import ShoppingPage from "./ShoppingPage";
import { createClient } from "../utils/supabase/server";

export default async function ShoppingList() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  return <ShoppingPage />;
}
