import React from "react";
import { redirect } from "next/navigation";
import HomeContent from "./homePagePart/HomeContent";
import { createClient } from "../utils/supabase/server";
type Props = {};

const page = async (props: Props) => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }
  return (
    <div className="min-h-screen py-4 px-32 xl:px-24 lg:px-16 md:px-12 sm:px-6 xs:px-2">
      <HomeContent />
      
    </div>
  );
};

export default page;
