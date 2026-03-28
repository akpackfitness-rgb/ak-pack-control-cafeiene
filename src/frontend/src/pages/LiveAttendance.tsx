import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Tv,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import { useAttendance, useMembers } from "../hooks/useQueries";
import {
  type AttendanceRecord,
  computeMembershipStatus,
  formatDateIST,
  getTodayISTString,
  sheetDateToISO,
  timeToMinutes,
} from "../utils/helpers";

const glassCard = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(16px)",
} as const;

export function LiveAttendancePage() {
  const today = getTodayISTString(); // YYYY-MM-DD
  // Default to empty string so ALL records show by default
  const [filterDate, setFilterDate] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(
    null,
  );

  const handleSelect = useCallback((record: AttendanceRecord) => {
    setSelectedRecord(record);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedRecord(null);
  }, []);

  const {
    data: attendance = [],
    isLoading,
    isFetching,
    isError,
    error,
    dataUpdatedAt,
    refetch,
  } = useAttendance();

  const { data: members = [], isError: membersError } = useMembers();

  // Build a membership ID → Package Validity lookup map
  // Normalize IDs numerically to handle leading zeros / whitespace mismatches
  const memberValidityMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of members) {
      const id = (m["Membership ID"] || "").trim();
      if (id) {
        map[id] = m["Package Validity"] || "";
        // Also map by plain integer string so "01" matches "1" etc.
        const numId = String(Number.parseInt(id, 10));
        if (!Number.isNaN(Number.parseInt(id, 10))) {
          map[numId] = m["Package Validity"] || "";
        }
      }
    }
    return map;
  }, [members]);

  // Also build a member details map for the modal
  const memberDetailsMap = useMemo(() => {
    const map: Record<string, { packageDetails: string; contactNo: string }> =
      {};
    for (const m of members) {
      const id = (m["Membership ID"] || "").trim();
      if (id) {
        const info = {
          packageDetails: m["Package Details"] || "",
          contactNo: m["Contact No"] || "",
        };
        map[id] = info;
        const numId = String(Number.parseInt(id, 10));
        if (!Number.isNaN(Number.parseInt(id, 10))) map[numId] = info;
      }
    }
    return map;
  }, [members]);

  const filtered = useMemo(() => {
    if (!filterDate) return attendance;
    // normalizeAttendance already converts Date to ISO (YYYY-MM-DD).
    // sheetDateToISO handles any raw dd/MM/yyyy or dd-MM-yyyy that might slip through.
    return attendance.filter((r) => {
      const iso = sheetDateToISO(r.Date);
      return iso === filterDate || r.Date === filterDate;
    });
  }, [attendance, filterDate]);

  // If today filter is active, there are records loaded, but none match today,
  // automatically show all records instead of a blank screen.
  // Removed !isLoading guard so the fallback also triggers during background refetch states.
  const showingAllFallback =
    filterDate === today && filtered.length === 0 && attendance.length > 0;

  const displayList = showingAllFallback ? attendance : filtered;

  const sorted = useMemo(() => {
    return [...displayList]
      .sort((a, b) => {
        return (
          timeToMinutes(b["Check In Time"] || "") -
          timeToMinutes(a["Check In Time"] || "")
        );
      })
      .slice(0, 25);
  }, [displayList]);

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: true,
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

  const hasData = attendance.length > 0;
  const noMatchForDate =
    hasData &&
    filtered.length === 0 &&
    filterDate !== "" &&
    !showingAllFallback;

  // Show skeletons only on initial load with no cached data
  const showSkeletons = isLoading && !hasData;
  // Show subtle background-fetch indicator when we already have data
  const showFetchingIndicator = isFetching && hasData;

  // Resolve validity + status for the selected modal record
  const selectedValidity = selectedRecord
    ? (() => {
        const rawId = (selectedRecord["Membership ID"] || "").trim();
        const numId = String(Number.parseInt(rawId, 10));
        return (
          memberValidityMap[rawId] ||
          memberValidityMap[numId] ||
          selectedRecord["Package Validity"] ||
          ""
        );
      })()
    : "";

  const selectedStatus = computeMembershipStatus(selectedValidity);

  const selectedDetails = selectedRecord
    ? (() => {
        const rawId = (selectedRecord["Membership ID"] || "").trim();
        const numId = String(Number.parseInt(rawId, 10));
        return memberDetailsMap[rawId] || memberDetailsMap[numId] || null;
      })()
    : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="h-6 w-6" style={{ color: "#fb923c" }} />
            Live Attendance
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              Auto-refreshing every 5s · Last: {lastUpdated}
              {showFetchingIndicator && (
                <span className="ml-2 opacity-60">· syncing…</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="#live"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs px-2 py-1 rounded"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            data-ocid="attendance.link"
          >
            <Tv className="h-3 w-3" />
            TV View
          </a>
          <Button
            size="sm"
            variant="ghost"
            className="text-white/50 hover:text-white"
            onClick={() => refetch()}
            data-ocid="attendance.primary_button"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
          <Calendar
            className="h-4 w-4"
            style={{ color: "rgba(255,255,255,0.4)" }}
          />
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-40 text-sm text-white"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            data-ocid="attendance.input"
          />
          {/* Quick-jump to today */}
          {filterDate !== today && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white/50 hover:text-white text-xs px-2"
              onClick={() => setFilterDate(today)}
              data-ocid="attendance.secondary_button"
            >
              Today
            </Button>
          )}
          {filterDate !== "" && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white/40 hover:text-white text-xs px-2"
              onClick={() => setFilterDate("")}
            >
              All
            </Button>
          )}
        </div>
      </div>

      {isError && (
        <div
          className="rounded-xl p-4 text-sm text-red-400 space-y-1"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
          data-ocid="attendance.error_state"
        >
          <p className="font-semibold">Failed to load attendance data.</p>
          {error instanceof Error && (
            <p className="text-xs opacity-70">{error.message}</p>
          )}
          <p className="text-xs opacity-60 mt-1">
            Make sure your Apps Script has an <code>action=getAttendance</code>{" "}
            handler in <code>doGet</code>.
          </p>
        </div>
      )}

      {/* Auto-fallback notice when no records found for today */}
      {showingAllFallback && (
        <div
          className="rounded-xl p-3 text-xs"
          style={{
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.2)",
            color: "rgba(251,191,36,0.85)",
          }}
        >
          Showing all records — no entries found for today ({today}).{" "}
          <button
            type="button"
            className="underline"
            onClick={() => setFilterDate("")}
          >
            Clear filter
          </button>
        </div>
      )}

      {noMatchForDate && !isLoading && (
        <div
          className="rounded-xl p-3 text-xs"
          style={{
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.2)",
            color: "rgba(251,191,36,0.8)",
          }}
        >
          {attendance.length} total records loaded, but none match{" "}
          <strong>{filterDate}</strong>.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => setFilterDate("")}
          >
            Show all records
          </button>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={glassCard}>
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="text-sm font-semibold text-white">
            {showingAllFallback
              ? "All Attendance Records (today has no entries)"
              : filterDate === today
                ? "Today's Attendance"
                : filterDate
                  ? `Attendance for ${formatDateIST(new Date(`${filterDate}T00:00:00`))}`
                  : "All Attendance Records"}
          </span>
          <Badge
            variant="secondary"
            className="text-xs"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {sorted.length} records
          </Badge>
        </div>

        {/* Warning strip when member data is unavailable (CORS / load error) */}
        {membersError && (
          <div
            className="flex items-center gap-2 px-5 py-2.5 text-xs"
            style={{
              background: "rgba(251,191,36,0.08)",
              borderBottom: "1px solid rgba(251,191,36,0.18)",
              color: "rgba(251,191,36,0.85)",
            }}
          >
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>
              Member data unavailable — status colors reflect check-in records
              only
            </span>
          </div>
        )}

        {showSkeletons ? (
          <div className="p-4 space-y-3" data-ocid="attendance.loading_state">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 px-6 text-center"
            style={{ color: "rgba(255,255,255,0.3)" }}
            data-ocid="attendance.empty_state"
          >
            <RefreshCw className="h-10 w-10 mb-3 opacity-40" />
            {!isError && attendance.length === 0 ? (
              <>
                <p className="text-sm font-semibold">
                  No attendance records found
                </p>
                <p className="text-xs mt-1 opacity-60 max-w-xs">
                  Check-in a member first, or verify your Apps Script is
                  returning data for <code>action=getAttendance</code>.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm">No attendance records for this date</p>
                <p className="text-xs mt-1 opacity-60">
                  Try checking-in a member first, then refresh
                </p>
              </>
            )}
          </div>
        ) : (
          <div
            className="divide-y"
            style={{ borderColor: "rgba(255,255,255,0.05)" }}
          >
            {sorted.map((record: AttendanceRecord, i: number) => {
              const rawId = (record["Membership ID"] || "").trim();
              const numId = String(Number.parseInt(rawId, 10));
              const packageValidity =
                memberValidityMap[rawId] ||
                memberValidityMap[numId] ||
                record["Package Validity"] ||
                "";
              return (
                <AttendanceRow
                  key={`${record["Membership ID"]}-${i}`}
                  record={record}
                  index={i}
                  onSelect={handleSelect}
                  isNewest={i === 0}
                  packageValidity={packageValidity}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Detail card -- stays open during background refresh */}
      <AnimatePresence>
        {selectedRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            }}
            onClick={handleClose}
            data-ocid="attendance.modal"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="rounded-2xl p-6 w-full max-w-sm space-y-4"
              style={{
                background: "rgba(18,18,32,0.98)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(24px)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background:
                        selectedStatus.status === "expired"
                          ? "rgba(239,68,68,0.2)"
                          : selectedStatus.status === "warning"
                            ? "rgba(234,179,8,0.2)"
                            : "rgba(59,130,246,0.2)",
                      border:
                        selectedStatus.status === "expired"
                          ? "1px solid rgba(239,68,68,0.3)"
                          : selectedStatus.status === "warning"
                            ? "1px solid rgba(234,179,8,0.3)"
                            : "1px solid rgba(59,130,246,0.3)",
                    }}
                  >
                    <span
                      className={`text-lg font-bold ${
                        selectedStatus.status === "expired"
                          ? "text-red-400"
                          : selectedStatus.status === "warning"
                            ? "text-yellow-400"
                            : "text-blue-400"
                      }`}
                    >
                      {(selectedRecord["Client Name"] || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-white">
                      {selectedRecord["Client Name"] || "Unknown"}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      #{selectedRecord["Membership ID"]}
                    </p>
                    {selectedDetails?.packageDetails && (
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "rgba(251,146,60,0.8)" }}
                      >
                        {selectedDetails.packageDetails}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-white/40 hover:text-white transition-colors"
                  data-ocid="attendance.close_button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "rgba(255,255,255,0.45)" }}>
                    Status
                  </span>
                  <StatusBadge status={selectedRecord.Status || "Active"} />
                </div>
                {/* Expiry info from member data */}
                {selectedValidity && (
                  <div className="flex justify-between">
                    <span style={{ color: "rgba(255,255,255,0.45)" }}>
                      Expires
                    </span>
                    <span
                      className={`font-semibold ${
                        selectedStatus.status === "expired"
                          ? "text-red-400"
                          : selectedStatus.status === "warning"
                            ? "text-yellow-400"
                            : "text-green-400"
                      }`}
                    >
                      {selectedValidity}
                    </span>
                  </div>
                )}
                {/* Days left / expired label */}
                {selectedValidity && (
                  <div className="flex justify-between">
                    <span style={{ color: "rgba(255,255,255,0.45)" }}>
                      Days Left
                    </span>
                    <span
                      className={`font-bold ${
                        selectedStatus.status === "expired"
                          ? "text-red-400"
                          : selectedStatus.status === "warning"
                            ? "text-yellow-400"
                            : "text-green-400"
                      }`}
                    >
                      {selectedStatus.status === "expired"
                        ? "EXPIRED"
                        : selectedStatus.status === "unknown"
                          ? "—"
                          : selectedStatus.daysLeft === 1
                            ? "1 day left"
                            : `${selectedStatus.daysLeft} days left`}
                    </span>
                  </div>
                )}
                {selectedDetails?.contactNo && (
                  <div className="flex justify-between">
                    <span style={{ color: "rgba(255,255,255,0.45)" }}>
                      Contact
                    </span>
                    <span className="text-white">
                      {selectedDetails.contactNo}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span style={{ color: "rgba(255,255,255,0.45)" }}>
                    Check In
                  </span>
                  <span className="text-green-400">
                    {selectedRecord["Check In Time"] || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "rgba(255,255,255,0.45)" }}>
                    Check Out
                  </span>
                  <span className="text-orange-400">
                    {selectedRecord["Check Out Time"] || "Not yet"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "rgba(255,255,255,0.45)" }}>Date</span>
                  <span className="text-white">
                    {selectedRecord.Date || "—"}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getRecordStatusConfig(
  recordStatus: string,
  daysLeft: number,
): {
  border: string;
  bg: string;
  hoverBg: string;
  avatarBg: string;
  avatarBorder: string;
  avatarText: string;
  labelColor: string;
  label: string;
} {
  const normalized = (recordStatus || "").trim().toLowerCase();

  if (normalized === "expired") {
    return {
      border: "3px solid rgba(239,68,68,0.6)",
      bg: "rgba(239,68,68,0.07)",
      hoverBg: "rgba(239,68,68,0.12)",
      avatarBg: "rgba(239,68,68,0.15)",
      avatarBorder: "1px solid rgba(239,68,68,0.3)",
      avatarText: "text-red-400",
      labelColor: "text-red-400",
      label: "EXPIRED",
    };
  }

  if (normalized === "expiring soon") {
    return {
      border: "3px solid rgba(234,179,8,0.7)",
      bg: "rgba(234,179,8,0.07)",
      hoverBg: "rgba(234,179,8,0.12)",
      avatarBg: "rgba(234,179,8,0.15)",
      avatarBorder: "1px solid rgba(234,179,8,0.3)",
      avatarText: "text-yellow-400",
      labelColor: "text-yellow-400",
      label:
        daysLeft > 0
          ? daysLeft === 1
            ? "1 day left"
            : `${daysLeft} days left`
          : "Expiring Soon",
    };
  }

  // Default: Active (green)
  return {
    border: "3px solid rgba(34,197,94,0.6)",
    bg: "rgba(34,197,94,0.06)",
    hoverBg: "rgba(34,197,94,0.1)",
    avatarBg: "rgba(34,197,94,0.15)",
    avatarBorder: "1px solid rgba(34,197,94,0.3)",
    avatarText: "text-green-400",
    labelColor: "text-green-400",
    label:
      daysLeft > 0
        ? daysLeft > 30
          ? `${daysLeft}d left`
          : `${daysLeft} days left`
        : "Active",
  };
}

function AttendanceRow({
  record,
  index,
  onSelect,
  isNewest,
  packageValidity,
}: {
  record: AttendanceRecord;
  index: number;
  onSelect: (r: AttendanceRecord) => void;
  isNewest: boolean;
  packageValidity: string;
}) {
  const ocid = `attendance.item.${Math.min(index + 1, 20)}`;
  const { status, daysLeft } = computeMembershipStatus(packageValidity);

  // When validity date is unknown (members list not loaded yet),
  // fall back to the Status column written during check-in.
  const statusConfig =
    status === "unknown"
      ? getRecordStatusConfig(record.Status, daysLeft)
      : {
          active: {
            border: "3px solid rgba(34,197,94,0.6)",
            bg: "rgba(34,197,94,0.06)",
            hoverBg: "rgba(34,197,94,0.1)",
            avatarBg: "rgba(34,197,94,0.15)",
            avatarBorder: "1px solid rgba(34,197,94,0.3)",
            avatarText: "text-green-400",
            labelColor: "text-green-400",
            label:
              daysLeft > 30 ? `${daysLeft}d left` : `${daysLeft} days left`,
          },
          warning: {
            border: "3px solid rgba(234,179,8,0.7)",
            bg: "rgba(234,179,8,0.07)",
            hoverBg: "rgba(234,179,8,0.12)",
            avatarBg: "rgba(234,179,8,0.15)",
            avatarBorder: "1px solid rgba(234,179,8,0.3)",
            avatarText: "text-yellow-400",
            labelColor: "text-yellow-400",
            label: daysLeft === 1 ? "1 day left" : `${daysLeft} days left`,
          },
          expired: {
            border: "3px solid rgba(239,68,68,0.6)",
            bg: "rgba(239,68,68,0.07)",
            hoverBg: "rgba(239,68,68,0.12)",
            avatarBg: "rgba(239,68,68,0.15)",
            avatarBorder: "1px solid rgba(239,68,68,0.3)",
            avatarText: "text-red-400",
            labelColor: "text-red-400",
            label: "EXPIRED",
          },
        }[status as "active" | "warning" | "expired"];

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="flex items-center gap-4 px-5 py-3.5 cursor-pointer"
      style={{
        borderLeft: statusConfig.border,
        background: isNewest
          ? `linear-gradient(90deg, rgba(251,146,60,0.08), ${statusConfig.bg})`
          : statusConfig.bg,
        transition: "background 0.2s",
      }}
      onClick={() => onSelect(record)}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = isNewest
          ? `linear-gradient(90deg, rgba(251,146,60,0.13), ${statusConfig.hoverBg})`
          : statusConfig.hoverBg;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = isNewest
          ? `linear-gradient(90deg, rgba(251,146,60,0.08), ${statusConfig.bg})`
          : statusConfig.bg;
      }}
      data-ocid={ocid}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${statusConfig.avatarText}`}
        style={{
          background: statusConfig.avatarBg,
          border: statusConfig.avatarBorder,
        }}
      >
        <span className="text-xs font-bold">
          {(record["Client Name"] || "?").charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-white truncate">
            {record["Client Name"] || "Unknown"}
          </span>
          {isNewest && (
            <span
              className="text-xs px-1.5 py-0.5 rounded font-bold"
              style={{
                background: "rgba(251,146,60,0.2)",
                color: "#fb923c",
                border: "1px solid rgba(251,146,60,0.3)",
              }}
            >
              NEW
            </span>
          )}
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            #{record["Membership ID"]}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            {record.Date || ""}
          </span>
          <span className={`text-xs font-semibold ${statusConfig.labelColor}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <StatusBadge status={record.Status || "Active"} />
        <div className="flex gap-2 text-xs">
          {record["Check In Time"] && (
            <span className="text-green-400">IN {record["Check In Time"]}</span>
          )}
          {record["Check Out Time"] && (
            <span className="text-orange-400">
              OUT {record["Check Out Time"]}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
