// Illustrated exercise figure: renderer, animation and card builder.
// Shared by the guide pages (and later the app).

const LEN = { torso:40, neck:12, up:22, fore:20, thigh:30, shin:30 };
const C = { skin:'#f1c3a0', skinFar:'#d29b76', ear:'#e2ab86', top:'#13a39a', leg:'#36435c', legFar:'#232c3f',
            shoe:'#f8fafc', shoeFar:'#cbd5e1', hair:'#5b3a29', eye:'#2b1d14', glow:'#f97316' };
const OUT = 2.2; // focus outline thickness

const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
const seg = (p, a, l) => [p[0] + l * Math.cos(rad(a)), p[1] + l * Math.sin(rad(a))];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k], unit = a => mul(a, 1 / (Math.hypot(a[0], a[1]) || 1));
const f1 = n => n.toFixed(1);
const P = p => f1(p[0]) + ',' + f1(p[1]);
const circle = (c, r, fill, extra = '') => `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${r}" fill="${fill}"${extra}/>`;

// Limb angles: either [upper, lower] in degrees (0 = right, 90 = down) or an IK target
// {t:[x,y], s:±1}. For legs s = 1 puts the knee forward/up; for arms s = -1 puts the elbow back.
function ik(o, v, l1, l2) {
  if (Array.isArray(v)) return v;
  const d = sub(v.t, o), dist = Math.min(Math.max(Math.hypot(d[0], d[1]), Math.abs(l1 - l2) + .01), l1 + l2 - .01);
  const a = Math.acos((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist));
  const up = Math.atan2(d[1], d[0]) - (v.s ?? 1) * a, el = [o[0] + l1 * Math.cos(up), o[1] + l1 * Math.sin(up)];
  return [deg(up), deg(Math.atan2(v.t[1] - el[1], v.t[0] - el[0]))];
}
const joints = (o, v, l1, l2) => { const [a, b] = ik(o, v, l1, l2), m = seg(o, a, l1); return [o, m, seg(m, b, l2)]; };

// Tapered capsule between two points (limb segment)
function cap(a, b, r1, r2, fill) {
  const u = unit(sub(b, a)), n = [-u[1], u[0]];
  const pts = [add(a, mul(n, r1)), add(b, mul(n, r2)), add(b, mul(n, -r2)), add(a, mul(n, -r1))];
  return `<g fill="${fill}"><polygon points="${pts.map(P).join(' ')}"/>${circle(a, r1, fill)}${circle(b, r2, fill)}</g>`;
}

