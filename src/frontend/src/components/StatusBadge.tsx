import { getStatusClass, getStatusDotColor } from "../utils/helpers";

export function StatusBadge({ status }: { status: string }) {
  const cls = getStatusClass(status);
  const dot = getStatusDotColor(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse-glow`} />
      {status}
    </span>
  );
}
