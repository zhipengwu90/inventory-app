import Image from "next/image";

import LoginPage from "./login/loginPart/Login";
import { redirect } from "next/navigation";

import { createClient } from "./utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (!error || data?.user) {
    redirect("/home");
  } else {
    return (
      <div>
        <LoginPage />;
      </div>
    );
  }
}
