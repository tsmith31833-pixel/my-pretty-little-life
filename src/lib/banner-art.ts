import { HEART_PATH } from "./icons";

// Builds the banner illustration: a big pink bow with hanging cherries,
// small bows, hearts and gold sparkles. Colors come from the theme tokens.

function cherry(x: number, y: number, s: number, ang: number, delay = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${ang}) scale(${s})"><g class="swing" style="animation-delay:${delay}s">` +
    `<path d="M0 0 C -6 14,-13 28,-16 44 M0 0 C 6 16,12 30,15 50" fill="none" stroke="var(--leaf-deep)" stroke-width="2.4" stroke-linecap="round"/>` +
    `<path d="M0 0 C 8 -10,22 -12,30 -6 C 22 2,8 4,0 0Z" fill="var(--leaf)" stroke="var(--leaf-deep)" stroke-width="1"/><path d="M2 -1 L26 -6" stroke="var(--leaf-deep)" stroke-width=".9"/>` +
    `<circle cx="-16" cy="56" r="13" fill="url(#cg)" stroke="var(--rose-deep)" stroke-width="1.2"/><circle cx="15" cy="62" r="13" fill="url(#cg)" stroke="var(--rose-deep)" stroke-width="1.2"/>` +
    `<ellipse cx="-21" cy="51" rx="3" ry="5" transform="rotate(-25 -21 51)" fill="var(--card)" opacity=".75"/><ellipse cx="10" cy="57" rx="3" ry="5" transform="rotate(-25 10 57)" fill="var(--card)" opacity=".75"/></g></g>`;
}

function bow(x: number, y: number, s: number, ang: number, delay = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${ang}) scale(${s})"><g class="sway" style="animation-delay:${delay}s"><use href="#bow" x="-60" y="-40"/></g></g>`;
}

function heart(x: number, y: number, s: number, fill: string) {
  return `<path transform="translate(${x - s / 2} ${y - s / 2}) scale(${s / 24})" d="${HEART_PATH}" fill="${fill}"/>`;
}

function sparkle(x: number, y: number, s: number, delay: number) {
  return `<path class="spark" style="animation-delay:${delay}s" transform="translate(${x - s / 2} ${y - s / 2}) scale(${s / 24})" d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7z" fill="var(--gold)"/>`;
}

export const BANNER_ART =
  `<defs><radialGradient id="cg" cx=".35" cy=".3" r=".75"><stop offset="0" style="stop-color:var(--rose)"/><stop offset=".55" style="stop-color:var(--hot)"/><stop offset="1" style="stop-color:var(--rose-deep)"/></radialGradient></defs>` +
  cherry(190, 150, 1.0, -22, 0.6) + cherry(405, 150, 0.95, 18, 1.4) +
  bow(298, 102, 1.55, -4, 0) + cherry(298, 112, 1.3, 0, 0.3) +
  bow(130, 48, 0.36, -18, 1) + bow(410, 34, 0.32, 20, 2) + bow(150, 228, 0.3, 10, 1.6) + bow(250, 250, 0.26, -12, 0.8) +
  heart(120, 110, 16, "var(--hot)") + heart(205, 60, 10, "var(--rose)") + heart(425, 240, 13, "var(--rose)") + heart(345, 250, 11, "var(--hot)") +
  sparkle(165, 95, 14, 0) + sparkle(425, 110, 12, 1.1) + sparkle(210, 250, 10, 2) + sparkle(380, 215, 10, 0.6);
