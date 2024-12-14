import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import NavBar from "./components/NavBar";
import NavBarOut from "./components/NavBarOut";
import Footer from "./components/Footer";
import { createClient } from "./utils/supabase/server";
import { redirect } from "next/navigation";

import { User } from "@supabase/supabase-js";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Inventory Management",
  description:
    "Inventory Management is a web application that helps you manage your inventory.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  let result: { user: User } | null = null;

  const { data, error } = await supabase.auth.getUser();
  if (data && !error) {
    result = { user: data.user };
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {result ? <NavBar /> : <NavBarOut />}
        <div id="modal-root"></div>
        {children}

        <Footer />
      </body>
    </html>
  );
}
