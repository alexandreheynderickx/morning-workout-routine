// Morning Moves – workout app (PWA). Data lives in localStorage on the phone.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// ---------- Exercises ----------
const ALL = [...MOBILITY, ...Object.values(STRENGTH), COOLDOWN];
ALL.forEach(ex => { ex.keys = ex.keys.map(k => ({ ...k, p: norm(k.p) })); Object.assign(ex, (window.VIDEOS || {})[ex.id] || {}); });
const BY_ID = Object.fromEntries(ALL.map(ex => [ex.id, ex]));
const TIMING = { 1: [30, 15], 2: [40, 15], 3: [45, 15] };
const thumb = ex => frameOf(ex, ex.keys[ex.snaps[ex.snaps.length - 1][0]].p);
const sideText = (ex, s) => s ? (ex.sideText || '{s} side').replace('{s}', s) : '';
const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- State ----------
const KEY = 'morning-moves-v1';
function load() {
  let d = {};
  try { d = JSON.parse(localStorage.getItem(KEY)) || {}; } catch {}
  return { start: null, next: 0, history: [], checks: [], ...d,
           settings: { voice: true, beeps: true, phase: 'auto', overrideSilent: false, ...(d.settings || {}) } };
}
let S = load();
const save = () => localStorage.setItem(KEY, JSON.stringify(S));

const dayKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseDay = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const todayKey = () => dayKey(new Date());
const daysBetween = (a, b) => Math.round((parseDay(b) - parseDay(a)) / 864e5);

function program(day = todayKey()) {
  const days = Math.max(0, daysBetween(S.start || day, day));
  const week = Math.floor(days / 7) + 1, cw = (week - 1) % 8 + 1, cycle = Math.floor((week - 1) / 8) + 1;
  const auto = cw <= 2 ? 1 : cw <= 5 ? 2 : 3;
  return { week, cw, cycle, auto, phase: S.settings.phase === 'auto' ? auto : +S.settings.phase, block: Math.floor((week - 1) / 4) };
}
const doneOn = k => S.history.filter(h => h.date === k);
function weekStart(d = new Date()) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; }
function weekCount(ws) { const keys = new Set(); for (let i = 0; i < 7; i++) { const d = new Date(ws); d.setDate(d.getDate() + i); if (doneOn(dayKey(d)).length) keys.add(i); } return keys.size; }
function weekStreak() { // consecutive weeks (incl. this one if ≥4 so far, otherwise starting last week) with ≥ 4 training days
  let ws = weekStart(), n = 0;
  if (weekCount(ws) < 4) ws.setDate(ws.getDate() - 7);
  while (weekCount(ws) >= 4) { n++; ws.setDate(ws.getDate() - 7); }
  return n;
}
const checkDue = () => !S.checks.some(c => program(c.date).block === program().block);

// ---------- Workout builder ----------
function buildWorkout(kind, sIdx, phase) {
  const steps = [], [work, rest] = TIMING[phase];
  if (kind !== 'strength') MOBILITY.forEach((ex, i) => {
    const base = { ex, block: 'Mobility', n: i + 1, of: MOBILITY.length };
    steps.push({ ...base, type: i ? 'prep' : 'ready', dur: i ? 6 : 8, side: ex.sides?.[0][0] });
    if (ex.sides) ex.sides.forEach(([side, sec], j) => {
      if (j) steps.push({ ...base, type: 'switch', dur: 5, side });
      steps.push({ ...base, type: 'work', dur: sec, side });
    });
    else steps.push({ ...base, type: 'work', dur: ex.sec });
  });
  if (kind !== 'mobility') {
    const list = SESSIONS[sIdx].ex.map(id => STRENGTH[id]), block = `Session ${sIdx + 1}`;
    for (let r = 1; r <= 2; r++) list.forEach((ex, i) => {
      const uni = ex.uni || (ex.uniPhase && phase >= ex.uniPhase), side = uni ? (r === 1 ? 'left' : 'right') : null;
      const base = { ex, side, block, round: r, n: i + 1, of: list.length };
      const first = r === 1 && i === 0;
      steps.push({ ...base, type: first ? (steps.length ? 'prep' : 'ready') : 'rest', dur: first ? 10 : i === 0 ? 20 : rest, newRound: r === 2 && i === 0 });
      steps.push({ ...base, type: 'work', dur: work, cue: `Phase ${phase} · ${ex.prog[phase - 1]}` });
    });
  }
  steps.push({ ex: COOLDOWN, block: 'Cool-down', type: 'prep', dur: 6 });
  steps.push({ ex: COOLDOWN, block: 'Cool-down', type: 'work', dur: COOLDOWN.sec });
  return steps;
}
const totalSec = steps => steps.reduce((s, x) => s + x.dur, 0);
const mins = s => `${Math.round(s / 60)} min`;

