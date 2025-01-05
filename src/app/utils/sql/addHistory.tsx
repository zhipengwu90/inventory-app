import { createClient } from "../supabase/client";

const supabase = createClient();

const addHistory = async (
  created_at: string,
  shopping_place: string,
  total_cost: number | string,
  comment: string
) => {
  const { error } = await supabase.from("shopping_history").insert({
    created_at: created_at,
    shopping_place: shopping_place,
    shopping_id: "None",
    total_cost: total_cost,
    comment: comment,
    paid: true,
  });

  if (error) {
    console.error("Error insert history:", error.message);
    return { success: false, error: error.message };
  } else {
    return { success: true };
  }
};

export default addHistory;
