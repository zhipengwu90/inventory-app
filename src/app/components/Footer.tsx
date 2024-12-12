type Props = {};

const Footer = (props: Props) => {
  return (
    <footer className="w-full border-t-2 border-solid border-dark ">
      <div className="flex md:flex-col z-0 bg-dark px-32  xl:px-24 lg:px-16 md:px-12 sm:px-8 xs:px-6  py-8 items-center justify-center">
        <p className="text-white text-center">
          Copyright © 2023 THE ISLANDER BAKERY CORP. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
