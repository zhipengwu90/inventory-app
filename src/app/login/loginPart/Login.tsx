"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Lock, Mail, Package } from "lucide-react";
import { login } from "./actions";
import { Btn } from "../../components/restock/ui";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const canSubmit = email.trim() !== "" && password !== "" && !isLoading;

  const loginHandler = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!canSubmit) return;
    setIsLoading(true);
    setErrorMessage("");
    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        router.push("/");
        router.refresh();
        return;
      }
      setErrorMessage(result.message || "An unknown error occurred.");
    } catch (error) {
      console.error("Login failed:", error);
      setErrorMessage("Invalid login credentials. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-10">
      <form onSubmit={loginHandler} className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand text-white shadow-lg shadow-brand/30">
            <Package className="h-10 w-10" />
          </span>
          <h1 className="text-3xl font-bold">Restock</h1>
          <p className="text-sm text-gray-500">
            Know what you have. Buy what you need.
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex h-14 items-center gap-3 rounded-2xl bg-white px-4 ring-brand focus-within:ring-2">
            <Mail className="h-5 w-5 text-gray-400" />
            <input
              type="email"
              autoComplete="username"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage("");
              }}
              className="w-full bg-transparent text-base outline-none placeholder:text-gray-400"
            />
          </label>
          <label className="flex h-14 items-center gap-3 rounded-2xl bg-white px-4 ring-brand focus-within:ring-2">
            <Lock className="h-5 w-5 text-gray-400" />
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage("");
              }}
              className="w-full bg-transparent text-base outline-none placeholder:text-gray-400"
            />
          </label>
          {errorMessage && (
            <p className="flex items-center gap-1.5 px-1 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorMessage}
            </p>
          )}
        </div>

        <Btn
          type="submit"
          size="lg"
          className="w-full"
          disabled={!canSubmit}
          loading={isLoading}
        >
          Sign In
        </Btn>
      </form>
    </div>
  );
};

export default LoginPage;
