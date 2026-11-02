import React from "react";
import HistoryPage from "./HistoryPage";
import { redirect } from "next/navigation";
import { createClient } from "../utils/supabase/server";

const page = async () => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }
  return <HistoryPage />;
};

export default page;
