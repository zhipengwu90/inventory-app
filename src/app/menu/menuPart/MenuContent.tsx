"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import menu from "../../../../public/menu/menu.jpeg";
import menu2 from "../../../../public/menu/menu2.jpeg";
import emblaCarousel from "embla-carousel";

import breakfast from "../../../../public/foodPhotos/breakfast.jpeg";
type Props = {};

const MenuContent = (props: Props) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

  const emblaRef = useRef(null);
  useEffect(() => {
    if (emblaRef.current) {
      const embla = emblaCarousel(emblaRef.current, { loop: true });
      return () => embla.destroy();
    }
  }, []);

  return (
    <div className="px-32 lg:px-4 my-3">
      <div className="flex flex-row items-center justify-center w-full my-8">
        <div className="flex-grow border-t border-red-500"></div>
        <h1 className="px-4 text-center text-2xl font-bold text-red-500">
          Our Menu
        </h1>
        <div className="flex-grow border-t border-red-500"></div>
      </div>

      <p className="text-lg text-gray-700 mb-6 text-center font-semibold">
        Breakfast Skillets, Breakfast Sandwiches, Daily Soups, Sandwiches Made
        to Order, Hamburgers, Gluten Free Options
      </p>

      {/* <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          <div className="embla__slide">
            <div className="embla__slide__number">
              <Image
                src={menu}
                alt="menu"
                width={100}
                height={100}
                layout="responsive"
                className="shadow-lg max-h-[70vh] "
              />
            </div>
          </div>
          <div className="embla__slide">
            <div className="embla__slide__number">
           
              <Image
                src={menu2}
                alt="menu2"
                objectFit="contained"
                layout="responsive"
                width={100}
                height={100}
                className="shadow-lg max-h-[70vh] "
              />
            </div>
          </div>
        </div>
      </div> */}

      <section className="embla">
        <div className="embla__viewport" ref={emblaRef}>
          <div className="embla__container">
            <div className="embla__slide">
              <div className="embla__slide__number">
                <Image
                  src={menu2}
                  alt="menu"
                  layout="responsive"
                    objectFit="contain"
                  
                  width={100}
                  height={100}
                  className=" shadow-lg max-h-[70vh] "
                />
              </div>
            </div>
            <div className="embla__slide flex justify-center items-center ">
              <div className="embla__slide__number flex-1">
                <Image
                  src={menu}
                  alt="menu"
                  layout="responsive"
                  width={100}
                  height={100}
                  objectFit="contain"
                  className=" shadow-lg max-h-[70vh]"
                />
              </div>
            </div>
            <div className="embla__slide">
              <div className="embla__slide__number">
                <Image
                  src={breakfast}
                  alt="breakfast"
                  layout="responsive"
                  objectFit="contain"
                  width={100}
                  height={100}
                  className=" shadow-lg max-h-[70vh] "
                />
              </div>
            </div>
          </div>
        </div>
        {/* 
      <div className="embla__controls">
        <div className="embla__buttons">
          <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
          <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
        </div>

        <div className="embla__dots">
          {scrollSnaps.map((_, index) => (
            <DotButton
              key={index}
              onClick={() => onDotButtonClick(index)}
              className={'embla__dot'.concat(
                index === selectedIndex ? ' embla__dot--selected' : ''
              )}
            />
          ))}
        </div>
      </div> */}
      </section>

      {/* <div className="flex flex-row items-center justify-center w-full">
        <Image
          src={menu}
          alt="menu"
          layout="responsive"
          width={100}
          height={100}
          className=" shadow-lg max-h-[70vh] object-cover"
        />
      </div>

      <div className="flex flex-row items-center justify-center w-full">
        <Image
          src={menu2}
          alt="menu"
          layout="responsive"
          width={100}
          height={100}
          className=" shadow-lg max-h-[70vh] object-cover"
        />
      </div> */}
    </div>
  );
};

export default MenuContent;
