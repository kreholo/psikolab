(function () {
'use strict';
const U = Lab.u;

Lab.register({
  id: 'car100', icon: '🚗', short: '100 Araba', title: '100 Araba Doğal Sürüş Çalışması (Dingus ve ark., 2006)', group: 'Uygulamalı Dikkat / Sürüş',
  tagline: 'Kaza ve ucuz atlatmaların %80\'inde sürücünün dikkatsiz olduğu gerçeği.',
  about: `<p><b>Virginia Tech Ulaşım Enstitüsü (VTTI)</b> tarafından yapılan ünlü <b>“100-Car Naturalistic Driving Study” (Dingus ve ark., 2006; Klauer ve ark., 2006)</b>, 100 araca kamera ve sensörler yerleştirerek sürücüleri 1 yıldan uzun süre (yaklaşık 3.2 milyon km) doğal ortamlarında kaydetti.</p>
  <p>Araştırmada 69 kaza ve 761 ucuz atlatma (near-crash) kaydedildi. En çarpıcı bulgu: <b>Kazaların %80'inde ve ucuz atlatmaların %65'inde</b> olaydan önceki 3 saniye içinde sürücünün yola bakmadığı (telefonla oynama, bir şeye uzanma vb. ikincil görevler yaptığı) saptandı. Yoldan 2 saniyeden uzun süre gözünü ayırmak kaza riskini iki katından fazla artırmaktaydı.</p>`,
  howto: `<ol>
  <li>Aracınızı şeritte tutun (Klavyede <kbd>◀</kbd> / <kbd>▶</kbd> veya ekrandaki butonlar).</li>
  <li>Öndeki araç aniden yavaşladığında hemen <b>FREN</b> butonuna veya <kbd>BOŞLUK</kbd> tuşuna basın.</li>
  <li>Sürüş sırasında ekranda zaman zaman <b>mesaj / bildirim</b> çıkacaktır. Bildirimdeki soruyu yanıtlarken gözünüzü yoldan ayırmış olacaksınız.</li>
  <li>Olay anlarındaki dikkatsizlik durumu analiz edilecektir.</li>
  </ol>`,
  verify: `<ul>
  <li>Kaza veya ucuz atlatma anlarından önceki 3 saniyede ikincil görevle meşguliyet oranı hesaplanır.</li>
  <li>Doğal Sürüş Çalışmasının %80 dikkatsizlik oranı ile kıyaslama yapılır.</li>
  </ul>`,
  refs: 'Dingus, T. A., et al. (2006). The 100-car naturalistic driving study: Phase II - results of the 100-car field experiment. NHTSA Technical Report. · Klauer, S. G., et al. (2006). The impact of driver inattention on near-crash/crash risk.',
  settings: [
    { group: 'Simülasyon Süresi' },
    { key: 'durationS', label: 'Sürüş süresi', type: 'number', def: 45, min: 20, max: 180, step: 5, unit: 'sn' },
    { group: 'Olay Sıklığı' },
    { key: 'distractInterval', label: 'Bildirim (mesaj) aralığı', type: 'number', def: 12, min: 6, max: 30, unit: 'sn' },
    { key: 'leadInterval', label: 'Öndeki aracın frenleme aralığı', type: 'number', def: 9, min: 5, max: 25, unit: 'sn' },
    { key: 'nearTTC', label: 'Ucuz atlatma TTC eşiği', type: 'number', def: 2.0, min: 1.0, max: 3.5, step: 0.1, unit: 'sn' }
  ],
  testSettings: { durationS: 8, distractInterval: 4, leadInterval: 3 },
  unit() {
    return [
      ['Lab.drive motoru mevcut', typeof Lab.drive === 'object' && typeof Lab.drive.run === 'function']
    ];
  },
  async run(ctx) {
    const s = ctx.s;

    await ctx.message(`<h3>100 Araba Doğal Sürüş Çalışması</h3>
      <p>Gerçekçi bir sürüş ortamında hem şeridinizi koruyacak hem de aniden fren yapan öndeki araca dikkat edeceksiniz.</p>
      <p>Direksiyon: <b>◀ / ▶</b> tuşları veya butonlar.<br>
      Fren: <b>BOŞLUK</b> tuşu veya kırmızı FREN butonu.</p>
      <p>Araya giren mesaj bildirimlerini de hızlıca yanıtlamaya çalışın.</p>`, 'Sürüşe Başla');

    const result = await Lab.drive.run(ctx, {
      durationS: s.durationS,
      trackAmp: 1.0,
      lead: {
        on: true,
        meanIntervalS: s.leadInterval
      },
      distract: {
        on: true,
        meanIntervalS: s.distractInterval,
        maxMs: 5000
      },
      nearCrashTTC: s.nearTTC,
      hud: t => `Sürüş: ${Math.round(t)}/${s.durationS} sn · Öndeki araca dikkat edin`
    });

    const leads = result.leads || [];
    const criticalEvents = leads.filter(l => l.result === 'Çarpışma' || l.result === 'Ucuz atlatma');
    const nCrit = criticalEvents.length;
    const nDistCrit = criticalEvents.filter(l => l.distracted).length;
    const critDistPct = nCrit > 0 ? (nDistCrit / nCrit) : 0;

    const allDistPct = leads.length > 0 ? (leads.filter(l => l.distracted).length / leads.length) : 0;

    const checks = [
      {
        ok: leads.length >= 2 ? true : 'warn',
        label: `Toplam Kritik Olay (Öndeki Aracın Ani Freni): ${leads.length}`,
        detail: 'Simülasyon boyunca öndeki araç yeterli sayıda ani fren yaptı.'
      },
      {
        ok: true,
        label: `Kaza/Ucuz Atlatmalarda Dikkatsizlik Oranı: ${U.pct(critDistPct)} (${nDistCrit}/${nCrit})`,
        detail: critDistPct >= 0.5 
          ? '100 Araba Çalışması bulgusuyla uyumlu: Kritik olayların çoğunda gözünüz ekrandaki ikincil görevdeydi!'
          : 'Gözünüzü yoldan ayırmamaya özen gösterdiniz.'
      },
      {
        ok: result.crashes === 0 ? true : 'warn',
        label: `Çarpışma (Kaza) Sayısı: ${result.crashes}`,
        detail: result.crashes > 0 ? 'Fren tepkisi gecikti ve çarpışma gerçekleşti.' : 'Tüm olaylar frenle kontrol altına alındı.'
      }
    ];

    const rows = leads.map(l => ({
      olay_no: l.id,
      sonuç: l.result,
      minimum_ttc_sn: isFinite(l.minTTC) ? U.fmt(l.minTTC, 2) : '–',
      fren_rt_sn: l.rt != null ? U.fmt(l.rt, 2) : 'Fren yapılmadı',
      olay_öncesi_dikkatsiz_miydi: l.distracted ? 'Evet (Mesajdaydı)' : 'Hayır (Yoldaydı)'
    }));

    return {
      summary: [
        { label: 'Kritik Olaylar', value: String(nCrit) },
        { label: 'Kaza Öncesi Dikkatsizlik', value: U.pct(critDistPct), hint: '100 Araba çalışmasında %80' },
        { label: 'Toplam Çarpışma', value: String(result.crashes) },
        { label: 'Ortalama Şerit Hatası', value: U.fmt(result.trackMAE, 1) + ' px' }
      ],
      checks,
      charts: [
        {
          title: 'Kritik Olaylarda Sürücü Durumu (%)',
          svg: U.svgBars({
            labels: ['Dikkati Dağınık', 'Yola Odaklı'],
            values: [critDistPct * 100, (1 - critDistPct) * 100],
            max: 100,
            colors: ['#ef4444', '#16a34a'],
            unit: '%'
          })
        }
      ],
      interpretation: `<p>Dingus ve ark. (2006) <b>100 Araba Doğal Sürüş Çalışması</b>, kaza ve ucuz atlatmaların <b>%80'inde</b> olaydan hemen önce sürücünün cep telefonu, navigasyon veya başka bir ikincil görevle meşgul olduğunu göstermiştir.</p>
      <p>Bu simülasyonda kritik anlarda dikkatsizlik oranınız <b>${U.pct(critDistPct)}</b> olarak ölçüldü. Kısa bir an bile yoldan ayrılmak, fren yapma süresini ve kaza ihtimalini katlar.</p>`,
      trials: rows
    };
  }
});
})();
