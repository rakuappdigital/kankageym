'use strict';

const Game = (() => {
  // ── DOM refs ─────────────────────────────────────────────────────────────
  const canvas  = document.getElementById('game-canvas');
  const fade    = document.getElementById('fade');
  const hud     = document.getElementById('hud');
  const memTracker = document.getElementById('memory-tracker');
  const notif   = document.getElementById('notif');
  const dlgBox  = document.getElementById('dialogue-box');
  const choiceBox = document.getElementById('choice-box');
  const mobControls = document.getElementById('mobile-controls');

  // ── Scene state ───────────────────────────────────────────────────────────
  let scene = 'TITLE'; // TITLE | CUTSCENE | OVERWORLD | LOCATION | MEMORY | ENDING

  // ── Cutscene state ────────────────────────────────────────────────────────
  let cutDraw   = 'eyes'; // 'eyes' | 'kitchen'
  let cutEyeT   = 0;
  let cutZoomT  = 0;
  let cutRafId  = null;

  // ── Overworld state ───────────────────────────────────────────────────────
  const LOCATIONS = [
    { id: 'Mağaram',          x: 345, y: 460, w: 110, h: 120 },
    { id: 'Deccal Ex',        x: 60,  y: 60,  w: 110, h: 120 },
    { id: 'Coffeeland XL Plus', x: 630, y: 55,  w: 120, h: 110 },
    { id: 'Maun Sandık Bar',  x: 50,  y: 360, w: 130, h: 120 },
    { id: "Kanka's Home",     x: 620, y: 350, w: 130, h: 130 },
  ];

  let player = { x: 400, y: 350, speed: 3 };
  let keys   = {};
  let nearLocation = null;

  // ── Location state ────────────────────────────────────────────────────────
  let currentLocationId = null;
  let prevScene = 'OVERWORLD';

  // ── Memory state ─────────────────────────────────────────────────────────
  let currentMemory = null;
  let memoryNextNode = null;
  let memoryDoneCb  = null;

  // ── Guards ────────────────────────────────────────────────────────────────
  let gameStarted = false;

  // ── Notification timer ────────────────────────────────────────────────────
  let notifTimer = null;

  // ── Mobile button state ───────────────────────────────────────────────────
  const mob = { up: false, down: false, left: false, right: false };

  // ─────────────────────────────────────────────────────────────────────────
  // GAMEBRIDGE
  // ─────────────────────────────────────────────────────────────────────────

  window.GameBridge = {
    triggerMemory(memId, nextNodeId, doneCb) {
      memoryNextNode = nextNodeId || null;
      memoryDoneCb  = doneCb || null;
      currentMemory = memId;

      fadeOut(() => {
        prevScene = scene;
        scene = 'MEMORY';
        fadeIn();

        setTimeout(() => {
          if (nextNodeId) {
            Dialogue.startNode(nextNodeId, () => {
              // After memory dialogue ends, return to location
              fadeOut(() => {
                scene = prevScene || 'LOCATION';
                currentMemory = null;
                fadeIn();
                // re-run the original doneCb
                if (memoryDoneCb) {
                  const cb = memoryDoneCb;
                  memoryDoneCb = null;
                  // give the scene a moment to settle
                  setTimeout(cb, 200);
                }
              });
            });
          } else {
            // No next node — just show memory, wait for click
            setTimeout(() => {
              fadeOut(() => {
                scene = prevScene || 'LOCATION';
                currentMemory = null;
                fadeIn();
                if (memoryDoneCb) {
                  const cb = memoryDoneCb;
                  memoryDoneCb = null;
                  setTimeout(cb, 200);
                }
              });
            }, 2200);
          }
        }, 300);
      });
    },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FADE helpers
  // ─────────────────────────────────────────────────────────────────────────

  function fadeOut(cb) {
    fade.classList.add('dark');
    setTimeout(cb, 720);
  }

  function fadeIn() {
    setTimeout(() => fade.classList.remove('dark'), 60);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HUD
  // ─────────────────────────────────────────────────────────────────────────

  function updateHUD() {
    const count = State.memoriesCollected();
    const flags = [
      { key: 'heardGossip',    label: 'Coffeeland' },
      { key: 'foundPhone',     label: 'Telefon' },
      { key: 'kankaRevealed',  label: 'Kanka' },
      { key: 'exMemory',       label: 'Devin' },
    ];
    const bits = flags.map(f => {
      const got = State.get(f.key);
      return `<span style="color:${got ? '#ffd700' : '#444'}">${got ? '■' : '□'} ${f.label}</span>`;
    }).join('  ');
    memTracker.innerHTML = `Anılar ${count}/4 &nbsp; ${bits}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────

  function showNotif(msg) {
    if (notifTimer) clearTimeout(notifTimer);
    notif.textContent = msg;
    notif.classList.remove('hidden');
    notifTimer = setTimeout(() => {
      notif.classList.add('hidden');
    }, 2900);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CUTSCENE
  // ─────────────────────────────────────────────────────────────────────────

  function _startCutscene() {
    scene   = 'CUTSCENE';
    cutDraw = 'eyes';
    cutEyeT = 0;
    cutZoomT = 0;

    function openEyes() {
      cutEyeT += 0.007;
      if (cutEyeT < 1) {
        cutRafId = requestAnimationFrame(openEyes);
      } else {
        cutEyeT = 1;
        // Eyes open — short pause then intro text
        setTimeout(() => {
          Dialogue.start(Dialogue.INTRO_SCENE1, afterScene1);
        }, 150);
      }
    }
    cutRafId = requestAnimationFrame(openEyes);
  }

  function afterScene1() {
    fadeOut(() => {
      cutDraw  = 'kitchen';
      cutZoomT = 0;
      fadeIn();
      setTimeout(() => {
        Dialogue.start(Dialogue.INTRO_SCENE2A, afterScene2a);
      }, 400);
    });
  }

  function afterScene2a() {
    function zoomLoop() {
      cutZoomT += 0.01;
      if (cutZoomT < 0.6) {
        cutRafId = requestAnimationFrame(zoomLoop);
      } else {
        cutZoomT = 0.6;
        Dialogue.start(Dialogue.INTRO_SCENE2B, afterScene2b);
      }
    }
    cutRafId = requestAnimationFrame(zoomLoop);
  }

  function afterScene2b() {
    fadeOut(() => {
      scene = 'OVERWORLD';
      State.set('introComplete', true);
      hud.classList.remove('hidden');
      updateHUD();
      if (typeof Audio !== 'undefined' && Audio.play) {
        Audio.play('overworld');
      }
      fadeIn();
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // OVERWORLD – proximity check
  // ─────────────────────────────────────────────────────────────────────────

  function updateOverworld() {
    // Movement
    let dx = 0, dy = 0;
    if (keys['ArrowUp']    || keys['w'] || keys['W'] || mob.up)    dy -= 1;
    if (keys['ArrowDown']  || keys['s'] || keys['S'] || mob.down)  dy += 1;
    if (keys['ArrowLeft']  || keys['a'] || keys['A'] || mob.left)  dx -= 1;
    if (keys['ArrowRight'] || keys['d'] || keys['D'] || mob.right) dx += 1;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    player.x = Math.max(0, Math.min(Renderer.W, player.x + dx * player.speed));
    player.y = Math.max(0, Math.min(Renderer.H, player.y + dy * player.speed));

    // Proximity detection
    nearLocation = null;
    LOCATIONS.forEach(loc => {
      const cx = loc.x + loc.w / 2;
      const cy = loc.y + loc.h / 2;
      const dist = Math.hypot(player.x - cx, player.y - cy);
      if (dist < loc.w * 0.65) {
        nearLocation = loc.id;
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ENTER LOCATION
  // ─────────────────────────────────────────────────────────────────────────

  function enterLocation(locId) {
    currentLocationId = locId;
    const visits = State.getVisits(locId);
    State.visit(locId);

    fadeOut(() => {
      scene = 'LOCATION';
      fadeIn();
      setTimeout(() => _runLocationDialogue(locId, visits), 300);
    });
  }

  function exitLocation() {
    fadeOut(() => {
      scene = 'OVERWORLD';
      currentLocationId = null;
      updateHUD();
      fadeIn();
    });
  }

  function triggerEnding() {
    fadeOut(() => {
      scene = 'ENDING';
      State.set('gameComplete', true);
      if (typeof Audio !== 'undefined' && Audio.fadeOut) {
        Audio.fadeOut(() => {});
      }
      fadeIn();
    });
  }

  function _runLocationDialogue(locId, visits) {
    switch (locId) {
      case 'Deccal Ex':          _dlgDeccal(visits); break;
      case 'Coffeeland XL Plus': _dlgCoffeeland(visits); break;
      case 'Maun Sandık Bar':    _dlgBar(visits); break;
      case "Kanka's Home":       _dlgKanka(visits); break;
      case 'Mağaram':            _dlgMagaram(); break;
    }
  }

  // ── Deccal Ex ─────────────────────────────────────────────────────────────
  function _dlgDeccal(visits) {
    if (visits === 0) {
      Dialogue.startNode('deccal_intro', () => {
        State.set('visitedEx', true);
        State.set('exMemory', true);
        showNotif('Yeni Anı: Devin\'in kapısı');
        exitLocation();
      });
    } else {
      Dialogue.startNode('deccal_revisit', exitLocation);
    }
  }

  // ── Coffeeland ────────────────────────────────────────────────────────────
  function _dlgCoffeeland(visits) {
    if (visits === 0) {
      Dialogue.startNode('coffee_intro', () => {
        State.set('visitedCoffeeland', true);
        State.set('heardGossip', true);
        showNotif('Yeni Anı: Coffeeland tartışması');
        exitLocation();
      });
    } else {
      Dialogue.startNode('coffee_revisit', exitLocation);
    }
  }

  // ── Bar ───────────────────────────────────────────────────────────────────
  function _dlgBar(visits) {
    if (visits === 0) {
      Dialogue.startNode('pub_intro', () => {
        State.set('visitedPub', true);
        State.set('foundPhone', true);
        showNotif('Yeni Anı: Bar gecesi + telefon bulundu');
        exitLocation();
      });
    } else {
      Dialogue.startNode('pub_revisit', exitLocation);
    }
  }

  // ── Kanka ─────────────────────────────────────────────────────────────────
  function _dlgKanka(visits) {
    if (visits === 0) {
      const nodeId = State.get('arguedWithEx') ? 'kanka_intro_argued' : 'kanka_intro_normal';
      Dialogue.startNode(nodeId, () => {
        State.set('visitedKanka', true);
        State.set('kankaRevealed', true);
        showNotif('Yeni Anı: Kanka\'nın gece anısı');
        updateHUD();
        if (State.allMemories()) {
          // All memories — special node
          setTimeout(() => {
            Dialogue.startNode('kanka_all_memories', exitLocation);
          }, 400);
        } else {
          exitLocation();
        }
      });
    } else {
      Dialogue.startNode('kanka_revisit', exitLocation);
    }
  }

  // ── Mağaram ───────────────────────────────────────────────────────────────
  function _dlgMagaram() {
    if (!State.get('introComplete')) {
      // Shouldn't happen normally, but safety
      exitLocation();
      return;
    }
    if (State.allMemories()) {
      Dialogue.startNode('magaram_ending', triggerEnding);
    } else {
      Dialogue.startNode('magaram_incomplete', exitLocation);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INPUT
  // ─────────────────────────────────────────────────────────────────────────

  window.addEventListener('keydown', e => {
    keys[e.key] = true;

    // Prevent page scroll on arrow/space
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }

    // TITLE: start game
    if (scene === 'TITLE' && (e.code === 'Space' || e.key === 'Enter')) {
      _startGame();
      return;
    }

    // OVERWORLD: enter location
    if (scene === 'OVERWORLD' && (e.key === 'e' || e.key === 'E' || e.key === 'Enter')) {
      if (nearLocation) enterLocation(nearLocation);
      return;
    }

    // Advance dialogue (Space or Enter) only when dialogue visible, no choices
    if (e.code === 'Space' || e.key === 'Enter') {
      if (!dlgBox.classList.contains('hidden') && choiceBox.classList.contains('hidden')) {
        Dialogue.advance();
      }
    }
  });

  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Canvas click: title start OR dialogue advance
  canvas.addEventListener('click', () => {
    if (scene === 'TITLE') {
      _startGame();
    } else if (!dlgBox.classList.contains('hidden') && choiceBox.classList.contains('hidden')) {
      Dialogue.advance();
    }
  });

  // ── Mobile controls ───────────────────────────────────────────────────────
  function _mobBtn(id, flag) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('pointerdown', e => { e.preventDefault(); mob[flag] = true; });
    el.addEventListener('pointerup',   e => { e.preventDefault(); mob[flag] = false; });
    el.addEventListener('pointerleave',e => { mob[flag] = false; });
  }
  _mobBtn('mob-up',    'up');
  _mobBtn('mob-down',  'down');
  _mobBtn('mob-left',  'left');
  _mobBtn('mob-right', 'right');

  const mobInteract = document.getElementById('mob-interact');
  if (mobInteract) {
    mobInteract.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (scene === 'TITLE') { _startGame(); return; }
      if (scene === 'OVERWORLD' && nearLocation) { enterLocation(nearLocation); return; }
      if (!dlgBox.classList.contains('hidden') && choiceBox.classList.contains('hidden')) {
        Dialogue.advance();
      }
    });
  }

  // Show mobile controls if touch device
  if ('ontouchstart' in window) {
    mobControls.classList.remove('hidden');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GAME START
  // ─────────────────────────────────────────────────────────────────────────

  function _startGame() {
    if (gameStarted) return;
    gameStarted = true;
    fadeOut(() => {
      _startCutscene();
      fadeIn();
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN LOOP
  // ─────────────────────────────────────────────────────────────────────────

  function loop() {
    Renderer.clear();

    switch (scene) {
      case 'TITLE':
        Renderer.drawTitle();
        break;

      case 'CUTSCENE':
        if (cutDraw === 'eyes') {
          Renderer.drawCutsceneCloseup(cutEyeT);
        } else {
          Renderer.drawCutsceneKitchen(cutZoomT);
        }
        break;

      case 'OVERWORLD':
        updateOverworld();
        Renderer.drawOverworld(LOCATIONS, nearLocation, player.x, player.y);
        break;

      case 'LOCATION':
        if (currentLocationId) {
          Renderer.drawLocationScene(currentLocationId);
        }
        break;

      case 'MEMORY':
        if (currentMemory) {
          Renderer.drawMemoryScene(currentMemory);
        }
        break;

      case 'ENDING':
        Renderer.drawEnding();
        break;
    }

    requestAnimationFrame(loop);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────

  function init() {
    requestAnimationFrame(loop);
  }

  return { init };
})();

// Boot
window.addEventListener('DOMContentLoaded', () => {
  Game.init();
});
