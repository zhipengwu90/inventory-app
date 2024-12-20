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
    <div
     className=" px-32 xl:px-24 lg:px-16 md:px-12 sm:px-6 xs:px-2  "
    >
      <ShoppingListPage user={data.user} />
    </div>
  );
}
