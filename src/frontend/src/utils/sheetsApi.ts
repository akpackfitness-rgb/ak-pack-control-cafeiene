// Direct Google Apps Script calls -- bypasses the Motoko backend for reliability
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyhG0kDajgsg10-xAczrGYXg0hpskTpk5nZh7_Wli4uk11LwILo5sVbYOVNJVGEV9GgrQ/exec";

type RowObj = Record<string, string>;

const MONTH_NAMES: Record<string, string> = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

const FULL_MONTH_NAMES: Record<string, string> = {
  January: "01",
  February: "02",
  March: "03",
  April: "04",
  May: "05",
  June: "06",
  July: "07",
  August: "08",
  September: "09",
  October: "10",
  November: "11",
  December: "12",
};

export function normalizeDateToISO(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (trimmed.includes("1899")) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const isoSlashMatch = trimmed.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (isoSlashMatch) {
    return `${isoSlashMatch[1]}-${isoSlashMatch[2].padStart(2, "0")}-${isoSlashMatch[3].padStart(2, "0")}`;
  }
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const n1 = Number.parseInt(slashMatch[1]);
    const n2 = Number.parseInt(slashMatch[2]);
    const p1 = slashMatch[1].padStart(2, "0");
    const p2 = slashMatch[2].padStart(2, "0");
    const yr = slashMatch[3];
    if (n1 > 12) return `${yr}-${p2}-${p1}`;
    if (n2 > 12) return `${yr}-${p1}-${p2}`;
    return `${yr}-${p2}-${p1}`;
  }
  const dotMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotMatch) {
    return `${dotMatch[3]}-${dotMatch[2].padStart(2, "0")}-${dotMatch[1].padStart(2, "0")}`;
  }
  // dd-MM-yyyy (hyphen, numeric)
  const hyphenNumMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (hyphenNumMatch) {
    return `${hyphenNumMatch[3]}-${hyphenNumMatch[2].padStart(2, "0")}-${hyphenNumMatch[1].padStart(2, "0")}`;
  }
  const appsScriptMatch = trimmed.match(
    /([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d{4})/,
  );
  if (appsScriptMatch) {
    const monthStr = MONTH_NAMES[appsScriptMatch[1]];
    if (monthStr) {
      const day = appsScriptMatch[2].padStart(2, "0");
      const year = appsScriptMatch[3];
      if (Number.parseInt(year) > 1900) return `${year}-${monthStr}-${day}`;
    }
  }
  const hyphenMonthMatch = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (hyphenMonthMatch) {
    const monthKey =
      hyphenMonthMatch[2].charAt(0).toUpperCase() +
      hyphenMonthMatch[2].slice(1).toLowerCase();
    const monthStr = MONTH_NAMES[monthKey];
    if (monthStr) {
      const day = hyphenMonthMatch[1].padStart(2, "0");
      const year = hyphenMonthMatch[3];
      if (Number.parseInt(year) > 1900) return `${year}-${monthStr}-${day}`;
    }
  }
  const monthCommaMatch = trimmed.match(
    /^([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})$/,
  );
  if (monthCommaMatch) {
    const rawMonth = monthCommaMatch[1];
    const day = monthCommaMatch[2].padStart(2, "0");
    const year = monthCommaMatch[3];
    const abbrev =
      rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1, 3).toLowerCase();
    let monthStr = MONTH_NAMES[abbrev];
    if (!monthStr) {
      const full =
        rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1).toLowerCase();
      monthStr = FULL_MONTH_NAMES[full];
    }
    if (monthStr && Number.parseInt(year) > 1900)
      return `${year}-${monthStr}-${day}`;
  }
  const d = new Date(trimmed);
  if (!Number.isNaN(d.getTime()) && d.getFullYear() > 1900) {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    return `${yr}-${mo}-${dy}`;
  }
  return "";
}

/**
 * Extract the membership/client ID from a raw row object using flexible key matching.
 * Checks multiple possible column name variations case-insensitively.
 */
function extractMembershipId(lower: RowObj): string {
  return (
    lower["membership id"] ??
    lower.membershipid ??
    lower.membership_id ??
    lower["client id"] ??
    lower.clientid ??
    lower.client_id ??
    lower.id ??
    ""
  );
}

function normalizeMember(raw: RowObj): RowObj {
  const lower: RowObj = {};
  for (const [k, v] of Object.entries(raw)) {
    lower[k.trim().toLowerCase()] = (v ?? "").toString().trim();
  }
  const normalizedPV = normalizeDateToISO(
    lower["package validity"] ??
      lower.validity ??
      lower["membership end date"] ??
      lower["end date"] ??
      lower.expiry ??
      lower["expiry date"] ??
      "",
  );
  const membershipId = extractMembershipId(lower);
  return {
    "Client Name": lower["client name"] ?? lower.name ?? "",
    "Contact No":
      lower["contact no"] ??
      lower["contact number"] ??
      lower.mobile ??
      lower.phone ??
      lower.contact ??
      "",
    "Package Details":
      lower["package details"] ?? lower.package ?? lower.plan ?? "",
    "Package Validity": normalizedPV,
    Status: lower.status ?? "",
    "Created On": normalizeDateToISO(
      lower["created on"] ??
        lower["start date"] ??
        lower["join date"] ??
        lower["joining date"] ??
        "",
    ),
    "Membership ID": membershipId,
  };
}

