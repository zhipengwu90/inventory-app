import React from "react";
import { Backdrop, Button, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

interface MinAmountEditorProps {
  currentMinItem: any;
  setIsMinOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setItemListCopy: React.Dispatch<React.SetStateAction<any[]|undefined>>;
}

const MinAmountEditor: React.FC<MinAmountEditorProps> = ({ currentMinItem, setIsMinOpen, setItemListCopy }) => {
  return (
    <>
    <Backdrop
      className="z-40"
      open={true}
      onClick={() => setIsMinOpen(false)}
    />
    <div className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-1/3 lg:w-2/3 h-1/4 lg:h-1/3 bg-white z-50 rounded-lg text-dark flex flex-col justify-center items-center gap-6 shadow-lg border">
      <div className="flex flex-col justify-center items-center">
        <div className="text-lg font-bold">{currentMinItem?.name}</div>
        <p>Min #: </p>
        <div className="flex flex-row justify-center items-center">
          <IconButton
            size="medium"
            sx={{ paddingLeft: 2, paddingRight: 2 }}
            color="primary"
            onClick={() => {
              if (currentMinItem && currentMinItem.min_amount > 0) {
                currentMinItem.min_amount -= 1;
                setItemListCopy((prevItemList) =>
                  prevItemList?.map((i) => (i.id === currentMinItem.id ? currentMinItem : i))
                );
              }
            }}
          >
            <RemoveIcon />
          </IconButton>
          <div>{currentMinItem?.min_amount}</div>
          <IconButton
            size="small"
            sx={{ paddingLeft: 2, paddingRight: 2 }}
            color="primary"
            onClick={() => {
              if (currentMinItem) {
                currentMinItem.min_amount += 1;
                setItemListCopy((prevItemList) =>
                  prevItemList?.map((i) => (i.id === currentMinItem.id ? currentMinItem : i))
                );
              }
            }}
          >
            <AddIcon />
          </IconButton>
        </div>
      </div>
      <Button variant="contained" color="primary" onClick={() => setIsMinOpen(false)}>
        Done
      </Button>
    </div>
    </>
  );
};

export default MinAmountEditor;