"use client";
import React, { useEffect, useState } from "react";
import getHistory from "../../utils/sql/getHistory";
import { BarChart } from "@mui/x-charts/BarChart";
import historyConvert from "@/app/utils/tool/historyConvert";
type Props = {
  className?: string;
};

interface seriesDataType {
  dataKey: string;
  label: string;
  stack: string;
}

const CostChart = (props: Props) => {
  const [seriesData, setSeriesData] = useState<seriesDataType[] | null>(null);
  const [dataset, setDataset] = useState<any[]>([]);

  const FetchData = async () => {
    const history = await getHistory();
    if (history.success) {
      const data = history.data;
      const convertedData = historyConvert(data);

      setSeriesData(convertedData[0]);
      setDataset(convertedData[1]);
    }
  };

  useEffect(() => {
    FetchData();
  }, []);

  //   const dataset = [
  //     {
  //       Costco: 59,
  //       Superstore: 57,
  //       month: "2024-12",
  //     },
  //     {
  //       Costco: 59,
  //       Superstore: 57,
  //       month: "2025-01",
  //     }
  //   ];

  const { className } = props;

  return (
    <div className={className}>
      <BarChart
        dataset={dataset}
        xAxis={[{ scaleType: "band", dataKey: "month" }]}
        series={seriesData || []}
        height={300}
      />
    </div>
  );
};
export default CostChart;
