/** Strings used by the component library (buttons, tables, login screen…). */
export interface UiLabels {
  close: string;
  cancel: string;
  confirm: string;
  remove: string;
  username: string;
  password: string;
  showPassword: string;
  hidePassword: string;
  signIn: string;
  signingIn: string;
  unlock: string;
  rememberMe: string;
  loginFailed: string;
  otherUser: string;
  profile: string;
  settings: string;
  lock: string;
  logout: string;
  noRows: string;
  rowsPerPage: string;
  range: (from: number, to: number, total: number) => string;
  pageOf: (page: number, pages: number) => string;
  firstPage: string;
  previousPage: string;
  nextPage: string;
  lastPage: string;
  selectAll: string;
  selectRow: string;
  loading: string;
  retry: string;
  noResults: string;
  typeToSearch: (min: number) => string;
  moreResults: (count: number) => string;
  loadFailed: string;
  showOptions: string;
  chooseDate: string;
  chooseDateRange: string;
  clear: string;
  today: string;
  previousMonth: string;
  nextMonth: string;
  previousYear: string;
  nextYear: string;
  previousYears: string;
  nextYears: string;
  chooseMonth: string;
  chooseYear: string;
  startDate: string;
  endDate: string;
  /** Placeholder letters for typed dates, e.g. `gg.aa.yyyy`. */
  dateParts: { day: string; month: string; year: string };
  presets: { today: string; yesterday: string; last7Days: string; last30Days: string; thisMonth: string; lastMonth: string; thisYear: string; lastYear: string };
}

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
  back: string;
  emptyFolder: string;
  today: string;
  previousMonth: string;
  nextMonth: string;
  ui: UiLabels;
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
  back: 'Back',
  emptyFolder: 'This folder is empty',
  today: 'Today',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  ui: {
    close: 'Close',
    cancel: 'Cancel',
    confirm: 'OK',
    remove: 'Remove',
    username: 'Username',
    password: 'Password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    signIn: 'Sign in',
    signingIn: 'Signing in…',
    unlock: 'Unlock',
    rememberMe: 'Remember me',
    loginFailed: 'Sign-in failed. Check your username and password.',
    otherUser: 'Other user',
    profile: 'Profile',
    settings: 'Settings',
    lock: 'Lock screen',
    logout: 'Log out',
    noRows: 'No records',
    rowsPerPage: 'Rows per page',
    range: (a, b, t) => `${a}–${b} of ${t}`,
    pageOf: (p, n) => `Page ${p} of ${n}`,
    firstPage: 'First page',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    lastPage: 'Last page',
    selectAll: 'Select all',
    selectRow: 'Select row',
    loading: 'Loading…',
    retry: 'Try again',
    noResults: 'No results',
    typeToSearch: (n) => `Type at least ${n} characters to search`,
    moreResults: (n) => `${n} more — refine your search`,
    loadFailed: 'Could not load results',
    showOptions: 'Show options',
    chooseDate: 'Choose date',
    chooseDateRange: 'Choose date range',
    clear: 'Clear',
    today: 'Today',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    previousYear: 'Previous year',
    nextYear: 'Next year',
    previousYears: 'Earlier years',
    nextYears: 'Later years',
    chooseMonth: 'Choose month',
    chooseYear: 'Choose year',
    startDate: 'Start date',
    endDate: 'End date',
    dateParts: { day: 'dd', month: 'mm', year: 'yyyy' },
    presets: { today: 'Today', yesterday: 'Yesterday', last7Days: 'Last 7 days', last30Days: 'Last 30 days', thisMonth: 'This month', lastMonth: 'Last month', thisYear: 'This year', lastYear: 'Last year' },
  },
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
  back: 'Geri',
  emptyFolder: 'Bu klasör boş',
  today: 'Bugün',
  previousMonth: 'Önceki ay',
  nextMonth: 'Sonraki ay',
  ui: {
    close: 'Kapat',
    cancel: 'Vazgeç',
    confirm: 'Tamam',
    remove: 'Kaldır',
    username: 'Kullanıcı adı',
    password: 'Şifre',
    showPassword: 'Şifreyi göster',
    hidePassword: 'Şifreyi gizle',
    signIn: 'Giriş yap',
    signingIn: 'Giriş yapılıyor…',
    unlock: 'Kilidi aç',
    rememberMe: 'Beni hatırla',
    loginFailed: 'Giriş yapılamadı. Kullanıcı adını ve şifreyi kontrol edin.',
    otherUser: 'Başka kullanıcı',
    profile: 'Profil',
    settings: 'Ayarlar',
    lock: 'Ekranı kilitle',
    logout: 'Çıkış yap',
    noRows: 'Kayıt yok',
    rowsPerPage: 'Sayfa başına',
    range: (a, b, t) => `${t} kayıttan ${a}–${b}`,
    pageOf: (p, n) => `Sayfa ${p} / ${n}`,
    firstPage: 'İlk sayfa',
    previousPage: 'Önceki sayfa',
    nextPage: 'Sonraki sayfa',
    lastPage: 'Son sayfa',
    selectAll: 'Tümünü seç',
    selectRow: 'Satırı seç',
    loading: 'Yükleniyor…',
    retry: 'Tekrar dene',
    noResults: 'Sonuç bulunamadı',
    typeToSearch: (n) => `Aramak için en az ${n} karakter yazın`,
    moreResults: (n) => `${n} sonuç daha — aramayı daraltın`,
    loadFailed: 'Sonuçlar yüklenemedi',
    showOptions: 'Seçenekleri göster',
    chooseDate: 'Tarih seç',
    chooseDateRange: 'Tarih aralığı seç',
    clear: 'Temizle',
    today: 'Bugün',
    previousMonth: 'Önceki ay',
    nextMonth: 'Sonraki ay',
    previousYear: 'Önceki yıl',
    nextYear: 'Sonraki yıl',
    previousYears: 'Önceki yıllar',
    nextYears: 'Sonraki yıllar',
    chooseMonth: 'Ay seç',
    chooseYear: 'Yıl seç',
    startDate: 'Başlangıç tarihi',
    endDate: 'Bitiş tarihi',
    dateParts: { day: 'gg', month: 'aa', year: 'yyyy' },
    presets: { today: 'Bugün', yesterday: 'Dün', last7Days: 'Son 7 gün', last30Days: 'Son 30 gün', thisMonth: 'Bu ay', lastMonth: 'Geçen ay', thisYear: 'Bu yıl', lastYear: 'Geçen yıl' },
  },
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
  back: 'Zurück',
  emptyFolder: 'Dieser Ordner ist leer',
  today: 'Heute',
  previousMonth: 'Vorheriger Monat',
  nextMonth: 'Nächster Monat',
  ui: {
    close: 'Schließen',
    cancel: 'Abbrechen',
    confirm: 'OK',
    remove: 'Entfernen',
    username: 'Benutzername',
    password: 'Passwort',
    showPassword: 'Passwort anzeigen',
    hidePassword: 'Passwort verbergen',
    signIn: 'Anmelden',
    signingIn: 'Anmeldung läuft…',
    unlock: 'Entsperren',
    rememberMe: 'Angemeldet bleiben',
    loginFailed: 'Anmeldung fehlgeschlagen. Benutzername und Passwort prüfen.',
    otherUser: 'Anderer Benutzer',
    profile: 'Profil',
    settings: 'Einstellungen',
    lock: 'Bildschirm sperren',
    logout: 'Abmelden',
    noRows: 'Keine Einträge',
    rowsPerPage: 'Zeilen pro Seite',
    range: (a, b, t) => `${a}–${b} von ${t}`,
    pageOf: (p, n) => `Seite ${p} von ${n}`,
    firstPage: 'Erste Seite',
    previousPage: 'Vorherige Seite',
    nextPage: 'Nächste Seite',
    lastPage: 'Letzte Seite',
    selectAll: 'Alle auswählen',
    selectRow: 'Zeile auswählen',
    loading: 'Wird geladen…',
    retry: 'Erneut versuchen',
    noResults: 'Keine Treffer',
    typeToSearch: (n) => `Mindestens ${n} Zeichen eingeben`,
    moreResults: (n) => `${n} weitere — Suche eingrenzen`,
    loadFailed: 'Ergebnisse konnten nicht geladen werden',
    showOptions: 'Optionen anzeigen',
    chooseDate: 'Datum wählen',
    chooseDateRange: 'Zeitraum wählen',
    clear: 'Leeren',
    today: 'Heute',
    previousMonth: 'Vorheriger Monat',
    nextMonth: 'Nächster Monat',
    previousYear: 'Vorheriges Jahr',
    nextYear: 'Nächstes Jahr',
    previousYears: 'Frühere Jahre',
    nextYears: 'Spätere Jahre',
    chooseMonth: 'Monat wählen',
    chooseYear: 'Jahr wählen',
    startDate: 'Startdatum',
    endDate: 'Enddatum',
    dateParts: { day: 'TT', month: 'MM', year: 'JJJJ' },
    presets: { today: 'Heute', yesterday: 'Gestern', last7Days: 'Letzte 7 Tage', last30Days: 'Letzte 30 Tage', thisMonth: 'Dieser Monat', lastMonth: 'Letzter Monat', thisYear: 'Dieses Jahr', lastYear: 'Letztes Jahr' },
  },
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

export type LabelOverrides = Partial<Omit<DesktopLabels, 'settings' | 'iconSizes' | 'ui'>> & {
  settings?: Partial<DesktopLabels['settings']>;
  iconSizes?: Partial<DesktopLabels['iconSizes']>;
  ui?: Partial<UiLabels>;
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
    ui: { ...base.ui, ...overrides.ui },
    settings: { ...base.settings, ...overrides.settings },
  } as DesktopLabels;
}
