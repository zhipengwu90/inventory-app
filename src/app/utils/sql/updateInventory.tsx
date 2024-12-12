
import { createClient } from "../supabase/client";

const supabase = createClient();

const updateInventory = async (
  item_id: number,
  count_amount: number,
  previous_total: number
) => {
  //insert new data into current_inventory
  const localDate = new Date();
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const formattedDate = localDate
    .toLocaleDateString("en-CA", options)
    .split("/")
    .join("-"); // Format as YYYY-MM-DD

     console.log(item_id, count_amount, previous_total, formattedDate);

  const { error } = await supabase.from("current_inventory").insert([
    {
      item_id: item_id,
      count_amount: count_amount,
      previous_total: previous_total,
      date: formattedDate,
    },
  ]);

  if (error) {
    console.error("Error updating inventory:", error.message);
    return { success: false, error: error.message };
  } else {
    return { success: true };
  }
};
export default updateInventory;
