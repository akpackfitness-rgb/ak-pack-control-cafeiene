import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Clock,
  LogIn,
  LogOut,
  RefreshCw,
  TrendingUp,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import type { Variants } from "motion/react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAttendance, useMembers } from "../hooks/useQueries";
import {
  type AttendanceRecord,
  computeStatus,
  getHourFromTimeString,
  getTodayISTString,
  parseSheetDate,
  sheetDateToISO,
} from "../utils/helpers";

const CARD_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4 },
  }),
};

export function DashboardPage() {
  const today = getTodayISTString(); // YYYY-MM-DD
  const {
    data: members = [],
    isLoading: membersLoading,
    isError: membersError,
    refetch: refetchMembers,
  } = useMembers();
  const {
    data: attendance = [],
    isLoading: attendanceLoading,
    isError: attendanceError,
    refetch: refetchAttendance,
  } = useAttendance();

  const stats = useMemo(() => {
    // Sheets returns Date as dd/MM/yyyy; convert to YYYY-MM-DD for comparison
    const todayAttendance = attendance.filter(
      (r) => sheetDateToISO(r.Date) === today,
    );
    const checkIns = todayAttendance.filter((r) => r["Check In Time"]).length;
    const checkOuts = todayAttendance.filter((r) => r["Check Out Time"]).length;
    const inside = checkIns - checkOuts;
    const active = members.filter(
      (m) => computeStatus(m["Package Validity"]) === "Active",
    ).length;
    const expiring = members.filter(
      (m) => computeStatus(m["Package Validity"]) === "Expiring Soon",
    ).length;
    const expired = members.filter(
      (m) => computeStatus(m["Package Validity"]) === "Expired",
    ).length;
    return {
      checkIns,
      checkOuts,
      inside: Math.max(0, inside),
      active,
      expiring,
      expired,
    };
  }, [members, attendance, today]);

  const weeklyData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts: Record<string, number> = {};
    for (const d of days) counts[d] = 0;
    for (const r of attendance) {
      if (!r.Date) continue;
      // Normalize dd/MM/yyyy before parsing
      const d = parseSheetDate(r.Date);
      if (d && !Number.isNaN(d.getTime())) {
        const day = days[d.getDay()];
        counts[day] = (counts[day] || 0) + 1;
      }
    }
    const todayDate = new Date();
    return days.map((d, i) => ({
      day: d,
      count: counts[d],
      isToday: i === todayDate.getDay(),
    }));
  }, [attendance]);

  const peakHoursData = useMemo(() => {
    const counts: Record<number, number> = {};
    for (let h = 6; h <= 23; h++) counts[h] = 0;
    for (const r of attendance as AttendanceRecord[]) {
      const t = r["Check In Time"];
      if (t) {
        const h = getHourFromTimeString(t);
        if (h >= 6 && h <= 23) counts[h] = (counts[h] || 0) + 1;
      }
    }
    return Object.entries(counts).map(([h, count]) => ({
      hour: `${Number.parseInt(h) % 12 || 12}${Number.parseInt(h) < 12 ? "am" : "pm"}`,
      count,
    }));
  }, [attendance]);

  const STAT_CARDS = [
    {
      label: "Today's Check Ins",
      value: stats.checkIns,
      icon: LogIn,
      cls: "stat-purple",
      iconColor: "#a78bfa",
      shadow: "rgba(139,92,246,0.25)",
    },
    {
      label: "Today's Check Outs",
      value: stats.checkOuts,
      icon: LogOut,
      cls: "stat-blue",
      iconColor: "#60a5fa",
      shadow: "rgba(59,130,246,0.25)",
    },
    {
      label: "Members Inside",
      value: stats.inside,
      icon: UserCheck,
      cls: "stat-teal",
      iconColor: "#2dd4bf",
      shadow: "rgba(20,184,166,0.25)",
    },
    {
      label: "Active Members",
      value: stats.active,
      icon: Users,
      cls: "stat-green",
      iconColor: "#4ade80",
      shadow: "rgba(34,197,94,0.25)",
    },
    {
      label: "Expiring Soon",
      value: stats.expiring,
      icon: AlertTriangle,
      cls: "stat-amber",
      iconColor: "#fb923c",
      shadow: "rgba(251,146,60,0.25)",
    },
    {
      label: "Expired",
      value: stats.expired,
      icon: UserX,
      cls: "stat-red",
      iconColor: "#f87171",
      shadow: "rgba(239,68,68,0.25)",
    },
  ];

  const isLoading = membersLoading || attendanceLoading;
  const hasError = membersError || attendanceError;

  const tooltipStyle = {
    background: "rgba(12,12,20,0.95)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    color: "#fff",
    fontSize: 12,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            AK Pack Fitness
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Gym Management Dashboard
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2 text-white/70 hover:text-white"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
          onClick={() => {
            refetchMembers();
            refetchAttendance();
          }}
          data-ocid="dashboard.primary_button"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {hasError && (
        <div
          className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
          data-ocid="dashboard.error_state"
        >
          ⚠ Failed to load data. Check your internet connection and try again.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {STAT_CARDS.map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={CARD_VARIANTS}
            data-ocid="dashboard.stat.card"
          >
            {isLoading ? (
              <Skeleton
                className="h-28 rounded-2xl"
                data-ocid="dashboard.loading_state"
              />
            ) : (
              <div
                className={`rounded-2xl p-4 ${card.cls}`}
                style={{
                  boxShadow: `0 8px 32px ${card.shadow}, 0 2px 8px rgba(0,0,0,0.4)`,
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p
                      className="text-xs font-medium"
                      style={{ color: "rgba(255,255,255,0.55)" }}
                    >
                      {card.label}
                    </p>
                    <p className="text-3xl font-display font-bold mt-1 text-white">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.12)" }}
                  >
                    <card.icon
                      className="h-5 w-5"
                      style={{ color: card.iconColor }}
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly attendance bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div
            className="rounded-2xl p-5"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4" style={{ color: "#fb923c" }} />
              <span className="text-sm font-semibold text-white">
                Weekly Attendance
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyData} barSize={28}>
                  <defs>
                    <linearGradient
                      id="barGradient"
                      x1="0"
                      y1="1"
                      x2="0"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.9} />
                      <stop
                        offset="100%"
                        stopColor="#a855f7"
                        stopOpacity={0.9}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  />
                  <Bar
                    dataKey="count"
                    name="Visits"
                    fill="url(#barGradient)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Peak hours line chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div
            className="rounded-2xl p-5"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4" style={{ color: "#f59e0b" }} />
              <span className="text-sm font-semibold text-white">
                Peak Gym Hours
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={peakHoursData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ stroke: "rgba(245,158,11,0.3)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Check-ins"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
