import React from "react";
import brazenPoppyImage from "../../../../public/image/brazenPoppyImage.jpeg";
import Image from "next/image";
import warm from "../../../../public/image/warm.jpg";
import muffins from "../../../../public/foodPhotos/muffins.jpeg";

type Props = {};

const AboutContent = (props: Props) => {
  return (
    <div className="px-32 lg:px-4 my-3">
      <div className="flex flex-row items-center justify-center w-full my-8">
        <div className="flex-grow border-t border-red-500"></div>
        <div className="px-4 text-center text-2xl font-bold text-red-500">
          About the App
        </div>
        <div className="flex-grow border-t border-red-500"></div>
      </div>

      <div className="px-8 py-12 bg-gray-100">
        <p className="text-lg text-gray-700 mb-6">
          Inventory Management helps streamline the process of managing and
          tracking items effectively. This feature allows users to maintain an
          organized inventory by recording item usage, monitoring stock levels,
          and tracking expenses. With integrated charts and analytics, users can
          gain valuable insights into inventory trends and usage patterns,
          ensuring better decision-making and cost control.
        </p>
      </div>
    </div>
  );
};

export default AboutContent;
