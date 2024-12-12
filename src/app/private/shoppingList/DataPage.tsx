"use client";
import React from "react";
import { createClient } from "../../utils/supabase/client";
import { useEffect, useState } from "react";
import Item_list from "./Item_list";
import { CircularProgress } from "@mui/material";
type Props = {};

const DataPage = (props: Props) => {
  const [itemList, setItemList] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("item_list")
        .select(
          `*,
         current_inventory (
      *
        
        )
        `
        )
        .order("name", { ascending: true })
        .order("timestamps", { foreignTable: "current_inventory", ascending: false })
        .limit(1, { foreignTable: "current_inventory" });

      console.log(error);
      setItemList(data);
      setLoading(false);
    };
    getData();
  }, []);
  return (
    <div className="w-full">
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <CircularProgress color="secondary" />
        </div>
      ) : (
        <Item_list itemList={itemList} />
      )}
    </div>
  );
};

export default DataPage;
