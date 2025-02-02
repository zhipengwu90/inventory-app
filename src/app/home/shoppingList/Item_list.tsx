import React, { use, useEffect, useState,useRef } from "react";
import Image from "next/image";
import Button from "@mui/material/Button";
import Input from "@mui/material/Input";
import { Backdrop, IconButton } from "@mui/material";
import { useRouter } from "next/navigation";
import CloseIcon from "@mui/icons-material/Close";
import ChecklistIcon from "@mui/icons-material/Checklist";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { SpeedDial, SpeedDialAction, SpeedDialIcon, Box } from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import CancelIcon from "@mui/icons-material/Cancel";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import CircularProgress from "@mui/material/CircularProgress";
import HistoryIcon from "@mui/icons-material/History";
import ItemDetail from "../components/ItemDetail";
import MinAmountEditor from "../components/MinAmountEditor";
import Alert from "@mui/material/Alert";
import updateMin from "../../utils/sql/updateMin";
import updateInventory from "@/app/utils/sql/updateInventory";
import generateShopList from "../../utils/sql/generateShopList";
import AddItem from "../components/AddItem";

import deleteOldShopping from "../../utils/sql/deleteOldShopping";

type Props = {
  itemList: any[] | null;
  // itemList: {
  //     id: number;
  //     name: string;
  //     price: number;
  //     item_location: string;
  //     img_url: string;
  //     min_amount: number;
  //     shopping_place: [];
  // } || null;
  selectedID: number | null;
};

interface ShoppingItem {
  id: number;
  needAmount: number;
}

// Define an interface for the item
interface Item {
  id: number;
  name: string;
  min_amount: number;
  current_inventory: { total_number: number }[];
  // Add other properties as needed
}

