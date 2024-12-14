import { createClient } from "../supabase/client";

const supabase = createClient();

const getAllItem = async () => {
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
    });

  if (error) {
    console.error("Error getting shopping list:", error.message);
    return { success: false, error: error.message };
  } else {
    return { success: true, data };
  }
};

export default getAllItem;