// ---------- Sound & voice ----------
let ac = null, voice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices().filter(v => /^en[-_]/i.test(v.lang));
  voice = vs.find(v => /Samantha|Karen|Moira|Tessa|Serena|Kate|Female/i.test(v.name)) || vs.find(v => /en[-_](GB|US)/i.test(v.lang)) || vs[0] || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function unlockAudio() {
  try { if (navigator.audioSession) navigator.audioSession.type = S.settings.overrideSilent ? 'playback' : 'auto'; } catch {}
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); } catch {}
  if ('speechSynthesis' in window) speechSynthesis.speak(new SpeechSynthesisUtterance(' ')); // iOS: first utterance must come from a tap
}
function say(text) {
  if (!S.settings.voice || !('speechSynthesis' in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-GB';
  u.rate = 1.02;
  speechSynthesis.speak(u);
}
function beep(freq = 660, dur = .12) {
  if (!S.settings.beeps || !ac) return;
  const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.5, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + .03);
}
let wake = null;
async function keepAwake(on) {
  try { if (on && !wake && navigator.wakeLock) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => wake = null); } else if (!on && wake) { await wake.release(); wake = null; } } catch {}
}

// ---------- Player ----------
let W = null; // active workout
function startWorkout(kind, sIdx) {
  unlockAudio();
  if (!S.start) { S.start = todayKey(); save(); }
  const phase = program().phase, steps = buildWorkout(kind, sIdx, phase);
  W = { kind, sIdx, phase, steps, i: 0, t0: 0, pausedAt: null, lastSec: null, cues: new Set(), began: Date.now() };
  $('#player').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  keepAwake(true);
  enterStep(0);
}
const elapsed = () => ((W.pausedAt ?? performance.now()) - W.t0) / 1000;
const nextWork = from => W.steps.slice(from).find(s => s.type === 'work');

function enterStep(i) {
  W.i = i; W.t0 = performance.now(); W.lastSec = null; W.cues = new Set();
  if (W.pausedAt) W.pausedAt = W.t0;
  const st = W.steps[i], name = st.ex.name, side = sideText(st.ex, st.side);
  const speech = {
    ready: `Let's go. First: ${name}${side ? ', ' + side : ''}.`,
    prep: st.block === 'Cool-down' ? `Cool-down. ${name}.` : `Next: ${name}${side ? ', ' + side : ''}.`,
    switch: `Switch sides. ${cap1(side)}.`,
    rest: `${st.newRound ? 'Round 2. ' : ''}Rest. Next: ${name}${side ? ', ' + side : ''}.`,
    work: st.block === 'Mobility' || st.ex === COOLDOWN ? `Go. ${st.dur} seconds.` : 'Go!',
  }[st.type];
  say(speech);
  if (st.type === 'work') beep(990, .25);
  renderStep();
}

const STATUS = { ready: 'GET READY', prep: 'UP NEXT', switch: 'SWITCH SIDES', rest: 'REST', work: 'GO' };
function renderStep() {
  const st = W.steps[W.i], p = $('#player');
  p.className = `player ${st.type}${W.pausedAt ? ' paused' : ''}`;
  $('#pStatus').className = `p-status ${st.type}`;
  $('#pStatus').textContent = st.type === 'rest' && st.newRound ? 'ROUND 2 · REST' : STATUS[st.type];
  $('#pBlock').textContent = st.ex === COOLDOWN ? 'Cool-down' : `${st.block}${st.round ? ` · Round ${st.round}` : ''} · ${st.n}/${st.of}`;
  $('#pName').textContent = st.ex.name;
  $('#pSide').textContent = st.side ? cap1(sideText(st.ex, st.side)) : '';
  $('#pSub').textContent = st.type === 'work' ? (st.cue || st.ex.focus) : st.type === 'switch' ? 'Get into position on the other side' : st.type === 'rest' ? 'Breathe — shake it out' : 'Get into position';
  const nw = nextWork(W.i + 1);
  $('#pNext').innerHTML = nw && st.type === 'work' ? `<div class="fig">${thumb(nw.ex)}</div><div>Then<b>${nw.ex.name}</b></div>`
    : st.type !== 'work' ? `<div>Get into position:<b>${st.ex.steps[0]}</b></div>` : '<div>Last one — almost done!</div>';
  $('#pPlay').textContent = W.pausedAt ? '▶' : '⏸';
}

