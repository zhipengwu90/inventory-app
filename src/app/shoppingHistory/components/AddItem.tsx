import { Backdrop, CircularProgress, Alert } from "@mui/material";
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import getShoppingPlace from "../../utils/sql/getShoppingPlace";
import addHistory from "../../utils/sql/addHistory";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
type Props = {
  setIsAddItem: React.Dispatch<React.SetStateAction<boolean>>;
};

const AddItem = (props: Props) => {
  const { setIsAddItem } = props;
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [shoppingPlace, setShoppingPlace] = useState<any | null>(null);
  const [shoppingPlaceValue, setShoppingPlaceValue] = useState("");
  const [price, setPrice] = useState<string | number>("");
  const [comment, setComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [alert, setAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [error, setError] = useState(false);

  //convert to timestamptz format

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
    getShoppingPlaceHandler();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const timestamp = date ? date.toISOString() : "";
    const result = await addHistory(
      timestamp,
      shoppingPlaceValue,
      price,
      comment
    );
    if (result.success) {
      setIsSaving(false);

      setAlert(true);
      setAlertMessage("Saved successfully");
      setTimeout(() => {
        setAlert(false);
        window.location.reload();
      }, 1000);
    }
    // console.log("shoppingPlaceValue", shoppingPlaceValue);
    // console.log("price", price);
    // console.log("comment", comment);
    // console.log("timestamp", timestamp);
    setIsSaving(false);
    setIsAddItem(false);
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
        onClick={() => setIsAddItem(false)}
      ></Backdrop>
      <div className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]  w-4/5  bg-white  z-30 rounded-lg shadow-md  overflow-y-auto flex justify-center ">
        {alert && (
          <div className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
            <Alert severity={error ? "error" : "success"}>{alertMessage}</Alert>
          </div>
        )}

        <div className="grid grid-cols-5 p-5 gap-4 place-items-center">
          <h1 className="col-span-5 text-xl font-bold  text-gray-800 ">
            Add History
          </h1>
          <div className=" col-span-1">Date</div>
          <div className=" col-span-4  place-self-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className=" col-span-1">Place</div>
          <div className=" col-span-4  place-self-center">
            <select
              className="col-span-6 lg:col-span-5 border
                bg-white h-9
              border-gray-300 rounded-sm px-1  w-[200px]"
              onChange={(e) => setShoppingPlaceValue(e.target.value)}
              value={shoppingPlaceValue}
            >
              <option defaultValue="">Shopping Place</option>
              {shoppingPlace?.map((item: any, index: number) => (
                <option key={index} value={item.enum_value}>
                  {item.enum_value}
                </option>
              ))}
            </select>
          </div>
          <div className=" col-span-1">Cost</div>
          <div className=" col-span-4 place-self-center  flex justify-center items-center w-[200px]">
            $
            <input
              type="number"
              className="border border-gray-300 rounded-md p-1 ml-2 "
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div className=" col-span-1">Comment</div>
          <div className=" col-span-5  place-self-start w-full">
            <textarea
              className="border border-gray-300 rounded-md p-1 w-full h-20"
              value={comment ? comment : ""}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <div className="col-span-5 flex justify-center items-center gap-3">
            <Button variant="destructive" onClick={() => setIsAddItem(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddItem;
