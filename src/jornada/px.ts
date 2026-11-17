// @ts-nocheck
/* eslint-disable */
/**
 * Artes da Jornada copiadas da "Prévia da Jornada" (sprites.js), o modelo decidido em 16/11 (modulo-rpg.md, B.16).
 * Arquivo trazido como está: só desenhos (linhas de texto + paletas → SVG). Não editar à mão; para mudar uma arte,
 * mudar aqui e conferir na prévia.
 */
const window: any = {};
/* Artes da Jornada em pixel art: cada sprite é uma lista de linhas; cada letra é uma cor da paleta. */
window.PX = (function () {
  var OUT = '#1a1a1f';

  function grid(rows, pal, w) {
    w = w || rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
    return rows.map(function (r) {
      var line = [];
      for (var x = 0; x < w; x++) {
        var ch = r.charAt(x);
        line.push(ch && ch !== '.' ? (ch === 'O' && !pal.O ? OUT : pal[ch] || null) : null);
      }
      return line;
    });
  }
  function blank(w, h) {
    var g = [];
    for (var y = 0; y < h; y++) { var l = []; for (var x = 0; x < w; x++) l.push(null); g.push(l); }
    return g;
  }
  function paint(dst, src, ox, oy) {
    for (var y = 0; y < src.length; y++) for (var x = 0; x < src[y].length; x++) {
      var c = src[y][x];
      var ty = y + oy, tx = x + ox;
      if (c && ty >= 0 && ty < dst.length && tx >= 0 && tx < dst[0].length) dst[ty][tx] = c;
    }
    return dst;
  }
  function svg(g) {
    var h = g.length, w = g[0].length, out = [];
    for (var y = 0; y < h; y++) {
      var x = 0;
      while (x < w) {
        var c = g[y][x];
        if (!c) { x++; continue; }
        var s = x;
        while (x < w && g[y][x] === c) x++;
        out.push('<rect x="' + s + '" y="' + y + '" width="' + (x - s) + '" height="1" fill="' + c + '"/>');
      }
    }
    return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" shape-rendering="crispEdges">' + out.join('') + '</svg>');
  }
  function src(rows, pal, w) { return svg(grid(rows, pal, w)); }

  // Contorno automático: célula vazia vizinha de uma pintada vira contorno.
  function outline(g) {
    var h = g.length, w = g[0].length, add = [];
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      if (g[y][x]) continue;
      var n = [[0, 1], [1, 0], [0, -1], [-1, 0]].some(function (d) { var yy = y + d[0], xx = x + d[1]; return yy >= 0 && yy < h && xx >= 0 && xx < w && g[yy][xx] && g[yy][xx] !== OUT; });
      if (n) add.push([y, x]);
    }
    add.forEach(function (a) { g[a[0]][a[1]] = OUT; });
    return g;
  }
  // Peças na diagonal (de baixo à esquerda para cima à direita): p = ao longo, q = de lado.
  function diag(fn) {
    var g = blank(16, 16);
    for (var r = 0; r < 16; r++) for (var c = 0; c < 16; c++) g[r][c] = fn(c - r, r + c - 15, r, c) || null;
    return outline(g);
  }
  function feather(pal) {
    return diag(function (p, q) {
      if (p < -13 || p > 12) return null;
      if (q === 0 || q === 1) return p < -6 ? pal.Q : pal.Q;
      var w = p < -6 ? 0 : p < -3 ? 2 : p < 8 ? 4 : p < 11 ? 3 : 2;
      if (q < -w + 1 || q > w) return null;
      if ((p === 0 || p === 5) && q === w) return null;
      return q < 0 ? pal.W : pal.F;
    });
  }
  function staff(pal) {
    var g = diag(function (p, q, r, c) {
      var dr = r - 3.5, dc = c - 11.5;
      var d = dr * dr + dc * dc;
      if (d <= 7.5) return d < 2.5 && dr < 0 && dc < 0 ? pal.W : dr + dc > 1.5 ? pal.c : pal.C;
      if (p >= -13 && p <= 3 && (q === 0 || q === 1)) return q === 0 ? pal.B : pal.b || pal.B;
      if (p >= 2 && p <= 5 && (q === -2 || q === 3)) return pal.G || '#facc15';
      return null;
    });
    return g;
  }

  // ---------- Desenho por código (construções) ----------
  function Canvas(w, h) { this.g = blank(w, h); this.w = w; this.h = h; }
  Canvas.prototype.set = function (x, y, c) { if (c && y >= 0 && y < this.h && x >= 0 && x < this.w) this.g[y][x] = c; };
  Canvas.prototype.rect = function (x, y, w, h, c) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) this.set(x + i, y + j, c); };
  Canvas.prototype.box = function (x, y, w, h, fill, line) { this.rect(x, y, w, h, line || OUT); this.rect(x + 1, y + 1, w - 2, h - 2, fill); };
  Canvas.prototype.bricks = function (x, y, w, h, a, b) {
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
      var row = Math.floor(j / 3), mortar = j % 3 === 2 || (i + (row % 2 ? 2 : 0)) % 5 === 0;
      this.set(x + i, y + j, mortar ? b : a);
    }
  };
  Canvas.prototype.cone = function (cx, top, half, fill, shade) {
    for (var j = 0; j <= half; j++) {
      for (var i = -j; i <= j; i++) this.set(cx + i, top + j, i === -j || i === j ? OUT : i > 0 ? shade : fill);
    }
  };
  Canvas.prototype.crenels = function (x, y, w, c) {
    for (var i = 0; i < w; i++) if (i % 2 === 0) { this.set(x + i, y, OUT); this.set(x + i, y + 1, c); }
    this.rect(x, y + 1, w, 1, OUT);
  };

  // ---------- Paletas da cena ----------
  var TIMES = {
    manha: { sky1: '#7dd3fc', sky2: '#bae6fd', sun: '#fde047', cloud: '#ffffff', grass: '#22c55e', ground: '#16a34a', path: '#d6b98c', wall: '#f5e6c8', wallShade: '#e0cba6', stone: '#d6d3d1', stoneShade: '#a8a29e', win: '#bfdbfe', roof: '#b91c1c', roofShade: '#991b1b', blue: '#2563eb', blueShade: '#1d4ed8', leaf: '#16a34a', leafShade: '#15803d', label: 'Manhã · 09:12' },
    tarde: { sky1: '#fb923c', sky2: '#fdba74', sun: '#f97316', cloud: '#fed7aa', grass: '#84cc16', ground: '#65a30d', path: '#c8a273', wall: '#ecd3a8', wallShade: '#d4b98a', stone: '#d4c4a8', stoneShade: '#a8946f', win: '#fde68a', roof: '#9a3412', roofShade: '#7c2d12', blue: '#7c3aed', blueShade: '#6d28d9', leaf: '#4d7c0f', leafShade: '#3f6212', label: 'Tarde · 17:40' },
    noite: { sky1: '#0b1020', sky2: '#172554', sun: '#fef3c7', cloud: 'transparent', grass: '#166534', ground: '#14532d', path: '#5b4a35', wall: '#8b7d64', wallShade: '#6f634f', stone: '#64748b', stoneShade: '#475569', win: '#facc15', roof: '#7f1d1d', roofShade: '#5f1717', blue: '#1e3a8a', blueShade: '#172554', leaf: '#14532d', leafShade: '#0f3d22', label: 'Noite · 21:30' },
    chuva: { sky1: '#475569', sky2: '#64748b', sun: 'transparent', cloud: '#94a3b8', grass: '#15803d', ground: '#166534', path: '#78716c', wall: '#d6c7a8', wallShade: '#b8a98a', stone: '#94a3b8', stoneShade: '#64748b', win: '#fde68a', roof: '#991b1b', roofShade: '#7f1d1d', blue: '#1d4ed8', blueShade: '#1e3a8a', leaf: '#15803d', leafShade: '#166534', label: 'Chuva · 15:05' }
  };

  // ---------- Moradas ----------
  function cabana(t) {
    var c = new Canvas(22, 14), cx = 10;
    for (var j = 0; j < 12; j++) {
      for (var i = cx - j; i <= cx + 1 + j; i++) {
        var edge = i === cx - j || i === cx + 1 + j;
        c.set(i, j + 1, edge ? OUT : (i - cx + 40) % 3 === 0 ? '#a16207' : '#d97706');
      }
    }
    for (var d = 0; d < 6; d++) for (var k = cx - d / 2; k <= cx + 1 + d / 2; k++) c.set(Math.round(k), 7 + d, '#3f2a14');
    c.set(cx, 0, '#7c4a2d'); c.set(cx + 1, 0, '#7c4a2d');
    c.rect(0, 13, 22, 1, OUT);
    // fogueira
    c.set(19, 10, '#fde047'); c.set(19, 11, '#f97316'); c.set(18, 11, '#f97316'); c.set(20, 11, '#dc2626');
    c.rect(17, 12, 5, 1, '#7c4a2d');
    return c.g;
  }
  function casinha(t, stone) {
    var wall = stone ? t.stone : t.wall, shade = stone ? t.stoneShade : t.wallShade;
    var roof = stone ? t.blue : t.roof, roofS = stone ? t.blueShade : t.roofShade;
    return grid([
      '..........RRRR..........',
      '........RRRRRRRR....CC..',
      '......RRRRRRRRRRRR..CC..',
      '.....RRRRRRRRRRRRRR.CC..',
      '....RRRRRRRRRRRRRRRRCC..',
      '...RRRRRRRRRRRRRRRRRRR..',
      '..RrrrrrrrrrrrrrrrrrrrR.',
      '.RRRRRRRRRRRRRRRRRRRRRRR',
      '..WWWWWWWWWWWWWWWWWWWW..',
      '..WWWWWWWWWWWWWWWWWWWW..',
      '..WWFFFFWWWDDDDWWFFFFW..',
      '..WWFYYFWWWDDDDWWFYYFW..',
      '..WWFYYFWWWDDDDWWFYYFW..',
      '..WWFFFFWWWDDDDWWFFFFW..',
      '..WWWWWWWWWDDDKWWWWWWW..',
      '..WwwwwwwwwDDDDwwwwwwW..',
      '..WWWWWWWWWDDDDWWWWWWW..',
      '..SSSSSSSSSSSSSSSSSSSS..',
      '..SsSsSsSsSsSsSsSsSsSs..'
    ], { R: roof, r: roofS, C: '#57534e', W: wall, w: shade, F: '#7c4a2d', Y: t.win, D: '#7c4a2d', K: '#facc15', S: '#78716c', s: '#57534e' }, 24);
  }
  function torre(t) {
    var c = new Canvas(14, 32);
    c.cone(7, 0, 7, t.blue, t.blueShade);
    c.set(7, 0, '#facc15');
    c.box(2, 8, 11, 24, t.stone);
    c.bricks(3, 9, 9, 22, t.stone, t.stoneShade);
    c.rect(6, 12, 3, 4, OUT); c.rect(7, 13, 1, 3, t.win);
    c.rect(4, 19, 2, 3, OUT); c.set(4, 20, t.win);
    c.rect(9, 19, 2, 3, OUT); c.set(9, 20, t.win);
    c.rect(5, 25, 5, 6, OUT); c.rect(6, 26, 3, 5, '#7c4a2d');
    return c.g;
  }
  function castelinho(t) {
    var c = new Canvas(30, 24);
    // muralha
    c.box(6, 10, 18, 14, t.stone); c.bricks(7, 11, 16, 12, t.stone, t.stoneShade);
    c.crenels(6, 8, 18, t.stone);
    // torres
    [0, 22].forEach(function (x) {
      c.box(x, 5, 8, 19, t.stone); c.bricks(x + 1, 6, 6, 17, t.stone, t.stoneShade);
      c.crenels(x, 3, 8, t.stone);
      c.rect(x + 3, 10, 2, 3, OUT); c.set(x + 3, 11, t.win); c.set(x + 4, 11, t.win);
      c.set(x + 3, 0, '#7c4a2d'); c.set(x + 3, 1, '#7c4a2d'); c.set(x + 3, 2, '#7c4a2d');
      c.set(x + 4, 0, '#dc2626'); c.set(x + 5, 0, '#dc2626'); c.set(x + 4, 1, '#dc2626');
    });
    // portão
    c.rect(12, 15, 6, 9, OUT); c.rect(13, 16, 4, 8, '#3f2a14');
    for (var y = 17; y < 24; y += 2) c.rect(13, y, 4, 1, '#78716c');
    c.set(12, 15, t.stone); c.set(17, 15, t.stone);
    return c.g;
  }
  function castelo(t) {
    var c = new Canvas(44, 36);
    // torre central
    c.box(15, 12, 14, 24, t.stone); c.bricks(16, 13, 12, 22, t.stone, t.stoneShade);
    c.cone(22, 2, 10, t.blue, t.blueShade);
    c.rect(22, 0, 1, 3, '#7c4a2d'); c.rect(23, 0, 3, 1, '#facc15'); c.set(23, 1, '#facc15');
    c.rect(20, 17, 4, 5, OUT); c.rect(21, 18, 2, 4, t.win);
    // muralhas
    c.box(8, 22, 28, 14, t.stone); c.bricks(9, 23, 26, 12, t.stone, t.stoneShade);
    c.crenels(8, 20, 7, t.stone); c.crenels(29, 20, 7, t.stone);
    // torres laterais
    [0, 34].forEach(function (x) {
      c.box(x, 14, 10, 22, t.stone); c.bricks(x + 1, 15, 8, 20, t.stone, t.stoneShade);
      c.cone(x + 4, 6, 7, t.blue, t.blueShade); c.rect(x + 5, 13, 1, 1, t.blueShade);
      c.set(x + 4, 4, '#7c4a2d'); c.set(x + 4, 5, '#7c4a2d'); c.set(x + 5, 4, '#dc2626'); c.set(x + 6, 4, '#dc2626');
      c.rect(x + 4, 19, 2, 3, OUT); c.set(x + 4, 20, t.win); c.set(x + 5, 20, t.win);
      c.rect(x + 4, 26, 2, 3, OUT); c.set(x + 4, 27, t.win); c.set(x + 5, 27, t.win);
    });
    // portão
    c.rect(18, 26, 8, 10, OUT); c.rect(19, 27, 6, 9, '#3f2a14');
    for (var y = 28; y < 36; y += 2) c.rect(19, y, 6, 1, '#78716c');
    c.set(18, 26, t.stone); c.set(25, 26, t.stone);
    // estandartes
    c.rect(11, 25, 2, 5, '#dc2626'); c.set(11, 30, '#dc2626'); c.rect(11, 25, 2, 1, '#facc15');
    c.rect(31, 25, 2, 5, '#dc2626'); c.set(32, 30, '#dc2626'); c.rect(31, 25, 2, 1, '#facc15');
    return c.g;
  }
  var HOMES = [
    { id: 'cabana', name: 'Barraca de viajante', rarity: 'comum', how: 'Início da Jornada', build: cabana },
    { id: 'casinha', name: 'Casinha', rarity: 'comum', how: 'Nível 5', build: function (t) { return casinha(t, false); } },
    { id: 'pedra', name: 'Casa de pedra', rarity: 'raro', how: 'Nível 15 · 600 ouro', build: function (t) { return casinha(t, true); } },
    { id: 'torre', name: 'Torre do mago', rarity: 'epico', how: 'Nível 25 · INT 100', build: torre },
    { id: 'castelinho', name: 'Castelinho', rarity: 'epico', how: 'Nível 30 · 2.000 ouro', build: castelinho },
    { id: 'castelo', name: 'Castelo', rarity: 'mistico', how: 'Nível 50 · todos os atributos ≥ 100', build: castelo }
  ];

  // ---------- Árvore ----------
  function tree(t) {
    return grid(['...LLLL...', '..LLLLLL..', '.LLLlLLLL.', 'LLLLLLLLLL', 'LLlLLLLlLL', 'LLLLLLLLLL', '.LLLLLlLL.', 'LLLlLLLLLL', '.LLLLLLLL.', '..LLLLLL..', '....TT....', '....TT....', '....TT....', '....TT....', '...TTTT...'],
      { L: t.leaf, l: t.leafShade, T: '#6b4423' }, 10);
  }

  // ---------- Itens ----------
  var HELMET_ICONS = {
    capuz: ['................', '.....OOOOOO.....', '....OBBBBBBO....', '...OBBBBBBBBO...', '..OBBBBBBBBBBO..', '..OBBbbbbbbBBO..', '..OBbO....ObBO..', '..OBbO....ObBO..', '..OBbO....ObBO..', '..OBbO....ObBO..', '..OBBbOOOObBBO..', '.OBBBBBBBBBBBBO.', '.ObBBBBBBBBBBbO.', '..OOOOOOOOOOOO..'],
    elmo: ['.......RR.......', '......RRRR......', '.......RR.......', '.....OOOOOO.....', '....OMMMMMMO....', '...OMMWMMMMMO...', '...OMWMMMMMMO...', '...OMMMMMMMMO...', '...OOOOOOOOOO...', '...OmEEEEEEmO...', '...OMMMMMMMMO...', '...OMmMMMMmMO...', '...OMMMOOMMMO...', '....OMMOOMMO....', '.....OOOOOO.....'],
    chapeu: ['..........OO....', '.........OPPO...', '........OPPPO...', '.......OPPPO....', '......OPPPPO....', '......OPPYPO....', '.....OPPPPPPO...', '.....OPPPPPPO...', '....OPYPPPPPPO..', '....OPPPPPPPPO..', '...OGGGGGGGGGGO.', '.OOPPPPPPPPPPPPO', 'OPPPPPPPPPPPPPPO', '.OOOOOOOOOOOOOO.'],
    coroa: ['................', '................', '................', '.O.....OO.....O.', 'OCO...OCCO...OCO', 'OCCO.OCWCCO.OCCO', 'OGCGOGGCCGGOGCGO', 'OGGGGGGGGGGGGGGO', 'OGgGGCGGGGCGGgGO', 'OGGGGGGGGGGGGGGO', 'OggggggggggggggO', '.OOOOOOOOOOOOOO.']
  };
  // Os mesmos elmos vestidos no avatar (linhas -6 a 9 do corpo).
  var HELMET_WEAR = {
    capuz: ['', '', '', '', '', '.....OOOOOO.....', '....OBBBBBBO....', '...OBBBBBBBBO...', '..OBBBBBBBBBBO..', '.OBBBBBBBBBBBBO.', '.OBBbbbbbbbbBBO.', '.OBbO......ObBO.', '.OBbO......ObBO.', '.OBbO......ObBO.', '.OBBbO....ObBBO.', '.OBBBO....OBBBO.'],
    elmo: ['', '', '.......RR.......', '......RRRR......', '.......RR.......', '.....OOOOOO.....', '...OOMMMMMMOO...', '..OMMWMMMMMMMO..', '..OMWMMMMMMMMO..', '.OMMMMMMMMMMMMO.', '.OOOOOOOOOOOOOO.', '.OMO........OMO.', '.OMO........OMO.', '.OMO........OMO.', '..OO........OO..'],
    chapeu: ['.........OO.....', '........OPPO....', '.......OPPPO....', '......OPPYPO....', '......OPPPPPO...', '.....OPPPPPPO...', '.....OPYPPPPO...', '....OPPPPPPPPO..', '...OGGGGGGGGGGO.', 'OPPPPPPPPPPPPPPO', '.OOOOOOOOOOOOOO.'],
    coroa: ['', '', '...O...OO...O...', '..OCO.OCCO.OCO..', '..OGCOGCCGOCGO..', '..OGGGGGGGGGGO..', '..OGgCGGGGCgGO..', '..OOOOOOOOOOOO..']
  };
  var HELMET_PAL = {
    capuz: { B: '#8b5a2b', b: '#5c3a1c' },
    elmo: { M: '#cbd5e1', m: '#94a3b8', W: '#f8fafc', E: '#0f172a', R: '#dc2626' },
    chapeu: { P: '#7c3aed', Y: '#fde047', G: '#facc15' },
    coroa: { C: '#67e8f9', W: '#ecfeff', G: '#facc15', g: '#ca8a04' }
  };

  var ARMOR_TUNIC = ['................', '....OOO..OOO....', '...OMMMOOMMMO...', '..OMMMMMMMMMMO..', '.OMMMMMGGMMMMMO.', 'OMMMOMMGGMMOMMMO', 'OmMOOMMMMMMOOMmO', 'OOO.OMMMMMMO.OOO', '....OMmMMmMO....', '....OBBBBBBO....', '....OTTTTTTO....', '...OTTTTTTTTO...', '...OTtTTTTtTO...', '...OOOOOOOOOO...'];
  var ARMOR_PLATE = ['................', '..OOOO....OOOO..', '.OMMMMOOOOMMMMO.', 'OMWMMMMMMMMMMmMO', 'OMMMMMMGGMMMMMMO', '.OOOOMMGGMMOOOO.', '....OMMMMMMO....', '....OMmMMmMO....', '....OMMMMMMO....', '....OBBBBBBO....', '....OTTTTTTO....', '...OTTTTTTTTO...', '...OTtTTTTtTO...', '...OOOOOOOOOO...'];
  var SHOULDERS = ['.OOOO......OOOO.', 'OMWMMO....OMMWMO', 'OmMMO......OMMmO'];

  var BOOTS = ['................', '................', '................', '.OOOO....OOOO...', '.OKKO....OKKO...', '.OKKO....OKKO...', '.OkkO....OkkO...', '.OKKO....OKKO...', '.OKKOO...OKKOO..', '.OKKKKO..OKKKKO.', '.OKKKKKO.OKKKKKO', '.OsssssO.OsssssO', '.OOOOOOO.OOOOOOO'];
  var BOOT_WINGS_ICON = ['W........W......', 'WW.......WW......', '.WW.......WW.....'];
  var BOOT_WINGS_WEAR = ['.W............W.', 'WW............WW', '.W............W.'];

  var SWORD = ['..............OO', '.............OWO', '............OWwO', '...........OWwO.', '..........OWwO..', '.........OWwO...', '........OWwO....', '.......OWwO.....', '..OO..OWwO......', '..OGOOWwO.......', '...OGGwO........', '...OHGGO........', '..OHO.OGO.......', '.OHO...OO.......', 'OPO.............', 'OO..............'];
  var STAFF = ['...........OOO..', '..........OCWCO.', '..........OCCCO.', '..........OcCcO.', '.........OOOOO..', '........OBO.....', '.......OBO......', '......OBO.......', '.....OBO........', '....OBO.........', '...OBO..........', '..OBO...........', '.OBO............', 'OBO.............', 'OO..............'];

  var ART = {
    pena: ['.............OO.', '............OWWO', '...........OWFWO', '..........OWFFWO', '.........OWFFWO.', '........OWFFWO..', '.......OWFFWO...', '......OWFFWO....', '.....OWFFWO.....', '....OWFFWO......', '...OWFWWO.......', '...OWWOO........', '..OQO...........', '.OQO............', 'OQO.............', 'OO..............'],
    bracelete: ['................', '................', '...OOOOOOOOOO...', '..OGGGGGGGGGGO..', '..OGWGGGGGGGgO..', '..OMMMMMMMMMMO..', '..OMWMMRRMMMmO..', '..OMMMRWRRMMmO..', '..OMMMRRRRMMmO..', '..OMMMMRRMMMmO..', '..OMMMMMMMMMmO..', '..OGGGGGGGGGGO..', '..OggggggggggO..', '...OOOOOOOOOO...'],
    grimorio: ['................', '..OOOOOOOOOOOO..', '..OPPPPPPPPPPWO.', '..OPGGGGGGGGPWO.', '..OPGPPPPPPGPWO.', '..OPGPPYYPPGPWO.', '..OPGPYCCYPGPWO.', '..OPGPYCCYPGPWO.', '..OPGPPYYPPGPWO.', '..OPGPPPPPPGPWO.', '..OPGGGGGGGGPWO.', '..OPPPPPPPPPPWO.', '..OpppppppppppO.', '..OOOOOOOOOOOOO.'],
    gota: ['..YY........YY..', '...Y........Y...', '...Y........Y...', '....Y......Y....', '.....Y....Y.....', '......YGGY......', '.......OO.......', '......OBBO......', '.....OBWBBO.....', '....OBWBBBBO....', '....OBBBBBbO....', '....OBBBBbbO....', '.....OBBbbO.....', '......OOOO......'],
    lanterna: ['.......OO.......', '......O..O......', '.....OOOOOO.....', '....OGGGGGGO....', '....OOOOOOOO....', '....OLYYYYLO....', '....OLYFFYLO....', '....OLFRRFLO....', '....OLFRRFLO....', '....OLYFFYLO....', '....OLYYYYLO....', '....OOOOOOOO....', '....OGGGGGGO....', '.....OOOOOO.....'],
    ampulheta: ['..OOOOOOOOOOOO..', '..OBBBBBBBBBBO..', '...OOOOOOOOOO...', '...OWYYYYYYWO...', '....OWYYYYWO....', '.....OWYYWO.....', '......OYYO......', '......OWYO......', '.....OWWYWO.....', '....OWWWYWWO....', '...OWWWYYYWWO...', '...OWYYYYYYWO...', '...OOOOOOOOOO...', '..OBBBBBBBBBBO..', '..OOOOOOOOOOOO..'],
    coracao: ['................', '...OOO....OOO...', '..OCCCO..OCCCO..', '.OCWWCCOOCCCCcO.', '.OCWCCCCCCCCCcO.', '.OCCCCCCCCCCCcO.', '.OCCCCCCCCCCccO.', '..OCCCCCCCCccO..', '...OCCCCCCccO...', '....OCCCCccO....', '.....OCCccO.....', '......OccO......', '.......OO.......'],
    olho: ['................', '.......YY.......', '..Y....YY....Y..', '...Y........Y...', '.....OOOOOO.....', '...OOWWWWWWOO...', '..OWWWOOOOWWWO..', '.OWWWOIIIIOWWWO.', 'OWWWOIIKKIIOWWWO', '.OWWWOIIIIOWWWO.', '..OWWWOOOOWWWO..', '...OOWWWWWWOO...', '.....OOOOOO.....', '...Y........Y...', '..Y....YY....Y..', '.......YY.......'],
    estrela: ['.......OO.......', '......OYYO......', '......OYYO......', '.....OYWYYO.....', 'OOOOOOYWYYOOOOOO', 'OYYYYYYYYYYYYYYO', '.OYYYYYYYYYYYYO.', '..OOYYYYYYYYOO..', '....OYYYYYYO....', '...OYYYYYYYYO...', '...OYYYOOYYYO...', '..OYYYO..OYYYO..', '..OYYO....OYYO..', '.OYOO......OOYO.', '.OO..........OO.']
  };

  var ATTR_COLORS = { FOR: '#f87171', AGI: '#38bdf8', INT: '#a78bfa', RES: '#60a5fa', SAB: '#e879f9', DIS: '#4ade80' };

  // slot: elmo | armadura | botas | arma | artefato
  var ITEMS = [
    { id: 'capuz', slot: 'elmo', name: 'Capuz de couro', rarity: 'comum', how: 'Loja · 150 ouro', icon: [HELMET_ICONS.capuz, HELMET_PAL.capuz] },
    { id: 'elmo', slot: 'elmo', name: 'Elmo de ferro', rarity: 'raro', how: 'Loja · 600 ouro', icon: [HELMET_ICONS.elmo, HELMET_PAL.elmo] },
    { id: 'chapeu', slot: 'elmo', name: 'Chapéu de mago', rarity: 'epico', how: 'Baú · ou INT 50', icon: [HELMET_ICONS.chapeu, HELMET_PAL.chapeu] },
    { id: 'coroa', slot: 'elmo', name: 'Coroa de cristal', rarity: 'mistico', req: { DIS: 100 }, crystals: 3, effect: '+1 cristal por mês com todas as contas pagas no prazo.', icon: [HELMET_ICONS.coroa, HELMET_PAL.coroa] },

    { id: 'aprendiz', slot: 'armadura', name: 'Túnica de aprendiz', rarity: 'comum', how: 'Início da Jornada', pal: { M: '#d6c7a1', m: '#b8a77e', t: '#9c8b62', G: '#8b5a2b', B: '#6b4423', T: '#7c6f55', W: '#ede4cc' }, shape: 'tunic' },
    { id: 'gibao', slot: 'armadura', name: 'Gibão de couro', rarity: 'comum', how: 'Loja · 200 ouro', pal: { M: '#a16207', m: '#854d0e', t: '#713f12', G: '#facc15', B: '#422006', T: '#713f12', W: '#ca8a04' }, shape: 'tunic' },
    { id: 'malha', slot: 'armadura', name: 'Cota de malha', rarity: 'raro', how: 'Loja · 700 ouro', pal: { M: '#9ca3af', m: '#6b7280', t: '#4b5563', G: '#e5e7eb', B: '#78350f', T: '#4b5563', W: '#d1d5db' }, shape: 'tunic' },
    { id: 'manto', slot: 'armadura', name: 'Manto arcano', rarity: 'raro', how: 'Baú · ou SAB 50', pal: { M: '#7c3aed', m: '#6d28d9', t: '#4c1d95', G: '#fde047', B: '#312e81', T: '#6d28d9', W: '#a78bfa' }, shape: 'tunic' },
    { id: 'placas', slot: 'armadura', name: 'Armadura de placas', rarity: 'epico', how: 'Baú épico · ou FOR 80', pal: { M: '#cbd5e1', m: '#94a3b8', t: '#64748b', G: '#facc15', B: '#78350f', T: '#475569', W: '#f8fafc' }, shape: 'plate' },
    { id: 'cristal', slot: 'armadura', name: 'Armadura de cristal', rarity: 'mistico', req: { RES: 150 }, crystals: 5, effect: 'Uma vez por semana, um dia perdido não quebra a sequência da Jornada.', pal: { M: '#a5f3fc', m: '#67e8f9', t: '#0891b2', G: '#f0abfc', B: '#155e75', T: '#0e7490', W: '#ecfeff' }, shape: 'plate' },

    { id: 'sapatos', slot: 'botas', name: 'Sapatos simples', rarity: 'comum', how: 'Início da Jornada', pal: { K: '#3f3f46', k: '#27272a', s: '#18181b' } },
    { id: 'couro', slot: 'botas', name: 'Botas de couro', rarity: 'comum', how: 'Loja · 120 ouro', pal: { K: '#7c4a2d', k: '#5c3a1c', s: '#27272a' } },
    { id: 'ferro', slot: 'botas', name: 'Botas de ferro', rarity: 'raro', how: 'Loja · 500 ouro', pal: { K: '#94a3b8', k: '#64748b', s: '#334155' } },
    { id: 'aladas', slot: 'botas', name: 'Botas aladas', rarity: 'mistico', req: { AGI: 100 }, crystals: 3, effect: 'O pet acompanha mais rápido e as caminhadas dão +10% de XP.', pal: { K: '#fde68a', k: '#f59e0b', s: '#92400e', W: '#ffffff' }, wings: true },

    { id: 'madeira', slot: 'arma', kind: 'espada', name: 'Espada de madeira', rarity: 'comum', how: 'Início da Jornada', pal: { W: '#d6a46b', w: '#a16207', G: '#78350f', H: '#5c3a1c', P: '#5c3a1c' } },
    { id: 'espada', slot: 'arma', kind: 'espada', name: 'Espada de ferro', rarity: 'raro', how: 'Loja · 650 ouro', pal: { W: '#f1f5f9', w: '#94a3b8', G: '#facc15', H: '#7c4a2d', P: '#facc15' } },
    { id: 'rubi', slot: 'arma', kind: 'espada', name: 'Lâmina rubi', rarity: 'epico', how: 'Baú épico · ou FOR 100', pal: { W: '#fecaca', w: '#ef4444', G: '#facc15', H: '#3f3f46', P: '#dc2626' } },
    { id: 'aurora', slot: 'arma', kind: 'espada', name: 'Espada da aurora', rarity: 'mistico', req: { FOR: 150, DIS: 60 }, crystals: 5, effect: 'Subir de nível dá um baú raro extra.', pal: { W: '#fffbeb', w: '#fbbf24', G: '#67e8f9', H: '#e0f2fe', P: '#f0abfc' } },
    { id: 'galho', slot: 'arma', kind: 'cajado', name: 'Cajado de galho', rarity: 'comum', how: 'Loja · 150 ouro', pal: { C: '#4ade80', c: '#16a34a', W: '#bbf7d0', B: '#8b5a2b', b: '#5c3a1c', G: '#65a30d' } },
    { id: 'cajado', slot: 'arma', kind: 'cajado', name: 'Cajado de cristal', rarity: 'raro', how: 'Loja · 650 ouro', pal: { C: '#67e8f9', c: '#0891b2', W: '#ecfeff', B: '#cbd5e1', b: '#94a3b8', G: '#94a3b8' } },
    { id: 'estelar', slot: 'arma', kind: 'cajado', name: 'Cajado estelar', rarity: 'mistico', req: { INT: 150, SAB: 60 }, crystals: 5, effect: 'Cada página/estudo registrado dá +1 ouro extra.', pal: { C: '#fde047', c: '#f59e0b', W: '#fffbeb', B: '#7c3aed', b: '#4c1d95', G: '#e879f9' } },

    { id: 'pena', slot: 'artefato', name: 'Pena do vento', rarity: 'raro', how: 'Baú · ou AGI 40', effect: '+10% XP em hábitos de Agilidade.', attr: 'AGI', feather: { W: '#e0f2fe', F: '#38bdf8', Q: '#f8fafc' } },
    { id: 'bracelete', slot: 'artefato', name: 'Bracelete do titã', rarity: 'raro', how: 'Baú · ou FOR 40', effect: '+10% XP em hábitos de Força.', attr: 'FOR', icon: [ART.bracelete, { G: '#facc15', g: '#ca8a04', M: '#9ca3af', W: '#ffffff', R: '#dc2626', m: '#6b7280' }] },
    { id: 'grimorio', slot: 'artefato', name: 'Grimório', rarity: 'raro', how: 'Baú · ou INT 40', effect: '+10% XP em hábitos de Inteligência.', attr: 'INT', icon: [ART.grimorio, { P: '#6d28d9', p: '#4c1d95', G: '#facc15', Y: '#fde047', C: '#a78bfa', W: '#f5f5f4' }] },
    { id: 'gota', slot: 'artefato', name: 'Amuleto da gota', rarity: 'raro', how: 'Baú · ou RES 40', effect: '+10% XP em hábitos de Resistência.', attr: 'RES', icon: [ART.gota, { B: '#3b82f6', b: '#1d4ed8', W: '#dbeafe', Y: '#facc15', G: '#ca8a04' }] },
    { id: 'lanterna', slot: 'artefato', name: 'Lanterna da sabedoria', rarity: 'raro', how: 'Baú · ou SAB 40', effect: '+10% XP em hábitos de Sabedoria.', attr: 'SAB', icon: [ART.lanterna, { L: '#f5d0fe', Y: '#e879f9', F: '#c026d3', R: '#fdf4ff', G: '#facc15' }] },
    { id: 'ampulheta', slot: 'artefato', name: 'Ampulheta', rarity: 'raro', how: 'Baú · ou DIS 40', effect: '+10% XP em hábitos de Disciplina.', attr: 'DIS', icon: [ART.ampulheta, { B: '#7c4a2d', W: '#e0f2fe', Y: '#fbbf24' }] },
    { id: 'coracao', slot: 'artefato', name: 'Coração de cristal', rarity: 'mistico', req: { RES: 100, DIS: 100 }, crystals: 4, effect: 'Recaída não zera o progresso do baú de cristal.', icon: [ART.coracao, { C: '#67e8f9', c: '#0e7490', W: '#ecfeff' }] },
    { id: 'olho', slot: 'artefato', name: 'Olho do oráculo', rarity: 'mistico', req: { SAB: 100, INT: 100 }, crystals: 4, effect: 'Cada revisão semanal dá +1 cristal.', icon: [ART.olho, { W: '#f5f3ff', I: '#a78bfa', K: '#1e1b4b', Y: '#fde047' }] },
    { id: 'fenix', slot: 'artefato', name: 'Pena da fênix', rarity: 'mistico', req: { AGI: 80 }, extra: '30 dias sem recaída num hábito a abandonar', crystals: 4, effect: 'Depois de uma recaída, os 7 dias seguintes valem XP em dobro.', feather: { W: '#fde047', F: '#f97316', Q: '#dc2626' } },
    { id: 'polar', slot: 'artefato', name: 'Estrela polar', rarity: 'mistico', req: { FOR: 60, AGI: 60, INT: 60, RES: 60, SAB: 60, DIS: 60 }, crystals: 6, effect: '+10% de XP e ouro em tudo. O céu ganha uma constelação.', icon: [ART.estrela, { Y: '#e0f2fe', W: '#ffffff', O: '#0c4a6e' }] }
  ];

  function itemIcon(it) {
    if (it.icon) return src(it.icon[0], it.icon[1], 16);
    if (it.slot === 'armadura') {
      var g = grid(it.shape === 'plate' ? ARMOR_PLATE : ARMOR_TUNIC, it.pal, 16);
      return svg(g);
    }
    if (it.slot === 'botas') {
      var b = grid(BOOTS, it.pal, 16);
      if (it.wings) paint(b, grid(BOOT_WINGS_ICON, { W: '#ffffff' }, 16), 0, 0);
      return svg(b);
    }
    if (it.slot === 'arma') return it.kind === 'arco' ? window.PX.bowIcon(it.pal) : it.kind === 'cajado' ? svg(staff(it.pal)) : src(SWORD, it.pal, 16);
    if (it.feather) return svg(feather(it.feather));
    return '';
  }

  // ---------- Pets ----------
  var PETS = [
    { id: 'gato', name: 'Gatinho', rarity: 'comum', how: 'Nível 3', w: 12, rows: ['.O........O.', 'OCO......OCO', 'OCCOOOOOOCCO', 'OCCCCCCCCCCO', 'OCECCCCCCECO', 'OCCCCNNCCCCO', '.OCCCCCCCCO.', '..OCCCCCCO..', '..OCO..OCO..', '..OO....OO..'], pal: { C: '#9ca3af', E: '#22c55e', N: '#f472b6' } },
    { id: 'cao', name: 'Cãozinho', rarity: 'comum', how: 'Nível 3', w: 12, rows: ['OOO.....OOO.', 'OBBO...OBBO.', 'OBBBOOOBBBO.', '.OCCCCCCCO..', '.OCECCCECO..', '.OCCCNNCCO..', '..OCCCCCOOOO', '.OCCCCCCCCCO', '.OCO.OCO.OCO', '.OO..OO..OO.'], pal: { B: '#7c4a2d', C: '#c08a4f', E: '#141414', N: '#141414' } },
    { id: 'cavalo', name: 'Cavalinho', rarity: 'raro', how: 'Nível 12 · AGI 50', w: 24, rows: ['......OO................', '.....OCO................', '....OCCHO...............', '...OCCCCHO..............', '..OCECCCCHO.............', '.OCCCCCCCCHO............', 'OCCCCOOCCCCHO...........', 'OMMCO..OCCCCHO..........', 'ONMMO...OCCCCHOOOOOOOOO.', '.OOO....OCCCCCCCCCCCCCOH', '........OCCCCCCCCCCCCCOH', '........OCcCCCCCCCCCcCOH', '.........OCCCCCCCCCCCOHH', '.........OCCOOOOOOOCCO.H', '.........OCCO.....OCCO..', '.........OCCO.....OCCO..', '.........OCCO.....OCCO..', '.........OKKO.....OKKO..', '.........OOOO.....OOOO..'], pal: { C: '#b45309', c: '#92400e', H: '#3f2a14', M: '#7c3f0e', N: '#1a1a1f', E: '#141414', K: '#27272a' } }
  ];

  // ---------- Avatar ----------
  var BODY = {
    mulher: ['......OOOO......', '....OOHHHHOO....', '...OHHHHHHHHO...', '..OHHHHHHHHHHO..', '..OHHSSSSSSHHO..', '..OHSSSSSSSSHO..', '..OHSESSSSESHO..', '..OHSSSSSSSSHO..', '..OHHSSssSSHHO..', '..OHHOSSSSOHHO..', '.OHHOMMMMMMOHHO.', '.OHOMMmMMmMMOHO.', 'OSOMMMMGGMMMMOSO', 'OSOtMMMGGMMMtOSO', 'OSOtMMMMMMMMtOSO', '.O.OBBBBBBBBO.O.', '...OTTTTTTTTO...', '...OTTTTTTTTO...', '..OTTTTTTTTTTO..', '...OPPO..OPPO...', '...OPPO..OPPO...', '...OKKO..OKKO...', '..OKKKO..OKKKO..', '..OOOO....OOOO..'],
    homem: ['................', '.....OOOOOO.....', '....OHHHHHHO....', '...OHHHHHHHHO...', '...OHSSSSSSHO...', '...OSSSSSSSSO...', '...OSESSSSESO...', '...OSSSSSSSSO...', '...OSSSssSSSO...', '....OSSSSSSO....', '..OOMMMMMMMMOO..', '.OMMMmMMMMmMMMO.', 'OSOMMMMGGMMMMOSO', 'OSOtMMMGGMMMtOSO', 'OSOtMMMMMMMMtOSO', '.O.OBBBBBBBBO.O.', '...OPPPPPPPPO...', '...OPPPOOPPPO...', '...OPPO..OPPO...', '...OPPO..OPPO...', '...OPPO..OPPO...', '...OKKO..OKKO...', '..OKKKO..OKKKO..', '..OOOO....OOOO..']
  };
  var SKINS = { clara: ['#f6d2b0', '#e0b08a'], media: ['#d9a066', '#b77d48'], escura: ['#8d5524', '#6b3e1a'] };
  var HAIRS = { castanho: '#6b3e26', preto: '#1f1f1f', loiro: '#e6c25c', ruivo: '#b4441c' };

  function find(id) { for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === id) return ITEMS[i]; return null; }

  /** Avatar vestido: corpo + armadura + botas + elmo + arma, num quadro 32×30. */
  function avatar(o) {
    var armor = find(o.armadura || 'aprendiz'), boots = find(o.botas || 'sapatos');
    var pal = Object.assign({ H: HAIRS[o.cabelo || 'castanho'], S: SKINS[o.pele || 'media'][0], s: SKINS[o.pele || 'media'][1], E: '#141414', P: '#3b3f5c' }, armor.pal, { K: boots.pal.K });
    var c = blank(32, 30), ox = 4, oy = 6;
    var w = o.arma && find(o.arma);
    if (w && w.kind === 'arco') paint(c, window.PX.quiverGrid(w.pal), ox - 3, oy + 7);
    paint(c, grid(BODY[o.genero || 'mulher'], pal, 16), ox, oy);
    var nk = o.colar && find(o.colar);
    if (nk && nk.neck) { c[oy + 11][ox + 6] = nk.neck[0]; c[oy + 11][ox + 9] = nk.neck[0]; c[oy + 12][ox + 7] = nk.neck[1]; c[oy + 12][ox + 8] = nk.neck[1]; }
    if (armor.shape === 'plate') paint(c, grid(SHOULDERS, armor.pal, 16), ox, oy + 10);
    if (boots.wings) paint(c, grid(BOOT_WINGS_WEAR, { W: '#ffffff' }, 16), ox, oy + 20);
    if (o.elmo) paint(c, grid(HELMET_WEAR[o.elmo], HELMET_PAL[o.elmo], 16), ox, oy - 6);
    if (w) {
      if (w.kind === 'arco') paint(c, window.PX.bowGrid(w.pal), ox + 13, oy + 6);
      else if (w.kind === 'cajado') paint(c, staff(w.pal), ox + 14 - 3, oy + 14 - 12);
      else paint(c, grid(SWORD, w.pal, 16), ox + 14 - 3, oy + 14 - 12);
    }
    return svg(c);
  }

  var RARITY = {
    comum: { label: 'Comum', color: '#a1a1aa', bg: 'rgba(161,161,170,0.14)' },
    raro: { label: 'Raro', color: '#60a5fa', bg: 'rgba(96,165,250,0.14)' },
    epico: { label: 'Épico', color: '#c084fc', bg: 'rgba(192,132,252,0.16)' },
    mistico: { label: 'Místico', color: '#fde047', bg: 'rgba(253,224,71,0.14)' }
  };

  return { grid: grid, blank: blank, paint: paint, svg: svg, src: src, TIMES: TIMES, HOMES: HOMES, tree: tree, ITEMS: ITEMS, PETS: PETS, find: find, itemIcon: itemIcon, avatar: avatar, AV: { BODY: BODY, SKINS: SKINS, HAIRS: HAIRS, HELMET_WEAR: HELMET_WEAR, HELMET_PAL: HELMET_PAL, SHOULDERS: SHOULDERS, BOOT_WINGS_WEAR: BOOT_WINGS_WEAR, SWORD: SWORD, staff: staff, ARMOR_TUNIC: ARMOR_TUNIC, ARMOR_PLATE: ARMOR_PLATE, BOOTS: BOOTS, BOOT_WINGS_ICON: BOOT_WINGS_ICON, feather: feather }, RARITY: RARITY, ATTR_COLORS: ATTR_COLORS };
})()
;

