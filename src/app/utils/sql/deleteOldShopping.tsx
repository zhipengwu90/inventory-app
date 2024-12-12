import { createClient } from "../supabase/client";

const supabase = createClient();
const deleteOldShopping = async () => {
  //delete old data from shopping_list
  const { error: deleteError } = await supabase
    .from("shopping_list")
    .delete()
    .neq("id", 0);

  if (deleteError) {
    console.error("Error deleting shopping list:", deleteError.message);
    return { success: false, error: deleteError.message };
  } else {
    return { success: true };
  }
};
export default deleteOldShopping;
