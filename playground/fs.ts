import { useSyncExternalStore } from 'react';

// Demo için bellek içi, küçük bir sahte dosya sistemi (Dosyalar, Terminal ve Metin Düzenleyici paylaşır).

export interface FsNode {
  name: string;
  type: 'dir' | 'file';
  children?: FsNode[];
  content?: string;
  modified: number;
}

export const HOME = '/home/kullanici';

const now = Date.now();
const file = (name: string, content = ''): FsNode => ({ name, type: 'file', content, modified: now - Math.round(Math.random() * 9e8) });
const dir = (name: string, children: FsNode[] = []): FsNode => ({ name, type: 'dir', children, modified: now - Math.round(Math.random() * 9e8) });

const root: FsNode = dir('', [
  dir('home', [
    dir('kullanici', [
      dir('Belgeler', [
        file(
          'yol-haritasi.md',
          `# deskui yol haritası

- [x] Pencere yöneticisi (taşı, boyutlandır, kenara yasla)
- [x] Masaüstü simgeleri, çoklu seçim, sürükle-bırak
- [x] Panel, uygulama menüsü, saat + takvim
- [x] Çalışma alanları
- [x] Duvar kağıdı, tema, vurgu rengi
- [ ] Dock (sabitlenmiş uygulamalar)
- [ ] Pencere oturumunu geri yükleme
- [ ] Storybook + görsel regresyon testleri
`,
        ),
        file('toplanti-notlari.txt', 'Pazartesi 10:00 — sprint planlama\n- Panel otomatik gizleme\n- Mobil yerleşim\n'),
        dir('Faturalar', [file('2026-09.txt', 'Eylül faturaları burada listelenecek.\n')]),
      ]),
      dir('Resimler', [file('tatil.jpg'), file('ekran-goruntusu.png'), file('logo.svg')]),
      dir('İndirilenler', [file('kurulum.sh', '#!/bin/sh\necho "deskui kuruluyor..."\nnpm install deskui\n')]),
      dir('Müzik'),
      file('beni-oku.txt', `Merhaba!

Bu dosya deskui demo'sundaki sahte dosya sisteminden geliyor.
Düzenleyip Ctrl+S ile kaydedebilirsiniz; değişiklikler sayfa açık kaldıkça durur.

İpucu: Terminal'de "help" yazın.
`),
    ]),
  ]),
]);

let version = 0;
const listeners = new Set<() => void>();
const emit = () => {
  version += 1;
  listeners.forEach((l) => l());
};

export function useFsVersion() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
  );
}

export function normalize(path: string, cwd = HOME): string {
  const abs = path.startsWith('/') ? path : path.startsWith('~') ? HOME + path.slice(1) : `${cwd}/${path}`;
  const parts: string[] = [];
  for (const p of abs.split('/')) {
    if (!p || p === '.') continue;
    if (p === '..') parts.pop();
    else parts.push(p);
  }
  return `/${parts.join('/')}`;
}

export function stat(path: string): FsNode | null {
  let node: FsNode | undefined = root;
  for (const part of normalize(path).split('/').filter(Boolean)) {
    node = node?.children?.find((c) => c.name === part);
    if (!node) return null;
  }
  return node ?? null;
}

export function list(path: string): FsNode[] {
  const node = stat(path);
  if (!node || node.type !== 'dir') return [];
  return [...(node.children ?? [])].sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name, 'tr') : a.type === 'dir' ? -1 : 1));
}

export function readFile(path: string): string | null {
  const node = stat(path);
  return node?.type === 'file' ? node.content ?? '' : null;
}

export function writeFile(path: string, content: string): void {
  const full = normalize(path);
  const parent = stat(full.slice(0, full.lastIndexOf('/')) || '/');
  if (!parent || parent.type !== 'dir') throw new Error('Klasör bulunamadı');
  const name = full.slice(full.lastIndexOf('/') + 1);
  const existing = parent.children?.find((c) => c.name === name);
  if (existing) {
    existing.content = content;
    existing.modified = Date.now();
  } else {
    parent.children = [...(parent.children ?? []), { ...file(name, content), modified: Date.now() }];
  }
  emit();
}

export const basename = (path: string) => path.slice(path.lastIndexOf('/') + 1) || '/';
export const isText = (name: string) => /\.(txt|md|sh|json|csv|log)$/i.test(name);
export const displayPath = (path: string) => (path.startsWith(HOME) ? `~${path.slice(HOME.length)}` : path);
