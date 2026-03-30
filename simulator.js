// ============================================
// MLB Game Simulator — SEA @ TOR
// ============================================

const AWAY_TEAM = { abbr: 'SEA', name: 'Mariners', color: '#0B2C57', record: '85-77' };
const HOME_TEAM = { abbr: 'TOR', name: 'Blue Jays', color: '#E8291C', record: '89-73' };

const SEA_LINEUP = [
  { name: 'J. Rodriguez', pos: 'CF', number: 44 },
  { name: 'C. Raleigh', pos: 'C', number: 29 },
  { name: 'R. Canó', pos: 'DH', number: 22 },
  { name: 'T. France', pos: '1B', number: 21 },
  { name: 'M. Haniger', pos: 'RF', number: 17 },
  { name: 'E. Suárez', pos: '3B', number: 28 },
  { name: 'J. Crawford', pos: 'SS', number: 3 },
  { name: 'D. Moore', pos: '2B', number: 5 },
  { name: 'J. Kelenic', pos: 'LF', number: 10 },
];

const TOR_LINEUP = [
  { name: 'V. Guerrero Jr.', pos: '1B', number: 27 },
  { name: 'B. Bichette', pos: 'SS', number: 11 },
  { name: 'G. Springer', pos: 'CF', number: 4 },
  { name: 'D. Varsho', pos: 'LF', number: 25 },
  { name: 'A. Kirk', pos: 'C', number: 30 },
  { name: 'K. Kiermaier', pos: 'RF', number: 39 },
  { name: 'M. Chapman', pos: '3B', number: 26 },
  { name: 'S. Espinal', pos: '2B', number: 5 },
  { name: 'D. Jansen', pos: 'DH', number: 9 },
];

const SEA_PITCHER = { name: 'L. Gilbert', number: 45 };
const TOR_PITCHER = { name: 'K. Gausman', number: 34 };

// ---- State ----
let state = null;
let simInterval = null;
let isPlaying = false;

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function lastName(fullName) {
  const parts = fullName.split(' ');
  return parts.slice(1).join(' ');
}

function initState() {
  return {
    away: AWAY_TEAM,
    home: HOME_TEAM,
    awayScore: 0,
    homeScore: 0,
    inning: 1,
    halfInning: 'top',
    balls: 0,
    strikes: 0,
    outs: 0,
    bases: [false, false, false],
    awayLineup: SEA_LINEUP.map(p => ({ ...p, hits: 0, abs: 0 })),
    homeLineup: TOR_LINEUP.map(p => ({ ...p, hits: 0, abs: 0 })),
    awayBatterIdx: 0,
    homeBatterIdx: 0,
    awayPitcher: SEA_PITCHER,
    homePitcher: TOR_PITCHER,
    awayPitchCount: 0,
    homePitchCount: 0,
    pitcherK: 0,
    pitcherOuts: 0,
    gameOver: false,
    totalOuts: 0,
  };
}

// ---- DOM refs ----
const $ = (id) => document.getElementById(id);

const dom = {
  awayAbbr: $('away-abbr'),
  awayScore: $('away-score'),
  awayRow: $('away-row'),
  awayColorBar: $('away-color-bar'),
  awayPlayer: $('away-player'),
  awayStat: $('away-stat'),
  homeAbbr: $('home-abbr'),
  homeScore: $('home-score'),
  homeRow: $('home-row'),
  homeColorBar: $('home-color-bar'),
  homePlayer: $('home-player'),
  homeStat: $('home-stat'),
  inningArrow: $('inning-arrow'),
  inningNumber: $('inning-number'),
  countText: $('count-text'),
  outs: $('outs'),
  base1: $('base-1'),
  base2: $('base-2'),
  base3: $('base-3'),
  btnPlay: $('btn-play'),
  playIcon: $('play-icon'),
  pauseIcon: $('pause-icon'),
  playLabel: $('play-label'),
  btnNext: $('btn-next'),
  btnReset: $('btn-reset'),
  speedRange: $('speed-range'),
  speedValue: $('speed-value'),
  gameLog: $('game-log'),
  themeToggle: $('theme-toggle'),
};

