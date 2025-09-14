import React from "react";
import Item from "./Item";
import CostChart from "./CostChart";
type Props = {};

const HomeContent = (props: Props) => {
  return (
    <div>
      <Item />
      {/* <CostChart className =' w-screen' /> */}
    </div>
  );
};

export default HomeContent;
