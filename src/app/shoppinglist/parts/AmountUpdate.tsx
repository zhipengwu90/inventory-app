import { Backdrop, Button, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import CloseIcon from "@mui/icons-material/Close";
import React, { useState } from "react";
import updateShoppingAmount from "@/app/utils/sql/updateShoppingAmount";
import Alert from "@mui/material/Alert";
import shopping_history from "@/app/utils/sql/shopping_history";

type Props = {
  setAmountWindow: React.Dispatch<React.SetStateAction<boolean>>;
  amountDetail: any;
  getData: () => void;
};

const AmountUpdate = (props: Props) => {
  const { setAmountWindow, amountDetail, getData } = props;
  const [amount, setAmount] = useState(amountDetail?.amount);
  const [alert, setAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isError, setIsError] = useState(false);



  const handleSubmit = async () => {
    const result = await updateShoppingAmount(amountDetail.id, amount);
    console.log(amountDetail.id, amount);
    if (result.success) {
      setAlert(true);
      setAlertMessage("Amount updated successfully!");
      setIsError(false);
      getData();
      setTimeout(() => {
        setAmountWindow(false);
      }, 500);
    } else {
      setAlert(true);
      setAlertMessage("Error updating amount, please try again!");
      setIsError(true);
    }

    // setAmountWindow(false);
  };
  return (
    <>
      <Backdrop
        className="z-40"
        open={true}
        onClick={() => setAmountWindow(false)}
      />

      <div className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-1/3 lg:w-2/3 h-1/4 lg:h-1/3 bg-white z-50 rounded-lg text-dark flex flex-col justify-center items-center gap-6 shadow-lg border">
        <IconButton
          className="absolute top-1 right-1"
          onClick={() => setAmountWindow(false)}
        >
          <CloseIcon />
        </IconButton>

        {alert && (
          <Alert
            className=" flex justify-center items-center"
            severity={isError ? "error" : "success"}
          >
            {alertMessage}
          </Alert>
        )}
        <div className="text-lg font-bold">{amountDetail?.item_list.name}</div>
        <p>Shopping Amount: </p>
        <div className="flex flex-row justify-center items-center">
          <IconButton
            size="medium"
            sx={{ paddingLeft: 2, paddingRight: 2 }}
            color="primary"
            onClick={() => {
              if (amount > 0) {
                setAmount(amount - 1);
              }
            }}
          >
            <RemoveIcon />
          </IconButton>
          <div>{amount}</div>
          <IconButton
            size="medium"
            sx={{ paddingLeft: 2, paddingRight: 2 }}
            color="primary"
            onClick={() => {
              setAmount(amount + 1);
            }}
          >
            <AddIcon />
          </IconButton>
        </div>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleSubmit()}
        >
          Done
        </Button>
      </div>
    </>
  );
};

export default AmountUpdate;
