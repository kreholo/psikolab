(function () {
'use strict';
const U = Lab.u;
const SYL = ['ba', 'da', 'ga', 'pa', 'ta', 'ka'];
// ünsüz özellikleri: F2 başlangıcı (yer ipucu), patlama frekansı, ötümlülük
const CONS = { ba: { f2: 800, burst: 600, voiced: true }, da: { f2: 1750, burst: 3800, voiced: true }, ga: { f2: 1450, burst: 2000, voiced: true },
  pa: { f2: 800, burst: 700, voiced: false }, ta: { f2: 1750, burst: 4000, voiced: false }, ka: { f2: 1450, burst: 2100, voiced: false } };

let noiseBuf = null;
function buses(ac) {
  if (ac._psl) return ac._psl;
  const m = ac.createChannelMerger(2); m.connect(ac.destination);
  const L = ac.createGain(), R = ac.createGain(); L.connect(m, 0, 0); R.connect(m, 0, 1); ac._psl = { L, R }; return ac._psl;
}
function playSyl(ac, bus, syl, f0, female) {
  const t = ac.currentTime + 0.02, c = CONS[syl], sh = female ? 1.18 : 1;
  const src = ac.createOscillator(); src.type = 'sawtooth'; src.frequency.setValueAtTime(f0 * 1.06, t); src.frequency.linearRampToValueAtTime(f0 * 0.92, t + 0.34);
  const out = ac.createGain(), v0 = c.voiced ? t : t + 0.05;
  out.gain.setValueAtTime(0.0001, t); out.gain.setValueAtTime(0.0001, v0); out.gain.linearRampToValueAtTime(0.85, v0 + 0.03); out.gain.setValueAtTime(0.85, t + 0.27); out.gain.linearRampToValueAtTime(0.0001, t + 0.38);
  [[420, 800, 1, 7], [c.f2, 1200, 0.65, 9], [2500, 2600, 0.35, 12]].forEach(([f0s, f1, gain, q]) => {
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q; f.frequency.setValueAtTime(f0s * sh, t); f.frequency.linearRampToValueAtTime(f1 * sh, t + 0.07);
    const g = ac.createGain(); g.gain.value = gain; src.connect(f); f.connect(g); g.connect(out);
  });
  out.connect(bus);
  if (!noiseBuf || noiseBuf.sampleRate !== ac.sampleRate) { noiseBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.12), ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const n = ac.createBufferSource(); n.buffer = noiseBuf; const nf = ac.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = c.burst * sh; nf.Q.value = 1.2;
  const ng = ac.createGain(), nd = c.voiced ? 0.05 : 0.11; ng.gain.setValueAtTime(0.0001, t); ng.gain.linearRampToValueAtTime(c.voiced ? 0.5 : 0.7, t + 0.008); ng.gain.exponentialRampToValueAtTime(0.0001, t + nd);
  n.connect(nf); nf.connect(ng); ng.connect(bus); n.start(t); n.stop(t + 0.13);
  src.start(t); src.stop(t + 0.42);
}
function playTone(ac, bus, freq, dur) {
  const t = ac.currentTime + 0.02, o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.5, t + 0.02); g.gain.setValueAtTime(0.5, t + dur - 0.05); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.05);
}
const sylOptions = () => SYL.map((x, i) => ({ label: `${x.toUpperCase()}`, value: x, key: String(i + 1) }));