(function (PX) {
  var CHEST_CLOSED = ['..OOOOOOOOOOOO..', '.OLLLLLLLLLLLLO.', 'OLWLLLLLLLLLLLLO', 'OLLLLLLLLLLLLLLO', 'OMMMMMMMMMMMMMMO', 'OOOOOOOGGOOOOOOO', 'OBBBBBOGGOBBBBBO', 'OBbBBBOKKOBBBbBO', 'OBBBBBBOOBBBBBBO', 'OMMMMMMMMMMMMMMO', 'OBBBBBBBBBBBBBBO', 'ObbbbbbbbbbbbbbO', 'OOOOOOOOOOOOOOOO'];
  var CHEST_OPEN = ['..OOOOOOOOOOOO..', '.OLLLLLLLLLLLLO.', '.OLWLLLLLLLLLLO.', '.OMMMMMMMMMMMMO.', 'OOOOOOOOOOOOOOOO', 'OYYYWYYYYYYWYYYO', 'OBYYYYYYYYYYYYBO', 'OBBBBBOGGOBBBBBO', 'OBbBBBOKKOBBBbBO', 'OBBBBBBOOBBBBBBO', 'OMMMMMMMMMMMMMMO', 'OBBBBBBBBBBBBBBO', 'ObbbbbbbbbbbbbbO', 'OOOOOOOOOOOOOOOO'];
  var CHEST_PAL = {
    bronze: { L: '#c2410c', B: '#9a3412', b: '#7c2d12', M: '#f59e0b', G: '#fde68a', K: '#1a1a1f', W: '#fdba74', Y: '#fde68a' },
    prata: { L: '#cbd5e1', B: '#94a3b8', b: '#64748b', M: '#f1f5f9', G: '#facc15', K: '#1a1a1f', W: '#ffffff', Y: '#e0f2fe' },
    dourado: { L: '#facc15', B: '#ca8a04', b: '#a16207', M: '#fef08a', G: '#fff7ed', K: '#1a1a1f', W: '#fffbeb', Y: '#fef9c3' },
    cristal: { L: '#67e8f9', B: '#0891b2', b: '#0e7490', M: '#cffafe', G: '#f0abfc', K: '#1a1a1f', W: '#ecfeff', Y: '#f5d0fe' }
  };
  PX.chest = function (kind, open) { return PX.src(open ? CHEST_OPEN : CHEST_CLOSED, CHEST_PAL[kind] || CHEST_PAL.bronze, 16); };
  PX.coin = PX.src(['..OOOO..', '.OYYYYO.', 'OYWYYyYO', 'OYYYYyYO', 'OYYYYyYO', 'OYyyyyYO', '.OYYYYO.', '..OOOO..'], { Y: '#facc15', y: '#ca8a04', W: '#fff7ed' }, 8);
  PX.gem = PX.src(['...OO...', '..OCWO..', '.OCCWcO.', 'OCCCWccO', '.OCCWcO.', '..OCcO..', '...OO...'], { C: '#67e8f9', c: '#0e7490', W: '#ecfeff' }, 8);
  PX.star = PX.src(['...O....', '..OYO...', 'OOOYOOO.', 'OYYWYYO.', '.OYYYO..', 'OYYOYYO.', 'OOO.OOO.'], { Y: '#fde047', W: '#fffbeb' }, 8);
  PX.moon = PX.src(['....OOOO..', '..OOYYYYO.', '.OYYYOO...', '.OYYO.....', 'OYYO......', 'OYYO......', '.OYYO.....', '.OYYYOO...', '..OOYYYYO.', '....OOOO..'], { O: '#334155', Y: '#fef3c7' }, 10);
  PX.heart = PX.src(['.OO.OO.', 'ORROWRO', 'ORRRRRO', '.ORRRO.', '..ORO..', '...O...'], { R: '#f43f5e', W: '#fecdd3' }, 7);
  PX.medal = function (ribbon, metal, dark) {
    return PX.src(['OOO....OOO', 'ORRO..ORRO', '.ORRO.ORO.', '..ORROROO.', '...OROO...', '..OOMMOO..', '.OMMWMMMO.', 'OMMWMMMMdO', 'OMMMMMMMdO', 'OMMMMMMddO', '.OMMMMddO.', '..OOOOOO..'], { R: ribbon, M: metal, W: '#ffffff', d: dark }, 10);
  };
  PX.anvil = PX.src(['OOOOOOOOOOOOOO..', 'OMMMMMMMMMMMMMOO', '.OMWMMMMMMMMMMMO', '..OOMMMMMMMMOOO.', '....OMMMMMMO....', '.....OmmmmO.....', '....OmmmmmmO....', '..OOmmmmmmmmOO..', '..OOOOOOOOOOOO..'], { M: '#94a3b8', m: '#64748b', W: '#e2e8f0' }, 16);
  PX.hammer = PX.src(['.OOOOO..', 'OMMMMMO.', 'OMWMMMO.', '.OOOBO..', '...OBO..', '...OBO..', '...OBO..', '...OOO..'], { M: '#cbd5e1', W: '#ffffff', B: '#8b5a2b' }, 8);
})(window.PX);

