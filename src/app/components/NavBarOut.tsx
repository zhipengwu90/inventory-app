import { Package } from "lucide-react";

const NavBarOut = () => {
  return (
    <header className="sticky top-0 z-30 md:static border-b border-black/5 bg-[#F2F2F7]/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-6 text-[17px] font-bold sm:px-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand text-white">
          <Package className="h-[18px] w-[18px]" />
        </span>
        Restock
      </div>
    </header>
  );
};

export default NavBarOut;
