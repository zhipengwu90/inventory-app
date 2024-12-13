"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "../../utils/supabase/server";
export async function login(email: string, password: string) {
  const supabase = await createClient();

  const data = {
    email,
    password,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { success: false, message: error.message };
  } else {
    return { success: true };
  }
  // console.log("login successful");
  // revalidatePath("/", "layout");
  // redirect("/private");
}
