import { createClient } from "../supabase/client";

const supabase = createClient();
const getShoppingPlace = async () => {
  const { data, error } = await supabase.rpc("get_shopping_place_enum");

  if (error) {
    console.error("Error getting item category:", error.message);
    return { success: false, error: error.message };
  } else {
    return { success: true, data };
  }
};
export default getShoppingPlace;
