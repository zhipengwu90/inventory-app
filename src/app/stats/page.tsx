import React from "react";
import { redirect } from "next/navigation";
import InsightsPage from "./InsightsPage";
import { createClient } from "../utils/supabase/server";

const page = async () => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }
  return <InsightsPage />;
};

export default page;
