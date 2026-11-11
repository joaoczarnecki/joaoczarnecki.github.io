/* Personal site behaviour: language, theme, counters, lightbox, CSI demo and the lidar-scan hero.
   Author: João Paulo Czarnecki de Liz · with Claude (Anthropic) as coding assistant · MIT */

/* ---- edit your links here; leave a value empty ("") to hide that button ---- */
const LINKS = {
  email:        "jpczd@ulaval.ca",
  orcid:        "https://orcid.org/0000-0003-1860-346X",
  github:       "https://github.com/joaoczarnecki",
  scholar:      "",   // e.g. https://scholar.google.com/citations?user=XXXX
  researchgate: "",   // e.g. https://www.researchgate.net/profile/XXXX
  linkedin:     ""    // e.g. https://www.linkedin.com/in/XXXX
};

const store = {
  get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
  set(k,v){ try { localStorage.setItem(k,v); } catch(e){} }
};
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- language ---------- */
const EN = {};
document.querySelectorAll("[data-i18n]").forEach(el => { EN[el.dataset.i18n] = el.innerHTML; });
let LANG = "en";
function t(key){ return (I18N[LANG] && I18N[LANG][key] !== undefined) ? I18N[LANG][key] : (EN[key] ?? I18N.en[key]); }
function setLang(l){
  LANG = I18N[l] ? l : "en";
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-i18n]").forEach(el => { const v = t(el.dataset.i18n); if (v !== undefined) el.innerHTML = v; });
  document.querySelectorAll(".lang button").forEach(b => b.classList.toggle("on", b.dataset.lang === LANG));
  store.set("lang", LANG);
  buildSliders(); buildSocial();
}
document.querySelectorAll(".lang button").forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang)));

/* ---------- theme ---------- */
const themeBtn = document.getElementById("themeBtn");
const savedTheme = store.get("theme");
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
themeBtn.addEventListener("click", () => {
  const cur = document.documentElement.dataset.theme ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next; store.set("theme", next);
});

/* ---------- counters and reveal ---------- */
const fmt = n => n.toLocaleString(LANG === "en" ? "en-CA" : LANG === "pt" ? "pt-BR" : "fr-CA");
function runCounter(el){
  const end = +el.dataset.count, plus = el.dataset.plus ? "+" : "";
  if (reduceMotion) { el.textContent = (plus ? "~" : "") + fmt(end); return; }
  const t0 = performance.now(), dur = 1400;
  (function step(now){
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = (plus ? "~" : "") + fmt(Math.round(end * e));
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  if (e.target.dataset.count) runCounter(e.target); else e.target.classList.add("in");
  io.unobserve(e.target);
}), { threshold: .2 });
document.querySelectorAll("[data-count]").forEach(el => io.observe(el));
document.querySelectorAll(".project, .csi, .card, .tcams-grid").forEach(el => { el.classList.add("reveal"); io.observe(el); });

/* ---------- lightbox ---------- */
const lb = document.getElementById("lightbox"), lbImg = lb.querySelector("img");
function openLB(src, alt){ lbImg.src = src; lbImg.alt = alt || ""; lb.showModal(); }
document.querySelectorAll("img[data-zoom]").forEach(im => im.addEventListener("click", () => openLB(im.src, im.alt)));
document.addEventListener("click", e => {
  const a = e.target.closest("a[data-zoom-link]"); if (!a) return;
  e.preventDefault(); openLB(a.href, a.textContent);
});
lb.addEventListener("click", e => { if (e.target !== lbImg) lb.close(); });

/* ---------- CSI demo ---------- */
const probs = [0.80, 0.65, 0.30];
function buildSliders(){
  const box = document.getElementById("sliders"); if (!box) return;
  const names = t("js_sp");
  box.innerHTML = names.map((n,i) => `<label class="sl"><span>${n}<i>p(occurrence)</i></span>
    <input type="range" min="0.01" max="1" step="0.01" value="${probs[i]}" data-i="${i}" aria-label="${n}">
    <output>${probs[i].toFixed(2)}</output></label>`).join("");
  box.querySelectorAll("input").forEach(inp => inp.addEventListener("input", () => {
    probs[+inp.dataset.i] = +inp.value; inp.nextElementSibling.textContent = (+inp.value).toFixed(2); updateCSI();
  }));
  updateCSI();
}
function updateCSI(){
  const b = probs.reduce((a,c) => a + c, 0) / probs.length;
  const g = Math.exp(probs.reduce((a,c) => a + Math.log(c), 0) / probs.length);
  document.getElementById("barB").style.width = (b*100) + "%";
  document.getElementById("barG").style.width = (g*100) + "%";
  document.getElementById("valB").textContent = b.toFixed(2);
  document.getElementById("valG").textContent = g.toFixed(2);
  document.getElementById("csiNote").textContent = (b - g > 0.06) ? t("js_noteLow") : t("js_noteOk");
}

