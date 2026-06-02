import 'dotenv/config';
import { getDriveClient } from './src/google/drive/client.js';

async function testDrive() {
    const drive = await getDriveClient();
    console.log("Fetching recent files from Google Drive...");
    const res = await drive.files.list({
        pageSize: 10,
        fields: 'files(id, name, mimeType)',
        orderBy: 'modifiedTime desc'
    });
    
    const files = res.data.files || [];
    if (files.length === 0) {
        console.log("No files found.");
        return;
    }

    files.forEach(file => {
        console.log(`- ${file.name} (${file.mimeType})`);
    });
}

testDrive().catch(console.error);