// ---- Rendering ----
function render() {
  const s = state;

  // Teams
  dom.awayAbbr.textContent = s.away.abbr;
  dom.awayColorBar.style.background = s.away.color;
  dom.homeAbbr.textContent = s.home.abbr;
  dom.homeColorBar.style.background = s.home.color;

  // Scores
  dom.awayScore.textContent = s.awayScore;
  dom.homeScore.textContent = s.homeScore;

  // At-bat highlight
  dom.awayRow.classList.toggle('at-bat', s.halfInning === 'top' && !s.gameOver);
  dom.homeRow.classList.toggle('at-bat', s.halfInning === 'bottom' && !s.gameOver);

  // Player names under team abbr, stats on right
  if (s.gameOver) {
    dom.awayPlayer.innerHTML = '';
    dom.homePlayer.innerHTML = '';
    dom.awayStat.textContent = '';
    dom.homeStat.textContent = '';
  } else if (s.halfInning === 'top') {
    const batterIdx = s.awayBatterIdx % 9;
    const batter = s.awayLineup[batterIdx];
    dom.awayPlayer.innerHTML = `<strong>${batterIdx + 1}.</strong> ${lastName(batter.name)}`;
    dom.awayStat.textContent = `${batter.hits}-${batter.abs}`;
    dom.homePlayer.textContent = lastName(s.homePitcher.name);
    dom.homeStat.textContent = s.homePitchCount > 0 ? `P:${s.homePitchCount}` : '';
  } else {
    dom.awayPlayer.textContent = lastName(s.awayPitcher.name);
    dom.awayStat.textContent = s.awayPitchCount > 0 ? `P:${s.awayPitchCount}` : '';
    const batterIdx = s.homeBatterIdx % 9;
    const batter = s.homeLineup[batterIdx];
    dom.homePlayer.innerHTML = `<strong>${batterIdx + 1}.</strong> ${lastName(batter.name)}`;
    dom.homeStat.textContent = `${batter.hits}-${batter.abs}`;
  }

  // Inning
  dom.inningNumber.textContent = formatInning(s.inning);
  dom.inningArrow.classList.toggle('bottom', s.halfInning === 'bottom');

  // Count (balls-strikes) & outs
  dom.countText.textContent = `${s.balls}-${s.strikes}`;
  setDots(dom.outs, s.outs);

  // Bases
  dom.base1.classList.toggle('occupied', s.bases[0]);
  dom.base2.classList.toggle('occupied', s.bases[1]);
  dom.base3.classList.toggle('occupied', s.bases[2]);

  // Game over
  const existingBanner = document.querySelector('.game-over-banner');
  if (s.gameOver && !existingBanner) {
    const banner = document.createElement('div');
    banner.className = 'game-over-banner';
    banner.textContent = 'Final';
    document.querySelector('.scorebug').appendChild(banner);
  } else if (!s.gameOver && existingBanner) {
    existingBanner.remove();
  }
}

function formatIP(totalOuts) {
  const full = Math.floor(totalOuts / 3);
  const partial = totalOuts % 3;
  return `${full}.${partial}`;
}

function setDots(container, count) {
  const dots = container.querySelectorAll('.dot');
  for (let i = 0; i < dots.length; i++) {
    dots[i].classList.toggle('active', i < count);
  }
}

function flashScore(side) {
  const el = side === 'away' ? dom.awayScore : dom.homeScore;
  el.classList.remove('flash');
  void el.offsetWidth;
  el.classList.add('flash');
}

function log(text, type = '') {
  const entry = document.createElement('div');
  entry.className = `log-entry${type ? ` log-${type}` : ''}`;
  entry.textContent = text;
  dom.gameLog.appendChild(entry);
  dom.gameLog.scrollTop = dom.gameLog.scrollHeight;
}

