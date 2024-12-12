import { createClient } from "../supabase/client";

const supabase = createClient();

const deleteItem = async (item_id: number) => {
  //delete old data from shopping_list
  const { error: deleteError } = await supabase
    .from("item_list")
    .delete()
    .eq("id", item_id);

  if (deleteError) {
    console.error("Error deleting shopping list:", deleteError.message);
    return { success: false, error: deleteError.message };
  } else {
    return { success: true };
  }
};

export default deleteItem;
