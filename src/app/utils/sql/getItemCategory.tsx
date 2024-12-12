import { createClient } from "../supabase/client";

const supabase = createClient();
const getIemCategory = async () => {
  const { data, error } = await supabase.rpc("get_item_category_enum");

  if (error) {
    console.error("Error getting item category:", error.message);
    return { success: false, error: error.message };
  } else {
    return { success: true, data };
  }
};
export default getIemCategory;
