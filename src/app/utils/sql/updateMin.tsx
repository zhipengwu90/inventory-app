import { createClient } from "../supabase/client";

const supabase = createClient();
const updateMin = async (id: number, min: number) => {
  const { error } = await supabase
    .from("item_list")
    .update({ min_amount: min })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating min amount:", error.message);
    return { success: false, error: error.message };
  } else {
    return { success: true };
  }
};

export default updateMin;
