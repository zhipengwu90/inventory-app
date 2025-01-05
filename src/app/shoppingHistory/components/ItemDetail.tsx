import {
  Backdrop,
  Button,
  Alert,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import React, { useState } from "react";
import updateHistory from "@/app/utils/sql/updateHistory";

type Props = {
  setShowDetails: React.Dispatch<React.SetStateAction<boolean>>;
  itemDetails: any;
};

const ItemDetail = (props: Props) => {
  const { setShowDetails, itemDetails } = props;
  const [isSaving, setIsSaving] = useState(false);
  const [price, setPrice] = useState(itemDetails.total_cost ? itemDetails.total_cost : '');
  const [paid, setPaid] = useState(itemDetails.paid);
  const [comment, setComment] = useState(itemDetails.comment);
  const [alert, setAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [error, setError] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateHistory(itemDetails.id, price, comment, paid);
    if (result.success) {
      setIsSaving(false);

      setAlert(true);
      setAlertMessage("Saved successfully");
      setTimeout(() => {
        setAlert(false);
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <>
      {isSaving && (
        <div className="z-50 fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]   ">
          <CircularProgress color="inherit" />
        </div>
      )}
      <Backdrop
        sx={{ color: "#fff" }}
        open={true}
        className="z-20"
        onClick={() => setShowDetails(false)}
      ></Backdrop>
      <div className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]  w-4/5  bg-white  z-30 rounded-lg shadow-md  overflow-y-auto flex justify-center">
        {alert && (
          <div className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
            <Alert severity={error ? "error" : "success"}>{alertMessage}</Alert>
          </div>
        )}
        <div className="grid grid-cols-5 p-5 gap-4 place-items-center">
          <div className="fixed top-2 right-2 z-50">
            <IconButton onClick={() => setShowDetails(false)}>
              <CloseIcon />
            </IconButton>
          </div>

          <div className=" col-span-1">Date</div>

          <div className=" col-span-4  place-self-center">
            {new Date(itemDetails.created_at).toISOString().split("T")[0]}
          </div>

          <div className=" col-span-1">Place</div>
          <div className=" col-span-4  place-self-center">
            {itemDetails.shopping_place}
          </div>
          <div className=" col-span-1">Cost</div>
          <div className=" col-span-4 place-self-center  flex justify-center items-center">
            $
            <input
              type="number"
              className="border border-gray-300 rounded-md p-1 ml-2 "
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div className=" col-span-1">ID</div>
          <div className=" col-span-4  place-self-center">
            {itemDetails.shopping_id.split("-")[0]}
          </div>
          <div className=" col-span-1">Paid?</div>
          <div className=" col-span-4  place-self-center">
            {
              <form className="flex items-center justify-center gap-4">
                <input
                  type="radio"
                  id="paidYes"
                  name="paymentStatus"
                  className="border border-gray-300 rounded-md p-1"
                  value="yes"
                  checked={paid === true}
                  onChange={() => setPaid(true)}
                />
                <label htmlFor="paidYes">Yes</label>

                <input
                  type="radio"
                  id="paidNo"
                  name="paymentStatus"
                  className="border border-gray-300 rounded-md p-1"
                  value="no"
                  checked={paid === false}
                  onChange={() => setPaid(false)}
                />
                <label htmlFor="paidNo">No</label>
              </form>
            }
          </div>
          <div className=" col-span-1">Comment</div>
          <div className=" col-span-5  place-self-start w-full">
            <textarea
              className="border border-gray-300 rounded-md p-1 w-full h-20"
              value={comment ? comment : ""}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="col-span-5">
            <Button variant="contained" color="primary" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
export default ItemDetail;
