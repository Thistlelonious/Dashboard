const thread = (d, color, width, dash = '') =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;

const compositions = {
  light: c => [
    `<circle cx="1390" cy="120" r="330" fill="${c['tint-rose']}"/>`,
    `<circle cx="160" cy="930" r="280" fill="${c['tint-teal']}"/>`,
    `<circle cx="1480" cy="900" r="170" fill="${c['tint-marigold']}"/>`,
    thread('M-40 700 C 300 520, 560 860, 900 640 S 1400 380, 1660 520', c.teal, 6),
    thread('M-40 760 C 320 600, 600 930, 930 720 S 1420 470, 1660 600', c.rose, 4, '18 16'),
    thread('M260 -40 C 420 160, 300 330, 520 420', c.marigold, 5),
  ],
  colorful: c => [
    `<circle cx="1400" cy="140" r="380" fill="${c['tint-marigold']}"/>`,
    `<circle cx="120" cy="880" r="330" fill="${c['tint-cornflower']}"/>`,
    `<circle cx="820" cy="1060" r="260" fill="${c['tint-fern']}"/>`,
    `<circle cx="1520" cy="880" r="220" fill="${c['tint-plum']}"/>`,
    `<circle cx="300" cy="80" r="200" fill="${c['tint-teal']}"/>`,
    thread('M-40 640 C 300 460, 580 820, 920 600 S 1420 320, 1660 480', c.rose, 10),
    thread('M-40 720 C 320 560, 620 900, 960 690 S 1440 420, 1660 570', c.cornflower, 6, '22 18'),
    thread('M1100 1040 C 1180 820, 1420 780, 1660 700', c.fern, 8),
  ],
  dark: c => [
    `<circle cx="1400" cy="120" r="340" fill="${c['tint-plum']}"/>`,
    `<circle cx="140" cy="920" r="300" fill="${c['tint-teal']}"/>`,
    thread('M-40 690 C 300 500, 580 860, 920 630 S 1420 360, 1660 500', c.marigold, 5),
    thread('M-40 750 C 320 580, 620 930, 950 710 S 1440 450, 1660 580', c.rose, 3, '16 16'),
    thread('M1180 -40 C 1120 200, 1320 330, 1240 520', c.teal, 4),
  ],
};

export const backdropSvg = (theme, colors) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice"><rect width="1600" height="1000" fill="${colors.canvas}"/>${compositions[theme](colors).join('')}</svg>`;
