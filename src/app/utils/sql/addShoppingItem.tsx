import { createClient } from "../supabase/client";

const supabase = createClient();

const addNewItem = async (id: number, amount: number) => {
  //check the item_id if it is already in the shopping list

  const { data, error } = await supabase
    .from("shopping_list")
    .select()
    .eq("item_id", id);

  if (error) {
    return { success: false, exist: false, error: error.message };
  } else {
    if (data && data.length > 0) {
      return {
        success: false,
        exist: true,
        error: "Item already in shopping list",
      };
    } else {
      const { error } = await supabase.from("shopping_list").insert([
        {
          item_id: id,
          amount: amount,
        },
      ]);
      if (error) {
        return { success: false, exist: false, error: error.message };
      } else {
        return { success: true, exist: false };
      }
    }
  }
};

export default addNewItem;