/* Campanha: regiões do mapa, chefes e personagens. */
(function (PX) {
  var BOSS = {
    lobo: [['.OO..........OO.', 'OGGO........OGGO', 'OGgGO......OGgGO', 'OGggGOOOOOOGggGO', 'OGGGGGGGGGGGGGGO', 'OGGGGGGGGGGGGGGO', 'OGGEEEGGGGEEEGGO', 'OGGGGGGGGGGGGGGO', '.OGGGWWWWWWGGGO.', '.OGGWWWNNWWWGGO.', '..OGWWWWWWWWGO..', '..OGWWOOOOWWGO..', '...OWWOTTOWWO...', '....OWWWWWWO....', '.....OOOOOO.....'], { G: '#6b7280', g: '#f9a8d4', E: '#1f2937', W: '#d1d5db', N: '#111827', T: '#f472b6' }],
    goblin: [['.....OOOOOO.....', '.....OKKKKO.....', '.....OKKKKO.....', '...OOOOOOOOOO...', 'OO..OGGGGGGO..OO', 'OGO.OGGGGGGO.OGO', 'OGGOGRRGGRRGOGGO', '.OGGGRYGGRYGGGO.', '..OGGGGGGGGGGO..', '...OGGGNNGGGO...', '...OGOOOOOOGO...', '...OGOWYWWOGO...', '....OGOOOOGO....', '.....OGGGGO.....', '......OOOO......'], { G: '#65a30d', K: '#1f2937', R: '#dc2626', Y: '#facc15', N: '#3f6212', W: '#f5f5f4' }],
    serpente: [['.....OOOOOO.....', '....OPPPPPPO....', '...OPPpPPpPPO...', '..OPPpPPPPpPPO..', '.OPpPYKPPKYPpPO.', '.OPpPPPPPPPPpPO.', 'OPPpPPPNNPPPpPPO', 'OPpPPPPPPPPPPpPO', '.OPpPPPOOPPPpPO.', '..OPPPOTTOPPPO..', '...OOOO.TOOOO...', '.....OPPPPO.....', '...OPPPppPPPO...', '..OPPpPPPPpPPO..', '..OOOOOOOOOOOO..'], { P: '#a855f7', p: '#7e22ce', Y: '#facc15', K: '#1a1a1f', N: '#581c87', T: '#ef4444' }],
    guardiao: [['.....OOOOOO.....', '...OOBBBBBBOO...', '..OBBBBBBBBBBO..', '.OBBBKKKKKKBBBO.', '.OBBKKKKKKKKBBO.', 'OBBKKYKKKKYKKBBO', 'OBBKKKKKKKKKKBBO', 'OBBBKKKKKKKKBBBO', 'OBBBBKKKKKKBBBBO', 'OBbBBBBBBBBBBbBO', 'OBbBBBBBBBBBBbBO', 'OBBbBBBBBBBBbBBO', 'OBBOBBOBBOBBOBBO', 'OBO.OBO..OBO.OBO', '.O...O....O...O.'], { B: '#93c5fd', b: '#60a5fa', K: '#1e1b4b', Y: '#e0f2fe' }],
    gigante: [['....OOOOOOOO....', '...ORRRrRRRRO...', '..ORRrRRRRrRRO..', '..ORREERRREERO..', '..ORRRRrRRRRRO..', '..ORROOOOOORRO..', 'OOORRRRRRRRRROOO', 'ORRRrRRRRRRrRRRO', 'ORRrRRMMRRRRrRRO', 'ORRRRMMRRrRRRRRO', 'ORrRRRRRRRRRRrRO', 'OOOORRRRRRRROOOO', '...ORRrRRrRRO...', '...OOOO..OOOO...'], { R: '#a8a29e', r: '#78716c', E: '#fb923c', M: '#65a30d' }],
    caos: [['O..............O', 'HO............OH', 'HHO..OOOOOO..OHH', 'OHHOOKKKKKKOOHHO', '.OHHKKKKKKKKHHO.', '..OKKKKKKKKKKO..', '..OKKOOOOOOKKO..', '..OKORROORROKO..', '..OKKOOOOOOKKO..', '..OKKKKPPKKKKO..', '.OKKKKKPPKKKKKO.', 'OKKkKKKKKKKKkKKO', 'OKkKKKKKKKKKKkKO', '.OOOOOOOOOOOOOO.'], { H: '#e7e5e4', K: '#3b0764', k: '#581c87', R: '#ef4444', P: '#e879f9' }]
  };
  PX.boss = function (id) { var b = BOSS[id]; return PX.src(b[0], b[1], 16); };

  var FACE = ['......OOOO......', '.....OHHHHO.....', '...OOOHHHHOOO...', '..OHHHHHHHHHHO..', '.OHHHSSSSSSHHHO.', '.OHHSSSSSSSSHHO.', '.OHSGEGSSGEGSHO.', '.OHSSSSssSSSSHO.', '.OHHSSSSSSSSHHO.', '..OHSSOOOOSSHO..', '..OHHSSSSSSHHO..', '...OOSSSSSSOO...', '..OCCOSSSSOCCO..', '.OCCCCOOOOCCCCO.', 'OCCCCCCAACCCCCCO', 'OCCCCCCCCCCCCCCO'];
  var NPCPAL = {
    lume: { H: '#e5e7eb', S: '#d9a066', s: '#b77d48', G: '#facc15', E: '#1f2937', C: '#7c3aed', A: '#67e8f9' },
    nina: { H: '#7c2d12', S: '#f6d2b0', s: '#e0b08a', G: '#f6d2b0', E: '#1f2937', C: '#16a34a', A: '#facc15' },
    tork: { H: '#1f1f1f', S: '#8d5524', s: '#6b3e1a', G: '#8d5524', E: '#111827', C: '#78350f', A: '#94a3b8' }
  };
  PX.npc = function (id) { return PX.src(FACE, NPCPAL[id], 16); };

  var MOUNTAIN = ['.........OO.........', '........OWWO........', '.......OWWWWO.......', '......OWWMMWWO......', '.....OMMMMMMMMO.....', '....OMMMmMMMMMMO....', '...OMMMmmMMMMMMMO...', '..OMMMmmmMMMMMMMMO..', '.OMMMmmmmMMMMMmMMMO.', 'OMMMmmmmmMMMMmmmMMMO', 'OOOOOOOOOOOOOOOOOOOO'];
  var SWAMP = ['...G..........G.....', '..GLG...G....GLG..G.', '...L...GLG....L..GLG', '...L....L.....L...L.', '.OOOOOOOOOOOOOOOOOO.', 'OSSSSsSSSSSSSSsSSSSO', 'OSSPPSSSSsSSSPPSSSSO', 'OSSSSSSsSSSSSSSSsSSO', '.OOOOOOOOOOOOOOOOOO.'];
  var STALL = ['.OOOOOOOOOOOOOOOO.', 'ORWRWRWRWRWRWRWRWO', 'ORWRWRWRWRWRWRWRWO', '.OOOOOOOOOOOOOOOO.', '..OP..........PO..', '..OP..........PO..', '..OP..YY..Y...PO..', '..OP.YYYY.YY..PO..', '.OOOOOOOOOOOOOOOO.', '.OBBBBBBBBBBBBBBO.', '.ObbbbbbbbbbbbbbO.', '.OOOOOOOOOOOOOOOO.'];
  var CHAOS = Object.assign({}, PX.TIMES.noite, { stone: '#52525b', stoneShade: '#3f3f46', blue: '#7e22ce', blueShade: '#581c87', win: '#ef4444' });
  function homeOf(id, t) { return PX.HOMES.filter(function (h) { return h.id === id; })[0].build(t); }
  PX.region = function (id) {
    if (id === 'vila') return PX.svg(homeOf('casinha', PX.TIMES.manha));
    if (id === 'floresta') { var g = PX.blank(17, 16); PX.paint(g, PX.tree(PX.TIMES.manha), 0, 1); PX.paint(g, PX.tree(Object.assign({}, PX.TIMES.manha, { leaf: '#15803d', leafShade: '#166534' })), 7, 0); return PX.svg(g); }
    if (id === 'mercado') return PX.src(STALL, { R: '#dc2626', W: '#fef3c7', P: '#8b5a2b', Y: '#facc15', B: '#a16207', b: '#854d0e' }, 18);
    if (id === 'pantano') return PX.src(SWAMP, { G: '#84cc16', L: '#3f6212', S: '#4a5d23', s: '#3b4a1c', P: '#a3e635' }, 20);
    if (id === 'torre') return PX.svg(homeOf('torre', PX.TIMES.manha));
    if (id === 'montanha') return PX.src(MOUNTAIN, { M: '#78716c', m: '#57534e', W: '#f8fafc' }, 20);
    return PX.svg(homeOf('castelo', CHAOS));
  };
  PX.flag = PX.src(['OO......', 'ORRRRO..', 'ORRRRRO.', 'ORRRRO..', 'OO......', 'O.......', 'O.......', 'O.......'], { R: '#ef4444' }, 8);

  // Itens exclusivos da campanha (variações de cor das peças existentes).
  var bracelete = PX.find('bracelete');
  [
    { id: 'mantoFloresta', slot: 'armadura', name: 'Manto da floresta', rarity: 'epico', campaign: 'floresta', shape: 'tunic', pal: { M: '#15803d', m: '#166534', t: '#14532d', G: '#a3e635', B: '#713f12', T: '#166534', W: '#4ade80' }, effect: 'Só existe na campanha. Quem vestiu enfrentou o Lobo da Preguiça.' },
    { id: 'braceleteMercador', slot: 'artefato', name: 'Bracelete do mercador', rarity: 'epico', campaign: 'mercado', attr: 'DIS', icon: [bracelete.icon[0], { G: '#facc15', g: '#ca8a04', M: '#15803d', W: '#ffffff', R: '#facc15', m: '#166534' }], effect: '+5% de ouro em tudo.' },
    { id: 'botasPantano', slot: 'botas', name: 'Botas do pântano', rarity: 'epico', campaign: 'pantano', pal: { K: '#4d7c0f', k: '#365314', s: '#1a2e05' }, effect: 'Só existe na campanha. Atravessaram o Pântano das Tentações.' },
    { id: 'cajadoSaber', slot: 'arma', kind: 'cajado', name: 'Cajado do saber', rarity: 'epico', campaign: 'torre', pal: { C: '#93c5fd', c: '#2563eb', W: '#eff6ff', B: '#e5e7eb', b: '#9ca3af', G: '#facc15' }, effect: '+10% de XP em leitura e estudo.' },
    { id: 'armaduraMontanha', slot: 'armadura', name: 'Armadura da montanha', rarity: 'epico', campaign: 'montanha', shape: 'plate', pal: { M: '#a8a29e', m: '#78716c', t: '#57534e', G: '#65a30d', B: '#44403c', T: '#57534e', W: '#e7e5e4' }, effect: 'Só existe na campanha. Forjada por Tork no topo da montanha.' },
    { id: 'laminaOrdem', slot: 'arma', kind: 'espada', name: 'Lâmina da ordem', rarity: 'mistico', campaign: 'castelo', pal: { W: '#f5d0fe', w: '#a855f7', G: '#facc15', H: '#3b0764', P: '#e879f9' }, effect: 'Venceu o Senhor do Caos. +10% de XP e ouro em tudo.' }
  ].forEach(function (it) { PX.ITEMS.push(it); });
})(window.PX);

