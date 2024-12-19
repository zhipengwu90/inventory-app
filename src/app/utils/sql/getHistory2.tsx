import { createClient } from "../supabase/client";

const supabase = createClient();
const getHistory = async () => {
  const { data, error } = await supabase
    .from("shopping_history_duplicate")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching history:", error.message);
    return {
      success: false,
      error: error,
    };
  } else {
    return {
      success: true,
      data: data,
    };
  }
};

export default getHistory;
