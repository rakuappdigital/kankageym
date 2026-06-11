'use strict';

const Dialogue = (() => {
  // ── DOM refs ────────────────────────────────────────────────────────────
  const dlgBox      = document.getElementById('dialogue-box');
  const dlgSpeaker  = document.getElementById('dialogue-speaker');
  const dlgText     = document.getElementById('dialogue-text');
  const dlgContinue = document.getElementById('dialogue-continue');
  const choiceBox   = document.getElementById('choice-box');

  // ── Engine state ─────────────────────────────────────────────────────────
  let _lines      = [];
  let _lineIdx    = 0;
  let _typing     = false;
  let _typeTimer  = null;
  let _charIdx    = 0;
  let _onDone     = null;
  let _currentNode = null;

  const TYPEWRITER_MS = 36;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _show(el)  { el.classList.remove('hidden'); }
  function _hide(el)  { el.classList.add('hidden'); }

  function _setLine(line) {
    dlgSpeaker.textContent = line.speaker || '';
    dlgText.textContent    = '';
    _hide(dlgContinue);
    _typing  = true;
    _charIdx = 0;
    const text = line.text || '';

    function typeNext() {
      if (_charIdx < text.length) {
        dlgText.textContent += text[_charIdx];
        _charIdx++;
        _typeTimer = setTimeout(typeNext, TYPEWRITER_MS);
      } else {
        _typing = false;
        if (!line.choices || line.choices.length === 0) {
          _show(dlgContinue);
        }
        if (line.choices && line.choices.length > 0) {
          _showChoices(line.choices);
        }
      }
    }

    _typeTimer = setTimeout(typeNext, TYPEWRITER_MS);
  }

  function _completeTyping() {
    clearTimeout(_typeTimer);
    _typing = false;
    const line = _lines[_lineIdx];
    if (line) {
      dlgText.textContent = line.text || '';
      if (!line.choices || line.choices.length === 0) {
        _show(dlgContinue);
      }
      if (line.choices && line.choices.length > 0) {
        _showChoices(line.choices);
      }
    }
  }

  function _showChoices(choices) {
    _hide(dlgContinue);
    choiceBox.innerHTML = '';
    _show(choiceBox);

    choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = choice.text;
      btn.addEventListener('click', () => _selectChoice(choice));
      choiceBox.appendChild(btn);
    });
  }

  function _selectChoice(choice) {
    _hide(choiceBox);
    choiceBox.innerHTML = '';

    if (choice.setFlag) {
      State.set(choice.setFlag, true);
    }

    if (choice.memoryScene) {
      if (window.GameBridge && window.GameBridge.triggerMemory) {
        window.GameBridge.triggerMemory(
          choice.memoryScene,
          choice.next || null,
          _onDone
        );
      }
      return;
    }

    if (choice.next) {
      startNode(choice.next, _onDone);
    } else {
      _finish();
    }
  }

  function _finish() {
    _hide(dlgBox);
    _hide(choiceBox);
    _hide(dlgContinue);
    choiceBox.innerHTML = '';
    _lines   = [];
    _lineIdx = 0;
    const cb = _onDone;
    _onDone  = null;
    if (cb) cb();
  }

  // ── Public: start(lineArr, cb) ────────────────────────────────────────────
  function start(lineArr, cb) {
    _lines   = lineArr || [];
    _lineIdx = 0;
    _onDone  = cb || null;
    _hide(choiceBox);
    choiceBox.innerHTML = '';

    if (_lines.length === 0) {
      if (cb) cb();
      return;
    }

    _show(dlgBox);
    _setLine(_lines[0]);
  }

  // ── Public: advance() ─────────────────────────────────────────────────────
  function advance() {
    if (dlgBox.classList.contains('hidden')) return;
    if (!choiceBox.classList.contains('hidden')) return; // choices active

    if (_typing) {
      _completeTyping();
      return;
    }

    _lineIdx++;
    if (_lineIdx < _lines.length) {
      _setLine(_lines[_lineIdx]);
    } else {
      _finish();
    }
  }

  // ── Public: startNode(nodeId, cb) ─────────────────────────────────────────
  function startNode(nodeId, cb) {
    const node = NODES[nodeId];
    if (!node) {
      console.warn('Dialogue node not found:', nodeId);
      if (cb) cb();
      return;
    }
    _currentNode = nodeId;

    // Build line array: all lines, last line carries choices
    const lines = (node.lines || []).map((l, i) => {
      const isLast = i === node.lines.length - 1;
      return {
        speaker: l.speaker || node.defaultSpeaker || '',
        text:    l.text || l,
        choices: isLast ? (node.choices || null) : null,
      };
    });

    if (lines.length === 0 && node.choices) {
      // No lines, just choices — synthesise an empty line
      lines.push({ speaker: '', text: '', choices: node.choices });
    }

    start(lines, cb);
  }

  // ── Dialogue box click ────────────────────────────────────────────────────
  dlgBox.addEventListener('click', () => {
    if (!choiceBox.classList.contains('hidden')) return;
    advance();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // STORY DATA
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Intro sequences ───────────────────────────────────────────────────────

  const INTRO_SCENE1 = [
    { speaker: 'Sen', text: 'Kafa... doluyor gibi hissediyorum. Sanki biri kafama balyoz vurmuş.' },
    { speaker: 'Sen', text: 'Dün gece ne oldu? Hiçbir şey hatırlamıyorum.' },
    { speaker: 'Sen', text: 'Kahve. Şimdi kahveye ihtiyacım var.' },
  ];

  const INTRO_SCENE2A = [
    { speaker: 'Sen', text: 'Moka potun tıkırtısı... Ethiopian Yirgacheffe. Aromanın içinde bir şeyler eriyor.' },
    { speaker: 'Sen', text: 'Kahvenin kokusu bile çözüm değil ama en azından bir başlangıç.' },
  ];

  const INTRO_SCENE2B = [
    { speaker: 'Sen', text: 'Aslında hayır, kahve hiçbir şeyi çözmez.' },
    { speaker: 'Sen', text: 'Dünü yüzleşme vakti geldi.' },
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // NODE DEFINITIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const NODES = {

    // ── Deccal Ex ───────────────────────────────────────────────────────────

    deccal_intro: {
      defaultSpeaker: 'Devin',
      lines: [
        { text: 'Seni görünce şaşırdım. Dün gece böyle biri değildin.' },
        { text: 'Ne istiyorsun?' },
      ],
      choices: [
        { text: 'İyi misin diye sormak istedim.',      setFlag: 'madeUpWithEx',  next: 'deccal_kind' },
        { text: 'Dün gece ne olduğunu açıkla.',        setFlag: 'arguedWithEx',  next: 'deccal_argue' },
        { text: 'Bir şey hatırlamıyorum aslında.',                               next: 'deccal_confused' },
        { text: 'Seninle konuşmam gerekiyor.',                                   next: 'deccal_serious' },
      ],
    },

    deccal_kind: {
      defaultSpeaker: 'Devin',
      lines: [
        { text: 'Öyle mi...' },
        { text: 'Coffeeland\'da özür dilemiştin. Bence gerçekten hissediyordun ama yanlış yerde yanlış zamanda oldu.' },
        { text: 'Belki barışabiliriz, bilmiyorum.' },
      ],
      choices: [
        { text: 'Coffeeland\'da mı?', next: 'deccal_kind_coffee' },
        { text: 'Teşekkür ederim anlattığın için.', next: null },
      ],
    },

    deccal_kind_coffee: {
      defaultSpeaker: 'Devin',
      lines: [
        { text: 'Evet, dün gece Coffeeland\'daydık. Bir şeyler tartıştık, sonra...' },
        { text: 'Belki baristadan daha fazlasını öğrenebilirsin.' },
      ],
      choices: [
        { text: 'Anlıyorum. Teşekkürler.', next: null },
      ],
    },

    deccal_argue: {
      defaultSpeaker: 'Devin',
      lines: [
        { text: 'Ne açıklayayım? Kafka hakkında saçmalıyordun. Ortaklık mı, üstünlük mü, anlayamadım.' },
        { text: 'Herkesin önünde sesini yükselttin. Çok utandım.' },
      ],
      choices: [
        { text: 'Haklıydım.', next: 'deccal_argue_stubborn' },
        { text: 'Özür dilerim.', next: 'deccal_argue_sorry' },
      ],
    },

    deccal_argue_stubborn: {
      defaultSpeaker: 'Devin',
      lines: [
        { text: 'Hâlâ değişmedin. Git işte.' },
      ],
      choices: [
        { text: 'Peki.', next: null },
      ],
    },

    deccal_argue_sorry: {
      defaultSpeaker: 'Devin',
      lines: [
        { text: 'Sözcükler kolay. Ama... teşekkür ederim.' },
        { text: 'Biraz düşünmek istiyorum.' },
      ],
      choices: [
        { text: 'Anladım.', next: null },
      ],
    },

    deccal_confused: {
      defaultSpeaker: 'Devin',
      lines: [
        { text: 'Hiçbir şey mi? Sana farklı gözlerle bakıyorum şimdi.' },
        { text: 'Birazcık anlatsam da anlayabilecek misin bilmiyorum.' },
      ],
      choices: [
        { text: 'Lütfen anlat.', memoryScene: 'ex_memory', next: 'deccal_confused_memory' },
        { text: 'Tamam, teşekkürler.', next: null },
      ],
    },

    deccal_confused_memory: {
      defaultSpeaker: 'Devin',
      lines: [
        { text: 'İşte o an... Kapının önünde duruyordun.' },
        { text: 'Sanki her şey çok ağırdı. Sen de öyle hissediyordun galiba.' },
      ],
      choices: [
        { text: 'Anlıyorum. Teşekkür ederim.', next: null },
      ],
    },

    deccal_serious: {
      defaultSpeaker: 'Devin',
      lines: [
        { text: 'Peki, konuş.' },
      ],
      choices: [
        { text: 'Dün gece ne hissettim biliyor musun?', next: 'deccal_serious_feelings' },
        { text: 'Bu konuşma olması gerekiyordu.', next: null },
      ],
    },

    deccal_serious_feelings: {
      defaultSpeaker: 'Devin',
      lines: [
        { speaker: 'Sen', text: 'Kaybolmuş gibi hissettim. Her şeyin dışında.' },
        { text: 'Ben de öyle hissediyordum zaten. Ama söylemedin.' },
        { text: 'Umarım şimdi daha iyi olur.' },
      ],
      choices: [
        { text: 'Ben de umarım.', next: null },
      ],
    },

    deccal_revisit: {
      defaultSpeaker: 'Devin',
      lines: [
        { text: 'Yine mi geldin?' },
      ],
      choices: [
        { text: 'Söylemek istediğim bir şey var.',  next: 'deccal_revisit_a' },
        { text: 'Sadece uğramak istedim.',           next: 'deccal_revisit_b' },
      ],
    },

    deccal_revisit_a: {
      defaultSpeaker: 'Devin',
      lines: [
        { text: 'Dinliyorum.' },
        { speaker: 'Sen', text: 'Umarım zamanla düzelir.' },
        { text: 'Belki.' },
      ],
      choices: [
        { text: 'Görüşürüz.', next: null },
      ],
    },

    deccal_revisit_b: {
      defaultSpeaker: 'Devin',
      lines: [
        { text: 'Peki. Kapı açık.' },
      ],
      choices: [
        { text: 'Teşekkürler.', next: null },
      ],
    },

    // ── Coffeeland ──────────────────────────────────────────────────────────

    coffee_intro: {
      defaultSpeaker: 'Barista',
      lines: [
        { text: 'Oh, dün geceki adam! Tekrar hoş geldin.' },
        { text: 'Dün gece burada epey bir gürültü kopardın.' },
      ],
      choices: [
        { text: 'Nasıl bir tartışmaydı?',           memoryScene: 'coffee_argument', next: 'coffee_detail' },
        { text: 'Telefonumu mu unuttum?',            next: 'coffee_phone_hint' },
        { text: 'Kimse bir şey duymadı değil mi?',  next: 'coffee_embarrassed' },
      ],
    },

    coffee_detail: {
      defaultSpeaker: 'Barista',
      lines: [
        { text: 'Devin adlı biriyle oturuyordunuz. Kafka tartışmasına girdiler eh...' },
        { text: 'Masaları vurmaya başladın, sesler yükseldi. Onu üzdün galiba.' },
        { text: 'Ama sonunda özür diledin, iyiydi.' },
      ],
      choices: [
        { text: 'Anladım. Teşekkürler.', next: null },
      ],
    },

    coffee_phone_hint: {
      defaultSpeaker: 'Barista',
      lines: [
        { text: 'Telefon mu? Bıraktığını hatırlıyorum ama giderken aldığını sanmıyorum.' },
        { text: 'Barda belki? Sonra oraya da uğramıştın.' },
      ],
      choices: [
        { text: 'Anladım, bara bakacağım.', next: null },
      ],
    },

    coffee_embarrassed: {
      defaultSpeaker: 'Barista',
      lines: [
        { text: 'Dostum... o kadar yüksek sesle tartışıyordunuz ki sokaktan bile duyuldu.' },
        { text: 'Ama müşteriler genelde unutur. Bir kahve alırsın, geçer.' },
      ],
      choices: [
        { text: 'Bir Ethiopian lütfen...', next: null },
      ],
    },

    coffee_revisit: {
      defaultSpeaker: 'Barista',
      lines: [
        { text: 'Yine uğradın! Her şey yolunda mı?' },
      ],
      choices: [
        { text: 'Bir Ethiopian lütfen.',                          next: 'coffee_drink' },
        { text: 'Dün gece hakkında bir şey daha sormak istiyorum.', next: 'coffee_more_info' },
      ],
    },

    coffee_drink: {
      defaultSpeaker: 'Barista',
      lines: [
        { text: 'Tabii! Sana özel bir demleme yapayım.' },
        { speaker: 'Sen', text: 'Teşekkürler. Bu kahve gibi bazen sadece zamana ihtiyaç var.' },
      ],
      choices: [
        { text: 'Görüşürüz.', next: null },
      ],
    },

    coffee_more_info: {
      defaultSpeaker: 'Barista',
      lines: [
        { text: 'Başka? Hmm... çıkarken mırıldanıyordun bir şeyler.' },
        { text: 'Bara gidiyorum dedin. Ve gittikten sonra işler iyice karıştı galiba.' },
      ],
      choices: [
        { text: 'Anladım. Teşekkürler.', next: null },
      ],
    },

    // ── Maun Sandık Bar ─────────────────────────────────────────────────────

    pub_intro: {
      defaultSpeaker: 'Barmen',
      lines: [
        { text: 'A, geri döndün. Dün geceki "Sertab" adamı.' },
        { text: 'İyi eğlenceydi. Herkes hâlâ konuşuyor.' },
      ],
      choices: [
        { text: 'Sertab\'ı mı söyledim?',  memoryScene: 'bar_night', next: 'pub_sertab_detail' },
        { text: 'Telefonum nerede?',        next: 'pub_phone_found' },
        { text: 'Başka ne yaptım?',         next: 'pub_more_chaos' },
      ],
    },

    pub_sertab_detail: {
      defaultSpeaker: 'Barmen',
      lines: [
        { text: 'Masanın üstüne çıktın ve "Sertab gerçeği söyledi" diye bağırdın.' },
        { text: 'Herkes alkışladı. Güldük, ağladık biraz da.' },
        { text: 'Eğlenceli bir geceydi. Ama telefon takip etmeyi unutma.' },
      ],
      choices: [
        { text: 'Anladım. Peki telefon?', next: 'pub_phone_found' },
        { text: 'Teşekkürler.', next: null },
      ],
    },

    pub_phone_found: {
      defaultSpeaker: 'Barmen',
      lines: [
        { text: 'İşte burada. Kasada bıraktım senin için.' },
        { speaker: 'Sen', text: 'Teşekkürler. Mesaj var mı acaba...' },
      ],
      choices: [
        { text: 'Telefonu aç ve mesajı oku.', memoryScene: 'phone_message', next: 'pub_phone_message' },
        { text: 'Sonra bakarım.',              next: 'pub_phone_later' },
      ],
    },

    pub_phone_message: {
      defaultSpeaker: 'Sen',
      lines: [
        { text: 'Devin\'den bir mesaj... "Çok garip bir geceydi. Teşekkür ederim yine de. —D"' },
        { text: 'Bu mesaj... sanki bir şeyler kapanıyor gibi.' },
      ],
      choices: [
        { text: 'Hmm.', next: null },
      ],
    },

    pub_phone_later: {
      defaultSpeaker: 'Sen',
      lines: [
        { text: 'Belki bakmamak daha iyidir şimdilik.' },
      ],
      choices: [
        { text: 'Tamam.', next: null },
      ],
    },

    pub_more_chaos: {
      defaultSpeaker: 'Barmen',
      lines: [
        { text: 'Masaya çıktın, Kafka hakkında monolog yaptın, sonra birinin içkisini devirdin.' },
        { text: 'Neyse ki güldüler. Sonra ağlamaya başladın. Garip bir geceydi.' },
      ],
      choices: [
        { text: 'Vay.', next: null },
      ],
    },

    pub_revisit: {
      defaultSpeaker: 'Barmen',
      lines: [
        { text: 'Yine mi? Bugün daha sakin görünüyorsun en azından.' },
      ],
      choices: [
        { text: 'Bir bira lütfen.',        next: null },
        { text: 'Sadece uğramak istedim.', next: null },
      ],
    },

    // ── Kanka's Home ────────────────────────────────────────────────────────

    kanka_intro_normal: {
      defaultSpeaker: 'Kanka',
      lines: [
        { text: 'Abi! Dün gece epey içtin. Ama eğlendi misin en azından?' },
        { text: 'Devin\'den bahsettin sürekli. Kafandan çıkmıyor anlaşılan.' },
      ],
      choices: [
        { text: 'Anlat bakalım detaylı.',                     memoryScene: 'bar_night', next: 'kanka_detail' },
        { text: 'Benim bir hata yaptığımı düşünüyor musun?',  next: 'kanka_opinion' },
        { text: 'Teşekkürler.', next: null },
      ],
    },

    kanka_intro_argued: {
      defaultSpeaker: 'Kanka',
      lines: [
        { text: 'Yani... Devin\'le tartıştın duydum. Ve sonra barda rezalet çıkardın.' },
        { text: 'Ama bence içten geliyordu her şey. Yanlış anlaşıldın sadece.' },
      ],
      choices: [
        { text: 'Anlat bakalım detaylı.',                     memoryScene: 'bar_night', next: 'kanka_detail' },
        { text: 'Benim bir hata yaptığımı düşünüyor musun?',  next: 'kanka_opinion' },
        { text: 'Teşekkürler.', next: null },
      ],
    },

    kanka_detail: {
      defaultSpeaker: 'Kanka',
      lines: [
        { text: 'Masanın üstüne çıkıp "Sertab gerçeği söyledi!" diye bağırman... ikonikti.' },
        { text: 'Sonra ağladın. Bana "hayat çok garip" dedin.' },
        { text: 'Ben de "evet" dedim. Birlikte çay içtik sabaha kadar.' },
      ],
      choices: [
        { text: 'Sen en iyisisin.', next: null },
      ],
    },

    kanka_opinion: {
      defaultSpeaker: 'Kanka',
      lines: [
        { text: 'Dürüst olmak gerekirse? Evet, biraz fazla kaçırdın.' },
        { text: 'Ama Devin ile aranızdaki sorun eski. Dün gece sadece patladı.' },
        { text: 'Yüzleşmen gerekiyor. Kaçmak çözüm değil.' },
      ],
      choices: [
        { text: 'Haklısın.', next: null },
      ],
    },

    kanka_all_memories: {
      defaultSpeaker: 'Kanka',
      lines: [
        { text: 'Yani... her şeyi topladın mı? Tüm anları?' },
        { text: 'Coffeeland, bar, Devin, telefon mesajı. Hepsini gördün.' },
        { text: 'Şimdi ne hissediyorsun?' },
      ],
      choices: [
        { text: 'Hafif hissediyorum aslında.',   next: 'kanka_end_a' },
        { text: 'Hâlâ karışık.',                 next: 'kanka_end_b' },
        { text: 'Devin\'e gitsem mi tekrar?',    next: 'kanka_end_c' },
      ],
    },

    kanka_end_a: {
      defaultSpeaker: 'Kanka',
      lines: [
        { text: 'Bu iyi bir şey. Hafiflik zor kazanılır.' },
        { text: 'Mağarana git. Bir de uyku çek.' },
      ],
      choices: [
        { text: 'Teşekkürler.', next: null },
      ],
    },

    kanka_end_b: {
      defaultSpeaker: 'Kanka',
      lines: [
        { text: 'Normal. Bir gecede her şey çözülmez.' },
        { text: 'Ama en azından neyin karışık olduğunu biliyorsun artık.' },
      ],
      choices: [
        { text: 'Evet, bu bile çok şey.', next: null },
      ],
    },

    kanka_end_c: {
      defaultSpeaker: 'Kanka',
      lines: [
        { text: 'Gidebilirsin. Ama ne söyleyeceğini bil önce.' },
        { text: 'Özür mü dileyeceksin, konuşmak mı istiyorsun, yoksa... başka bir şey mi?' },
        { text: 'Netlik sana güç verir.' },
      ],
      choices: [
        { text: 'Anladım.', next: null },
      ],
    },

    kanka_revisit: {
      defaultSpeaker: 'Kanka',
      lines: [
        { text: 'Ne haber?' },
      ],
      choices: [
        { text: 'Sadece uğramak istedim.', next: null },
        { text: 'Bir şey sormak istedim.', next: 'kanka_opinion' },
      ],
    },

    // ── Mağaram ─────────────────────────────────────────────────────────────

    magaram_ending: {
      defaultSpeaker: 'Sen',
      lines: [
        { text: 'Yavaş yavaş hatırlıyorum. Hepsi oradaydı zaten.' },
        { text: 'Coffeeland\'daki tartışma. Barmen\'e telefonu bırakmak. Kanka\'nın masasında ağlamak.' },
        { text: 'Ve Devin\'in mesajı. "Teşekkür ederim yine de."' },
        { text: 'Dün gece her şey dağıldı sandım. Ama belki sadece yerlerine oturdular.' },
        { text: 'Mükemmel değildi. Ama gerçekti. Ve gerçek olan şeyler bir şekilde değer taşıyor.' },
        { text: '— FİN —' },
      ],
    },

    magaram_incomplete: {
      defaultSpeaker: 'Sen',
      lines: [
        { text: 'Henüz hazır değilim. Hâlâ dışarıda cevabını bekleyen şeyler var.' },
        { text: 'Önce her şeyi bulmalıyım.' },
      ],
    },

  }; // end NODES

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    start,
    startNode,
    advance,
    INTRO_SCENE1,
    INTRO_SCENE2A,
    INTRO_SCENE2B,
  };
})();