/* Entrevista e caixinhas: regiões e chefes novos, pote de moedas. */
(function (PX) {
  var EXTRA_BOSS = {
    ogro: [['....OOOOOOOO....', '...OGGGGGGGGO...', '..OGGGGGGGGGGO..', '.OGGGGGGGGGGGGO.', 'OOGGEEGGGGEEGGOO', 'OGOGGGGGGGGGGOGO', 'OGOGGGGNNGGGGOGO', '.OGGGGGNNGGGGGO.', '.OGGGOOOOOOGGGO.', '.OGGOWOOOOWOGGO.', '..OGGOOOOOOGGO..', '..OGGGGGGGGGGO..', '...OOGGGGGGOO...', '..OBBOOOOOOBBO..', '.OBBBBBBBBBBBBO.', 'OOOOOOOOOOOOOOOO'], { G: '#9a8c6a', E: '#1f2937', N: '#6b5b3e', W: '#f5f5f4', B: '#2563eb' }],
    sombra: [['......OOOO......', '....OOKKKKOO....', '...OKKKKKKKKO...', '..OKKYKKKKKKKO..', '.OKKKKKKKYKKKKO.', '.OKKYKKKKKKKKKO.', 'OKKKKKKRRKKKYKKO', 'OKKKKKRWWRKKKKKO', 'OKKYKKRWWRKKKKKO', 'OKKKKKKRRKKKYKKO', '.OKKKKKKKKKKKKO.', '.OKKKYKKKKKKKKO.', '..OKKKKKKKKKKO..', '.OKO.OKKKKO.OKO.', 'O.O...OKKO...O.O', '.......OO.......'], { K: '#312e81', Y: '#c4b5fd', R: '#7c3aed', W: '#f5f3ff' }]
  };
  var baseBoss = PX.boss;
  PX.boss = function (id) { var b = EXTRA_BOSS[id]; return b ? PX.src(b[0], b[1], 16) : baseBoss(id); };

  var ARENA = ['....OOOOOOOOOOOO....', '..OOSSSSSSSSSSSSOO..', '.OSSDSSDSSDSSDSSDSO.', 'OSSSDSSDSSDSSDSSDSSO', 'OSSSSSSSSSSSSSSSSSSO', 'OSDSSDSSDSSDSSDSSDSO', 'OSDSSDSSDSSDSSDSSDSO', 'OSSSSSSSSSSSSSSSSSSO', 'OOOOOOOOOOOOOOOOOOOO'];
  var baseRegion = PX.region;
  PX.region = function (id) {
    if (id === 'arena') { var g = PX.blank(20, 12); PX.paint(g, PX.grid(['.R..........R.......', '.RR.........RR......', '.O..........O.......'], { R: '#dc2626' }, 20), 0, 0); PX.paint(g, PX.grid(ARENA, { S: '#d6b98c', D: '#7c2d12' }, 20), 0, 3); return PX.svg(g); }
    if (id === 'jardim') {
      var j = PX.blank(18, 17);
      PX.paint(j, PX.tree(Object.assign({}, PX.TIMES.manha, { leaf: '#f9a8d4', leafShade: '#ec4899' })), 4, 0);
      PX.paint(j, PX.grid(['.F...P...F...P..F.', 'GGGGGGGGGGGGGGGGGG'], { F: '#fde047', P: '#f472b6', G: '#22c55e' }, 18), 0, 15);
      return PX.svg(j);
    }
    return baseRegion(id);
  };

  /** Pote de vidro que enche de moedas conforme a caixinha chega perto da meta (0 a 1). */
  PX.jar = function (pct) {
    var rows = ['..OOOOOOOO..', '..OLLLLLLO..', '...OOOOOO...', '..OGGGGGGO..', '.OGGGGGGGGO.', 'OGGGGGGGGGGO', 'OGGGGGGGGGGO', 'OGGGGGGGGGGO', 'OGGGGGGGGGGO', 'OGGGGGGGGGGO', 'OGGGGGGGGGGO', 'OGGGGGGGGGGO', '.OGGGGGGGGO.', '..OOOOOOOO..'];
    var fill = Math.round(Math.max(0, Math.min(1, pct)) * 10);
    rows = rows.map(function (r, y) {
      if (y < 3 || y > 12 || 12 - y >= fill) return r.replace(/G/g, function (c, x) { return x === 2 && y > 4 ? 'H' : 'G'; });
      return r.replace(/G/g, function (c, x) { return (x + y) % 4 === 0 ? 'y' : (x * 3 + y) % 7 === 0 ? 'W' : 'Y'; });
    });
    return PX.src(rows, { L: '#a16207', G: '#bae6fd', H: '#f0f9ff', Y: '#facc15', y: '#ca8a04', W: '#fff7ed' }, 12);
  };

  var lanterna = PX.find('lanterna');
  PX.ITEMS.push(
    { id: 'armaduraArena', slot: 'armadura', name: 'Armadura da arena', rarity: 'epico', campaign: 'arena', shape: 'plate', pal: { M: '#b45309', m: '#92400e', t: '#78350f', G: '#facc15', B: '#451a03', T: '#7c2d12', W: '#fdba74' }, effect: 'Só existe na campanha. Ganha quem tira o Ogro do Sofá.' },
    { id: 'lanternaCalma', slot: 'artefato', name: 'Lanterna da calma', rarity: 'epico', campaign: 'jardim', attr: 'SAB', icon: [lanterna.icon[0], { L: '#bbf7d0', Y: '#4ade80', F: '#16a34a', R: '#f0fdf4', G: '#facc15' }], effect: '+10% de XP em meditação e diário.' }
  );
})(window.PX);

