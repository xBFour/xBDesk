import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

const base = (props: P) => ({
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
});

export const MinimizeIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 11.5h8" />
  </svg>
);
export const MaximizeIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="8" height="8" rx="1.2" />
  </svg>
);
export const RestoreIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5.5" width="7" height="7" rx="1.2" />
    <path d="M6 5.5V4.7c0-.66.54-1.2 1.2-1.2h4.1c.66 0 1.2.54 1.2 1.2v4.1c0 .66-.54 1.2-1.2 1.2h-.8" />
  </svg>
);
export const CloseIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
  </svg>
);
export const SearchIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="7" cy="7" r="4.25" />
    <path d="M10.2 10.2L13.5 13.5" />
  </svg>
);
export const AppsIcon = (p: P) => (
  <svg {...base({ ...p, stroke: 'none', fill: 'currentColor' })}>
    {[3, 8, 13].flatMap((y) => [3, 8, 13].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.45" />))}
  </svg>
);
export const ChevronRightIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 3.5L10.5 8 6 12.5" />
  </svg>
);
export const ChevronLeftIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M10 3.5L5.5 8 10 12.5" />
  </svg>
);
export const CheckIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);
export const DesktopIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="2" y="2.5" width="12" height="8.5" rx="1.3" />
    <path d="M5.5 13.5h5M8 11v2.5" />
  </svg>
);
export const SunIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="8" cy="8" r="2.75" />
    <path d="M8 1.5v1.3M8 13.2v1.3M1.5 8h1.3M13.2 8h1.3M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9" />
  </svg>
);
export const MoonIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M13 9.6A5.5 5.5 0 016.4 3a5.5 5.5 0 106.6 6.6z" />
  </svg>
);
export const ImageIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="2" y="2.5" width="12" height="11" rx="1.5" />
    <circle cx="5.75" cy="6.25" r="1.25" />
    <path d="M2.5 12l3.5-3.5 2.5 2.5 2-2 3 3" />
  </svg>
);
export const PaletteIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 2a6 6 0 100 12c.9 0 1.3-.6 1.1-1.3-.3-.9.2-1.7 1.2-1.7H12a2 2 0 002-2C14 4.7 11.3 2 8 2z" />
    <circle cx="5" cy="7" r=".6" fill="currentColor" />
    <circle cx="7.5" cy="4.8" r=".6" fill="currentColor" />
    <circle cx="10.5" cy="5.5" r=".6" fill="currentColor" />
  </svg>
);
export const PanelIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="2" y="2.5" width="12" height="11" rx="1.5" />
    <path d="M2 10.5h12" />
  </svg>
);
export const WorkspacesIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="2" y="3" width="5" height="4" rx=".8" />
    <rect x="9" y="3" width="5" height="4" rx=".8" />
    <rect x="2" y="9" width="5" height="4" rx=".8" />
    <rect x="9" y="9" width="5" height="4" rx=".8" />
  </svg>
);
export const GridIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.5" y="2.5" width="4" height="4" rx=".8" />
    <rect x="9.5" y="2.5" width="4" height="4" rx=".8" />
    <rect x="2.5" y="9.5" width="4" height="4" rx=".8" />
    <rect x="9.5" y="9.5" width="4" height="4" rx=".8" />
  </svg>
);
export const TileLeftIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="2" y="3" width="12" height="10" rx="1.3" />
    <path d="M8 3v10" />
    <path d="M2.8 3.8h4.4v8.4H2.8z" fill="currentColor" stroke="none" opacity=".35" />
  </svg>
);
export const TileRightIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="2" y="3" width="12" height="10" rx="1.3" />
    <path d="M8 3v10" />
    <path d="M8.8 3.8h4.4v8.4H8.8z" fill="currentColor" stroke="none" opacity=".35" />
  </svg>
);
export const AlertIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 2.2l6 10.6H2z" />
    <path d="M8 6.5v3M8 11.3v.2" />
  </svg>
);
export const WindowIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="2" y="2.5" width="12" height="11" rx="1.5" />
    <path d="M2 5.5h12" />
  </svg>
);
export const UploadIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 10.5V2.5M4.8 5.5L8 2.3l3.2 3.2M2.5 10.5v2a1 1 0 001 1h9a1 1 0 001-1v-2" />
  </svg>
);
