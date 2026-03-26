import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Loader2,
  LogIn,
  LogOut,
  Package,
  Search,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "../components/StatusBadge";
import { useCheckIn, useCheckOut, useMembers } from "../hooks/useQueries";
import {
  type Member,
  computeStatus,
  formatDateIST,
  parseSheetDate,
} from "../utils/helpers";
import { fetchMemberById } from "../utils/sheetsApi";

const glassCard = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(16px)",
} as const;

export function CheckInOutPage() {
  const [query, setQuery] = useState("");
  const [foundMember, setFoundMember] = useState<Member | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<"checkin" | "checkout" | null>(
    null,
  );

  const { data: members = [], isLoading: membersLoading } = useMembers();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  async function handleSearch() {
    setNotFound(false);
    setFoundMember(null);
    setLastAction(null);
    setSearchError(null);
    const q = query.trim();
    if (!q) return;

    // 1. Try local cache first (fast path)
    const qLower = q.toLowerCase();
    const found = members.find(
      (m) => m["Membership ID"]?.toLowerCase() === qLower,
    );

    if (found) {
      setFoundMember(found);
      return;
    }

    // 2. Fallback: direct API lookup (works even if full member list failed to load)
    setSearching(true);
    try {
      const apiMember = await fetchMemberById(q);
      if (apiMember?.["Membership ID"]) {
        setFoundMember(apiMember as unknown as Member);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      setSearchError(
        err instanceof Error
          ? err.message
          : "Failed to reach server. Check your internet connection.",
      );
    } finally {
      setSearching(false);
    }
  }

  async function handleCheckIn() {
    if (!foundMember) return;
    const status = computeStatus(foundMember["Package Validity"]);
    try {
      await checkIn.mutateAsync({
        membershipId: foundMember["Membership ID"],
        clientName: foundMember["Client Name"],
        status,
      });
      setLastAction("checkin");
      toast.success(`✅ ${foundMember["Client Name"]} checked in!`);
    } catch {
      toast.error("Check-in failed. Please try again.");
    }
  }

  async function handleCheckOut() {
    if (!foundMember) return;
    try {
      await checkOut.mutateAsync(foundMember["Membership ID"]);
      setLastAction("checkout");
      toast.success(`👋 ${foundMember["Client Name"]} checked out!`);
    } catch {
      toast.error("Check-out failed. Please try again.");
    }
  }

  const isMutating = checkIn.isPending || checkOut.isPending;
  const isSearching = searching || (membersLoading && !members.length);

  const validityDate = foundMember
    ? parseSheetDate(foundMember["Package Validity"])
    : null;

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">
          Check In / Out
        </h1>
        <p
          className="text-sm mt-0.5"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          Enter Membership ID to find a member
        </p>
      </div>

      {/* Search card */}
      <div className="rounded-2xl p-5 space-y-4" style={glassCard}>
        <div className="space-y-2">
          <Label
            htmlFor="membership-id"
            className="text-sm font-medium text-white/70"
          >
            Membership ID
          </Label>
          <div className="flex gap-2">
            <Input
              id="membership-id"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Enter Membership ID..."
              className="text-white placeholder:text-white/30"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              data-ocid="checkinout.input"
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="gap-2 text-white"
              style={{
                background: "rgba(59,130,246,0.85)",
                border: "1px solid rgba(59,130,246,0.4)",
                boxShadow: "0 4px 16px rgba(59,130,246,0.25)",
              }}
              data-ocid="checkinout.primary_button"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isSearching ? "Searching..." : "Find"}
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {notFound && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-sm text-red-400 rounded-xl p-3"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
              data-ocid="checkinout.error_state"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              No member found with that Membership ID. Double-check the ID and
              try again.
            </motion.div>
          )}
          {searchError && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 text-sm text-red-400 rounded-xl p-3"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
              data-ocid="checkinout.error_state"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{searchError}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Member card */}
      <AnimatePresence>
        {foundMember && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(59,130,246,0.3)",
                boxShadow:
                  "0 0 24px rgba(59,130,246,0.15), 0 8px 32px rgba(0,0,0,0.5)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div
                className="h-1"
                style={{
                  background:
                    "linear-gradient(90deg, #3b82f6, #a855f7, #3b82f6)",
                }}
              />
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center"
                      style={{
                        background: "rgba(59,130,246,0.2)",
                        border: "1px solid rgba(59,130,246,0.3)",
                      }}
                    >
                      <User className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-lg text-white">
                        {foundMember["Client Name"]}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.45)" }}
                      >
                        ID: {foundMember["Membership ID"]}
                      </p>
                    </div>
                  </div>
                  <StatusBadge
                    status={computeStatus(foundMember["Package Validity"])}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded-xl p-3"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    <div
                      className="flex items-center gap-1.5 text-xs mb-1"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      <Package className="h-3.5 w-3.5" /> Package
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {foundMember["Package Details"] || "—"}
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-3"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    <div
                      className="flex items-center gap-1.5 text-xs mb-1"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      <Calendar className="h-3.5 w-3.5" /> Validity
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {validityDate ? formatDateIST(validityDate) : "—"}
                    </p>
                  </div>
                </div>

                <AnimatePresence>
                  {lastAction && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-sm text-green-400 rounded-xl p-3"
                      style={{
                        background: "rgba(34,197,94,0.1)",
                        border: "1px solid rgba(34,197,94,0.2)",
                      }}
                      data-ocid="checkinout.success_state"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {lastAction === "checkin"
                        ? "Member checked in successfully!"
                        : "Member checked out successfully!"}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3">
                  <Button
                    className="flex-1 gap-2 text-green-300 font-semibold"
                    style={{
                      background: "rgba(34,197,94,0.15)",
                      border: "1px solid rgba(34,197,94,0.25)",
                    }}
                    onClick={handleCheckIn}
                    disabled={isMutating}
                    data-ocid="checkinout.checkin.primary_button"
                  >
                    {checkIn.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="h-4 w-4" />
                    )}
                    Check In
                  </Button>
                  <Button
                    className="flex-1 gap-2 text-orange-300 font-semibold"
                    style={{
                      background: "rgba(251,146,60,0.15)",
                      border: "1px solid rgba(251,146,60,0.25)",
                    }}
                    onClick={handleCheckOut}
                    disabled={isMutating}
                    data-ocid="checkinout.checkout.secondary_button"
                  >
                    {checkOut.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    Check Out
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