Lab.register({
  id: 'cherry', icon: '🎧', short: 'Cherry', title: 'Cherry (1953) – İkili (dikotik) dinleme ve gölgeleme', group: 'Seçici dikkat',
  tagline: 'Bir kulağa odaklanınca diğer kulaktaki bilgiden ne kadarı geçer?',
  about: `<p><b>Cherry (1953)</b> katılımcılara kulaklıkla iki kulağa <i>farklı</i> mesajlar verdi ve yalnızca bir kulaktaki mesajı yüksek sesle tekrar etmelerini (<b>gölgeleme</b>) istedi.
  Sonuçta yok sayılan kulakta <b>fiziksel</b> değişiklikler (erkek → kadın sesi, saf ses) fark edilirken <b>anlam/dil içeriği</b> neredeyse hiç fark edilmedi. Bu, dikkatin bir “filtre” gibi çalıştığı fikrini (Broadbent) doğurdu.</p>
  <p>Bu sekme, tarayıcıda <b>sentezlenmiş hece sesleri</b> (ba, da, ga, pa, ta, ka) kullanır. İkinci bölüm, <b>Kimura’nın</b> dikotik hece çiftleri düzeneğidir (sağ kulak avantajı).</p>`,
  howto: `<ol><li><b>Kulaklık takın</b> (zorunlu) ve ses testi düğmeleriyle sol/sağ kulağı kontrol edin.</li>
  <li><b>Gölgeleme:</b> yalnızca belirtilen kulaktaki heceleri duydukça düğmelere basarak tekrarlayın. Diğer kulağı yok sayın.</li>
  <li>Bitince karşı kulakta bir şey fark edip etmediğiniz sorulur.</li><li><b>Hece çiftleri:</b> iki kulaktan aynı anda iki hece gelir; duyduğunuz <b>iki</b> heceyi seçin.</li></ol>`,
  verify: `<ul><li>Gölgeleme isabet oranı (doğru kulaktaki hece sırasını izleme) ≥ %50 olmalı; aksi halde dikkat yönlendirilmemiş sayılır.</li>
  <li>Karşı kulaktaki <i>müdahale</i> (ses değişimi / bip) sonradan kaç kez fark edildi, kayıtlı gerçekle karşılaştırılır.</li>
  <li>Ses desteği yoksa veya tek kanal çalıyorsa uyarı verilir.</li></ul>`,
  refs: 'Cherry, E. C. (1953). Some experiments on the recognition of speech, with one and with two ears. J. Acoust. Soc. Am., 25, 975–979. · Kimura, D. (1961). Cerebral dominance and the perception of verbal stimuli. Can. J. Psychol.',
  settings: [
    { group: 'Bölüm' },
    { key: 'mode', label: 'Hangi bölüm?', type: 'select', def: 'both', options: [['both', 'Gölgeleme + hece çiftleri'], ['shadow', 'Yalnız gölgeleme'], ['pairs', 'Yalnız hece çiftleri']] },
    { group: 'Gölgeleme' },
    { key: 'ear', label: 'Dikkat edilecek kulak', type: 'select', def: 'random', options: [['random', 'Rastgele'], ['left', 'Sol'], ['right', 'Sağ']] },
    { key: 'nSyl', label: 'Hece sayısı (her kulakta)', type: 'number', def: 24, min: 8, max: 80 },
    { key: 'soa', label: 'Hece aralığı (SOA)', type: 'number', def: 1100, min: 600, max: 3000, step: 100, unit: 'ms' },
    { key: 'manip', label: 'Karşı kulakta müdahale', type: 'select', def: 'voice', options: [['voice', 'Ses değişimi (erkek→kadın)'], ['tone', 'Saf ses (bip)'], ['none', 'Yok (kontrol)']] },
    { key: 'manipAt', label: 'Müdahale başlangıcı', type: 'number', def: 60, min: 20, max: 90, unit: '% (akışın)', step: 5 },
    { group: 'Hece çiftleri' },
    { key: 'nPairs', label: 'Çift sayısı', type: 'number', def: 16, min: 4, max: 80, step: 2 },
    { key: 'pairGap', label: 'Çiftler arası boşluk', type: 'number', def: 600, min: 100, max: 3000, step: 100, unit: 'ms' }
  ],
  testSettings: { nSyl: 8, soa: 600, nPairs: 4, pairGap: 100 },
  expectOk: r => r.meta.hitRate >= 0.8 ? null : 'akıllı bot gölgelemede ≥ %80 isabet almalıydı: ' + r.meta.hitRate,
  async run(ctx) {
    const s = ctx.s; let ac = Lab.audio(); const res = { checks: [], summary: [], rows: [], charts: [] }; let busy = null; let hitRate = NaN;
    const B = () => { ac = Lab.audio(); return ac ? buses(ac) : null; };
    // ---- ses testi
    for (;;) {
      ctx.show(`<div class="msg"><h3>🎧 Kulaklık gerekli</h3><p>Sol ve sağ kulağın doğru çalıştığını kontrol edin. Ses seviyesini rahat duyulacak şekilde ayarlayın.</p>
        <p>Bölüm: <b>${s.mode === 'both' ? 'Gölgeleme + hece çiftleri' : s.mode === 'shadow' ? 'Gölgeleme' : 'Hece çiftleri'}</b></p>${ac ? '' : '<p style="color:#dc2626"><b>Bu tarayıcıda Web Audio desteklenmiyor!</b></p>'}</div>`);
      const r = await ctx.waitChoice([{ label: '🔈 Sol kulak testi', value: 'L' }, { label: '🔉 Sağ kulak testi', value: 'R' }, { label: '▶ Hazırım, başla', value: 'go', cls: 'primary' }], { botPick: 'go' });
      if (r.value === 'go') break; busy = B(); if (busy) { playSyl(ac, busy[r.value], 'ba', 120, false); playTone(ac, busy[r.value], 660, 0.25); }
    }
    const bus = B();
    res.checks.push({ ok: bus ? true : false, label: 'Ses çıkışı (stereo) kullanılabilir', detail: bus ? 'Web Audio etkin.' : 'Ses çalınamadı: tarayıcı Web Audio desteklemiyor veya engelledi.' });

    // ---- gölgeleme
    if (s.mode !== 'pairs') {
      const att = s.ear === 'random' ? U.pick(['left', 'right']) : s.ear, una = att === 'left' ? 'right' : 'left', ear = e => e === 'left' ? 'L' : 'R';
      const A = U.range(s.nSyl).map(() => U.pick(SYL)), Bq = U.range(s.nSyl).map(() => U.pick(SYL)), m = Math.floor(s.nSyl * s.manipAt / 100);
      await ctx.message(`<h3>Gölgeleme</h3><p>Dikkat edeceğiniz kulak: <b style="font-size:1.4em">${att === 'left' ? '◀ SOL' : 'SAĞ ▶'}</b></p>
        <p>Yalnızca bu kulaktaki heceleri duydukça aşağıdaki düğmelere basarak tekrarlayın (kısayol: 1–6). Diğer kulağı yok sayın. ~${Math.round(s.nSyl * s.soa / 1000)} sn sürecek.</p>`, 'Başla');
      const taps = []; const onsets = []; let live = true;
      const tap = syl => { if (live) taps.push({ syl, t: performance.now() }); };
      const btns = SYL.map((x, i) => { const b = U.el('button', { type: 'button', class: 'btn choice big', 'aria-label': x }, x.toUpperCase()); b.addEventListener('pointerdown', e => { e.preventDefault(); tap(x); });
        b.addEventListener('click', () => { if (Lab.test) tap(x); }); return b; });
      ctx.setControls(btns); ctx.controls.classList.add('grid');
      ctx.on(window, 'keydown', e => { const i = '123456'.indexOf(e.key); if (i >= 0 && !e.repeat) tap(SYL[i]); });
      ctx.show(`<div class="mid">${att === 'left' ? '◀ SOL kulağı dinle' : 'SAĞ kulağı dinle ▶'}</div><div class="hud">Duyduğunuz heceye basın</div>`);
      await ctx.sleep(Lab.test ? 30 : 900);
      for (let i = 0; i < s.nSyl; i++) {
        onsets.push(performance.now());
        if (bus) {
          playSyl(ac, bus[ear(att)], A[i], 120, false);
          if (s.manip === 'tone' && i >= m && i < m + 3) playTone(ac, bus[ear(una)], 1000, 0.5);
          else playSyl(ac, bus[ear(una)], Bq[i], s.manip === 'voice' && i >= m ? 235 : 120, s.manip === 'voice' && i >= m);
        }
        if (Lab.test && Lab.botMode === 'smart') setTimeout(() => tap(A[i]), Lab.test ? 5 : 300);
        ctx.progress(i + 1, s.nSyl); await ctx.sleep(s.soa);
      }
      await ctx.sleep(Lab.test ? 30 : 800); live = false; ctx.setControls(); ctx.controls.classList.remove('grid');
      // puanlama
      const claimed = new Set(); let hit = 0, intr = 0, err = 0, extra = 0;
      const minWin = Lab.test ? 0 : 150;
      taps.sort((a, b) => a.t - b.t).forEach(tp => {
        const i = onsets.findIndex((o, k) => !claimed.has(k) && tp.t >= o + minWin && tp.t <= o + 1.7 * s.soa + 200);
        if (i < 0) { extra++; return; } claimed.add(i);
        if (tp.syl === A[i]) hit++; else if (tp.syl === Bq[i]) intr++; else err++;
      });
      hitRate = hit / s.nSyl;
      const q = await ctx.form(`<fieldset><legend>Dikkat ETMEDİĞİNİZ (${una === 'left' ? 'sol' : 'sağ'}) kulakta bir şey fark ettiniz mi?</legend>
        <label class="opt"><input type="radio" name="q" value="none"> Hayır, bir değişiklik fark etmedim</label>
        <label class="opt"><input type="radio" name="q" value="voice"> Konuşan kişinin sesi değişti (erkek → kadın)</label>
        <label class="opt"><input type="radio" name="q" value="tone"> Bir bip / saf ses duydum</label>
        <label class="opt"><input type="radio" name="q" value="syl"> Heceler/dil/içerik değişti</label></fieldset>`, { submit: 'Yanıtla', validate: d => d.q ? null : 'Bir seçenek işaretleyin.' });
      const truth = s.manip, noticed = q.q === truth;
      res.rows.push({ bölüm: 'Gölgeleme', 'dikkat kulağı': att === 'left' ? 'sol' : 'sağ', 'hece sayısı': s.nSyl, isabet: hit, 'karşı kulak sızması': intr, hata: err, fazladan: extra, müdahale: truth, 'katılımcı yanıtı': q.q, 'fark etti': noticed ? 1 : 0 });
      res.checks.push({ ok: hitRate >= 0.5 ? true : hitRate >= 0.3 ? 'warn' : false, label: `Gölgeleme isabeti: ${U.pct(hitRate)} (${hit}/${s.nSyl})`, detail: 'Doğru kulağı izlediğinizi gösterir; ≥ %50 beklenir. Düşükse SOA’yı artırın.' });
      res.checks.push({ ok: intr <= hit ? true : 'warn', label: `Karşı kulaktan sızan yanıt: ${intr}`, detail: 'Karşı kulağa ait heceleri yanıtladıysanız dikkat tam seçici değildi.' });
      res.checks.push({ ok: true, label: `Karşı kulak müdahalesi: ${({ voice: 'ses değişimi', tone: 'bip', none: 'yok' })[truth]} → yanıtınız: ${({ none: 'değişiklik yok', voice: 'ses değişti', tone: 'bip', syl: 'içerik değişti' })[q.q]}`, detail: noticed ? 'Fiziksel değişikliği fark ettiniz (Cherry ile uyumlu).' : 'Fark edilmedi / farklı bildirildi.' });
      res.summary.push({ label: 'Gölgeleme isabeti', value: U.pct(hitRate) }, { label: 'Karşı kulak sızıntısı', value: String(intr) }, { label: 'Müdahale fark edildi', value: truth === 'none' ? '(kontrol)' : noticed ? 'Evet' : 'Hayır' });
    }
    // ---- Kimura hece çiftleri
    if (s.mode !== 'shadow') {
      await ctx.message(`<h3>Hece çiftleri</h3><p>Her denemede <b>sol ve sağ kulaktan aynı anda farklı birer hece</b> gelir. Duyduğunuz <b>iki</b> heceyi sırayla seçin (hangisi önce gelirse). Emin değilseniz tahmin edin.</p>`, 'Başla');
      let L = 0, R = 0, both = 0;
      for (let i = 0; i < s.nPairs; i++) {
        const l = U.pick(SYL); let r = U.pick(SYL); while (r === l) r = U.pick(SYL);
        ctx.show('<div class="mid">🎧 Dinleyin…</div>'); ctx.setControls(); await ctx.sleep(Lab.test ? 20 : 500);
        if (bus) { playSyl(ac, bus.L, l, 120, false); playSyl(ac, bus.R, r, 120, false); }
        await ctx.sleep(Lab.test ? 20 : 700);
        ctx.show('<div class="mid">Duyduğunuz 1. hece?</div>'); const a1 = await ctx.waitChoice(sylOptions(), { layout: 'grid', botPick: l });
        ctx.show('<div class="mid">Duyduğunuz 2. hece?</div>'); const a2 = await ctx.waitChoice(sylOptions().filter(o => o.value !== a1.value), { layout: 'grid', botPick: r === a1.value ? l : r });
        const got = [a1.value, a2.value], hl = got.includes(l), hr = got.includes(r); if (hl) L++; if (hr) R++; if (hl && hr) both++;
        res.rows.push({ bölüm: 'Hece çifti', sol: l, sağ: r, 'yanıt 1': a1.value, 'yanıt 2': a2.value, 'sol doğru': hl ? 1 : 0, 'sağ doğru': hr ? 1 : 0 });
        ctx.progress(i + 1, s.nPairs); ctx.clear(); await ctx.sleep(s.pairGap);
      }
      const n = s.nPairs, rea = (R - L) / n;
      res.checks.push({ ok: (L + R) / (2 * n) > 1 / 3 + 0.05 ? true : 'warn', label: `Hece çifti doğruluğu: ${U.pct((L + R) / (2 * n))}`, detail: 'Rastgele tahmin ≈ %33 (6 hece arasından). Üstünde olmalı.' });
      res.checks.push({ ok: true, label: `Sağ kulak avantajı (SKA): ${U.fmt(rea * 100, 1)} puan`, detail: 'Sağ elini kullananlarda sağ kulak (sol beyin yarım küre) çoğunlukla üstündür; bireysel farklılık normaldir.' });
      res.summary.push({ label: 'Sol kulak doğru', value: U.pct(L / n) }, { label: 'Sağ kulak doğru', value: U.pct(R / n) }, { label: 'Sağ kulak avantajı', value: U.fmt(rea * 100, 1) + ' puan' });
      res.charts.push({ title: 'Hece çifti – kulağa göre doğru oranı (%)', svg: U.svgBars({ labels: ['Sol kulak', 'Sağ kulak'], values: [L / n * 100, R / n * 100], max: 100, colors: ['#0ea5e9', '#f59e0b'] }) });
    }
    return {
      meta: { hitRate }, summary: res.summary, checks: res.checks, charts: res.charts, trials: res.rows,
      interpretation: '<p>Cherry’nin temel bulgusu: dikkat edilen kulaktaki içerik işlenirken, <b>dikkat edilmeyen kulaktaki</b> fiziksel değişiklikler (ses tonu, bip) fark edilebilir; anlamsal içerik büyük ölçüde kaybolur. Hece çiftlerinde ise çoğu kişide sağ kulak avantajı görülür (konuşma sesleri için sol yarımküre baskınlığı).</p>'
    };
  }
});
})();
