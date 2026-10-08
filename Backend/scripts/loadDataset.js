'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CSV_PATH = path.join(__dirname, '..', 'datasets', 'Extensive_A_Z_medicines_dataset_of_India.csv');
const OUTPUT_JSON = path.join(__dirname, '..', 'datasets', 'medicines_catalog.json');

function parseCSVLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

function determineUnit(packSize, name) {
  const str = (packSize + ' ' + name).toLowerCase();
  if (str.includes('syrup') || str.includes('suspension') || str.includes('solution') || str.includes('drop')) return 'ml';
  if (str.includes('capsule')) return 'capsule';
  if (str.includes('injection') || str.includes('vial') || str.includes('ampoule')) return 'vial';
  if (str.includes('inhaler') || str.includes('rotacap')) return 'inhaler';
  if (str.includes('sachet') || str.includes('powder')) return 'sachet';
  if (str.includes('cream') || str.includes('ointment') || str.includes('gel')) return 'tube';
  return 'tablet';
}

function isCriticalCategory(category, composition) {
  const cat = (category || '').toUpperCase();
  const comp = (composition || '').toUpperCase();
  return (
    cat.includes('ANTI INFECTIVES') ||
    cat.includes('CARDIAC') ||
    cat.includes('EMERGENCY') ||
    cat.includes('CRITICAL') ||
    cat.includes('DIABET') ||
    comp.includes('INSULIN') ||
    comp.includes('ADRENALINE') ||
    comp.includes('MORPHINE') ||
    comp.includes('CEFTRIAXONE')
  );
}

async function buildCatalog(targetCount = 25000) {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV file not found at: ${CSV_PATH}`);
    process.exit(1);
  }

  console.log(`[Dataset] Reading from ${CSV_PATH}...`);
  const fileStream = fs.createReadStream(CSV_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const medicines = [];
  const seenNames = new Set();
  let isHeader = true;

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }

    if (!line.trim()) continue;

    const row = parseCSVLine(line);
    if (row.length < 7) continue;

    const rawId = parseInt(row[0], 10);
    const name = row[1];
    const discontinued = (row[3] || '').toLowerCase() === 'true';

    if (discontinued || !name) continue;

    const nameKey = name.toLowerCase();
    if (seenNames.has(nameKey)) continue;
    seenNames.add(nameKey);

    const price = parseFloat(row[2]) || 0;
    const manufacturer = row[4] || '';
    const packSize = row[6] || '';
    const comp1 = row[7] || '';
    const comp2 = row[8] || '';
    const composition = [comp1, comp2].filter(Boolean).join(' + ');

    const substitutes = [row[9], row[10], row[11], row[12], row[13]]
      .filter((s) => s && s.trim().length > 0);

    const category = row[22] || row[21] || 'General';
    const unit = determineUnit(packSize, name);
    const critical = isCriticalCategory(category, composition);

    medicines.push({
      id: medicines.length + 1,
      dataset_id: rawId,
      name,
      category,
      unit,
      price,
      manufacturer,
      composition,
      critical,
      alternative_group: substitutes[0] || null,
      substitutes,
      pack_size: packSize,
    });

    if (medicines.length >= targetCount) {
      break;
    }
  }

  console.log(`[Dataset] Parsed ${medicines.length} unique medicines. Writing to ${OUTPUT_JSON}...`);
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(medicines, null, 2), 'utf8');
  console.log(`[Dataset] Successfully created catalog with ${medicines.length} medicines!`);
}

if (require.main === module) {
  buildCatalog().catch((err) => {
    console.error('[Dataset] Error building catalog:', err);
    process.exit(1);
  });
}

module.exports = { buildCatalog };
