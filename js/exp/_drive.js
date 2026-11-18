/* Ortak sürüş simülatörü (100 Araba ve Strayer & Johnston deneyleri için).
   Görev: şeritte kal (takip görevi), öndeki aracın frenine / kırmızı ışığa tepki ver. */
(function () {
'use strict';
const U = Lab.u;

const QUESTIONS = ['Hafta sonu ne yaptın?', 'En sevdiğin yemek nedir?', 'Hangi şehirde yaşamak isterdin?', 'En son hangi filmi izledin?',
  'Çocukluğunda en sevdiğin oyun neydi?', 'Bugün hava nasıl?', 'Tatilde nereye gitmek istersin?', 'Hangi müziği dinlersin?',
  'En iyi arkadaşın kim?', 'Bu hafta ne planlıyorsun?', 'Sabah kahvaltıda ne yedin?', 'Hangi mevsimi seversin?'];

Lab.drive = {
  QUESTIONS,
  async run(ctx, cfg) {
    const W = 360, H = 480, roadW = 176, egoY = 392, pxPerM = 4.2, scroll = 150, CRUISE = 22, CAR_L = 4.6;
    const wrap = U.el('div', { class: 'drive-wrap' }); ctx.show(wrap);
    const C = ctx.canvas(W, H, { parent: wrap, maxWidth: 440 }), g = C.g;
    const amp = cfg.trackAmp || 1, ph1 = Math.random() * 6, ph2 = Math.random() * 6;
    const road = tau => amp * (52 * Math.sin(0.55 * tau + ph1) + 30 * Math.sin(1.3 * tau + ph2));

    // ---- kontroller
    const inp = { left: false, right: false, brake: false }; const brakePresses = [];
    let tNow = 0;
    const setBrake = on => { if (on && !inp.brake) brakePresses.push(tNow); inp.brake = on; };
    const mk = (label, cls, key) => {
      const b = U.el('button', { type: 'button', class: 'btn ' + (cls || ''), 'aria-label': label }, label);
      const down = e => { e.preventDefault(); if (key === 'brake') setBrake(true); else inp[key] = true; };
      const up = e => { e.preventDefault(); if (key === 'brake') setBrake(false); else inp[key] = false; };
      b.addEventListener('pointerdown', down); ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => b.addEventListener(ev, up));
      b.addEventListener('contextmenu', e => e.preventDefault()); b.addEventListener('click', () => { if (Lab.test) { if (key === 'brake') { setBrake(true); setTimeout(() => setBrake(false), 150); } } });
      return b;
    };
    ctx.setControls(U.el('div', { class: 'pad' }, mk('◀', '', 'left'), mk('FREN', 'brake', 'brake'), mk('▶', '', 'right')));
    ctx.on(window, 'keydown', e => {
      if (e.key === 'ArrowLeft' || e.key === 'a') inp.left = true; else if (e.key === 'ArrowRight' || e.key === 'd') inp.right = true;
      else if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); setBrake(true); }
    });
    ctx.on(window, 'keyup', e => {
      if (e.key === 'ArrowLeft' || e.key === 'a') inp.left = false; else if (e.key === 'ArrowRight' || e.key === 'd') inp.right = false;
      else if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 's') setBrake(false);
    });

    // ---- durum
    let lat = 0, v = CRUISE, gap = 26, vl = CRUISE, dashOff = 0, crashUntil = 0, boostUntil = 0, errSum = 0, errN = 0, offN = 0;
    const leads = [], lights = [], dists = [], convo = { prompts: 0, text: '', until: 0 };
    let crashes = 0, curLead = null, leadBrakeUntil = 0, nextLead = cfg.lead && cfg.lead.on ? 5 + Math.random() * 3 : 1e9;
    let curLight = null, nextLight = cfg.lights && cfg.lights.on ? 3 + Math.random() * 2 : 1e9;
    let nextDist = cfg.distract && cfg.distract.on ? 6 + Math.random() * (cfg.distract.meanIntervalS || 18) : 1e9, curDist = null, overlay = null;
    let nextConvo = cfg.convo && cfg.convo.on ? 3 : 1e9, lastHud = -1;
    const T = cfg.durationS, expo = (m, mn) => mn + (-Math.log(1 - Math.random())) * (m - mn);

    function startDistraction(t) {
      const a = U.int(11, 49); let b = U.int(11, 49); while (b === a) b = U.int(11, 49);
      const bigger = Math.max(a, b);
      curDist = { start: t, end: null, answered: false, correct: null };
      overlay = U.el('div', { class: 'drive-overlay' }, U.el('div', { style: { fontSize: '34px' } }, '📱'), U.el('div', { class: 'q' }, 'Yeni mesaj! Hangi sayı büyük?'),
        U.el('div', { class: 'pad' }, [a, b].map(n => U.el('button', { type: 'button', class: 'btn big', onclick: () => endDistraction(tNow, true, n === bigger) }, String(n)))));
      wrap.append(overlay); dists.push(curDist);
    }
    function endDistraction(t, answered, correct) {
      if (!curDist) return; curDist.end = t; curDist.answered = answered; curDist.correct = correct; curDist = null;
      if (overlay) { overlay.remove(); overlay = null; }
    }
    function distractedWithin(t, win) { return dists.some(d => d.start <= t && (d.end == null ? true : d.end >= t - win)); }

    function step(t, dt) {
      tNow = t;
      // yön ve konum
      const steer = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      lat = U.clamp(lat + steer * 150 * dt, -140, 140);
      const err = lat - road(t); errSum += Math.abs(err); errN++; if (Math.abs(err) > roadW / 2 - 13) offN++;
      // fren / hız
      const crashed = t < crashUntil;
      if (crashed) v = Math.max(0, v - 25 * dt);
      else if (inp.brake) v = Math.max(0, v - 9 * dt); else v = Math.min(CRUISE, v + 3 * dt);
      dashOff = (dashOff + v * 4 * dt) % 40;
      // öndeki araç
      if (cfg.lead && cfg.lead.on) {
        if (t >= nextLead && !curLead) {
          curLead = { id: leads.length + 1, onset: t, minTTC: Infinity, minGap: gap, brakeT: null, crash: false, distracted: distractedWithin(t, 3), distractedAtOnset: !!curDist, result: null };
          leads.push(curLead); leadBrakeUntil = t + 1.7;
        }
        let target;
        if (t < leadBrakeUntil) target = 6; else if (t < boostUntil) target = 30; else target = U.clamp(CRUISE + 0.45 * (28 - gap), 12, 27);
        const acc = t < leadBrakeUntil ? 8 : 3;
        vl += U.clamp(target - vl, -acc * dt, acc * dt);
        gap += (vl - v) * dt;
        if (gap <= CAR_L && !crashed) {
          crashes++; crashUntil = t + 1.2; boostUntil = t + 3; gap = CAR_L + 2; if (curLead) curLead.crash = true; Lab.buzz(120);
          if (!curLead) leads.push({ id: leads.length + 1, onset: t, minTTC: 0, minGap: gap, brakeT: null, crash: true, distracted: distractedWithin(t, 3), result: 'Çarpışma', closed: true });
        }
        if (curLead) {
          const cl = v - vl; if (cl > 0.2) curLead.minTTC = Math.min(curLead.minTTC, Math.max(0, (gap - CAR_L) / cl));
          curLead.minGap = Math.min(curLead.minGap, gap);
          if (curLead.brakeT == null) { const bp = brakePresses.find(x => x >= curLead.onset - 0.001); if (bp !== undefined) curLead.brakeT = bp; else if (inp.brake) curLead.brakeT = t; }
          if (t >= curLead.onset + 6) {
            const near = cfg.nearCrashTTC || 2.0;
            curLead.result = curLead.crash ? 'Çarpışma' : (curLead.minTTC < near ? 'Ucuz atlatma' : 'Normal');
            curLead.rt = curLead.brakeT != null ? (curLead.brakeT - curLead.onset) : null; curLead.closed = true; curLead = null;
            nextLead = t + expo(cfg.lead.meanIntervalS || 10, 5.5);
          }
        }
      }
      // ışıklar
      if (cfg.lights && cfg.lights.on) {
        if (!curLight && t >= nextLight) { curLight = { onset: t, color: Math.random() < 0.5 ? 'red' : 'green', pressed: null }; lights.push(curLight); }
        if (curLight) {
          const showS = (cfg.lights.showMs || 1500) / 1000;
          if (curLight.pressed == null) { const bp = brakePresses.find(x => x >= curLight.onset && x <= curLight.onset + showS + 0.5); if (bp !== undefined) curLight.pressed = bp; }
          if (t >= curLight.onset + showS) { curLight.closed = true; curLight = null; nextLight = t + expo(cfg.lights.meanIntervalS || 4, 2.2); }
        }
      }
      // dikkat dağıtıcı
      if (cfg.distract && cfg.distract.on) {
        if (!curDist && t >= nextDist && t < T - 6) startDistraction(t);
        if (curDist && t - curDist.start > (cfg.distract.maxMs || 5000) / 1000) { endDistraction(t, false, false); nextDist = t + expo(cfg.distract.meanIntervalS || 18, 8); }
        else if (!curDist && nextDist < t) nextDist = t + expo(cfg.distract.meanIntervalS || 18, 8);
      }
      // telefon konuşması
      if (cfg.convo && cfg.convo.on && t >= nextConvo) {
        const q = QUESTIONS[convo.prompts % QUESTIONS.length]; convo.prompts++; convo.text = q; convo.until = t + 3.5; nextConvo = t + (cfg.convo.intervalS || 7);
        ctx.speak(q, { maxMs: 4000 }).catch(() => { });
      }
    }

    function car(x, y, col, braking) {
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x - 12, y - 20, 28, 44);
      g.fillStyle = col; g.beginPath(); g.roundRect ? g.roundRect(x - 13, y - 22, 26, 44, 6) : g.rect(x - 13, y - 22, 26, 44); g.fill();
      g.fillStyle = 'rgba(20,30,50,.85)'; g.fillRect(x - 9, y - 12, 18, 9); g.fillRect(x - 9, y + 8, 18, 6);
      g.fillStyle = braking ? '#ff1f1f' : '#7a1d1d'; g.fillRect(x - 12, y + 19, 7, 3); g.fillRect(x + 5, y + 19, 7, 3);
      if (braking) { g.fillStyle = 'rgba(255,40,40,.35)'; g.beginPath(); g.arc(x - 8, y + 24, 9, 0, 7); g.arc(x + 8, y + 24, 9, 0, 7); g.fill(); }
    }
    function draw(t) {
      g.fillStyle = '#4b8f3b'; g.fillRect(0, 0, W, H);
      for (let y = H; y >= 0; y -= 3) {
        const cx = W / 2 + road(t - (egoY - y) / scroll);
        g.fillStyle = '#4a4f5a'; g.fillRect(cx - roadW / 2, y, roadW, 3.5);
        g.fillStyle = '#f4f4f4'; g.fillRect(cx - roadW / 2, y, 4, 3.5); g.fillRect(cx + roadW / 2 - 4, y, 4, 3.5);
        if (((y + dashOff) % 40) < 22) { g.fillStyle = '#e6c84a'; g.fillRect(cx - 2, y, 4, 3.5); }
      }
      if (cfg.lead && cfg.lead.on) {
        const rear = egoY - 22 - gap * pxPerM, yc = rear - 22;
        if (yc > -40) { const lx = W / 2 + road(t - (egoY - yc) / scroll); car(lx, yc, '#2563eb', t < leadBrakeUntil); }
      }
      car(W / 2 + lat, egoY, '#e11d48', inp.brake);
      // hedef işareti (yol ortası)
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(W / 2 + road(t), egoY - 60); g.lineTo(W / 2 + road(t), egoY + 40); g.stroke(); g.setLineDash([]);
      if (cfg.lights && cfg.lights.on) {
        g.fillStyle = '#111'; g.fillRect(W / 2 - 24, 8, 48, 62); g.strokeStyle = '#555'; g.strokeRect(W / 2 - 24, 8, 48, 62);
        const on = curLight ? curLight.color : null;
        g.fillStyle = on === 'red' ? '#ff2a2a' : '#3a1515'; g.beginPath(); g.arc(W / 2, 26, 11, 0, 7); g.fill();
        g.fillStyle = on === 'green' ? '#2aff6a' : '#133a1f'; g.beginPath(); g.arc(W / 2, 52, 11, 0, 7); g.fill();
      }
      if (t < convo.until) {
        g.fillStyle = 'rgba(255,255,255,.93)'; g.fillRect(8, 84, W - 16, 30); g.fillStyle = '#111'; g.font = '14px system-ui,sans-serif'; g.textAlign = 'left'; g.fillText('📞 ' + convo.text, 14, 104);
      }
      g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, H - 22, W, 22); g.fillStyle = '#fff'; g.font = '12px system-ui,sans-serif'; g.textAlign = 'left';
      g.fillText(Math.round(v * 3.6) + ' km/sa', 8, H - 7); g.textAlign = 'right'; g.fillText('Kalan: ' + Math.max(0, Math.ceil(T - t)) + ' sn', W - 8, H - 7);
      if (t < crashUntil) { g.fillStyle = 'rgba(220,0,0,.35)'; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.font = 'bold 32px system-ui'; g.textAlign = 'center'; g.fillText('ÇARPIŞMA!', W / 2, H / 2); }
    }

    await ctx.animate((t, dt) => {
      if (dt <= 0) return false;
      // büyük kare atlamalarında alt adımlarla ilerle
      const n = Math.max(1, Math.ceil(dt / 0.034)); for (let i = 0; i < n; i++) step(t - dt + (i + 1) * dt / n, dt / n);
      draw(t);
      if (Math.floor(t) !== lastHud) { lastHud = Math.floor(t); ctx.hud(cfg.hud ? cfg.hud(t) : ''); }
      return t >= T;
    });
    if (curDist) endDistraction(T, false, false);
    if (overlay) { overlay.remove(); overlay = null; }
    leads.forEach(l => { if (!l.closed) { l.result = l.crash ? 'Çarpışma' : 'Tamamlanmadı'; l.rt = l.brakeT != null ? l.brakeT - l.onset : null; } });
    lights.forEach(l => { l.hit = l.color === 'red' && l.pressed != null; l.miss = l.color === 'red' && l.pressed == null; l.fa = l.color === 'green' && l.pressed != null; l.rt = l.pressed != null ? (l.pressed - l.onset) * 1000 : null; });
    // baz (rastgele zaman) maruziyeti: 3 sn içinde dikkat dağınıklığı olan örneklerin oranı
    let sN = 0, sD = 0; for (let s = 3; s < T - 1; s += 0.5) { sN++; if (distractedWithin(s, 3)) sD++; }
    return {
      dur: T, trackMAE: errN ? errSum / errN : NaN, offPct: errN ? offN / errN : NaN, crashes, leads: leads.filter(l => l.result), lights: lights.filter(l => l.closed), dists,
      prompts: convo.prompts, baselineDistracted: sN ? sD / sN : 0, distractedSec: U.sum(dists.map(d => (d.end || T) - d.start))
    };
  }
};
})();
