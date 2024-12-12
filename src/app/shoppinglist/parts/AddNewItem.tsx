import {
  Alert,
  Backdrop,
  Button,
  CircularProgress,
  IconButton,
} from "@mui/material";
import React, { useState, useEffect, useRef } from "react";
import CloseIcon from "@mui/icons-material/Close";
import getIemCategory from "../../utils/sql/getItemCategory";
import getShoppingPlace from "../../utils/sql/getShoppingPlace";
import uploadItemImage from "../../utils/sql/uploadItemImage";
import Image from "next/image";
import addNewItem from "../../utils/sql/addNewItem";
type Props = {
  setIsAddItemOpen: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
  fetchData: () => void;
};

const AddNewItem = (props: Props) => {
  const { setIsAddItemOpen, className, fetchData } = props;

  const [itemCategory, setItemCategory] = useState<any | null>();
  const [price, setPrice] = useState<number | string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null | undefined>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comment, setComment] = useState<string>("");
  const [itemName, setItemName] = useState<string>("");
  const [alert, setAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string>("");
  const [isError, setIsError] = useState(false);
  const [itemCategoryValue, setItemCategoryValue] = useState("");
  const [shoppingPlace, setShoppingPlace] = useState<any | null>(null);
  const [shoppingPlaceValue, setShoppingPlaceValue] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);

      const result = await uploadItemImage(
        file,
        itemName ? itemName : "newItem"
      );

      if (result.success) {
        setImageUrl(result.url);
      }
      setIsUploading(false);
    }
  };

  const getItemCategoryHandler = async () => {
    try {
      const { data, error } = await getIemCategory();

      if (error) {
        throw new Error(error);
      }
      setItemCategory(data);
    } catch (error) {
      console.error("Error getting item category:", error);
    }
  };

  const getShoppingPlaceHandler = async () => {
    try {
      const { data, error } = await getShoppingPlace();

      if (error) {
        throw new Error(error);
      }
      setShoppingPlace(data);
    } catch (error) {
      console.error("Error getting shopping place:", error);
    }
  };
  useEffect(() => {
    getItemCategoryHandler();
    getShoppingPlaceHandler();
  }, []);

  const handleSave = async () => {
    setIsUploading(true);

    const { success, error } = await addNewItem(
      itemName,
      price,
      itemCategoryValue,
      shoppingPlaceValue,
      comment,
      imageUrl || ""
    );

    if (!success) {
      setIsError(true);
      setAlert(true);
      setAlertMessage("Error adding item");

      setIsUploading(false);
      return;
    } else {
      setAlert(true);
      setAlertMessage("Item added successfully");
      setIsUploading(false);

      setTimeout(() => {
        setIsAddItemOpen(false);
        fetchData();
      }, 1000);
    }
  };

  return (
    <div className={className}>
      <Backdrop sx={{ color: "#fff" }} open={isUploading} className="z-50">
        <CircularProgress color="success" />
      </Backdrop>

      {alert && (
        <Alert
          variant="filled"
          onClose={() => {
            setAlert(false);
            setAlertMessage("");
            setIsError(false);
          }}
          className="fixed top-[50%] left-[50%] translate-x-[-50%] z-50"
          severity={isError ? "error" : "success"}
        >
          {alertMessage}
        </Alert>
      )}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-30"
        onClick={() => setIsAddItemOpen(false)}
      ></div>
      <div className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]  w-4/5 h-3/4 bg-white  z-30 rounded-lg shadow-md  overflow-y-auto">
        <div className="sticky top-0 right-0 bg-white ">
          <IconButton
            onClick={() => setIsAddItemOpen(false)}
            className="absolute top-setIsAddItemOpen right-0"
          >
            <CloseIcon className="text-dark " />
          </IconButton>
        </div>
        <h1 className="text-center text-2xl font-semibold text-dark pt-3">
          Add Item
        </h1>
        <div className="grid grid-cols-10 text-dark px-3 pt-2 pb-7 gap-y-2">
          <div className="col-span-4 lg:col-span-5 font-semibold">
            Name <span className=" text-red-600">*</span>
          </div>
          <input
            type="string"
            placeholder="Name"
            className="col-span-6 lg:col-span-5 border border-gray-300 rounded-sm px-1"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          <div className="col-span-4 lg:col-span-5 font-semibold">Price:</div>
          <input
            type="number"
            min="0"
            className="col-span-6 lg:col-span-5 border border-gray-300 rounded-sm px-1"
            value={price}
            onChange={(e) => setPrice(e.target.valueAsNumber)}
          />
          <div className="col-span-4 lg:col-span-5 font-semibold">
            Category <span className=" text-red-600">*</span>
          </div>
          <select
            className="col-span-6 lg:col-span-5 border border-gray-300 rounded-sm px-1"
            onChange={(e) => setItemCategoryValue(e.target.value)}
            value={itemCategoryValue}
            required
          >
            <option defaultValue="">Select Category</option>
            {itemCategory?.map((item: any, index: number) => (
              <option key={index} value={item.enum_value}>
                {item.enum_value}
              </option>
            ))}
          </select>
          <div className="col-span-4 lg:col-span-5 font-semibold">
            Shopping Place <span className=" text-red-600">*</span>
          </div>
          <select
            className="col-span-6 lg:col-span-5 border border-gray-300 rounded-sm px-1"
            onChange={(e) => setShoppingPlaceValue(e.target.value)}
            value={shoppingPlaceValue}
          >
            <option defaultValue="">Select Shopping Place</option>
            {shoppingPlace?.map((item: any, index: number) => (
              <option key={index} value={item.enum_value}>
                {item.enum_value}
              </option>
            ))}
          </select>
          <div className="col-span-10 font-semibold">Comment:</div>
          <textarea
            className="col-span-10 border border-gray-300 rounded-sm pl-3"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="col-span-10 font-semibold">Image:</div>

          <div className="col-span-10 flex justify-center items-center">
            {imageUrl ? (
              <div className="flex flex-col justify-center items-center gap-3 border border-gray-300 p-3">
                <Image src={imageUrl} alt={itemName} width={200} height={200} />
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => setImageUrl("")}
                >
                  Delete Image
                </Button>
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center gap-3 border border-gray-300 p-3">
                <div className="w-40 h-40 bg-gray-300 flex justify-center items-center">
                  No Image
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />

                <Button
                  variant="contained"
                  color="success"
                  onClick={handleUploadClick}
                >
                  Upload Image
                </Button>
              </div>
            )}
          </div>
          <div className="col-span-10 flex flex-col justify-center items-center my-5 gap-3">
            <Button
              className="w-1/3"
              variant="contained"
              color="primary"
              onClick={() => handleSave()}
              disabled={!itemName || !itemCategoryValue || !shoppingPlaceValue}
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNewItem;
