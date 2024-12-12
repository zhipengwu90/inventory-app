import { createClient } from "../supabase/client";

const supabase = createClient();

const shoppingCheck = async (id: number, checked: boolean) => {
  console.log(id, checked);

  const { error } = await supabase
    .from("shopping_list")
    .update({ shopped: checked })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating shopping list:", error.message);
    return { success: false, error: error.message };
  } else {
    return { success: true };
  }
};

export default shoppingCheck;
