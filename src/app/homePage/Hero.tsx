import Image from "next/image";

import Cookies1 from "../../../public/image/cookies1.jpg";
import Cookies2 from "../../../public/image/cookies2.jpg";
import { Button } from "@mui/material";
import Link from "next/link";


//import  all images from public/foodPhotos folder


type Props = {};

const Hero = (props: Props) => {
  return (
    <div className="relative w-full h-[80vh] bg-gray-100 flex flex-col justify-center items-center">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-700 opacity-95 rounded-full w-[40vh] h-[40vh] flex flex-col items-center justify-center text-white text-center p-4 gap-3">
        <h1 className="text-3xl font-bold">Brazen Poppy Bakery</h1>
        <p className="mt-2">
          Visit us for breakfast or lunch. We offer daily soups, freshly baked
          bread for sandwiches, coffees, teas & fresh baked goods.
        </p>

        <Button
          variant="contained"
          color="secondary"
          className="mt-4"
          size="large"
        >
          <Link href="/menu">View Menu</Link>
        </Button>
      </div>

      <div className="flex flex-row w-full h-full justify-evenly items-center mt-4">
        
        <div className="w-2/5 lg:w-full p-2">
          <Image
            src={Cookies1}
            alt="Cookies"
            layout="responsive"
            width={100}
            height={100}
            className="rounded-lg shadow-lg max-h-[80vh] object-cover"
          />
        </div>
        <div className="w-2/5  lg:hidden  p-2">
          <Image
            src={Cookies2}
            alt="Cookies"
            layout="responsive"
            width={100}
            height={100}
            className="rounded-lg shadow-lg max-h-[80vh] object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;
