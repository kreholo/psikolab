(function () {
'use strict';
const U = Lab.u;

Lab.register({
  id: 'gorilla', icon: '🦍', short: 'Goril Deneyi', title: 'Simons & Chabris (1999) – Ünlü "Goril" Deneyi', group: 'Seçici dikkat / Körlük',
  tagline: 'Beyaz tişörtlülerin paslarını sayarken ortadan geçen gorili fark edebilir misin?',
  about: `<p><b>Daniel Simons ve Christopher Chabris (1999)</b>, psikoloji tarihinin en meşhur deneylerinden biri olan <i>“Aramızdaki Goriller” (Gorillas in our midst)</i> çalışmasını yürüttü.</p>
  <p>Katılımcılardan ekranda basketbol topuyla paslaşan iki takımdan <b>BEYAZ tişörtlü takımın</b> yaptığı pasları dikkatle saymaları istendi. Paslaşma devam ederken sahnenin tam ortasından goril kostümü giymiş biri yürüyerek geçti, durup göğsünü yumrukladı ve çıktı (toplam 9 saniye sahnede kaldı).</p>
  <p>Sonuç inanılmazdı: Katılımcıların <b>yaklaşık %50'si gorili hiç görmedi!</b> Bu deney, dikkatin dinamik ve sürekli olaylarda bile ne kadar dar bir tünel vizyonu oluşturabildiğini gösterdi.</p>`,
  howto: `<ol>
  <li>Ekranda paslaşan iki takım göreceksiniz: <b>Beyaz Takım</b> ve <b>Siyah Takım</b>.</li>
  <li>Göreviniz yalnızca <b>BEYAZ TAKIMIN</b> birbirine attığı pasları saymaktır!</li>
  <li>Her pas olduğunda ekrandaki <b>PAS SAYACI</b> butonuna basabilir veya aklınızdan sayabilirsiniz.</li>
  <li>Oyun bittiğinde pas sayısı ve dikkatinizle ilgili sorular sorulacaktır.</li>
  </ol>`,
  verify: `<ul>
  <li>Gerçek beyaz takım pas sayısı ile sayılan pas sayısı karşılaştırılır (görev odaklılığı denetimi).</li>
  <li>Gorilin fark edilip edilmediği kaydedilir ve Simons & Chabris'in %50 literatür ortalaması ile kıyaslanır.</li>
  </ul>`,
  refs: 'Simons, D. J., & Chabris, C. F. (1999). Gorillas in our midst: sustained inattentional blindness for dynamic events. Perception, 28(9), 1059–1074.',
  settings: [
    { group: 'Zaman ve Hız' },
    { key: 'durationS', label: 'Video / Maç süresi', type: 'number', def: 25, min: 15, max: 60, step: 5, unit: 'sn' },
    { key: 'passInterval', label: 'Ortalama pas aralığı', type: 'number', def: 2.2, min: 1.2, max: 4.0, step: 0.2, unit: 'sn' },
    { group: 'Goril Özellikleri' },
    { key: 'gorillaStartS', label: 'Gorilin giriş zamanı', type: 'number', def: 9, min: 4, max: 30, step: 1, unit: 'sn' },
    { key: 'gorillaDurS', label: 'Gorilin sahnede kalma süresi', type: 'number', def: 7, min: 4, max: 12, step: 1, unit: 'sn' }
  ],
  testSettings: { durationS: 6, passInterval: 1.5, gorillaStartS: 2, gorillaDurS: 3 },
  unit() {
    return [
      ['Lab.u hazır', typeof Lab.u === 'object']
    ];
  },
  async run(ctx) {
    const s = ctx.s;
    const W = 520, H = 380;
    const C = ctx.canvas(W, H, { maxWidth: 540 });
    const g = C.g;

    await ctx.message(`<h3>Simons & Chabris (1999) – Goril Deneyi</h3>
      <p>Sahada iki takım basketbol oynuyor: <b>Beyaz Takım</b> ve <b>Siyah Takım</b>.</p>
      <p>⚠️ <u>ÇOK ÖNEMLİ GÖREV:</u> Yalnızca <b>BEYAZ TİŞÖRTLÜ TAKIMIN</b> yaptığı pasları sayın!</p>
      <p>Pasları aklınızdan sayabilir veya her pasta aşağıdaki <b>+1 PAS</b> butonuna basabilirsiniz.</p>`, 'Maçı Başlat');

    // Oyuncuların oluşturulması (3 Beyaz, 3 Siyah)
    const whitePlayers = [
      { x: 100, y: 140, vx: 40, vy: 25, team: 'white' },
      { x: 260, y: 100, vx: -30, vy: 35, team: 'white' },
      { x: 400, y: 160, vx: -45, vy: -20, team: 'white' }
    ];
    const blackPlayers = [
      { x: 140, y: 260, vx: 35, vy: -30, team: 'black' },
      { x: 280, y: 300, vx: -40, vy: -25, team: 'black' },
      { x: 380, y: 240, vx: 25, vy: 40, team: 'black' }
    ];

    // Toplar
    const ballWhite = { x: whitePlayers[0].x, y: whitePlayers[0].y, tx: whitePlayers[1].x, ty: whitePlayers[1].y, p: 0, from: 0, to: 1, team: 'white' };
    const ballBlack = { x: blackPlayers[0].x, y: blackPlayers[0].y, tx: blackPlayers[1].x, ty: blackPlayers[1].y, p: 0, from: 0, to: 1, team: 'black' };

    let whitePasses = 0;
    let blackPasses = 0;
    let countedPasses = 0;
    const passOnsets = [];

    // Pas sayacı butonu
    const passBtn = U.el('button', { type: 'button', class: 'btn primary big', 'aria-label': 'Pas sayacı' }, '🏀 +1 PAS SAYDIM');
    passBtn.addEventListener('click', () => {
      countedPasses++;
      ctx.hud(`Saydığınız Beyaz Takım Pası: <b>${countedPasses}</b>`);
    });
    ctx.setControls(passBtn);
    ctx.hud('Beyaz takım paslarını sayın!');

    const T = s.durationS;
    const gStart = s.gorillaStartS;
    const gEnd = gStart + s.gorillaDurS;

    let nextWhitePass = 1.0;
    let nextBlackPass = 1.6;

    const drawPlayer = (p) => {
      // Gölge
      g.fillStyle = 'rgba(0,0,0,0.18)';
      g.beginPath();
      g.ellipse(p.x, p.y + 24, 16, 6, 0, 0, Math.PI * 2);
      g.fill();

      // Gövde (tişört)
      g.fillStyle = p.team === 'white' ? '#f8fafc' : '#0f172a';
      g.strokeStyle = '#94a3b8';
      g.lineWidth = 2;
      g.beginPath();
      g.roundRect ? g.roundRect(p.x - 14, p.y - 12, 28, 30, 6) : g.rect(p.x - 14, p.y - 12, 28, 30);
      g.fill();
      if (p.team === 'white') g.stroke();

      // Baş
      g.fillStyle = '#fbcfe8';
      g.beginPath();
      g.arc(p.x, p.y - 22, 10, 0, Math.PI * 2);
      g.fill();
    };

    const drawBall = (b) => {
      g.fillStyle = '#ea580c';
      g.beginPath();
      g.arc(b.x, b.y, 8, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#9a3412';
      g.lineWidth = 1.5;
      g.stroke();
    };

    const drawGorilla = (gx, gy, thumping) => {
      // Goril gövdesi
      g.fillStyle = 'rgba(0,0,0,0.2)';
      g.beginPath();
      g.ellipse(gx, gy + 34, 22, 8, 0, 0, Math.PI * 2);
      g.fill();

      g.fillStyle = '#18181b';
      g.beginPath();
      g.ellipse(gx, gy, 22, 30, 0, 0, Math.PI * 2);
      g.fill();

      // Kafa
      g.fillStyle = '#27272a';
      g.beginPath();
      g.arc(gx, gy - 32, 14, 0, Math.PI * 2);
      g.fill();

      // Yüz detayları
      g.fillStyle = '#52525b';
      g.beginPath();
      g.ellipse(gx, gy - 30, 8, 6, 0, 0, Math.PI * 2);
      g.fill();

      // Kollar (Göğüs yumruklama)
      g.lineWidth = 8;
      g.strokeStyle = '#18181b';
      g.lineCap = 'round';
      if (thumping) {
        g.beginPath();
        g.moveTo(gx - 20, gy - 6);
        g.lineTo(gx - 4, gy - 8);
        g.moveTo(gx + 20, gy - 6);
        g.lineTo(gx + 4, gy - 8);
        g.stroke();
      } else {
        g.beginPath();
        g.moveTo(gx - 20, gy - 10);
        g.lineTo(gx - 16, gy + 16);
        g.moveTo(gx + 20, gy - 10);
        g.lineTo(gx + 16, gy + 16);
        g.stroke();
      }
    };

    await ctx.animate((t, dt) => {
      // 1. Saha arka planı
      g.fillStyle = '#e2e8f0';
      g.fillRect(0, 0, W, H);

      // Parke çizgileri
      g.strokeStyle = 'rgba(148,163,184,0.35)';
      g.lineWidth = 2;
      for (let y = 30; y < H; y += 40) {
        g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
      }
      g.beginPath(); g.arc(W / 2, H / 2, 60, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke();

      // 2. Oyuncuların hareketi
      [...whitePlayers, ...blackPlayers].forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < 40 || p.x > W - 40) p.vx *= -1;
        if (p.y < 50 || p.y > H - 50) p.vy *= -1;
      });

      // 3. Pas mekanizması
      if (t >= nextWhitePass) {
        whitePasses++;
        passOnsets.push(t);
        const from = ballWhite.to;
        let to = U.int(0, 2);
        while (to === from) to = U.int(0, 2);
        ballWhite.from = from;
        ballWhite.to = to;
        ballWhite.p = 0;
        nextWhitePass = t + U.rand(s.passInterval * 0.75, s.passInterval * 1.25);
      }
      if (t >= nextBlackPass) {
        blackPasses++;
        const from = ballBlack.to;
        let to = U.int(0, 2);
        while (to === from) to = U.int(0, 2);
        ballBlack.from = from;
        ballBlack.to = to;
        ballBlack.p = 0;
        nextBlackPass = t + U.rand(s.passInterval * 0.75, s.passInterval * 1.25);
      }

      // Topların interpolasyonu
      const updateBall = (b, teamList) => {
        b.p = Math.min(1, b.p + dt * 2.2);
        const p1 = teamList[b.from];
        const p2 = teamList[b.to];
        b.x = p1.x + (p2.x - p1.x) * b.p;
        b.y = p1.y + (p2.y - p1.y) * b.p - Math.sin(b.p * Math.PI) * 35; // parabolik pas
      };
      updateBall(ballWhite, whitePlayers);
      updateBall(ballBlack, blackPlayers);

      // Oyuncuları çiz
      blackPlayers.forEach(drawPlayer);
      whitePlayers.forEach(drawPlayer);
      drawBall(ballBlack);
      drawBall(ballWhite);

      // 4. GORİLİN GEÇİŞİ (Sağdan sola)
      if (t >= gStart && t <= gEnd) {
        const prog = (t - gStart) / s.gorillaDurS;
        const gx = (W + 50) - prog * (W + 100);
        const gy = H / 2 + 10;
        const thumping = prog > 0.45 && prog < 0.65;
        drawGorilla(gx, gy, thumping);
      }

      // Skor / Sayaç üst bilgi
      g.fillStyle = 'rgba(15,23,42,0.85)';
      g.fillRect(8, 8, 180, 28);
      g.fillStyle = '#fff';
      g.font = 'bold 13px system-ui';
      g.fillText(`Süre: ${Math.round(t)}/${T} sn`, 16, 26);

      return t >= T;
    });

    ctx.setControls();

    // Soru formu
    const rep = await ctx.form(`
      <fieldset>
        <legend>1. Beyaz tişörtlü takım toplam kaç pas yaptı?</legend>
        <input type="number" name="passes" value="${countedPasses || ''}" placeholder="Tahmini pas sayısı..." required min="0" max="60">
      </fieldset>
      <fieldset style="margin-top:14px">
        <legend>2. Paslaşma devam ederken sahnede sıra dışı veya beklenmedik herhangi bir şey fark ettiniz mi?</legend>
        <label class="opt"><input type="radio" name="unusual" value="no"> Hayır, olağan dışı hiçbir şey görmedim.</label>
        <label class="opt"><input type="radio" name="unusual" value="yes"> Evet, çok tuhaf bir şey oldu!</label>
      </fieldset>
      <fieldset style="margin-top:14px">
        <legend>3. Sahadan yürüyerek geçen ve göğsünü yumruklayan bir <u>GORİL</u> gördünüz mü?</legend>
        <label class="opt"><input type="radio" name="gorilla" value="no"> Kesinlikle görmedim / Goril mi vardı?!</label>
        <label class="opt"><input type="radio" name="gorilla" value="yes"> Evet, goril kostümlü birini açıkça gördüm!</label>
      </fieldset>
    `, {
      submit: 'Sonuçları Değerlendir',
      validate: d => (d.passes !== '' && d.unusual && d.gorilla) ? null : 'Lütfen tüm soruları doldurun.'
    });

    const userCount = parseInt(rep.passes, 10);
    const passDiff = Math.abs(userCount - whitePasses);
    const passAcc = Math.max(0, 1 - (passDiff / Math.max(1, whitePasses)));
    const sawGorilla = (rep.gorilla === 'yes');

    const checks = [
      {
        ok: passDiff <= 3 ? true : 'warn',
        label: `Beyaz Takım Pas Sayımı: Gerçek = ${whitePasses}, Sizin Sayımınız = ${userCount} (Fark: ${passDiff})`,
        detail: passDiff <= 3 
          ? 'Tebrikler, pas sayma görevini başarıyla ve odaklanarak yürüttünüz.' 
          : 'Pas sayımında sapma oldu; ancak asıl önemli olan dikkatin bu göreve verilmiş olmasıdır.'
      },
      {
        ok: true,
        label: `Gorili Fark Etme: ${sawGorilla ? 'EVET (Görüldü)' : 'HAYIR (Körlük Yaşandı)'}`,
        detail: sawGorilla
          ? 'Gorili fark ettiniz! Dikkatiniz odak alanının dışındaki büyük anormallikleri yakalayabildi.'
          : 'Simons & Chabris (1999) katılımcılarının %50\'si gibi siz de gorili kaçırdınız! Bu tamamen normal bir dikkat olgusudur.'
      }
    ];

    const rows = [
      { metrik: 'Gerçek Beyaz Pas Sayısı', değer: whitePasses },
      { metrik: 'Kullanıcının Saydığı Pas', değer: userCount },
      { metrik: 'Pas Sayımı Doğruluğu', değer: U.pct(passAcc) },
      { metrik: 'Sıra Dışı Olay Raporu', değer: rep.unusual === 'yes' ? 'Evet' : 'Hayır' },
      { metrik: 'Goril Görüldü mü?', değer: sawGorilla ? 'Evet' : 'HAYIR (Körlük)' }
    ];

    return {
      summary: [
        { label: 'Goril Görüldü mü?', value: sawGorilla ? 'Evet' : 'Hayır (Körlük)' },
        { label: 'Gerçek Beyaz Pas', value: String(whitePasses) },
        { label: 'Sizin Sayımınız', value: String(userCount) },
        { label: 'Simons & Chabris Ortalaması', value: '%50 Körlük' }
      ],
      checks,
      charts: [
        {
          title: 'Simons & Chabris: Gorili Görme Oranı (%)',
          svg: U.svgBars({
            labels: ['Sizin Testiniz', 'Simons & Chabris (1999)'],
            values: [sawGorilla ? 100 : 0, 50],
            max: 100,
            colors: [sawGorilla ? '#16a34a' : '#ef4444', '#64748b'],
            unit: '%'
          })
        }
      ],
      interpretation: `<p>Simons ve Chabris (1999) deneyi, beynin odaklandığı bilgi akışını (beyaz tişörtlülerin pasları) işlerken, sahnenin ortasında <b>9 saniye boyunca</b> dolaşan devasa bir gorili bile tamamen görmezden gelebileceğini ispatlamıştır.</p>
      <p>Bu testte gorili <b>${sawGorilla ? 'fark ettiniz' : 'fark etmediniz (Dikkatsizlik Körlüğü yaşandı)'}</b>. İnsan dikkat sistemi sınırlı bir kaynak olduğu için, yüksek bilişsel yük altında gözümüzün önündeki en bariz olayları dahi bilince taşımayabilir.</p>`,
      trials: rows
    };
  }
});
})();
