'use strict';

/**
 * Seed: demandHistory
 * Inserts 30 days of historical daily consumption data.
 * Uses ON CONFLICT DO NOTHING to be idempotent.
 */
async function seedDemandHistory(client) {
  console.log('[Seed] Seeding demand_history (30 days)...');

  const { rows: hospitals } = await client.query('SELECT id FROM hospitals ORDER BY id');
  const { rows: medicines } = await client.query('SELECT id FROM medicines ORDER BY id');

  if (hospitals.length === 0 || medicines.length === 0) {
    console.log('[Seed] No hospitals or medicines found. Skipping demand_history seed.');
    return;
  }

  // Define typical daily consumption per hospital/medicine index pair
  const demandProfiles = [
    { h: 0, m: 0,  baseConsumption: 50, basePatients: 300, baseEmergency: 5  },
    { h: 0, m: 2,  baseConsumption: 80, basePatients: 300, baseEmergency: 10 },
    { h: 0, m: 4,  baseConsumption: 2,  basePatients: 300, baseEmergency: 0  },
    { h: 1, m: 0,  baseConsumption: 30, basePatients: 200, baseEmergency: 3  },
    { h: 1, m: 2,  baseConsumption: 45, basePatients: 200, baseEmergency: 5  },
    { h: 2, m: 2,  baseConsumption: 15, basePatients: 60,  baseEmergency: 2  },
    { h: 2, m: 12, baseConsumption: 20, basePatients: 60,  baseEmergency: 0  },
    { h: 3, m: 8,  baseConsumption: 60, basePatients: 150, baseEmergency: 0  },
    { h: 3, m: 9,  baseConsumption: 55, basePatients: 150, baseEmergency: 0  },
    { h: 4, m: 1,  baseConsumption: 40, basePatients: 280, baseEmergency: 4  },
    { h: 4, m: 4,  baseConsumption: 3,  basePatients: 280, baseEmergency: 0  },
  ];

  const DAYS = 30;
  let inserted = 0;

  for (const profile of demandProfiles) {
    const hid = hospitals[profile.h]?.id;
    const mid = medicines[profile.m]?.id;
    if (!hid || !mid) continue;

    for (let i = DAYS; i >= 1; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Add small random variation to simulate real data
      const variation = () => (Math.random() * 0.2 - 0.1); // ±10%
      const consumption = Math.max(0, Math.round(profile.baseConsumption * (1 + variation())));
      const patientLoad = Math.max(0, Math.round(profile.basePatients * (1 + variation())));
      const emergencyDemand = Math.max(0, Math.round(profile.baseEmergency * (1 + variation())));

      await client.query(
        `INSERT INTO demand_history
           (hospital_id, medicine_id, date, consumption, patient_load, emergency_demand)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (hospital_id, medicine_id, date) DO NOTHING`,
        [hid, mid, dateStr, consumption, patientLoad, emergencyDemand]
      );
      inserted++;
    }
  }

  console.log(`[Seed] Inserted ${inserted} demand_history records.`);
}

module.exports = seedDemandHistory;
