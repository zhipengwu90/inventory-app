"use client";
import {
  Button,
  Tooltip,
  CircularProgress,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import getShoppingList from "@/app/utils/sql/getShoppingList";
import { useRouter } from "next/navigation";
import ItemDetail from "../parts/ItemDetail";
import shoppingCheck from "@/app/utils/sql/shoppingCheck";
import Alert from "@mui/material/Alert";
import AmountUpdate from "./AmountUpdate";
import shoppingComplete from "@/app/utils/sql/shoppingComplete";
import shopping_history from "@/app/utils/sql/shopping_history";
import HistoryIcon from "@mui/icons-material/History";
import EditIcon from "@mui/icons-material/Edit";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import AddItem from "./AddItem";
type Props = {
  user: any;
};

const ShoppingListPage = (props: Props) => {
  const { user } = props;
  const router = useRouter();
  const [shoppingList, setShoppingList] = useState<any[] | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shoppingPlace, setShoppingPlace] = useState<string[]>([]);
  const [detailWindow, setDetailWindow] = useState(false);
  const [itemDetail, setItemDetail] = useState<any>(null);
  const [alert, setAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [amountWindow, setAmountWindow] = useState(false);
  const [amountDetail, setAmountDetail] = useState<any>(null);
  const [isSpecialOpen, setIsSpecialOpen] = useState(false);
  const [menuActions, setMenuActions] = useState<any[]>([]);

  const [isAddItem, setIsAddItem] = useState(false);

  const getData = async () => {
    const { success, data, error } = await getShoppingList();
    if (success) {
      if (data) {
        //oder the shopping list by name
        data.sort((a: any, b: any) => {
          return a.item_list.name.localeCompare(b.item_list.name);
        });

        setShoppingList(data);

        //find the unique shopping place
        let uniqueShoppingPlaces = new Set<string>();
        data.forEach((item: any) => {
          uniqueShoppingPlaces.add(item.item_list.shopping_place);
        });

        setShoppingPlace(Array.from(uniqueShoppingPlaces));
        setIsLoaded(true);
      } else {
        setShoppingList([]);
        setIsLoaded(true);
      }
    } else {
      setAlert(true);
      setAlertMessage("Error getting shopping list, please try again!");

      console.error("Error getting shopping list:", error);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const actions = [
    {
      icon: <EditIcon color="success" />,
      name: `Add${"\u00A0"}Shopping${"\u00A0"}Item`,
      action: () => {
        setIsAddItem(true);
      },
    },

    {
      icon: <AssignmentTurnedInIcon color="error" />,
      name: `Shopping${"\u00A0"}Done`,
      action: () => {
        handleComplete();
      },
    },
  ];

  const EmptyListActions = [
    {
      icon: <EditIcon color="success" />,
      name: `Add${"\u00A0"}Shopping${"\u00A0"}Item`,
      action: () => {
        setIsAddItem(true);
      },
    },
  ];

  useEffect(() => {
    if (shoppingList && shoppingList.length > 0) {
      setMenuActions(actions);
    } else {
      setMenuActions(EmptyListActions);
    }
  }, [shoppingList]);
  const handleCheck = async (
    item: any,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let checked = event.target.checked;

    let result = await shoppingCheck(item.id, checked);
    let itemName = item.item_list.name;

    if (result.success) {
      setAlert(true);
      setAlertMessage(`${itemName} updated successfully`);
      setIsError(false);
      setTimeout(() => {
        setAlert(false);
      }, 1000);

      getData();
    } else {
      setAlert(true);
      setAlertMessage(
        `Error updating ${itemName}, please refresh the page then try again!`
      );
      setIsError(true);

      console.error("Error updating shopping list:", result.error);
    }
  };

  const handleComplete = async () => {
    let confirm = window.confirm(
      "你确定购物完成了吗？这将会把所有已购买的物品从购物清单中移除。"
    );
    if (confirm) {
      //only return the shopped is true
      //get the current timeStamps
      //trim the email to get the username
      const username = user.email.split("@")[0];
      const now = new Date().getTime();
      let shoppingId = `${username}-${now}`;
      let shoppedList = shoppingList?.filter((item) => item.shopped === true);
      try {
        if (!shoppedList || shoppedList.length === 0) {
          console.log("No items to process.");
          return;
        }
        const results = await Promise.all(
          shoppedList.map((item) => shoppingComplete(item, shoppingId))
        );

        // Check if all results are successful
        const allSuccessful = results.every((result) => result.success);

        if (allSuccessful) {
          const result = await shopping_history(shoppingId, shoppingPlace);

          if (result.success) {
            console.log("All items processed successfully.");
            setAlert(true);
            setAlertMessage("Shopping completed successfully!");
            setIsError(false);
            setTimeout(() => {
              setAlert(false);
            }, 2000);

            router.push("/shoppingHistory");
          } else {
            setAlert(true);
            setAlertMessage(
              "Error recording shopping history, please try again!"
            );
            setIsError(true);
            console.error("Error recording shopping history:", result.error);
          }
        } else {
          console.error("Error processing items:", results);
          setAlert(true);
          setAlertMessage("Error completing shopping, please try again!");
          setIsError(true);
        }
      } catch (error) {
        console.error("Error processing items:", error);
        setAlert(true);
        setAlertMessage("Error completing shopping, please try again!");
        setIsError(true);
      }
      // shoppedList?.forEach(async (item) => {
      //   let result = await shoppingComplete(item, shoppingId);
      // });
    }
  };
  return (
    <div className="flex flex-col gap-3 p-4 ">
      <SpeedDial
        ariaLabel="SpeedDial basic example"
        sx={{ position: "fixed", bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
        onClose={() => setIsSpecialOpen(false)}
        onOpen={() => setIsSpecialOpen(true)}
        open={isSpecialOpen}
      >
        {menuActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipOpen
            tooltipTitle={action.name}
            onClick={() => {
              action.action && action.action();
              setIsSpecialOpen(false);
            }}
          />
        ))}
      </SpeedDial>

      {isAddItem && <AddItem setIsAddItem={setIsAddItem} />}

      {alert && (
        <Alert
          className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50"
          severity={isError ? "error" : "success"}
        >
          {alertMessage}
        </Alert>
      )}
      {amountWindow && (
        <AmountUpdate
          setAmountWindow={setAmountWindow}
          amountDetail={amountDetail}
          getData={getData}
        />
      )}

      {detailWindow && (
        <ItemDetail
          itemDetail={itemDetail}
          setDetailWindow={setDetailWindow}
          isEditing={false}
        />
      )}
      {!isLoaded ? (
        <div className="flex justify-center items-center h-full">
          <CircularProgress color="secondary" />
        </div>
      ) : shoppingList && shoppingList.length > 0 ? (
        <>
          <h2 className="text-xl font-semibold">
            Shopping List (Item#: {shoppingList.length})
          </h2>
          <div className="grid grid-cols-7  text-lg font-semibold sticky top-20 bg-white opacity-90 place-items-center  ">
            <div className="col-span-1 "></div>
            <div className="col-span-3 pl-3 place-self-start ">Item</div>
            <div className="col-span-1">$/per</div>
            <div className="col-span-2">Amount</div>
          </div>
          <div className="flex flex-col gap-2">
            {shoppingPlace.map((place) => (
              <div key={place} className="flex flex-col gap-2">
                <div className="text-lg font-semibold ">{place}</div>
                {shoppingList.map(
                  (item: any) =>
                    item.item_list.shopping_place === place && (
                      <div
                        key={item.item_list.id}
                        className=" grid grid-cols-7 pl-3 place-items-center"
                      >
                        <input
                          type="checkbox"
                          className="col-span-1 "
                          defaultChecked={item.shopped}
                          onChange={(e) => {
                            handleCheck(item, e);
                          }}
                        />
                        <div
                          className={`col-span-3 hover:underline hover:cursor-pointer  place-self-start
                     hover:text-[#ff5151] ${
                       item.shopped ? "line-through" : ""
                     }  `}
                          onClick={() => {
                            setDetailWindow(true);
                            setItemDetail(item.item_list);
                          }}
                        >
                          {item.item_list.name}
                        </div>
                        <div
                          className={`col-span-1 ${
                            item.shopped ? "line-through" : ""
                          }  `}
                        >
                          {item.item_list.price
                            ? `$${item.item_list.price}`
                            : ""}
                        </div>
                        <div
                          className={`col-span-2 
                            hover:underline hover:cursor-pointer
                            hover:text-[#ff5151]
                            ${item.shopped ? "line-through" : ""}  `}
                          onClick={() => {
                            setAmountWindow(!amountWindow);
                            setAmountDetail(item);
                          }}
                        >
                          {item.amount}
                        </div>
                      </div>
                    )
                )}
              </div>
            ))}
          </div>

          {/* <div className="flex flex-col justify-center items-center gap-5">
            <Button
              variant="contained"
              color="error"
              onClick={() => handleComplete()}
            >
              Shopping Done
            </Button>

            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push("/private")}
            >
              Go to Inventory
            </Button>
          </div> */}
        </>
      ) : (
        <div className=" h-[50vh] flex flex-col justify-center items-center">
          <h2 className="text-xl font-semibold text-red-500">
            No Shopping List Found
          </h2>
          <p className="  mt-2 text-gray-500">
            It looks like you don't have any items in your shopping list yet.
            Please go to your inventory and generate a list to get started!
          </p>
          {/* <div className="flex justify-center items-center gap-2">
            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push("/private")}
            >
              Go to Inventory
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => router.push("/shoppingHistory")}
            >
              Shopping History
            </Button>
          </div> */}
        </div>
      )}
    </div>
  );
};

export default ShoppingListPage;
