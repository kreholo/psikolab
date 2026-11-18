(function () {
'use strict';
const U = Lab.u;

const SENTENCES = [
  {
    attended: 'Dün kıyıdaki banka doğru taş atıyorlardı.',
    ambig: 'bank',
    biasA: { word: 'nehir', interp: 'Nehir kıyısına doğru taş atıyorlardı.' },
    biasB: { word: 'para', interp: 'Finansal banka binasına doğru taş atıyorlardı.' }
  },
  {
    attended: 'Çocuklar bahçedeki yüzü dikkatle izlediler.',
    ambig: 'yüz',
    biasA: { word: 'çehre', interp: 'Çocuklar bahçedeki kişinin simasını izlediler.' },
    biasB: { word: 'rakam', interp: 'Çocuklar bahçedeki yüz (100) sayısını izlediler.' }
  },
  {
    attended: 'Akşam vakti derin bir çay geçti aklından.',
    ambig: 'çay',
    biasA: { word: 'dere', interp: 'Akşam vakti suyun aktığı derin bir akarsu düşündü.' },
    biasB: { word: 'içecek', interp: 'Akşam vakti demlenmiş sıcak bir içecek düşündü.' }
  },
  {
    attended: 'Genç adam masanın üzerindeki pası hızla sildi.',
    ambig: 'pas',
    biasA: { word: 'demir', interp: 'Genç adam masadaki metal korozyonunu sildi.' },
    biasB: { word: 'top', interp: 'Genç adam spor maçındaki hatalı vuruşu unuttu.' }
  },
  {
    attended: 'Bahçıvan büyük bir bağ gördüğünü söyledi.',
    ambig: 'bağ',
    biasA: { word: 'üzüm', interp: 'Bahçıvan geniş bir meyve bahçesi gördüğünü söyledi.' },
    biasB: { word: 'ip', interp: 'Bahçıvan eşyaları bağlayan kalın bir düğüm/ip gördü.' }
  },
  {
    attended: 'Dün akşam köydeki ocak söndü.',
    ambig: 'ocak',
    biasA: { word: 'ateş', interp: 'Dün akşam evin şöminesindeki ateş söndü.' },
    biasB: { word: 'maden', interp: 'Dün akşam taş kömürü çıkarılan işletme kapandı.' }
  }
];

Lab.register({
  id: 'mackay', icon: '🪨', short: 'MacKay "Taş"', title: 'MacKay (1973) – "Taş" ve Çift Anlam Deneyi', group: 'Geç seçim / Bilinçdışı anlamsal işleme',
  tagline: 'Farkında olmadığın kelime, duyduğun cümlenin anlamını değiştirebilir mi?',
  about: `<p><b>MacKay (1973)</b>, dikkatin <i>geç seçim (late selection)</i> modelini destekleyen ünlü bir deney yaptı.</p>
  <p>Katılımcılar bir kulakta çift anlamlı bir cümle dinlediler:<br>
  <i>“Dün kıyıdaki banka (bank) doğru taş atıyorlardı.”</i> (Bank hem nehir kıyısı hem para kurumu anlamına gelir).</p>
  <p>Yok sayılan diğer kulakta ise aynı anda ya <b>“nehir”</b> ya da <b>“para”</b> kelimesi fısıldandı. Katılımcılar bu kelimeyi duyduklarının bilincinde olmasalar bile, cümlenin anlamı sorulduğunda yok sayılan kelimenin ima ettiği yönde anlam seçtiler! Bu, anlamsal işlemenin dikkat süzgecinden <u>önce</u> gerçekleştiğini gösterir.</p>`,
  howto: `<ol>
  <li>Ekranda iki taraflı kelime akışı başlayacak. Size belirtilen taraftaki (örneğin SOL) <b>tam cümleyi</b> okuyup anlamaya odaklanın.</li>
  <li>Sağ taraftaki kelimeleri görmezden gelin.</li>
  <li>Cümle tamamlandıktan sonra, okuduğunuz cümlenin anlamına en yakın seçeneği işaretleyin.</li>
  <li>Ardından diğer tarafta ne kelime geçtiğini hatırlayıp hatırlamadığınız sorulacaktır.</li>
  </ol>`,
  verify: `<ul>
  <li>Yok sayılan kanaldaki yönlendirici kelimenin (örn. nehir vs para), cümle yorumu seçimini etkileyip etkilemediği test edilir.</li>
  <li>Katılımcının yok sayılan kelimeyi bilinçli olarak hatırlama oranı kontrol edilir (beklenen: düşük bilinçli hatırlama, yüksek bilinçdışı etki).</li>
  </ul>`,
  refs: 'MacKay, D. G. (1973). Aspects of the theory of comprehension, memory and attention. Q. J. Exp. Psychol., 25(1), 22–40.',
  settings: [
    { group: 'Deneme Ayarları' },
    { key: 'trials', label: 'Cümle sayısı', type: 'number', def: 6, min: 2, max: 12 },
    { key: 'wordMs', label: 'Kelime gösterim süresi', type: 'number', def: 450, min: 200, max: 1500, step: 50, unit: 'ms' },
    { key: 'soa', label: 'Kelime aralığı (SOA)', type: 'number', def: 600, min: 250, max: 2000, step: 50, unit: 'ms' },
    { key: 'attSide', label: 'Cümle tarafı (odak)', type: 'select', def: 'left', options: [['left', 'Sol'], ['right', 'Sağ']] }
  ],
  testSettings: { trials: 3, wordMs: 60, soa: 90 },
  unit() {
    return [
      ['Cümle veri tabanı yeterli', SENTENCES.length >= 5],
      ['Her cümlenin A ve B önyargı kelimeleri tanımlı', SENTENCES.every(s => s.biasA.word && s.biasB.word)]
    ];
  },
  async run(ctx) {
    const s = ctx.s;
    const attSide = s.attSide;
    const unSide = attSide === 'left' ? 'right' : 'left';

    await ctx.message(`<h3>MacKay (1973) "Taş" Deneyi</h3>
      <p>Lütfen yalnızca <b>${attSide === 'left' ? 'SOL' : 'SAĞ'}</b> tarafta belirecek cümleye odaklanın.</p>
      <p>Diğer tarafta beliren kelimeleri yok sayın. Cümle bitince cümlenin anlamına dair bir soru sorulacaktır.</p>`, 'Başla');

    const trialsData = [];
    const n = Math.min(s.trials, SENTENCES.length);
    const pool = U.shuffle(SENTENCES).slice(0, n);

    for (let i = 0; i < n; i++) {
      const item = pool[i];
      const useBiasA = (i % 2 === 0);
      const biasObj = useBiasA ? item.biasA : item.biasB;
      const otherObj = useBiasA ? item.biasB : item.biasA;

      const words = item.attended.split(' ');
      const ambigIdx = words.findIndex(w => w.includes(item.ambig));

      ctx.hud(`Cümle ${i + 1} / ${n}`);
      const L = Lab.dual.layout(ctx, { attend: attSide });
      await ctx.sleep(Lab.test ? 30 : 500);

      for (let w = 0; w < words.length; w++) {
        const isAmbig = (w === ambigIdx);
        const unWord = isAmbig ? biasObj.word : '...';

        if (attSide === 'left') {
          L.setLeft(words[w]);
          L.setRight(unWord);
        } else {
          L.setLeft(unWord);
          L.setRight(words[w]);
        }

        await ctx.wait(s.wordMs);
        L.clear();
        await ctx.wait(s.soa - s.wordMs);
      }

      // Anlam sorusu
      const options = U.shuffle([
        { val: 'bias', label: biasObj.interp },
        { val: 'other', label: otherObj.interp }
      ]);

      const formHtml = `
        <fieldset>
          <legend>Az önce okuduğunuz cümlenin anlamına en yakın ifade hangisidir?</legend>
          ${options.map(o => `<label class="opt"><input type="radio" name="interp" value="${o.val}"> ${o.label}</label>`).join('')}
        </fieldset>
        <fieldset style="margin-top:12px">
          <legend>Cümle akarken yok sayılan diğer tarafta aşağıdaki kelimelerden hangisini gördünüz?</legend>
          <label class="opt"><input type="radio" name="aware" value="bias"> ${biasObj.word}</label>
          <label class="opt"><input type="radio" name="aware" value="other"> ${otherObj.word}</label>
          <label class="opt"><input type="radio" name="aware" value="none"> Hiçbirini fark etmedim / sadece nokta/çizgi gördüm</label>
        </fieldset>
      `;

      const rep = await ctx.form(formHtml, {
        submit: 'Yanıtla',
        validate: d => (d.interp && d.aware) ? null : 'Lütfen iki soruyu da yanıtlayın.'
      });

      trialsData.push({
        deneme: i + 1,
        cümle: item.attended,
        sunulan_ipucu: biasObj.word,
        seçilen_yorum: rep.interp === 'bias' ? 'İpucuyla uyumlu' : 'Diğer anlam',
        ipucu_fark_edildi_mi: rep.aware === 'bias' ? 'Evet' : 'Hayır',
        uyumlu_seçim: rep.interp === 'bias' ? 1 : 0,
        bilinçli_farkındalık: rep.aware === 'bias' ? 1 : 0
      });

      ctx.progress(i + 1, n);
    }

    const nBias = trialsData.filter(d => d.uyumlu_seçim === 1).length;
    const biasRate = nBias / n;
    const nAware = trialsData.filter(d => d.bilinçli_farkındalık === 1).length;
    const awareRate = nAware / n;

    const checks = [
      {
        ok: true,
        label: `Yok Sayılan İpucuyla Uyumlu Yorum: ${U.pct(biasRate)} (${nBias}/${n})`,
        detail: biasRate > 0.5 
          ? 'MacKay (1973) etkisi gözlendi: Farkında olunmayan kelime, cümlenin kavranışını yönlendirdi!'
          : 'İpucu yönlendirmesi şans düzeyinde (%50 civarı) kaldı.'
      },
      {
        ok: true,
        label: `Yok Sayılan Kelimenin Bilinçli Hatırlanması: ${U.pct(awareRate)} (${nAware}/${n})`,
        detail: awareRate <= 0.33
          ? 'Beklendiği gibi bilinçli hatırlama çok düşük (etkinin örtük/bilinçdışı niteliği).'
          : 'Yok sayılan kelimeler kısmen bilince ulaştı.'
      }
    ];

    return {
      summary: [
        { label: 'İpucuyla Uyumlu Yorumlama', value: U.pct(biasRate) },
        { label: 'Bilinçli Hatırlama Oranı', value: U.pct(awareRate) },
        { label: 'Toplam Cümle', value: String(n) }
      ],
      checks,
      charts: [
        {
          title: 'MacKay Etkisi: Yorumlama Tercihi (%)',
          svg: U.svgBars({
            labels: ['İpucuyla Uyumlu', 'Alternatif Anlam'],
            values: [biasRate * 100, (1 - biasRate) * 100],
            max: 100,
            colors: ['#4f46e5', '#64748b'],
            unit: '%'
          })
        }
      ],
      interpretation: `<p>MacKay (1973) deneyinde katılımcılar diğer kulaktaki <i>"nehir"</i> ya da <i>"para"</i> kelimesini duyduklarını rapor etmeseler bile, cümleyi yorumlarken bu kelimelerin anlam doğrultusunda karar verdiler.</p>
      <p>Bu bulgu, anlamsal analizin dikkat seçiminden önce yapıldığını savunan <b>Geç Seçim (Late Selection)</b> modellerinin (örn. Deutsch & Deutsch) en temel kanıtlarından biridir.</p>`,
      trials: trialsData
    };
  }
});
})();
