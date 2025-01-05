"use client";
import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  IcRoundClose,
  SkillIconsInstagram,
  CibYelp,
  DeviconFacebook,
  MingcutePhoneFill,
} from "./Icons";
import { motion } from "framer-motion";
import { createClient } from "../utils/supabase/client";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Backdrop, Button } from "@mui/material";
import { useRouter } from "next/navigation";

import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import { User } from "@supabase/supabase-js";
type Props = {};

const NavBar = (props: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [isLogout, setIsLogout] = useState(false);
  const [isAvatar, setIsAvatar] = useState(false);
  const [hoverCardOpen, setHoverCardOpen] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const handlerLogout = async () => {
    const supabase = await createClient();
    await supabase.auth.signOut();
    router.push("/"); // Redirect to home page
    router.refresh();
  };

  const fetchUser = async () => {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        throw error;
      } else {
        setUser(data.user);
      }
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

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
      className="min-w-[60vw] min-h-[50vh] flex flex-col justify-center items-center z-50 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2  bg-light/80 text-dark rounded-lg shadow-lg p-8  backdrop-blur-lg  "
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

        <CustomMobileLink href="/stats" title="Stats" onToggle={handleToggle} />

        <CustomMobileLink
          href="/shoppinglist"
          title="Shopping"
          onToggle={handleToggle}
        />
        <CustomMobileLink
          href="/shoppingHistory"
          title="History"
          onToggle={handleToggle}
        />
      </nav>

      {/* Mobile social medial icon */}
      {/* <nav className="flex items-center justify-center gap-8">
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
      </nav> */}
    </motion.div>
  );

  const handleHoverCardToggle = () => {
    setHoverCardOpen(!hoverCardOpen);
  };

  return (
    <header className="sticky z-20 top-0 w-full px-32 py-4  xl:px-24 lg:px-16 md:px-12 sm:px-6 xs:px-2    font-semibold text-lg flex items-center justify-between text-dark bg-light  bg-opacity-90">
      <div
        className=" flex flex-row items-center gap-2
        font-bold text-xl
      "
      >
        <HoverCard
          open={hoverCardOpen}
          onOpenChange={setHoverCardOpen}
          openDelay={0}
        >
          <HoverCardTrigger onClick={handleHoverCardToggle}>
            <Avatar sx={{ backgroundColor: "#28a8e9" }}>N</Avatar>
          </HoverCardTrigger>
          <HoverCardContent className="flex flex-col items-center justify-center gap-2">
            <Avatar sx={{ backgroundColor: "#28a8e9" }}>N</Avatar>
            <div className="text-sm">{user?.email}</div>
            <Button
              onClick={handlerLogout}
              variant="contained"
              color="error"
              className=""
            >
              Logout
            </Button>
          </HoverCardContent>
        </HoverCard>
        Inventory Management
      </div>
      <Backdrop open={isOpen} onClick={handleToggle} />
      <div className="flex flex-row items-center gap-3">
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

        <div className="flex justify-between items-center lg:hidden">
          <nav>
            <CustomLink href="/" title="Home" className="mr-4 " />

            <CustomLink href="/stats" title="Stats" className="mx-4" />
            <CustomLink
              href="/shoppinglist"
              title="Shopping"
              className="mx-4"
            />
            <CustomLink
              href="/shoppingHistory"
              title="History"
              className="mx-4"
            />
          </nav>
        </div>
      </div>

      {isOpen &&
        createPortal(componentToPortal, document.getElementById("modal-root")!)}
    </header>
  );
};

export default NavBar;
