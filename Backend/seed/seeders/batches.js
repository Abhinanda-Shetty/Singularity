'use strict';

/**
 * Seed: batches
 * Inserts medicine batches with various expiry dates for expiry-risk testing.
 */
async function seedBatches(client) {
  console.log('[Seed] Seeding batches...');

  const { rows: hospitals } = await client.query('SELECT id FROM hospitals ORDER BY id');
  const { rows: medicines } = await client.query('SELECT id FROM medicines ORDER BY id');

  if (hospitals.length === 0 || medicines.length === 0) {
    console.log('[Seed] No hospitals or medicines found. Skipping batches seed.');
    return;
  }

  const today = new Date();
  const daysFromNow = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  };

  const batches = [
    // Hospital 1 — City General
    { h: 0, m: 0,  qty: 500,  expiry: daysFromNow(180) },  // Good stock
    { h: 0, m: 0,  qty: 700,  expiry: daysFromNow(365) },  // Long shelf-life
    { h: 0, m: 2,  qty: 400,  expiry: daysFromNow(30)  },  // Expiring soon!
    { h: 0, m: 2,  qty: 400,  expiry: daysFromNow(200) },
    { h: 0, m: 4,  qty: 15,   expiry: daysFromNow(60)  },  // Insulin — watch expiry
    { h: 0, m: 4,  qty: 10,   expiry: daysFromNow(14)  },  // CRITICAL: expiring in 2 weeks
    { h: 0, m: 13, qty: 100,  expiry: daysFromNow(180) },
    { h: 0, m: 13, qty: 100,  expiry: daysFromNow(7)   },  // CRITICAL: expiring in 1 week
    // Hospital 2 — Northern District
    { h: 1, m: 0,  qty: 300,  expiry: daysFromNow(90)  },
    { h: 1, m: 0,  qty: 300,  expiry: daysFromNow(21)  },  // Expiring soon
    { h: 1, m: 2,  qty: 250,  expiry: daysFromNow(150) },
    { h: 1, m: 4,  qty: 10,   expiry: daysFromNow(45)  },
    // Hospital 3 — Rural Health Centre
    { h: 2, m: 2,  qty: 100,  expiry: daysFromNow(120) },
    { h: 2, m: 12, qty: 250,  expiry: daysFromNow(240) },
    { h: 2, m: 12, qty: 250,  expiry: daysFromNow(10)  },  // Expiring soon
    { h: 2, m: 13, qty: 20,   expiry: daysFromNow(90)  },
    // Hospital 4 — Cardiac Specialty
    { h: 3, m: 8,  qty: 1000, expiry: daysFromNow(365) },
    { h: 3, m: 9,  qty: 750,  expiry: daysFromNow(300) },
    { h: 3, m: 7,  qty: 20,   expiry: daysFromNow(180) },
    { h: 3, m: 7,  qty: 20,   expiry: daysFromNow(28)  },  // Expiring soon
    // Hospital 5 — South Urban
    { h: 4, m: 1,  qty: 450,  expiry: daysFromNow(200) },
    { h: 4, m: 14, qty: 50,   expiry: daysFromNow(90)  },
    { h: 4, m: 14, qty: 50,   expiry: daysFromNow(15)  },  // Expiring soon
  ];

  let inserted = 0;
  for (const b of batches) {
    const hid = hospitals[b.h]?.id;
    const mid = medicines[b.m]?.id;
    if (!hid || !mid) continue;

    await client.query(
      `INSERT INTO batches (hospital_id, medicine_id, quantity, expiry_date)
       VALUES ($1, $2, $3, $4)`,
      [hid, mid, b.qty, b.expiry]
    );
    inserted++;
  }

  console.log(`[Seed] Inserted ${inserted} batch records.`);
}

module.exports = seedBatches;
