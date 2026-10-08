'use strict';

/**
 * Seed: inventory
 * Inserts current stock levels for hospital/medicine pairs.
 * Uses ON CONFLICT DO UPDATE to refresh quantities on re-seed.
 */
async function seedInventory(client) {
  console.log('[Seed] Seeding inventory...');

  // Get hospital and medicine IDs
  const { rows: hospitals } = await client.query('SELECT id FROM hospitals ORDER BY id');
  const { rows: medicines } = await client.query('SELECT id FROM medicines ORDER BY id');

  if (hospitals.length === 0 || medicines.length === 0) {
    console.log('[Seed] No hospitals or medicines found. Skipping inventory seed.');
    return;
  }

  // Seed sample inventory levels (not all combinations)
  const inventoryData = [
    // Hospital 1 — City General
    { h: 0, m: 0, qty: 1200, safety: 200 },  // Amoxicillin
    { h: 0, m: 2, qty: 800,  safety: 150 },  // Paracetamol
    { h: 0, m: 4, qty: 25,   safety: 10  },  // Insulin
    { h: 0, m: 6, qty: 50,   safety: 20  },  // Adrenaline
    { h: 0, m: 13, qty: 200, safety: 50  },  // IV Saline
    // Hospital 2 — Northern District
    { h: 1, m: 0, qty: 600,  safety: 100 },
    { h: 1, m: 2, qty: 500,  safety: 100 },
    { h: 1, m: 4, qty: 10,   safety: 8   },  // Critical low stock
    { h: 1, m: 10, qty: 30,  safety: 15  },  // Salbutamol
    { h: 1, m: 13, qty: 80,  safety: 30  },
    // Hospital 3 — Rural Health Centre
    { h: 2, m: 2, qty: 200,  safety: 50  },
    { h: 2, m: 3, qty: 150,  safety: 30  },  // Ibuprofen
    { h: 2, m: 12, qty: 500, safety: 100 },  // ORS
    { h: 2, m: 13, qty: 20,  safety: 20  },  // IV Saline — at safety stock
    // Hospital 4 — Cardiac Specialty
    { h: 3, m: 8,  qty: 2000, safety: 300 }, // Atorvastatin
    { h: 3, m: 9,  qty: 1500, safety: 300 }, // Aspirin
    { h: 3, m: 7,  qty: 40,   safety: 20  }, // Morphine
    { h: 3, m: 13, qty: 300,  safety: 60  },
    // Hospital 5 — South Urban
    { h: 4, m: 1,  qty: 900,  safety: 150 }, // Azithromycin
    { h: 4, m: 5,  qty: 400,  safety: 80  }, // Metformin
    { h: 4, m: 4,  qty: 60,   safety: 15  }, // Insulin
    { h: 4, m: 14, qty: 100,  safety: 30  }, // Ceftriaxone
  ];

  for (const item of inventoryData) {
    const hid = hospitals[item.h]?.id;
    const mid = medicines[item.m]?.id;
    if (!hid || !mid) continue;

    await client.query(
      `INSERT INTO inventory (hospital_id, medicine_id, quantity, safety_stock)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (hospital_id, medicine_id)
       DO UPDATE SET quantity = EXCLUDED.quantity, safety_stock = EXCLUDED.safety_stock`,
      [hid, mid, item.qty, item.safety]
    );
  }

  console.log(`[Seed] Inserted/updated ${inventoryData.length} inventory records.`);
}

module.exports = seedInventory;
