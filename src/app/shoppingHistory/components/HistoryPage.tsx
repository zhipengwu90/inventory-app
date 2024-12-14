"use client";
import React, { useEffect, useState } from "react";
import getHistory from "@/app/utils/sql/getHistory";
import Image from "next/image";
import { Backdrop, Button, CircularProgress, IconButton } from "@mui/material";
import { useRouter } from "next/navigation";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import DoDisturbAltIcon from "@mui/icons-material/DoDisturbAlt";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import ItemDetail from "./ItemDetail";
import DoneIcon from '@mui/icons-material/Done';

type Props = {

  className?: string;
};

const HistoryPage = (props: Props) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [history, setHistory] = useState<any>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [itemDetails, setItemDetails] = useState<any>([]);

  const { className } = props;
  const router = useRouter();

  const getData = async () => {
    setIsLoaded(true);
    const result = await getHistory();
    if (result.success) {
      setHistory(result.data);
      console.log("result", result.data);
      setIsLoaded(true);
    }
  };
  useEffect(() => {
    getData();
  }, []);
  return (
    <div className={`${className} `}>
      {showDetails && (
        <ItemDetail setShowDetails={setShowDetails} itemDetails={itemDetails} />
      )}

      <div>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-3">
          Shopping History
        </h1>
        {isLoaded ? (
          <div>
            <div className="grid grid-cols-8 place-items-center">
              <div className=" col-span-2">Date</div>
              <div className=" col-span-2">Place</div>
              <div className=" col-span-1">Cost</div>
              <div className=" col-span-1">Paid?</div>
              <div className=" col-span-2">ID</div>
            </div>

            {history.length > 0 ? (
              history.map((item: any) => {
                ///get the mm/dd/yyyy from the created_at
                const date = new Date(item.created_at);
                const month = date.getMonth() + 1;
                const day = date.getDate();
                const year = date.getFullYear();
                const formattedDate = month + "/" + day + "/" + year;

                //trim the id after -
                const id = item.shopping_id;
                const trimId = id.split("-")[0];

                return (
                  <div
                    key={item.id}
                    className="border border-gray-300 rounded-lg p-2 my-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setShowDetails(!showDetails);
                      setItemDetails(item);
                    }}
                  >
                    <div className="grid grid-cols-8 place-items-center">
                      <div className=" col-span-2">{formattedDate}</div>
                      <div className=" col-span-2">{item.shopping_place}</div>
                      <div className=" col-span-1">{item.total_cost}</div>
                      <div className=" col-span-1">
                        {item.paid ? (
                          <DoneIcon  color="success" />
                        ) : (
                          <DoDisturbAltIcon fontSize="small" color="error" />
                        )}
                      </div>
                      <div className=" col-span-2">{trimId}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center text-lg text-red-600 font-bold h-[80vh]">
                No shopping history found
              </div>
            )}
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </div>
{/* 
      <div className="flex flex-col justify-center items-center gap-2 mt-14">
        <Button
          variant="contained"
          color="success"
          onClick={() => router.push("/private")}
        >
          Go to Inventory
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => router.push("/shoppinglist")}
        >
          Shopping List
        </Button>
      </div> */}
    </div>
  );
};

export default HistoryPage;
