import { createClient } from "../supabase/client";

const supabase = createClient();

const shoppingComplete = async (item: any, shoppingId: any) => {
  //   console.log(item);
  //   console.log(shoppingId);
  let shopped_amount = item.amount;

  //find the id from current_inventory where the item_id is equal to the item_id, only return the most recent one base on the timestamps

  const { data: currentInventory, error } = await supabase
    .from("current_inventory")
    .select()
    .eq("item_id", item.item_id)
    .order("timestamps", { ascending: false });

  if (error) {
    console.log(error);
  }

  if (currentInventory && currentInventory.length > 0) {
    const latestInventory = currentInventory[0];

    const { data: updatedData, error: updatedError } = await supabase
      .from("current_inventory")
      .update({ shopped_amount: shopped_amount, shopping_id: shoppingId })
      .eq("id", latestInventory.id);

    if (updatedError) {
      return { success: false, error: updatedError.message };
    } else {
      return { success: true };
    }
  } else {
    console.log("No current inventory found");

    const { data: insertData, error: insertError } = await supabase
      .from("current_inventory")
      .insert([
        {
          item_id: item.item_id,
          count_amount: 0,
          shopped_amount: shopped_amount,
          shopping_id: shoppingId,
        },
      ]);

    if (insertError) {
      return { success: false, error: insertError.message };
    } else {
      return { success: true };
    }
  }
};
export default shoppingComplete;