function next() { if (W.i + 1 >= W.steps.length) return finish(true); enterStep(W.i + 1); }
function back() { if (elapsed() > 2 || W.i === 0) enterStep(W.i); else enterStep(W.i - 1); }
function togglePause() {
  if (!W) return;
  if (W.pausedAt) { W.t0 += performance.now() - W.pausedAt; W.pausedAt = null; unlockAudio(); say('Resume'); }
  else { W.pausedAt = performance.now(); window.speechSynthesis?.cancel(); }
  renderStep();
}

function tickPlayer(now) {
  const st = W.steps[W.i], el = elapsed(), rem = Math.max(0, st.dur - el), sec = Math.ceil(rem);
  if (!W.pausedAt) {
    if (sec !== W.lastSec) {
      if (W.lastSec !== null && sec >= 1 && sec <= 3) beep(660, .12);
      if (W.lastSec !== null && sec === 10 && st.type === 'work' && st.dur >= 30) say('10 seconds');
      W.lastSec = sec;
    }
    if (st.type === 'work') (st.ex.cues || []).forEach(([f, txt], k) => {
      if (!W.cues.has(k) && el >= f * st.dur) { W.cues.add(k); say(txt); $('#pSub').textContent = txt; }
    });
    if (rem <= 0) { if (st.type === 'work') beep(880, .35); next(); if (!W) return; }
  }
  const cur = W.steps[W.i], r = Math.max(0, cur.dur - elapsed());
  $('#pSec').textContent = Math.ceil(r);
  $('#pRing').style.strokeDashoffset = (326.7 * (1 - r / cur.dur)).toFixed(1);
  const done = W.steps.slice(0, W.i).reduce((s, x) => s + x.dur, 0) + (cur.dur - r);
  $('#pBar').style.width = `${(100 * done / totalSec(W.steps)).toFixed(1)}%`;
  $('#pFig').innerHTML = frameOf(cur.ex, poseAt(cur.ex, now / 1000));
}

function finish(completed) {
  const w = W; W = null;
  keepAwake(false); window.speechSynthesis?.cancel();
  $('#player').classList.add('hidden'); document.body.style.overflow = '';
  if (!completed) return renderAll();
  const secs = Math.round((Date.now() - w.began) / 1000);
  S.history.push({ date: todayKey(), kind: w.kind, session: w.kind === 'mobility' ? null : w.sIdx, phase: w.phase, secs, at: new Date().toISOString() });
  if (w.kind !== 'mobility') { S.next = (w.sIdx + 1) % SESSIONS.length; selected = S.next; }
  save(); renderAll();
  if (completed === true) { say('Workout complete. Well done!'); beep(784, .15); setTimeout(() => beep(1047, .3), 160); }
  modal(`<div style="font-size:44px">🎉</div><h3>Workout complete</h3>
    <p>${w.kind === 'mobility' ? 'Mobility routine' : w.kind === 'strength' ? `Session ${w.sIdx + 1}` : `Mobility + Session ${w.sIdx + 1}`} · ${Math.round(secs / 60)} min<br>
    This week: ${weekCount(weekStart())} training day${weekCount(weekStart()) === 1 ? '' : 's'}</p>
    <button class="btn primary" data-close>Done</button>`);
}

function askEnd() {
  if (!W) return;
  if (!W.pausedAt) togglePause();
  modal(`<h3>End workout?</h3><p>You can save it as done if you finished most of it.</p>
    <button class="btn primary" id="mResume">Continue workout</button>
    <button class="btn ghost" id="mSave">Save as done</button>
    <button class="btn danger" id="mDiscard">Discard</button>`);
  $('#mResume').onclick = () => { closeModal(); togglePause(); };
  $('#mSave').onclick = () => { closeModal(); finish('saved'); };
  $('#mDiscard').onclick = () => { closeModal(); finish(false); };
}

