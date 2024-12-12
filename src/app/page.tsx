import Image from "next/image";
import Hero from "./homePage/Hero";
import FoodPhoto from "./homePage/FoodPhoto";

export default function Home() {
  return (
    <div>
      <Hero />
      <FoodPhoto />
    </div>
  );
}
