import imageCompression from "browser-image-compression";
import { createClient } from "../supabase/client";

const supabase = createClient();

const uploadItemImage = async (file: File, name: string) => {
  try {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 500,
      useWebWorker: true,
    };
    const compressedFile = await imageCompression(file, options);

    let newName = name.replace(/\s/g, "_");
    const fileName = `${newName}_${Date.now()}`;

    const { data, error } = await supabase.storage
      .from("item_photo")
      .upload(fileName, compressedFile);

    if (error) {
      console.error("Error uploading image:", error.message);
      return { success: false, error: error.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("item_photo").getPublicUrl(fileName);

    if (!publicUrl) {
      console.error("Error getting public URL");
      return { success: false, error: "Error getting public URL" };
    }

    console.log("Public URL:", publicUrl);
    return { success: true, url: publicUrl };
  } catch (err) {
    console.error("Compression error:", err);
    return { success: false, error: "Compression failed" };
  }
};

export default uploadItemImage;
