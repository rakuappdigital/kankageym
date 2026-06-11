'use strict';

const State = (() => {
  const flags = {
    // story progress
    introComplete:     false,
    leftHome:          false,

    // Deccal Ex
    visitedEx:         false,
    arguedWithEx:      false,
    madeUpWithEx:      false,
    exMemory:          false,   // memory fragment 4

    // Coffeeland XL Plus
    visitedCoffeeland: false,
    heardGossip:       false,   // memory fragment 1

    // Maun Sandık Bar
    visitedPub:        false,
    foundPhone:        false,   // memory fragment 2

    // Kanka's Home
    visitedKanka:      false,
    kankaRevealed:     false,   // memory fragment 3

    // Meta
    gameComplete:      false,
  };

  // Location visit counts (for repeated visits)
  const visits = {
    'Deccal Ex': 0,
    'Coffeeland XL Plus': 0,
    'Maun Sandık Bar': 0,
    "Kanka's Home": 0,
    'Mağaram': 0,
  };

  return {
    get: (k)       => flags[k],
    set: (k, v)    => { flags[k] = v; },
    visit: (loc)   => { visits[loc] = (visits[loc] || 0) + 1; return visits[loc]; },
    getVisits: (l) => visits[l] || 0,

    memoriesCollected() {
      return [flags.heardGossip, flags.foundPhone, flags.kankaRevealed, flags.exMemory]
        .filter(Boolean).length;
    },

    allMemories() {
      return flags.heardGossip && flags.foundPhone && flags.kankaRevealed && flags.exMemory;
    },
  };
})();
