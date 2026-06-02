import { getSheetsClient } from "./src/google/extended/client.js";

async function main() {
  const client = await getSheetsClient();
  const res = await client.spreadsheets.values.get({
    spreadsheetId: "1fL-e-yrJIwvIUMbopK7Fs9UwTYw13Rql",
    range: "'resume pengakan KI detail'!A1:Z100" // Note the single quotes around sheet name
  });
  console.log(JSON.stringify(res.data.values, null, 2));
}

main().catch(console.error);
