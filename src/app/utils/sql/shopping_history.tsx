import { createClient } from "../supabase/client";

const supabase = createClient();

const shopping_history = async (
  shoppingId: string,

  shoppingPlace: any
) => {
  try {
    const results = await Promise.all(
      shoppingPlace.map(async (item: string) => {
        console.log("item", item);
        const { data, error } = await supabase.from("shopping_history").insert([
          {
            shopping_id: shoppingId,
            shopping_place: item,
          },
        ]);
        if (error) {
          console.error("Error inserting shopping history:", error);
          throw error; // Throw error to be caught by Promise.all
        }
        return data;
      })
    );

    const { error: deleteError } = await supabase
      .from("shopping_list")
      .delete()
      .neq("id", 0);

    if (deleteError) {
      console.error("Error deleting shopping list:", deleteError);
      throw deleteError; // Throw error to be caught by Promise.all
    }
    return { success: true, data: results };
  } catch (error) {
    console.error("Error inserting shopping history:", error);
    return { success: false, error: error };
  }
};

export default shopping_history;
