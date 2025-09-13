"use client";
import React, { useEffect, useState } from "react";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import getAllItem from "@/app/utils/dashboardsql/getAllItem";
import { Divider } from "@mui/material";

import lineChartDataConvert from "@/app/utils/tool/lineChartDataConvert";
type Props = {};

interface CurrentInventory {
  id: number;
  item_id: number;
  count_amount: number;
  previous_total: number;
  shopping_id: number;
  shopped_amount: number | null;
  date: string | null;
  total_number: number;

  used_amount: number;
  [key: string]: any;
}

interface Item {
  id: number;
  name: string;
  date: string;
  min_amount: number;
  shopping_place: string;
  item_category: string;
  comment: string;
  price: number;
  item_location: string;
  img_url:string;
  item_location_code: number;
  unit: string;
  current_inventory: CurrentInventory[];

}

const Item = (props: Props) => {
  const [items, setItems] = useState<Item[] | null>(null);

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const fetchData = async () => {
    const { data, error } = await getAllItem();
    if (error) {
      console.error("Error getting item:", error);
    } else {
      if (data && data.length > 0) {
        // console.log(data);

        setItems(data);
      } else {
        setItems(null);
      }
    }
  };


  useEffect(() => {
    fetchData();
  }, []);


  const handlerChange = (event: SelectChangeEvent) => {
    const item = items?.find(
      (item) => item.id === Number(event.target.value)
    );
    setSelectedItem(item || null);
    lineChartDataConvert(item);
    
  };
  return (
    <div>
      {/* {items && items.map((item: Item) => <div key={item.id}>{item.name}</div>)} */}
      <FormControl className="w-1/2">
        <InputLabel id="item">Item</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={selectedItem ? selectedItem.id.toString() : ""}
          label="item"
          onChange={handlerChange}
        >
          {items &&
            items.map((item: Item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name}
              </MenuItem>
            ))}
        </Select>
      </FormControl>

      {selectedItem && (
        <div>
          <div>id: {selectedItem.id}</div>
          <div>name: {selectedItem.name}</div>
          <div>min_amount: {selectedItem.min_amount}</div>
          <div>shopping_place: {selectedItem.shopping_place}</div>
          <div>item_category: {selectedItem.item_category}</div>
          <div>comment: {selectedItem.comment}</div>
          <div>price: ${selectedItem.price}</div>
          <div>
            current_inventory:
            {selectedItem.current_inventory.map((currentInventory) => (
              <div key={currentInventory.id}>
                <div>count_amount: {currentInventory.count_amount}</div>
                <div>previous_total: {currentInventory.previous_total}</div>
                <div>shopped_amount: {currentInventory.shopped_amount}</div>
                <div>date: {currentInventory.date}</div>
                <div>total_amount: {currentInventory.total_number}</div>
                <div>used_amount: {currentInventory.used_amount}</div>
                <Divider />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default Item;