// Closed smooth path through points (Catmull-Rom)
function smooth(pts) {
  const n = pts.length; let d = `M${P(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += ` C${P(add(p1, mul(sub(p2, p0), 1 / 6)))} ${P(sub(p2, mul(sub(p3, p1), 1 / 6)))} ${P(p2)}`;
  }
  return d + 'Z';
}
const outlinePath = d => `<path d="${d}" fill="none" stroke="${C.glow}" stroke-width="${OUT * 2}" stroke-linejoin="round"/>`;

function armSvg(sh, el, wr, skin, g = 0) {
  const hand = add(wr, mul(unit(sub(wr, el)), 4.5));
  return cap(sh, el, 3.9 + g, 3.1 + g, skin) + cap(el, wr, 3.1 + g, 2.3 + g, skin) + cap(wr, hand, 2.5 + g, 2.2 + g, skin);
}
function legSvg(hip, kn, an, footA, legC, shoeC, g = 0) {
  let s = cap(hip, kn, 6.8 + g, 4.5 + g, legC) + cap(kn, an, 4.5 + g, 2.7 + g, legC);
  if (footA != null) s += cap(seg(an, footA + 180, 2), seg(an, footA, 9), 3.1 + g, 2.4 + g, shoeC);
  else s += circle(an, 3.4 + g, shoeC);
  return s;
}
// Limb drawn with an orange outline when it is the focus
const arm = (pts, skin, on) => (on ? armSvg(...pts, C.glow, OUT) : '') + armSvg(...pts, skin);
const leg = (pts, footA, legC, shoeC, on) => (on ? legSvg(...pts, footA, C.glow, C.glow, OUT) : '') + legSvg(...pts, footA, legC, shoeC);

// Head in profile; f = facing angle, ff = 0..1 turn toward the viewer
function headSvg(c, f, ff = 0) {
  const u = [Math.cos(rad(f)), Math.sin(rad(f))], v = [Math.sin(rad(f)), -Math.cos(rad(f))];
  const L = (x, y) => add(c, add(mul(u, x), mul(v, y)));
  const anc = L(-6.5, 4.5);
  let td = unit(add([0, 1], mul(u, -0.9)));
  if (add(anc, mul(td, 15))[1] > 159) td = unit(add(v, [0, .25])); // lying down: ponytail rests on the floor
  const mid = add(anc, mul(td, 7));
  const prof = cap(anc, mid, 3.4, 3, C.hair) + cap(mid, add(anc, mul(td, 15)), 3, 1.2, C.hair)
    + circle(c, 8.5, C.skin) + circle(L(8, -0.5), 1.7, C.skin)
    + `<path d="${smooth([L(5.5, 6), L(1, 9.6), L(-5, 8.4), L(-9.2, 2.5), L(-8.2, -3.5), L(-5, -4.5), L(-3, 0), L(1, 4.2)])}" fill="${C.hair}"/>`
    + circle(L(-1.5, -0.5), 1.9, C.ear) + circle(L(4.6, 1.6), 1.05, C.eye);
  if (!ff) return prof;
  const F = (x, y) => [c[0] + x, c[1] - y];
  const frontHead = circle(c, 8.5, C.skin)
    + `<path d="${smooth([F(-9, 1), F(-8.5, 5.5), F(-4, 9.3), F(0, 9.8), F(4, 9.3), F(8.5, 5.5), F(9, 1), F(8.6, -4), F(7, -1.5), F(5.5, 4.5), F(0, 5.5), F(-5.5, 4.5), F(-7, -1.5), F(-8.6, -4)])}" fill="${C.hair}"/>`
    + circle(F(-3.2, 0.5), 1.05, C.eye) + circle(F(3.2, 0.5), 1.05, C.eye);
  return ff >= 1 ? frontHead : `<g opacity="${f1(1 - ff)}">${prof}</g><g opacity="${f1(ff)}">${frontHead}</g>`;
}

// Torso thickness profile along the spine: [t (0 = hip joint, 1 = shoulder), front, back]
const PROFILE = [[-0.14,3,5],[-0.05,7,10],[0.05,8.2,11],[0.18,7.6,9],[0.36,6.4,6.6],[0.55,7.2,7.6],[0.7,10.2,8.6],[0.82,9.2,8.8],[0.95,6.2,7.4],[1.05,3.5,4.5]];

// Side view. Figure faces right; "N" = near side, "F" = far side.
// hl (focus): aN aF lN lF spine hips head
function side(s) {
  const hl = s.hl || [], on = k => hl.includes(k);
  const neck = seg(s.hip, s.torso, LEN.torso), head = seg(neck, s.neckA, LEN.neck);
  const ta = rad(s.torso), midp = mul(add(s.hip, neck), .5);
  const ctrl = [midp[0] + s.bend * Math.sin(ta), midp[1] - s.bend * Math.cos(ta)];
  const spine = t => {
    const k = Math.min(1, Math.max(0, t)), h = s.hip;
    const p = [0, 1].map(i => (1 - k) ** 2 * h[i] + 2 * (1 - k) * k * ctrl[i] + k * k * neck[i]);
    const u = unit([0, 1].map(i => 2 * (1 - k) * (ctrl[i] - h[i]) + 2 * k * (neck[i] - ctrl[i])));
    return [add(p, mul(u, (t - k) * LEN.torso)), u];
  };
  const outline = rows => {
    const fr = [], bk = [];
    for (const [t, a, b] of rows) { const [p, u] = spine(t), n = [-u[1], u[0]]; fr.push(add(p, mul(n, a))); bk.push(add(p, mul(n, -b))); }
    return smooth([...fr, ...bk.reverse()]);
  };
  const aF = joints(neck, s.aF, LEN.up, LEN.fore), aN = joints(neck, s.aN, LEN.up, LEN.fore);
  const lF = joints(s.hip, s.lF, LEN.thigh, LEN.shin), lN = joints(s.hip, s.lN, LEN.thigh, LEN.shin);
  const footA = (pts, ft) => { if (ft != null) return ft; const a = deg(Math.atan2(pts[2][1] - pts[1][1], pts[2][0] - pts[1][0])); return Math.abs(Math.sin(rad(a))) < 0.5 ? a : 0; };
  const torso = outline(PROFILE);

  return arm(aF, C.skinFar, on('aF'))
    + leg(lF, footA(lF, s.ftF), C.legFar, C.shoeFar, on('lF'))
    + cap(neck, head, 3.4, 3, C.skin)
    + (on('spine') ? outlinePath(torso) : '') + (on('hips') ? outlinePath(outline(PROFILE.filter(r => r[0] <= 0.36))) : '')
    + `<path d="${torso}" fill="${C.leg}"/>`
    + `<path d="${outline(PROFILE.filter(r => r[0] >= 0.36))}" fill="${C.top}"/>`
    + leg(lN, footA(lN, s.ftN), C.leg, C.shoe, on('lN'))
    + arm(aN, C.skin, on('aN'))
    + (on('head') ? circle(head, 8.5 + OUT + 1.3, C.glow) : '')
    + headSvg(head, s.face, s.ff);
}

// Front view (joint coordinates, upright frame). Optional rot/pivot/tx/ty to lay the figure down.
// hl: legL legR armL armR torso
function front(s) {
  const hl = s.hl || ['legL', 'legR'], on = k => hl.includes(k);
  const [nx, ny] = s.neck, [hx, hy] = s.hip, Q = (x, y) => [x, y];
  const shL = [nx - 11, ny + 1], shR = [nx + 11, ny + 1], hipL = [hx - 7, hy], hipR = [hx + 7, hy];
  const body = smooth([Q(nx-4,ny-3),Q(nx-11,ny),Q(nx-12.5,ny+4),Q(nx-10,ny+11),Q(nx-8,ny+22),Q(nx-10.5,ny+32),Q(hx-11,hy-2),Q(hx-6,hy+3),Q(hx,hy+2),
                       Q(hx+6,hy+3),Q(hx+11,hy-2),Q(nx+10.5,ny+32),Q(nx+8,ny+22),Q(nx+10,ny+11),Q(nx+12.5,ny+4),Q(nx+11,ny),Q(nx+4,ny-3)]);
  const shirt = smooth([Q(nx-4,ny-3),Q(nx-11,ny),Q(nx-12.5,ny+4),Q(nx-10,ny+11),Q(nx-8,ny+22),Q(nx-8.3,ny+25),Q(nx,ny+26),
                        Q(nx+8.3,ny+25),Q(nx+8,ny+22),Q(nx+10,ny+11),Q(nx+12.5,ny+4),Q(nx+11,ny),Q(nx+4,ny-3)]);
  const head = [nx, ny - 13], skinA = s.armsFront ? C.skin : C.skinFar;
  const legs = [['legL', [hipL, s.kL, s.fL]], ['legR', [hipR, s.kR, s.fR]]].sort((a, b) => a[1][1][1] - b[1][1][1]);
  let g = arm([shL, s.eL, s.hL], skinA, on('armL')) + arm([shR, s.eR, s.hR], skinA, on('armR'))
    + cap([nx, ny], head, 3.4, 3, C.skin)
    + (on('torso') ? outlinePath(body) : '')
    + `<path d="${body}" fill="${C.leg}"/><path d="${shirt}" fill="${C.top}"/>`
    + legs.map(([k, pts]) => leg(pts, null, C.leg, C.shoe, on(k))).join('')
    + headSvg(head, 0, 1);
  if (s.rot) g = `<g transform="translate(${f1(s.tx || 0)} ${f1(s.ty || 0)}) rotate(${f1(s.rot)} ${P(s.pivot)})">${g}</g>`;
  return g;
}

// End view (seen from above the head), side-lying
function endv(s) {
  const top = seg(s.bot, s.shA, 24), m = mul(add(s.bot, top), .5);
  const jA = (o, [a, b]) => { const e = seg(o, a, LEN.up); return [o, e, seg(e, b, LEN.fore)]; };
  return armSvg(...jA(s.bot, s.botArm), C.skinFar)
    + `<ellipse cx="${f1(m[0])}" cy="${f1(m[1])}" rx="15" ry="8.5" transform="rotate(${f1(s.shA)} ${P(m)})" fill="${C.top}"/>`
    + headSvg(s.head, s.face)
    + arm(jA(top, s.topArm), C.skin, true);
}

// Top view: lying face down, seen from above, head to the right. armL = upper arm on screen.
function topv(s) {
  const shL = [120, 99], shR = [120, 121], on = (s.hl || []).includes('arms');
  const legT = y => cap([80, y], [50, y], 6.8, 4.5, C.leg) + cap([50, y], [22, y], 4.5, 2.7, C.leg) + `<ellipse cx="18.5" cy="${y}" rx="3.6" ry="3" fill="${C.shoe}"/>`;
  const body = [[124,104],[121,97],[116,96],[109,99],[98,101.5],[88,99.5],[80,98],[75,101],[74,110],[75,119],[80,122],[88,120.5],[98,118.5],[109,121],[116,124],[121,123],[124,116]];
  const shirt = [[124,104],[121,97],[116,96],[109,99],[98,101.5],[95,102],[94,110],[95,118],[98,118.5],[109,121],[116,124],[121,123],[124,116]];
  return legT(104) + legT(116)
    + `<path d="${smooth(body)}" fill="${C.leg}"/><path d="${smooth(shirt)}" fill="${C.top}"/>`
    + cap([117, 110], [129, 110], 3.6, 3.2, C.skin)
    + arm(joints(shL, s.armL, LEN.up, LEN.fore), C.skin, on) + arm(joints(shR, s.armR, LEN.up, LEN.fore), C.skin, on)
    + circle([134, 110], 8.7, C.hair) + circle([134.5, 101.2], 2, C.ear) + circle([134.5, 118.8], 2, C.ear)
    + cap([128, 111], [121, 112.5], 3.3, 2.8, C.hair) + cap([121, 112.5], [112, 111], 2.8, 1.2, C.hair);
}

const BUILD = { side, front, end: endv, top: topv };
const build = p => BUILD[p.view || 'side'](p);

function svgOf(inner, vb = '0 0 200 170', mat = 'floor') {
  const m = mat === 'top' ? '<rect x="8" y="62" width="184" height="96" rx="6" class="mat" opacity=".5"/>'
                          : '<rect x="0" y="161" width="200" height="5" rx="2.5" class="mat"/>';
  return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${m}${inner}</svg>`;
}

