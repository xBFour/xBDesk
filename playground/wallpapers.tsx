import type { WallpaperPreset } from 'deskui';

// Demo duvar kağıtları: harici görsel yok, hepsi kodla üretilen SVG/CSS.

const svg = (body: string, w = 1600, h = 900) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' preserveAspectRatio='xMidYMid slice'>${body}</svg>`,
  )}`;

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const aurora = svg(`
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#070b1f'/><stop offset='1' stop-color='#1a1442'/></linearGradient>
    <filter id='b' x='-50%' y='-50%' width='200%' height='200%'><feGaussianBlur stdDeviation='110'/></filter>
  </defs>
  <rect width='1600' height='900' fill='url(#bg)'/>
  <g filter='url(#b)' opacity='.9'>
    <ellipse cx='320' cy='260' rx='300' ry='200' fill='#14b8a6'/>
    <ellipse cx='880' cy='180' rx='340' ry='190' fill='#6366f1'/>
    <ellipse cx='1340' cy='560' rx='300' ry='240' fill='#db2777'/>
    <ellipse cx='620' cy='760' rx='280' ry='180' fill='#2563eb'/>
  </g>`);

const mountains = svg(`
  <defs>
    <linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#2b1a55'/><stop offset='.55' stop-color='#b9467d'/><stop offset='1' stop-color='#ffb36b'/>
    </linearGradient>
  </defs>
  <rect width='1600' height='900' fill='url(#sky)'/>
  <circle cx='1080' cy='520' r='120' fill='#ffd79a' opacity='.9'/>
  <path d='M0 560 L180 430 L330 520 L520 360 L700 500 L860 400 L1040 540 L1240 380 L1420 500 L1600 420 V900 H0Z' fill='#7a3a78'/>
  <path d='M0 640 L160 560 L360 650 L560 520 L760 640 L980 540 L1180 660 L1380 560 L1600 640 V900 H0Z' fill='#56286a'/>
  <path d='M0 740 L220 650 L420 730 L640 640 L860 750 L1080 660 L1300 760 L1600 680 V900 H0Z' fill='#3a1b52'/>
  <path d='M0 830 L260 760 L520 820 L800 750 L1060 830 L1340 770 L1600 820 V900 H0Z' fill='#22113a'/>`);

const waves = svg(`
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#0f3d91'/><stop offset='1' stop-color='#1ea0e0'/></linearGradient>
  </defs>
  <rect width='1600' height='900' fill='url(#bg)'/>
  <path d='M0 520 C 300 420 520 640 820 540 S 1320 380 1600 480 V900 H0Z' fill='#ffffff' opacity='.08'/>
  <path d='M0 600 C 260 520 560 720 860 620 S 1340 500 1600 580 V900 H0Z' fill='#ffffff' opacity='.1'/>
  <path d='M0 690 C 320 600 600 800 920 700 S 1380 600 1600 680 V900 H0Z' fill='#ffffff' opacity='.12'/>
  <path d='M0 780 C 300 720 640 860 960 790 S 1420 720 1600 770 V900 H0Z' fill='#ffffff' opacity='.14'/>`);

const dunes = svg(`
  <defs>
    <linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f6d8a8'/><stop offset='1' stop-color='#f0a868'/></linearGradient>
  </defs>
  <rect width='1600' height='900' fill='url(#sky)'/>
  <path d='M0 520 C 280 440 520 470 760 540 C 1000 610 1300 500 1600 470 V900 H0Z' fill='#e2925a'/>
  <path d='M0 640 C 340 560 620 600 880 660 C 1140 720 1380 620 1600 600 V900 H0Z' fill='#c8743f'/>
  <path d='M0 760 C 300 690 640 720 940 780 C 1200 830 1420 760 1600 740 V900 H0Z' fill='#a3552b'/>`);

const night = (() => {
  const r = rng(7);
  let stars = '';
  for (let i = 0; i < 220; i++) {
    const x = Math.round(r() * 1600);
    const y = Math.round(r() * 720);
    const size = (r() * 1.6 + 0.4).toFixed(2);
    const o = (r() * 0.7 + 0.3).toFixed(2);
    stars += `<circle cx='${x}' cy='${y}' r='${size}' fill='#fff' opacity='${o}'/>`;
  }
  return svg(`
    <defs>
      <radialGradient id='bg' cx='.7' cy='.2' r='1'><stop offset='0' stop-color='#1d2a55'/><stop offset='1' stop-color='#05070f'/></radialGradient>
      <radialGradient id='glow' cx='.5' cy='.5' r='.5'><stop offset='0' stop-color='#fff6d8' stop-opacity='.5'/><stop offset='1' stop-color='#fff6d8' stop-opacity='0'/></radialGradient>
    </defs>
    <rect width='1600' height='900' fill='url(#bg)'/>
    ${stars}
    <circle cx='1220' cy='200' r='150' fill='url(#glow)'/>
    <circle cx='1220' cy='200' r='56' fill='#fff4d6'/>
    <circle cx='1242' cy='186' r='52' fill='#18244a'/>
    <path d='M0 800 C 260 760 480 820 760 790 S 1300 760 1600 800 V900 H0Z' fill='#03050b'/>`);
})();

const mint = svg(`
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#0f5f4f'/><stop offset='1' stop-color='#6fd3a8'/></linearGradient>
  </defs>
  <rect width='1600' height='900' fill='url(#bg)'/>
  <g fill='none' stroke='#ffffff' stroke-opacity='.10' stroke-width='2'>
    ${Array.from({ length: 14 }, (_, i) => `<circle cx='1600' cy='900' r='${120 + i * 90}'/>`).join('')}
  </g>`);

function AnimatedGradient() {
  return <div className="demo-animated-wallpaper" />;
}

export const WALLPAPERS: WallpaperPreset[] = [
  { id: 'aurora', name: 'Kutup ışıkları', wallpaper: { type: 'image', src: aurora } },
  { id: 'mountains', name: 'Tepeler', wallpaper: { type: 'image', src: mountains } },
  { id: 'waves', name: 'Dalgalar', wallpaper: { type: 'image', src: waves } },
  { id: 'night', name: 'Gece', wallpaper: { type: 'image', src: night } },
  { id: 'dunes', name: 'Kumullar', wallpaper: { type: 'image', src: dunes } },
  { id: 'mint', name: 'Nane', wallpaper: { type: 'image', src: mint } },
  { id: 'graphite', name: 'Grafit', wallpaper: { type: 'gradient', value: 'radial-gradient(circle at 30% 20%, #4b5563 0%, #1f2937 45%, #0b0f17 100%)' } },
  { id: 'live', name: 'Canlı (animasyon)', wallpaper: { type: 'custom', render: () => <AnimatedGradient /> } },
];