$('#pPlay').onclick = togglePause;
$('#pSkip').onclick = () => W && next();
$('#pBack').onclick = () => W && back();
$('#pClose').onclick = askEnd;
$('#pInfo').onclick = () => W && openExercise(W.steps[W.i].ex);
document.addEventListener('visibilitychange', () => {
  if (!W) return;
  if (document.visibilityState === 'hidden' && !W.pausedAt) togglePause(); // never lose time in the background
  if (document.visibilityState === 'visible') keepAwake(true);
});

// ---------- Animation loop (player + any live figures on screen) ----------
const live = new Map(); // element -> exercise
let lastFrame = 0;
setInterval(() => { if (W && performance.now() - lastFrame > 400) tickPlayer(performance.now()); }, 250); // timer keeps running if frames are throttled
(function loop(now) {
  lastFrame = now;
  if (W) tickPlayer(now);
  for (const [el, ex] of live) { if (!el.isConnected) live.delete(el); else el.innerHTML = frameOf(ex, poseAt(ex, now / 1000)); }
  requestAnimationFrame(loop);
})(performance.now());

// ---------- Sheets & modals ----------
function sheet(html) { $('#sheet').innerHTML = `<div class="grab"></div>${html}`; $('#sheetWrap').classList.remove('hidden'); }
function closeSheet() { $('#sheetWrap').classList.add('hidden'); $('#sheet').innerHTML = ''; }
$('#sheetWrap').onclick = e => { if (e.target.id === 'sheetWrap' || e.target.closest('[data-close]')) closeSheet(); };
function modal(html) { $('#modal').innerHTML = html; $('#modalWrap').classList.remove('hidden'); }
function closeModal() { $('#modalWrap').classList.add('hidden'); }
$('#modalWrap').onclick = e => { if (e.target.closest('[data-close]')) closeModal(); };

function openExercise(ex) {
  sheet(`<div class="sheet-h"><h3>${ex.name}</h3><button class="icon" data-close>✕</button></div><article class="ex-card">${cardHtml(ex, '')}</article>`);
  live.set($('#sheet .anim'), ex);
}

