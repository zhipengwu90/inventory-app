"use client";
import React, { useState, useEffect, Suspense } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { login } from "./actions";
import { useSearchParams, useRouter } from "next/navigation";

import CircularProgress from "@mui/material/CircularProgress";

type Props = {};

const LoginPage = (props: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const loginHandler = async () => {
    setIsLoading(true);
    setErrorMessage(""); // Clear previous error message
    if (email.trim() === "" || password.trim() === "") {
      console.log("Email and password cannot be empty.");
      setIsLoading(false);
      return;
    }
    try {
      const result = await login(email, password);
      if (result.success) {
        router.push("/private");
      } else {
        setIsLoading(false);
        setErrorMessage(result.message || "An unknown error occurred.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
      setErrorMessage("Invalid login credentials. Please try again.");
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      loginHandler();
    }
  };

  return (
    <div className="flex justify-center items-center h-[80vh]">
      {isLoading && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
          <CircularProgress color="inherit" />
        </div>
      )}

      <div className="border border-1 bg-white flex flex-col gap-3 justify-around items-center rounded-lg w-1/2 h-2/3 lg:w-3/4 lg:h-3/4 py-5">
        <div className="text-dark text-xl font-bold"> Admin Login </div>
        <div className=" flex flex-col gap-3 w-full justify-center items-center ">
          <TextField
            label="Email"
            color="primary"
            type="email"
            placeholder="Enter your email"
            className="w-1/2 lg:w-4/5  z-0"
            onChange={(e) => {
              setEmail(e.target.value);
              setErrorMessage("");
            }}
            onKeyDown={handleKeyPress}
          />
          <TextField
            label="Password"
            type="password"
            placeholder="Enter your password"
            color="primary"
            className="w-1/2 lg:w-4/5 z-0 "
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorMessage("");
            }}
            onKeyDown={handleKeyPress}
          />

          {errorMessage && (
            <div className="text-red-500 text-sm font-bold">{errorMessage}</div>
          )}
        </div>

        <Button
          disabled={email === "" || password === ""}
          onClick={loginHandler}
          variant="contained"
          className="z-0"
        >
          Log in
        </Button>
      </div>
    </div>
  );
};

// const LoginPage = () => (
//   <Suspense fallback={<div>Loading...</div>}>
//     <Login />
//   </Suspense>
// );

export default LoginPage;
