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
          About our Bakery
        </div>
        <div className="flex-grow border-t border-red-500"></div>
      </div>

      <div className="flex flex-row items-center justify-center w-full ">
        <Image
          src={brazenPoppyImage}
          alt="brazenPoppyImage"
          layout="responsive"
          width={100}
          height={100}
          className=" shadow-lg max-h-[70vh] object-cover"
        />
      </div>
      <div className="my-4">
        <h2 className="text-2xl font-bold text-center text-red-500 my-2 ">
          Address & Hours
        </h2>
        <p className="text-lg text-gray-700 text-center ">
          <a
            href="https://www.google.com/maps/search/?api=1&query=Shelly+Square,+402,+554+Island+Hwy+E,+Parksville,+BC+V9P+1V6"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Shelly Square, 402, 554 Island Hwy E, Parksville, BC V9P 1V6
          </a>
        </p>
        <div className="flex flex-col items-center">
          <table className="text-lg text-gray-700 ">
            <tbody>
              <tr>
                <td className="pr-4">Monday</td>
                <td>7 a.m. – 3 p.m.</td>
              </tr>
              <tr>
                <td className="pr-4">Tuesday</td>
                <td>7 a.m. – 3 p.m.</td>
              </tr>
              <tr>
                <td className="pr-4">Wednesday</td>
                <td>7 a.m. – 3 p.m.</td>
              </tr>
              <tr>
                <td className="pr-4">Thursday</td>
                <td>7 a.m. – 3 p.m.</td>
              </tr>
              <tr>
                <td className="pr-4">Friday</td>
                <td>7 a.m. – 3 p.m.</td>
              </tr>
              <tr>
                <td className="pr-4">Saturday</td>
                <td>Closed</td>
              </tr>
              <tr>
                <td className="pr-4">Sunday</td>
                <td>Closed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="px-8 py-12 bg-gray-100">
        <h1 className="text-4xl font-bold text-center text-red-500 mb-6">
          Mornings, Lunch and Take Aways
        </h1>
        <p className="text-lg text-gray-700 mb-6">
          At the Brazen Poppy Bakery Cafe in Parksville, BC, our seasoned bakers
          start work early each day to ensure that our soups, sandwiches, and
          baked goods are as fresh as possible before our customers arrive for
          their fresh coffee, breakfast items and treats each day. The warm
          smell of baking will make your mouth water even before you walk into
          our newly built location. We're dedicated to kick-starting your
          morning with choices of skillet breakfasts, breakfast sandwiches, warm
          muffins, scones, cinnamon buns, poppy seed buns and more plus a fresh
          cup of hot coffee, a cappuccino, latte, tea or hot chocolate.
        </p>
        <h2 className="text-3xl font-semibold text-center text-red-400 mb-4">
          Nothing but freshness for our customers.
        </h2>
        <p className="text-lg text-gray-700 mb-6">
          Continuing with our fresh theme, our lunch features fresh home-made
          soups. Combine the soup with a sandwich made fresh daily with bread
          baked on site. Our sandwich meats are also roasted onsite, picked
          especially for us by our in house butcher/baker. We also offer tacos
          and hamburgers. A perfect lunch that is sure to put a smile on your
          face.
        </p>
        <p className="text-lg text-gray-700 mb-6">
          Anytime is coffee or tea time with one of our special treats. Most of
          our soups are gluten free and our sandwiches can be made gluten free.
        </p>

        <div className="mt-10  flex flex-row lg:flex-col  justify-between w-full gap-10">
          <div className="flex-1">
            <Image
              src={warm}
              alt="warm"
              layout="responsive"
              width={100}
              height={100}
              className="shadow-lg max-h-[70vh] object-cover rounded-lg"
            />
            <p className="text-center font-semibold text-lg text-gray-700 mt-4">
              Cozy Restaurant located in the Shelly Square Building in
              Parksville, BC on Vancouver Island
            </p>
            <p className="text-lg text-gray-600 mt-2">
              Come and visit Parksville's bakery café restaurant and enjoy our
              comfortable seating and modern setting. A great place to meet
              friends for coffee, breakfast or lunch while enjoying a breakfast
              or lunch: soup of the day, made to order sandwich, cheese burger,
              chili, soft taco wraps and a variety of beverages and fresh baked
              foods.
            </p>
          </div>
          <div className="flex-1">
            <Image
              src={muffins}
              alt="muffins"
              layout="responsive"
              width={100}
              height={100}
              className="shadow-lg max-h-[70vh] object-cover rounded-lg"
            />

            <p className="text-center text-lg font-semibold text-gray-600 mt-4">
              Handcrafted Pastries - an assortment of baked goods including
              cinnamon buns, muffins, scones, turnovers, cookies, poppy seed
              rolls
            </p>
            <p className="text-lg text-gray-700 mt-2">
              We work with local suppliers to source the freshest and most
              authentic ingredients, and use old-fashioned techniques to ensure
              the highest quality. Our baking is done in-house in our bakery
              kitchen. Our goal is to make your taste-buds happy!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutContent;
