'use strict';

const Game = (() => {
  const canvas  = document.getElementById('game-canvas');
  const fade    = document.getElementById('fade');
  const hud     = document.getElementById('hud');
  const mobCtrl = document.getElementById('mobile-controls');
  const dlgBox  = document.getElementById('dialogue-box');

  // ── Scene ────────────────────────────────────────────────
  // 'TITLE' | 'CUTSCENE' | 'OVERWORLD' | 'LOCATION' | 'ENDING'
  let scene = 'TITLE';
  let locationScene = null;

  // ── Cutscene draw state (only affects what loop draws) ───
  let cutDraw = 'closeup'; // 'closeup' | 'kitchen' | 'kitchen-zoom'
  let cutEyeT  = 0;
  let cutZoomT = 0;

  // ── Overworld ────────────────────────────────────────────
  const LOCATIONS = [
    { id:'Deccal Ex',          label:'Deccal Ex',       x:60,  y:60,  w:110, h:120, neonColor:'#ff60c0', neonLabel:'DECCAL EX',  audioKey:'deccal'  },
    { id:'Coffeeland XL Plus', label:'Coffeeland XL+',  x:630, y:55,  w:120, h:110, neonColor:'#40e0ff', neonLabel:'COFFEELAND', audioKey:'coffee'  },
    { id:'Maun Sandık Bar',    label:'Maun Sandık Bar', x:50,  y:360, w:130, h:120, neonColor:'#ff8040', neonLabel:'MSB',        audioKey:'pub'     },
    { id:"Kanka's Home",       label:"Kanka's Home",    x:620, y:350, w:130, h:130, neonColor:'#40ff80', neonLabel:"KANKA'S",    audioKey:'kanka'   },
    { id:'Mağaram',            label:'Mağaram',         x:345, y:460, w:110, h:120, neonColor:'#c060ff', neonLabel:'MAĞARAM',    audioKey:'magaram' },
  ];

  const player = { x:400, y:410, speed:3 };
  const keys   = {};
  const mob    = { up:false, down:false, left:false, right:false };
  let nearLocation = null;

  // ── Fade ─────────────────────────────────────────────────
  function fadeOut(cb) {
    fade.classList.add('dark');
    setTimeout(cb, 720);
  }
  function fadeIn() {
    setTimeout(() => fade.classList.remove('dark'), 60);
  }

  // ── Notification ─────────────────────────────────────────
  const notif = document.getElementById('notif');
  function showNotif(msg) {
    notif.textContent = msg;
    notif.classList.remove('hidden');
    setTimeout(() => notif.classList.add('hidden'), 2900);
  }

  // ── HUD ──────────────────────────────────────────────────
  function updateHUD() {
    const labels = ['Coffeeland','Bar','Kanka','Devin'];
    const flags  = ['heardGossip','foundPhone','kankaRevealed','exMemory'];
    const mem    = State.memoriesCollected();
    document.getElementById('memory-tracker').innerHTML =
      `HAFIZA: ${mem}/4<br>` +
      flags.map((f,i) =>
        `<span style="color:${State.get(f)?'#ffe080':'#443355'}">${State.get(f)?'▪':'▫'} ${labels[i]}</span>`
      ).join('<br>');
  }

  // ════════════════════════════════════════════════════════
  // CUTSCENE  (pure callback chain – no phase numbers)
  // ════════════════════════════════════════════════════════
  function startCutscene() {
    scene    = 'CUTSCENE';
    cutDraw  = 'closeup';
    cutEyeT  = 0;
    cutZoomT = 0;

    Audio.play('magaram');

    // 1. Eye opens over ~2s using rAF
    function openEyes() {
      cutEyeT += 0.007;
      if (cutEyeT < 1) { requestAnimationFrame(openEyes); return; }
      cutEyeT = 1;
      // 2. Scene-1 dialogue
      setTimeout(() => {
        Dialogue.start(Dialogue.INTRO_SCENE1, afterScene1);
      }, 150);
    }
    requestAnimationFrame(openEyes);

    function afterScene1() {
      // 3. Fade to kitchen
      fadeOut(() => {
        cutDraw  = 'kitchen';
        cutZoomT = 0;
        fadeIn();
        // 4. Scene-2a dialogue
        setTimeout(() => {
          Dialogue.start(Dialogue.INTRO_SCENE2A, afterScene2a);
        }, 400);
      });
    }

    function afterScene2a() {
      // 5. Zoom in
      cutDraw = 'kitchen-zoom';
      function doZoom() {
        cutZoomT += 0.01;
        if (cutZoomT < 0.6) { requestAnimationFrame(doZoom); return; }
        // 6. Scene-2b dialogue
        setTimeout(() => {
          Dialogue.start(Dialogue.INTRO_SCENE2B, afterScene2b);
        }, 150);
      }
      requestAnimationFrame(doZoom);
    }

    function afterScene2b() {
      // 7. Go to overworld
      fadeOut(() => {
        scene = 'OVERWORLD';
        State.set('introComplete', true);
        hud.classList.remove('hidden');
        if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
          mobCtrl.classList.remove('hidden');
        }
        Audio.play('overworld');
        player.x = 400; player.y = 410;
        updateHUD();
        fadeIn();
      });
    }
  }

  // ════════════════════════════════════════════════════════
  // OVERWORLD
  // ════════════════════════════════════════════════════════
  function updateOverworld() {
    let dx = 0, dy = 0;
    if (keys['ArrowUp']    || keys['KeyW'] || mob.up)    dy = -player.speed;
    if (keys['ArrowDown']  || keys['KeyS'] || mob.down)  dy =  player.speed;
    if (keys['ArrowLeft']  || keys['KeyA'] || mob.left)  dx = -player.speed;
    if (keys['ArrowRight'] || keys['KeyD'] || mob.right) dx =  player.speed;
    if (dx && dy) { dx *= 0.707; dy *= 0.707; }

    player.x = Math.max(20, Math.min(Renderer.W - 20, player.x + dx));
    player.y = Math.max(20, Math.min(Renderer.H - 20, player.y + dy));

    nearLocation = null;
    for (const loc of LOCATIONS) {
      const cx = loc.x + loc.w / 2, cy = loc.y + loc.h / 2;
      if (Math.hypot(player.x - cx, player.y - cy) < loc.w * 0.65) {
        nearLocation = loc.id; break;
      }
    }
  }

  function enterLocation(loc) {
    if (scene !== 'OVERWORLD') return;
    scene = 'TRANSITION';
    fadeOut(() => {
      scene = 'LOCATION';
      locationScene = loc;
      Audio.fadeOut(() => Audio.play(loc.audioKey));
      State.visit(loc.id);
      Renderer.drawLocationScene(loc.id);
      fadeIn();
      _startLocationDialogue(loc);
    });
  }

  function exitLocation() {
    scene = 'TRANSITION';
    fadeOut(() => {
      scene = 'OVERWORLD';
      locationScene = null;
      dlgBox.classList.add('hidden');
      document.getElementById('choice-box').classList.add('hidden');
      Audio.fadeOut(() => Audio.play('overworld'));
      updateHUD();
      fadeIn();
      if (State.allMemories() && !State.get('gameComplete')) {
        setTimeout(() => showNotif('Tüm hafıza parçalarını topladın.\nMağaram\'a dön.'), 800);
      }
    });
  }

  // ════════════════════════════════════════════════════════
  // LOCATION DIALOGUE ROUTER
  // ════════════════════════════════════════════════════════
  function _startLocationDialogue(loc) {
    const id = loc.id;
    const v  = State.getVisits(id);

    if (id === 'Deccal Ex') {
      if (v === 1) {
        Dialogue.startNode('deccal_intro', () => {
          State.set('visitedEx', true);
          State.set('exMemory', true);
          showNotif('📼 Hafıza: Devin ile karşılaşma');
          exitLocation();
        });
      } else {
        Dialogue.startNode('deccal_revisit', () => exitLocation());
      }
    }

    else if (id === 'Coffeeland XL Plus') {
      if (v === 1) {
        Dialogue.startNode('coffee_intro', () => {
          State.set('visitedCoffeeland', true);
          State.set('heardGossip', true);
          showNotif('📼 Hafıza: Coffeeland\'daki gece');
          exitLocation();
        });
      } else {
        Dialogue.startNode('coffee_revisit', () => exitLocation());
      }
    }

    else if (id === 'Maun Sandık Bar') {
      if (v === 1) {
        Dialogue.startNode('pub_intro', () => {
          State.set('visitedPub', true);
          State.set('foundPhone', true);
          showNotif('📼 Hafıza: Bar\'daki gece & telefon');
          exitLocation();
        });
      } else {
        Dialogue.startNode('pub_revisit', () => exitLocation());
      }
    }

    else if (id === "Kanka's Home") {
      if (v === 1) {
        const node = State.get('arguedWithEx') ? 'kanka_intro_argued' : 'kanka_intro_normal';
        Dialogue.startNode(node, () => {
          State.set('visitedKanka', true);
          State.set('kankaRevealed', true);
          showNotif('📼 Hafıza: Kanka\'nın versiyonu');
          if (State.allMemories()) {
            Dialogue.startNode('kanka_all_memories', () => exitLocation());
          } else {
            exitLocation();
          }
        });
      } else {
        if (State.allMemories()) {
          Dialogue.startNode('kanka_all_memories', () => exitLocation());
        } else {
          Dialogue.startNode('kanka_revisit', () => exitLocation());
        }
      }
    }

    else if (id === 'Mağaram') {
      if (State.get('introComplete') && State.allMemories()) {
        State.set('gameComplete', true);
        Dialogue.startNode('magaram_ending', () => _triggerEnding());
      } else if (State.get('introComplete')) {
        Dialogue.startNode('magaram_incomplete', () => exitLocation());
      } else {
        exitLocation();
      }
    }
  }

  // ════════════════════════════════════════════════════════
  // ENDING
  // ════════════════════════════════════════════════════════
  function _triggerEnding() {
    fadeOut(() => {
      scene = 'ENDING';
      Audio.fadeOut(() => Audio.play('ending'));
      Renderer.drawEnding();
      fadeIn();
      setTimeout(() => {
        dlgBox.classList.add('hidden');
        const el = document.createElement('div');
        el.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:60';
        el.innerHTML = `<p style="font-family:'Press Start 2P';font-size:9px;color:#c8a0ff;text-align:center;line-height:2.6;padding:24px">
          Kanka, Geym<br><br>
          Geliştirici: Sen<br>
          Hikaye: Hepimizin<br><br>
          <span style="color:#ffe080">[ YENİLEYEREK TEKRAR OYNA ]</span>
        </p>`;
        document.getElementById('game-wrapper').appendChild(el);
      }, 1400);
    });
  }

  // ════════════════════════════════════════════════════════
  // INPUT
  // ════════════════════════════════════════════════════════
  window.addEventListener('keydown', e => {
    // Prevent Space from scrolling the page
    if (e.code === 'Space') e.preventDefault();

    keys[e.code] = true;

    // Enter location
    if ((e.code === 'KeyE' || e.code === 'Enter') && nearLocation && scene === 'OVERWORLD') {
      const loc = LOCATIONS.find(l => l.id === nearLocation);
      if (loc) enterLocation(loc);
    }

    // Advance dialogue with Space or Enter (anywhere in game)
    if (e.code === 'Space' || e.code === 'Enter') {
      if (!dlgBox.classList.contains('hidden') &&
          document.getElementById('choice-box').classList.contains('hidden')) {
        Dialogue.advance();
      }
    }

    // Start game from title
    if (e.code === 'Space' && scene === 'TITLE') {
      _startGame();
    }
  });

  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // Click anywhere advances dialogue OR starts game
  canvas.addEventListener('click', () => {
    if (scene === 'TITLE') { _startGame(); return; }
    if (!dlgBox.classList.contains('hidden') &&
        document.getElementById('choice-box').classList.contains('hidden')) {
      Dialogue.advance();
    }
  });

  // Mobile D-pad
  function _mobBtn(id, flag) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('pointerdown', () => { mob[flag] = true;  });
    el.addEventListener('pointerup',   () => { mob[flag] = false; });
    el.addEventListener('pointerout',  () => { mob[flag] = false; });
  }
  _mobBtn('mob-up','up'); _mobBtn('mob-down','down');
  _mobBtn('mob-left','left'); _mobBtn('mob-right','right');
  document.getElementById('mob-interact')?.addEventListener('click', () => {
    if (nearLocation && scene === 'OVERWORLD') {
      const loc = LOCATIONS.find(l => l.id === nearLocation);
      if (loc) enterLocation(loc);
    }
  });

  function _startGame() {
    if (scene !== 'TITLE') return;
    fadeOut(() => { startCutscene(); fadeIn(); });
  }

  // ════════════════════════════════════════════════════════
  // MAIN LOOP  (only draws – no logic here)
  // ════════════════════════════════════════════════════════
  function loop() {
    switch (scene) {
      case 'TITLE':
        Renderer.drawTitle();
        break;
      case 'CUTSCENE':
        if      (cutDraw === 'closeup')      Renderer.drawCutsceneCloseup(cutEyeT);
        else if (cutDraw === 'kitchen')      Renderer.drawCutsceneKitchen(0);
        else if (cutDraw === 'kitchen-zoom') Renderer.drawCutsceneKitchen(cutZoomT);
        break;
      case 'OVERWORLD':
        updateOverworld();
        Renderer.drawOverworld(LOCATIONS, player, nearLocation);
        break;
      case 'LOCATION':
        Renderer.drawLocationScene(locationScene?.id);
        break;
      case 'ENDING':
        Renderer.drawEnding();
        break;
    }
    requestAnimationFrame(loop);
  }

  function init() {
    requestAnimationFrame(loop);
  }

  return { init };
})();

window.addEventListener('load', () => Game.init());
