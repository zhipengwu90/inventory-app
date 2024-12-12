import { createClient } from "../supabase/client";

const supabase = createClient();


const updateShoppingAmount = async (id: number, amount: number ) => {
  console.log(id, amount);

  const { error } = await supabase
    .from("shopping_list")
    .update({ amount: amount })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating shopping list:", error.message);
    return { success: false, error: error.message };
  } else {
    return { success: true };
  }
};

export default updateShoppingAmount;