function normalizeAttendance(raw: RowObj): RowObj {
  const lower: RowObj = {};
  for (const [k, v] of Object.entries(raw)) {
    lower[k.trim().toLowerCase()] = (v ?? "").toString().trim();
  }
  return {
    Date: normalizeDateToISO(lower.date ?? ""),
    "Membership ID":
      lower["membership id"] ??
      lower.membershipid ??
      lower["client id"] ??
      lower.id ??
      "",
    "Client Name": lower["client name"] ?? lower.name ?? "",
    "Check In Time":
      lower["check in time"] ??
      lower.checkin ??
      lower["check-in"] ??
      lower["check in"] ??
      "",
    "Check Out Time":
      lower["check out time"] ??
      lower.checkout ??
      lower["check-out"] ??
      lower["check out"] ??
      "",
    Status: lower.status ?? "",
    "Package Details": lower["package details"] ?? lower.package ?? "",
    "Package Validity": normalizeDateToISO(lower["package validity"] ?? ""),
  };
}

async function fetchJson(params: URLSearchParams): Promise<unknown> {
  const url = `${APPS_SCRIPT_URL}?${params.toString()}`;
  let res: Response;
  try {
    res = await fetch(url, { method: "GET", redirect: "follow" });
  } catch (networkErr) {
    throw new Error(
      `Network error -- cannot reach Google Apps Script. Check your internet connection. (${networkErr})`,
    );
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    const preview = text.slice(0, 200);
    if (
      text.toLowerCase().includes("signin") ||
      text.toLowerCase().includes("login")
    ) {
      throw new Error(
        "Apps Script requires login. Make sure it is deployed with access set to 'Anyone' (not 'Anyone with Google Account').",
      );
    }
    throw new Error(
      `Apps Script returned a non-JSON response. Make sure the script is deployed and accessible. Response preview: ${preview}`,
    );
  }
}

export async function fetchMembers() {
  const params = new URLSearchParams({ action: "getMembers" });
  const data = await fetchJson(params);
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    (data as RowObj).error
  ) {
    throw new Error((data as RowObj).error);
  }
  const rows: RowObj[] = Array.isArray(data) ? (data as RowObj[]) : [];
  return rows.map(normalizeMember);
}

export async function fetchAttendance() {
  const params = new URLSearchParams({ action: "getAttendance" });
  const data = await fetchJson(params);
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    (data as RowObj).error
  ) {
    throw new Error((data as RowObj).error);
  }
  const rows: RowObj[] = Array.isArray(data) ? (data as RowObj[]) : [];
  return rows.map(normalizeAttendance);
}

export async function fetchMemberById(membershipId: string) {
  const qTrimmed = membershipId.trim();
  const qLower = qTrimmed.toLowerCase();
  // Numeric form for comparison (handles "11" vs "11.0" edge cases)
  const qNum = Number.parseInt(qTrimmed, 10);
  const qNumStr = Number.isNaN(qNum) ? null : String(qNum);

  function idMatches(id: string): boolean {
    const normalized = id.trim().toLowerCase();
    if (normalized === qLower) return true;
    // Also compare as numbers (e.g. "11" matches "11.0" or " 11")
    if (qNumStr !== null) {
      const idNum = Number.parseInt(id.trim(), 10);
      if (!Number.isNaN(idNum) && String(idNum) === qNumStr) return true;
    }
    return false;
  }

  // Primary: try getMemberById action
  try {
    const params = new URLSearchParams({
      action: "getMemberById",
      membershipId: qTrimmed,
    });
    const data = await fetchJson(params);
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const obj = data as RowObj;
      if (!obj.error) {
        const normalized = normalizeMember(obj);
        if (
          idMatches(normalized["Membership ID"]) ||
          normalized["Client Name"]
        ) {
          return normalized;
        }
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.toLowerCase().includes("network") ||
      msg.toLowerCase().includes("cannot reach")
    ) {
      throw err;
    }
  }

  // Fallback: fetch all members and do flexible exact-match search.
  // This handles cases where Apps Script column header has extra spaces,
  // different casing, or is named "Client ID" instead of "Membership ID".
  const allMembers = await fetchMembers();
  const found = allMembers.find((m) => idMatches(m["Membership ID"]));
  return found ?? null;
}

export async function postCheckIn(
  membershipId: string,
  clientName: string,
  status: string,
): Promise<void> {
  const params = new URLSearchParams({
    action: "checkIn",
    membershipId,
    clientName,
    status,
  });
  const data = await fetchJson(params);
  if (data && typeof data === "object" && (data as RowObj).error) {
    throw new Error((data as RowObj).error);
  }
}

export async function postCheckOut(membershipId: string): Promise<void> {
  const params = new URLSearchParams({ action: "checkOut", membershipId });
  const data = await fetchJson(params);
  if (data && typeof data === "object" && (data as RowObj).error) {
    throw new Error((data as RowObj).error);
  }
}

export async function addMember(memberData: {
  clientName: string;
  contactNo: string;
  packageDetails: string;
  packageValidity: string;
  status: string;
  createdOn: string;
  membershipId: string;
}): Promise<void> {
  const params = new URLSearchParams({ action: "addMember", ...memberData });
  const data = await fetchJson(params);
  if (data && typeof data === "object" && (data as RowObj).error) {
    throw new Error((data as RowObj).error);
  }
}
