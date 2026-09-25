export interface DesktopLabels {
  minimize: string;
  maximize: string;
  restore: string;
  close: string;
  applications: string;
  allApplications: string;
  searchApplications: string;
  noResults: string;
  showDesktop: string;
  workspace: (n: number) => string;
  moveToWorkspace: string;
  tileLeft: string;
  tileRight: string;
  open: string;
  changeWallpaper: string;
  arrangeIcons: string;
  iconSize: string;
  iconSizes: { small: string; medium: string; large: string };
  lightTheme: string;
  darkTheme: string;
  appCrashed: string;
  reload: string;
  dismiss: string;
  loading: string;
  today: string;
  previousMonth: string;
  nextMonth: string;
  settings: {
    title: string;
    background: string;
    appearance: string;
    panel: string;
    workspaces: string;
    wallpapers: string;
    fit: string;
    fits: { cover: string; contain: string; fill: string; center: string; tile: string };
    solidColor: string;
    imageUrl: string;
    apply: string;
    uploadImage: string;
    colorScheme: string;
    schemes: { light: string; dark: string; auto: string };
    accentColor: string;
    customColor: string;
    windowButtons: string;
    buttonSide: { left: string; right: string };
    buttonStyle: { icons: string; dots: string };
    iconSize: string;
    panelPosition: string;
    positions: { top: string; bottom: string; left: string; right: string };
    workspaceCount: string;
  };
}

const en: DesktopLabels = {
  minimize: 'Minimize',
  maximize: 'Maximize',
  restore: 'Restore',
  close: 'Close',
  applications: 'Applications',
  allApplications: 'All',
  searchApplications: 'Search applications…',
  noResults: 'No results',
  showDesktop: 'Show desktop',
  workspace: (n) => `Workspace ${n}`,
  moveToWorkspace: 'Move to workspace',
  tileLeft: 'Tile left',
  tileRight: 'Tile right',
  open: 'Open',
  changeWallpaper: 'Change wallpaper…',
  arrangeIcons: 'Arrange icons',
  iconSize: 'Icon size',
  iconSizes: { small: 'Small', medium: 'Medium', large: 'Large' },
  lightTheme: 'Light theme',
  darkTheme: 'Dark theme',
  appCrashed: 'This application stopped unexpectedly.',
  reload: 'Reload',
  dismiss: 'Dismiss',
  loading: 'Loading…',
  today: 'Today',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  settings: {
    title: 'Settings',
    background: 'Background',
    appearance: 'Appearance',
    panel: 'Panel',
    workspaces: 'Workspaces',
    wallpapers: 'Wallpapers',
    fit: 'Fit',
    fits: { cover: 'Fill screen', contain: 'Fit', fill: 'Stretch', center: 'Center', tile: 'Tile' },
    solidColor: 'Solid color',
    imageUrl: 'Image URL',
    apply: 'Apply',
    uploadImage: 'Choose image…',
    colorScheme: 'Style',
    schemes: { light: 'Light', dark: 'Dark', auto: 'Automatic' },
    accentColor: 'Accent color',
    customColor: 'Custom',
    windowButtons: 'Window buttons',
    buttonSide: { left: 'Left', right: 'Right' },
    buttonStyle: { icons: 'Icons', dots: 'Dots' },
    iconSize: 'Desktop icon size',
    panelPosition: 'Panel position',
    positions: { top: 'Top', bottom: 'Bottom', left: 'Left', right: 'Right' },
    workspaceCount: 'Number of workspaces',
  },
};

