// Demo uygulama simgeleri (düz, renkli SVG — Papirus/Adwaita esintili).

const Svg = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    {children}
  </svg>
);

export const FilesIcon = (
  <Svg>
    <path d="M5 12a4 4 0 014-4h10l4 4h16a4 4 0 014 4v2H5z" fill="#2f6fc9" />
    <rect x="5" y="15" width="38" height="26" rx="4" fill="#4a90e2" />
    <rect x="5" y="15" width="38" height="4" fill="#fff" opacity=".18" />
  </Svg>
);

export const TerminalIcon = (
  <Svg>
    <rect x="4" y="7" width="40" height="34" rx="6" fill="#2b2f36" />
    <rect x="4" y="7" width="40" height="7" rx="3" fill="#3b414b" />
    <path d="M12 22l6 5-6 5" fill="none" stroke="#7ee787" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 33h12" stroke="#e6edf3" strokeWidth="3" strokeLinecap="round" />
  </Svg>
);

export const EditorIcon = (
  <Svg>
    <path d="M11 5h19l9 9v27a3 3 0 01-3 3H11a3 3 0 01-3-3V8a3 3 0 013-3z" fill="#f4f5f7" />
    <path d="M30 5v7a2 2 0 002 2h7z" fill="#c9ced6" />
    <path d="M14 20h18M14 25h18M14 30h12" stroke="#8d96a5" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M27 38l12-12 4 4-12 12h-4z" fill="#f6a623" />
    <path d="M39 26l2-2a1.4 1.4 0 012 0l2 2a1.4 1.4 0 010 2l-2 2z" fill="#e0533d" />
  </Svg>
);

export const CalculatorIcon = (
  <Svg>
    <rect x="8" y="4" width="32" height="40" rx="6" fill="#5d6778" />
    <rect x="12" y="8" width="24" height="9" rx="2" fill="#c9f0d6" />
    {[0, 1, 2].map((r) =>
      [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={12 + c * 8.5} y={21 + r * 7.5} width="6.5" height="5.5" rx="1.5" fill={c === 2 ? '#f5a524' : '#e8ebf0'} />),
    )}
  </Svg>
);

export const MonitorIcon = (
  <Svg>
    <rect x="4" y="7" width="40" height="30" rx="5" fill="#1f2937" />
    <path d="M9 28l6-6 5 4 7-10 6 8 6-5" fill="none" stroke="#34d399" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="18" y="38" width="12" height="3" rx="1" fill="#64748b" />
    <rect x="13" y="40.5" width="22" height="3" rx="1.5" fill="#94a3b8" />
  </Svg>
);

export const WelcomeIcon = (
  <Svg>
    <defs>
      <linearGradient id="demo-welcome" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#7c5cff" />
        <stop offset="1" stopColor="#26c6da" />
      </linearGradient>
    </defs>
    <rect x="4" y="4" width="40" height="40" rx="11" fill="url(#demo-welcome)" />
    <rect x="12" y="14" width="24" height="20" rx="3" fill="#fff" opacity=".95" />
    <rect x="12" y="14" width="24" height="5" rx="2" fill="#fff" />
    <circle cx="15.5" cy="16.5" r="1" fill="#ff5f57" />
    <circle cx="18.5" cy="16.5" r="1" fill="#febc2e" />
    <circle cx="21.5" cy="16.5" r="1" fill="#28c840" />
    <path d="M16 25h10M16 29h16" stroke="#7c5cff" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const FolderSmall = (
  <Svg>
    <path d="M4 12a4 4 0 014-4h11l4 4h17a4 4 0 014 4v2H4z" fill="#d49b2a" />
    <rect x="4" y="15" width="40" height="26" rx="4" fill="#f2b84b" />
  </Svg>
);

export const DocumentsFolderIcon = (
  <Svg>
    <path d="M4 12a4 4 0 014-4h11l4 4h17a4 4 0 014 4v2H4z" fill="#d49b2a" />
    <rect x="4" y="15" width="40" height="26" rx="4" fill="#f2b84b" />
    <path d="M18 23h12M18 28h12M18 33h8" stroke="#9a6b12" strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

export const TextFileIcon = (
  <Svg>
    <path d="M12 5h17l9 9v27a3 3 0 01-3 3H12a3 3 0 01-3-3V8a3 3 0 013-3z" fill="#eef0f3" />
    <path d="M29 5v7a2 2 0 002 2h7z" fill="#c9ced6" />
    <path d="M15 21h16M15 26h16M15 31h10" stroke="#8d96a5" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const ImageFileIcon = (
  <Svg>
    <path d="M12 5h17l9 9v27a3 3 0 01-3 3H12a3 3 0 01-3-3V8a3 3 0 013-3z" fill="#eef0f3" />
    <path d="M29 5v7a2 2 0 002 2h7z" fill="#c9ced6" />
    <rect x="14" y="20" width="20" height="16" rx="2" fill="#7fb3f5" />
    <path d="M14 33l6-6 4 4 3-3 7 7H14z" fill="#3a7bd5" />
    <circle cx="28" cy="24.5" r="2" fill="#fff" />
  </Svg>
);

export const ScriptFileIcon = (
  <Svg>
    <path d="M12 5h17l9 9v27a3 3 0 01-3 3H12a3 3 0 01-3-3V8a3 3 0 013-3z" fill="#2b2f36" />
    <path d="M29 5v7a2 2 0 002 2h7z" fill="#4b525e" />
    <path d="M16 24l4 3.5-4 3.5" fill="none" stroke="#7ee787" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M23 32h8" stroke="#e6edf3" strokeWidth="2.4" strokeLinecap="round" />
  </Svg>
);
