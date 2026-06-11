'use strict';

// ─────────────────────────────────────────────────────────────
// RENDERER  –  all pixel-art drawing, no external image assets
// ─────────────────────────────────────────────────────────────

const Renderer = (() => {
  const canvas = document.getElementById('game-canvas');
  const ctx    = canvas.getContext('2d');
  const W = 800, H = 600;

  // ── palette ──────────────────────────────────────────────
  const PAL = {
    bg:       '#0d0d1a',
    street:   '#1a1a2e',
    sidewalk: '#252540',
    lineCol:  '#2a2a50',
    grass:    '#1a2e1a',
    tree:     '#1a4a1a',
    treeTop:  '#2a7a2a',

    // buildings
    bld1: '#1e1e3a', bld2: '#2a1e3a', bld3: '#1e2a3a',
    bld4: '#2a2a1e', bld5: '#1a2a2a',
    roof: '#14142e',

    // neons
    neonPurple: '#c060ff', neonPink:  '#ff60c0',
    neonCyan:   '#40e0ff', neonGreen: '#40ff80',
    neonYellow: '#ffe040', neonOrange:'#ff8040',

    // player
    playerBody: '#e0c060', playerShadow: '#8a7030',

    // UI
    highlight: '#c8a0ff',
  };

  // ── pixel helpers ─────────────────────────────────────────
  function rect(x,y,w,h,c){ ctx.fillStyle=c; ctx.fillRect(x,y,w,h); }
  function px(x,y,s,c)    { rect(x,y,s,s,c); }
  function text(str,x,y,sz,c,align='left'){
    ctx.font = `${sz}px 'Press Start 2P',monospace`;
    ctx.fillStyle = c; ctx.textAlign = align;
    ctx.fillText(str,x,y);
  }
  function border(x,y,w,h,c,t=2){ ctx.strokeStyle=c; ctx.lineWidth=t; ctx.strokeRect(x,y,w,h); }

  // ── neon glow helper ──────────────────────────────────────
  function neonText(str,x,y,sz,c){
    ctx.save();
    ctx.shadowColor = c; ctx.shadowBlur = 12;
    text(str,x,y,sz,c,'center');
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  function neonRect(x,y,w,h,c,glow=10){
    ctx.save(); ctx.shadowColor=c; ctx.shadowBlur=glow;
    ctx.strokeStyle=c; ctx.lineWidth=2; ctx.strokeRect(x,y,w,h);
    ctx.restore();
  }

  // ══════════════════════════════════════════════════════════
  //  OVERWORLD MAP
  // ══════════════════════════════════════════════════════════
  function drawOverworld(locations, player, enterable) {
    // sky / background
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,'#08081a'); grad.addColorStop(1,'#0d0d22');
    ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);

    _drawStars();
    _drawStreetGrid();
    _drawTrees();
    _drawBuildings(locations, enterable);
    _drawPlayer(player);
    _drawMinimapHint(locations, player);
  }

  function _drawStars(){
    // static pixel stars
    const pts = [
      [40,30],[120,15],[220,45],[350,20],[490,35],[600,12],[720,28],
      [80,80],[170,60],[310,90],[450,55],[560,75],[670,40],[760,65],
      [30,140],[200,120],[380,110],[530,130],[700,100],
    ];
    pts.forEach(([x,y])=>{ px(x,y,2,'rgba(255,255,255,0.6)'); });
  }

  function _drawStreetGrid(){
    // horizontal streets
    [[160,30],[300,30],[460,30],[30,230],[720,230]].forEach(([y,t])=>{
      rect(0,y,W,t,PAL.street);
      rect(0,y+13,W,4,PAL.lineCol);
    });
    // vertical streets
    [[100,30],[260,30],[500,30],[640,30]].forEach(([x,t])=>{
      rect(x,0,t,H,PAL.street);
      rect(x+13,0,4,H,PAL.lineCol);
    });
    // sidewalks (slightly lighter edges)
    rect(0,155,W,8,PAL.sidewalk);
    rect(0,188,W,8,PAL.sidewalk);
    rect(0,455,W,8,PAL.sidewalk);
    rect(0,488,W,8,PAL.sidewalk);
  }

  function _drawTrees(){
    const trees = [[375,170],[430,170],[375,440],[430,440],[190,170],[190,440],[590,170],[590,440]];
    trees.forEach(([x,y])=>{
      rect(x+5,y+16,6,12,PAL.tree);
      px(x,y,16,PAL.treeTop);
      px(x+2,y-6,12,PAL.treeTop);
      px(x+4,y-10,8,'#1e5a1e');
    });
  }

  function _drawBuildings(locations, enterable){
    locations.forEach(loc => _drawBuilding(loc, enterable && enterable===loc.id));
  }

  function _drawBuilding(loc, canEnter){
    const {x, y, w, h, id, label, neonColor, neonLabel} = loc;
    const clr = {
      'Deccal Ex':         PAL.bld2,
      'Coffeeland XL Plus':PAL.bld3,
      'Maun Sandık Bar':   PAL.bld1,
      "Kanka's Home":      PAL.bld4,
      'Mağaram':           PAL.bld5,
    }[id] || PAL.bld1;

    // building body
    rect(x, y, w, h, clr);
    rect(x, y, w, 8, PAL.roof);  // roof strip

    // windows (pixel art grid)
    const wCols = Math.floor((w-14)/22);
    const wRows = Math.floor((h-24)/22);
    for(let r=0;r<wRows;r++){
      for(let c=0;c<wCols;c++){
        const wx=x+8+c*22, wy=y+16+r*22;
        const lit = Math.random() > 0.35;
        rect(wx,wy,12,10, lit?'#ffe880':'#1a1a30');
        if(lit){ rect(wx+5,wy,1,10,'rgba(255,255,180,0.3)'); }
      }
    }

    // neon sign
    if(neonLabel){
      ctx.save();
      ctx.shadowColor = neonColor || '#ff60c0';
      ctx.shadowBlur  = 16;
      ctx.fillStyle   = neonColor || '#ff60c0';
      ctx.font        = "8px 'Press Start 2P',monospace";
      ctx.textAlign   = 'center';
      ctx.fillText(neonLabel, x+w/2, y+h-8);
      ctx.restore();
    }

    // door
    rect(x+w/2-8, y+h-20, 16, 20, '#333');
    rect(x+w/2-7, y+h-19, 14, 18, '#1a1a2a');

    // entrance glow when enterable
    if(canEnter){
      ctx.save();
      ctx.shadowColor = '#ffe080'; ctx.shadowBlur = 24;
      ctx.strokeStyle = '#ffe080'; ctx.lineWidth = 2;
      ctx.strokeRect(x,y,w,h);
      ctx.restore();
      text(label, x+w/2, y-22, 8, '#ffe080','center');
      text('[ GIRMEK İÇİN E ]', x+w/2, y-10, 6, '#ffcc60','center');
    } else {
      // subtle label always
      ctx.fillStyle='rgba(200,160,255,0.6)';
      ctx.font="7px 'Press Start 2P',monospace"; ctx.textAlign='center';
      ctx.fillText(label, x+w/2, y-8);
    }
  }

  function _drawPlayer(p){
    const {x, y} = p;
    // shadow
    ctx.save(); ctx.globalAlpha=0.4;
    ctx.fillStyle='#000'; ctx.beginPath();
    ctx.ellipse(x,y+10,10,5,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
    // body (top-down sprite)
    rect(x-6,y-8,12,12,PAL.playerBody);
    rect(x-4,y-12,8,6,PAL.playerBody);  // head
    rect(x-2,y-14,4,4,'#c8a0ff');       // hair hint
    // feet dots
    rect(x-5,y+2,4,4,PAL.playerShadow);
    rect(x+1,y+2,4,4,PAL.playerShadow);
  }

  function _drawMinimapHint(locations, player){
    // tiny minimap top-left
    const mx=10,my=10,mw=90,mh=70,scaleX=mw/W,scaleY=mh/H;
    ctx.save(); ctx.globalAlpha=0.75;
    rect(mx,my,mw,mh,'rgba(0,0,0,0.7)');
    border(mx,my,mw,mh,'#555');
    locations.forEach(l=>{
      rect(mx+l.x*scaleX, my+l.y*scaleY, l.w*scaleX, l.h*scaleY, '#9060ff');
    });
    rect(mx+player.x*scaleX-2, my+player.y*scaleY-2, 4, 4, '#ffe080');
    ctx.restore();
  }

  // ══════════════════════════════════════════════════════════
  //  LOCATION SCENES  (over-the-shoulder)
  // ══════════════════════════════════════════════════════════
  function drawLocationScene(id){
    switch(id){
      case 'Deccal Ex':         _sceneDeccal();   break;
      case 'Coffeeland XL Plus':_sceneCoffee();   break;
      case 'Maun Sandık Bar':   _scenePub();      break;
      case "Kanka's Home":      _sceneKanka();    break;
      case 'Mağaram':           _sceneMagaram();  break;
      default: rect(0,0,W,H,'#111');
    }
    _drawPlayerHead();
  }

  function _sceneDeccal(){
    // Apartment door hallway – purple/pink palette
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#1a0a22'); g.addColorStop(1,'#2e0a1e');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    // wall pattern
    for(let y=0;y<H;y+=40){ rect(0,y,W,1,'rgba(255,100,200,0.06)'); }
    for(let x=0;x<W;x+=60){ rect(x,0,1,H,'rgba(255,100,200,0.04)'); }
    // door frame
    rect(270,100,260,400,'#2a0e22'); rect(280,110,240,380,'#1e0a1e');
    border(270,100,260,400,'#7a4060',3);
    // door ornament
    rect(380,160,40,40,'#3a1a2e'); border(380,160,40,40,'#7a4060');
    // hallway lights
    rect(310,20,180,8,'#ffe0c0'); neonRect(310,20,180,8,'#ff8060',20);
    rect(320,28,160,40,'rgba(255,180,120,0.08)');
    // potted plant
    rect(210,380,30,80,'#1a0e0a'); rect(200,360,50,30,'#2a4a1a'); rect(208,340,35,25,'#2a5a1a'); rect(215,325,20,20,'#1e4a1a');
    // photo frames on wall
    [[120,200,60,80],[140,320,50,60],[660,180,70,90],[650,310,55,70]].forEach(([x,y,w,h])=>{
      rect(x,y,w,h,'#2a1020'); border(x,y,w,h,'#7a4060',2);
      rect(x+5,y+5,w-10,h-10,'#1a0818');
    });
    // NPC: Deccal Ex (pixel art female figure, center-right)
    _drawNpcEx(480, 140);
  }

  function _sceneCoffee(){
    // Warm coffee shop
    rect(0,0,W,H,'#1a1008');
    // wooden walls
    for(let y=0;y<H;y+=18){ rect(0,y,W,1,'rgba(180,100,40,0.12)'); }
    // counter
    rect(300,280,W,60,'#3a2010'); rect(300,340,W,W,'#2a1808');
    border(300,280,W-300,60,'#7a4820',2);
    // shelf of cups / bottles
    rect(320,200,460,12,'#4a2818'); border(320,200,460,12,'#7a4820');
    [[340,150],[400,145],[460,152],[520,148],[580,150],[640,145],[700,150]].forEach(([x,y])=>{
      rect(x,y,18,55,'#2a1808'); rect(x+2,y+2,14,40,'rgba(180,120,60,0.4)');
      border(x,y,18,55,'#7a5030');
    });
    // window
    rect(80,80,200,180,'#0d1a2a'); border(80,80,200,180,'#7a5030',3);
    rect(90,90,180,160,'rgba(100,150,200,0.15)');
    rect(175,80,4,180,'#7a5030'); rect(80,165,200,4,'#7a5030');
    neonRect(80,80,200,180,'#40b0ff',6);
    // light from ceiling
    rect(340,0,80,20,'#ffe0a0'); rect(300,20,160,80,'rgba(255,200,100,0.08)');
    // coffee machine (pixel art)
    rect(520,220,100,70,'#2a2a2a'); rect(530,230,80,50,'#1a1a1a');
    rect(550,260,20,30,'#333'); neonRect(520,220,100,70,'#ff4040',8);
    rect(555,235,10,10,'#ff4040');
    // NPC: barista
    _drawNpcBarista(520, 150);
  }

  function _scenePub(){
    // Dark pub
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#0a0a05'); g.addColorStop(1,'#1a1205');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    // bar counter
    rect(200,320,600,50,'#3a2808'); rect(200,370,600,400,'#2a1e08');
    border(200,320,600,50,'#7a5820',2);
    // glasses on counter
    [[260,290],[310,285],[360,292],[500,288],[560,290],[620,285]].forEach(([x,y])=>{
      rect(x,y,20,35,'rgba(200,240,255,0.2)'); border(x,y,20,35,'rgba(200,240,255,0.4)',1);
      rect(x+5,y+5,10,20,'rgba(180,220,240,0.15)');
    });
    // neon signs on wall
    neonText('OPEN',120,80,18,PAL.neonGreen);
    neonText('BAR', 680,100,22,PAL.neonOrange);
    // beer taps
    [[440,280],[480,280],[520,280]].forEach(([x,y])=>{
      rect(x,y,10,40,'#888'); rect(x-5,y-10,20,14,'#666');
    });
    // pool table (distant, dark)
    rect(50,300,180,120,'#0a2a0a'); border(50,300,180,120,'#3a8a3a',2);
    // stools
    [[240,390],[310,390],[390,390],[470,390],[550,390],[630,390]].forEach(([x,y])=>{
      rect(x,y,30,50,'#3a2010'); rect(x+5,y+45,20,5,'#2a1808');
    });
    // NPC: bartender
    _drawNpcBartender(520, 140);
  }

  function _sceneKanka(){
    // Cozy living room
    rect(0,0,W,H,'#100e20');
    // wallpaper hint
    for(let y=0;y<H;y+=32) for(let x=0;x<W;x+=32){
      ctx.fillStyle='rgba(80,60,120,0.04)'; ctx.fillRect(x,y,30,30);
    }
    // sofa (center)
    rect(180,340,420,100,'#2a2040'); rect(170,380,440,70,'#221838');
    border(180,340,420,100,'#4a3060',2);
    // cushions
    [[200,350],[310,350],[420,350],[520,350]].forEach(([x,y])=>{
      rect(x,y,80,60,'#3a2858'); border(x,y,80,60,'#5a3878');
    });
    // TV (off)
    rect(280,120,240,170,'#0a0a0a'); border(280,120,240,170,'#3a3050',2);
    rect(390,290,20,40,'#1a1828');
    // bookshelf
    rect(50,120,80,300,'#1e1830'); border(50,120,80,300,'#3a2850',2);
    for(let i=0;i<8;i++){
      const clrs=['#8060c0','#c06080','#4080c0','#80c060'];
      rect(55,130+i*34,70,28,clrs[i%4]+'44');
      border(55,130+i*34,70,28,clrs[i%4],1);
    }
    // window with night view
    rect(620,100,130,200,'#0d1020'); border(620,100,130,200,'#4a3060',2);
    rect(630,110,110,180,'rgba(80,80,180,0.2)');
    // rug
    rect(230,380,340,60,'rgba(120,80,160,0.3)');
    // NPC: kanka
    _drawNpcKanka(500, 130);
  }

  function _sceneMagaram(){
    // Home bedroom/kitchen — used for cutscenes too
    rect(0,0,W,H,'#0a0e14');
    // walls
    rect(0,0,W,H,'#0e1220');
    // floor
    rect(0,460,W,H,'#141020');
    for(let x=0;x<W;x+=80){ rect(x,460,1,H,'rgba(80,60,120,0.15)'); }
    // bed
    rect(80,200,200,180,'#1a1428'); border(80,200,200,180,'#3a2a48',2);
    rect(90,200,180,50,'#ffffff11'); // pillow
    rect(80,200,200,12,'#2a2040');   // headboard
    // lamp
    rect(60,150,16,50,'#888'); rect(50,140,36,16,'#ffe0a0');
    rect(48,146,40,4,'rgba(255,200,80,0.4)');
    // window night
    rect(560,80,180,220,'#0d1525'); border(560,80,180,220,'#3a3060',2);
    rect(644,80,4,220,'#3a3060'); rect(560,184,180,4,'#3a3060');
    // stars through window
    [[580,100],[610,130],[660,95],[700,140],[720,110]].forEach(([x,y])=>{ px(x,y,2,'rgba(255,255,255,0.7)'); });
    // desk
    rect(600,340,180,20,'#2a2040'); rect(600,360,180,H,'#1e1830');
    rect(680,280,20,60,'#888'); rect(670,270,40,14,'#ffe0a0'); // desk lamp
    // poster on wall
    rect(280,60,120,140,'#1a1428'); border(280,60,120,140,'#4a3060',2);
    rect(290,70,100,120,'#201838');
    neonRect(280,60,120,140,'#c060ff',8);
  }

  // ── NPC portraits (pixel art, large) ──────────────────────

  function _drawNpcEx(x, y){
    // Female figure, emotional. ~200x320
    const s = 3; // pixel scale
    function p(ax,ay,aw,ah,c){ rect(x+ax*s,y+ay*s,aw*s,ah*s,c); }

    // body / dress (purple)
    p(10,48,40,70,'#5a1a4a');
    p(8,60,44,58,'#4a1040');
    // arms
    p(2,50,10,40,'#f0b890'); p(48,50,10,40,'#f0b890');
    // neck
    p(22,42,16,8,'#f0b890');
    // head
    p(14,10,32,34,'#f0b890');
    // hair (long, dark)
    p(10,8,40,6,'#1a0a14');
    p(8,14,6,40,'#1a0a14');  // left side
    p(46,14,6,40,'#1a0a14'); // right side
    p(12,48,36,20,'#1a0a14'); // back hair
    // eyes (sad)
    p(18,22,6,4,'#fff');  p(36,22,6,4,'#fff');
    p(20,23,4,3,'#1a0a14'); p(38,23,4,3,'#1a0a14');
    // teardrop hint
    p(20,28,2,4,'rgba(150,200,255,0.7)');
    // mouth (slight frown)
    p(22,34,16,2,'#c08070');
    p(20,36,4,2,'#c08070'); p(36,36,4,2,'#c08070');
    // earrings
    p(11,26,4,4,'#c060ff'); p(45,26,4,4,'#c060ff');
    // subtle glow outline
    ctx.save(); ctx.shadowColor='#c060ff'; ctx.shadowBlur=20;
    ctx.strokeStyle='rgba(180,80,200,0.2)'; ctx.lineWidth=1;
    ctx.strokeRect(x+8*s,y+8*s,44*s,110*s);
    ctx.restore();
  }

  function _drawNpcBarista(x, y){
    // Barista with apron, friendly
    const s = 3;
    function p(ax,ay,aw,ah,c){ rect(x+ax*s,y+ay*s,aw*s,ah*s,c); }

    // body
    p(8,44,40,70,'#e0e0e0'); // shirt (white)
    p(14,44,28,70,'#e06030'); // apron
    // apron strings
    p(10,50,4,30,'#e06030'); p(46,50,4,30,'#e06030');
    // arms
    p(2,46,8,42,'#f5c090'); p(50,46,8,42,'#f5c090');
    // neck
    p(22,38,16,8,'#f5c090');
    // head
    p(16,8,28,32,'#f5c090');
    // hair (short, dark)
    p(14,6,32,8,'#2a1808');
    p(14,8,6,16,'#2a1808');
    p(40,8,6,16,'#2a1808');
    // eyes (friendly)
    p(20,18,5,5,'#fff'); p(35,18,5,5,'#fff');
    p(21,19,3,3,'#1a0a00'); p(36,19,3,3,'#1a0a00');
    // smile
    p(20,30,4,2,'#c08060'); p(36,30,4,2,'#c08060');
    p(24,32,12,2,'#c08060');
    // apron pocket
    p(20,65,20,15,'#c05020'); border(x+20*s,y+65*s,20*s,15*s,'#a04010',1);
    // text on apron (tiny)
    ctx.fillStyle='#fff'; ctx.font="6px monospace"; ctx.textAlign='center';
    ctx.fillText('CXP', x+30*s, y+75*s);
  }

  function _drawNpcBartender(x, y){
    // Gruff bartender, dark palette
    const s = 3;
    function p(ax,ay,aw,ah,c){ rect(x+ax*s,y+ay*s,aw*s,ah*s,c); }

    // body (dark shirt)
    p(6,44,46,75,'#1a1a1a');
    // rolled sleeves
    p(1,46,7,36,'#2a1a0a'); p(50,46,7,36,'#2a1a0a');
    // arms
    p(2,48,6,40,'#c07850'); p(51,48,6,40,'#c07850');
    // neck
    p(22,38,16,8,'#c07850');
    // head (larger, rough)
    p(12,8,36,32,'#c07850');
    // stubble
    for(let i=0;i<5;i++) for(let j=0;j<3;j++){
      p(14+i*5,28+j*2,1,1,'rgba(80,40,20,0.6)');
    }
    // hair (very short/shaved sides)
    p(12,6,36,6,'#1a0e06');
    p(12,8,4,10,'#1a0e06'); p(44,8,4,10,'#1a0e06');
    // eyes (tired but sharp)
    p(18,18,6,4,'#fff'); p(36,18,6,4,'#fff');
    p(20,19,4,3,'#1a0a00'); p(38,19,4,3,'#1a0a00');
    p(17,17,8,2,'#2a1808'); p(35,17,8,2,'#2a1808'); // brows
    // mouth (neutral)
    p(20,30,20,2,'#a06040');
    // towel over shoulder
    p(2,44,10,30,'#e0e0e0'); p(3,44,8,30,'#c0c0c0');
    for(let i=0;i<4;i++) rect(x+3*s, y+(50+i*6)*s, 8*s, 2*s, 'rgba(0,0,0,0.15)');
  }

  function _drawNpcKanka(x, y){
    // Best friend, casual and warm
    const s = 3;
    function p(ax,ay,aw,ah,c){ rect(x+ax*s,y+ay*s,aw*s,ah*s,c); }

    // body (hoodie)
    p(8,44,44,72,'#2a4a7a');
    p(10,44,40,72,'#1e3a6a');
    // hood detail
    p(6,38,48,12,'#2a4a7a');
    // arms
    p(2,46,8,42,'#2a4a7a'); p(50,46,8,42,'#2a4a7a');
    // hands
    p(2,82,8,8,'#f5c090'); p(50,82,8,8,'#f5c090');
    // neck
    p(22,38,16,8,'#f5c090');
    // head
    p(14,8,32,32,'#f5c090');
    // hair (messy)
    p(12,6,36,8,'#1a0e02');
    p(12,8,5,12,'#1a0e02'); p(43,8,5,12,'#1a0e02');
    p(16,4,6,6,'#240e02'); p(28,2,8,6,'#240e02'); p(38,6,6,4,'#240e02');
    // eyes (relaxed, friendly)
    p(18,18,6,4,'#fff'); p(36,18,6,4,'#fff');
    p(20,19,3,3,'#1a0a00'); p(38,19,3,3,'#1a0a00');
    p(18,22,3,1,'#f5c090'); p(36,22,3,1,'#f5c090'); // lower lid
    // smile
    p(20,30,4,2,'#c07050'); p(36,30,4,2,'#c07050');
    p(24,32,12,2,'#c07050');
    // hoodie pocket
    p(18,72,24,16,'#1e3a6a'); border(x+18*s,y+72*s,24*s,16*s,'#2a4a7a',1);
    // phone in hand hint
    rect(x+52*s, y+70*s, 12, 20, '#1a1a1a');
    border(x+52*s, y+70*s, 12, 20, '#444', 1);
    rect(x+53*s, y+72*s, 10, 14, '#2a3a5a');
  }

  // Player head silhouette (bottom of screen, over-the-shoulder)
  function _drawPlayerHead(){
    ctx.save();
    // head shape
    const hx = 180, hy = H + 30; // slightly off-screen bottom
    const gradient = ctx.createRadialGradient(hx, hy-20, 0, hx, hy, 120);
    gradient.addColorStop(0,'rgba(20,12,30,1)');
    gradient.addColorStop(1,'rgba(10,6,20,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(hx, hy, 120, 130, 0, 0, Math.PI*2);
    ctx.fill();
    // solid head
    ctx.fillStyle = '#0e0a18';
    ctx.beginPath();
    ctx.ellipse(hx, hy+10, 75, 90, 0, 0, Math.PI*2);
    ctx.fill();
    // hair highlight
    ctx.fillStyle = '#2a1e3a';
    ctx.beginPath();
    ctx.ellipse(hx-10, hy-65, 30, 20, -0.3, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  // ══════════════════════════════════════════════════════════
  //  CUTSCENE SPECIFIC
  // ══════════════════════════════════════════════════════════
  function drawCutsceneCloseup(t){
    // Scene 1: close-up waking
    rect(0,0,W,H,'#050510');
    // Pillow/ceiling view — blurred room
    rect(0,H*0.6,W,H*0.4,'#0a0818');
    rect(0,H*0.58,W,8,'#141028');
    // ceiling texture
    for(let x=0;x<W;x+=60) rect(x,0,1,H*0.6,'rgba(80,60,120,0.05)');
    for(let y=0;y<H*0.6;y+=60) rect(0,y,W,1,'rgba(80,60,120,0.05)');
    // light fixture
    rect(W/2-30,0,60,20,'#ffe0a0'); rect(W/2-20,20,40,30,'rgba(255,200,80,0.1)');
    ctx.save(); ctx.shadowColor='#ffe0a0'; ctx.shadowBlur=30;
    rect(W/2-30,0,60,20,'#ffe0a0'); ctx.restore();
    // eye-opening vignette (based on t: 0=closed, 1=open)
    const vH = (H/2)*(1-Math.min(t,1));
    rect(0,0,W,vH,'#000');
    rect(0,H-vH,W,vH,'#000');
    // inner glow (eyes adjusting)
    if(t > 0.5){
      ctx.save(); ctx.globalAlpha = (t-0.5)*2*0.3;
      ctx.fillStyle='rgba(255,220,180,0.15)'; ctx.fillRect(0,vH,W,H-vH*2);
      ctx.restore();
    }
  }

  function drawCutsceneKitchen(zoomT){
    // Scene 2: kitchen
    rect(0,0,W,H,'#0e0c08');
    // kitchen counter
    rect(0,350,W,250,'#2a2010'); rect(0,350,W,16,'#3a3018');
    border(0,350,W,16,'#5a4828',2);
    // tiles on wall
    for(let y=80;y<350;y+=40) for(let x=0;x<W;x+=40){
      rect(x+1,y+1,38,38,'#1a1810'); border(x+1,y+1,38,38,'rgba(255,200,100,0.05)',1);
    }
    // window
    rect(280,80,240,180,'#0d1a2a'); border(280,80,240,180,'#5a4828',3);
    rect(290,90,220,160,'rgba(100,150,200,0.2)');
    rect(394,80,4,180,'#5a4828'); rect(280,164,240,4,'#5a4828');
    // morning light through window
    ctx.save(); ctx.globalAlpha=0.15;
    const lg=ctx.createLinearGradient(280,90,520,250);
    lg.addColorStop(0,'#ffe0a0'); lg.addColorStop(1,'transparent');
    ctx.fillStyle=lg; ctx.fillRect(280,90,240,220);
    ctx.restore();
    // coffee setup
    rect(350,300,60,55,'#2a1808'); border(350,300,60,55,'#7a5030',2); // moka pot
    rect(360,280,40,22,'#888');   // moka top
    rect(340,355,80,8,'#5a3818'); // heating element
    // steam
    ctx.save(); ctx.globalAlpha=0.4; ctx.strokeStyle='#e0e0e0'; ctx.lineWidth=2;
    for(let i=0;i<3;i++){
      ctx.beginPath();
      ctx.moveTo(365+i*10, 280);
      ctx.quadraticCurveTo(360+i*10, 260, 370+i*10, 240);
      ctx.quadraticCurveTo(380+i*10, 220, 372+i*10, 200);
      ctx.stroke();
    }
    ctx.restore();
    // cups / items
    rect(450,330,35,30,'#1a1210'); rect(452,332,31,26,'#2a1e10');
    border(450,330,35,30,'#7a5030',1);
    rect(200,310,40,50,'#1a1a1a'); // bag of coffee beans

    // zoom effect: draw character back (silhouette, facing counter)
    ctx.save();
    const scaleVal = 1 + zoomT * 0.4;
    ctx.translate(W/2, H/2); ctx.scale(scaleVal, scaleVal); ctx.translate(-W/2, -H/2);

    // player from behind at counter
    rect(330, 200, 80, 160, '#0e0a18'); // body
    rect(350, 160, 40, 46, '#0e0a18'); // head
    rect(325, 225, 12, 90, '#0e0a18'); // left arm
    rect(403, 225, 12, 90, '#0e0a18'); // right arm

    // face zoom-in (appears when zoomT > 0.5)
    if(zoomT > 0.5){
      const alpha = (zoomT - 0.5) * 2;
      ctx.globalAlpha = alpha;
      // face close-up overlay (center screen)
      _drawPlayerFace(W/2, H/2 - 60, 2.5);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function _drawPlayerFace(cx, cy, s){
    // Simple pixel art self-face close-up
    function p(ax,ay,aw,ah,c){ rect(cx+ax*s,cy+ay*s,aw*s,ah*s,c); }
    p(-20,-28,40,4,'#1a0e02'); // hair top
    p(-22,-24,44,2,'#1a0e02');
    p(-18,-22,36,26,'#f0b880'); // face
    p(-22,-14,4,16,'#f0b880'); p(18,-14,4,16,'#f0b880'); // cheeks
    // eyes
    p(-14,-14,10,6,'#fff'); p(4,-14,10,6,'#fff');
    p(-12,-13,6,5,'#1a0a00'); p(6,-13,6,5,'#1a0a00');
    p(-10,-12,3,3,'#ffe0a0'); p(8,-12,3,3,'#ffe0a0'); // highlight
    // eyebrows
    p(-15,-16,12,2,'#1a0e02'); p(3,-16,12,2,'#1a0e02');
    // nose
    p(-2,-4,4,4,'#d09060');
    // mouth (determined)
    p(-8,4,16,2,'#c07050');
    p(-10,6,4,2,'#c07050'); p(6,6,4,2,'#c07050');
    // stubble dots
    for(let i=0;i<6;i++) p(-10+i*4,8,1,1,'rgba(80,40,20,0.4)');
  }

  // ── Ending scene ──────────────────────────────────────────
  function drawEnding(){
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#0a1020'); g.addColorStop(1,'#101030');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    // stars
    for(let i=0;i<80;i++){
      const sx=(i*137)%W, sy=(i*91)%H;
      ctx.fillStyle=`rgba(255,255,255,${0.3+Math.sin(i)*0.3})`;
      ctx.fillRect(sx,sy,2,2);
    }
    // Mağaram window from outside
    rect(W/2-100,H/2-120,200,180,'#0e0c18');
    rect(W/2-94,H/2-114,188,168,'rgba(255,200,80,0.15)');
    border(W/2-100,H/2-120,200,180,'#4a3060',3);
    rect(W/2-2,H/2-120,4,180,'#4a3060');
    rect(W/2-100,H/2-30,200,4,'#4a3060');
    // warm light from window
    ctx.save();
    const wg=ctx.createRadialGradient(W/2,H/2-30,0,W/2,H/2-30,160);
    wg.addColorStop(0,'rgba(255,200,80,0.15)');
    wg.addColorStop(1,'rgba(255,200,80,0)');
    ctx.fillStyle=wg; ctx.fillRect(W/2-160,H/2-190,320,320);
    ctx.restore();
    neonText('Kanka, Geym', W/2, H/2+100, 20, '#c8a0ff');
  }

  // ── Title / menu screen ───────────────────────────────────
  function drawTitle(){
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#060610'); g.addColorStop(1,'#10081a');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    // rain effect (static)
    for(let i=0;i<60;i++){
      const rx=(i*173)%W, ry=(i*113)%H;
      ctx.strokeStyle='rgba(100,80,200,0.2)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(rx,ry); ctx.lineTo(rx+4,ry+16); ctx.stroke();
    }
    // city silhouette
    ctx.fillStyle='#08060e';
    [[0,420,80,180],[80,400,60,200],[140,440,100,160],[240,380,80,220],[320,450,60,150],
     [380,410,100,190],[480,430,80,170],[560,390,100,210],[660,420,80,180],[740,440,60,160]
    ].forEach(([x,y,w,h])=>{
      rect(x,y,w,h,'#08060e');
      // window lights
      for(let r=0;r<4;r++) for(let c=0;c<Math.floor(w/14);c++){
        if(Math.random()>0.5) rect(x+4+c*12,y+8+r*30,8,14,'rgba(255,220,100,0.15)');
      }
    });
    // logo area
    ctx.save();
    ctx.shadowColor='#c060ff'; ctx.shadowBlur=30;
    text('KANKA, GEYM', W/2, 170, 28, '#c8a0ff','center');
    ctx.restore();
    text('BİR TÜRK GECESİNİN HİKAYESİ', W/2, 210, 8, '#7050a0','center');
    // press start
    ctx.save(); ctx.shadowColor='#ffe080'; ctx.shadowBlur=10;
    text('[ BAŞLAMAK İÇİN TIKLA / SPACE ]', W/2, H-80, 8, '#ffe080','center');
    ctx.restore();
    text('v1.0  –  2025', W/2, H-20, 6, '#443355','center');
  }

  return {
    ctx, W, H,
    clear: () => rect(0,0,W,H,'#000'),
    drawOverworld, drawLocationScene,
    drawCutsceneCloseup, drawCutsceneKitchen,
    drawEnding, drawTitle,
  };
})();
