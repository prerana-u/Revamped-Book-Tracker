/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "./lib/axios-instance";
import { Link, useNavigate } from "react-router-dom";
import BookIcon from "./assets/Icons/BookIcon";

interface LoginPayload {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    name: string;
  };
}

async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/login", payload);
  return response.data;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const { mutate, isPending, isError, error } = useMutation<
    LoginResponse,
    Error,
    LoginPayload
  >({
    mutationFn: loginUser,
    onSuccess: (data) => {
      // Store token however your app handles auth (localStorage, context, etc.)
      localStorage.setItem("token", data.token);
      navigate("/home");
    },
  });

  function validate(): boolean {
    const errors: { username?: string; password?: string } = {};
    if (!username.trim()) {
      errors.username = "username is required.";
    }
    if (!password) {
      errors.password = "Password is required.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    mutate({ username: username.trim(), password });
  }

  return (
    <div className="min-h-screen bg-cream-deep flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-ink flex-col justify-between p-14">
        {/* Subtle grain texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />
        {/* Warm sienna glow */}
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sienna/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-60 h-60 bg-sienna/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex flex-row gap-4">
            <div
              className="w-7 h-7 bg-sienna flex items-center justify-center shrink-0"
              style={{ borderRadius: "4px 12px 4px 12px" }}
            >
              <BookIcon />
            </div>
            <p className="font-lora text-2xl font-medium text-white tracking-tight">
              PageBind
            </p>
          </div>
        </div>

        {/* Quote */}
        <div className="relative z-10">
          <div className="w-10 h-[2px] bg-sienna mb-8" />
          <blockquote className="font-lora text-[clamp(1.5rem,2.5vw,2.2rem)] leading-[1.3] text-white/90 font-medium tracking-tight max-w-sm">
            "A reader lives a thousand lives before he dies."
          </blockquote>
          <p className="mt-5 text-white/40 text-sm font-dm tracking-wide">
            — George R.R. Martin
          </p>

          <div className="mt-16 flex flex-col gap-4">
            {[
              "Create Notes and Lists for every mood",
              "Track your reading journey",
              "Discover your next favourite book",
            ].map((text) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-sienna flex-shrink-0" />
                <span className="text-white/60 text-[0.875rem] font-dm">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <span className="lg:hidden font-lora text-2xl font-medium text-ink tracking-tight block mb-10">
            <BookIcon />
            PageBind
          </span>

          <div className="mb-10">
            <span className="text-[0.75rem] uppercase tracking-[0.08em] font-medium text-sienna block mb-3">
              Welcome back
            </span>
            <h1 className="font-lora font-medium text-[clamp(2rem,3vw,2.6rem)] leading-[1.15] tracking-tight text-ink">
              Sign in to your library
            </h1>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-5"
          >
            {/* username */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="username"
                className="text-[0.8rem] font-dm font-medium text-ink/70 tracking-wide"
              >
                Username
              </label>
              <input
                id="username"
                type="username"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username)
                    setFieldErrors((prev) => ({
                      ...prev,
                      username: undefined,
                    }));
                }}
                placeholder="Your username"
                className={[
                  "w-full px-4 py-3 rounded-xl border bg-white text-ink font-dm text-[0.9rem] placeholder:text-ink/30 outline-none transition-all duration-200",
                  "focus:border-sienna focus:ring-2 focus:ring-sienna/10",
                  fieldErrors.username
                    ? "border-red-400"
                    : "border-ink/10 hover:border-ink/25",
                ].join(" ")}
              />
              {fieldErrors.username && (
                <span className="text-[0.78rem] text-red-500 font-dm">
                  {fieldErrors.username}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-[0.8rem] font-dm font-medium text-ink/70 tracking-wide"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[0.78rem] font-dm text-sienna hover:underline transition-all"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password)
                      setFieldErrors((prev) => ({
                        ...prev,
                        password: undefined,
                      }));
                  }}
                  placeholder="••••••••"
                  className={[
                    "w-full px-4 py-3 pr-12 rounded-xl border bg-white text-ink font-dm text-[0.9rem] placeholder:text-ink/30 outline-none transition-all duration-200",
                    "focus:border-sienna focus:ring-2 focus:ring-sienna/10",
                    fieldErrors.password
                      ? "border-red-400"
                      : "border-ink/10 hover:border-ink/25",
                  ].join(" ")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <span className="text-[0.78rem] text-red-500 font-dm">
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {/* API error */}
            {isError && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[0.85rem] font-dm">
                {(error as any)?.response?.data?.message ??
                  "Invalid username or password. Please try again."}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="mt-2 w-full py-3.5 rounded-[40px] bg-sienna text-white font-dm text-[0.9rem] font-medium tracking-wide transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sienna/25 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Sign up link */}
          <p className="mt-8 text-center text-[0.875rem] font-dm text-ink/50">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-sienna font-medium hover:underline transition-all"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
