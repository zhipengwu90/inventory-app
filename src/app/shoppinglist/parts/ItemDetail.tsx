import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  Box,
  Modal,
  IconButton,
  Button,
  Alert,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { Select, MenuItem } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import getIemCategory from "../../utils/sql/getItemCategory";
import getShoppingPlace from "../../utils/sql/getShoppingPlace";
import uploadItemImage from "../../utils/sql/uploadItemImage";
import saveItemDetail from "../../utils/sql/saveItemDetail";
import deleteItem from "../../utils/sql/deleteItem";
import BackspaceIcon from "@mui/icons-material/Backspace";

type Props = {
  itemDetail: any;
  setDetailWindow: React.Dispatch<React.SetStateAction<boolean>>;
  isEditing: boolean;
};

const ItemDetail = (props: Props) => {
  const { itemDetail, setDetailWindow, isEditing } = props;
  const [isEditDetail, setIsEditDetail] = useState(false);
  const [itemCategory, setItemCategory] = useState<any | null>(null);
  const [price, setPrice] = useState(itemDetail?.price || "");
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(itemDetail?.img_url || "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comment, setComment] = useState(itemDetail?.comment || "");
  const [itemName, setItemName] = useState(itemDetail?.name || "");
  const [alert, setAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isError, setIsError] = useState(false);

  console.log("itemDetail", itemDetail);

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const [itemCategoryValue, setItemCategoryValue] = useState(
    itemDetail?.item_category || ""
  );
  const [shoppingPlace, setShoppingPlace] = useState<any | null>(null);
  const [shoppingPlaceValue, setShoppingPlaceValue] = useState(
    itemDetail?.shopping_place || ""
  );

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

      const result = await uploadItemImage(file, itemDetail?.name);

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
    let id = itemDetail?.id;

    setIsUploading(true);
    const { success, error } = await saveItemDetail(
      id,
      itemName,
      price,
      itemCategoryValue,
      shoppingPlaceValue,
      comment,
      imageUrl
    );

    if (!success) {
      setIsError(true);
      setAlert(true);
      setAlertMessage("Error updating item details");
      console.error("Error updating min amount:", error);
      setIsUploading(false);
      return;
    } else {
      console.log("Item updated successfully");
      setAlert(true);
      setAlertMessage("Item updated successfully");
      setIsUploading(false);
      setIsEditDetail(false);
      //fresh the page
      //wait for 1 second before reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleDelete = async () => {
    let id = itemDetail?.id;
    setIsUploading(true);
    const { success, error } = await deleteItem(id);

    if (!success) {
      setIsError(true);
      setAlert(true);
      setAlertMessage("Error deleting item");
      console.error("Error deleting item:", error);
      setIsUploading(false);
      return;
    } else {
      console.log("Item deleted successfully");
      setAlert(true);
      setAlertMessage("Item deleted successfully");
      setIsUploading(false);

      //fresh the page
      //wait for 1 second before reload
      setTimeout(() => {
        setDetailWindow(false);
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <>
      <Backdrop sx={{ color: "#fff" }} open={isUploading} className="z-20">
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
        className="fixed inset-0 bg-black bg-opacity-50 z-10"
        onClick={() => setDetailWindow(false)}
      ></div>
      <div className="fixed  top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]  w-4/5 h-3/4 bg-white  z-10 rounded-lg shadow-md  overflow-y-auto">
        <div className=" sticky p-1 pl-3  top-0 right-0 ">
          <IconButton
            onClick={() => setDetailWindow(false)}
            className="absolute top-0 right-0"
          >
            <CloseIcon className="text-dark " />
          </IconButton>
        </div>

        <div className="grid grid-cols-10 text-dark px-3 pt-5  gap-y-2">
          {isEditing && (
            <Alert
              className="col-span-10 flex justify-center items-center"
              severity="error"
            >
              You can't edit the item details while in the inventory edit mode.
            </Alert>
          )}
          <div className="col-span-4 lg:col-span-5 font-semibold">Name:</div>
          {isEditDetail ? (
            <input
              type="text"
              className="col-span-6 lg:col-span-5 border border-gray-300 rounded-sm px-1"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
          ) : (
            <div className="col-span-6  lg:col-span-5 ">{itemDetail?.name}</div>
          )}
          <div className="col-span-4 lg:col-span-5 font-semibold">Price:</div>
          {isEditDetail ? (
            <input
              type="number"
              min="0"
              className="col-span-6 lg:col-span-5 border border-gray-300 rounded-sm px-1"
              value={isNaN(price) ? "" : price}
              onChange={(e) => setPrice(e.target.valueAsNumber)}
            />
          ) : (
            <div className="col-span-6 lg:col-span-5 ">{itemDetail?.price}</div>
          )}

          <div className="col-span-4 lg:col-span-5 font-semibold">
            Category:
          </div>

          {isEditDetail ? (
            <select
              className="col-span-6 lg:col-span-5 border border-gray-300 rounded-sm px-1"
              onChange={(e) => setItemCategoryValue(e.target.value)}
              value={itemCategoryValue}
            >
              {itemCategory?.map((item: any, index: number) => (
                <option key={index} value={item.enum_value}>
                  {item.enum_value}
                </option>
              ))}
            </select>
          ) : (
            <div className="col-span-6  lg:col-span-5 ">
              {itemDetail?.item_category}
            </div>
          )}

          <div className="col-span-4 lg:col-span-5 font-semibold">
            Shopping Place:
          </div>

          {isEditDetail ? (
            <select
              className="col-span-6 lg:col-span-5 border border-gray-300 rounded-sm px-1"
              onChange={(e) => setShoppingPlaceValue(e.target.value)}
              value={shoppingPlaceValue}
            >
              {shoppingPlace?.map((item: any, index: number) => (
                <option key={index} value={item.enum_value}>
                  {item.enum_value}
                </option>
              ))}
            </select>
          ) : (
            <div className="col-span-6 lg:col-span-5 ">
              {itemDetail?.shopping_place}
            </div>
          )}
          {/* 
          <div className="col-span-4 font-semibold">Location:</div>
          <div className="col-span-6 ">{itemDetail?.item_location}</div> */}
          <div className="col-span-10 font-semibold">Comment:</div>

          {isEditDetail ? (
            <textarea
              className="col-span-10 border border-gray-300 rounded-sm pl-3"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          ) : (
            <div className="col-span-10 pl-3 ">{itemDetail?.comment}</div>
          )}
          <div className="col-span-10 font-semibold">Image:</div>
          <div className="col-span-10 flex justify-center items-center">
            {imageUrl ? (
              isEditDetail ? (
                <div className="flex flex-col relative justify-center items-center gap-3 border border-gray-300 p-3">
                  <Image
                    src={imageUrl}
                    alt={itemDetail?.name}
                    width={200}
                    height={200}
                  />
                  <IconButton
                    className="absolute top-1 right-2   bg-white opacity-90 hover:bg-white"
                    color="error"
                    onClick={() => setImageUrl("")}
                  >
                    <BackspaceIcon fontSize="medium" />
                  </IconButton>
                </div>
              ) : (
                <div>
                  <Image
                    src={imageUrl}
                    alt={itemDetail?.name}
                    width={200}
                    height={200}
                    onClick={handleImageClick}
                    className="cursor-pointer"
                  />

                  <Modal open={isModalOpen} onClose={handleClose}>
                    <Box
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "90%",
                        height: "90%",
                        bgcolor: "background.paper",
                        boxShadow: 24,
                        p: 4,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <IconButton
                        onClick={handleClose}
                        sx={{
                          position: "absolute",
                          zIndex: 30,
                          top: 0,
                          right: 0,
                        }}
                      >
                        <CloseIcon />
                      </IconButton>
                      <Image
                        src={imageUrl}
                        alt={itemDetail?.name}
                        layout="fill"
                        objectFit="contain"
                      />
                    </Box>
                  </Modal>
                </div>
              )
            ) : isEditDetail ? (
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
            ) : (
              <div className="w-40 h-40 bg-gray-300 flex justify-center items-center">
                no image
              </div>
            )}
          </div>

          <div className="col-span-10 flex flex-col justify-center items-center my-5 gap-3">
            <div>
              {isEditDetail ? (
                <div className="flex gap-3">
                  <Button
                    className="w-24"
                    variant="contained"
                    color="primary"
                    onClick={() => handleSave()}
                  >
                    Save
                  </Button>
                  <Button
                    className="w-24"
                    variant="contained"
                    color="error"
                    onClick={() => setIsEditDetail(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-24"
                  variant="contained"
                  color="primary"
                  disabled={isEditing}
                  onClick={() => setIsEditDetail(true)}
                >
                  Edit
                </Button>
              )}

              {/* <Button
                className="w-24"
                variant="contained"
                color="error"
                disabled={isEditing}
              >
                Delete
              </Button> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ItemDetail;