// ---------- Today ----------
let selected = S.next;
function renderToday() {
  const now = new Date(), pr = program(), [work, rest] = TIMING[pr.phase];
  const h = now.getHours();
  $('#hello').textContent = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  $('#todayDate').textContent = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  $('#program').innerHTML = S.start
    ? `<span class="pill accent">Phase ${pr.phase} · ${work} s work / ${rest} s rest</span><span class="pill">Week ${pr.cw} of 8${pr.cycle > 1 ? ` · Cycle ${pr.cycle}` : ''}</span>${S.settings.phase !== 'auto' ? '<span class="pill">Phase set manually</span>' : ''}`
    : `<span class="pill accent">Phase 1 · ${TIMING[1][0]} s work / ${TIMING[1][1]} s rest</span><span class="pill">Your 8-week plan starts with your first workout</span>`;
  const ws = weekStart();
  $('#weekStrip').innerHTML = [...Array(7)].map((_, i) => {
    const d = new Date(ws); d.setDate(d.getDate() + i); const k = dayKey(d);
    return `<div class="day${k === todayKey() ? ' today' : ''}${doneOn(k).length ? ' done' : ''}">${d.toLocaleDateString('en-GB', { weekday: 'short' })}<b>${doneOn(k).length ? '✓' : d.getDate()}</b></div>`;
  }).join('');
  $('#checkBanner').innerHTML = S.start && checkDue() ? `<div class="banner">📏 <div><b>Mobility check due</b><br><span class="small">2 minutes, every 4 weeks</span></div><button id="doCheck">Start</button></div>` : '';
  $('#doCheck')?.addEventListener('click', openCheck);

  const full = buildWorkout('full', selected, pr.phase), mob = buildWorkout('mobility', 0, pr.phase), str = buildWorkout('strength', selected, pr.phase);
  const doneToday = doneOn(todayKey()).length > 0;
  const sess = SESSIONS[selected];
  $('#workoutCard').innerHTML = `
    ${doneToday ? '<span class="done-badge">✓ Done today — nice!</span>' : ''}
    <div class="muted small">Today’s workout</div>
    <div class="title">Mobility + ${sess.name}</div>
    <div class="meta">≈ ${mins(totalSec(full))} · mat only · silent</div>
    <div class="sessions">${SESSIONS.map((s, i) => `<button data-s="${i}" class="${i === selected ? 'on' : ''}${i === S.next ? ' next' : ''}">${i + 1}</button>`).join('')}</div>
    <div class="blocks">
      <div class="block"><div class="bh">1 · Morning mobility <span>${mins(totalSec(mob.filter(x => x.block === 'Mobility')))} · same every day</span></div>
        <div class="thumbrow">${MOBILITY.map(ex => `<button class="mini" data-ex="${ex.id}"><div class="fig">${thumb(ex)}</div>${ex.name}</button>`).join('')}</div></div>
      <div class="block"><div class="bh">2 · Session ${selected + 1}: ${sess.name} <span>2 rounds</span></div>
        <div class="thumbrow">${sess.ex.map(id => `<button class="mini" data-ex="${id}"><div class="fig">${thumb(STRENGTH[id])}</div>${STRENGTH[id].name}</button>`).join('')}</div></div>
      <div class="block"><div class="bh">3 · Cool-down <span>1 min</span></div>
        <div class="thumbrow"><button class="mini" data-ex="breathing"><div class="fig">${thumb(COOLDOWN)}</div>${COOLDOWN.name}</button></div></div>
    </div>
    <button class="btn primary" id="startFull">▶ Start workout</button>
    <div class="row2"><button class="btn ghost" id="startMob">Mobility only · ${mins(totalSec(mob))}</button><button class="btn ghost" id="startStr">Strength only · ${mins(totalSec(str))}</button></div>`;
  $$('#workoutCard [data-s]').forEach(b => b.onclick = () => { selected = +b.dataset.s; renderToday(); });
  $$('#workoutCard [data-ex]').forEach(b => b.onclick = () => openExercise(BY_ID[b.dataset.ex]));
  $('#startFull').onclick = () => startWorkout('full', selected);
  $('#startMob').onclick = () => startWorkout('mobility', selected);
  $('#startStr').onclick = () => startWorkout('strength', selected);
}

// ---------- Library ----------
function renderLibrary() {
  const item = ex => `<button class="lib-item" data-ex="${ex.id}"><div class="fig">${thumb(ex)}</div><div><b>${ex.name}</b><span>${ex.focus}</span></div></button>`;
  $('#libList').innerHTML = `<div class="lib-h">Morning mobility · every day</div>${MOBILITY.map(item).join('')}`
    + SESSIONS.map((s, i) => `<div class="lib-h">Session ${i + 1} · ${s.name}</div>${s.ex.map(id => item(STRENGTH[id])).join('')}`).join('')
    + `<div class="lib-h">Cool-down</div>${item(COOLDOWN)}`;
  $$('#libList [data-ex]').forEach(b => b.onclick = () => openExercise(BY_ID[b.dataset.ex]));
}

