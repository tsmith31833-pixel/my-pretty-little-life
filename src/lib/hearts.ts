import { HEART_PATH } from "./icons";

const COLORS = ["var(--hot)", "var(--rose)", "var(--gold)", "var(--baby)"];

/** Little burst of hearts from an element, for celebrating a tick or a win. */
export function heartBurst(el: Element | null) {
  if (!el || typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  for (let i = 0; i < 9; i++) {
    const h = document.createElement("span");
    h.className = "hb";
    const a = ((Math.PI * 2) / 9) * i + Math.random() * 0.5;
    const d = 34 + Math.random() * 26;
    h.style.left = `${x}px`;
    h.style.top = `${y}px`;
    h.style.setProperty("--x", `${Math.cos(a) * d}px`);
    h.style.setProperty("--y", `${Math.sin(a) * d - 10}px`);
    h.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="${COLORS[i % 4]}" d="${HEART_PATH}"/></svg>`;
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 950);
  }
}
