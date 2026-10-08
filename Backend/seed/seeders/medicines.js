'use strict';

/**
 * Seed: medicines
 * Inserts sample medicine data for development.
 * Uses ON CONFLICT DO NOTHING to be idempotent.
 */
async function seedMedicines(client) {
  console.log('[Seed] Seeding medicines...');

  const medicines = [
    { name: 'Amoxicillin 500mg', category: 'antibiotic',   unit: 'tablet',  critical: false, alternative_group: 'penicillin_class' },
    { name: 'Azithromycin 250mg', category: 'antibiotic',  unit: 'tablet',  critical: false, alternative_group: 'macrolide_class'  },
    { name: 'Paracetamol 500mg',  category: 'analgesic',   unit: 'tablet',  critical: false, alternative_group: 'analgesic_basic'  },
    { name: 'Ibuprofen 400mg',    category: 'analgesic',   unit: 'tablet',  critical: false, alternative_group: 'analgesic_basic'  },
    { name: 'Insulin Glargine',   category: 'antidiabetic',unit: 'vial',    critical: true,  alternative_group: null               },
    { name: 'Metformin 500mg',    category: 'antidiabetic',unit: 'tablet',  critical: false, alternative_group: 'biguanide_class'  },
    { name: 'Adrenaline 1mg/ml',  category: 'emergency',   unit: 'vial',    critical: true,  alternative_group: null               },
    { name: 'Morphine 10mg/ml',   category: 'opioid',      unit: 'vial',    critical: true,  alternative_group: null               },
    { name: 'Atorvastatin 40mg',  category: 'cardiac',     unit: 'tablet',  critical: false, alternative_group: 'statin_class'     },
    { name: 'Aspirin 75mg',       category: 'cardiac',     unit: 'tablet',  critical: false, alternative_group: 'antiplatelet'     },
    { name: 'Salbutamol Inhaler', category: 'respiratory', unit: 'inhaler', critical: true,  alternative_group: 'bronchodilator'   },
    { name: 'Furosemide 40mg',    category: 'diuretic',    unit: 'tablet',  critical: false, alternative_group: null               },
    { name: 'ORS Sachet',         category: 'rehydration', unit: 'sachet',  critical: false, alternative_group: 'rehydration'      },
    { name: 'IV Saline 0.9% 500ml',category:'iv_fluid',   unit: 'bag',     critical: true,  alternative_group: 'iv_crystalloid'   },
    { name: 'Ceftriaxone 1g',     category: 'antibiotic',  unit: 'vial',    critical: true,  alternative_group: 'cephalosporin_3rd'},
  ];

  for (const m of medicines) {
    await client.query(
      `INSERT INTO medicines (name, category, unit, critical, alternative_group)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [m.name, m.category, m.unit, m.critical, m.alternative_group]
    );
  }

  console.log(`[Seed] Inserted ${medicines.length} medicine records (duplicates skipped).`);
}

module.exports = seedMedicines;
