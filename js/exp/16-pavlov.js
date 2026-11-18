(function () {
'use strict';
const U = Lab.u;

Lab.register({
  id: 'pavlov', icon: '🐕', short: 'Pavlov Koşullanma', title: 'Ivan Pavlov (1927) – Klasik Koşullanma Laboratuvarı', group: 'Öğrenme ve Koşullanma',
  tagline: 'Zil, et tozu ve salya: Bir refleks sıfırdan nasıl inşa edilir ve nasıl söner?',
  about: `<p><b>Ivan Pavlov (1927)</b>, sindirim fizyolojisi üzerine çalışırken köpeklerin henüz yemek verilmeden önce bakıcının ayak sesini veya zil sesini duyduklarında da salya salgıladıklarını fark etti.</p>
  <p>Temel kavramlar:
  <ul>
    <li><b>Koşulsuz Uyaran (US - Et):</b> Öğrenilmemiş, doğal olarak salya refleksini (UR) başlatan et tozu.</li>
    <li><b>Koşullu Uyaran (CS - Zil):</b> Başlangıçta nötr olan, ancak etle art arda eşleştirildikten sonra tek başına salya (CR) üreten zil sesi.</li>
    <li><b>Sönme (Extinction):</b> Zil sesi defalarca et verilmeden tek başına çalındığında salya tepkisinin zayıflayıp kaybolması.</li>
    <li><b>Kendiliğinden Geri Gelme (Spontaneous Recovery):</b> Sönmüş bir reflekse dinlenme molası verildiğinde, ilk zil sesinde salyanın aniden kısmen yeniden belirmesi.</li>
  </ul></p>`,
  howto: `<ol>
  <li>Laboratuvarda 3 aşamalı bir çalışma yürüteceksiniz: <b>1. Edinme (Acquisition)</b>, <b>2. Sönme (Extinction)</b> ve <b>3. Kendiliğinden Geri Gelme</b>.</li>
  <li>Ayarlardan deneme sayılarını ve zil-et aralığını belirleyebilirsiniz.</li>
  <li>Zil çaldığında gerçek ses üretilecek ve köpeğin tükürük tüpündeki salya damlaları mililitre cinsinden ölçülecektir.</li>
  </ol>`,
  verify: `<ul>
  <li>Edinme aşamasında zil sesine verilen salyanın kademeli olarak artıp artmadığı denetlenir.</li>
  <li>Sönme aşamasında salyanın sıfıra yaklaşıp yaklaşmadığı kontrol edilir.</li>
  <li>Dinlenme sonrası kendiliğinden geri gelme tepkisi ölçülür.</li>
  </ul>`,
  refs: 'Pavlov, I. P. (1927). Conditioned Reflexes: An Investigation of the Physiological Activity of the Cerebral Cortex. Oxford University Press.',
  settings: [
    { group: 'Deneme Sayıları' },
    { key: 'acqTrials', label: 'Edinme (Zil + Et) deneme sayısı', type: 'number', def: 8, min: 4, max: 20 },
    { key: 'extTrials', label: 'Sönme (Yalnız Zil) deneme sayısı', type: 'number', def: 6, min: 3, max: 15 },
    { key: 'csUsDelayMs', label: 'Zil ile Et arası süre', type: 'number', def: 1200, min: 300, max: 4000, step: 100, unit: 'ms' },
    { key: 'trialDelayMs', label: 'Denemeler arası bekleme', type: 'number', def: 800, min: 100, max: 3000, step: 100, unit: 'ms' }
  ],
  testSettings: { acqTrials: 4, extTrials: 3, csUsDelayMs: 40, trialDelayMs: 20 },
  unit() {
    return [
      ['Lab.tone mevcut', typeof Lab.tone === 'function']
    ];
  },
  async run(ctx) {
    const s = ctx.s;
    const W = 520, H = 340;
    const C = ctx.canvas(W, H, { maxWidth: 540 });
    const g = C.g;

    await ctx.message(`<h3>Pavlov (1927) Klasik Koşullanma</h3>
      <p>Deney üç aşamadan oluşacaktır:</p>
      <p>1. <b>Edinme (Zil + Et):</b> Zil çalınır ve ardından et tozu verilir.<br>
      2. <b>Sönme (Zil Tek Başına):</b> Zil çalınır fakat et verilmez.<br>
      3. <b>Kendiliğinden Geri Gelme:</b> Dinlenmenin ardından zil tekrar çalınır.</p>`, 'Laboratuvarı Başlat');

    let associativeStrength = 0.0; // 0.0 ile 1.0 arası öğrenme gücü
    const learningRate = 0.35;
    const extinctionRate = 0.40;

    const trialsData = [];

    const drawDogLab = (bellActive, meatActive, drops, stageName, trialNum) => {
      // Laboratuvar odası
      g.fillStyle = '#f8fafc'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#64748b'; g.fillRect(0, H * 0.72, W, H * 0.28); // Zemin

      // Masa / Stand
      g.fillStyle = '#94a3b8'; g.fillRect(60, H * 0.55, 300, H * 0.2);

      // KÖPEK ÇİZİMİ
      const dx = 200, dy = H * 0.42;
      // Gövde
      g.fillStyle = '#d97706';
      g.beginPath();
      g.roundRect ? g.roundRect(dx - 60, dy, 120, 70, 16) : g.rect(dx - 60, dy, 120, 70);
      g.fill();
      // Kafa
      g.beginPath();
      g.arc(dx + 70, dy + 10, 32, 0, Math.PI * 2);
      g.fill();
      // Burun / Ağız
      g.fillStyle = '#b45309';
      g.beginPath();
      g.roundRect ? g.roundRect(dx + 85, dy + 15, 38, 22, 8) : g.rect(dx + 85, dy + 15, 38, 22);
      g.fill();
      // Burun ucu
      g.fillStyle = '#1e293b';
      g.beginPath(); g.arc(dx + 120, dy + 22, 6, 0, Math.PI * 2); g.fill();
      // Kulak
      g.fillStyle = '#92400e';
      g.beginPath(); g.ellipse(dx + 55, dy - 6, 12, 26, -0.2, 0, Math.PI * 2); g.fill();
      // Göz
      g.fillStyle = '#0f172a';
      g.beginPath(); g.arc(dx + 82, dy + 2, 4, 0, Math.PI * 2); g.fill();

      // SALYA TÜPÜ VE DERECELİ KAP
      g.strokeStyle = '#0284c7'; g.lineWidth = 4;
      g.beginPath();
      g.moveTo(dx + 100, dy + 37);
      g.lineTo(dx + 100, dy + 70);
      g.lineTo(dx + 160, dy + 70);
      g.lineTo(dx + 160, dy + 110);
      g.stroke();

      // Dereceli Tüp
      g.fillStyle = 'rgba(255,255,255,0.8)';
      g.fillRect(dx + 145, dy + 105, 30, 60);
      g.strokeStyle = '#475569'; g.lineWidth = 2;
      g.strokeRect(dx + 145, dy + 105, 30, 60);

      // Salya Seviyesi
      const salH = Math.min(56, drops * 2.8);
      g.fillStyle = '#38bdf8';
      g.fillRect(dx + 146, dy + 165 - salH, 28, salH);

      // ZİL (CS)
      g.fillStyle = bellActive ? '#eab308' : '#94a3b8';
      g.beginPath();
      g.arc(80, 70, 24, Math.PI, Math.PI * 2);
      g.fill();
      g.fillRect(68, 68, 24, 10);
      if (bellActive) {
        g.strokeStyle = '#f59e0b'; g.lineWidth = 3;
        g.beginPath(); g.arc(80, 70, 36, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
        g.beginPath(); g.arc(80, 70, 48, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
      }

      // ET KASESİ (US)
      g.fillStyle = '#cbd5e1';
      g.beginPath(); g.ellipse(dx + 110, H * 0.72, 34, 12, 0, 0, Math.PI * 2); g.fill();
      if (meatActive) {
        g.fillStyle = '#dc2626';
        g.beginPath(); g.arc(dx + 110, H * 0.71, 14, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#ef4444';
        g.font = 'bold 12px system-ui';
        g.fillText('ET TOZU', dx + 88, H * 0.64);
      }

      // Üst Bilgi
      g.fillStyle = 'rgba(15,23,42,0.9)';
      g.fillRect(8, 8, W - 16, 32);
      g.fillStyle = '#fff';
      g.font = 'bold 14px system-ui';
      g.textAlign = 'left';
      g.fillText(`${stageName} · Deneme ${trialNum} | Salya: ${drops} Damla (${(drops * 0.05).toFixed(2)} ml)`, 18, 30);
    };

    // 1. AŞAMA: EDİNME (Zil + Et)
    for (let t = 0; t < s.acqTrials; t++) {
      ctx.hud(`1. Aşama (Edinme): Deneme ${t + 1} / ${s.acqTrials}`);

      // Zil çalınır (CS)
      Lab.tone(880, 0.4, 0.3);
      drawDogLab(true, false, Math.round(associativeStrength * 16), 'Aşama 1: Edinme (Zil + Et)', t + 1);
      await ctx.wait(s.csUsDelayMs);

      // Et sunulur (US) -> Refleks salya
      associativeStrength += learningRate * (1.0 - associativeStrength);
      const salivaDrops = Math.round(4 + associativeStrength * 16);

      drawDogLab(true, true, salivaDrops, 'Aşama 1: Edinme (Zil + Et)', t + 1);
      await ctx.wait(Lab.test ? 30 : 600);

      trialsData.push({
        aşama: '1. Edinme',
        deneme: t + 1,
        uyaran: 'Zil (CS) + Et (US)',
        salya_damla: salivaDrops,
        öğrenme_gücü: U.fmt(associativeStrength, 2)
      });

      drawDogLab(false, false, 0, 'Aşama 1: Edinme', t + 1);
      await ctx.wait(s.trialDelayMs);
      ctx.progress(t + 1, s.acqTrials + s.extTrials + 2);
    }

    await ctx.message(`<h3>1. Aşama (Edinme) Tamamlandı!</h3>
      <p>Köpek artık zil sesi ile et tozu arasında güçlü bir bağ kurdu.</p>
      <p>Şimdi <b>2. Aşama: Sönme (Extinction)</b> başlıyor. Bu aşamada zil çalınacak fakat <u>hiç et tozu verilmeyecektir</u>.</p>`, 'Sönme Aşamasına Geç');

    // 2. AŞAMA: SÖNME (Yalnız Zil)
    for (let t = 0; t < s.extTrials; t++) {
      ctx.hud(`2. Aşama (Sönme): Deneme ${t + 1} / ${s.extTrials}`);

      Lab.tone(880, 0.4, 0.3);
      const salivaDrops = Math.round(associativeStrength * 18);
      // Sönme zayıflaması
      associativeStrength -= extinctionRate * associativeStrength;

      drawDogLab(true, false, salivaDrops, 'Aşama 2: Sönme (Yalnız Zil)', t + 1);
      await ctx.wait(s.csUsDelayMs);

      trialsData.push({
        aşama: '2. Sönme',
        deneme: t + 1,
        uyaran: 'Yalnız Zil (CS alone)',
        salya_damla: salivaDrops,
        öğrenme_gücü: U.fmt(associativeStrength, 2)
      });

      drawDogLab(false, false, 0, 'Aşama 2: Sönme', t + 1);
      await ctx.wait(s.trialDelayMs);
      ctx.progress(s.acqTrials + t + 1, s.acqTrials + s.extTrials + 2);
    }

    await ctx.message(`<h3>2. Aşama (Sönme) Bitti!</h3>
      <p>Tepki neredeyse tamamen sıfırlandı.</p>
      <p>Şimdi köpeğe bir süre <b>dinlenme molası</b> vereceğiz. Bakalım dinlenmeden sonra zil tekrar çaldığında ne olacak? (<b>Kendiliğinden Geri Gelme</b>)</p>`, 'Molayı Başlat');

    // Mola animasyonu
    ctx.hud('Köpek dinleniyor...');
    g.fillStyle = '#f8fafc'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#475569'; g.font = '24px system-ui'; g.textAlign = 'center';
    g.fillText('💤 Dinlenme Molası (24 Saat Geçti)...', W / 2, H / 2);
    await ctx.sleep(Lab.test ? 50 : 1500);

    // 3. AŞAMA: KENDİLİĞİNDEN GERİ GELME (Spontaneous Recovery)
    // Sönmüş bağ, dinlenme sonrası kendiliğinden %40-50 geri döner
    associativeStrength = 0.45;
    const recDrops = Math.round(associativeStrength * 18);

    Lab.tone(880, 0.5, 0.3);
    drawDogLab(true, false, recDrops, 'Aşama 3: Kendiliğinden Geri Gelme', 1);
    await ctx.wait(s.csUsDelayMs + 400);

    trialsData.push({
      aşama: '3. Geri Gelme',
      deneme: 1,
      uyaran: 'Yalnız Zil (Dinlenme Sonrası)',
      salya_damla: recDrops,
      öğrenme_gücü: U.fmt(associativeStrength, 2)
    });
    ctx.progress(s.acqTrials + s.extTrials + 2, s.acqTrials + s.extTrials + 2);

    // Analiz
    const acqSaliva = trialsData.filter(d => d.aşama === '1. Edinme').map(d => d.salya_damla);
    const extSaliva = trialsData.filter(d => d.aşama === '2. Sönme').map(d => d.salya_damla);

    const checks = [
      {
        ok: acqSaliva[acqSaliva.length - 1] > acqSaliva[0] ? true : 'warn',
        label: `Koşullu Tepki İnşası (Edinme): ${acqSaliva[0]} → ${acqSaliva[acqSaliva.length - 1]} damla`,
        detail: 'Zil ile et eşleştirildikçe salya miktarı kademeli olarak arttı.'
      },
      {
        ok: extSaliva[extSaliva.length - 1] < extSaliva[0] ? true : 'warn',
        label: `Sönme (Extinction): ${extSaliva[0]} → ${extSaliva[extSaliva.length - 1]} damla`,
        detail: 'Et verilmeyince zilin tetiklediği refleks zayıfladı ve söndü.'
      },
      {
        ok: recDrops > extSaliva[extSaliva.length - 1] ? true : 'warn',
        label: `Kendiliğinden Geri Gelme (Spontaneous Recovery): ${recDrops} damla`,
        detail: 'Mola sonrası zil çaldığında sönmüş olan refleks kendiliğinden kısmen geri döndü!'
      }
    ];

    const allPts = trialsData.map((d, i) => [i + 1, d.salya_damla]);

    return {
      summary: [
        { label: 'Zirve Salya (Edinme)', value: `${Math.max(...acqSaliva)} damla` },
        { label: 'Sönme Sonu Salya', value: `${extSaliva[extSaliva.length - 1]} damla` },
        { label: 'Geri Gelen Salya', value: `${recDrops} damla` },
        { label: 'Toplam Deneme', value: String(trialsData.length) }
      ],
      checks,
      charts: [
        {
          title: 'Pavlov Öğrenme, Sönme ve Geri Gelme Eğrisi (Damla Sayısı)',
          svg: U.svgLine({
            series: [{ name: 'Salya Miktarı', pts: allPts, color: '#0284c7' }],
            ymin: 0,
            ymax: 22,
            xlabel: 'Deneme Sırası',
            ylabel: 'Salya (Damla)'
          })
        }
      ],
      interpretation: `<p>Pavlov (1927), klasik koşullanma yoluyla nötr bir uyaranın (zil) doğal bir biyolojik refleksin (salya) tetikleyicisi haline gelebileceğini ispatladı.</p>
      <p>Daha da önemlisi, sönme sürecinin öğrenmenin "silinmesi" değil, <b>bastırılması (inhibisyon)</b> olduğunu gösterdi. Nitekim denemenin 3. aşamasında görüldüğü gibi, dinlenme molasından sonra refleks kendiliğinden (<b>Spontaneous Recovery</b>) kısmen geri dönmüştür.</p>`,
      trials: trialsData
    };
  }
});
})();
