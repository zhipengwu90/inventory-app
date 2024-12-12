import { Backdrop, Button, IconButton } from "@mui/material";
import React, { useState, useEffect } from "react";
import CloseIcon from "@mui/icons-material/Close";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import getItemList from "@/app/utils/sql/getItemList";
import addNewItem from "@/app/utils/sql/addShoppingItem";
import Alert from "@mui/material/Alert";
import AddNewItem from "./AddNewItem";
type Props = {
  setIsAddItem: React.Dispatch<React.SetStateAction<boolean>>;
};

interface Item {
  id: number;
  name: string;
}

const AddItem = (props: Props) => {
  const { setIsAddItem } = props;
  const [items, setItems] = useState<Item[]>([]);

  const [selectedID, setSelectedID] = useState<number | null>(null);
  const [amount, setAmount] = useState<number | null>(null);

  const [alert, setAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [idAddItemOpen, setIsAddItemOpen] = useState(false);

  const fetchData = async () => {
    const result = await getItemList();
    if (result.success) {
      if (result.data) {
        setItems(result.data);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = async () => {
    if (selectedID && amount) {
      const result = await addNewItem(selectedID, amount);
      if (result.success) {
        setAlertMessage("Item added successfully");
        setIsError(false);
        setAlert(true);
        setTimeout(() => {
          setIsAddItem(false);
          window.location.reload();
        }, 1000);
      } else if (result.error && result.exist) {
        setAlertMessage("Item already in shopping list");
        setIsError(true);
        setAlert(true);

        setTimeout(() => {
          setAlert(false);
        }, 2000);
      } else {
        setAlertMessage("Error adding item");
        setIsError(true);
        setAlert(true);
      }
    }
  };

  return (
    <div>
      {alert && (
        <Alert
          className="fixed  left-1/2 transform  translate-y-1/2  -translate-x-1/2 z-50"
          severity={isError ? "error" : "success"}
        >
          {alertMessage}
        </Alert>
      )}
      <Backdrop
        className="z-10"
        open={true}
        onClick={() => setIsAddItem(false)}
      />

      <div className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-2/3 lg:w-2/3 bg-white  rounded-lg text-dark  gap-6 shadow-lg border pt-5 z-20">
        <div className="fixed top-1 right-1 z-40">
          <IconButton
            className="absolute top-0 right-0"
            onClick={() => setIsAddItem(false)}
          >
            <CloseIcon />
          </IconButton>
        </div>
        <h1 className="font-semibold text-center">Add Shopping Item</h1>
        <div className="grid grid-cols-5 p-5 gap-4 place-items-center">
          <div className="col-span-5">
            <Autocomplete
              disablePortal
              options={items.map((item) => item.name)}
              value={items.find((item) => item.id === selectedID)?.name || null}
              onChange={(event, newValue) => {
                //if cleared, set to null
                if (newValue === null) {
                  setSelectedID(null);
                  return;
                }
                const item = items.find((item) => item.name === newValue);
                if (item) {
                  setSelectedID(item.id);
                }
              }}
              sx={{ width: 200 }}
              renderInput={(params) => <TextField {...params} label="name" />}
            />
          </div>
          <div className="col-span-5">
            <TextField
              label="Amount"
              type="number"
              variant="outlined"
              sx={{ width: 200 }}
              value={amount ? amount : ""}
              onChange={(e) => setAmount(parseInt(e.target.value))}
            />
          </div>
          <div className="col-span-5">
            <Button
              variant="contained"
              color="primary"
              disabled={!selectedID || !amount}
              onClick={handleAddItem}
            >
              Add
            </Button>
          </div>

          <div className="col-span-5 text-red-500">
            Item name not found? Add it{" "}
            <button
              className="text-blue-500 underline"
              onClick={() => setIsAddItemOpen(true)}
            >
              here
            </button>
          </div>
        </div>
      </div>
      {idAddItemOpen && (
        <AddNewItem
          className="z-50"
          setIsAddItemOpen={setIsAddItemOpen}
          fetchData={fetchData}
        />
      )}
    </div>
  );
};

export default AddItem;