// ---- Simulation Logic ----
function simulatePitch() {
  if (state.gameOver) {
    pause();
    return;
  }

  const s = state;
  const rand = Math.random();

  // Increment pitch count for active pitcher
  if (s.halfInning === 'top') {
    s.homePitchCount++;
  } else {
    s.awayPitchCount++;
  }

  if (rand < 0.38) {
    s.balls++;
    if (s.balls >= 4) {
      walk();
    }
  } else if (rand < 0.66) {
    if (s.strikes < 2) {
      s.strikes++;
    } else {
      recordOut('strikeout');
    }
  } else if (rand < 0.80) {
    if (s.strikes < 2) {
      s.strikes++;
    }
  } else if (rand < 0.91) {
    const outType = pickRandom(['grounds out', 'flies out', 'lines out', 'pops out']);
    const advanceRand = Math.random();

    if (s.bases[2] && s.outs < 2 && outType === 'flies out' && advanceRand < 0.6) {
      scoreRun(s.halfInning === 'top' ? 'away' : 'home');
      s.bases[2] = false;
      log(`${getCurrentBatter()} flies out (sac fly), run scores`, 'score');
      getCurrentBatterObj().abs++;
      advanceBatter();
      recordOutSilent();
    } else {
      if (s.bases[0] && s.outs < 2 && outType === 'grounds out' && Math.random() < 0.35) {
        log(`${getCurrentBatter()} grounds into double play`, 'out');
        getCurrentBatterObj().abs++;
        advanceBatter();
        resetCount();
        recordOutSilent();
        s.bases[0] = false;
        if (s.outs < 3) {
          recordOutSilent();
        }
        if (s.bases[2] && Math.random() < 0.5) {
          scoreRun(s.halfInning === 'top' ? 'away' : 'home');
          s.bases[2] = false;
        }
      } else {
        log(`${getCurrentBatter()} ${outType}`, 'out');
        getCurrentBatterObj().abs++;
        advanceBatter();
        recordOut('fielding');
      }
    }
    return;
  } else {
    const hitRand = Math.random();
    let hitType;
    if (hitRand < 0.62) hitType = 'single';
    else if (hitRand < 0.82) hitType = 'double';
    else if (hitRand < 0.92) hitType = 'triple';
    else hitType = 'home run';

    processHit(hitType);
    return;
  }

  render();
}

function getCurrentBatterObj() {
  const lineup = state.halfInning === 'top' ? state.awayLineup : state.homeLineup;
  const idx = state.halfInning === 'top' ? state.awayBatterIdx : state.homeBatterIdx;
  return lineup[idx % 9];
}

function getCurrentBatter() {
  return getCurrentBatterObj().name;
}

function advanceBatter() {
  if (state.halfInning === 'top') {
    state.awayBatterIdx = (state.awayBatterIdx + 1) % 9;
  } else {
    state.homeBatterIdx = (state.homeBatterIdx + 1) % 9;
  }
}

function walk() {
  const side = state.halfInning === 'top' ? 'away' : 'home';
  log(`${getCurrentBatter()} walks`, '');

  if (state.bases[0] && state.bases[1] && state.bases[2]) {
    scoreRun(side);
  } else if (state.bases[0] && state.bases[1]) {
    state.bases[2] = true;
  } else if (state.bases[0]) {
    state.bases[1] = true;
  }
  state.bases[0] = true;

  resetCount();
  advanceBatter();
  render();
}

function processHit(hitType) {
  const s = state;
  const side = s.halfInning === 'top' ? 'away' : 'home';
  const batter = getCurrentBatter();

  const batterObj = getCurrentBatterObj();
  batterObj.hits++;
  batterObj.abs++;

  if (hitType === 'home run') {
    let runs = 1;
    if (s.bases[0]) runs++;
    if (s.bases[1]) runs++;
    if (s.bases[2]) runs++;
    for (let i = 0; i < runs; i++) scoreRun(side);
    s.bases = [false, false, false];
    const label = runs === 4 ? 'GRAND SLAM' : runs === 1 ? 'solo home run' : `${runs}-run home run`;
    log(`${batter} hits a ${label}!`, 'score');
  } else if (hitType === 'triple') {
    if (s.bases[2]) scoreRun(side);
    if (s.bases[1]) scoreRun(side);
    if (s.bases[0]) scoreRun(side);
    s.bases = [false, false, true];
    log(`${batter} triples`, 'score');
  } else if (hitType === 'double') {
    if (s.bases[2]) scoreRun(side);
    if (s.bases[1]) scoreRun(side);
    if (s.bases[0]) { s.bases[2] = true; s.bases[0] = false; }
    s.bases[1] = true;
    log(`${batter} doubles`, s.bases[2] || s.bases[1] ? 'score' : '');
  } else {
    if (s.bases[2]) scoreRun(side);
    if (s.bases[1]) {
      if (Math.random() < 0.4) {
        scoreRun(side);
        s.bases[2] = false;
      } else {
        s.bases[2] = true;
      }
      s.bases[1] = false;
    }
    if (s.bases[0]) { s.bases[1] = true; }
    s.bases[0] = true;
    log(`${batter} singles`, '');
  }

  resetCount();
  advanceBatter();
  render();
}

