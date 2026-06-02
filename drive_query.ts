import { google } from 'googleapis';
import { getAuthClient } from './src/auth/oauth.js';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const auth = await getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  const folderId = "1gvSbaAap0djo2hww2VU6VIunBx9LGcHF";
  console.log(`Listing files in folder ${folderId}...`);
  
  const res = await drive.files.list({ 
    q: `'${folderId}' in parents`, 
    fields: 'files(id, name, mimeType)' 
  });
  
  const files = res.data.files;
  console.log(JSON.stringify(files, null, 2));

  // Find the PDF file
  const pdfFile = files?.find(f => f.mimeType === 'application/pdf');
  if (pdfFile) {
    console.log(`Downloading PDF ${pdfFile.name} (${pdfFile.id})...`);
    const destPath = path.join(process.cwd(), 'document.pdf');
    const dest = fs.createWriteStream(destPath);
    const pdfRes = await drive.files.get({ fileId: pdfFile.id!, alt: 'media' }, { responseType: 'stream' });
    
    await new Promise<void>((resolve, reject) => {
      pdfRes.data
        .on('end', () => {
          console.log(`Downloaded PDF to ${destPath}`);
          resolve();
        })
        .on('error', (err: any) => reject(err))
        .pipe(dest);
    });
  } else {
    console.log("No PDF found in this folder.");
  }
}

main().catch(console.error);
