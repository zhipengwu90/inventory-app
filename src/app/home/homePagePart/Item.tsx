"use client";
import React, { useEffect, useState } from "react";
import getAllItem from "@/app/utils/dashboardsql/getAllItem";
type Props = {};

interface CurrentInventory {
  id: number;
  item_id: number;
  count_amount: number;
  previous_total: number;
  shopped_amount: number | null;
  shopping_date: string | null;
  total_amount: number;
  used_amount: number;
  [key: string]: any;
}

interface Item {
  id: number;
  name: string;
  min_amount: number;
  shopping_place: string;
  item_category: string;
  comment: string;
  price: number;
  current_inventory: CurrentInventory[];
}

const Item = (props: Props) => {
  const [items, setItems] = useState<Item[] | null>(null);
  const fetchData = async () => {
    const { data, error } = await getAllItem();
    if (error) {
      console.error("Error getting item:", error);
    } else {
      if (data && data.length > 0) {
        setItems(data);
      } else {
        setItems(null);
      }
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      {items && items.map((item: Item) => <div key={item.id}>{item.name}</div>)}
    </div>
  );
};
export default Item;
