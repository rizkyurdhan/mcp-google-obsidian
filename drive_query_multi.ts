import { google } from 'googleapis';
import { getAuthClient } from './src/auth/oauth.js';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const auth = await getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  const targetId = "1JtvYrTsf4GKu93w78gPhA5kmYGHgtLhk";
  console.log(`Getting metadata for ID ${targetId}...`);
  
  const metaRes = await drive.files.get({ 
    fileId: targetId, 
    fields: 'id, name, mimeType' 
  });
  
  const meta = metaRes.data;
  console.log(`Target is: ${meta.name} (${meta.mimeType})`);

  let filesToDownload: any[] = [];

  if (meta.mimeType === 'application/vnd.google-apps.folder') {
    console.log(`Listing files in folder...`);
    const res = await drive.files.list({ 
      q: `'${targetId}' in parents and mimeType='application/pdf'`, 
      fields: 'files(id, name, mimeType)' 
    });
    filesToDownload = res.data.files || [];
  } else if (meta.mimeType === 'application/pdf') {
    filesToDownload = [meta];
  } else {
    console.log("Target is not a folder or a PDF.");
    return;
  }

  console.log(`Found ${filesToDownload.length} PDFs to download.`);

  for (let i = 0; i < filesToDownload.length; i++) {
    const file = filesToDownload[i];
    console.log(`Downloading [${i+1}/${filesToDownload.length}] ${file.name}...`);
    const destPath = path.join(process.cwd(), `doc_${i+1}.pdf`);
    const dest = fs.createWriteStream(destPath);
    
    const pdfRes = await drive.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'stream' });
    
    await new Promise<void>((resolve, reject) => {
      pdfRes.data
        .on('end', () => {
          console.log(`Downloaded ${file.name} to ${destPath}`);
          resolve();
        })
        .on('error', (err: any) => reject(err))
        .pipe(dest);
    });
  }
}

main().catch(console.error);
