import { createClient } from "../supabase/client";

const supabase = createClient();

const updateHistory = async (
  id: number,
  total_cost: number,
  comment: string,
  paid: boolean
) => {
  const { error } = await supabase
    .from("shopping_history")
    .update({ total_cost: total_cost, comment: comment, paid: paid })
    .eq("id", id);

  if (error) {
    console.error("Error updating history:", error.message);
    return { success: false, error: error.message };
  } else {
    return { success: true };
  }
};

export default updateHistory;