/* Pets novos (com cores), arcos e aljava, colares, anéis, presente e chama. */
(function (PX) {
  function outline(g) {
    var h = g.length, w = g[0].length, add = [];
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      if (g[y][x]) continue;
      var near = [[0, 1], [1, 0], [0, -1], [-1, 0]].some(function (d) { var r = g[y + d[0]]; var c = r && r[x + d[1]]; return c && c !== '#1a1a1f'; });
      if (near) add.push([y, x]);
    }
    add.forEach(function (a) { g[a[0]][a[1]] = '#1a1a1f'; });
    return g;
  }
  PX.outline = outline;

  // ---------- Pets ----------
  var R = {
    coelho: ['..OO....OO..', '.OCCO..OCCO.', '.OCpO..OpCO.', '.OCpO..OpCO.', '.OCCOOOOCCO.', 'OCCCCCCCCCCO', 'OCECCCCCCECO', 'OCCCCNNCCCCO', '.OCCCWWCCCO.', '..OCCCCCCO..', '..OCO..OCO..', '..OO....OO..'],
    coruja: ['.O........O.', 'OBO......OBO', 'OBBOOOOOOBBO', 'OBWWOBBOWWBO', 'OBWEWOOWEWBO', 'OBWWOYYOWWBO', 'OBBBBOOBBBBO', 'OBbBbBBbBbBO', 'OBBbBbbBbBBO', '.OBBbBBbBBO.', '..OOYOOYOO..', '....O..O....'],
    beijaflor: ['.......OOO....', '......OGGGO...', '.....OGEGGO...', 'OOOOOOGGGGO...', '.....ORRGGGO..', '......OGGGGGOO', '...OOOOGGGGGGO', '..OWWWWOGGgGO.', '...OOOOOOgGO..', '.........OO...'],
    esquilo: ['.........OOO..', '..OO....OTTTO.', '.OCCO..OTTTTTO', 'OCECCO.OTTtTTO', 'OCCCCO.OTTTTTO', 'NCCCCCOOTTtTO.', '.OCCWCCOTTTO..', '..OCWCCCOTO...', '..OCWCCCCO....', '..OCCYCCCO....', '..OCOOCOCO....', '..OO..OO.O....'],
    tartaruga: ['...OOOOOO......', '..OSsSSsSO.....', '.OSsSSSSsSO.OO.', 'OSSSsSSsSSSOGEO', 'OOOOOOOOOOOOGGO', '.OGGO....OGGOO.', '.OGGO....OGGO..', '.OOO.....OOO...'],
    raposa: ['.O........O.', 'OKO......OKO', 'OCCOOOOOOCCO', 'OCCCCCCCCCCO', 'OCECCCCCCECO', 'OWWCCNNCCWWO', '.OWWWWWWWWO.', '..OCWWWWCO..', '..OKO..OKO..', '..OO....OO..'],
    sapinho: ['.OOO....OOO.', 'OWEWO..OWEWO', 'OGGGOOOOGGGO', 'OGGGGGGGGGGO', 'OGOOOOOOOOGO', 'OGGGGGGGGGGO', '.OGgGGGGgGO.', 'OGGO.OO.OGGO', 'OOO......OOO'],
    golem: ['...OOOOOO...', '..ORRRRRRO..', '..ORERRERO..', '..ORRRRRRO..', '.OOOMRRMOOO.', 'ORRROOOORRRO', 'ORRRRRRRRRRO', 'ORrRRRRRRrRO', 'OOOORRRROOOO', '...ORrrRO...', '...OROORO...', '...OO..OO...'],
    fenix: ['....F.F.F...', '....FYFYF...', '...OOOOOOO..', '..ORRRRRRRO.', '..ORERRRERO.', '..ORRRYRRRO.', '.OYRRRRRRRYO', 'OYYRRRRRRYYO', '.O.ORRRRO.O.', '...OYYYYO...', '...OY.YO....', '....O.O.....'],
    dragao: ['..........OO....', '.OO......OWWO...', 'OGGO....OWWWWO..', 'OGEGO..OWWWWWO..', 'OGGGGOOOWWWWO...', 'NGGGGGGGOWWO.OO.', '.OOGGGGGGOO.OTO.', '...OGGGBGGGOOTO.', '..OGGGBBBGGGGO..', '..OGGBBBBGGGO...', '..OGGOOOOGGO....', '..OGO....OGO....', '..OO.....OO.....'],
    grifo: ['.OO.............', 'OWWO......OO....', 'OWEWO....OYYO...', 'OWWWWO..OYYYYO..', 'BWWWWWOOYYYYO...', '.OOWWLLLLYYO....', '...OLLLLLLLLO.OO', '...OLLLLLLLLOOTO', '...OLlLLLLlLO.O.', '...OLOOOOOOLO...', '...OLO....OLO...', '...OKO....OKO...', '...OOO....OOO...']
  };
  var gato = PX.PETS.filter(function (p) { return p.id === 'gato'; })[0], cao = PX.PETS.filter(function (p) { return p.id === 'cao'; })[0], cavalo = PX.PETS.filter(function (p) { return p.id === 'cavalo'; })[0];
  var uni = ['O.......................', 'OYO.....................', '.OYO..OO................'].concat(cavalo.rows.slice(1).map(function (r, i) { return i === 0 ? '..OYOOCO................' : r; }));
  function P(id, name, rarity, rows, w, variants, extra) {
    var o = { id: id, name: name, rarity: rarity, rows: rows, w: w, pal: variants[0].pal, variants: variants };
    Object.keys(extra || {}).forEach(function (k) { o[k] = extra[k]; });
    return o;
  }
  var V = function (id, name, pal, rare) { return { id: id, name: name, pal: pal, rare: rare || null }; };
  PX.PETS.length = 0;
  [
    P('gato', 'Gatinho', 'comum', gato.rows, 12, [V('cinza', 'Cinza', { C: '#9ca3af', E: '#22c55e', N: '#f472b6' }), V('laranja', 'Laranja', { C: '#f59e0b', E: '#16a34a', N: '#f472b6' }), V('preto', 'Preto', { C: '#3f3f46', E: '#facc15', N: '#f472b6' }), V('branco', 'Branco', { C: '#f5f5f4', E: '#38bdf8', N: '#f9a8d4' }), V('siames', 'Siamês', { C: '#e7d7c1', E: '#2563eb', N: '#78350f' }), V('galaxia', 'Galáctico', { C: '#4c1d95', E: '#67e8f9', N: '#f0abfc' }, 'visitas100')]),
    P('cao', 'Cãozinho', 'comum', cao.rows, 12, [V('caramelo', 'Caramelo', { B: '#7c4a2d', C: '#c08a4f', E: '#141414', N: '#141414' }), V('preto', 'Preto', { B: '#111827', C: '#374151', E: '#facc15', N: '#000000' }), V('chocolate', 'Chocolate', { B: '#451a03', C: '#78350f', E: '#141414', N: '#141414' }), V('dourado', 'Dourado', { B: '#ca8a04', C: '#facc15', E: '#141414', N: '#141414' }), V('malhado', 'Malhado', { B: '#1f2937', C: '#f5f5f4', E: '#141414', N: '#141414' }), V('fogo', 'Brasa', { B: '#dc2626', C: '#f97316', E: '#fde047', N: '#7f1d1d' }, 'visitas30')]),
    P('coelho', 'Coelho', 'raro', R.coelho, 12, [V('branco', 'Branco', { C: '#f5f5f4', p: '#f9a8d4', E: '#1f2937', N: '#f472b6', W: '#ffffff' }), V('cinza', 'Cinza', { C: '#a1a1aa', p: '#f9a8d4', E: '#1f2937', N: '#f472b6', W: '#ffffff' }), V('marrom', 'Marrom', { C: '#a16207', p: '#fde68a', E: '#1f2937', N: '#f472b6', W: '#ffffff' })]),
    P('coruja', 'Coruja', 'raro', R.coruja, 12, [V('parda', 'Parda', { B: '#92400e', b: '#d6a46b', W: '#fef3c7', E: '#1f2937', Y: '#f59e0b' }), V('neve', 'Das neves', { B: '#e5e7eb', b: '#9ca3af', W: '#ffffff', E: '#1f2937', Y: '#facc15' }), V('noite', 'Da noite', { B: '#312e81', b: '#6366f1', W: '#c7d2fe', E: '#facc15', Y: '#f59e0b' })], { flies: true }),
    P('beijaflor', 'Beija-flor', 'raro', R.beijaflor, 14, [V('esmeralda', 'Esmeralda', { G: '#10b981', g: '#047857', R: '#ef4444', W: '#a7f3d0', E: '#1f2937' }), V('safira', 'Safira', { G: '#3b82f6', g: '#1d4ed8', R: '#f472b6', W: '#bfdbfe', E: '#1f2937' }), V('ametista', 'Ametista', { G: '#a855f7', g: '#7e22ce', R: '#fde047', W: '#e9d5ff', E: '#1f2937' })], { flies: true }),
    P('esquilo', 'Esquilo', 'raro', R.esquilo, 14, [V('ruivo', 'Ruivo', { C: '#c2410c', T: '#ea580c', t: '#fdba74', W: '#fed7aa', E: '#1f2937', N: '#1f2937', Y: '#a16207' }), V('cinza', 'Cinza', { C: '#71717a', T: '#a1a1aa', t: '#e4e4e7', W: '#f4f4f5', E: '#1f2937', N: '#1f2937', Y: '#a16207' }), V('dourado', 'Dourado', { C: '#ca8a04', T: '#facc15', t: '#fef08a', W: '#fef9c3', E: '#1f2937', N: '#1f2937', Y: '#78350f' })]),
    P('tartaruga', 'Tartaruga', 'raro', R.tartaruga, 15, [V('mata', 'Da mata', { S: '#65a30d', s: '#3f6212', G: '#a3e635', E: '#1f2937' }), V('mar', 'Do mar', { S: '#0e7490', s: '#155e75', G: '#67e8f9', E: '#1f2937' }), V('areia', 'Da areia', { S: '#b45309', s: '#78350f', G: '#fde68a', E: '#1f2937' })]),
    P('raposa', 'Raposa', 'raro', R.raposa, 12, [V('vermelha', 'Vermelha', { C: '#ea580c', K: '#1f2937', W: '#fff7ed', E: '#1f2937', N: '#111111' }), V('artica', 'Do ártico', { C: '#e5e7eb', K: '#9ca3af', W: '#ffffff', E: '#2563eb', N: '#111111' }), V('prateada', 'Prateada', { C: '#52525b', K: '#18181b', W: '#d4d4d8', E: '#facc15', N: '#111111' })]),
    P('cavalo', 'Cavalinho', 'raro', cavalo.rows, 24, [V('alazao', 'Alazão', cavalo.pal), V('tordilho', 'Tordilho', { C: '#d4d4d8', c: '#a1a1aa', H: '#52525b', M: '#71717a', N: '#1a1a1f', E: '#141414', K: '#27272a' }), V('preto', 'Preto', { C: '#27272a', c: '#18181b', H: '#0a0a0a', M: '#3f3f46', N: '#000000', E: '#facc15', K: '#52525b' })], { scale: 0.7 }),
    P('lobo', 'Lobo filhote', 'epico', R.raposa, 12, [V('cinza', 'Cinzento', { C: '#6b7280', K: '#374151', W: '#d1d5db', E: '#facc15', N: '#111111' }), V('neve', 'Da neve', { C: '#e5e7eb', K: '#9ca3af', W: '#ffffff', E: '#38bdf8', N: '#111111' }), V('sombra', 'Sombra', { C: '#27272a', K: '#09090b', W: '#52525b', E: '#ef4444', N: '#000000' })]),
    P('sapinho', 'Sapinho do pântano', 'epico', R.sapinho, 12, [V('verde', 'Verde', { G: '#22c55e', g: '#86efac', W: '#ffffff', E: '#1f2937' }), V('azul', 'Azul-veneno', { G: '#2563eb', g: '#93c5fd', W: '#ffffff', E: '#1f2937' }), V('dourado', 'Dourado', { G: '#eab308', g: '#fde047', W: '#ffffff', E: '#1f2937' })]),
    P('golem', 'Golem de pedra', 'epico', R.golem, 12, [V('pedra', 'Pedra', { R: '#a8a29e', r: '#78716c', E: '#fb923c', M: '#65a30d' }), V('lava', 'Lava', { R: '#57534e', r: '#292524', E: '#ef4444', M: '#f97316' }), V('cristal', 'Cristal', { R: '#a5f3fc', r: '#22d3ee', E: '#f0abfc', M: '#e0f2fe' })]),
    P('fenix', 'Fênix filhote', 'epico', R.fenix, 12, [V('chama', 'Chama', { F: '#f97316', Y: '#fde047', R: '#dc2626', E: '#1f2937' }), V('azul', 'Chama azul', { F: '#38bdf8', Y: '#e0f2fe', R: '#2563eb', E: '#1f2937' })], { flies: true }),
    P('dragao', 'Dragãozinho', 'mistico', R.dragao, 16, [V('verde', 'Esmeralda', { G: '#16a34a', B: '#fde68a', W: '#4ade80', T: '#f97316', E: '#facc15', N: '#1a1a1f' }), V('rubi', 'Rubi', { G: '#dc2626', B: '#fde68a', W: '#fb7185', T: '#facc15', E: '#facc15', N: '#1a1a1f' }), V('noite', 'Noite', { G: '#4c1d95', B: '#c4b5fd', W: '#7c3aed', T: '#67e8f9', E: '#67e8f9', N: '#1a1a1f' }), V('ouro', 'Dourado', { G: '#ca8a04', B: '#fef9c3', W: '#fde047', T: '#ef4444', E: '#ef4444', N: '#1a1a1f' }, 'visitas365')], { flies: true }),
    P('grifo', 'Grifo', 'mistico', R.grifo, 16, [V('real', 'Real', { W: '#f5f5f4', E: '#1f2937', B: '#f59e0b', Y: '#d6a46b', L: '#d97706', l: '#b45309', T: '#78350f', K: '#78350f' }), V('tempestade', 'Tempestade', { W: '#e5e7eb', E: '#38bdf8', B: '#facc15', Y: '#64748b', L: '#475569', l: '#334155', T: '#1e293b', K: '#1e293b' })]),
    P('unicornio', 'Unicórnio', 'mistico', uni, 24, [V('perola', 'Pérola', { C: '#f5f5f4', c: '#e5e7eb', H: '#f0abfc', M: '#fbcfe8', N: '#a1a1aa', E: '#1f2937', K: '#d4d4d8', Y: '#fde047' }), V('aurora', 'Aurora', { C: '#e0f2fe', c: '#bae6fd', H: '#a78bfa', M: '#c4b5fd', N: '#a1a1aa', E: '#1f2937', K: '#c4b5fd', Y: '#67e8f9' })], { scale: 0.7 })
  ].forEach(function (p) { PX.PETS.push(p); });
  PX.petSprite = function (id, variant) {
    var p = PX.PETS.filter(function (x) { return x.id === id; })[0];
    var v = (variant && p.variants.filter(function (x) { return x.id === variant; })[0]) || p.variants[0];
    return PX.src(p.rows, v.pal, p.w);
  };

  // ---------- Arcos e aljava ----------
  function bowGrid(pal) {
    var g = PX.blank(7, 17);
    for (var y = 0; y < 17; y++) {
      var wx = Math.round(1 + 3 * Math.sin(Math.PI * y / 16));
      var grip = y >= 7 && y <= 9;
      g[y][wx] = grip ? pal.G : pal.W;
      if (y > 2 && y < 14) g[y][wx + 1] = grip ? pal.G : pal.w;
      if (y >= 1 && y <= 15 && wx > 1) g[y][1] = pal.S;
    }
    g[0][1] = pal.W; g[16][1] = pal.W;
    return outline(g);
  }
  PX.bowGrid = bowGrid;
  PX.bowIcon = function (pal) {
    var g = PX.blank(16, 19);
    PX.paint(g, bowGrid(pal), 6, 1);
    for (var x = 1; x < 14; x++) if (!g[10][x] || g[10][x] === '#1a1a1f' || g[10][x] === pal.S) g[10][x] = pal.A;
    g[10][14] = pal.P; g[10][15] = pal.P; g[9][14] = pal.P; g[11][14] = pal.P;
    g[9][1] = pal.F; g[11][1] = pal.F; g[9][2] = pal.F; g[11][2] = pal.F;
    return PX.svg(outline(g));
  };
  PX.quiverGrid = function (pal) {
    return PX.grid(['.FAF.', '.FAF.', 'OOOOO', 'OQQQO', 'OQqQO', 'OQQQO', 'OQqQO', 'OQQQO', 'OQqQO', 'OQQQO', '.OOO.'], { F: pal.F, A: '#e5e7eb', Q: '#92400e', q: '#78350f' }, 5);
  };

  // ---------- Anel, presente, chama ----------
  var RING = ['......OOOO......', '.....OCWCCO.....', '.....OCCCcO.....', '......OccO......', '....OOGGGGOO....', '...OGGOOOOGGO...', '..OGGO....OGgO..', '..OGO......OgO..', '..OGO......OgO..', '..OGgO....OggO..', '...OGgOOOOggO...', '....OOggggOO....', '......OOOO......'];
  PX.RING = RING;
  PX.gift = function (open) {
    var rows = open ? ['..OO....OO..', '.ORRO..ORRO.', '..OORRRROO..', 'OOOOOOOOOOOO', 'OBBBBRRBBBBO', 'OOOOOOOOOOOO', '............', '.OOOOOOOOOO.', '.OYYYWYYYYO.', '.ObBBRRBBbO.', '.OBBBRRBBBO.', '.ObBBRRBBbO.', '.OBBBRRBBBO.', '.OOOOOOOOOO.'] : ['..OO....OO..', '.ORRO..ORRO.', '..OORRRROO..', 'OOOOOOOOOOOO', 'OBBBBRRBBBBO', 'OOOOOOOOOOOO', '.OBBBRRBBBO.', '.ObBBRRBBbO.', '.OBBBRRBBBO.', '.ObBBRRBBbO.', '.OBBBRRBBBO.', '.OOOOOOOOOO.'];
    return PX.src(rows, { B: '#7c3aed', b: '#6d28d9', R: '#facc15', Y: '#fde68a', W: '#ffffff' }, 12);
  };
  PX.flame = PX.src(['...O....', '..OYO...', '..OYYO..', '.OYRYO..', '.OYRRYO.', 'OYRRWRYO', 'OYRWWRYO', 'OYRRRRYO', '.OYYYYO.', '..OOOO..'], { Y: '#f97316', R: '#fbbf24', W: '#fef9c3' }, 8);
})(window.PX);

