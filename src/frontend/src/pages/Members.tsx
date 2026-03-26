import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  CalendarCheck,
  Package,
  Phone,
  Search,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import { useMembers } from "../hooks/useQueries";
import {
  type Member,
  computeStatus,
  formatDateIST,
  parseSheetDate,
} from "../utils/helpers";

export function MembersPage() {
  const [search, setSearch] = useState("");
  const { data: members = [], isLoading, isError, error } = useMembers();

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return members;
    return members.filter(
      (m) =>
        m["Client Name"]?.toLowerCase().includes(q) ||
        m["Membership ID"]?.toLowerCase().includes(q) ||
        m["Contact No"]?.toLowerCase().includes(q),
    );
  }, [members, search]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6" style={{ color: "#a78bfa" }} />
            Members
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            {members.length} total members
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "rgba(255,255,255,0.35)" }}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID or phone..."
            className="pl-9 text-white placeholder:text-white/30"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            data-ocid="members.search_input"
          />
        </div>
      </div>

      {isError && (
        <div
          className="rounded-xl p-4 text-sm text-red-400"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
          data-ocid="members.error_state"
        >
          <p className="font-semibold">⚠ Failed to load members.</p>
          {error instanceof Error && (
            <p className="text-xs opacity-70 mt-1">{error.message}</p>
          )}
          <p className="text-xs opacity-60 mt-1">
            Make sure your Apps Script is deployed with access set to
            &quot;Anyone&quot;.
          </p>
        </div>
      )}

      {isLoading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="members.loading_state"
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-60 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20"
          style={{ color: "rgba(255,255,255,0.3)" }}
          data-ocid="members.empty_state"
        >
          <Users className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">
            {search ? "No members match your search" : "No members found"}
          </p>
          <p className="text-xs mt-1 opacity-60">
            {search
              ? "Try a different search term"
              : "Add members via Google Sheets"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((member: Member, i: number) => (
            <MemberCard
              key={member["Membership ID"] || i}
              member={member}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MemberCard({ member, index }: { member: Member; index: number }) {
  const status = computeStatus(member["Package Validity"]);
  const statusAccent =
    status === "Active"
      ? "rgba(34,197,94,0.2)"
      : status === "Expiring Soon"
        ? "rgba(251,191,36,0.2)"
        : "rgba(239,68,68,0.2)";
  const statusBorder =
    status === "Active"
      ? "rgba(34,197,94,0.25)"
      : status === "Expiring Soon"
        ? "rgba(251,191,36,0.25)"
        : "rgba(239,68,68,0.25)";

  const ocid = `members.item.${Math.min(index + 1, 20)}`;

  const startDateParsed = parseSheetDate(member["Created On"]);
  const endDateParsed = parseSheetDate(member["Package Validity"]);
  const startDate = startDateParsed ? formatDateIST(startDateParsed) : "—";
  const endDate = endDateParsed ? formatDateIST(endDateParsed) : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      data-ocid={ocid}
    >
      <div
        className="rounded-2xl p-4 space-y-3 h-full"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${statusBorder}`,
          backdropFilter: "blur(16px)",
          boxShadow: `0 4px 24px ${statusAccent}, 0 2px 8px rgba(0,0,0,0.4)`,
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(139,92,246,0.2)",
                border: "1px solid rgba(139,92,246,0.3)",
              }}
            >
              <span className="text-sm font-bold text-purple-400">
                {(member["Client Name"] || "?").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-sm text-white truncate">
                {member["Client Name"] || "—"}
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                #{member["Membership ID"]}
              </p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="space-y-2">
          <div
            className="flex items-center gap-2 text-xs"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{member["Contact No"] || "—"}</span>
          </div>
          <div
            className="flex items-center gap-2 text-xs"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            <Package className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{member["Package Details"] || "—"}</span>
          </div>
          <div
            className="flex items-center gap-2 text-xs"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            <CalendarCheck className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Started: {startDate}</span>
          </div>
          <div
            className="flex items-center gap-2 text-xs"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Expires: {endDate}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
