/**
 * parse-excel.js
 * Run once (or whenever the Excel file changes) to export payment data to JSON.
 * Usage: npm run parse
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const INPUT_FILE = path.join(__dirname, '..', 'public', 'payments.xlsx');
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'payments-data.json');

const SKIP_LABELS = ['name', 'no', 'unit', 'no.', 'bil', 'room', 'id', 'resident'];

function parseSection(name) {
  const idx = name.indexOf('_');
  return idx !== -1 ? name.slice(idx + 1) : 'Unknown';
}

console.log('📂 Reading:', INPUT_FILE);

if (!fs.existsSync(INPUT_FILE)) {
  console.error('❌ Excel file not found at:', INPUT_FILE);
  process.exit(1);
}

const fileBuffer = fs.readFileSync(INPUT_FILE);
const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

const allSheets = [];

for (const sheetName of workbook.SheetNames) {
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
    blankrows: true,
  });

  if (!rawData || rawData.length < 2) {
    console.log(`  ⚠️  Skipping empty sheet: ${sheetName}`);
    continue;
  }

  // Row 0 = headers (months start at column 1)
  const headerRow = rawData[0];
  const months = [];
  for (let c = 1; c < headerRow.length; c++) {
    const val = headerRow[c];
    if (val !== null && val !== undefined && String(val).trim() !== '') {
      const label = String(val).trim();
      if (!SKIP_LABELS.includes(label.toLowerCase())) {
        months.push({ index: c, label });
      }
    }
  }

  const residents = [];
  for (let r = 1; r < rawData.length; r++) {
    const row = rawData[r];
    if (!row || row.length === 0) continue;
    const name = row[0];
    if (!name || String(name).trim() === '') continue;

    const rawName = String(name).trim();
    const displayName = rawName.replace(/_/g, ' ');
    const residentName = row[1] ? String(row[1]).trim().replace(/\s*\*+\s*$/, '') : '';
    const payments = {};
    let totalPaid = 0;
    let totalUnpaid = 0;

    for (const month of months) {
      const cellVal = row[month.index];
      const isPaid =
        cellVal !== null &&
        cellVal !== undefined &&
        String(cellVal).trim() !== '';
      payments[month.label] = isPaid;
      if (isPaid) totalPaid++;
      else totalUnpaid++;
    }

    residents.push({
      name: displayName,
      residentName,
      section: parseSection(rawName),
      payments,
      totalPaid,
      totalUnpaid,
      totalAmount: totalPaid * 100,
    });
  }

  // Monthly summary
  const monthlySummary = months.map((m) => {
    const paidCount = residents.filter((r) => r.payments[m.label]).length;
    return {
      month: m.label,
      paid: paidCount,
      unpaid: residents.length - paidCount,
      amount: paidCount * 100,
    };
  });

  // Per-section summary
  const sectionMap = {};
  for (const r of residents) {
    if (!sectionMap[r.section]) {
      sectionMap[r.section] = {
        section: r.section,
        totalResidents: 0,
        totalPaid: 0,
        totalUnpaid: 0,
      };
    }
    sectionMap[r.section].totalResidents += 1;
    sectionMap[r.section].totalPaid += r.totalPaid;
    sectionMap[r.section].totalUnpaid += r.totalUnpaid;
  }
  const sectionSummary = Object.values(sectionMap).map((s) => ({
    ...s,
    totalCollected: s.totalPaid * 100,
    paymentRate:
      s.totalPaid + s.totalUnpaid > 0
        ? Math.round((s.totalPaid / (s.totalPaid + s.totalUnpaid)) * 100)
        : 0,
  }));

  const totalPaidCells = residents.reduce((s, r) => s + r.totalPaid, 0);
  const totalUnpaidCells = residents.reduce((s, r) => s + r.totalUnpaid, 0);

  allSheets.push({
    sheetName,
    months: months.map((m) => m.label),
    residents,
    monthlySummary,
    sectionSummary,
    stats: {
      totalResidents: residents.length,
      totalMonths: months.length,
      totalPaidCells,
      totalUnpaidCells,
      totalCollected: totalPaidCells * 100,
      paymentRate:
        totalPaidCells + totalUnpaidCells > 0
          ? Math.round(
              (totalPaidCells / (totalPaidCells + totalUnpaidCells)) * 100
            )
          : 0,
    },
  });

  console.log(
    `  ✅ ${sheetName}: ${residents.length} residents, ${months.length} months`
  );
}

const output = {
  generatedAt: new Date().toISOString(),
  sourceFile: 'Avista Payments List-v1.xlsx',
  sheets: allSheets,
};

// ─── Aggregate tunggakan across all years per unit ───────────
const unitMap = {};
for (const sheet of allSheets) {
  for (const r of sheet.residents) {
    if (!unitMap[r.name]) {
      unitMap[r.name] = {
        name: r.name,
        residentName: r.residentName || '',
        section: r.section,
        totalUnpaid: 0,
        totalPaid: 0,
        yearlyBreakdown: [],
      };
    }
    unitMap[r.name].totalUnpaid += r.totalUnpaid;
    unitMap[r.name].totalPaid  += r.totalPaid;

    // Collect the names of unpaid months for drill-down
    const unpaidMonths = Object.entries(r.payments)
      .filter(([, paid]) => !paid)
      .map(([month]) => month);

    if (r.totalUnpaid > 0) {
      unitMap[r.name].yearlyBreakdown.push({
        year: sheet.sheetName,
        paid: r.totalPaid,
        unpaid: r.totalUnpaid,
        unpaidMonths,
      });
    }
  }
}
output.tunggakan = Object.values(unitMap)
  .map((u) => ({ ...u, amountOwed: u.totalUnpaid * 100 }))
  .sort((a, b) => b.totalUnpaid - a.totalUnpaid);

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

const fileSizeKb = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1);
console.log(`\n✅ Done! Wrote ${allSheets.length} sheets → ${OUTPUT_FILE}`);
console.log(`   File size: ${fileSizeKb} KB`);
console.log(`   Generated at: ${output.generatedAt}`);
console.log('\n💡 To refresh data: npm run parse');
