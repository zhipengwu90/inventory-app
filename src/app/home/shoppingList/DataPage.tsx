"use client";
import React from "react";
import { createClient } from "../../utils/supabase/client";
import { useEffect, useState } from "react";
import Item_list from "./Item_list";
import { CircularProgress } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
type Props = {};

const CustomPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: '#e9e4e4',
  borderColor: '#ff0000',
  // Change this to your desired color
}));
const DataPage = (props: Props) => {
  const [itemList, setItemList] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedID, setSelectedID] = useState<number | null>(null);
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
        .order("timestamps", {
          foreignTable: "current_inventory",
          ascending: false,
        })
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
        <div>
          <Item_list itemList={itemList}  selectedID={selectedID}/>
          <div className="sticky bottom-2 right-0 ">
            <Autocomplete
            className="bg-white bg-opacity-80"
   
              disablePortal
              options={itemList ? itemList.map((item) => item.name) : []}
              // value={itemList ? itemList.find((item) => item.id === selectedID?.name || null)}
              onChange={(event, newValue) => {
                //if cleared, set to null
                if (newValue === null) {
                  setSelectedID(null);
                  return;
                }
                const item =
                  itemList && itemList.find((item) => item.name === newValue);
                if (item) {
                  setSelectedID(item.id);
                }
              }}
              sx={{ width: 200 }}
              renderInput={(params) => <TextField {...params} />}
              PaperComponent={(props) => <CustomPaper {...props} />}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DataPage;
