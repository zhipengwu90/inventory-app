import { createClient } from "../supabase/client";

const supabase = createClient();
const getItemPlace = async () => {
  const { data , error } = await supabase.from("item_place").select(
    `*`
  );

  if (error) {
    console.error("Error getting item place:", error.message);
    return { success: false, error: error.message };
  } else {

    
    return { success: true, data };
  }

};
export default getItemPlace;
