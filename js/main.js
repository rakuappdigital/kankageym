'use strict';

// ─────────────────────────────────────────────────────────────
// MAIN – orchestrates scenes, overworld, cutscenes, HUD
// ─────────────────────────────────────────────────────────────

const Game = (() => {
  const canvas = document.getElementById('game-canvas');
  const fade   = document.getElementById('fade');
  const hud    = document.getElementById('hud');
  const notif  = document.getElementById('notif');
  const mobCtrl= document.getElementById('mobile-controls');

  // ── Game state machine ──────────────────────────────────
  // TITLE → CUTSCENE_1 → CUTSCENE_2 → OVERWORLD ↔ LOCATION
  let scene = 'TITLE';  // current scene
  let locationScene = null;

  // ── Overworld data ──────────────────────────────────────
  const LOCATIONS = [
    { id:'Deccal Ex',          label:'Deccal Ex',          x:60,  y:60,  w:110, h:120, neonColor:'#ff60c0', neonLabel:'DECCAl EX',   audioKey:'deccal'   },
    { id:'Coffeeland XL Plus', label:'Coffeeland XL+',     x:630, y:55,  w:120, h:110, neonColor:'#40e0ff', neonLabel:'COFFEELAND',  audioKey:'coffee'   },
    { id:'Maun Sandık Bar',    label:'Maun Sandık Bar',    x:50,  y:360, w:130, h:120, neonColor:'#ff8040', neonLabel:'MSB',         audioKey:'pub'      },
    { id:"Kanka's Home",       label:"Kanka's Home",       x:620, y:350, w:130, h:130, neonColor:'#40ff80', neonLabel:'KANKA\'S',    audioKey:'kanka'    },
    { id:'Mağaram',            label:'Mağaram',            x:345, y:460, w:110, h:120, neonColor:'#c060ff', neonLabel:'MAĞARAM',     audioKey:'magaram'  },
  ];

  const player = { x:400, y:310, speed:3, dir:'down' };
  const keys   = {};
  let nearLocation = null;  // ID of location player is near

  // ── Mobile input state ──────────────────────────────────
  const mob = { up:false, down:false, left:false, right:false };

  // ── Cutscene state ──────────────────────────────────────
  let cutPhase = 0, cutZoom = 0;
  let eyeOpen  = 0;
  let cutLocked = false; // prevents double-trigger between frames

  // ── HUD ─────────────────────────────────────────────────
  function updateHUD(){
    const mem = State.memoriesCollected();
    const tracker = document.getElementById('memory-tracker');
    const labels  = ['Coffeeland', 'Bar', 'Kanka', 'Devin'];
    const flags   = ['heardGossip','foundPhone','kankaRevealed','exMemory'];
    tracker.innerHTML = `HAFIZA: ${mem}/4<br>` +
      flags.map((f,i)=>
        `<span style="color:${State.get(f)?'#ffe080':'#443355'}">${State.get(f)?'▪':'▫'} ${labels[i]}</span>`
      ).join('<br>');
  }

  // ── Notification ────────────────────────────────────────
  function showNotif(msg){
    notif.textContent = msg;
    notif.classList.remove('hidden');
    setTimeout(()=>notif.classList.add('hidden'), 2900);
  }

  // ── Fade helpers ─────────────────────────────────────────
  function fadeOut(cb){ fade.classList.add('dark'); setTimeout(cb, 750); }
  function fadeIn()   { setTimeout(()=>fade.classList.remove('dark'), 80); }

  // ── Scene transitions ───────────────────────────────────
  function enterLocation(loc){
    if(scene !== 'OVERWORLD') return;
    scene = 'TRANSITION';
    fadeOut(()=>{
      scene = 'LOCATION';
      locationScene = loc;
      Audio.fadeOut(()=> Audio.play(loc.audioKey));
      State.visit(loc.id);
      _startLocationDialogue(loc);
      Renderer.drawLocationScene(loc.id);
      fadeIn();
    });
  }

  function exitLocation(){
    scene = 'TRANSITION';
    fadeOut(()=>{
      scene = 'OVERWORLD';
      locationScene = null;
      document.getElementById('dialogue-box').classList.add('hidden');
      document.getElementById('choice-box').classList.add('hidden');
      Audio.fadeOut(()=> Audio.play('overworld'));
      updateHUD();
      fadeIn();
      // Check if ending should trigger
      if(State.allMemories() && State.get('visitedKanka')){
        _checkEndingHint();
      }
    });
  }

  function _checkEndingHint(){
    if(!State.get('gameComplete')){
      showNotif('Tüm hafıza parçalarını topladın.\nMağaram\'a dön.');
    }
  }

  // ── Location dialogue router ─────────────────────────────
  function _startLocationDialogue(loc){
    const id  = loc.id;
    const v   = State.getVisits(id);

    if(id === 'Deccal Ex'){
      if(v === 1){
        // First visit
        Dialogue.startNode('deccal_intro', ()=>{
          State.set('visitedEx', true);
          State.set('exMemory', true);
          showNotif('📼 Hafıza: Devin ile karşılaşma');
          exitLocation();
        });
      } else {
        Dialogue.startNode('deccal_revisit', ()=> exitLocation());
      }
    }

    else if(id === 'Coffeeland XL Plus'){
      if(v === 1){
        Dialogue.startNode('coffee_intro', ()=>{
          State.set('visitedCoffeeland', true);
          State.set('heardGossip', true);
          showNotif('📼 Hafıza: Coffeeland\'daki gece');
          exitLocation();
        });
      } else {
        Dialogue.startNode('coffee_revisit', ()=> exitLocation());
      }
    }

    else if(id === 'Maun Sandık Bar'){
      if(v === 1){
        Dialogue.startNode('pub_intro', ()=>{
          State.set('visitedPub', true);
          State.set('foundPhone', true);
          showNotif('📼 Hafıza: Bar\'daki gece & telefon');
          exitLocation();
        });
      } else {
        Dialogue.startNode('pub_revisit', ()=> exitLocation());
      }
    }

    else if(id === "Kanka's Home"){
      if(v === 1){
        const node = State.get('arguedWithEx') ? 'kanka_intro_argued' : 'kanka_intro_normal';
        Dialogue.startNode(node, ()=>{
          State.set('visitedKanka', true);
          State.set('kankaRevealed', true);
          showNotif('📼 Hafıza: Kanka\'nın versiyonu');
          // If all memories, offer special node
          if(State.allMemories()){
            Dialogue.startNode('kanka_all_memories', ()=> exitLocation());
          } else {
            exitLocation();
          }
        });
      } else {
        if(State.allMemories()){
          Dialogue.startNode('kanka_all_memories', ()=> exitLocation());
        } else {
          Dialogue.startNode('kanka_revisit', ()=> exitLocation());
        }
      }
    }

    else if(id === 'Mağaram'){
      if(State.get('introComplete') && State.allMemories()){
        State.set('gameComplete', true);
        Dialogue.startNode('magaram_ending', ()=> _triggerEnding());
      } else if(State.get('introComplete')){
        Dialogue.startNode('magaram_incomplete', ()=> exitLocation());
      } else {
        exitLocation();
      }
    }
  }

  // ── Ending ───────────────────────────────────────────────
  function _triggerEnding(){
    fadeOut(()=>{
      scene = 'ENDING';
      Audio.fadeOut(()=> Audio.play('ending'));
      Renderer.drawEnding();
      fadeIn();
      setTimeout(()=>{
        document.getElementById('dialogue-box').classList.add('hidden');
        // Final credits overlay
        const el = document.createElement('div');
        el.style.cssText='position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:60;background:rgba(0,0,0,0)';
        el.innerHTML=`
          <p style="font-family:'Press Start 2P';font-size:9px;color:#c8a0ff;text-align:center;line-height:2.4;padding:20px">
            Kanka, Geym<br><br>
            Geliştirici: Sen<br>
            Hikaye: Hepimizin<br>
            Müzik: Henüz yok ama güzel olurdu<br><br>
            <span style="color:#ffe080">[ TEKRAR OYNAMAK İÇİN YENİLE ]</span>
          </p>`;
        document.getElementById('game-wrapper').appendChild(el);
      }, 1200);
    });
  }

  // ── Cutscene engine ──────────────────────────────────────
  // Phases: 0=eye opening  1=scene1 dialogue  2=fade to kitchen
  //         3=kitchen dialogue A  4=zoom  5=kitchen dialogue B  6=exit

  function _cutsceneNext(nextPhase){
    cutPhase = nextPhase;
    cutLocked = false;
  }

  function runCutscene(){

    // PHASE 0 — eye opens slowly
    if(cutPhase === 0){
      eyeOpen = Math.min(eyeOpen + 0.007, 1);
      Renderer.drawCutsceneCloseup(eyeOpen);
      if(eyeOpen >= 1 && !cutLocked){
        cutLocked = true;
        cutPhase  = 1;
        Audio.play('magaram');
        // small delay so last frame renders before dialogue appears
        setTimeout(()=>{
          Dialogue.start(Dialogue.INTRO_SCENE1, ()=> _cutsceneNext(2));
        }, 200);
      }
      return;
    }

    // PHASE 1 — scene1 dialogue active (just keep drawing)
    if(cutPhase === 1){
      Renderer.drawCutsceneCloseup(1);
      return;
    }

    // PHASE 2 — transition to kitchen
    if(cutPhase === 2 && !cutLocked){
      cutLocked = true;
      fadeOut(()=>{
        cutZoom = 0;
        cutPhase = 3;
        cutLocked = false;
        Renderer.drawCutsceneKitchen(0);
        fadeIn();
        setTimeout(()=>{
          Dialogue.start(Dialogue.INTRO_SCENE2A, ()=> _cutsceneNext(4));
        }, 400);
      });
      return;
    }

    // PHASE 3 — kitchen dialogue A active
    if(cutPhase === 3){
      Renderer.drawCutsceneKitchen(0);
      return;
    }

    // PHASE 4 — zoom in, then start dialogue B
    if(cutPhase === 4){
      cutZoom = Math.min(cutZoom + 0.01, 1);
      Renderer.drawCutsceneKitchen(cutZoom);
      if(cutZoom >= 0.55 && !cutLocked){
        cutLocked = true;
        cutPhase  = 5;
        setTimeout(()=>{
          Dialogue.start(Dialogue.INTRO_SCENE2B, ()=> _cutsceneNext(6));
        }, 200);
      }
      return;
    }

    // PHASE 5 — dialogue B active, keep drawing zoom
    if(cutPhase === 5){
      Renderer.drawCutsceneKitchen(cutZoom);
      return;
    }

    // PHASE 6 — exit to overworld
    if(cutPhase === 6 && !cutLocked){
      cutLocked = true;
      fadeOut(()=>{
        scene = 'OVERWORLD';
        State.set('introComplete', true);
        hud.classList.remove('hidden');
        mobCtrl.classList.remove('hidden');
        Audio.play('overworld');
        player.x = 400; player.y = 410;
        updateHUD();
        fadeIn();
      });
    }
  }

  // ── Overworld update ─────────────────────────────────────
  function updateOverworld(){
    // Movement
    let dx=0, dy=0;
    if(keys['ArrowUp']    || keys['KeyW'] || mob.up)    dy = -player.speed;
    if(keys['ArrowDown']  || keys['KeyS'] || mob.down)  dy =  player.speed;
    if(keys['ArrowLeft']  || keys['KeyA'] || mob.left)  dx = -player.speed;
    if(keys['ArrowRight'] || keys['KeyD'] || mob.right) dx =  player.speed;

    if(dx && dy){ dx *= 0.707; dy *= 0.707; } // diagonal normalize

    player.x = Math.max(20, Math.min(Renderer.W-20, player.x + dx));
    player.y = Math.max(20, Math.min(Renderer.H-20, player.y + dy));

    // Check proximity to locations
    nearLocation = null;
    for(const loc of LOCATIONS){
      const cx = loc.x + loc.w/2, cy = loc.y + loc.h/2;
      const dist = Math.hypot(player.x - cx, player.y - cy);
      if(dist < loc.w*0.65){ nearLocation = loc.id; break; }
    }
  }

  function drawOverworld(){
    Renderer.drawOverworld(LOCATIONS, player, nearLocation);
  }

  // ── Input ────────────────────────────────────────────────
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if((e.code === 'KeyE' || e.code === 'Enter') && nearLocation && scene === 'OVERWORLD'){
      const loc = LOCATIONS.find(l=>l.id===nearLocation);
      if(loc) enterLocation(loc);
    }
    if(e.code === 'Space' && scene === 'TITLE'){
      _startGame();
    }
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  canvas.addEventListener('click', ()=>{
    if(scene === 'TITLE') _startGame();
  });

  // Mobile
  function _mobBtn(id, flag){
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('pointerdown', ()=>{ mob[flag]=true; });
    el.addEventListener('pointerup',   ()=>{ mob[flag]=false; });
    el.addEventListener('pointerout',  ()=>{ mob[flag]=false; });
  }
  _mobBtn('mob-up','up'); _mobBtn('mob-down','down');
  _mobBtn('mob-left','left'); _mobBtn('mob-right','right');
  document.getElementById('mob-interact')?.addEventListener('click', ()=>{
    if(nearLocation && scene==='OVERWORLD'){
      const loc = LOCATIONS.find(l=>l.id===nearLocation);
      if(loc) enterLocation(loc);
    }
  });

  function _startGame(){
    if(scene !== 'TITLE') return;
    scene = 'CUTSCENE';
    fadeOut(()=>{ Renderer.drawCutsceneCloseup(0); fadeIn(); });
  }

  // ── Main loop ────────────────────────────────────────────
  let last = 0;
  function loop(ts){
    const dt = ts - last; last = ts;

    if(scene === 'TITLE'){
      Renderer.drawTitle();
    }
    else if(scene === 'CUTSCENE'){
      runCutscene();
    }
    else if(scene === 'OVERWORLD'){
      updateOverworld();
      drawOverworld();
    }
    else if(scene === 'LOCATION'){
      Renderer.drawLocationScene(locationScene.id);
      // dialogue is handled by HTML overlay, no need to redraw
    }
    else if(scene === 'ENDING'){
      Renderer.drawEnding();
    }

    requestAnimationFrame(loop);
  }

  // ── Init ─────────────────────────────────────────────────
  function init(){
    // Detect mobile
    if(/Mobi|Android|iPhone/i.test(navigator.userAgent)){
      mobCtrl.classList.remove('hidden');
    }
    requestAnimationFrame(loop);
  }

  return { init };
})();

window.addEventListener('load', () => Game.init());
