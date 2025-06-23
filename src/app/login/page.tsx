"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busIds, setBusIds] = useState<number[]>([]);
  const router = useRouter();
  const baseUrl = "https://prod-api.bus3.in/api/v1-beta";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone)) {
      setError("Please match the requested format.");
      return;
    }
    if (!/^\d{4}$/.test(passcode)) {
      setError("Please match the requested format.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${baseUrl}/client/operator/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, passCode: passcode }),
      });
      const data = await res.json();
      if (!data.success) {
        let errorMsg = "Login failed. Please try again.";
        if (data.error) {
          if (typeof data.error === "string") {
            errorMsg = data.error;
          } else if (typeof data.error === "object" && data.error.message) {
            errorMsg = data.error.message;
          } else {
            errorMsg = JSON.stringify(data.error);
          }
        }
        setError(errorMsg);
        setLoading(false);
        return;
      }
      localStorage.setItem("bus3_token", data.data.token);
      localStorage.setItem("bus3_logged_in", "1");
      if (data.data.operator && data.data.operator.name) {
        localStorage.setItem("bus3_operator_name", data.data.operator.name);
      }
      setLoading(false);
      router.push("/");
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black px-4">
      <div className="flex flex-col items-center gap-3 mb-8 mt-8">
        <span className="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg select-none">BUS3</span>
        <h2 className="text-2xl font-bold text-white tracking-tight mt-2">Welcome Back</h2>
        <p className="text-base text-white/70 text-center">Sign in to continue</p>
      </div>
      <form
        onSubmit={handleLogin}
        className="flex flex-col gap-6 w-full max-w-xs"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="phone" className="text-base font-medium text-white">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            minLength={10}
            placeholder="10 digit phone number"
            className="rounded-lg px-4 py-3 text-base bg-white text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white transition-all"
            value={phone}
            onChange={e => {
              setPhone(e.target.value.replace(/[^0-9]/g, ""));
              setError("");
            }}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="passcode" className="text-base font-medium text-white">
            Passcode
          </label>
          <input
            id="passcode"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            minLength={4}
            placeholder="4 digit passcode"
            className="rounded-lg px-4 py-3 text-base bg-white text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white transition-all tracking-widest text-center"
            value={passcode}
            onChange={e => {
              setPasscode(e.target.value.replace(/[^0-9]/g, ""));
              setError("");
            }}
            required
          />
        </div>
        {error && <p className="text-red-400 text-sm text-center font-medium mt-1">{error}</p>}
        <Button type="submit" className="w-full mt-2 text-base py-3 rounded-xl bg-white text-black font-bold shadow-lg hover:bg-gray-200 transition-all" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </div>
  );
} 