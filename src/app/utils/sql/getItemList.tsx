
import { createClient } from "../supabase/client";

const supabase = createClient();

const getShoppingList = async () => {
  const { data , error } = await supabase.from("item_list").select(
    `id, name `
  );

  if (error) {
    console.error("Error getting shopping list:", error.message);
    return { success: false, error: error.message };
  } else {
    return { success: true, data };
  }
};

export default getShoppingList;