const tr: DesktopLabels = {
  minimize: 'Simge durumuna küçült',
  maximize: 'Ekranı kapla',
  restore: 'Önceki boyut',
  close: 'Kapat',
  applications: 'Uygulamalar',
  allApplications: 'Tümü',
  searchApplications: 'Uygulama ara…',
  noResults: 'Sonuç yok',
  showDesktop: 'Masaüstünü göster',
  workspace: (n) => `Çalışma alanı ${n}`,
  moveToWorkspace: 'Çalışma alanına taşı',
  tileLeft: 'Sola yasla',
  tileRight: 'Sağa yasla',
  open: 'Aç',
  changeWallpaper: 'Duvar kağıdını değiştir…',
  arrangeIcons: 'Simgeleri düzenle',
  iconSize: 'Simge boyutu',
  iconSizes: { small: 'Küçük', medium: 'Orta', large: 'Büyük' },
  lightTheme: 'Açık tema',
  darkTheme: 'Koyu tema',
  appCrashed: 'Bu uygulama beklenmedik şekilde durdu.',
  reload: 'Yeniden yükle',
  dismiss: 'Kapat',
  loading: 'Yükleniyor…',
  today: 'Bugün',
  previousMonth: 'Önceki ay',
  nextMonth: 'Sonraki ay',
  settings: {
    title: 'Ayarlar',
    background: 'Arka plan',
    appearance: 'Görünüm',
    panel: 'Panel',
    workspaces: 'Çalışma alanları',
    wallpapers: 'Duvar kağıtları',
    fit: 'Yerleşim',
    fits: { cover: 'Ekranı doldur', contain: 'Sığdır', fill: 'Uzat', center: 'Ortala', tile: 'Döşe' },
    solidColor: 'Düz renk',
    imageUrl: 'Görsel adresi',
    apply: 'Uygula',
    uploadImage: 'Görsel seç…',
    colorScheme: 'Stil',
    schemes: { light: 'Açık', dark: 'Koyu', auto: 'Otomatik' },
    accentColor: 'Vurgu rengi',
    customColor: 'Özel',
    windowButtons: 'Pencere düğmeleri',
    buttonSide: { left: 'Solda', right: 'Sağda' },
    buttonStyle: { icons: 'Simge', dots: 'Nokta' },
    iconSize: 'Masaüstü simge boyutu',
    panelPosition: 'Panel konumu',
    positions: { top: 'Üst', bottom: 'Alt', left: 'Sol', right: 'Sağ' },
    workspaceCount: 'Çalışma alanı sayısı',
  },
};

const de: DesktopLabels = {
  minimize: 'Minimieren',
  maximize: 'Maximieren',
  restore: 'Wiederherstellen',
  close: 'Schließen',
  applications: 'Anwendungen',
  allApplications: 'Alle',
  searchApplications: 'Anwendungen suchen…',
  noResults: 'Keine Ergebnisse',
  showDesktop: 'Schreibtisch anzeigen',
  workspace: (n) => `Arbeitsfläche ${n}`,
  moveToWorkspace: 'Auf Arbeitsfläche verschieben',
  tileLeft: 'Links anordnen',
  tileRight: 'Rechts anordnen',
  open: 'Öffnen',
  changeWallpaper: 'Hintergrund ändern…',
  arrangeIcons: 'Symbole anordnen',
  iconSize: 'Symbolgröße',
  iconSizes: { small: 'Klein', medium: 'Mittel', large: 'Groß' },
  lightTheme: 'Helles Design',
  darkTheme: 'Dunkles Design',
  appCrashed: 'Diese Anwendung wurde unerwartet beendet.',
  reload: 'Neu laden',
  dismiss: 'Schließen',
  loading: 'Wird geladen…',
  today: 'Heute',
  previousMonth: 'Vorheriger Monat',
  nextMonth: 'Nächster Monat',
  settings: {
    title: 'Einstellungen',
    background: 'Hintergrund',
    appearance: 'Darstellung',
    panel: 'Leiste',
    workspaces: 'Arbeitsflächen',
    wallpapers: 'Hintergrundbilder',
    fit: 'Anpassung',
    fits: { cover: 'Füllen', contain: 'Einpassen', fill: 'Strecken', center: 'Zentrieren', tile: 'Kacheln' },
    solidColor: 'Einfarbig',
    imageUrl: 'Bild-URL',
    apply: 'Übernehmen',
    uploadImage: 'Bild wählen…',
    colorScheme: 'Stil',
    schemes: { light: 'Hell', dark: 'Dunkel', auto: 'Automatisch' },
    accentColor: 'Akzentfarbe',
    customColor: 'Eigene',
    windowButtons: 'Fensterknöpfe',
    buttonSide: { left: 'Links', right: 'Rechts' },
    buttonStyle: { icons: 'Symbole', dots: 'Punkte' },
    iconSize: 'Symbolgröße',
    panelPosition: 'Position der Leiste',
    positions: { top: 'Oben', bottom: 'Unten', left: 'Links', right: 'Rechts' },
    workspaceCount: 'Anzahl der Arbeitsflächen',
  },
};

export const locales: Record<string, DesktopLabels> = { en, tr, de };

export type LabelOverrides = Partial<Omit<DesktopLabels, 'settings' | 'iconSizes'>> & {
  settings?: Partial<DesktopLabels['settings']>;
  iconSizes?: Partial<DesktopLabels['iconSizes']>;
};

export function detectLocale(): string {
  if (typeof navigator === 'undefined') return 'en';
  return navigator.language || 'en';
}

export function resolveLabels(locale: string, overrides?: LabelOverrides): DesktopLabels {
  const base = locales[locale] ?? locales[locale.split('-')[0]] ?? en;
  if (!overrides) return base;
  return {
    ...base,
    ...overrides,
    iconSizes: { ...base.iconSizes, ...overrides.iconSizes },
    settings: { ...base.settings, ...overrides.settings },
  } as DesktopLabels;
}
