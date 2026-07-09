import Header from '../components/Header.jsx'
import BottomNav from '../components/BottomNav.jsx'

const POINT_ROWS = [
  { round: 'Quarter Final', base: '+15', multiplier: '— (ronde pertama)' },
  { round: 'Semi Final', base: '+20', multiplier: 'x2 = +40 jika QF perfect' },
  { round: 'Final', base: '+30', multiplier: 'x3 = +90 jika SF perfect' },
]

export default function Rules() {
  return (
    <div className="pb-24">
      <Header title="Rules" subtitle="Baca sebelum mulai prediksi" />

      <div className="px-6 pt-4">
        <div className="bg-white rounded-xl2 border border-kaluli-navy/10 shadow-sm p-4 mb-5">
          <p className="text-xs font-extrabold uppercase tracking-wide text-kaluli-red mb-2">
            Game berlaku mulai Quarter Final (8 Besar) sampai Final
          </p>
          <p className="text-sm text-kaluli-navy/80 leading-relaxed">
            Peserta boleh memprediksi lebih dari 1 pertandingan pada ronde yang sedang aktif — bebas
            pilih match mana saja yang mau diikuti. Prediksi berupa <b>skor akhir</b> (bukan cuma pilih
            menang), pemenang otomatis dihitung dari skor yang diprediksi. Setelah prediksi dikirim
            untuk sebuah match, pilihan itu tidak dapat diubah, dan setiap match hanya bisa diprediksi
            sekali. Peserta mendapatkan poin dasar jika berhasil memprediksi pemenang dengan benar, plus
            bonus tambahan jika skornya persis sama dengan hasil akhir. Jika peserta berhasil memprediksi
            <b> seluruh</b> match yang diikuti di satu ronde dengan benar (perfect round), poin di ronde
            berikutnya akan dikalikan multiplier. Jika ada satu saja prediksi yang salah di ronde
            tersebut, multiplier untuk ronde berikutnya kembali normal. Peserta tetap dapat mengikuti
            prediksi di ronde selanjutnya walau round sebelumnya tidak perfect. Pemenang ditentukan
            berdasarkan total poin tertinggi di akhir final. Jika terdapat total poin yang sama,
            pemenang ditentukan berdasarkan streak prediksi benar terpanjang, jumlah prediksi benar
            terbanyak, waktu submit tercepat, dan tie-breaker challenge jika diperlukan. Tidak ada sistem
            taruhan, undian, atau pembelian wajib.
          </p>
        </div>

        <h2 className="font-display font-bold text-kaluli-navy text-base mb-2.5">Sistem Poin</h2>
        <div className="bg-white rounded-xl2 border border-kaluli-navy/10 shadow-sm overflow-hidden mb-2">
          {POINT_ROWS.map((row, i) => (
            <div
              key={row.round}
              className={`flex items-center justify-between px-4 py-3 ${i !== POINT_ROWS.length - 1 ? 'border-b border-kaluli-navy/5' : ''}`}
            >
              <div>
                <p className="text-sm font-bold text-kaluli-navy">{row.round}</p>
                <p className="text-[11px] text-kaluli-navy/50 font-semibold">{row.multiplier}</p>
              </div>
              <span className="font-display font-extrabold text-kaluli-red text-base shrink-0 ml-3">{row.base}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-kaluli-navy/50 font-semibold mb-5 px-1">
          🎯 Bonus +10 poin tambahan kalau skor yang kamu prediksi <b>persis sama</b> dengan hasil akhir
          (di atas poin dasar menang di atas).
        </p>

        <h2 className="font-display font-bold text-kaluli-navy text-base mb-2.5">Tie-Breaker</h2>
        <ol className="bg-white rounded-xl2 border border-kaluli-navy/10 shadow-sm p-4 flex flex-col gap-2 mb-5">
          {[
            'Streak prediksi benar terpanjang.',
            'Jumlah prediksi benar terbanyak.',
            'Waktu submit tercepat.',
            'Tie-breaker challenge final jika masih sama.',
          ].map((rule, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-kaluli-navy/80 font-semibold">
              <span className="w-5 h-5 shrink-0 rounded-full bg-kaluli-goldSoft text-kaluli-navy text-[11px] font-extrabold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              {rule}
            </li>
          ))}
        </ol>

        <div className="rounded-xl2 bg-kaluli-navy text-white p-4 text-center">
          <p className="text-sm font-bold">🍦 Top points win exclusive Kaluli merch.</p>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
