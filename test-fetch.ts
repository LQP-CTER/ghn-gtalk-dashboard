import * as XLSX from 'xlsx';

const SHEET_ID = '1o2ODGcCfK9Y2flHztJCmliaNANIymvAx3QulzK6jet8';
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`;

async function inspect() {
  const response = await fetch(URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const buf = await response.arrayBuffer();
  const workbook = XLSX.read(buf, { type: 'array' });

  // data1: show headers + first row
  const s1 = workbook.Sheets['data1'];
  const data1 = XLSX.utils.sheet_to_json(s1, { header: 1 }) as any[][];
  console.log('=== data1 headers ===');
  console.log(data1[0]);
  console.log('=== data1 first data row ===');
  console.log(data1[1]);
  console.log('Total rows:', data1.length);

  // data history: show first few columns/rows
  const s2 = workbook.Sheets['data history'];
  const hist = XLSX.utils.sheet_to_json(s2, { header: 1 }) as any[][];
  console.log('\n=== data history: first 5 column headers ===');
  console.log(hist[0]?.slice(0, 5));
  console.log('=== data history: first row values (first 5) ===');
  console.log(hist[1]?.slice(0, 5));
  console.log('Total cols:', hist[0]?.length, '  Total rows:', hist.length);
}

inspect().catch(console.error);
