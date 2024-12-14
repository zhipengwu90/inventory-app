import { redirect } from "next/navigation";

import { createClient } from "../utils/supabase/server";
import DataPage from "./shoppingList/DataPage";

export default async function PrivatePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  return (
    <div className="px-24 xl:px-24 lg:px-16 md:px-12 sm:px-6 xs:px-2   ">
      <DataPage />
    </div>
  );
}
