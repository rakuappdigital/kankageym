'use strict';

const Audio = (() => {
  // Tracks mapped to asset paths — drop mp3 files into assets/audio/ to activate.
  const TRACKS = {
    overworld:  'assets/audio/overworld.mp3',
    magaram:    'assets/audio/magaram.mp3',
    deccal:     'assets/audio/deccal.mp3',
    coffee:     'assets/audio/coffee.mp3',
    pub:        'assets/audio/pub.mp3',
    kanka:      'assets/audio/kanka.mp3',
    ending:     'assets/audio/ending.mp3',
  };

  let current = null;
  const cache = {};

  function _get(key) {
    if (!TRACKS[key]) return null;
    if (!cache[key]) {
      const a = new window.Audio(TRACKS[key]);
      a.loop = true;
      a.volume = 0.55;
      cache[key] = a;
    }
    return cache[key];
  }

  function play(key) {
    const next = _get(key);
    if (!next) return;
    if (current && current !== next) {
      current.pause();
      current.currentTime = 0;
    }
    current = next;
    current.play().catch(() => {}); // autoplay policy guard
  }

  function stop() {
    if (current) { current.pause(); current.currentTime = 0; current = null; }
  }

  function fadeOut(cb) {
    if (!current) { cb && cb(); return; }
    const t = current;
    const step = setInterval(() => {
      if (t.volume > 0.05) { t.volume = Math.max(0, t.volume - 0.05); }
      else { clearInterval(step); t.pause(); t.currentTime = 0; t.volume = 0.55; cb && cb(); }
    }, 60);
  }

  return { play, stop, fadeOut };
})();
