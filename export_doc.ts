import { google } from 'googleapis';
import { getAuthClient } from './src/auth/oauth.js';

async function main() {
  const auth = await getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  const pdfId = "1gvSbaAap0djo2hww2VU6VIunBx9LGcHF";
  console.log(`Exporting Google Doc ${pdfId} as text...`);
  
  const res = await drive.files.export({ 
    fileId: pdfId, 
    mimeType: 'text/plain' 
  });
  
  console.log("Document Content:");
  console.log(res.data);
}

main().catch(console.error);
