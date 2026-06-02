import { google } from 'googleapis';
import { getAuthClient } from './src/auth/oauth.js';

async function main() {
  const auth = await getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  const pdfId = "1gvSbaAap0djo2hww2VU6VIunBx9LGcHF";
  console.log(`Getting metadata for file ${pdfId}...`);
  
  const res = await drive.files.get({ 
    fileId: pdfId, 
    fields: 'id, name, mimeType, shortcutDetails' 
  });
  
  console.log(JSON.stringify(res.data, null, 2));
}

main().catch(console.error);
