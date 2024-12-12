import React from "react";
import { redirect } from "next/navigation";
import ShoppingListPage from "./parts/ShoppingListPage";
import { createClient } from "../utils/supabase/server";
type Props = {};

export default async function ShoppingList() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  return (
    <div>
      <div className="px-32 lg:px-4 ">Hello {data.user.email}</div>
      <ShoppingListPage user={data.user} />
    </div>
  );
}
