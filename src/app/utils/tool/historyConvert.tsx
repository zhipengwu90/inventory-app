

const historyConvert = (history: any) => {
  let dataset: any = [];
  let seriesData: { dataKey: string; label: string; stack: string }[] = [];

  // Get unique shopping places and initialize seriesData
  const uniqueShoppingPlaces = new Set<string>();
  history.forEach((element: any) => {
    uniqueShoppingPlaces.add(element.shopping_place);
  });

  uniqueShoppingPlaces.forEach((place) => {
    seriesData.push({ dataKey: place, label: place, stack: "stack" });
  });

  // Group data by month and sum costs for each shopping place
  const groupedData: Record<string, Record<string, number>> = {};

  history.forEach((item: any) => {
    const monthYear = item.created_at.slice(0, 7); // Extract year-month
    const place = item.shopping_place;
    const cost = item.total_cost;

    // Initialize the month group if it doesn't exist
    if (!groupedData[monthYear]) {
      groupedData[monthYear] = {};
    }

    // Initialize the shopping place within the month group if it doesn't exist
    if (!groupedData[monthYear][place]) {
      groupedData[monthYear][place] = 0;
    }

    // Sum the costs
    groupedData[monthYear][place] += cost;
  });

  // Convert grouped data into the desired dataset format
  for (const [month, places] of Object.entries(groupedData)) {
    const entry: any = { month };
    for (const [place, cost] of Object.entries(places)) {
      entry[place] = cost;
    }
    dataset.push(entry);
  }



  return [seriesData, dataset];
};

export default historyConvert;