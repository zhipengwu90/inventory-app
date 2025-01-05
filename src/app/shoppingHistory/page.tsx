import React from "react";
import HistoryPage from "./components/HistoryPage";
import { redirect } from "next/navigation";
import { createClient } from "../utils/supabase/server";
type Props = {};

const page = async (props: Props) => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }
  return (
    <HistoryPage className=" px-32 xl:px-24 lg:px-16 md:px-12 sm:px-6 xs:px-2   min-h-[80vh] " />
  );
};

export default page;
