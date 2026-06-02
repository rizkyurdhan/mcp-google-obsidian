import { google } from 'googleapis';
import { getAuthClient } from './src/auth/oauth.js';

async function main() {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const spreadsheetId = "1OwcMC4_-NwroGxDhptQ4rFfmrfp4Bv-9CG9PCa0Wv74";
  const range = "'resume pengakan KI detail'!A1:Z100";

  const values = [
    [
      null,
      46149,
      "LAPORAN_EDUKASI_PENCEGAHAN_KORUPSI_PELANGGARAN_KODE_ETIK_KODE_PERILAKU_DISIPLIN_PEGAWAI",
      "Bimbingan Teknis",
      "PKP dan Edukasi Penguatan Anti Korupsi",
      "Kompetensi & Ideologis",
      "Teknik Pemeriksaan Barang Ekspor & Implementasi Prinsip Integritas dan Akuntabilitas dalam Pemeriksaan Barang",
      "Daring MS Teams",
      "ND-454/KBC.0502/2026",
      "Bapak Hadi Wijaya & Sdr. Darma Sukma",
      "Inisiator",
      "Peningkatan Kompetensi Pegawai (PKP) dan Edukasi Penguatan Anti Korupsi",
      "Seluruh Pegawai",
      "Berkomitmen untuk selalu menjaga integritas dan kompetensi",
      "",
      "#NAME?"
    ],
    [
      null,
      46147,
      "LAPORAN_EDUKASI_PENCEGAHAN_KORUPSI_PELANGGARAN_KODE_ETIK_KODE_PERILAKU_DISIPLIN_PEGAWAI",
      "Bimbingan Teknis",
      "Internalisasi PMK 96 Tahun 2025",
      "Kompetensi",
      "Perubahan atas PMK 237/PMK.04/2022 tentang Penelitian Dugaan Pelanggaran di Bidang Cukai",
      "Ruang Rapat Lantai 2 KPPBC TMP B Jambi",
      "ND-180/KBC.050202/2026",
      "Relijiusman Turnip",
      "Team Leader",
      "Internalisasi aturan baru dan perbaikan proses penelitian perkara di bidang cukai",
      "Seksi Penindakan dan Penyidikan",
      "Penarikan kesimpulan dan usulan alternatif penyelesaian perkara dapat diterapkan sesuai dengan fakta hukum yang terjadi",
      "",
      "#NAME?"
    ],
    [
      null,
      46164,
      "LAPORAN_PEMBINAAN_MENTAL_PEGAWAI",
      "Diskusi",
      "Knowledge Sharing",
      "Kejiwaan",
      "Pentingnya Menjaga Kesehatan Mental",
      "Daring MS Teams",
      "ND-488/KBC.0502/2026",
      "Sdr. Immanuel Nababan",
      "Inisiator",
      "Kegiatan ini sesuai arahan kepala kantor yaitu penyelenggaraan knowledge sharing di tahun 2026",
      "Seluruh Pegawai",
      "Berbagi Pengalaman dan Pengetahuan antar Pegawai mengenai kesehatan mental",
      "",
      "#NAME?"
    ]
  ];

  console.log("Appending 3 rows to Google Sheets...");
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values
    }
  });

  console.log("Append result:");
  console.log(JSON.stringify(res.data, null, 2));
}

main().catch(console.error);