// ---------- Progress ----------
let calMonth = new Date(); calMonth.setDate(1);
const CHECKS = [
  { id: 'overhead', name: 'Overhead reach', sides: true, how: 'Back, head and bottom against a wall. Raise one straight arm overhead and try to touch the wall with your thumb — without arching your back.', opts: ['Touches wall', 'Almost (< 5 cm)', 'Far (> 5 cm)'] },
  { id: 'behind', name: 'Behind-back reach', sides: true, how: 'Reach one hand over the shoulder down your back and the other hand up from below. Side = the arm on top.', opts: ['Fingers overlap', 'Touch', 'Gap < 5 cm', 'Gap > 5 cm'] },
  { id: 'toes', name: 'Toe touch', sides: false, how: 'Stand with straight knees and slowly reach down.', opts: ['Palms on floor', 'Fingertips on floor', 'Toes', 'Shins'] },
];
function renderProgress() {
  const total = S.history.length, wk = weekCount(weekStart());
  $('#stats').innerHTML = `<div class="stat"><b>${wk}</b><span>days this week</span></div><div class="stat"><b>${weekStreak()}</b><span>week streak (4+ days)</span></div><div class="stat"><b>${total}</b><span>workouts</span></div>`;

  const m = calMonth, first = (m.getDay() + 6) % 7, dim = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  let cells = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => `<div class="wd">${d}</div>`).join('') + '<div></div>'.repeat(first);
  for (let d = 1; d <= dim; d++) {
    const k = dayKey(new Date(m.getFullYear(), m.getMonth(), d)), h = doneOn(k);
    const cls = h.some(x => x.kind !== 'mobility') ? 'done' : h.length ? 'mob' : '';
    cells += `<div class="d ${cls}${k === todayKey() ? ' today' : ''}">${d}</div>`;
  }
  $('#calendar').innerHTML = `<div class="cal-h"><button id="calPrev">‹</button><b>${m.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</b><button id="calNext">›</button></div>
    <div class="cal">${cells}</div><div class="legend-row"><span><i style="background:var(--done)"></i>Full / strength</span><span><i style="background:#bbf7d0"></i>Mobility only</span></div>`;
  $('#calPrev').onclick = () => { calMonth.setMonth(calMonth.getMonth() - 1); renderProgress(); };
  $('#calNext').onclick = () => { calMonth.setMonth(calMonth.getMonth() + 1); renderProgress(); };

  const fmt = c => CHECKS.map(t => t.sides ? `${t.name}: L ${t.opts[c[t.id].L]}, R ${t.opts[c[t.id].R]}` : `${t.name}: ${t.opts[c[t.id]]}`).join('<br>');
  $('#checks').innerHTML = `<h3>Mobility checks</h3>${S.checks.length ? S.checks.slice().reverse().map(c => `<div class="list-row"><b>${parseDay(c.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</b><span class="small muted" style="text-align:right">${fmt(c)}</span></div>`).join('') : '<p class="muted small">No checks yet. Do one now to set your starting point — then every 4 weeks.</p>'}
    <button class="btn ghost" id="checkNow" style="margin-top:10px">📏 Do a mobility check</button>`;
  $('#checkNow').onclick = openCheck;

  const label = h => h.kind === 'mobility' ? 'Mobility' : `${h.kind === 'full' ? 'Mobility + ' : ''}Session ${h.session + 1}`;
  $('#recent').innerHTML = `<h3>Recent workouts</h3>${S.history.length ? S.history.slice(-12).reverse().map(h => `<div class="list-row"><span>${parseDay(h.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span><span class="muted">${label(h)} · ${Math.round(h.secs / 60)} min · P${h.phase}</span></div>`).join('') : '<p class="muted small">Your workouts will show up here.</p>'}`;
}

function openCheck() {
  const r = {};
  const seg = (key, opts) => `<div class="seg" data-k="${key}">${opts.map((o, i) => `<button data-i="${i}">${o}</button>`).join('')}</div>`;
  sheet(`<div class="sheet-h"><h3>Mobility check</h3><button class="icon" data-close>✕</button></div>
    <div class="card">${CHECKS.map(t => `<div class="test"><b>${t.name}</b><p>${t.how}</p>${t.sides ? `<div class="side">Left</div>${seg(t.id + '.L', t.opts)}<div class="side">Right</div>${seg(t.id + '.R', t.opts)}` : seg(t.id, t.opts)}</div>`).join('')}</div>
    <button class="btn primary" id="saveCheck">Save results</button>`);
  $$('#sheet .seg').forEach(g => g.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', g).forEach(x => x.classList.toggle('on', x === b)); r[g.dataset.k] = +b.dataset.i;
  });
  $('#saveCheck').onclick = () => {
    const keys = CHECKS.flatMap(t => t.sides ? [t.id + '.L', t.id + '.R'] : [t.id]);
    if (keys.some(k => r[k] == null)) { $('#saveCheck').textContent = 'Please answer every test'; return; }
    S.checks.push({ date: todayKey(), overhead: { L: r['overhead.L'], R: r['overhead.R'] }, behind: { L: r['behind.L'], R: r['behind.R'] }, toes: r.toes });
    if (!S.start) S.start = todayKey();
    save(); closeSheet(); renderAll();
  };
}

// ---------- Settings ----------
function openSettings() {
  const tog = (k, label, sub) => `<label class="set-row"><div>${label}${sub ? `<small>${sub}</small>` : ''}</div><span class="switch-t"><input type="checkbox" data-set="${k}" ${S.settings[k] ? 'checked' : ''}><i></i></span></label>`;
  sheet(`<div class="sheet-h"><h3>Settings</h3><button class="icon" data-close>✕</button></div>
    <div class="card">
      ${tog('voice', 'Voice coach', 'Announces exercises, sides and rests')}
      ${tog('beeps', 'Countdown beeps', 'Last 3 seconds of every interval')}
      ${tog('overrideSilent', 'Sound in silent mode', 'Plays even with the silent switch on (may pause your music)')}
      <div class="set-row"><div>Test sound</div><button class="btn ghost" style="width:auto;padding:8px 14px;font-size:14px" id="testSound">▶ Test</button></div>
    </div>
    <div class="card">
      <div class="set-row"><div>Phase<small>Auto follows the 8-week plan</small></div>
        <select id="phaseSel"><option value="auto">Auto (Phase ${program().auto})</option><option value="1">Phase 1 · 30/15</option><option value="2">Phase 2 · 40/15</option><option value="3">Phase 3 · 45/15</option></select></div>
      <div class="set-row"><div>Plan start date<small>Week ${program().week} today</small></div><input type="date" id="startDate" value="${S.start || ''}"></div>
      <div class="set-row"><div>Next strength session</div><select id="nextSel">${SESSIONS.map((s, i) => `<option value="${i}" ${i === S.next ? 'selected' : ''}>${i + 1} · ${s.name}</option>`).join('')}</select></div>
    </div>
    <div class="card">
      <div class="set-row"><div>Back up data<small>Download your history as a file</small></div><button class="btn ghost" style="width:auto;padding:8px 14px;font-size:14px" id="exportBtn">Export</button></div>
      <div class="set-row"><div>Restore data</div><label class="btn ghost" style="width:auto;padding:8px 14px;font-size:14px">Import<input type="file" accept="application/json" id="importFile" hidden></label></div>
      <div class="set-row"><div>Reset everything</div><button class="btn danger" style="width:auto;padding:8px 14px;font-size:14px" id="resetBtn">Reset</button></div>
    </div>
    <p class="muted small" style="text-align:center">Morning Moves · data is stored only on this device</p>`);
  $('#phaseSel').value = S.settings.phase;
  $$('#sheet [data-set]').forEach(i => i.onchange = () => { S.settings[i.dataset.set] = i.checked; save(); });
  $('#phaseSel').onchange = e => { S.settings.phase = e.target.value; save(); renderAll(); };
  $('#startDate').onchange = e => { S.start = e.target.value || null; save(); renderAll(); };
  $('#nextSel').onchange = e => { S.next = selected = +e.target.value; save(); renderAll(); };
  $('#testSound').onclick = () => { unlockAudio(); beep(660); setTimeout(() => beep(660), 350); setTimeout(() => beep(880, .35), 700); setTimeout(() => say('Voice coach is on. Next: cat-cow.'), 1200); };
  $('#exportBtn').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }));
    a.download = `morning-moves-${todayKey()}.json`; a.click();
  };
  $('#importFile').onchange = async e => {
    try { const d = JSON.parse(await e.target.files[0].text()); if (!Array.isArray(d.history)) throw 0; localStorage.setItem(KEY, JSON.stringify(d)); S = load(); selected = S.next; closeSheet(); renderAll(); }
    catch { alert('That file could not be read.'); }
  };
  $('#resetBtn').onclick = () => { if (confirm('Delete all history and settings?')) { localStorage.removeItem(KEY); S = load(); selected = 0; closeSheet(); renderAll(); } };
}
$('#openSettings').onclick = openSettings;

// ---------- Tabs ----------
$$('.tabs button').forEach(b => b.onclick = () => {
  $$('.tabs button').forEach(x => x.classList.toggle('on', x === b));
  $$('.screen').forEach(s => s.classList.toggle('hidden', s.id !== b.dataset.tab));
  window.scrollTo(0, 0);
});

function renderAll() { renderToday(); renderLibrary(); renderProgress(); }
renderAll();
// Refresh "today" when the app is reopened on a new day
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !W) renderAll(); });

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');
