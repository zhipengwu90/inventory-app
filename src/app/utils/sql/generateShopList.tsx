import { createClient } from "../supabase/client";

const supabase = createClient();

const generateShopList = async (item_id: number, needAmount: number) => {
  //delete old data from shopping_list

  const { error } = await supabase.from("shopping_list").insert([
    {
      item_id: item_id,
      amount: needAmount,
    },
  ]);

  if (error) {
    console.error("Error updating inventory:", error.message);
    return { success: false, error: error.message };
  } else {
    return { success: true };
  }
};

export default generateShopList;
