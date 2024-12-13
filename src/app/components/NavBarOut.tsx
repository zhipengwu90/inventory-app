import React from "react";

type Props = {};

const NavBarOut = (props: Props) => {
  return (
    <header className="sticky z-20 top-0 w-full px-32 py-4  xl:px-24 lg:px-16 md:px-12 sm:px-8 xs:px-6    font-semibold text-lg flex items-center justify-between text-dark bg-light  bg-opacity-90">
      <div
        className="
        font-bold text-xl
      "
      >
        Inventory Management
      </div>
    </header>
  );
};

export default NavBarOut;