// ---- Animation ----
const norm = p => ({ bend:0, ff:0, face:0, ...p });
function lerp(a, b, t) {
  if (typeof a === 'number') return a + ((b ?? a) - a) * t;
  if (Array.isArray(a)) return typeof a[0] === 'string' || !Array.isArray(b) ? a : a.map((v, i) => lerp(v, b[i], t));
  if (a && typeof a === 'object' && b && typeof b === 'object') return Object.fromEntries(Object.keys(a).map(k => [k, lerp(a[k], b[k], t)]));
  return a;
}
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

function poseAt(ex, time) {
  const k = ex.keys, total = k.reduce((s, x) => s + (x.hold ?? .4) + (x.move ?? 1.1), 0);
  let t = time % total;
  for (let i = 0; i < k.length; i++) {
    const h = k[i].hold ?? .4, m = k[i].move ?? 1.1;
    if (t < h) return k[i].p;
    t -= h;
    if (t < m) return lerp(k[i].p, k[(i + 1) % k.length].p, k[i].lin ? t / m : ease(t / m));
    t -= m;
  }
  return k[0].p;
}
const frameOf = (ex, p) => svgOf(build(p), ex.vb, ex.mat);

// ---- Guide cards ----
function cardHtml(ex, num) {
  const chips = [ex.time && `<span class="chip">⏱ ${ex.time}</span>`, ex.left && '<span class="chip l">Left side +50%</span>',
                 ex.uni && '<span class="chip u">↔ Round 1 left · Round 2 right</span>'].filter(Boolean).join('');
  const demo = ex.video ? `<a class="demo" href="${ex.video}" target="_blank" rel="noopener">▶ Watch demo</a>`
             : ex.search ? `<a class="demo" href="https://www.youtube.com/results?search_query=${encodeURIComponent(ex.search)}" target="_blank" rel="noopener">▶ Find a demo</a>` : '';
  const prog = ex.prog ? `<div class="prog">${ex.prog.map((p, i) => `<div><b>Phase ${i + 1}</b>${p}</div>`).join('')}</div>` : '';
  return `
    <div class="stage"><div class="num">${num}</div>${ex.viewLabel ? `<div class="view">${ex.viewLabel}</div>` : ''}<div class="anim"></div></div>
    <div class="body">
      <h2>${ex.name}</h2>
      <div class="chips">${chips}</div>
      <div class="thumbs">${ex.snaps.map(([k, l]) => `<div class="thumb">${frameOf(ex, ex.keys[k].p)}${l}</div>`).join('')}</div>
      <ol>${ex.steps.map(s => `<li>${s}</li>`).join('')}</ol>
      ${prog}
      <div class="foot"><div class="focus"><b>Targets:</b> ${ex.focus}</div>${demo}</div>
    </div>`;
}

const stages = [];
function addCards(container, list, numFn = i => i + 1) {
  list.forEach((ex, i) => {
    ex.keys = ex.keys.map(k => ({ ...k, p: norm(k.p) }));
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = cardHtml(ex, numFn(i));
    container.appendChild(card);
    stages.push([ex, card.querySelector('.anim')]);
  });
}
function startAnimation() {
  const t0 = performance.now();
  (function frame(now) {
    const t = (now - t0) / 1000;
    for (const [ex, el] of stages) el.innerHTML = frameOf(ex, poseAt(ex, t));
    requestAnimationFrame(frame);
  })(t0);
}
