import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Bug,
  Building2,
  Clock,
  Eye,
  EyeOff,
  Lock,
  Save,
  ShieldCheck,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const PIN_KEY = "akpack_pin";
const FAIL_COUNT_KEY = "akpack_pin_fails";
const LOCKOUT_UNTIL_KEY = "akpack_pin_lockout";
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzYj1ZiuGuXG6d4ZSJGYxFlXGfHfNPoTViNT6QkNMMK4PvyhAKdSk4SUQDmqTZZmxr9Rg/exec";

const PACKAGES = ["Monthly", "2 Month Package", "Alpha Pack", "Founders Pack"];

function getStoredPin(): string {
  return localStorage.getItem(PIN_KEY) || "1234";
}

const glassCard = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(16px)",
} as const;

export function SettingsPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [showPin, setShowPin] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    checkLockout();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function checkLockout() {
    const until = Number.parseInt(
      localStorage.getItem(LOCKOUT_UNTIL_KEY) || "0",
    );
    const now = Date.now();
    if (until > now) {
      const secs = Math.ceil((until - now) / 1000);
      setLockoutRemaining(secs);
      timerRef.current = setInterval(() => {
        const rem = Math.ceil(
          (Number.parseInt(localStorage.getItem(LOCKOUT_UNTIL_KEY) || "0") -
            Date.now()) /
            1000,
        );
        if (rem <= 0) {
          setLockoutRemaining(0);
          localStorage.removeItem(LOCKOUT_UNTIL_KEY);
          localStorage.setItem(FAIL_COUNT_KEY, "0");
          if (timerRef.current) clearInterval(timerRef.current);
        } else {
          setLockoutRemaining(rem);
        }
      }, 1000);
    }
  }

  function handlePinSubmit() {
    const lockout = Number.parseInt(
      localStorage.getItem(LOCKOUT_UNTIL_KEY) || "0",
    );
    if (lockout > Date.now()) return;
    const correct = getStoredPin();
    if (pinInput === correct) {
      setUnlocked(true);
      setPinError("");
      localStorage.setItem(FAIL_COUNT_KEY, "0");
    } else {
      const fails =
        Number.parseInt(localStorage.getItem(FAIL_COUNT_KEY) || "0") + 1;
      localStorage.setItem(FAIL_COUNT_KEY, String(fails));
      if (fails >= 3) {
        const until = Date.now() + 2 * 60 * 1000;
        localStorage.setItem(LOCKOUT_UNTIL_KEY, String(until));
        setPinError("");
        checkLockout();
      } else {
        setPinError(
          `Incorrect PIN. ${3 - fails} attempt${3 - fails !== 1 ? "s" : ""} remaining.`,
        );
      }
      setPinInput("");
    }
  }

  const lockoutMins = Math.floor(lockoutRemaining / 60);
  const lockoutSecs = lockoutRemaining % 60;

  if (!unlocked) {
    return (
      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm"
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(59,130,246,0.25)",
              boxShadow:
                "0 0 40px rgba(59,130,246,0.1), 0 8px 40px rgba(0,0,0,0.5)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div
              className="h-1"
              style={{
                background: "linear-gradient(90deg, #3b82f6, #a855f7, #3b82f6)",
              }}
            />
            <div className="p-6">
              <div className="text-center mb-5">
                <div
                  className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3"
                  style={{
                    background: "rgba(59,130,246,0.15)",
                    border: "1px solid rgba(59,130,246,0.3)",
                  }}
                >
                  <Lock className="h-6 w-6 text-blue-400" />
                </div>
                <h2 className="font-display text-xl font-bold text-white">
                  Admin Access
                </h2>
                <p
                  className="text-sm mt-1"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  Enter PIN to access Settings
                </p>
              </div>

              {lockoutRemaining > 0 ? (
                <div
                  className="text-center space-y-3"
                  data-ocid="settings.error_state"
                >
                  <div className="text-5xl font-display font-bold text-red-400">
                    {String(lockoutMins).padStart(2, "0")}:
                    {String(lockoutSecs).padStart(2, "0")}
                  </div>
                  <p
                    className="text-sm"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    Too many failed attempts. Please wait.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="pin-input"
                      className="text-sm text-white/70"
                    >
                      PIN
                    </Label>
                    <div className="relative">
                      <Input
                        id="pin-input"
                        type={showPin ? "text" : "password"}
                        inputMode="numeric"
                        maxLength={6}
                        value={pinInput}
                        onChange={(e) =>
                          setPinInput(e.target.value.replace(/\D/g, ""))
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" && handlePinSubmit()
                        }
                        placeholder="Enter PIN"
                        className="text-white placeholder:text-white/30 pr-10 tracking-widest text-center text-lg"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                        data-ocid="settings.input"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                        onClick={() => setShowPin(!showPin)}
                      >
                        {showPin ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {pinError && (
                      <div
                        className="flex items-center gap-1.5 text-xs text-red-400"
                        data-ocid="settings.error_state"
                      >
                        <AlertCircle className="h-3.5 w-3.5" /> {pinError}
                      </div>
                    )}
                  </div>
                  <Button
                    className="w-full text-white font-semibold"
                    style={{
                      background: "rgba(59,130,246,0.85)",
                      border: "1px solid rgba(59,130,246,0.4)",
                      boxShadow: "0 4px 16px rgba(59,130,246,0.25)",
                    }}
                    onClick={handlePinSubmit}
                    disabled={pinInput.length < 4}
                    data-ocid="settings.submit_button"
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" /> Unlock Settings
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return <SettingsContent onLock={() => setUnlocked(false)} />;
}

function SettingsContent({ onLock }: { onLock: () => void }) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinChangeError, setPinChangeError] = useState("");

  // Debug panel state
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugData, setDebugData] = useState<string | null>(null);
  const [debugRawValidity, setDebugRawValidity] = useState<string | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null);

  function handlePinChange() {
    if (currentPin !== getStoredPin()) {
      setPinChangeError("Current PIN is incorrect.");
      return;
    }
    if (newPin.length < 4) {
      setPinChangeError("New PIN must be at least 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinChangeError("New PINs do not match.");
      return;
    }
    localStorage.setItem(PIN_KEY, newPin);
    setPinChangeError("");
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    toast.success("PIN updated successfully!");
  }

  async function handleLoadDebugData() {
    setDebugLoading(true);
    setDebugData(null);
    setDebugRawValidity(null);
    setDebugError(null);
    try {
      const params = new URLSearchParams({ action: "getMembers" });
      const res = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`, {
        method: "GET",
        redirect: "follow",
      });
      const text = await res.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        setDebugError(
          `Response is not valid JSON. Raw response:\n${text.slice(0, 500)}`,
        );
        setDebugLoading(false);
        return;
      }
      if (Array.isArray(parsed) && parsed.length > 0) {
        const firstMember = parsed[0] as Record<string, unknown>;
        setDebugData(JSON.stringify(firstMember, null, 2));
        // Find Package Validity key (case-insensitive)
        const pvKey = Object.keys(firstMember).find(
          (k) => k.trim().toLowerCase() === "package validity",
        );
        setDebugRawValidity(
          pvKey
            ? String(firstMember[pvKey])
            : `(key not found — available keys: ${Object.keys(firstMember).join(", ")})`,
        );
      } else if (Array.isArray(parsed) && parsed.length === 0) {
        setDebugData("Array is empty — no members returned from Apps Script");
        setDebugRawValidity(null);
      } else if (
        parsed &&
        typeof parsed === "object" &&
        (parsed as Record<string, unknown>).error
      ) {
        setDebugError(
          `Apps Script error: ${(parsed as Record<string, unknown>).error}`,
        );
      } else {
        setDebugData(JSON.stringify(parsed, null, 2));
        setDebugRawValidity("Response is not an array");
      }
    } catch (err) {
      setDebugError(`Fetch failed: ${err}`);
    }
    setDebugLoading(false);
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6 max-w-2xl mx-auto"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Settings
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Admin configuration
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2 text-white/70 hover:text-white"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
          onClick={onLock}
          data-ocid="settings.secondary_button"
        >
          <Lock className="h-3.5 w-3.5" /> Lock
        </Button>
      </div>

      {/* Gym Info */}
      <div className="rounded-2xl p-5" style={glassCard}>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-4 w-4" style={{ color: "#fb923c" }} />
          <span className="text-sm font-semibold text-white">
            Gym Information
          </span>
        </div>
        <div className="space-y-3">
          <InfoRow label="Gym Name" value="AK Pack Fitness" />
          <InfoRow label="Timezone" value="Asia/Kolkata (IST, UTC+5:30)" />
          <InfoRow label="Operating Hours" value="6:00 AM – 11:00 PM" />
          <InfoRow label="Currency" value="PKR" />
          <InfoRow label="Time Format" value="12-hour (AM/PM)" />
        </div>
      </div>

      {/* Packages */}
      <div className="rounded-2xl p-5" style={glassCard}>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4" style={{ color: "#a78bfa" }} />
          <span className="text-sm font-semibold text-white">
            Membership Packages
          </span>
        </div>
        <div className="space-y-2">
          {PACKAGES.map((pkg, i) => (
            <div
              key={pkg}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
              data-ocid={`settings.item.${i + 1}`}
            >
              <span className="text-sm font-medium text-white">{pkg}</span>
              <span
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Package {i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Change PIN */}
      <div className="rounded-2xl p-5" style={glassCard}>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-4 w-4" style={{ color: "#60a5fa" }} />
          <span className="text-sm font-semibold text-white">
            Change Admin PIN
          </span>
        </div>
        <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
          Minimum 4 digits
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="current-pin" className="text-xs text-white/60">
              Current PIN
            </Label>
            <Input
              id="current-pin"
              type="password"
              inputMode="numeric"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
              placeholder="Current"
              className="text-white placeholder:text-white/25 tracking-widest text-center"
              style={inputStyle}
              data-ocid="settings.pin.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-pin" className="text-xs text-white/60">
              New PIN
            </Label>
            <Input
              id="new-pin"
              type="password"
              inputMode="numeric"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              placeholder="New"
              className="text-white placeholder:text-white/25 tracking-widest text-center"
              style={inputStyle}
              data-ocid="settings.newpin.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-pin" className="text-xs text-white/60">
              Confirm PIN
            </Label>
            <Input
              id="confirm-pin"
              type="password"
              inputMode="numeric"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              placeholder="Confirm"
              className="text-white placeholder:text-white/25 tracking-widest text-center"
              style={inputStyle}
              data-ocid="settings.confirmpin.input"
            />
          </div>
        </div>

        <AnimatePresence>
          {pinChangeError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-xs text-red-400 mt-3"
              data-ocid="settings.pin.error_state"
            >
              <AlertCircle className="h-3.5 w-3.5" /> {pinChangeError}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          className="gap-2 text-white font-semibold mt-4"
          style={{
            background: "rgba(59,130,246,0.85)",
            border: "1px solid rgba(59,130,246,0.4)",
            boxShadow: "0 4px 16px rgba(59,130,246,0.2)",
          }}
          onClick={handlePinChange}
          disabled={!currentPin || !newPin || !confirmPin}
          data-ocid="settings.save_button"
        >
          <Save className="h-4 w-4" /> Update PIN
        </Button>
      </div>

      {/* Debug Panel */}
      <div
        className="rounded-2xl p-5"
        style={{
          ...glassCard,
          border: "1px solid rgba(251,146,60,0.2)",
          background: "rgba(251,146,60,0.04)",
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Bug className="h-4 w-4" style={{ color: "#fb923c" }} />
          <span className="text-sm font-semibold text-white">
            Debug: API Data
          </span>
        </div>
        <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
          Inspect raw data returned by Apps Script to diagnose date parsing
          issues
        </p>

        <Button
          className="gap-2 text-white font-semibold"
          style={{
            background: "rgba(251,146,60,0.25)",
            border: "1px solid rgba(251,146,60,0.35)",
          }}
          onClick={handleLoadDebugData}
          disabled={debugLoading}
          data-ocid="settings.debug.button"
        >
          <Bug className="h-4 w-4" />
          {debugLoading ? "Loading..." : "Load Raw API Data"}
        </Button>

        <AnimatePresence>
          {debugError && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-3 rounded-xl"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
              }}
              data-ocid="settings.debug.error_state"
            >
              <p className="text-xs text-red-400 font-mono whitespace-pre-wrap break-all">
                {debugError}
              </p>
            </motion.div>
          )}

          {debugData && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 space-y-3"
              data-ocid="settings.debug.success_state"
            >
              {debugRawValidity !== null && (
                <div
                  className="p-3 rounded-xl"
                  style={{
                    background: "rgba(251,146,60,0.1)",
                    border: "1px solid rgba(251,146,60,0.25)",
                  }}
                >
                  <p
                    className="text-xs font-semibold mb-1"
                    style={{ color: "#fb923c" }}
                  >
                    📅 Package Validity raw value:
                  </p>
                  <p className="text-sm font-mono text-white break-all select-all">
                    {debugRawValidity}
                  </p>
                </div>
              )}

              <div>
                <p
                  className="text-xs font-semibold mb-2"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  First member object (raw keys &amp; values from Apps Script):
                </p>
                <pre
                  className="text-xs font-mono text-green-300 overflow-auto rounded-xl p-3"
                  style={{
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    maxHeight: "320px",
                  }}
                >
                  {debugData}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between py-2"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
        {label}
      </span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}