function scoreRun(side) {
  if (side === 'away') {
    state.awayScore++;
    flashScore('away');
  } else {
    state.homeScore++;
    flashScore('home');

    if (state.inning >= 9 && state.halfInning === 'bottom' && state.homeScore > state.awayScore) {
      endGame();
    }
  }
}

function recordOut(type) {
  const s = state;
  if (type === 'strikeout') {
    log(`${getCurrentBatter()} strikes out`, 'out');
    s.pitcherK++;
    getCurrentBatterObj().abs++;
    advanceBatter();
  }

  s.outs++;
  s.pitcherOuts++;
  s.totalOuts++;
  resetCount();

  if (s.outs >= 3) {
    endHalfInning();
  }

  render();
}

function recordOutSilent() {
  state.outs++;
  state.pitcherOuts++;
  state.totalOuts++;

  if (state.outs >= 3) {
    endHalfInning();
  }

  render();
}

function endHalfInning() {
  const s = state;
  s.outs = 0;
  s.bases = [false, false, false];
  resetCount();

  if (s.halfInning === 'top') {
    s.halfInning = 'bottom';

    if (s.inning >= 9 && s.homeScore > s.awayScore) {
      endGame();
      return;
    }

    s.pitcherOuts = 0;
    s.pitcherK = 0;
    log(`Mid ${formatInning(s.inning)} | ${s.away.abbr} ${s.awayScore} - ${s.home.abbr} ${s.homeScore}`, 'inning');
  } else {
    if (s.inning >= 9 && s.homeScore !== s.awayScore) {
      endGame();
      return;
    }

    s.halfInning = 'top';
    s.inning++;
    s.pitcherOuts = 0;
    s.pitcherK = 0;
    log(`End ${formatInning(s.inning - 1)} | ${s.away.abbr} ${s.awayScore} - ${s.home.abbr} ${s.homeScore}`, 'inning');
  }
}

function formatInning(n) {
  const suffixes = { 1: 'st', 2: 'nd', 3: 'rd' };
  const suffix = suffixes[n] || 'th';
  return `${n}${suffix}`;
}

function resetCount() {
  state.balls = 0;
  state.strikes = 0;
}

function endGame() {
  state.gameOver = true;
  const winner = state.homeScore > state.awayScore ? state.home : state.away;
  log(`Final: ${state.away.abbr} ${state.awayScore}, ${state.home.abbr} ${state.homeScore} - ${winner.name} win!`, 'inning');
  pause();
  render();
}

// ---- Controls ----
function getSpeed() {
  return parseInt(dom.speedRange.value);
}

function getInterval() {
  const speed = getSpeed();
  return 2100 - speed * 200;
}

function play() {
  if (state.gameOver) return;
  isPlaying = true;
  dom.playIcon.classList.add('hidden');
  dom.pauseIcon.classList.remove('hidden');
  dom.playLabel.textContent = 'Pause';
  simInterval = setInterval(() => simulatePitch(), getInterval());
}

function pause() {
  isPlaying = false;
  clearInterval(simInterval);
  simInterval = null;
  dom.playIcon.classList.remove('hidden');
  dom.pauseIcon.classList.add('hidden');
  dom.playLabel.textContent = 'Play';
}

function reset() {
  pause();
  state = initState();
  dom.gameLog.innerHTML = '';
  log(`${state.away.abbr} @ ${state.home.abbr} - Play ball!`, 'inning');
  render();
}

// ---- Theme toggle ----
function getEffectiveTheme() {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr) return attr;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function toggleTheme() {
  const current = getEffectiveTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

// ---- Event listeners ----
dom.btnPlay.addEventListener('click', () => {
  if (isPlaying) {
    pause();
  } else {
    play();
  }
});

dom.btnNext.addEventListener('click', () => {
  if (!state.gameOver) {
    simulatePitch();
  }
});

dom.btnReset.addEventListener('click', reset);

dom.speedRange.addEventListener('input', () => {
  dom.speedValue.textContent = `${getSpeed()}x`;
  if (isPlaying) {
    clearInterval(simInterval);
    simInterval = setInterval(() => simulatePitch(), getInterval());
  }
});

dom.themeToggle.addEventListener('click', toggleTheme);

// Follow system theme changes if no manual override
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    document.documentElement.setAttribute('data-theme', e.matches ? 'light' : 'dark');
  }
});

// ---- Init ----
state = initState();
log(`${state.away.abbr} @ ${state.home.abbr} - Play ball!`, 'inning');
render();