const Item_list = (props: Props) => {
  const { itemList,selectedID } = props;
  console.log(selectedID);
  const copyItemList = itemList?.map((item) => ({
    ...item,
    current_inventory: item.current_inventory.map((inv: any) => ({ ...inv })),
  }));
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (selectedID && itemRefs.current[selectedID]) {
      itemRefs.current[selectedID]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedID]);
  const [isEditing, setIsEditing] = useState(false);
  const [itemDetail, setItemDetail] = useState<any | null>(null);

  const [detailWindow, setDetailWindow] = useState(false);
  const [isCheckboxes, setIsCheckboxes] = useState(false);

  const [itemListCopy, setItemListCopy] = useState(copyItemList);
  const [isSaving, setIsSaving] = useState(false);

  const [isMinOpen, setIsMinOpen] = useState(false);
  const [currentMinItem, setCurrentMinItem] = useState<Item | null>(null);
  const [isSpecialOpen, setIsSpecialOpen] = useState(false);

  const [alert, setAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const router = useRouter();
  const [checkedItems, setCheckedItems] = useState<ShoppingItem[]>([]);
  // get all the unique item_category from the itemList
  const itemCategory = itemList?.map((item) => item.item_category);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const uniqueItemCategory = itemCategory?.filter(
    (item, index) => itemCategory.indexOf(item) === index
  );

  const EditActions = [
    {
      icon: <CloudDoneIcon color="primary" />,
      name: "Submit",
      action: () => {
        handleSubmit();
      },
    },
    {
      icon: <CancelIcon color="error" />,
      name: "Cancel",
      action: () => {
        if (confirm("您确定要取消吗？所有未保存的更改将丢失。")) {
          setIsEditing(false);
          setActions(menuActions);
          window.location.reload();
        }
      },
    },
  ];

  const menuActions = [
    {
      icon: <EditIcon color="success" />,
      name: `Update${"\u00A0"}Inventoy`,
      action: () => {
        setIsEditing(!isEditing);
        setActions(EditActions);
      },
    },
    {
      icon: <PlaylistAddIcon color="primary" />,
      name: `Add${"\u00A0"}New${"\u00A0"}Item`,
      action: () => {
        setIsAddItemOpen(true);
      },
    },
    {
      icon: <ChecklistIcon color="warning" />,
      name: `Generate${"\u00A0"}List`,
      action: () => {
        setIsCheckboxes(true);
      },
    },
  ];

  const [actions, setActions] = useState(menuActions);

  // Warn user before refreshing/navigating away while editing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditing) {
        e.preventDefault();
        e.returnValue = ""; // This is necessary for some browsers to show the confirmation dialog
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) return; // Skip adding the event listeners if not editing

    let startY = 0; // To track the initial touch position
    let hasConfirmed = false; // Flag to track if confirmation has been shown
    const threshold = 50; // Set a threshold for the pull-down distance

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY; // Record the initial Y position of the touch
      hasConfirmed = false; // Reset the flag on touch start
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;

      // Check if the user is pulling down while at the top of the page
      if (
        currentY > startY + threshold &&
        window.scrollY === 0 &&
        !hasConfirmed
      ) {
        // User is pulling down at the top of the page beyond the threshold
        e.preventDefault(); // Stop the pull-to-refresh
        hasConfirmed = true; // Set the flag to true to prevent further confirmations
        const confirmRefresh = confirm(
          "您有未保存的更改。您确定要刷新页面吗？所有更改将丢失。"
        );
        if (confirmRefresh) {
          window.location.reload(); // Refresh the page if the user confirms
        }
      }
    };

    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchmove", handleTouchMove, {
      passive: false, // Allow `preventDefault` in `touchmove`
    });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isEditing]);

  const findDifferingMinAmountIds = () => {
    const differingIds: number[] = [];
    const differentObjects: any[] = [];

    itemList?.forEach((item) => {
      const copyItem = itemListCopy?.find((i) => i.id === item.id);

      // console.log(
      //   `Comparing item ID: ${item.id}, min_amount: ${item.min_amount} with copyItem min_amount: ${copyItem?.min_amount}`
      // );
      if (copyItem && item.min_amount !== copyItem.min_amount) {
        differingIds.push(item.id);
        differentObjects.push({ id: item.id, min_amount: copyItem.min_amount });
      }
    });
    return differentObjects;
  };

  const findDifferingTotalNumberIds = () => {
    const differingIds: number[] = [];
    const differentObjects: any[] = [];
    itemList?.forEach((item) => {
      const copyItem = itemListCopy?.find((i) => i.id === item.id);

      if (copyItem) {
        const currentTotalNumber = item.current_inventory[0]?.total_number;
        const copyTotalNumber = copyItem.current_inventory[0]?.total_number;
        // Check if total_number differs
        if (currentTotalNumber != copyTotalNumber) {
          differingIds.push(item.id);

          differentObjects.push({
            id: item.id,
            previous_total_number:
              currentTotalNumber == undefined ? null : currentTotalNumber,
            count_amount: copyTotalNumber,
          });
        }
      }
    });

    return differentObjects;
  };

  const handleCheckboxChange = (
    id: number,
    needAmount: number,
    isChecked: boolean
  ) => {
    if (!isChecked) {
      // Remove the item from the ShoppingItem if unchecked
      setCheckedItems((prev) => prev.filter((item) => item.id !== id));
      return;
    } else {
      setCheckedItems((prev) => {
        return [...prev, { id, needAmount }]; // Add the item as a ShoppingItem if checked
      });
    }
  };
  // Call the timeOut function

  const handleSubmit = async () => {
    setIsSaving(true);
    let minAmountArray = findDifferingMinAmountIds();
    let updateInventoryArray = findDifferingTotalNumberIds();

    let allMinUpdatesSuccessful = true;
    let allInventoryUpdatesSuccessful = true;

    if (minAmountArray.length > 0) {
      await Promise.all(
        minAmountArray.map(async (item: any) => {
          const result = await updateMin(item.id, item.min_amount);
          if (!result.success) {
            allMinUpdatesSuccessful = false;
            setAlert(true);
            setAlertMessage("保存失败, 请重试");
            setIsError(true);
            console.error(
              `Failed to update min for item ID ${item.id}: ${result.error}`
            );
          }
        })
      );
    }

    if (updateInventoryArray.length > 0) {
      await Promise.all(
        updateInventoryArray.map(async (item: any) => {
          const result = await updateInventory(
            item.id,
            item.count_amount,
            item.previous_total_number
          );
          if (!result.success) {
            allInventoryUpdatesSuccessful = false;
            setAlert(true);
            setAlertMessage("保存失败, 请重试");
            setIsError(true);
            console.error(
              `Failed to update inventory for item ID ${item.id}: ${result.error}`
            );
          }
        })
      );
    }

    if (allMinUpdatesSuccessful && allInventoryUpdatesSuccessful) {
      setAlert(true);
      setAlertMessage("保存成功, 请创建购物清单");
      setIsError(false);
    }
    setIsSaving(false);

    setIsEditing(false);
    setActions(menuActions);
    //let the page refresh
    // window.location.reload();
  };

  const handleMinus = (item: any) => {
    let currentItem = item;

    // Check if current_inventory exists and has at least one item
    if (
      currentItem.current_inventory == null ||
      currentItem.current_inventory.length === 0
    ) {
      let newInventory = { total_number: 0 };
      currentItem.current_inventory.push(newInventory);
      setItemListCopy((prevItemList) =>
        prevItemList
          ? prevItemList.map((i) => (i.id === currentItem.id ? currentItem : i))
          : []
      );
      return;
    }
    // Check if total_number is less than or equal to 0
    if (currentItem.current_inventory[0].total_number <= 0) {
      console.log("Total number is 0 or less, cannot decrement");
      return; // Exit if total_number is 0 or less
    }

    // Decrement total_number
    currentItem.current_inventory[0].total_number -= 1;

    // Update the itemListCopy by mapping over the existing items
    setItemListCopy((prevItemList) =>
      prevItemList
        ? prevItemList.map((i) => (i.id === currentItem.id ? currentItem : i))
        : []
    );
  };

  const handleAdd = (item: any) => {
    let currentItem = item;

    // Check if current_inventory exists and has at least one item
    if (
      currentItem.current_inventory == null ||
      currentItem.current_inventory.length === 0
    ) {
      let newInventory = { total_number: 0 };
      currentItem.current_inventory.push(newInventory);
      setItemListCopy((prevItemList) =>
        prevItemList
          ? prevItemList.map((i) => (i.id === currentItem.id ? currentItem : i))
          : []
      );
      return;
    }

    // Decrement total_number
    currentItem.current_inventory[0].total_number += 1;

    // Update the itemListCopy by mapping over the existing items
    setItemListCopy((prevItemList) =>
      prevItemList
        ? prevItemList.map((i) => (i.id === currentItem.id ? currentItem : i))
        : []
    );
  };

  const handleShoppingSubmit = async () => {
    setIsSaving(true);

    console.log(checkedItems);

    const userConfirmed = confirm(
      "创建新的购物清单， 之前创立未完成的将购物清单将会被删除"
    );

    if (userConfirmed) {
      if (checkedItems.length > 0) {
        let allSuccessful = true;
        const deleteOldShoppingResult = await deleteOldShopping();

        await Promise.all(
          checkedItems.map(async (item: any) => {
            const result = await generateShopList(item.id, item.needAmount);

            if (!result.success) {
              allSuccessful = false;
              setAlert(true);
              setAlertMessage(
                `Failed to generate shopping list, please try again!`
              );
              setIsError(true);
              console.error(
                `Failed to generate shopping list, please try again!`
              );
            }
          })
        );

        if (allSuccessful && deleteOldShoppingResult.success) {
          setAlert(true);
          setAlertMessage("添加成功, 请前往购物清单查看");
          setIsError(false);
        } else {
          setAlert(true);
          setAlertMessage("添加失败, 请重试");
          setIsError(true);
        }
      }
    }

    setIsCheckboxes(false);
    setIsSaving(false);
  };

  useEffect(() => {
    if (isCheckboxes) {
      ///loop through itemListCopy and check the item.min_amount - item.current_inventory.total_number, if bigger than 0, add to checkedItems

      itemListCopy?.forEach((item) => {
        let needAmount = Math.max(
          0,
          (item.min_amount || 0) -
            (item.current_inventory?.[0]?.total_number || 0)
        );
        if (needAmount > 0) {
          setCheckedItems((prev) => [...prev, { id: item.id, needAmount }]);
        }
      });
    } else if (!isCheckboxes) {
      setCheckedItems([]);
    }
  }, [isCheckboxes]);
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(false);
        setAlertMessage("");
        setIsError(false);
      }, 5000); // Auto close after 5 seconds

      return () => clearTimeout(timer); // Clear the timer if the component unmounts or alert changes
    }
  }, [alert]);

  return (
    <>
      {alert && (
        <Alert
          variant="filled"
          onClose={() => {
            setAlert(false);
            setAlertMessage("");
            setIsError(false);
          }}
          className="fixed bottom-10 left-[50%] translate-x-[-50%]"
          severity={isError ? "error" : "success"}
        >
          {alertMessage}
        </Alert>
      )}

   

      {!isSaving && !isCheckboxes && !detailWindow && !isAddItemOpen && (
        <SpeedDial
          ariaLabel="SpeedDial basic example"
          sx={{ position: "fixed", bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
          onClose={() => setIsSpecialOpen(false)}
          onOpen={() => setIsSpecialOpen(true)}
          open={isSpecialOpen}
        >
          {actions.map((action) => (
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
      )}

      <Backdrop sx={{ color: "#fff" }} open={isSaving}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <div className="flex flex-row  gap-4 h-full pb-20">
        {detailWindow && (
          <ItemDetail
            itemDetail={itemDetail}
            setDetailWindow={setDetailWindow}
            isEditing={isEditing}
          />
        )}
        {isAddItemOpen && <AddItem setIsAddItemOpen={setIsAddItemOpen} />}

        {isMinOpen && (
          <MinAmountEditor
            currentMinItem={currentMinItem}
            setIsMinOpen={setIsMinOpen}
            setItemListCopy={setItemListCopy}
          />
        )}

        <div className="w-full  ">
          {isCheckboxes && (
            <div className=" fixed bottom-10 left-[50%] translate-x-[-50%] flex flex-row gap-3">
              <Button
                variant="contained"
                disabled={checkedItems.length === 0}
                color="primary"
                onClick={handleShoppingSubmit}
              >
                Create (#{checkedItems.length})
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => setIsCheckboxes(false)}
              >
                Cancel
              </Button>
            </div>
          )}
          <div className="grid  grid-cols-10 place-items-center text-xl font-bold mb-3 sticky top-16 bg-white bg-opacity-90">
            {isCheckboxes && <div className="col-span-1"></div>}
            <div className="place-self-start col-span-3 pl-1 ">Name</div>

            <div className="col-span-2">Min #</div>
            <div className={`${isCheckboxes ? "col-span-2" : "col-span-3"}`}>
              Count #
            </div>
            <div className="col-span-2">Need #</div>
          </div>

          {uniqueItemCategory?.map((category) => (
            <div key={category} className="">
              <div className="flex">
                <div className="text-lg pl-3 text-[#ff5151]">{category}</div>
              </div>
              {itemListCopy
                ?.filter((item) => item.item_category === category)
                .map((item) => {
                  let needAmount = Math.max(
                    0,
                    (item.min_amount || 0) -
                      (item.current_inventory?.[0]?.total_number || 0)
                  );
                  
                  return (
                    <div
                      key={item.id}
                      ref={(el) => {
                        itemRefs.current[item.id] = el;
                      }}
                      className={`grid grid-cols-10 py-2 place-items-center ${item.id === selectedID ? "bg-yellow-300" : ""}`}
                    >
                      {isCheckboxes && (
                        <input
                          className="col-span-1"
                          type="checkbox"
                          // Check if the item is checked based on needAmount or checkedItems state
                          defaultChecked={needAmount > 0}
                          onChange={(e) =>
                            handleCheckboxChange(
                              item.id,
                              needAmount,
                              e.target.checked
                            )
                          }
                        />
                      )}

                      <div
                        className="col-span-3 place-self-start pl-4 hover:underline hover:cursor-pointer 
                     hover:text-[#ff5151] 
                    "
                        onClick={() => {
                          setDetailWindow(!detailWindow);
                          setItemDetail(item);
                        }}
                      >
                        {item.name} 
                      </div>
                      {!isEditing ? (
                        <div className="col-span-2">{item.min_amount}</div>
                      ) : (
                        <>
                          <div
                            className="col-span-2 hover:underline hover:cursor-pointer py-1 px-2"
                            onClick={() => {
                              setIsMinOpen(!isMinOpen);
                              setCurrentMinItem(item);
                            }}
                          >
                            {item.min_amount}
                          </div>
                        </>
                      )}
                      <div
                        className={`${
                          isCheckboxes ? "col-span-2" : "col-span-3"
                        }`}
                      >
                        {!isEditing ? (
                          <div>{item.current_inventory[0]?.total_number}</div>
                        ) : (
                          <div className="">
                            <IconButton
                              size="small"
                              sx={{ paddingLeft: 1, paddingRight: 2 }}
                              color="primary"
                              onClick={() => handleMinus(item)}
                            >
                              <RemoveIcon />
                            </IconButton>

                            {item.current_inventory[0]?.total_number == null ||
                            undefined
                              ? "\u00A0"
                              : item.current_inventory[0]?.total_number}
                            <IconButton
                              size="small"
                              sx={{ paddingLeft: 2, paddingRight: 1 }}
                              color="primary"
                              onClick={() => handleAdd(item)}
                            >
                              <AddIcon />
                            </IconButton>
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">{needAmount}</div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Item_list;
