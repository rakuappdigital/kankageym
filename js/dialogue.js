'use strict';

// ─────────────────────────────────────────────────────────────
// DIALOGUE ENGINE + ALL STORY DATA
// ─────────────────────────────────────────────────────────────

const Dialogue = (() => {
  const box      = document.getElementById('dialogue-box');
  const spkEl    = document.getElementById('dialogue-speaker');
  const textEl   = document.getElementById('dialogue-text');
  const contEl   = document.getElementById('dialogue-continue');
  const choiceEl = document.getElementById('choice-box');

  let lines = [], index = 0, typing = false, onDone = null;
  let charTimer = null;

  function _speakerLabel(id){
    const map = {
      narrator:    '',
      player:      '— SEN',
      ex:          '— DEVİN  (Deccal Ex)',
      barista:     '— EMRE  (Coffeeland XL Plus)',
      bartender:   '— MURAT  (Maun Sandık Bar)',
      kanka:       '— BERK  (Kankam)',
      self:        '— SEN (iç ses)',
    };
    return map[id] || id.toUpperCase();
  }

  function _typewrite(str, cb){
    typing = true;
    contEl.classList.add('hidden');
    textEl.textContent = '';
    let i = 0;
    charTimer = setInterval(() => {
      textEl.textContent += str[i++];
      if(i >= str.length){ clearInterval(charTimer); typing = false; cb && cb(); }
    }, 38);
  }

  function _showLine(){
    if(index >= lines.length){ _finish(); return; }
    const line = lines[index];

    if(line.choices){
      // render choices
      spkEl.textContent = _speakerLabel('player');
      textEl.textContent = line.prompt || 'Ne yaparsın?';
      contEl.classList.add('hidden');
      _showChoices(line.choices);
      return;
    }

    choiceEl.classList.add('hidden');
    spkEl.textContent = _speakerLabel(line.speaker || 'narrator');
    _typewrite(line.text, () => {
      contEl.classList.remove('hidden');
    });
  }

  function _showChoices(choices){
    choiceEl.innerHTML = '';
    choiceEl.classList.remove('hidden');
    choices.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = c.text;
      btn.addEventListener('click', () => {
        choiceEl.classList.add('hidden');
        if(c.setFlag)  State.set(c.setFlag, true);
        if(c.clearFlag) State.set(c.clearFlag, false);
        if(c.next){
          const node = STORY[c.next];
          if(node){ startNode(c.next, onDone); }
          else { _finish(); }
        } else { _finish(); }
      });
      choiceEl.appendChild(btn);
    });
  }

  function _finish(){
    box.classList.add('hidden');
    choiceEl.classList.add('hidden');
    if(onDone) onDone();
  }

  function advance(){
    if(typing){ clearInterval(charTimer); typing=false; textEl.textContent=lines[index]?.text||''; contEl.classList.remove('hidden'); return; }
    index++;
    _showLine();
  }

  // Start a simple array of line objects
  function start(lineArr, cb){
    lines  = lineArr;
    index  = 0;
    onDone = cb;
    box.classList.remove('hidden');
    _showLine();
  }

  // Start from a story node ID
  function startNode(nodeId, cb){
    const node = STORY[nodeId];
    if(!node){ cb && cb(); return; }
    onDone = cb;
    // Nodes can have: lines[], then optional choices
    const compiled = [...(node.lines || [])];
    if(node.choices){
      compiled.push({ choices: node.choices, prompt: node.prompt });
    }
    start(compiled, cb);
  }

  // ── input glue ──────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if(e.code === 'Space' || e.code === 'Enter'){
      if(!box.classList.contains('hidden') && choiceEl.classList.contains('hidden')){
        advance();
      }
    }
  });
  box.addEventListener('click', () => {
    if(choiceEl.classList.contains('hidden')) advance();
  });

  // ══════════════════════════════════════════════════════════
  //  STORY DATA
  //  Each node: { lines: [{speaker, text}], choices?, prompt? }
  // ══════════════════════════════════════════════════════════

  const STORY = {

    // ── INTRO CUTSCENE LINES (handled by main.js) ──────────
    // These are accessed directly as arrays, not via startNode

    // ── DECCAL EX ──────────────────────────────────────────
    deccal_intro: {
      lines: [
        { speaker:'ex',     text: 'Seni beklemiyordum.' },
        { speaker:'ex',     text: 'Yani, kelimenin tam anlamıyla. Burada ne işin var?' },
        { speaker:'player', text: '...' },
      ],
      prompt: 'Cevap ver:',
      choices: [
        { text: 'İyi misin diye sormak istedim.',      setFlag: 'madeUpWithEx',  next: 'deccal_kind'  },
        { text: 'Dün gece ne olduğunu açıkla.',         setFlag: 'arguedWithEx',  next: 'deccal_argue' },
        { text: 'Sadece geçiyordum.',                   next: 'deccal_pass'  },
      ],
    },

    deccal_kind: {
      lines: [
        { speaker:'ex',     text: 'İyiyim... Sanırım.' },
        { speaker:'ex',     text: 'Dün gece garip bir geceydi. Hem ikimiz için de.' },
        { speaker:'ex',     text: 'Coffeeland\'da sen benden özür dilemiştin. Bunu hatırlıyor musun?' },
        { speaker:'player', text: 'Coffeeland... Evet. Evet tabii.' },
        { speaker:'narrator', text: '[ Hafıza: Coffeeland\'ı ziyaret etmelisin. ]' },
        { speaker:'ex',     text: 'Bak, belki yeniden başlayamayız. Ama teşekkür ederim yine de.' },
      ],
    },

    deccal_argue: {
      lines: [
        { speaker:'ex',     text: 'Harika. İşte bu.' },
        { speaker:'ex',     text: 'Dün gece de tam böyle başladın. Kafka'yı yanlış yorumluyorsun diye 45 dakika bağırdın.' },
        { speaker:'player', text: 'Ben... ne?' },
        { speaker:'ex',     text: 'Bir de üstüne Coffeeland\'da herkese duyurdun. Tebrikler.' },
        { speaker:'ex',     text: 'Git. Lütfen. Kafam çok yorgun.' },
        { speaker:'narrator', text: '[ Hafıza parçası edindin: DEVİN ile tartışma. ]' },
      ],
    },

    deccal_pass: {
      lines: [
        { speaker:'ex',     text: '...' },
        { speaker:'ex',     text: 'Tamam. Geçiyordun. Anladım.' },
        { speaker:'narrator', text: 'Kapı kapandı.' },
      ],
    },

    deccal_revisit: {
      lines: [
        { speaker:'ex',     text: 'Yine mi geldin?' },
      ],
      prompt: '',
      choices: [
        { text: 'Kafayı mı yedim diye kontrol ediyorum.',  next: 'deccal_revisit_a' },
        { text: 'Gidiyorum, özür dilerim.',                next: 'deccal_revisit_b' },
      ],
    },
    deccal_revisit_a: {
      lines: [
        { speaker:'ex', text: 'Test sonucu: evet.' },
        { speaker:'ex', text: 'Yine de... görüşmek iyiydi.' },
      ],
    },
    deccal_revisit_b: {
      lines: [
        { speaker:'ex', text: 'İyi ki geldin aslında.' },
        { speaker:'ex', text: 'Ciddiye alıyorum bunu.' },
      ],
    },

    // ── COFFEELAND XL PLUS ─────────────────────────────────
    coffee_intro: {
      lines: [
        { speaker:'barista', text: 'Hoş geldin! Bugün ne içmek istersin?' },
        { speaker:'barista', text: 'Dur... Sen dün gece buradaydın değil mi?' },
        { speaker:'player',  text: 'Evet. Galiba.' },
        { speaker:'barista', text: 'Galiba mı? Bir saati aşkın oturdu, bir de o kızla tartıştı.' },
        { speaker:'player',  text: 'O kız...' },
        { speaker:'barista', text: 'Güzel biriydi. Sana çok öfkeliydi. Sonra ikisi de çıktı.' },
        { speaker:'barista', text: 'Ve telefonunu masada unuttun. Bende duruyor.' },
        { speaker:'narrator', text: '[ Hafıza parçası edindin: Coffeeland\'daki tartışma. ]' },
        { speaker:'narrator', text: '[ Telefon Maun Sandık Bar\'da kalmış olmalı... ]' },
      ],
    },

    coffee_revisit: {
      lines: [
        { speaker:'barista', text: 'Yine geldin! Bugünkü özel Ethiopian Yirgacheffe var.' },
        { speaker:'barista', text: 'Sana göre. Düşünceli görünüyorsun.' },
      ],
      prompt: '',
      choices: [
        { text: 'Bir kahve lütfen.',   next: 'coffee_drink' },
        { text: 'Teşekkürler, acelem var.', next: 'coffee_bye' },
      ],
    },
    coffee_drink: {
      lines: [
        { speaker:'barista', text: 'Buyur. Yavaş iç, acele etme.' },
        { speaker:'narrator', text: 'Kahveyi içtin. Biraz daha netleşti kafan.' },
      ],
    },
    coffee_bye: {
      lines: [{ speaker:'barista', text: 'Dikkatli ol dışarıda.' }],
    },

    // ── MAUN SANDIK BAR ────────────────────────────────────
    pub_intro: {
      lines: [
        { speaker:'bartender', text: 'Yavaş gel, acele etme.' },
        { speaker:'bartender', text: 'Dün gece burada rezalet çıkardın ya...' },
        { speaker:'player',    text: 'Ne yaptım?' },
        { speaker:'bartender', text: 'Kimseyle kavga etmedin, merak etme. Ama masaya çıkıp Sertab\'ı söylemeye kalktın.' },
        { speaker:'player',    text: 'YAPMA.' },
        { speaker:'bartender', text: 'Yaptın.' },
        { speaker:'bartender', text: 'Neyse. Telefonun masada kaldı. Al.' },
        { speaker:'narrator',  text: '[ Hafıza parçası edindin: Bar\'daki gece. ]' },
        { speaker:'narrator',  text: '[ Telefonu açtın. Devin\'den mesaj var. ]' },
        { speaker:'narrator',  text: '"Çok garip bir geceydi. Teşekkür ederim yine de. —D"' },
      ],
    },

    pub_revisit: {
      lines: [
        { speaker:'bartender', text: 'Bir şey söylemeyeyim mi?' },
      ],
      prompt: '',
      choices: [
        { text: 'Söyle.',        next: 'pub_revisit_a' },
        { text: 'Söyleme.',      next: 'pub_revisit_b' },
      ],
    },
    pub_revisit_a: {
      lines: [
        { speaker:'bartender', text: 'Dün gece ağlamamıştın. Sadece çok gülerdin.' },
        { speaker:'bartender', text: 'İyi işaret bu aslında.' },
      ],
    },
    pub_revisit_b: {
      lines: [
        { speaker:'bartender', text: 'Tamam. Bir içki ister misin en azından?' },
        { speaker:'player',    text: 'Hayır, teşekkürler.' },
        { speaker:'bartender', text: 'Akıllısın.' },
      ],
    },

    // ── KANKA'S HOME ───────────────────────────────────────
    kanka_intro_normal: {
      lines: [
        { speaker:'kanka',  text: 'Yooo, dirinin kendisi! Nasılsın la?' },
        { speaker:'player', text: 'İyi sayılırım. Dün geceyi hatırlamıyorum.' },
        { speaker:'kanka',  text: 'Hahaha, o yüzden mi geldin?' },
        { speaker:'kanka',  text: 'Tamam, dinle. Dün gece Coffeeland\'da Devin\'le karşılaştın.' },
        { speaker:'kanka',  text: 'Uzun lafın kısası: özür diledin. Gerçekten diledin.' },
        { speaker:'kanka',  text: 'Sonra Maun Sandık\'a geçtik. Sen orada... bariyer kalktı diyelim.' },
        { speaker:'narrator','text': '[ Hafıza parçası edindin: Kanka\'nın versiyonu. ]' },
      ],
    },

    kanka_intro_argued: {
      lines: [
        { speaker:'kanka',  text: 'Lan, Devin\'e gittin mi?' },
        { speaker:'player', text: 'Gittim.' },
        { speaker:'kanka',  text: 'Kavga ettiniz mi?' },
        { speaker:'player', text: 'Sanırım.' },
        { speaker:'kanka',  text: 'Bekliyordum bunu.' },
        { speaker:'kanka',  text: 'Yani haklısın aslında. Kafka meselesi gerçekten önemliydi.' },
        { speaker:'kanka',  text: 'Ama bence asıl mesele Kafka değildi.' },
        { speaker:'player', text: 'Hayır. Değildi.' },
        { speaker:'kanka',  text: 'Otur biraz. Anlat.' },
        { speaker:'narrator','text': '[ Hafıza parçası edindin: Kanka\'nın versiyonu. ]' },
      ],
    },

    kanka_all_memories: {
      lines: [
        { speaker:'kanka',  text: 'Artık her şeyi topladın galiba.' },
        { speaker:'player', text: 'Sanırım. Hepsini hatırladım.' },
        { speaker:'kanka',  text: 'Peki? Ne hissediyorsun?' },
      ],
      prompt: '',
      choices: [
        { text: 'Hafif hissediyorum aslında.',  next: 'kanka_end_a' },
        { text: 'Hâlâ karışık.',                next: 'kanka_end_b' },
      ],
    },

    kanka_end_a: {
      lines: [
        { speaker:'kanka',  text: 'İşte bu.' },
        { speaker:'kanka',  text: 'Git mağarana. Biraz uyu. Yarın her şey daha net görünür.' },
        { speaker:'narrator','text': '[ Eve dön. ]' },
      ],
    },
    kanka_end_b: {
      lines: [
        { speaker:'kanka',  text: 'Normal bu.' },
        { speaker:'kanka',  text: 'Ama bak; karışıklık en azından dürüstlük demek.' },
        { speaker:'kanka',  text: 'Git biraz hava al. Ya da yat. İkisi de işe yarar.' },
        { speaker:'narrator','text': '[ Eve dön. ]' },
      ],
    },

    kanka_revisit: {
      lines: [
        { speaker:'kanka', text: 'Yine mi geldin?' },
        { speaker:'kanka', text: 'Çay koydum az önce, otur.' },
      ],
    },

    // ── MAĞARAM (home return – ending trigger) ─────────────
    magaram_ending: {
      lines: [
        { speaker:'self',     text: 'Gece yarısına geliyor.' },
        { speaker:'self',     text: 'Şehir hâlâ uyanık. Ben de.' },
        { speaker:'self',     text: 'Dün gece ne olduğunu artık biliyorum.' },
        { speaker:'self',     text: 'Bazı şeyler için geç. Bazıları için değil.' },
        { speaker:'self',     text: 'Ama bu gece, en azından, gerçekten yaşandı.' },
        { speaker:'narrator', text: '— FİN —' },
      ],
    },

    magaram_incomplete: {
      lines: [
        { speaker:'self', text: 'Henüz her şeyi toplamadım.' },
        { speaker:'self', text: 'Daha gezecek yerlerim var.' },
      ],
    },
  };

  // ── Intro cutscene lines (used directly by main.js) ──────
  const INTRO_SCENE1 = [
    { speaker:'self', text: 'Başım çatlıyor...' },
    { speaker:'self', text: 'Dün gece ne oldu... hiçbir şey hatırlamıyorum.' },
    { speaker:'self', text: 'Şu an tek ihtiyacım olan şey, sert bir kahve.' },
  ];

  const INTRO_SCENE2A = [
    { speaker:'self', text: 'Kaliteli bir Ethiopian Yirgacheffe...' },
    { speaker:'self', text: 'Bu aroma hayattaki her sorunu çözer.' },
  ];

  const INTRO_SCENE2B = [
    { speaker:'self', text: 'Aslında hayır, çözmez.' },
    { speaker:'self', text: 'Artık yüzleşme vakti geldi.' },
  ];

  return { start, startNode, advance, STORY, INTRO_SCENE1, INTRO_SCENE2A, INTRO_SCENE2B };
})();
