import Image from "next/image";

import HomePage from "./home/HomePage";
import { redirect } from "next/navigation";

import { createClient } from "./utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  // if (!error || data?.user) {
  //   redirect("/home");
  // }
  return (
    <div>
      <HomePage />;
    </div>
  );
}
