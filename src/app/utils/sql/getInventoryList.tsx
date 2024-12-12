
import { createClient } from "../supabase/client";

const supabase = createClient();
const getInventoryList = async () => {
  const { data, error } = await supabase
    .from("item_list")
    .select(
      `*,
     current_inventory (
  *
    
    )
    `
    )
    .order("name", { ascending: true })
    .order("timestamps", {
      foreignTable: "current_inventory",
      ascending: false,
    })
    .limit(1, { foreignTable: "current_inventory" });

  if (error) {
    console.error("Error updating inventory:", error.message);
    return { success: false, error: error.message };
  } else {
    return { success: true, data: data };
  }
};

export default getInventoryList;
