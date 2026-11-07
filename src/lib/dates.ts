export const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
export const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

/** "2026-11-07" in the viewer's own time zone. */
export function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

/** Minutes after midnight → "9:30 am". */
export function formatMinutes(m: number) {
  const h = Math.floor(m / 60);
  const h12 = h % 12 || 12;
  return `${h12}:${String(m % 60).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}