/* ---------- social links ---------- */
const ICON = {
  email:"✉", orcid:"iD", github:"⌥", scholar:"🎓", researchgate:"RG", linkedin:"in"
};
const LABEL = { orcid:"ORCID", github:"GitHub", scholar:"Google Scholar", researchgate:"ResearchGate", linkedin:"LinkedIn" };
function buildSocial(){
  const box = document.getElementById("social"); if (!box) return;
  box.innerHTML = Object.entries(LINKS).filter(([,v]) => v).map(([k,v]) => {
    const href = k === "email" ? "mailto:" + v : v;
    const label = k === "email" ? `${t("js_email")}: ${v}` : LABEL[k];
    return `<a href="${href}" ${k==="email"?"":'target="_blank" rel="noopener"'}><span aria-hidden="true">${ICON[k]}</span>${label}</a>`;
  }).join("");
}

/* ---------- lidar-scan hero ---------- */
(function lidar(){
  const cv = document.getElementById("lidar"); if (!cv) return;
  const ctx = cv.getContext("2d");
  let W, H, dpr, ground, crowns, pts, sx, raf;
  const ramp = ["#1d4d2b","#2f6b3f","#4f8f4f","#7fb35a","#b8d36a","#f0e27a"];
  function colour(h){ const i = Math.max(0, Math.min(ramp.length-1, Math.floor(h * ramp.length))); return ramp[i]; }
  function rnd(a,b){ return a + Math.random()*(b-a); }
  function forest(){
    const base = H*0.93, ph = Math.random()*6;
    ground = x => base - 18*Math.sin(x/W*3 + ph) - 10*Math.sin(x/W*11 + ph*2);
    crowns = []; let x = -20;
    while (x < W + 40){
      const conifer = Math.random() < .55, h = rnd(.16,.42)*H, w = conifer ? rnd(14,26) : rnd(26,52);
      if (Math.random() < .08) x += rnd(30,90);           // a gap: a harvest or a wetland
      crowns.push({ x, h, w, conifer }); x += w * rnd(.55,.9);
    }
    pts = []; sx = 0;
  }
  function top(x){
    let best = 0, cw = null;
    for (const c of crowns){
      const d = Math.abs(x - c.x); if (d > c.w) continue;
      const r = d / c.w, y = c.conifer ? c.h*(1 - r) : c.h*Math.sqrt(Math.max(0, 1 - r*r))*.95 + c.h*.05*(1-r);
      if (y > best){ best = y; cw = c; }
    }
    return best;
  }
  function resize(){
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight; cv.width = W*dpr; cv.height = H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    forest();
  }
  function shoot(x){
    const g = ground(x), tp = top(x), n = 6;
    for (let k = 0; k < n; k++){
      const u = Math.random(); let hAbove;
      if (tp > 0 && u < .55) hAbove = tp - Math.abs(rnd(0, .18*tp));          // upper crown
      else if (tp > 0 && u < .78) hAbove = rnd(.05, .8) * tp;                // inside the canopy
      else hAbove = rnd(0, 2);                                             // ground
      pts.push({ x: x + rnd(-2,2), y: g - hAbove, c: colour(hAbove/(H*.42)), a: 1 });
    }
  }
  function draw(full){
    ctx.clearRect(0,0,W,H);
    const step = full ? W : 5;
    const until = Math.min(W, sx + step);
    for (let x = sx; x < until; x += 1.6) shoot(x);
    sx = until;
    for (const p of pts){ ctx.globalAlpha = .75*p.a; ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, 2.4, 2.4); }
    if (!full && sx < W){
      ctx.globalAlpha = .55; ctx.strokeStyle = "#7fe0f0"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, ground(sx) - top(sx)); ctx.stroke();
      ctx.globalAlpha = .9; ctx.fillStyle = "#c9f6ff"; ctx.beginPath(); ctx.arc(sx, ground(sx)-top(sx), 2.5, 0, 6.3); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // keep the text side readable
    const gr = ctx.createLinearGradient(0,0,W*.75,0);
    gr.addColorStop(0,"rgba(13,31,21,.72)"); gr.addColorStop(1,"rgba(13,31,21,0)");
    ctx.fillStyle = gr; ctx.fillRect(0,0,W,H);
  }
  function loop(){
    draw(false);
    if (sx >= W){
      for (const p of pts) p.a *= .97;
      if (pts[0] && pts[0].a < .05) forest();
    }
    raf = requestAnimationFrame(loop);
  }
  resize();
  if (reduceMotion) draw(true);
  else { for (let x = 0; x < W*.55; x += 1.6) shoot(x); sx = W*.55; loop(); }   // open on a half-scanned forest
  let to; window.addEventListener("resize", () => { clearTimeout(to); to = setTimeout(() => { cancelAnimationFrame(raf); resize(); reduceMotion ? draw(true) : loop(); }, 200); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) cancelAnimationFrame(raf); else if (!reduceMotion) { cancelAnimationFrame(raf); loop(); } });
})();

/* ---------- start ---------- */
const nav = (navigator.language || "en").slice(0,2);
setLang(store.get("lang") || (["pt","fr"].includes(nav) ? nav : "en"));