/* Acessórios em espaços próprios (colar, anel, item mágico) e itens novos. */
(function (PX) {
  var COLAR = { gota: ['#facc15', '#3b82f6'], coracao: ['#e5e7eb', '#67e8f9'] };
  PX.ITEMS.forEach(function (it) {
    if (it.slot !== 'artefato') return;
    if (COLAR[it.id]) { it.slot = 'colar'; it.neck = COLAR[it.id]; }
    else if (it.id === 'bracelete' || it.id === 'braceleteMercador') it.slot = 'anel';
    else it.slot = 'magico';
  });
  var gota = PX.find('gota').icon[0], grim = PX.find('grimorio').icon[0];
  var bowPal = function (W, w, G, F, P) { return { W: W, w: w, G: G, S: '#e5e7eb', A: W, P: P || '#9ca3af', F: F }; };
  PX.ITEMS.push(
    { id: 'perola', slot: 'colar', name: 'Colar de pérola', rarity: 'raro', neck: ['#f5f5f4', '#fdf4ff'], icon: [gota, { Y: '#f5f5f4', G: '#e5e7eb', B: '#fdf4ff', b: '#e9d5ff', W: '#ffffff' }], effect: '+10% de ouro nos dias com todas as missões feitas.' },
    { id: 'denteLobo', slot: 'colar', name: 'Colar de dente de lobo', rarity: 'epico', neck: ['#78350f', '#f5f5f4'], icon: [gota, { Y: '#78350f', G: '#a16207', B: '#f5f5f4', b: '#d6d3d1', W: '#ffffff' }], effect: '+10% de XP em hábitos de Força.' },
    { id: 'anelFerro', slot: 'anel', name: 'Anel de ferro', rarity: 'comum', icon: [PX.RING, { G: '#9ca3af', g: '#6b7280', C: '#9ca3af', c: '#6b7280', W: '#e5e7eb' }], effect: 'Simples e firme. O primeiro anel de muita gente.' },
    { id: 'anelFoco', slot: 'anel', name: 'Anel do foco', rarity: 'raro', icon: [PX.RING, { G: '#facc15', g: '#ca8a04', C: '#a78bfa', c: '#6d28d9', W: '#ede9fe' }], effect: '+10% de XP em hábitos de Inteligência.' },
    { id: 'anelAurora', slot: 'anel', name: 'Anel da aurora', rarity: 'mistico', req: { DIS: 120, INT: 80 }, crystals: 5, icon: [PX.RING, { G: '#fde68a', g: '#f59e0b', C: '#f0abfc', c: '#c026d3', W: '#ffffff' }], effect: 'O primeiro presente do dia vale o dobro.' },
    { id: 'grimorioEstrelas', slot: 'magico', name: 'Grimório das estrelas', rarity: 'mistico', req: { INT: 150, SAB: 100 }, crystals: 6, icon: [grim, { P: '#1e3a8a', p: '#172554', G: '#fde047', Y: '#fef9c3', C: '#67e8f9', W: '#e0f2fe' }], effect: 'Cada registro no diário acende uma estrela extra no céu.' },
    { id: 'arcoCurto', slot: 'arma', kind: 'arco', name: 'Arco curto', rarity: 'comum', pal: bowPal('#d6a46b', '#a16207', '#78350f', '#ef4444') },
    { id: 'arcoLongo', slot: 'arma', kind: 'arco', name: 'Arco longo de teixo', rarity: 'raro', pal: bowPal('#92400e', '#78350f', '#facc15', '#f5f5f4') },
    { id: 'arcoElfico', slot: 'arma', kind: 'arco', name: 'Arco élfico', rarity: 'epico', pal: bowPal('#86efac', '#16a34a', '#facc15', '#4ade80', '#fde047') },
    { id: 'arcoVento', slot: 'arma', kind: 'arco', name: 'Arco do vento', rarity: 'mistico', req: { AGI: 150, RES: 60 }, crystals: 5, pal: bowPal('#e0f2fe', '#7dd3fc', '#f0abfc', '#ffffff', '#38bdf8'), effect: 'As flechas voltam sozinhas: +1 ouro em cada missão de Agilidade.' }
  );
})(window.PX);

export const PX: any = window.PX;
