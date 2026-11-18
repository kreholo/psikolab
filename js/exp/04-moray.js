(function () {
'use strict';
const U = Lab.u;

const COMMON_WORDS = [
  'kalem', 'defter', 'kapı', 'pencere', 'çanta', 'masa', 'sandalye', 'bardak', 'kaşık', 'çatal',
  'kitap', 'duvar', 'lamba', 'resim', 'tavan', 'tabak', 'sehpa', 'halı', 'perde', 'dolap',
  'ağaç', 'çiçek', 'bahçe', 'araba', 'sokak', 'deniz', 'güneş', 'yağmur', 'rüzgar', 'bulut'
];

Lab.register({
  id: 'moray', icon: '🍸', short: 'Moray', title: 'Moray (1959) – Kokteyl Partisi Etkisi', group: 'Seçici dikkat',
  tagline: 'Yok sayılan kulaktan kendi adın söylenirse dikkatini çeker mi?',
  about: `<p><b>Neville Moray (1959)</b>, Cherry ve Broadbent'in erken seçim modelini sınadı. Katılımcılar bir kulaktaki mesajı gölgelerken, yok sayılan kulağa 35 kez tekrarlanan kelimeler verilse dahi hatırlanmıyordu.</p>
  <p>Ancak yok sayılan kulağa katılımcının <b>kendi ismi</b> (“Ahmet, şimdi durabilirsin”) veya öznel öneme sahip bir ipucu fısıldandığında katılımcıların yaklaşık <b>üçte biri</b> bunu hemen fark etti. Bu bulgu, süzgecin tamamen kapalı olmadığını ve anlamsal eşiği çok düşük kelimelerin (kendi adımız gibi) süzgeçten geçebildiğini (Treisman zayıflatma modeli) gösterdi.</p>`,
  howto: `<ol>
  <li>Önce kendi adınızı (veya denemek istediğiniz adı) girin.</li>
  <li>Dikkat edeceğiniz akış (sol veya sağ) belirlenir. Ekranda veya sesle o akıştaki hedefleri (büyük harfli kelimeler veya hedef kategori) takip edin.</li>
  <li>Yok sayılan akışı dikkate almayın. Deney bittiğinde yok sayılan tarafta ne duyduğunuz sorulacaktır.</li>
  </ol>`,
  verify: `<ul>
  <li>Gölgeleme / dikkat hedefi isabeti ≥ %60 olmalı (gerçekten ana göreve odaklanıldığının kanıtı).</li>
  <li>Kendi isminizin yok sayılan akışta fark edilip edilmediği kaydedilir ve Moray'in literatür oranı (%33) ile kıyaslanır.</li>
  </ul>`,
  refs: 'Moray, N. (1959). Attention in dichotic listening: Affective cues and the influence of instructions. Q. J. Exp. Psychol., 11(1), 56–60.',
  settings: [
    { group: 'Katılımcı' },
    { key: 'name', label: 'Katılımcı adı', type: 'text', def: 'Ali' },
    { group: 'Akış ve Zamanlama' },
    { key: 'targetSide', label: 'Dikkat edilecek taraf', type: 'select', def: 'left', options: [['left', 'Sol'], ['right', 'Sağ']] },
    { key: 'streamLen', label: 'Akış kelime sayısı', type: 'number', def: 20, min: 10, max: 60, step: 2 },
    { key: 'soa', label: 'Kelime aralığı (SOA)', type: 'number', def: 900, min: 500, max: 2500, step: 50, unit: 'ms' },
    { key: 'stimMs', label: 'Ekranda kalma süresi', type: 'number', def: 600, min: 200, max: 2000, step: 50, unit: 'ms' },
    { key: 'nameAt', label: 'İsmin geçeceği sıra', type: 'number', def: 12, min: 5, max: 50 }
  ],
  testSettings: { streamLen: 12, soa: 150, stimMs: 100, nameAt: 6 },
  unit() {
    return [
      ['Lab.dual yardımcısı yüklü', typeof Lab.dual === 'object'],
      ['Yaygın kelime listesi zengin', COMMON_WORDS.length >= 20]
    ];
  },
  async run(ctx) {
    const s = ctx.s;
    const myName = (s.name || 'Ali').trim();
    const attSide = s.targetSide;
    const unSide = attSide === 'left' ? 'sağ' : 'sol';

    await ctx.message(`<h3>Moray (1959) – Kokteyl Partisi Etkisi</h3>
      <p>Bu testte ekranda iki akış göreceksiniz. Göreviniz <b>${attSide === 'left' ? 'SOL' : 'SAĞ'}</b> tarafa odaklanmak.</p>
      <p>Sol tarafta <u>BÜYÜK HARFLİ</u> bir kelime gördüğünüzde hemen <b>BOŞLUK</b> tuşuna veya aşağıdaki <b>HEDEF!</b> butonuna basın.</p>
      <p>Diğer (${unSide}) tarafı tamamen yok sayın!</p>`, 'Başla');

    const len = s.streamLen;
    const nameIdx = Math.min(s.nameAt - 1, len - 3);

    const pool = U.shuffle(COMMON_WORDS);
    const attended = [];
    const unattended = [];

    let pIdx = 0;
    for (let i = 0; i < len; i++) {
      const isTarget = (i === 3 || i === 8 || i === Math.max(9, len - 4));
      const w1 = pool[pIdx++ % pool.length];
      attended.push({
        text: isTarget ? w1.toUpperCase() : w1,
        target: isTarget,
        color: isTarget ? '#4f46e5' : '#111'
      });

      let w2 = pool[pIdx++ % pool.length];
      if (i === nameIdx) {
        w2 = myName;
      }
      unattended.push({ text: w2 });
    }

    const resStream = await Lab.dual.stream(ctx, {
      attended,
      unattended,
      side: attSide,
      soa: s.soa,
      stimMs: s.stimMs,
      btnLabel: 'HEDEF! (Büyük Harf)',
      hud: `<b>Odak: ${attSide === 'left' ? 'SOL' : 'SAĞ'}</b> (Büyük harf görünce bas)`
    });

    // Soru formu: yok sayılan akışta ne fark ettiniz?
    const q = await ctx.form(`
      <fieldset>
        <legend>Yok sayılan (${unSide}) tarafta dikkatinizi çeken özel bir şey oldu mu?</legend>
        <label class="opt"><input type="radio" name="q1" value="none"> Hayır, sadece sıradan kelimeler akıp gitti.</label>
        <label class="opt"><input type="radio" name="q1" value="name"> Evet! Kendi adımı (${U.esc(myName)}) gördüm.</label>
        <label class="opt"><input type="radio" name="q1" value="foreign"> Yabancı dilde bir kelime gördüm.</label>
        <label class="opt"><input type="radio" name="q1" value="number"> Bir sayı gördüm.</label>
      </fieldset>
      <fieldset style="margin-top:12px">
        <legend>Yok sayılan taraftaki kelimelerden hangisini hatırlıyorsunuz? (Emin değilseniz boş bırakın)</legend>
        <input type="text" name="recalled" placeholder="Hatırladığınız kelime..." autocomplete="off">
      </fieldset>
    `, {
      submit: 'Sonuçları Göster',
      validate: d => d.q1 ? null : 'Lütfen bir seçenek belirleyin.'
    });

    const noticedName = q.q1 === 'name';
    const hitRate = resStream.targets > 0 ? (resStream.hits / resStream.targets) : 1;
    const meanRT = U.mean(resStream.rts);

    const checks = [
      {
        ok: hitRate >= 0.6 ? true : hitRate >= 0.3 ? 'warn' : false,
        label: `Ana Görev İsabeti: ${U.pct(hitRate)} (${resStream.hits}/${resStream.targets})`,
        detail: 'Asıl göreve odaklandığınızı gösterir. En az %60 olmalıdır.'
      },
      {
        ok: resStream.fas <= 3 ? true : 'warn',
        label: `Yanlış Alarm Sayısı: ${resStream.fas}`,
        detail: 'Hedef olmayan kelimelerde butona basılmamalıdır.'
      },
      {
        ok: true,
        label: `Kendi İsminizi Fark Etme: ${noticedName ? 'EVET (Fark edildi)' : 'HAYIR (Fark edilmedi)'}`,
        detail: noticedName 
          ? 'Moray (1959) kokteyl partisi etkisiyle tam uyumlu: Kendi isminiz süzgeci aştı!' 
          : 'Moray deneyinde katılımcıların yaklaşık %67\'si de ismi fark etmemiştir (normal varyasyon).'
      }
    ];

    const rows = attended.map((a, i) => ({
      sıra: i + 1,
      odak_kelime: a.text,
      hedef_mi: a.target ? 1 : 0,
      yok_sayılan_kelime: unattended[i].text,
      ismin_geçtiği_an: i === nameIdx ? 1 : 0
    }));

    return {
      summary: [
        { label: 'Hedef İsabet Oranı', value: U.pct(hitRate) },
        { label: 'Ortalama Tepki Süresi', value: U.ms(meanRT) },
        { label: 'İsim Fark Edildi mi?', value: noticedName ? 'Evet' : 'Hayır' },
        { label: 'Yanlış Alarm', value: String(resStream.fas) }
      ],
      checks,
      charts: [
        {
          title: 'Ana Görev Doğruluk ve İsabet (%)',
          svg: U.svgBars({
            labels: ['Hedef İsabeti', 'İsmi Fark Etme'],
            values: [hitRate * 100, noticedName ? 100 : 0],
            max: 100,
            colors: ['#4f46e5', noticedName ? '#16a34a' : '#ef4444'],
            unit: '%'
          })
        }
      ],
      interpretation: `<p>Moray'in orijinal dikotik dinleme deneyinde katılımcıların <b>%33'ü</b> yok sayılan kanaldaki kendi ismini duymuştur. Bu testte isminizi <b>${noticedName ? 'fark ettiniz' : 'fark etmediniz'}</b>.</p>
      <p>Bu deney, Broadbent'in katı erken süzgeç modelinin aksine, Treisman'ın <i>zayıflatma (attenuation)</i> modelini destekler: Bilinçli dikkat edilmeyen bilgiler tamamen silinmez, zayıflatılır; ancak kendi ismimiz gibi eşiği çok düşük anlamlı sinyaller bilince sızabilir.</p>`,
      trials: rows
    };
  }
});
})();
