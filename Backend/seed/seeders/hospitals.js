'use strict';

/**
 * Seed: hospitals
 * Inserts sample hospital data for development.
 * Uses ON CONFLICT DO NOTHING to be idempotent.
 */
async function seedHospitals(client) {
  console.log('[Seed] Seeding hospitals...');

  const hospitals = [
    {
      name: 'City General Hospital',
      type: 'general',
      address: '101 Main Street, Mumbai, Maharashtra 400001',
      latitude: 19.0760,
      longitude: 72.8777,
      patient_capacity: 500,
    },
    {
      name: 'Northern District Hospital',
      type: 'general',
      address: '45 North Road, Delhi 110001',
      latitude: 28.7041,
      longitude: 77.1025,
      patient_capacity: 350,
    },
    {
      name: 'Rural Health Centre East',
      type: 'rural',
      address: 'Village Panchayat Road, Patna, Bihar 800001',
      latitude: 25.5941,
      longitude: 85.1376,
      patient_capacity: 80,
    },
    {
      name: 'Cardiac Specialty Institute',
      type: 'specialty',
      address: '200 Heart Avenue, Bangalore, Karnataka 560001',
      latitude: 12.9716,
      longitude: 77.5946,
      patient_capacity: 200,
    },
    {
      name: 'South Urban Medical Centre',
      type: 'urban',
      address: '78 Park Street, Chennai, Tamil Nadu 600001',
      latitude: 13.0827,
      longitude: 80.2707,
      patient_capacity: 450,
    },
  ];

  for (const h of hospitals) {
    await client.query(
      `INSERT INTO hospitals (name, type, address, latitude, longitude, patient_capacity)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING`,
      [h.name, h.type, h.address, h.latitude, h.longitude, h.patient_capacity]
    );
  }

  console.log(`[Seed] Inserted ${hospitals.length} hospital records (duplicates skipped).`);
}

module.exports = seedHospitals;
