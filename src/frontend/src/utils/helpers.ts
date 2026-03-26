// Timezone: Asia/Kolkata (IST, UTC+5:30)
export const IST_TIMEZONE = "Asia/Kolkata";

export function getNowIST(): Date {
  return new Date();
}

// Month name → 0-based index map for Apps Script date string parsing
const MONTH_NAMES: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

/**
 * Safely parse a date string that may come from Google Sheets.
 * Handles:
 *  - dd/MM/yyyy  (Sheets default with slashes)
 *  - dd-MM-yyyy  (Sheets default with hyphens — e.g. "19-03-2026")
 *  - YYYY-MM-DD  (ISO)
 *  - Apps Script Date.toString():  "Mon Mar 24 2025 00:00:00 GMT+0530 (India Standard Time)"
 *  - Any string whose year < 1900 (Sheets epoch for empty cells)
 *  - Falsy / "0" values
 * Returns a valid Date or null.
 */
export function parseSheetDate(value: string | undefined | null): Date | null {
  if (!value || value.trim() === "" || value === "0") return null;
  // Reject 1899 epoch strings (empty date cells serialized by Apps Script)
  if (value.includes("1899")) return null;

  // dd/MM/yyyy (Google Sheets default with slashes)
  const ddmmyyyySlash = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyySlash) {
    const d = new Date(
      Number(ddmmyyyySlash[3]),
      Number(ddmmyyyySlash[2]) - 1,
      Number(ddmmyyyySlash[1]),
    );
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // dd-MM-yyyy (Google Sheets with hyphens — e.g. "19-03-2026")
  const ddmmyyyyHyphen = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (ddmmyyyyHyphen) {
    const day = Number(ddmmyyyyHyphen[1]);
    const month = Number(ddmmyyyyHyphen[2]);
    const year = Number(ddmmyyyyHyphen[3]);
    if (year >= 1900) {
      const d = new Date(year, month - 1, day);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  // YYYY-MM-DD (ISO format -- use local date constructor to avoid UTC midnight shift)
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(d.getTime()) || d.getFullYear() < 1900 ? null : d;
  }

  // Apps Script Date.toString() format:
  // "Mon Mar 24 2025 00:00:00 GMT+0530 (India Standard Time)"
  const scriptFmt = value.match(/(?:\w{3}\s+)?(\w{3})\s+(\d{1,2})\s+(\d{4})/);
  if (scriptFmt) {
    const monthIdx = MONTH_NAMES[scriptFmt[1].toLowerCase()];
    if (monthIdx !== undefined) {
      const year = Number(scriptFmt[3]);
      const day = Number(scriptFmt[2]);
      if (year >= 1900) {
        const d = new Date(year, monthIdx, day);
        return Number.isNaN(d.getTime()) ? null : d;
      }
    }
  }

  // Fallback: native parse
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getFullYear() < 1900) return null;
  return d;
}

/**
 * Convert a Sheets dd/MM/yyyy date string to ISO YYYY-MM-DD.
 * Returns the original string unchanged if it doesn't match the pattern.
 */
export function sheetDateToISO(dateStr: string): string {
  if (!dateStr) return "";
  const m = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  // Also handle dd-MM-yyyy
  const h = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (h) {
    return `${h[3]}-${h[2].padStart(2, "0")}-${h[1].padStart(2, "0")}`;
  }
  return dateStr;
}

export function formatDateIST(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatTimeIST(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-IN", {
    timeZone: IST_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateTimeIST(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-IN", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function getTodayISTString(): string {
  const now = new Date();
  return now.toLocaleDateString("en-CA", { timeZone: IST_TIMEZONE });
}

export function getCurrentISTDateTimeString(): string {
  const now = new Date();
  return now.toLocaleString("en-IN", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/**
 * Convert a 12-hour time string (e.g. "09:30 AM", "01:30 PM") to total
 * minutes since midnight (0–1439). Used for correct chronological sorting.
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = Number.parseInt(match[1]);
  const minutes = Number.parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export type MemberStatus = "Active" | "Expiring Soon" | "Expired";

export function computeStatus(packageValidity: string): MemberStatus {
  if (!packageValidity || packageValidity.trim() === "") return "Active";
  const validity = parseSheetDate(packageValidity);
  if (!validity) return "Active";

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  validity.setHours(0, 0, 0, 0);

  const diffMs = validity.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "Expired";
  if (diffDays <= 3) return "Expiring Soon";
  return "Active";
}

export function getStatusClass(status: string): string {
  if (status === "Active") return "status-active";
  if (status === "Expiring Soon") return "status-expiring";
  return "status-expired";
}

export function getStatusDotColor(status: string): string {
  if (status === "Active") return "bg-green-400";
  if (status === "Expiring Soon") return "bg-yellow-400";
  return "bg-red-400";
}

export type MembershipStatus = "active" | "warning" | "expired" | "unknown";

export function computeMembershipStatus(packageValidity: string): {
  status: MembershipStatus;
  daysLeft: number;
} {
  if (!packageValidity || packageValidity.trim() === "") {
    return { status: "unknown", daysLeft: 0 };
  }

  const validity = parseSheetDate(packageValidity);
  if (!validity) return { status: "unknown", daysLeft: 0 };

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  validity.setHours(0, 0, 0, 0);

  const diffMs = validity.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) return { status: "expired", daysLeft };
  if (daysLeft <= 3) return { status: "warning", daysLeft };
  return { status: "active", daysLeft };
}

export interface Member {
  "Client Name": string;
  "Contact No": string;
  "Package Details": string;
  "Package Validity": string;
  Status: string;
  "Created On": string;
  "Membership ID": string;
}

export interface AttendanceRecord {
  Date: string;
  "Membership ID": string;
  "Client Name": string;
  "Check In Time": string;
  "Check Out Time": string;
  Status: string;
  "Package Validity"?: string;
}

export function parseMembers(raw: string): Member[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.data)) return parsed.data;
    return [];
  } catch {
    return [];
  }
}

export function parseAttendance(raw: string): AttendanceRecord[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.data)) return parsed.data;
    return [];
  } catch {
    return [];
  }
}

export function getHourFromTimeString(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 0;
  let hour = Number.parseInt(match[1]);
  const period = match[3];
  if (period) {
    if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (period.toUpperCase() === "AM" && hour === 12) hour = 0;
  }
  return hour;
}
