"use client";
import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import Logo from "./Logo";
import {
  IcRoundClose,
  SkillIconsInstagram,
  CibYelp,
  DeviconFacebook,
  MingcutePhoneFill,
} from "./Icons";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

const NavBar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  interface CustomLinkProps {
    href: string;
    title: string;
    className?: string;
  }

  interface CustomMobileLinkProps {
    href: string;
    title: string;
    className?: string;
    onToggle: () => void;
  }
  const pathname = usePathname();

  const CustomLink: React.FC<CustomLinkProps> = ({
    href,
    title,
    className,
  }) => {
    return (
      <Link
        href={href}
        className={`${className} relative group hover:text-red-500`}
      >
        {title}

        <span
          className={`absolute inline-block h-[2px] left-0 -bottom-0.5 group-hover:w-full transition-[width] ease-in-out duration-300 group-hover:bg-red-500 bg-dark
        ${pathname === href ? "w-full" : "w-0"}`}
        >
          &nbsp;
        </span>
      </Link>
    );
  };
  const CustomMobileLink: React.FC<CustomMobileLinkProps> = ({
    href,
    title,
    className,
    onToggle,
  }) => {
    return (
      <Link
        href={href}
        className={`${className} relative group md:text-xl hover:text-red-500 my-4`}
        onClick={() => {
          onToggle();
        }}
      >
        {title}

        <span
          className={`absolute inline-block h-[2px] left-0 -bottom-0.5 group-hover:w-full transition-[width] ease-in-out duration-300 group-hover:bg-red-500 bg-dark
        ${pathname === href ? "w-full" : "w-0"}`}
        >
          &nbsp;
        </span>
      </Link>
    );
  };

  const componentToPortal = (
    <motion.div
      initial={{ opacity: 0, scale: 0, x: "-50%", y: "-50%" }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-w-[60vw] h-[50vh] flex flex-col justify-center items-center z-50 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2  bg-light/80 text-dark rounded-lg shadow-lg p-8  backdrop-blur-lg "
    >
      <IcRoundClose
        onClick={() => setIsOpen(false)}
        className="w-7 h-7 text-light
        cursor-pointer
        absolute top-5 right-5"
      />
      {/* Mobile tab*/}
      <nav className="flex flex-col justify-center items-center my-4">
        <CustomMobileLink href="/" title="Home" onToggle={handleToggle} />
        <CustomMobileLink href="/menu" title="Menu" onToggle={handleToggle} />
        <CustomMobileLink href="/about" title="About" onToggle={handleToggle} />
      </nav>

      {/* Mobile social medial icon */}
      <nav className="flex items-center justify-center gap-8">
        <a
          href="https://www.facebook.com/brazenPoppy/"
          target={"_blank"}
          className=" w-9 h-9"
          onClick={() => setIsOpen(false)}
        >
          <DeviconFacebook className="w-full h-full" />
        </a>
        <a
          href="https://www.instagram.com/brazenpoppy/"
          target={"_blank"}
          className=" w-9 h-9"
          onClick={() => setIsOpen(false)}
        >
          <SkillIconsInstagram className="w-full h-full" />
        </a>
      </nav>
    </motion.div>
  );

  return (
    <header className="sticky z-50 top-0 w-full px-32 py-7  xl:px-24 lg:px-16 md:px-12 sm:px-8 xs:px-6    font-semibold text-lg flex items-center justify-between text-dark bg-white  bg-opacity-90">
      <button
        className="flex-col justify-center items-center hidden lg:flex"
        onClick={handleToggle}
      >
        <span
          className={`bg-dark block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm  ${
            isOpen ? "rotate-45 translate-y-1" : "-translate-y-0.5"
          }`}
        ></span>
        <span
          className={`bg-dark block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${
            isOpen ? "opacity-0" : "opacity-100"
          }`}
        ></span>
        <span
          className={`bg-dark block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm  ${
            isOpen ? "-rotate-45 -translate-y-1" : "translate-y-0.5"
          }`}
        ></span>
      </button>

      <div className="absolute left-[50%] top-2 lg:top-0 translate-x-[-50%]">
        <Logo />
      </div>
      {/* phone icon on p */}
      <nav className=" item-center justify-center gap-5 hidden lg:flex">
        <motion.a
          href="tel:2505860377"
          target={"_blank"}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.9 }}
          className="w-6 h-6"
          onClick={() => setIsOpen(false)}
        >
          <MingcutePhoneFill className="w-full h-full" />
        </motion.a>
      </nav>

      <div className="w-full  flex justify-between items-center lg:hidden">
        <nav>
          <CustomLink href="/" title="Home" className="mr-4" />
          <CustomLink href="/menu" title="Menu" className="mx-4" />
          <CustomLink href="/about" title="About" className="ml-4" />
        </nav>

        <nav className="flex item-center justify-center gap-5">
          <motion.a
            href="https://www.facebook.com/brazenPoppy/"
            target={"_blank"}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.9 }}
            className="w-6 h-6"
            onClick={() => setIsOpen(false)}
          >
            <DeviconFacebook className="w-full h-full" />
          </motion.a>

          <motion.a
            href="https://www.instagram.com/brazenpoppy/"
            target={"_blank"}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.9 }}
            className="w-7 h-7"
          >
            <SkillIconsInstagram className="w-full h-full" />
          </motion.a>

          <motion.a
            href="tel:2505860377"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.9 }}
            className="self-center "
          >
            <div> 250-586-0377</div>
          </motion.a>
        </nav>
      </div>
      {isOpen &&
        createPortal(componentToPortal, document.getElementById("modal-root")!)}
    </header>
  );
};

export default NavBar;
