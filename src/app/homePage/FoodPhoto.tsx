"use client";
import React, { useState } from "react";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import Modal from "@mui/material/Modal";
import Image from "next/image";
import { useMediaQuery } from "@mui/material";
import cookies from "../../../public/foodPhotos/cookies.jpeg";
import poppyseedBun from "../../../public/foodPhotos/poppyseedBun.jpeg";
import poppyseedLoaf from "../../../public/foodPhotos/poppyseedLoaf.jpeg";
import breakfast2 from "../../../public/foodPhotos/breakfast2.jpeg";
import sandwich2 from "../../../public/foodPhotos/sandwich2.jpeg";
import sandwich from "../../../public/foodPhotos/sandwich.jpeg";
import pastry2 from "../../../public/foodPhotos/pastry2.jpeg";
import breakfast from "../../../public/foodPhotos/breakfast.jpeg";
import bun from "../../../public/foodPhotos/bun.jpeg";
import muffin from "../../../public/foodPhotos/muffin.jpeg";
import muffins from "../../../public/foodPhotos/muffins.jpeg";
import rasinBun from "../../../public/foodPhotos/rasinBun.jpeg";
import coffee from "../../../public/foodPhotos/coffee.jpeg";
import soups from "../../../public/foodPhotos/soups.jpeg";
import burger from "../../../public/foodPhotos/burger.jpeg";

type Props = {};

const FoodPhoto = (props: Props) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageClick = (src: string) => {
    setSelectedImage(src);
  };

  const handleClose = () => {
    setSelectedImage(null);
  };

  const isSmallScreen = useMediaQuery("(max-width: 600px)");
  const isLargeScreen = useMediaQuery("(min-width: 1200px)");

  const cols = isLargeScreen ? 4 : isSmallScreen ? 2 : 3;

  return (
    <div className="px-32 lg:px-4 my-3">
      <div className="flex flex-row items-center justify-center w-full my-8">
        <div className="flex-grow border-t border-red-500"></div>
        <div className="px-4 text-center text-2xl font-bold text-red-500">
          Delicious Foods
        </div>
        <div className="flex-grow border-t border-red-500"></div>
      </div>

      <ImageList variant="masonry" cols={cols} gap={2}>
        <ImageListItem key={1}>
          <Image src={cookies} alt="cookies" loading="lazy" />
        </ImageListItem>
        <ImageListItem key={2}>
          <Image src={poppyseedBun} alt="poppyseedBun" loading="lazy" />
        </ImageListItem>
        <ImageListItem key={3}>
          <Image src={poppyseedLoaf} alt="poppyseedLoaf" loading="lazy" />
        </ImageListItem>
        <ImageListItem key={16}>
          <Image src={breakfast2} alt="breakfast2" loading="lazy" />
        </ImageListItem>
        <ImageListItem key={11}>
          <Image src={sandwich2} alt="sandwich2" loading="lazy" />
        </ImageListItem>
        <ImageListItem key={10}>
          <Image src={sandwich} alt="sandwich" loading="lazy" />
        </ImageListItem>
        <ImageListItem key={8}>
          <Image src={pastry2} alt="pastry2" loading="lazy" />
        </ImageListItem>
        <ImageListItem key={15}>
          <Image src={breakfast} alt="breakfast" loading="lazy" />
        </ImageListItem>
        <ImageListItem key={4}>
          <Image src={bun} alt="bun" loading="lazy" />
        </ImageListItem>
        <ImageListItem key={5}>
          <Image src={muffin} alt="muffin" loading="lazy" />
        </ImageListItem>
        <ImageListItem key={9}>
          <Image src={rasinBun} alt="rasinBun" loading="lazy" />
        </ImageListItem>
        <ImageListItem key={6}>
          <Image src={muffins} alt="muffins" loading="lazy" />
        </ImageListItem>

        <ImageListItem key={17}>
          <Image src={coffee} alt="coffee" loading="lazy" />
        </ImageListItem>
        <ImageListItem key={13}>
          <Image src={soups} alt="soups" loading="lazy" />
        </ImageListItem>
        <ImageListItem key={14}>
          <Image src={burger} alt="burger" loading="lazy" />
        </ImageListItem>
      </ImageList>

      <Modal open={!!selectedImage} onClose={handleClose}>
        <div className="flex justify-center items-center h-full">
          {selectedImage && (
            <Image
              src={selectedImage}
              alt="Selected Food"
              width={800}
              height={600}
              className="rounded-lg shadow-lg"
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default FoodPhoto;
