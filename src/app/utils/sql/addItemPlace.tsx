import { createClient } from "../supabase/client";

const supabase = createClient();

const addItemPlace = async (item_place: string) => {
  //check the item_id if it is already in the shopping list

  const { data, error } = await supabase.from("item_place").insert([
    {
      item_place: item_place,
    },
  ]);
  if (error) {
    return { success: false, exist: false, error: error.message };
  } else {
    return { success: true, exist: false };
  }
};

export default addItemPlace;
