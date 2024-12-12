import { picture } from "motion/react-client";
import { createClient } from "../supabase/client";

const supabase = createClient();

const saveItemDetail = async (
  id: number,
  itemName: string,
  price: number | string,
  itemCategoryValue: string,
  shoppingPlaceValue: string,
  comment: string,
  imageUrl: string
) => {
  let dataToUpdate;

  if (price == null || price == "") {
    dataToUpdate = {
      name: itemName,
      item_category: itemCategoryValue,
      shopping_place: shoppingPlaceValue,
      comment: comment,
      img_url: imageUrl,
    };
  } else {
    dataToUpdate = {
      name: itemName,
      price: price,
      item_category: itemCategoryValue,
      shopping_place: shoppingPlaceValue,
      comment: comment,
      img_url: imageUrl,
    };
  }


  const { error } = await supabase
    .from("item_list")
    .update(dataToUpdate)
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error for updating:", error.message);
    return { success: false, error: error.message };
  } else {
    return { success: true };
  }
};

export default saveItemDetail;
