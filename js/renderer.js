'use strict';

const Renderer = (() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const W = 800;
  const H = 600;

  // ── Helpers ──────────────────────────────────────────────────────────────

  function clear() {
    ctx.clearRect(0, 0, W, H);
  }

  function fillRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function strokeRect(x, y, w, h, color, lw) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw || 1;
    ctx.strokeRect(x, y, w, h);
  }

  function drawNeon(text, x, y, color, size, glowColor) {
    const gc = glowColor || color;
    ctx.save();
    ctx.shadowColor = gc;
    ctx.shadowBlur = 14;
    ctx.fillStyle = color;
    ctx.font = `${size || 10}px "Press Start 2P", monospace`;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function circle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Stars ─────────────────────────────────────────────────────────────────

  const STARS = (() => {
    const s = [];
    for (let i = 0; i < 120; i++) {
      s.push({ x: Math.random() * W, y: Math.random() * 220, r: Math.random() * 1.4 + 0.3, a: Math.random() * 0.6 + 0.4 });
    }
    return s;
  })();

  function drawStars() {
    STARS.forEach(s => {
      ctx.globalAlpha = s.a;
      circle(s.x, s.y, s.r, '#fff');
    });
    ctx.globalAlpha = 1;
  }

  // ── Overworld ─────────────────────────────────────────────────────────────

  function drawOverworld(locations, nearLocationId, playerX, playerY) {
    // Night sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, 260);
    sky.addColorStop(0, '#05060f');
    sky.addColorStop(1, '#1a1b38');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, 260);

    drawStars();

    // Ground
    fillRect(0, 250, W, H - 250, '#1c1c2e');

    // Sidewalks
    fillRect(0, 250, W, 18, '#2a2a3e');
    fillRect(0, H - 60, W, 60, '#2a2a3e');

    // Road
    fillRect(0, 268, W, H - 328, '#141420');

    // Road lane markings
    ctx.setLineDash([30, 22]);
    ctx.strokeStyle = '#3a3a50';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 380);
    ctx.lineTo(W, 380);
    ctx.stroke();
    ctx.setLineDash([]);

    // Sidewalk edge lines
    ctx.strokeStyle = '#33334a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 268); ctx.lineTo(W, 268); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, H - 60); ctx.lineTo(W, H - 60); ctx.stroke();

    // Trees
    _drawTrees();

    // Buildings
    locations.forEach(loc => {
      const near = (loc.id === nearLocationId);
      _drawBuilding(loc, near);
    });

    // Player
    _drawPlayerOverworld(playerX, playerY);

    // Minimap
    _drawMinimap(locations, playerX, playerY);
  }

  function _drawTrees() {
    const trees = [
      { x: 230, y: 490 }, { x: 290, y: 490 }, { x: 500, y: 490 }, { x: 555, y: 490 },
      { x: 230, y: 300 }, { x: 430, y: 300 }, { x: 550, y: 300 },
    ];
    trees.forEach(t => {
      fillRect(t.x - 2, t.y - 28, 4, 28, '#4a3015');
      ctx.fillStyle = '#1a4a1a';
      ctx.beginPath();
      ctx.arc(t.x, t.y - 32, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e5e1e';
      ctx.beginPath();
      ctx.arc(t.x, t.y - 38, 9, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function _drawBuilding(loc, near) {
    const { id, x, y, w, h } = loc;

    if (near) {
      ctx.save();
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 22;
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
      ctx.restore();

      ctx.save();
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffd700';
      ctx.font = '8px "Press Start 2P", monospace';
      const label = '[ E - GİR ]';
      const lw = ctx.measureText(label).width;
      ctx.fillText(label, x + w / 2 - lw / 2, y - 10);
      ctx.restore();
    }

    switch (id) {
      case 'Mağaram':             _drawMagaram(x, y, w, h); break;
      case 'Deccal Ex':           _drawDeccalEx(x, y, w, h); break;
      case 'Coffeeland XL Plus':  _drawCoffeeland(x, y, w, h); break;
      case 'Maun Sandık Bar':     _drawBar(x, y, w, h); break;
      case "Kanka's Home":        _drawKanka(x, y, w, h); break;
    }
  }

  // ─── Mağaram (modest apartment, purple neon) ─────────────────────────────
  function _drawMagaram(x, y, w, h) {
    fillRect(x, y, w, h, '#2a1f3d');
    fillRect(x, y, w, 8, '#3a2f4d');

    // Brickwork
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 5; col++) {
        const bx = x + col * (w / 5) + (row % 2 === 0 ? 0 : w / 10);
        const by = y + 10 + row * 16;
        strokeRect(bx, by, w / 5 - 1, 14, '#35274a', 0.5);
      }
    }

    // Door
    fillRect(x + w / 2 - 12, y + h - 34, 24, 34, '#1a0f2e');
    fillRect(x + w / 2 - 10, y + h - 32, 20, 30, '#251840');
    circle(x + w / 2 + 7, y + h - 16, 2, '#b8860b');

    // Potted plant outside door
    fillRect(x + w / 2 + 16, y + h - 20, 8, 10, '#6b4c2a');
    fillRect(x + w / 2 + 14, y + h - 20, 12, 3, '#8b6040');
    ctx.fillStyle = '#2d7a2d';
    ctx.beginPath(); ctx.arc(x + w / 2 + 20, y + h - 26, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a9a3a';
    ctx.beginPath(); ctx.arc(x + w / 2 + 22, y + h - 30, 5, 0, Math.PI * 2); ctx.fill();

    // 3x3 Window grid
    const winColors = ['#4a3060', '#f0c060', '#4a3060', '#f0c060', '#4a3060', '#f0c060', '#4a3060', '#4a3060', '#f0c060'];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const wx = x + 8 + col * 32;
        const wy = y + 16 + row * 26;
        fillRect(wx, wy, 20, 18, '#1a1030');
        fillRect(wx + 1, wy + 1, 18, 16, winColors[row * 3 + col]);
        fillRect(wx + 9, wy + 1, 2, 16, '#2a1f3d');
        fillRect(wx + 1, wy + 8, 18, 2, '#2a1f3d');
      }
    }

    drawNeon('MAĞARAM', x + 6, y + h - 38, '#cc88ff', 7, '#aa44ff');
  }

  // ─── Deccal Ex (elegant apartment, pink neon DEVİN) ──────────────────────
  function _drawDeccalEx(x, y, w, h) {
    fillRect(x, y, w, h, '#1e1428');
    for (let i = 0; i < 3; i++) {
      fillRect(x + 8 + i * 34, y, 4, h, '#261c34');
    }
    fillRect(x, y, w, 6, '#3d2855');

    // Double door
    fillRect(x + w / 2 - 20, y + h - 42, 40, 42, '#0d0820');
    fillRect(x + w / 2 - 19, y + h - 41, 18, 40, '#1a1030');
    fillRect(x + w / 2 + 1, y + h - 41, 18, 40, '#1a1030');
    fillRect(x + w / 2 - 17, y + h - 38, 14, 14, '#251840');
    fillRect(x + w / 2 + 3, y + h - 38, 14, 14, '#251840');
    fillRect(x + w / 2 - 17, y + h - 22, 14, 14, '#251840');
    fillRect(x + w / 2 + 3, y + h - 22, 14, 14, '#251840');
    circle(x + w / 2 - 3, y + h - 20, 2, '#c0a050');
    circle(x + w / 2 + 3, y + h - 20, 2, '#c0a050');

    // Intercom nameplate
    fillRect(x + w / 2 + 22, y + h - 32, 16, 10, '#3a3040');
    fillRect(x + w / 2 + 24, y + h - 30, 12, 6, '#555070');

    // Curtained windows
    [
      { wx: x + 10, wy: y + 14, lit: true },
      { wx: x + 42, wy: y + 14, lit: false },
      { wx: x + 74, wy: y + 14, lit: false },
      { wx: x + 10, wy: y + 50, lit: false },
      { wx: x + 74, wy: y + 50, lit: true },
    ].forEach(({ wx, wy, lit }) => {
      fillRect(wx, wy, 24, 22, '#0d0820');
      fillRect(wx + 1, wy + 1, 22, 20, lit ? '#f0d0c0' : '#2a1840');
      fillRect(wx + 1, wy + 1, 5, 20, '#9b59b6');
      fillRect(wx + 18, wy + 1, 5, 20, '#9b59b6');
    });

    drawNeon('DEVİN', x + 22, y + h - 50, '#ff80c0', 9, '#ff40a0');
  }

  // ─── Coffeeland XL Plus (CLEARLY a coffee shop) ───────────────────────────
  function _drawCoffeeland(x, y, w, h) {
    fillRect(x, y, w, h, '#2a1a0a');

    // Warm amber glow
    ctx.save();
    ctx.globalAlpha = 0.18;
    const grd = ctx.createRadialGradient(x + w / 2, y + h / 2, 10, x + w / 2, y + h / 2, w);
    grd.addColorStop(0, '#ffaa44');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(x - 20, y - 20, w + 40, h + 40);
    ctx.restore();

    // Striped awning — full width
    const awningY = y + 10;
    const awningH = 28;
    const stripeW = 10;
    const numStripes = Math.ceil(w / stripeW);
    for (let i = 0; i < numStripes; i++) {
      fillRect(x + i * stripeW, awningY, stripeW, awningH, i % 2 === 0 ? '#cc3300' : '#f5f5f5');
    }
    // Awning scallop edge
    for (let i = 0; i <= numStripes; i++) {
      ctx.fillStyle = '#aa2200';
      ctx.beginPath();
      ctx.arc(x + i * stripeW, awningY + awningH, 5, 0, Math.PI);
      ctx.fill();
    }
    fillRect(x, awningY, w, 3, '#880000');

    // Giant display window
    fillRect(x + 4, awningY + awningH + 2, w - 8, 40, '#0d0806');
    fillRect(x + 5, awningY + awningH + 3, w - 10, 38, '#3d2a10');
    ctx.save();
    ctx.globalAlpha = 0.5;
    fillRect(x + 5, awningY + awningH + 3, w - 10, 38, '#ff9933');
    ctx.restore();

    // Coffee cup silhouettes in window
    [x + 25, x + 55, x + 85].forEach(cx => {
      const cy = awningY + awningH + 20;
      fillRect(cx - 8, cy - 6, 16, 14, '#1a0d00');
      ctx.strokeStyle = '#1a0d00'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx + 9, cy, 5, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      fillRect(cx - 10, cy + 8, 20, 3, '#1a0d00');
    });

    // Coffee cup ICON on facade (large)
    const iconX = x + w / 2;
    const iconY = awningY + awningH + 60;
    fillRect(iconX - 14, iconY - 10, 28, 22, '#8b4513');
    fillRect(iconX - 12, iconY - 8, 24, 18, '#c0702a');
    ctx.strokeStyle = '#8b4513'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(iconX + 16, iconY + 1, 8, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    fillRect(iconX - 16, iconY + 12, 32, 5, '#8b4513');
    // Steam from cup icon
    ctx.strokeStyle = '#ffcc88'; ctx.lineWidth = 2;
    for (let s = -1; s <= 1; s++) {
      ctx.beginPath();
      ctx.moveTo(iconX + s * 7, iconY - 12);
      ctx.bezierCurveTo(iconX + s * 7 - 4, iconY - 20, iconX + s * 7 + 4, iconY - 24, iconX + s * 7, iconY - 30);
      ctx.stroke();
    }

    // Door
    fillRect(x + w / 2 - 14, y + h - 38, 28, 38, '#2a1505');
    fillRect(x + w / 2 - 12, y + h - 36, 24, 34, '#3d2010');
    circle(x + w / 2 + 8, y + h - 18, 2, '#c8960c');

    drawNeon('COFFEE', x + 8, y + h - 48, '#00ffff', 8, '#00ccff');
  }

  // ─── Maun Sandık Bar (CLEARLY a bar — basement feel) ─────────────────────
  function _drawBar(x, y, w, h) {
    fillRect(x, y, w, h, '#0d0d0d');

    // Stone texture
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 7; col++) {
        const shade = (row + col) % 2 === 0 ? '#111111' : '#0a0a0a';
        fillRect(x + col * Math.floor(w / 7), y + row * Math.floor(h / 8), Math.floor(w / 7) - 1, Math.floor(h / 8) - 1, shade);
      }
    }

    // Steps going down — basement feel
    for (let s = 0; s < 4; s++) {
      const sw = w - s * 12;
      const sx = x + s * 6;
      const sy = y + h - 16 + s * 4;
      fillRect(sx, sy, sw, 4, `hsl(0,0%,${15 + s * 4}%)`);
      fillRect(sx, sy, sw, 1, '#333');
    }

    // Heavy door (inset)
    fillRect(x + w / 2 - 18, y + h - 55, 36, 45, '#1a0a00');
    fillRect(x + w / 2 - 16, y + h - 53, 32, 41, '#220e00');
    for (let sy2 = 0; sy2 < 3; sy2++) {
      for (let sx2 = 0; sx2 < 3; sx2++) {
        circle(x + w / 2 - 10 + sx2 * 10, y + h - 48 + sy2 * 12, 2, '#444');
      }
    }

    // Barred small windows
    [x + 10, x + w - 32].forEach(wx => {
      const wy = y + 20;
      fillRect(wx, wy, 22, 18, '#0d0d0d');
      fillRect(wx + 1, wy + 1, 20, 16, '#330a00');
      ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
      for (let b = 0; b < 4; b++) {
        ctx.beginPath();
        ctx.moveTo(wx + 4 + b * 5, wy);
        ctx.lineTo(wx + 4 + b * 5, wy + 18);
        ctx.stroke();
      }
    });

    // PIXEL-ART BEER MUG on facade
    const mugX = x + w / 2 - 2;
    const mugY = y + 50;
    fillRect(mugX - 10, mugY, 20, 26, '#cc8800');
    fillRect(mugX - 8, mugY + 2, 16, 20, '#ffcc00');
    // Foam
    fillRect(mugX - 12, mugY - 6, 24, 8, '#ffffff');
    ctx.fillStyle = '#f0f0f0';
    [mugX - 8, mugX, mugX + 6].forEach(bx => {
      ctx.beginPath(); ctx.arc(bx, mugY - 6, 4, 0, Math.PI * 2); ctx.fill();
    });
    ctx.strokeStyle = '#cc8800'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(mugX + 14, mugY + 12, 7, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    ctx.strokeStyle = '#994400'; ctx.lineWidth = 1;
    ctx.strokeRect(mugX - 10, mugY, 20, 26);

    // Green OPEN neon box
    ctx.save();
    ctx.shadowColor = '#00ff44'; ctx.shadowBlur = 18;
    fillRect(x + w - 40, y + 45, 36, 16, '#001a00');
    ctx.fillStyle = '#00ff44';
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText('OPEN', x + w - 36, y + 57);
    ctx.restore();

    // Orange neon text
    drawNeon('MAUN', x + 5, y + h - 52, '#ff8800', 6, '#ff6600');
    drawNeon('SANDIK BAR', x + 5, y + h - 40, '#ff8800', 6, '#ff6600');
  }

  // ─── Kanka's Home (casual Istanbul apartment, balcony) ────────────────────
  function _drawKanka(x, y, w, h) {
    fillRect(x, y, w, h, '#1a2030');
    fillRect(x, y, w, 6, '#252e40');

    // Istanbul-style balcony
    const balX = x + 10;
    const balY = y + 20;
    const balW = w - 20;
    const balH = 30;
    fillRect(balX, balY, balW, balH, '#1e2840');
    fillRect(balX, balY + balH, balW, 4, '#2a3450');
    // Railing
    fillRect(balX, balY, balW, 3, '#3a4a60');
    for (let i = 0; i <= Math.floor(balW / 8); i++) {
      fillRect(balX + i * 8, balY, 2, balH + 4, '#2a3450');
    }
    // Items: plant + laundry + bicycle wheel
    fillRect(balX + 4, balY + 8, 8, 10, '#5a3a1a');
    ctx.fillStyle = '#2a7a2a';
    ctx.beginPath(); ctx.arc(balX + 8, balY + 6, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(balX + 20, balY + 4); ctx.lineTo(balX + 70, balY + 6); ctx.stroke();
    fillRect(balX + 34, balY + 6, 10, 12, '#5588aa');
    ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(balX + 60, balY + 18, 8, 0, Math.PI * 2); ctx.stroke();

    // Windows
    [
      { wx: x + 12, wy: balY + balH + 8, lit: true },
      { wx: x + 50, wy: balY + balH + 8, lit: false },
      { wx: x + 88, wy: balY + balH + 8, lit: true },
      { wx: x + 30, wy: y + h - 60, lit: true },
    ].forEach(({ wx, wy, lit }) => {
      fillRect(wx, wy, 28, 22, '#0d1018');
      fillRect(wx + 1, wy + 1, 26, 20, lit ? '#f5d89a' : '#1a2030');
      for (let sl = 0; sl < 3; sl++) {
        fillRect(wx + 1, wy + 1 + sl * 6, 26, 2, lit ? '#e0c070' : '#151e2d');
      }
    });

    // Shoes near door
    fillRect(x + w / 2 - 22, y + h - 8, 10, 5, '#aa3300');
    fillRect(x + w / 2 - 10, y + h - 8, 10, 5, '#883300');

    // Door
    fillRect(x + w / 2 - 14, y + h - 38, 28, 38, '#151e2d');
    fillRect(x + w / 2 - 12, y + h - 36, 24, 34, '#1e2840');
    circle(x + w / 2 + 8, y + h - 18, 2, '#8b9bab');

    drawNeon("KANKA'S", x + 8, y + h - 48, '#44ff88', 7, '#22ee66');
  }

  // ── Player (top-down) ─────────────────────────────────────────────────────

  function _drawPlayerOverworld(px, py) {
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(px, py + 12, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    fillRect(px - 6, py - 4, 12, 12, '#f0c060');
    circle(px, py - 8, 7, '#f5d070');
    circle(px - 2, py - 9, 1.2, '#1a1020');
    circle(px + 2, py - 9, 1.2, '#1a1020');
    fillRect(px - 6, py - 14, 12, 5, '#2a1a0a');
    fillRect(px - 6, py + 7, 5, 4, '#3a2a1a');
    fillRect(px + 1, py + 7, 5, 4, '#3a2a1a');
  }

  // ── Minimap ───────────────────────────────────────────────────────────────

  function _drawMinimap(locations, playerX, playerY) {
    const mx = 8, my = 8, mw = 90, mh = 70;
    const scaleX = mw / W;
    const scaleY = mh / H;

    ctx.globalAlpha = 0.75;
    fillRect(mx, my, mw, mh, '#0a0a14');
    ctx.globalAlpha = 1;
    strokeRect(mx, my, mw, mh, '#444466', 1);

    const locColors = {
      'Mağaram': '#9966cc',
      'Deccal Ex': '#cc66aa',
      'Coffeeland XL Plus': '#cc8833',
      'Maun Sandık Bar': '#cc4400',
      "Kanka's Home": '#44aa66',
    };
    locations.forEach(loc => {
      const lx = mx + loc.x * scaleX;
      const ly = my + loc.y * scaleY;
      const lw = loc.w * scaleX;
      const lh = loc.h * scaleY;
      fillRect(lx, ly, lw, lh, locColors[loc.id] || '#888');
    });

    const pdx = mx + playerX * scaleX;
    const pdy = my + playerY * scaleY;
    circle(pdx, pdy, 3, '#fff');

    ctx.fillStyle = '#aaaacc';
    ctx.font = '5px "Press Start 2P", monospace';
    ctx.fillText('HARİTA', mx + 2, my + mh + 8);
  }

  // ── Location scene ────────────────────────────────────────────────────────

  function drawLocationScene(id) {
    switch (id) {
      case 'Deccal Ex':          _scDeccalEx(); break;
      case 'Coffeeland XL Plus': _scCoffeeland(); break;
      case 'Maun Sandık Bar':    _scBar(); break;
      case "Kanka's Home":       _scKanka(); break;
      case 'Mağaram':            _scMagaram(); break;
      default: fillRect(0, 0, W, H, '#111');
    }
    _drawPlayerHead();
  }

  function _drawPlayerHead() {
    const px = 80, py = H - 60;
    ctx.globalAlpha = 0.92;
    fillRect(px - 30, py + 10, 60, 80, '#0a0810');
    circle(px, py, 32, '#0a0810');
    ctx.globalAlpha = 1;
  }

  function _scDeccalEx() {
    fillRect(0, 0, W, H, '#1a0f28');

    const floor = ctx.createLinearGradient(0, 450, 0, H);
    floor.addColorStop(0, '#2a1f3d');
    floor.addColorStop(1, '#1a1030');
    ctx.fillStyle = floor;
    ctx.fillRect(0, 450, W, H - 450);

    fillRect(0, 0, W, 100, '#110820');
    fillRect(0, 100, 180, 360, '#251838');
    fillRect(620, 100, 180, 360, '#251838');

    // Wallpaper stripes
    for (let i = 0; i < 30; i++) {
      ctx.globalAlpha = 0.12;
      fillRect(180 + i * 22, 100, 2, 350, '#cc88ff');
    }
    ctx.globalAlpha = 1;

    // Door frame
    fillRect(310, 100, 180, 360, '#1a0f28');
    fillRect(314, 104, 172, 356, '#0d0815');
    fillRect(310, 100, 180, 8, '#3a2855');
    fillRect(310, 100, 8, 360, '#3a2855');
    fillRect(482, 100, 8, 360, '#3a2855');

    // Floor tiles
    ctx.strokeStyle = '#3a2855'; ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath(); ctx.moveTo(i * 80, 450); ctx.lineTo(i * 80, H); ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(0, 450 + i * 40); ctx.lineTo(W, 450 + i * 40); ctx.stroke();
    }

    // Potted plant
    fillRect(520, 360, 20, 90, '#3a2010');
    fillRect(514, 355, 32, 8, '#5a3020');
    ctx.fillStyle = '#2a7a2a'; ctx.beginPath(); ctx.arc(530, 345, 20, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a9a3a'; ctx.beginPath(); ctx.arc(540, 334, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a8a2a'; ctx.beginPath(); ctx.arc(520, 332, 13, 0, Math.PI * 2); ctx.fill();

    // Photo frames
    [{ x: 188, y: 150 }, { x: 188, y: 240 }, { x: 570, y: 180 }].forEach(f => {
      fillRect(f.x, f.y, 55, 65, '#3a2855');
      fillRect(f.x + 3, f.y + 3, 49, 59, '#0d0815');
      fillRect(f.x + 5, f.y + 5, 45, 55, '#2a1840');
      circle(f.x + 27, f.y + 26, 11, '#cc88ff');
      fillRect(f.x + 13, f.y + 38, 28, 14, '#aa66ee');
    });

    // Ambient pink light
    ctx.save();
    ctx.globalAlpha = 0.15;
    const pinkGrd = ctx.createRadialGradient(0, 300, 10, 0, 300, 220);
    pinkGrd.addColorStop(0, '#ff80c0'); pinkGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = pinkGrd; ctx.fillRect(0, 100, 350, 400);
    ctx.restore();

    // NPC Devin
    _drawNPCDevin(520, 190);
  }

  function _drawNPCDevin(x, y) {
    fillRect(x - 30, y + 80, 60, 130, '#4a1a5a');
    fillRect(x - 8, y + 68, 16, 20, '#c07080');
    circle(x, y + 50, 36, '#c07080');
    // Long dark hair
    fillRect(x - 34, y + 18, 68, 96, '#1a0a1a');
    fillRect(x - 40, y + 28, 14, 76, '#1a0a1a');
    fillRect(x + 26, y + 28, 14, 76, '#1a0a1a');
    // Face
    circle(x, y + 50, 29, '#c07080');
    // Sad eyes
    ctx.fillStyle = '#2a1040';
    ctx.beginPath(); ctx.ellipse(x - 10, y + 44, 5, 4, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 10, y + 44, 5, 4, 0.2, 0, Math.PI * 2); ctx.fill();
    // Tear
    ctx.fillStyle = '#aaddff';
    ctx.beginPath(); ctx.ellipse(x - 10, y + 53, 2, 4, 0, 0, Math.PI * 2); ctx.fill();
    // Sad mouth
    ctx.strokeStyle = '#8a4050'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y + 63, 8, 0.2, Math.PI - 0.2); ctx.stroke();
    // Earrings
    circle(x - 36, y + 56, 4, '#cc88ff');
    circle(x + 36, y + 56, 4, '#cc88ff');
    circle(x - 36, y + 63, 3, '#ff88cc');
    circle(x + 36, y + 63, 3, '#ff88cc');
  }

  function _scCoffeeland() {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1a1005');
    bg.addColorStop(1, '#2a1a08');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Wooden floor
    for (let i = 0; i < 10; i++) {
      fillRect(i * 80, 420, 78, H - 420, i % 2 === 0 ? '#3d2010' : '#2d1808');
    }
    ctx.strokeStyle = '#1a0e04'; ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath(); ctx.moveTo(i * 80, 420); ctx.lineTo(i * 80, H); ctx.stroke();
    }

    fillRect(0, 0, W, 80, '#120c04');

    // Hanging lights
    [150, 350, 550, 700].forEach(lx => {
      ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 80); ctx.stroke();
      ctx.save(); ctx.shadowColor = '#ffaa44'; ctx.shadowBlur = 30;
      fillRect(lx - 12, 78, 24, 12, '#ffcc66');
      ctx.restore();
    });

    // Window with morning light
    fillRect(540, 80, 200, 230, '#0d0805');
    const wLight = ctx.createLinearGradient(545, 80, 740, 310);
    wLight.addColorStop(0, '#ffe8a0');
    wLight.addColorStop(0.5, '#ffcc60');
    wLight.addColorStop(1, '#ff9920');
    ctx.fillStyle = wLight; ctx.fillRect(545, 82, 193, 226);
    ctx.strokeStyle = '#5a3a10'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(641, 82); ctx.lineTo(641, 308); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(545, 195); ctx.lineTo(738, 195); ctx.stroke();

    // Morning light ray on floor
    ctx.save(); ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#ffcc60';
    ctx.beginPath();
    ctx.moveTo(545, 308); ctx.lineTo(738, 308); ctx.lineTo(W, H); ctx.lineTo(380, H);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // Wooden counter
    fillRect(20, 310, 440, 140, '#5a3010');
    fillRect(20, 308, 440, 12, '#7a4a20');
    fillRect(20, 308, 8, 142, '#7a4a20');
    fillRect(452, 308, 8, 142, '#7a4a20');
    fillRect(14, 304, 450, 8, '#8b5a24');

    // Display shelf
    fillRect(30, 150, 220, 8, '#5a3010');
    fillRect(30, 192, 220, 8, '#5a3010');
    fillRect(30, 234, 220, 8, '#5a3010');
    // Bottles
    ['#8b0000', '#004488', '#006600', '#884400', '#440088'].forEach((bc, i) => {
      const bx = 44 + i * 40;
      fillRect(bx, 158, 12, 34, bc);
      fillRect(bx + 3, 153, 6, 6, bc);
      circle(bx + 6, 152, 3, '#ccc');
    });

    // Coffee machine
    fillRect(100, 230, 70, 80, '#2a2a2a');
    fillRect(106, 236, 58, 34, '#1a1a1a');
    fillRect(112, 242, 46, 22, '#333');
    // Steam
    ctx.strokeStyle = '#aaaaaa'; ctx.lineWidth = 2;
    for (let s = 0; s < 3; s++) {
      ctx.globalAlpha = 0.5 - s * 0.1;
      ctx.beginPath();
      ctx.moveTo(120 + s * 12, 230);
      ctx.bezierCurveTo(115 + s * 12, 215, 128 + s * 12, 205, 122 + s * 12, 190);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // NPC Barista
    _drawNPCBarista(580, 240);
  }

  function _drawNPCBarista(x, y) {
    fillRect(x - 32, y + 75, 64, 120, '#5a3a20');
    fillRect(x - 28, y + 72, 56, 124, '#ffffff');
    fillRect(x - 20, y + 72, 40, 124, '#e8e8e8');
    ctx.strokeStyle = '#ccc'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 20, y + 72); ctx.lineTo(x - 32, y + 84); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 20, y + 72); ctx.lineTo(x + 32, y + 84); ctx.stroke();
    fillRect(x - 8, y + 62, 16, 18, '#d09060');
    circle(x, y + 44, 34, '#d09060');
    ctx.fillStyle = '#2a1a0a';
    ctx.beginPath(); ctx.ellipse(x, y + 13, 34, 22, 0, 0, Math.PI * 2); ctx.fill();
    fillRect(x - 34, y + 12, 68, 30, '#2a1a0a');
    circle(x, y + 44, 28, '#d09060');
    // Eyes
    ctx.fillStyle = '#1a0a0a';
    ctx.beginPath(); ctx.ellipse(x - 9, y + 40, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 9, y + 40, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
    // Smile
    ctx.strokeStyle = '#8a5030'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y + 54, 9, Math.PI + 0.3, Math.PI * 2 - 0.3); ctx.stroke();
    // Blush
    ctx.globalAlpha = 0.3; ctx.fillStyle = '#ff8888';
    ctx.beginPath(); ctx.ellipse(x - 18, y + 52, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 18, y + 52, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function _scBar() {
    fillRect(0, 0, W, H, '#0a0806');

    // Stone walls
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 12; col++) {
        fillRect(col * 68, row * 80, 66, 78, (row + col) % 2 === 0 ? '#111008' : '#0d0d06');
      }
    }

    // Dark floor
    for (let i = 0; i < 8; i++) {
      fillRect(i * 100, 420, 99, H - 420, i % 2 === 0 ? '#1a1208' : '#141006');
    }

    // Bar counter
    fillRect(0, 270, 360, 180, '#1a1005');
    fillRect(0, 267, 365, 10, '#3a2810');
    // Stools
    [60, 150, 240, 320].forEach(sx => {
      fillRect(sx - 14, 428, 28, 10, '#3a2810');
      fillRect(sx - 2, 438, 4, 32, '#2a2010');
      circle(sx, 472, 8, '#1a1008');
    });
    // Glasses
    [40, 100, 160, 210, 270].forEach(gx => {
      fillRect(gx, 256, 12, 14, '#334455');
      fillRect(gx + 2, 257, 8, 12, '#445566');
    });
    // Beer tap
    fillRect(180, 195, 8, 75, '#3a3020');
    fillRect(175, 190, 18, 10, '#5a4a20');
    circle(179, 194, 4, '#cc8800');

    // Neon signs
    drawNeon('BIRA', 400, 100, '#ff4400', 12, '#ff2200');
    drawNeon('KOKTEYLLER', 390, 145, '#ff00aa', 9, '#ff0088');

    // Pool table
    fillRect(420, 310, 170, 110, '#005500');
    strokeRect(420, 310, 170, 110, '#2a1a00', 6);
    [450, 480, 510, 540, 570].forEach(px => { circle(px, 365, 7, '#cc0000'); });
    circle(570, 365, 7, '#ffffff');
    ctx.strokeStyle = '#8b6010'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(370, 405); ctx.lineTo(570, 363); ctx.stroke();

    _drawNPCBartender(290, 185);
  }

  function _drawNPCBartender(x, y) {
    fillRect(x - 28, y + 80, 56, 120, '#1a1a1a');
    fillRect(x + 14, y + 80, 20, 42, '#ddd');
    fillRect(x + 16, y + 82, 16, 38, '#f5f5f5');
    fillRect(x - 8, y + 65, 16, 22, '#b07050');
    ctx.fillStyle = '#b07050';
    ctx.beginPath(); ctx.ellipse(x, y + 48, 35, 40, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.4; ctx.fillStyle = '#5a3020';
    ctx.beginPath(); ctx.ellipse(x, y + 64, 24, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#2a1a0a';
    ctx.beginPath(); ctx.ellipse(x, y + 13, 36, 24, 0, 0, Math.PI * 2); ctx.fill();
    fillRect(x - 36, y + 14, 72, 22, '#2a1a0a');
    ctx.fillStyle = '#b07050';
    ctx.beginPath(); ctx.ellipse(x, y + 48, 29, 32, 0, 0, Math.PI * 2); ctx.fill();
    fillRect(x - 22, y + 32, 18, 4, '#2a1a0a');
    fillRect(x + 4, y + 32, 18, 4, '#2a1a0a');
    ctx.fillStyle = '#1a0a0a';
    ctx.beginPath(); ctx.ellipse(x - 13, y + 42, 4, 5, 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 13, y + 42, 4, 5, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a5030'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 10, y + 60); ctx.lineTo(x + 10, y + 60); ctx.stroke();
  }

  function _scKanka() {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0d1018');
    bg.addColorStop(1, '#1a2030');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Floor
    for (let i = 0; i < 8; i++) {
      fillRect(i * 100, 430, 99, H - 430, i % 2 === 0 ? '#1a2428' : '#151e22');
    }
    // Rug
    fillRect(100, 430, 420, 110, '#4a1a1a');
    fillRect(108, 438, 404, 94, '#3a1414');
    ctx.strokeStyle = '#6a2a2a'; ctx.lineWidth = 2;
    ctx.strokeRect(118, 446, 384, 78);
    ctx.strokeRect(132, 454, 356, 62);

    // Sofa
    fillRect(90, 370, 300, 90, '#2a3a4a');
    fillRect(90, 367, 300, 12, '#3a4a5a');
    fillRect(90, 370, 22, 90, '#3a4a5a');
    fillRect(368, 370, 22, 90, '#3a4a5a');
    [120, 178, 236, 298].forEach(cx => {
      fillRect(cx, 378, 48, 50, '#5a2a4a');
      fillRect(cx + 3, 381, 42, 44, '#6a3a5a');
    });

    // Bookshelves
    fillRect(560, 80, 200, 380, '#2a1a08');
    for (let shelf = 0; shelf < 7; shelf++) {
      fillRect(560, 80 + shelf * 54, 200, 5, '#3a2a12');
      let bookX = 564;
      while (bookX < 752) {
        const bw = 8 + Math.floor((bookX * 7 + shelf * 13) % 12);
        const bh = 28 + (bookX + shelf) % 18;
        fillRect(bookX, 80 + shelf * 54 + 5 - bh + 46, bw, bh, `hsl(${(bookX * 3 + shelf * 47) % 360},50%,28%)`);
        bookX += bw + 1;
      }
    }

    // TV (off)
    fillRect(180, 110, 300, 200, '#0a0a0a');
    fillRect(186, 116, 288, 188, '#0d0d14');
    fillRect(192, 122, 276, 176, '#050508');
    fillRect(270, 308, 120, 22, '#1a1a28');
    fillRect(296, 328, 68, 8, '#1a1a28');

    // Window (night view)
    fillRect(0, 70, 150, 240, '#0d1018');
    fillRect(5, 76, 140, 228, '#05080f');
    ctx.fillStyle = '#05080f'; ctx.fillRect(6, 77, 138, 226);
    for (let ws = 0; ws < 25; ws++) {
      circle(12 + (ws * 37) % 128, 82 + (ws * 19) % 214, 1, '#fff');
    }
    ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 4;
    ctx.strokeRect(3, 73, 146, 234);
    ctx.beginPath(); ctx.moveTo(76, 73); ctx.lineTo(76, 307); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(3, 190); ctx.lineTo(149, 190); ctx.stroke();

    _drawNPCKanka(570, 220);
  }

  function _drawNPCKanka(x, y) {
    ctx.fillStyle = '#2a3a50';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x - 36, y + 82, 72, 130, 8);
    } else {
      ctx.rect(x - 36, y + 82, 72, 130);
    }
    ctx.fill();
    fillRect(x - 22, y + 152, 44, 24, '#22304a');
    // Phone in hand
    fillRect(x + 22, y + 120, 24, 40, '#0a0a10');
    fillRect(x + 24, y + 122, 20, 36, '#1a2a40');
    ctx.save(); ctx.shadowColor = '#4488ff'; ctx.shadowBlur = 10;
    fillRect(x + 25, y + 124, 18, 32, '#0a1a30');
    ctx.restore();
    fillRect(x - 8, y + 67, 16, 20, '#c09060');
    circle(x, y + 46, 33, '#c09060');
    ctx.fillStyle = '#1a1208';
    ctx.beginPath(); ctx.ellipse(x, y + 18, 35, 26, 0, 0, Math.PI * 2); ctx.fill();
    fillRect(x - 35, y + 12, 70, 30, '#1a1208');
    for (let sp = 0; sp < 5; sp++) {
      ctx.fillStyle = '#1a1208';
      ctx.beginPath();
      ctx.moveTo(x - 32 + sp * 18, y + 12);
      ctx.lineTo(x - 24 + sp * 18, y - 2);
      ctx.lineTo(x - 14 + sp * 18, y + 12);
      ctx.fill();
    }
    circle(x, y + 46, 27, '#c09060');
    ctx.fillStyle = '#1a0a0a';
    ctx.beginPath(); ctx.ellipse(x - 9, y + 41, 4, 5, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 9, y + 41, 4, 5, 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a5030'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y + 54, 8, Math.PI + 0.5, Math.PI * 2 - 0.5); ctx.stroke();
  }

  function _scMagaram() {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0f0a18');
    bg.addColorStop(1, '#1a1428');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 10; i++) {
      fillRect(i * 80, 430, 79, H - 430, i % 2 === 0 ? '#1a1428' : '#14102a');
    }

    // Bed
    fillRect(460, 290, 300, 190, '#3a2850');
    fillRect(460, 288, 300, 32, '#5a3a70');
    fillRect(470, 320, 280, 158, '#e8d8f0');
    fillRect(488, 322, 110, 55, '#ffffff');
    fillRect(622, 322, 90, 55, '#f5f5f5');

    // Kitchen counter
    fillRect(0, 300, 380, 180, '#2a1a08');
    fillRect(0, 296, 386, 12, '#4a2a12');
    // Sink
    fillRect(30, 278, 80, 22, '#3a3a4a');
    fillRect(34, 280, 72, 18, '#2a2a3a');
    circle(70, 273, 5, '#6a6a8a');
    // Moka pot
    _drawMokaPot(190, 240, 1.0);

    // Night window
    fillRect(600, 70, 160, 160, '#0a0a14');
    for (let ws = 0; ws < 15; ws++) {
      circle(612 + (ws * 23) % 142, 80 + (ws * 17) % 144, 1, '#ffffcc');
    }
    ctx.strokeStyle = '#3a2855'; ctx.lineWidth = 4;
    ctx.strokeRect(598, 68, 164, 164);
    ctx.beginPath(); ctx.moveTo(680, 68); ctx.lineTo(680, 232); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(598, 150); ctx.lineTo(762, 150); ctx.stroke();

    // Purple lamp
    fillRect(420, 190, 6, 110, '#3a2855');
    fillRect(394, 184, 58, 10, '#5a3a7a');
    ctx.save(); ctx.shadowColor = '#aa44cc'; ctx.shadowBlur = 40;
    fillRect(396, 194, 52, 6, '#cc88ff');
    ctx.restore();
  }

  // ── Memory / Flashback scenes ──────────────────────────────────────────────

  function drawMemoryScene(id) {
    switch (id) {
      case 'coffee_argument': _memCoffeeArgument(); break;
      case 'phone_message':   _memPhoneMessage(); break;
      case 'bar_night':       _memBarNight(); break;
      case 'ex_memory':       _memExMemory(); break;
      default: fillRect(0, 0, W, H, '#1a1a20');
    }
  }

  function _memVignette() {
    const vig = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 500);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  function _applySepiaOverlay() {
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#6a5020';
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#c8a050';
    ctx.globalCompositeOperation = 'screen';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function _memCoffeeArgument() {
    fillRect(0, 0, W, H, '#3d2a10');
    fillRect(0, 390, W, H - 390, '#2a1808');
    fillRect(0, 0, W, 80, '#1a0e04');

    // Window
    fillRect(570, 80, 170, 200, '#5a4020');
    fillRect(576, 86, 158, 188, '#8a6030');

    // Table
    fillRect(280, 320, 240, 14, '#4a3010');
    fillRect(300, 333, 8, 90, '#3a2808');
    fillRect(500, 333, 8, 90, '#3a2808');

    // Two silhouettes facing each other
    ctx.fillStyle = '#0a0806';
    ctx.beginPath(); ctx.ellipse(285, 272, 23, 28, 0.15, 0, Math.PI * 2); ctx.fill();
    fillRect(262, 296, 46, 72, '#0a0806');
    fillRect(268, 318, 44, 8, '#0a0806');

    ctx.fillStyle = '#0d0a08';
    ctx.beginPath(); ctx.ellipse(518, 270, 23, 28, -0.15, 0, Math.PI * 2); ctx.fill();
    fillRect(495, 294, 46, 74, '#0d0a08');
    fillRect(498, 306, 52, 10, '#0d0a08');
    fillRect(502, 318, 48, 10, '#0d0a08');

    [324, 472].forEach(cx => {
      fillRect(cx - 6, 314, 12, 10, '#6a4010');
      fillRect(cx - 8, 322, 16, 3, '#5a3008');
    });

    _applySepiaOverlay();
    _memVignette();

    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#f0e0b0';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText('ANISINDA... COFFEELAND, DÜN GECE', 20, 558);
    ctx.restore();
  }

  function _memPhoneMessage() {
    fillRect(0, 0, W, H, '#050508');

    ctx.save();
    ctx.shadowColor = '#4488ff'; ctx.shadowBlur = 80; ctx.globalAlpha = 0.3;
    circle(W / 2, H / 2, 120, '#4488ff');
    ctx.restore();

    const px = W / 2 - 95, py = H / 2 - 170;
    ctx.save();
    ctx.shadowColor = '#2255aa'; ctx.shadowBlur = 30;
    fillRect(px, py, 190, 340, '#0a0a12');
    ctx.restore();
    fillRect(px + 2, py + 2, 186, 336, '#111120');
    fillRect(px + 76, py + 4, 38, 8, '#0a0a14');
    circle(px + 95, py + 8, 4, '#0d0d18');

    ctx.save();
    ctx.shadowColor = '#3366cc'; ctx.shadowBlur = 20;
    fillRect(px + 8, py + 22, 174, 296, '#0a1428');
    ctx.restore();

    // Notification glow
    ctx.save();
    ctx.globalAlpha = 0.15;
    const notifGrd = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 190);
    notifGrd.addColorStop(0, '#4488ff'); notifGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = notifGrd; ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Message bubble
    ctx.fillStyle = '#1e3050';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(px + 12, py + 78, 162, 120, 14);
    } else {
      ctx.rect(px + 12, py + 78, 162, 120);
    }
    ctx.fill();

    ctx.fillStyle = '#e0eeff';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText('Çok garip bir', px + 20, py + 108);
    ctx.fillText('geceydi.', px + 20, py + 124);
    ctx.fillText('Teşekkür ederim', px + 20, py + 146);
    ctx.fillText('yine de.', px + 20, py + 162);

    ctx.fillStyle = '#8899bb';
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText('—D', px + 124, py + 184);

    ctx.fillStyle = '#445566';
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillText('03:47', px + 114, py + 204);

    _memVignette();

    ctx.fillStyle = '#8899bb';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText('ANISINDA... BİR MESAJ', 20, 558);
  }

  function _memBarNight() {
    fillRect(0, 0, W, H, '#1a1208');

    // Crowd silhouettes
    for (let i = 0; i < 18; i++) {
      const cx = 30 + i * 44;
      const cy = 280 + (i % 3) * 20;
      const ch = 120 + (i % 4) * 20;
      ctx.fillStyle = i % 2 === 0 ? '#0a0806' : '#0d0a06';
      ctx.beginPath(); ctx.ellipse(cx, cy - ch + 20, 14, 17, 0, 0, Math.PI * 2); ctx.fill();
      fillRect(cx - 16, cy - ch + 36, 32, ch, i % 2 === 0 ? '#0a0806' : '#0d0a06');
    }

    fillRect(0, 310, 310, 140, '#120e04');
    fillRect(0, 307, 315, 8, '#2a2010');

    drawNeon('MAUN SANDIK', 340, 80, '#ff8800', 10, '#ff6600');

    // Spotlight on figure
    const figX = 488, figY = 258;
    ctx.save();
    ctx.globalAlpha = 0.38;
    const spot = ctx.createRadialGradient(figX, 80, 10, figX, figY, 110);
    spot.addColorStop(0, '#ffee88'); spot.addColorStop(1, 'transparent');
    ctx.fillStyle = spot; ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Table
    fillRect(428, 330, 120, 12, '#2a1a05');
    fillRect(438, 342, 6, 58, '#1a0e04');
    fillRect(532, 342, 6, 58, '#1a0e04');

    // Figure on table — arms UP
    ctx.fillStyle = '#0a0806';
    ctx.beginPath(); ctx.arc(figX, figY - 54, 19, 0, Math.PI * 2); ctx.fill();
    fillRect(figX - 15, figY - 36, 30, 64, '#0a0806');
    ctx.beginPath();
    ctx.moveTo(figX - 15, figY - 22);
    ctx.lineTo(figX - 42, figY - 64);
    ctx.lineTo(figX - 36, figY - 64);
    ctx.lineTo(figX - 9, figY - 18);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(figX + 15, figY - 22);
    ctx.lineTo(figX + 42, figY - 64);
    ctx.lineTo(figX + 36, figY - 64);
    ctx.lineTo(figX + 9, figY - 18);
    ctx.fill();
    fillRect(figX - 15, figY + 26, 12, 30, '#0a0806');
    fillRect(figX + 3, figY + 26, 12, 30, '#0a0806');

    _applySepiaOverlay();
    _memVignette();

    ctx.fillStyle = '#f0d080';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText('ANISINDA... MAUN SANDIK BAR, DÜN GECE', 20, 558);
  }

  function _memExMemory() {
    fillRect(0, 0, W, H, '#1a0f1e');

    ctx.save(); ctx.globalAlpha = 0.12;
    fillRect(0, 0, W, H, '#ff80c0');
    ctx.restore();

    fillRect(0, 390, W, H - 390, '#150a20');
    fillRect(0, 0, W, 80, '#100818');
    fillRect(0, 80, 210, 330, '#1a1228');
    fillRect(590, 80, 210, 330, '#1a1228');

    // Door frame
    fillRect(286, 90, 228, 310, '#1a0f20');
    fillRect(294, 98, 212, 302, '#0d0815');
    fillRect(298, 102, 204, 298, '#1a1030');
    [0, 1].forEach(col => {
      [0, 1].forEach(row => {
        fillRect(308 + col * 98, 120 + row * 126, 86, 106, '#231540');
      });
    });
    circle(456, 255, 6, '#c0a050');

    // Two silhouettes close then apart
    const s1x = 342, s2x = 434, sy = 218;
    ctx.fillStyle = '#0d0815';
    ctx.beginPath(); ctx.arc(s1x, sy - 42, 21, 0, Math.PI * 2); ctx.fill();
    fillRect(s1x - 19, sy - 22, 38, 84, '#0d0815');

    ctx.fillStyle = '#130a1e';
    ctx.beginPath(); ctx.arc(s2x, sy - 42, 21, 0, Math.PI * 2); ctx.fill();
    fillRect(s2x - 19, sy - 22, 38, 84, '#130a1e');

    // Fading heart
    const hx = (s1x + s2x) / 2, hy = sy - 74;
    ctx.save();
    ctx.globalAlpha = 0.38;
    ctx.fillStyle = '#ff80c0';
    ctx.shadowColor = '#ff40a0'; ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.moveTo(hx, hy + 10);
    ctx.bezierCurveTo(hx, hy + 2, hx - 18, hy - 16, hx - 18, hy - 4);
    ctx.bezierCurveTo(hx - 18, hy - 22, hx, hy - 22, hx, hy - 10);
    ctx.bezierCurveTo(hx, hy - 22, hx + 18, hy - 22, hx + 18, hy - 4);
    ctx.bezierCurveTo(hx + 18, hy - 16, hx, hy + 2, hx, hy + 10);
    ctx.fill();
    ctx.restore();

    _applySepiaOverlay();
    _memVignette();

    ctx.fillStyle = '#f0c0e0';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText("ANISINDA... DEVİN'İN KAPISI", 20, 558);
  }

  // ── Cutscene ──────────────────────────────────────────────────────────────

  function drawCutsceneCloseup(t) {
    fillRect(0, 0, W, H, '#0a0810');

    // Lamp on ceiling
    fillRect(W / 2 - 3, 0, 6, 88, '#1a1428');
    fillRect(W / 2 - 22, 88, 44, 22, '#2a1a3a');
    ctx.save();
    ctx.shadowColor = '#ccaaff'; ctx.shadowBlur = 60; ctx.globalAlpha = 0.5 * t;
    fillRect(W / 2 - 20, 90, 40, 18, '#ccaaff');
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.3 * t;
    const lampGrd = ctx.createRadialGradient(W / 2, 99, 5, W / 2, 99, 210);
    lampGrd.addColorStop(0, '#ccaaff'); lampGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = lampGrd; ctx.fillRect(0, 0, W, 320);
    ctx.restore();

    // Eyelid animation
    const eyeOpen = t;
    const lidH = H / 2 * (1 - eyeOpen);

    fillRect(0, 0, W, Math.max(0, H / 2 - lidH), '#0a0810');
    fillRect(0, H / 2 + lidH, W, Math.max(0, H / 2 - lidH), '#0a0810');

    if (lidH < H / 2) {
      const skinTop = H / 2 - lidH;
      const skinBot = H / 2 + lidH;
      fillRect(0, skinTop, W, 6, '#c09060');
      fillRect(0, skinBot - 6, W, 6, '#c09060');
      ctx.strokeStyle = '#1a1010'; ctx.lineWidth = 2;
      for (let l = 0; l < 16; l++) {
        ctx.beginPath();
        ctx.moveTo(50 + l * 45, skinTop + 3);
        ctx.lineTo(44 + l * 45 + (l % 3 - 1) * 4, skinTop - 8);
        ctx.stroke();
      }
    }
  }

  function drawCutsceneKitchen(zoomT) {
    fillRect(0, 0, W, H, '#0f0a18');

    fillRect(0, 0, W, 340, '#1a1428');
    fillRect(0, 340, W, H - 340, '#14102a');

    // Window with morning light
    fillRect(500, 40, 200, 190, '#0d0810');
    const morningLight = ctx.createLinearGradient(505, 40, 700, 230);
    morningLight.addColorStop(0, '#ffe8a0');
    morningLight.addColorStop(0.5, '#ffcc60');
    morningLight.addColorStop(1, '#ff8820');
    ctx.fillStyle = morningLight; ctx.fillRect(505, 42, 193, 186);
    ctx.strokeStyle = '#2a1a38'; ctx.lineWidth = 4;
    ctx.strokeRect(498, 38, 204, 194);
    ctx.beginPath(); ctx.moveTo(600, 38); ctx.lineTo(600, 232); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(498, 135); ctx.lineTo(702, 135); ctx.stroke();

    ctx.save(); ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#ffcc60';
    ctx.beginPath();
    ctx.moveTo(498, 232); ctx.lineTo(702, 232); ctx.lineTo(W, H); ctx.lineTo(350, H);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // Kitchen counter
    fillRect(0, 295, W, 55, '#2a1a08');
    fillRect(0, 292, W, 8, '#4a2a12');

    // Moka pot
    _drawMokaPot(W / 2 - 30, 215, 1.5);

    // Player silhouette from behind
    const psx = W / 2, psy = H - 90;
    ctx.fillStyle = '#0a0810';
    ctx.beginPath();
    ctx.moveTo(psx - 32, H);
    ctx.lineTo(psx - 38, psy + 22);
    ctx.lineTo(psx - 30, psy);
    ctx.lineTo(psx, psy - 22);
    ctx.lineTo(psx + 30, psy);
    ctx.lineTo(psx + 38, psy + 22);
    ctx.lineTo(psx + 32, H);
    ctx.closePath(); ctx.fill();
    circle(psx, psy - 44, 30, '#0a0810');
    fillRect(psx - 30, psy - 68, 60, 22, '#0a0810');

    // Face close-up overlay
    if (zoomT > 0.5) {
      const faceAlpha = Math.min(1, (zoomT - 0.5) * 2);
      ctx.save();
      ctx.globalAlpha = faceAlpha;
      fillRect(0, 0, W, H, '#0a0810');

      const fx = W / 2, fy = H / 2 - 20;
      circle(fx, fy, 82, '#c09060');
      ctx.fillStyle = '#1a1208';
      ctx.beginPath(); ctx.ellipse(fx, fy - 58, 86, 52, 0, 0, Math.PI * 2); ctx.fill();
      fillRect(fx - 86, fy - 62, 172, 62, '#1a1208');
      circle(fx, fy, 74, '#c09060');
      // Sleepy eyes
      ctx.fillStyle = '#1a0a0a';
      ctx.beginPath(); ctx.ellipse(fx - 23, fy - 12, 15, 7, 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(fx + 23, fy - 12, 15, 7, -0.1, 0, Math.PI * 2); ctx.fill();
      // Tired mouth
      ctx.strokeStyle = '#8a5030'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(fx, fy + 30, 13, 0.1, Math.PI - 0.1); ctx.stroke();
      ctx.restore();
    }
  }

  function _drawMokaPot(x, y, scale) {
    scale = scale || 1;
    const s = scale;
    ctx.save();
    ctx.translate(x, y);

    fillRect(-12 * s, 20 * s, 24 * s, 30 * s, '#3a3a3a');
    fillRect(-8 * s, 12 * s, 16 * s, 12 * s, '#2a2a2a');
    fillRect(-10 * s, -18 * s, 20 * s, 32 * s, '#444');
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.moveTo(10 * s, -10 * s);
    ctx.lineTo(26 * s, -24 * s);
    ctx.lineTo(28 * s, -20 * s);
    ctx.lineTo(12 * s, -6 * s);
    ctx.fill();
    ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 4 * s;
    ctx.beginPath(); ctx.arc(-16 * s, 20 * s, 12 * s, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    circle(0, -20 * s, 4 * s, '#2a2a2a');

    ctx.strokeStyle = '#cccccc'; ctx.lineWidth = 2; ctx.globalAlpha = 0.6;
    [-4, 2, 8].forEach(sx => {
      ctx.beginPath();
      ctx.moveTo(sx * s, -22 * s);
      ctx.bezierCurveTo(sx * s - 6, -36 * s, sx * s + 6, -46 * s, sx * s, -60 * s);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── Ending / Title ────────────────────────────────────────────────────────

  function drawEnding() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#05060f');
    sky.addColorStop(1, '#1a1b38');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    drawStars();

    // City silhouette
    [
      { x: 0, y: 350, w: 80, h: 250 },
      { x: 70, y: 290, w: 60, h: 310 },
      { x: 120, y: 380, w: 100, h: 220 },
      { x: 210, y: 255, w: 70, h: 345 },
      { x: 590, y: 285, w: 90, h: 315 },
      { x: 670, y: 350, w: 130, h: 250 },
      { x: 690, y: 255, w: 80, h: 345 },
    ].forEach(b => fillRect(b.x, b.y, b.w, b.h, '#0d0d1a'));

    fillRect(0, 540, W, H - 540, '#0a0a14');

    // Central apartment building
    fillRect(270, 110, 260, 350, '#0d0d1a');

    // THE lit window
    const wX = 322, wY = 192;
    ctx.save();
    ctx.shadowColor = '#ffdd88'; ctx.shadowBlur = 50;
    fillRect(wX, wY, 156, 120, '#1a1428');
    const wg = ctx.createLinearGradient(wX, wY, wX + 156, wY + 120);
    wg.addColorStop(0, '#ffe8a0'); wg.addColorStop(1, '#ffcc60');
    ctx.fillStyle = wg; ctx.fillRect(wX + 4, wY + 4, 148, 112);
    ctx.restore();
    fillRect(wX + 4, wY + 4, 22, 112, '#cc6633');
    fillRect(wX + 130, wY + 4, 22, 112, '#cc6633');
    ctx.strokeStyle = '#3a2820'; ctx.lineWidth = 4;
    ctx.strokeRect(wX, wY, 156, 120);

    // Other windows (dark)
    [[298, 340], [370, 340], [298, 390], [370, 390], [298, 440], [370, 440]].forEach(([wx, wy]) => {
      fillRect(wx, wy, 50, 38, '#1a1a28');
      fillRect(wx + 2, wy + 2, 46, 34, '#0d0d18');
    });

    // Title
    ctx.save();
    ctx.shadowColor = '#8855ff'; ctx.shadowBlur = 22;
    ctx.fillStyle = '#e0d0ff';
    ctx.font = '28px "Press Start 2P", monospace';
    const title = 'KANKA, GEYM';
    const tw = ctx.measureText(title).width;
    ctx.fillText(title, W / 2 - tw / 2, 496);
    ctx.restore();

    ctx.fillStyle = '#8877aa';
    ctx.font = '10px "Press Start 2P", monospace';
    const sub = 'Bir gece, dört anı, sonsuz soru.';
    const sw = ctx.measureText(sub).width;
    ctx.fillText(sub, W / 2 - sw / 2, 524);
  }

  function drawTitle() {
    fillRect(0, 0, W, H, '#05060a');
    drawStars();

    // Animated rain
    ctx.strokeStyle = 'rgba(150,180,220,0.3)';
    ctx.lineWidth = 1;
    const now = Date.now();
    for (let r = 0; r < 80; r++) {
      const rx = ((r * 137 + now * 0.3) % W);
      const ry = ((r * 73 + now * 0.8) % H);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 2, ry + 12);
      ctx.stroke();
    }

    // City skyline
    [
      { x: 0, w: 50, h: 200 }, { x: 45, w: 40, h: 280 }, { x: 80, w: 70, h: 180 },
      { x: 140, w: 35, h: 250 }, { x: 170, w: 55, h: 160 }, { x: 218, w: 40, h: 230 },
      { x: 580, w: 55, h: 200 }, { x: 628, w: 40, h: 260 }, { x: 662, w: 70, h: 180 },
      { x: 720, w: 35, h: 240 }, { x: 748, w: 52, h: 170 },
    ].forEach(b => fillRect(b.x, H - b.h, b.w, b.h, '#0a0a14'));

    fillRect(0, H - 60, W, 60, '#0d0d18');

    // Puddle reflection
    ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = '#4466aa';
    ctx.beginPath(); ctx.ellipse(W / 2, H - 40, 200, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Game title
    ctx.save();
    ctx.shadowColor = '#aa66ff'; ctx.shadowBlur = 30;
    ctx.fillStyle = '#cc99ff';
    ctx.font = '36px "Press Start 2P", monospace';
    const title = 'KANKA, GEYM';
    const tw = ctx.measureText(title).width;
    ctx.fillText(title, W / 2 - tw / 2, H / 2 - 60);
    ctx.restore();

    ctx.fillStyle = '#887799';
    ctx.font = '10px "Press Start 2P", monospace';
    const sub = 'Bir kayıp gecenin peşinde';
    const sw = ctx.measureText(sub).width;
    ctx.fillText(sub, W / 2 - sw / 2, H / 2 - 25);

    if (Math.floor(now / 600) % 2 === 0) {
      ctx.fillStyle = '#eeddff';
      ctx.font = '11px "Press Start 2P", monospace';
      const ps = 'BAŞLAMAK İÇİN BASIN';
      const psw = ctx.measureText(ps).width;
      ctx.fillText(ps, W / 2 - psw / 2, H / 2 + 40);
    }

    ctx.fillStyle = '#443355';
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText('v1.0', 10, H - 10);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    ctx,
    W,
    H,
    clear,
    drawOverworld,
    drawLocationScene,
    drawMemoryScene,
    drawCutsceneCloseup,
    drawCutsceneKitchen,
    drawEnding,
    drawTitle,
  };
})();
