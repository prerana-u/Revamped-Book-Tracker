/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "./lib/axios-instance";
import { Link, useNavigate } from "react-router-dom";
import BookIcon from "./assets/Icons/BookIcon";

interface SignupPayload {
  username: string;
  password: string;
}

interface SignupResponse {
  token: string;
  user: {
    id: string;
    username: string;
    name: string;
  };
}

async function signupUser(payload: SignupPayload): Promise<SignupResponse> {
  const response = await api.post<SignupResponse>("/create-user", payload);
  return response.data;
}

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const passwordStrength = PASSWORD_RULES.filter((r) =>
    r.test(password),
  ).length;

  const { mutate, isPending, isError, error } = useMutation<
    SignupResponse,
    Error,
    SignupPayload
  >({
    mutationFn: signupUser,
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      navigate("/login");
    },
  });

  function validate(): boolean {
    const errors: typeof fieldErrors = {};
    if (!username.trim()) {
      errors.username = "Username is required.";
    }
    if (!password) {
      errors.password = "Password is required.";
    } else if (passwordStrength < PASSWORD_RULES.length) {
      errors.password = "Password doesn't meet all requirements.";
    }
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords don't match.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    mutate({ username: username.trim(), password });
  }

  const strengthColors = ["bg-red-400", "bg-amber-400", "bg-emerald-500"];
  const strengthLabels = ["Weak", "Fair", "Strong"];

  return (
    <div className="min-h-screen bg-cream-deep flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-ink flex-col justify-between p-14">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-sienna/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-0 w-72 h-72 bg-sienna/10 rounded-full blur-[90px] pointer-events-none" />

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

        {/* Content */}
        <div className="relative z-10">
          <div className="w-10 h-0.5 bg-sienna mb-8" />
          <h2 className="font-lora text-[clamp(1.5rem,2.5vw,2.2rem)] leading-[1.3] text-white/90 font-medium tracking-tight max-w-sm">
            Begin your reading adventure today.
          </h2>
          <p className="mt-4 text-white/50 text-[0.9rem] font-dm leading-relaxed max-w-xs">
            Join thousands of readers who have found their next favourite book
            on PageBind.
          </p>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-2 gap-6">
            {[
              { value: "1K+", label: "Books catalogued" },
              //   { value: "12K+", label: "Active readers" },
              { value: "7+", label: "Genres covered" },
              { value: "4.9★", label: "Average rating" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="font-lora text-2xl font-medium text-white">
                  {value}
                </span>
                <span className="text-white/40 text-[0.78rem] font-dm uppercase tracking-[0.06em]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-16 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex flex-row gap-4">
            <div
              className="w-7 h-7 bg-sienna flex items-center justify-center shrink-0"
              style={{ borderRadius: "4px 12px 4px 12px" }}
            >
              <BookIcon />
            </div>
            <p className="font-lora text-2xl font-medium text-ink tracking-tight">
              PageBind
            </p>
          </div>

          <div className="mb-10">
            <span className="text-[0.75rem] uppercase tracking-[0.08em] font-medium text-sienna block mb-3">
              Create account
            </span>
            <h1 className="font-lora font-medium text-[clamp(2rem,3vw,2.6rem)] leading-[1.15] tracking-tight text-ink">
              Start your story here
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
                placeholder="you@example.com"
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
              <label
                htmlFor="password"
                className="text-[0.8rem] font-dm font-medium text-ink/70 tracking-wide"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password)
                      setFieldErrors((prev) => ({
                        ...prev,
                        password: undefined,
                      }));
                  }}
                  placeholder="Create a strong password"
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

              {/* Strength bar — only show when password has content */}
              {password.length > 0 && (
                <div className="mt-1 flex flex-col gap-2">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={[
                          "h-1 flex-1 rounded-full transition-all duration-300",
                          i < passwordStrength
                            ? strengthColors[passwordStrength - 1]
                            : "bg-ink/10",
                        ].join(" ")}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      {PASSWORD_RULES.map((rule) => (
                        <span
                          key={rule.label}
                          className={[
                            "text-[0.75rem] font-dm flex items-center gap-1.5 transition-colors duration-200",
                            rule.test(password)
                              ? "text-emerald-600"
                              : "text-ink/35",
                          ].join(" ")}
                        >
                          <span>{rule.test(password) ? "✓" : "○"}</span>
                          {rule.label}
                        </span>
                      ))}
                    </div>
                    {passwordStrength > 0 && (
                      <span
                        className={`text-[0.78rem] font-dm font-medium ${strengthColors[passwordStrength - 1].replace("bg-", "text-")}`}
                      >
                        {strengthLabels[passwordStrength - 1]}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {fieldErrors.password && (
                <span className="text-[0.78rem] text-red-500 font-dm">
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-[0.8rem] font-dm font-medium text-ink/70 tracking-wide"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword)
                      setFieldErrors((prev) => ({
                        ...prev,
                        confirmPassword: undefined,
                      }));
                  }}
                  placeholder="Re-enter your password"
                  className={[
                    "w-full px-4 py-3 pr-12 rounded-xl border bg-white text-ink font-dm text-[0.9rem] placeholder:text-ink/30 outline-none transition-all duration-200",
                    "focus:border-sienna focus:ring-2 focus:ring-sienna/10",
                    fieldErrors.confirmPassword
                      ? "border-red-400"
                      : "border-ink/10 hover:border-ink/25",
                  ].join(" ")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 transition-colors"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? (
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
              {/* Match indicator */}
              {confirmPassword.length > 0 && !fieldErrors.confirmPassword && (
                <span
                  className={`text-[0.78rem] font-dm flex items-center gap-1.5 transition-colors duration-200 ${password === confirmPassword ? "text-emerald-600" : "text-ink/35"}`}
                >
                  <span>{password === confirmPassword ? "✓" : "○"}</span>
                  Passwords match
                </span>
              )}
              {fieldErrors.confirmPassword && (
                <span className="text-[0.78rem] text-red-500 font-dm">
                  {fieldErrors.confirmPassword}
                </span>
              )}
            </div>

            {/* API error */}
            {isError && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[0.85rem] font-dm">
                {(error as any)?.response?.data?.message ??
                  "Something went wrong. Please try again."}
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
                  Creating account…
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          {/* Terms note */}
          <p className="mt-5 text-center text-[0.78rem] font-dm text-ink/35 leading-relaxed">
            By creating an account, you agree to our{" "}
            <Link
              to="/terms"
              className="text-sienna/80 hover:text-sienna transition-colors"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="text-sienna/80 hover:text-sienna transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </p>

          {/* Sign in link */}
          <p className="mt-6 text-center text-[0.875rem] font-dm text-ink/50">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-sienna font-medium hover:underline transition-all"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
