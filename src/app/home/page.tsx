import React from "react";
import { redirect } from "next/navigation";

import { createClient } from "../utils/supabase/server";
type Props = {};

const page = async (props: Props) => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/");
  }
  return <div className="h-screen">page</div>;
};

export default page;
