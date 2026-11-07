// Line icons used across the planner (24×24 grid, drawn with the current text color).
export const ICONS = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
  planner: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  heart: '<path d="M12 20s-7-4.4-8.6-8.6C2.2 8.2 4.3 5 7.4 5c2 0 3.4 1.1 4.6 2.7C13.2 6.1 14.6 5 16.6 5c3.1 0 5.2 3.2 4 6.4C19 15.6 12 20 12 20z"/>',
  journal: '<path d="M6 3h11a2 2 0 0 1 2 2v16H7a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1z"/><path d="M9 8h6M9 12h6"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M14.6 9.3c-.5-.9-1.5-1.4-2.6-1.4-1.5 0-2.6.8-2.6 2s1 1.7 2.6 2 2.6.8 2.6 2-1.1 2.1-2.6 2.1c-1.1 0-2.1-.5-2.6-1.4M12 6v1.9M12 16.1V18"/>',
  gem: '<path d="M7 4h10l4 5-9 11L3 9z"/><path d="M3 9h18M10 4l-2 5 4 11 4-11-2-5"/>',
  home: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M10 21v-6h4v6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  star: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
  drop: '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  cherry: '<circle cx="7.5" cy="16.5" r="3.5"/><circle cx="16.5" cy="17" r="3.5"/><path d="M7.5 13C9 9 11 6 14 4M16.5 13.5C16 9 15 6 14 4M14 4c2-1 4.5-.5 6 1-2 1.5-4.5 1-6-1z"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  sparkle: '<path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7z"/>',
} as const;

export type IconName = keyof typeof ICONS;

export const HEART_PATH =
  "M12 20s-7-4.4-8.6-8.6C2.2 8.2 4.3 5 7.4 5c2 0 3.4 1.1 4.6 2.7C13.2 6.1 14.6 5 16.6 5c3.1 0 5.2 3.2 4 6.4C19 15.6 12 20 12 20z";
