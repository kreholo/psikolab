(function () {
'use strict';
const U = Lab.u;

// Gray & Wedderburn (1960) "Dear Aunt Jane" (Sevgili Jane Teyze) üçlüleri
const TRIPLETS = [
  { phrase: ['Sevgili', 'Jane', 'Teyze'], left: ['Sevgili', '7', 'Teyze'], right: ['9', 'Jane', '6'] },
  { phrase: ['Kırmızı', 'Elma', 'Ağacı'], left: ['Kırmızı', '4', 'Ağacı'], right: ['8', 'Elma', '1'] },
  { phrase: ['Büyük', 'Mavi', 'Deniz'], left: ['Büyük', '3', 'Deniz'], right: ['5', 'Mavi', '2'] },
  { phrase: ['Sıcak', 'Çay', 'Bardağı'], left: ['Sıcak', '8', 'Bardağı'], right: ['6', 'Çay', '3'] },
  { phrase: ['Tatlı', 'Küçük', 'Kedi'], left: ['Tatlı', '2', 'Kedi'], right: ['7', 'Küçük', '9'] }
];

Lab.register({
  id: 'auntjane', icon: '👵', short: 'Jane Teyze', title: 'Gray & Wedderburn (1960) – Sevgili Jane Teyze Deneyi', group: 'Seçici dikkat',
  tagline: 'Dikkat kulağa mı kilitlenir, yoksa cümlenin anlamına göre kulak mı atlar?',
  about: `<p><b>Gray ve Wedderburn (1960)</b>, Broadbent'in erken süzgeç teorisini test etmek için katılımcılara iki kanaldan eş zamanlı kelime ve sayılar sundu.</p>
  <p>Odaklanılan sol kulağa: <i>“Sevgili – 7 – Teyze”</i><br>
  Yok sayılan sağ kulağa: <i>“9 – Jane – 6”</i> verildi.</p>
  <p>Broadbent'in modeline göre kişi kulak bazında filtrelediği için <b>“Sevgili 7 Teyze”</b> demeliydi. Oysa katılımcılar neredeyse her zaman anlamı takip ederek <b>“Sevgili Jane Teyze”</b> (sol-sağ-sol) dediler! Bu deney, seçici dikkatin sadece fiziksel konuma değil, <b>anlamsal bağlantıya</b> duyarlı olduğunu kanıtladı.</p>`,
  howto: `<ol>
  <li>Test başlatıldığında sol ve sağ tarafta 3 elemanlık kısa seriler (kelimeler ve sayılar) hızla belirecektir.</li>
  <li>Göreviniz size söylenen tarafa (örn. <b>SOL</b>) odaklanıp oradaki diziyi aklınızda tutmaktır.</li>
  <li>Akış bittiğinde aklınızda kalan 3 elemanı sırasıyla yazın veya seçeneklerden seçin.</li>
  </ol>`,
  verify: `<ul>
  <li>Sadece odaklanan kanal dizisi (“Sevgili 7 Teyze”) mi yoksa anlamsal dizi (“Sevgili Jane Teyze”) mi hatırlandı kontrol edilir.</li>
  <li>Anlamsal sıçrama oranı hesaplanır ve literatür verisiyle karşılaştırılır.</li>
  </ul>`,
  refs: 'Gray, J. A., & Wedderburn, A. A. (1960). Grouping novel bi-sensory presentations. Q. J. Exp. Psychol., 12(3), 180–184.',
  settings: [
    { group: 'Deneme Yapısı' },
    { key: 'trials', label: 'Deneme sayısı', type: 'number', def: 5, min: 2, max: 15 },
    { key: 'soa', label: 'Öğe aralığı (SOA)', type: 'number', def: 800, min: 400, max: 2000, step: 50, unit: 'ms' },
    { key: 'stimMs', label: 'Ekranda kalma süresi', type: 'number', def: 500, min: 200, max: 1500, step: 50, unit: 'ms' },
    { key: 'attendedSide', label: 'Odaklanılacak taraf', type: 'select', def: 'left', options: [['left', 'Sol'], ['right', 'Sağ']] }
  ],
  testSettings: { trials: 3, soa: 120, stimMs: 80 },
  unit() {
    return [
      ['Üçlü veritabanı mevcut', TRIPLETS.length >= 5],
      ['Tüm üçlülerin 3 elemanı var', TRIPLETS.every(t => t.left.length === 3 && t.right.length === 3)]
    ];
  },
  async run(ctx) {
    const s = ctx.s;
    const attSide = s.attendedSide;
    const unSide = attSide === 'left' ? 'right' : 'left';

    await ctx.message(`<h3>Sevgili Jane Teyze Deneyi</h3>
      <p>Lütfen yalnızca <b>${attSide === 'left' ? 'SOL' : 'SAĞ'}</b> taraftaki akışa odaklanın.</p>
      <p>Üç kelime/sayı çifti art arda hızlıca gösterilecek. Bitince sol tarafta ne gördüğünüzü rapor edeceksiniz.</p>`, 'Başla');

    const trialsData = [];
    const n = Math.min(s.trials, TRIPLETS.length);

    for (let t = 0; t < n; t++) {
      const trip = TRIPLETS[t];
      const attSeq = attSide === 'left' ? trip.left : trip.right;
      const unSeq = attSide === 'left' ? trip.right : trip.left;
      const semSeq = [trip.phrase[0], trip.phrase[1], trip.phrase[2]]; // Anlamsal bütün

      ctx.hud(`Deneme ${t + 1} / ${n}`);
      const L = Lab.dual.layout(ctx, { attend: attSide });
      await ctx.sleep(Lab.test ? 30 : 600);

      for (let step = 0; step < 3; step++) {
        if (attSide === 'left') {
          L.setLeft(attSeq[step]);
          L.setRight(unSeq[step]);
        } else {
          L.setLeft(unSeq[step]);
          L.setRight(attSeq[step]);
        }
        await ctx.wait(s.stimMs);
        L.clear();
        await ctx.wait(s.soa - s.stimMs);
      }

      // Rapor formu
      const physOpt = attSeq.join(' ');
      const semOpt = semSeq.join(' ');
      const unOpt = unSeq.join(' ');
      const mixedOpt = [attSeq[0], unSeq[1], unSeq[2]].join(' ');

      const choices = U.shuffle([
        { val: 'physical', label: physOpt },
        { val: 'semantic', label: semOpt },
        { val: 'unattended', label: unOpt },
        { val: 'mixed', label: mixedOpt }
      ]);

      const formHtml = `
        <fieldset>
          <legend>${attSide === 'left' ? 'SOL' : 'SAĞ'} tarafta hangi diziyi gördünüz / aklınızda kaldı?</legend>
          ${choices.map(c => `<label class="opt"><input type="radio" name="resp" value="${c.val}"> <b>${c.label}</b></label>`).join('')}
        </fieldset>
      `;

      const rep = await ctx.form(formHtml, {
        submit: 'Cevabı Onayla',
        validate: d => d.resp ? null : 'Lütfen bir dizi seçin.'
      });

      trialsData.push({
        deneme: t + 1,
        odak_kanalı: attSide,
        fiziksel_dizi: physOpt,
        anlamsal_dizi: semOpt,
        yanıt_tipi: rep.resp,
        anlamsal_sıçrama: rep.resp === 'semantic' ? 1 : 0
      });

      ctx.progress(t + 1, n);
    }

    const nSemantic = trialsData.filter(d => d.yanıt_tipi === 'semantic').length;
    const nPhysical = trialsData.filter(d => d.yanıt_tipi === 'physical').length;
    const semRate = nSemantic / n;

    const checks = [
      {
        ok: true,
        label: `Anlamsal Bütünleme Oranı: ${U.pct(semRate)} (${nSemantic}/${n})`,
        detail: semRate >= 0.5 
          ? 'Gray & Wedderburn (1960) bulgusuyla uyumlu: Zihniniz anlamı takip ederek kanallar arası sıçrama yaptı!'
          : 'Fiziksel kanala sıkı sıkıya bağlı kaldınız (Broadbent erken süzgecine yakın profil).'
      },
      {
        ok: true,
        label: `Fiziksel Kanal Raporu: ${U.pct(nPhysical / n)} (${nPhysical}/${n})`,
        detail: 'Sadece odaklanılan kulaktaki harf/sayı sırası.'
      }
    ];

    return {
      summary: [
        { label: 'Anlamsal Sıçrama Oranı', value: U.pct(semRate) },
        { label: 'Fiziksel Kanal Sadakati', value: U.pct(nPhysical / n) },
        { label: 'Toplam Deneme', value: String(n) }
      ],
      checks,
      charts: [
        {
          title: 'Hatırlanan Dizi Tipi (%)',
          svg: U.svgBars({
            labels: ['Anlamsal (Jane Teyze)', 'Fiziksel (7 Jane)'],
            values: [semRate * 100, (nPhysical / n) * 100],
            max: 100,
            colors: ['#4f46e5', '#f59e0b'],
            unit: '%'
          })
        }
      ],
      interpretation: `<p>Katılımcılar "Sevgili - 7 - Teyze" yerine <b>"Sevgili Jane Teyze"</b> dediğinde, bilincin sadece fiziksel kulak kanalını değil, kelimelerin oluşturduğu <b>anlam ağını</b> otomatik olarak takip ettiği görülür.</p>
      <p>Bu sonuç, bilginin henüz filtrelenmeden önce en azından kısmen anlamsal analizden geçtiğini (Treisman zayıflatma modeli ve Deutsch-Norman geç seçim modeli) kanıtlamaktadır.</p>`,
      trials: trialsData
    };
  }
});
})();
