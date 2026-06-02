import { google } from 'googleapis';
import { getAuthClient } from './src/auth/oauth.js';

async function main() {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const spreadsheetId = "1OwcMC4_-NwroGxDhptQ4rFfmrfp4Bv-9CG9PCa0Wv74";
  const range = "'resume pengakan KI detail'!A1:Z100";

  const values = [
    [
      null, // Column 1: Empty
      46163, // Column 2: Date
      "LAPORAN_EDUKASI_PENCEGAHAN_KORUPSI_PELANGGARAN_KODE_ETIK_KODE_PERILAKU_DISIPLIN_PEGAWAI", // Column 3: Category
      "Sosialisasi", // Column 4: Delivery Method
      "Coffee Morning dan Sosialisasi Penguatan Nilai Anti Korupsi dan Gratifikasi", // Column 5: Theme
      "Ideologis", // Column 6: Sub-Category
      "Peran Masyarakat dalam Peningkatkan Budaya Integritas & Bekabi Awards 2026", // Column 7: Topic
      "Tatap muka di Aula KPPBC TMP B Jambi", // Column 8: Location
      "LAP-10/KBC.050210/2026", // Column 9: Reference
      "Kepala KPPBC TMP B Jambi", // Column 10: Speaker
      "Inisiator", // Column 11: Role
      "Menghimbau Pengguna Jasa untuk tidak melakukan gratifikasi, meningkatkan awareness, serta apresiasi kepatuhan.", // Column 12: Description
      "Pengguna Jasa di lingkungan KPPBC TMP B Jambi (Dihadiri 26 dari 37 perusahaan)", // Column 13: Target Audience
      "Menjaga Wilayah Bebas Korupsi dan sinergi instansi pemerintah", // Column 14: Outcome
      "", // Column 15: Link
      "#NAME?" // Column 16: Error
    ]
  ];

  console.log("Appending row to Google Sheets...");
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
