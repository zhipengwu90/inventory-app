import { createClient } from "../supabase/client";

const supabase = createClient();

const updateItemPlace = async (locationName: string) => {

  const { data, error } = await supabase.rpc("add_item_location", { new_value: locationName });
  console.log("add_item_location data", data);
  if (error) {
    console.error("Error adding item location:", error.message);
    return { success: false, error: error.message };
  } else {
    return { success: true, data };
  }
};

export default updateItemPlace;
