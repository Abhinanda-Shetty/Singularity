/**
 * networkMockData.js — Realistic Hospital Network & Transfer Recommendations
 *
 * Designed to mirror the exact API schema for:
 *   GET /api/transfers/recommendations
 *   GET /api/hospitals/network
 *
 * Adheres to the MedSupply architecture:
 * - Frontend ONLY visualizes data; no PuLP or optimization logic here.
 * - Realistic regional cluster coordinates (Western Corridor / Mumbai-Pune regional network).
 */

export const mockNetworkHospitals = [
  {
    id: 1,
    code: "H-A",
    name: "Hospital A (City General Hospital)",
    shortName: "Hospital A",
    type: "General Hospital",
    status: "critical", // 'healthy' | 'low_stock' | 'critical' | 'surplus'
    riskLevel: "CRITICAL",
    latitude: 18.9894,
    longitude: 72.8376,
    address: "101 Main Street, Mumbai, Maharashtra 400001",
    daysToStockout: 1.8,
    patientLoad: 442,
    patientCapacity: 500,
    occupancyRate: 88,
    surplusUnits: 0,
    criticalMedicines: [
      { id: "med-amox-500", name: "Amoxicillin 500mg", currentStock: 140, safetyStock: 800, daysLeft: 1.8, urgency: "Critical" },
      { id: "med-salb-100", name: "Salbutamol Inhaler", currentStock: 18, safetyStock: 120, daysLeft: 2.1, urgency: "High" }
    ],
    surplusMedicines: [],
    incomingTransfersCount: 1,
    outgoingTransfersCount: 0,
    contactOfficer: "Dr. Rajesh Kulkarni (Medical Director)",
    phone: "+91 22 2456 7890"
  },
  {
    id: 2,
    code: "H-B",
    name: "Hospital B (Northern District Referral)",
    shortName: "Hospital B",
    type: "District Hospital",
    status: "low_stock",
    riskLevel: "HIGH",
    latitude: 19.2183,
    longitude: 72.9781,
    address: "45 North Ring Road, Thane Central 400601",
    daysToStockout: 4.5,
    patientLoad: 285,
    patientCapacity: 350,
    occupancyRate: 81,
    surplusUnits: 0,
    criticalMedicines: [
      { id: "med-para-100", name: "Paracetamol IV 100ml", currentStock: 320, safetyStock: 750, daysLeft: 4.5, urgency: "High" },
      { id: "med-ins-100",  name: "Insulin Regular 100IU", currentStock: 45,  safetyStock: 110, daysLeft: 5.0, urgency: "Moderate" }
    ],
    surplusMedicines: [],
    incomingTransfersCount: 1,
    outgoingTransfersCount: 0,
    contactOfficer: "Dr. Anita Desai (Logistics Lead)",
    phone: "+91 22 2541 3320"
  },
  {
    id: 3,
    code: "H-C",
    name: "Hospital C (Sahyadri Central Institute)",
    shortName: "Hospital C",
    type: "Teaching Hospital",
    status: "surplus",
    riskLevel: "LOW",
    latitude: 18.5204,
    longitude: 73.8567,
    address: "240 Central Campus Road, Pune Corridor 411004",
    daysToStockout: 24.0,
    patientLoad: 310,
    patientCapacity: 450,
    occupancyRate: 69,
    surplusUnits: 1450,
    criticalMedicines: [],
    surplusMedicines: [
      { id: "med-amox-500", name: "Amoxicillin 500mg", surplusQuantity: 850, batchExpiry: "2026-12-15", daysToExpiry: 68 },
      { id: "med-ceft-1g",  name: "Ceftriaxone 1g",     surplusQuantity: 600, batchExpiry: "2027-02-10", daysToExpiry: 125 }
    ],
    incomingTransfersCount: 0,
    outgoingTransfersCount: 2,
    contactOfficer: "Dr. Vikram Joshi (Head of Pharmacy)",
    phone: "+91 20 2612 8840"
  },
  {
    id: 4,
    code: "H-D",
    name: "Hospital D (Apex Metropolitan Trauma Centre)",
    shortName: "Hospital D",
    type: "Specialized Hospital",
    status: "healthy",
    riskLevel: "LOW",
    latitude: 19.0657,
    longitude: 72.8683,
    address: "Bandra-Kurla Complex, Mumbai 400051",
    daysToStockout: 18.5,
    patientLoad: 190,
    patientCapacity: 250,
    occupancyRate: 76,
    surplusUnits: 120,
    criticalMedicines: [],
    surplusMedicines: [
      { id: "med-met-500", name: "Metformin 500mg", surplusQuantity: 120, batchExpiry: "2027-08-20", daysToExpiry: 315 }
    ],
    incomingTransfersCount: 0,
    outgoingTransfersCount: 0,
    contactOfficer: "Dr. Farhan Merchant (Clinical Director)",
    phone: "+91 22 2650 9900"
  },
  {
    id: 5,
    code: "H-E",
    name: "Hospital E (Navi Mumbai Specialty Institute)",
    shortName: "Hospital E",
    type: "Referral Hospital",
    status: "surplus",
    riskLevel: "LOW",
    latitude: 19.0330,
    longitude: 73.0297,
    address: "Sector 15, Palm Beach Road, Vashi 400703",
    daysToStockout: 31.0,
    patientLoad: 260,
    patientCapacity: 400,
    occupancyRate: 65,
    surplusUnits: 980,
    criticalMedicines: [],
    surplusMedicines: [
      { id: "med-para-100", name: "Paracetamol IV 100ml", surplusQuantity: 620, batchExpiry: "2027-01-30", daysToExpiry: 114 },
      { id: "med-salb-100", name: "Salbutamol Inhaler",   surplusQuantity: 360, batchExpiry: "2027-04-18", daysToExpiry: 192 }
    ],
    incomingTransfersCount: 0,
    outgoingTransfersCount: 2,
    contactOfficer: "Dr. Smita Rane (Chief Pharmacist)",
    phone: "+91 22 2789 4410"
  },
  {
    id: 6,
    code: "H-F",
    name: "Hospital F (Raigad Community Healthcare Centre)",
    shortName: "Hospital F",
    type: "Community Clinic",
    status: "critical",
    riskLevel: "CRITICAL",
    latitude: 18.9890,
    longitude: 73.1175,
    address: "Old Highway Junction, Panvel, Raigad 410206",
    daysToStockout: 1.2,
    patientLoad: 74,
    patientCapacity: 80,
    occupancyRate: 93,
    surplusUnits: 0,
    criticalMedicines: [
      { id: "med-ceft-1g",  name: "Ceftriaxone 1g",         currentStock: 22, safetyStock: 180, daysLeft: 1.2, urgency: "Critical" },
      { id: "med-epi-1mg",  name: "Epinephrine 1mg/ml",    currentStock: 8,  safetyStock: 50,  daysLeft: 1.5, urgency: "Critical" }
    ],
    surplusMedicines: [],
    incomingTransfersCount: 1,
    outgoingTransfersCount: 0,
    contactOfficer: "Dr. Sneha Patil (Medical Officer)",
    phone: "+91 2143 222100"
  },
  {
    id: 7,
    code: "H-G",
    name: "Hospital G (Kalyan Regional Medical Hub)",
    shortName: "Hospital G",
    type: "General Hospital",
    status: "healthy",
    riskLevel: "LOW",
    latitude: 19.2403,
    longitude: 73.1305,
    address: "Station Link Road, Kalyan West 421301",
    daysToStockout: 16.0,
    patientLoad: 210,
    patientCapacity: 300,
    occupancyRate: 70,
    surplusUnits: 150,
    criticalMedicines: [],
    surplusMedicines: [
      { id: "med-amox-500", name: "Amoxicillin 500mg", surplusQuantity: 150, batchExpiry: "2027-05-15", daysToExpiry: 218 }
    ],
    incomingTransfersCount: 0,
    outgoingTransfersCount: 0,
    contactOfficer: "Dr. Amit Shinde (Inventory Officer)",
    phone: "+91 251 230988"
  },
  {
    id: 8,
    code: "H-H",
    name: "Hospital H (Western Hills District Hospital)",
    shortName: "Hospital H",
    type: "District Hospital",
    status: "low_stock",
    riskLevel: "MODERATE",
    latitude: 18.7557,
    longitude: 73.4091,
    address: "Valley Road, Lonavala Highland 410401",
    daysToStockout: 5.1,
    patientLoad: 98,
    patientCapacity: 120,
    occupancyRate: 82,
    surplusUnits: 0,
    criticalMedicines: [
      { id: "med-salb-100", name: "Salbutamol Inhaler", currentStock: 24, safetyStock: 80, daysLeft: 5.1, urgency: "Moderate" }
    ],
    surplusMedicines: [],
    incomingTransfersCount: 1,
    outgoingTransfersCount: 0,
    contactOfficer: "Dr. Meera Nair (Resident Administrator)",
    phone: "+91 2114 273110"
  }
];

export const mockNetworkTransfers = [
  {
    id: "TRF-REC-01",
    donorHospitalId: 3,
    donorHospitalName: "Hospital C (Sahyadri Central Institute)",
    donorShortName: "Hospital C (Surplus)",
    donorCoords: [18.5204, 73.8567],
    recipientHospitalId: 1,
    recipientHospitalName: "Hospital A (City General Hospital)",
    recipientShortName: "Hospital A (Critical)",
    recipientCoords: [18.9894, 72.8376],
    medicine: "Amoxicillin 500mg",
    medicineId: "med-amox-500",
    quantity: 800,
    unit: "units",
    distance: "145 km",
    distanceKm: 145,
    eta: "2h 15m",
    etaMinutes: 135,
    priority: "CRITICAL",
    status: "Recommended",
    rationale: "Hospital A faces complete stockout in 1.8 days. Hospital C possesses 1,450 surplus units with 68 days before lot expiration.",
    recommendedAt: "2026-10-08T14:30:00Z"
  },
  {
    id: "TRF-REC-02",
    donorHospitalId: 5,
    donorHospitalName: "Hospital E (Navi Mumbai Specialty Institute)",
    donorShortName: "Hospital E (Surplus)",
    donorCoords: [19.0330, 73.0297],
    recipientHospitalId: 2,
    recipientHospitalName: "Hospital B (Northern District Referral)",
    recipientShortName: "Hospital B (Low Stock)",
    recipientCoords: [19.2183, 72.9781],
    medicine: "Paracetamol IV 100ml",
    medicineId: "med-para-100",
    quantity: 450,
    unit: "units",
    distance: "28 km",
    distanceKm: 28,
    eta: "42m",
    etaMinutes: 42,
    priority: "HIGH",
    status: "Recommended",
    rationale: "Hospital B safety buffer breached for surgical wards. Hospital E maintains 620 units above 30-day reserve.",
    recommendedAt: "2026-10-08T15:10:00Z"
  },
  {
    id: "TRF-REC-03",
    donorHospitalId: 3,
    donorHospitalName: "Hospital C (Sahyadri Central Institute)",
    donorShortName: "Hospital C (Surplus)",
    donorCoords: [18.5204, 73.8567],
    recipientHospitalId: 6,
    recipientHospitalName: "Hospital F (Raigad Community Healthcare Centre)",
    recipientShortName: "Hospital F (Critical)",
    recipientCoords: [18.9890, 73.1175],
    medicine: "Ceftriaxone 1g",
    medicineId: "med-ceft-1g",
    quantity: 300,
    unit: "units",
    distance: "118 km",
    distanceKm: 118,
    eta: "1h 50m",
    etaMinutes: 110,
    priority: "CRITICAL",
    status: "In Transit",
    rationale: "Emergency antimicrobial supply dispatched via medical green corridor to prevent ICU patient diversion.",
    recommendedAt: "2026-10-08T16:00:00Z"
  },
  {
    id: "TRF-REC-04",
    donorHospitalId: 5,
    donorHospitalName: "Hospital E (Navi Mumbai Specialty Institute)",
    donorShortName: "Hospital E (Surplus)",
    donorCoords: [19.0330, 73.0297],
    recipientHospitalId: 8,
    recipientHospitalName: "Hospital H (Western Hills District Hospital)",
    recipientShortName: "Hospital H (Low Stock)",
    recipientCoords: [18.7557, 73.4091],
    medicine: "Salbutamol Inhaler",
    medicineId: "med-salb-100",
    quantity: 160,
    unit: "units",
    distance: "64 km",
    distanceKm: 64,
    eta: "1h 10m",
    etaMinutes: 70,
    priority: "MEDIUM",
    status: "Recommended",
    rationale: "Pre-emptive transfer before forecast weekend respiratory admission surge in highland climate.",
    recommendedAt: "2026-10-08T16:45:00Z"
  }
];

export function getNetworkSummary(hospitals = mockNetworkHospitals, transfers = mockNetworkTransfers) {
  const totalHospitals = hospitals.length;
  const criticalHospitals = hospitals.filter(h => h.status === 'critical').length;
  const lowStockHospitals = hospitals.filter(h => h.status === 'low_stock').length;
  const surplusHospitals  = hospitals.filter(h => h.status === 'surplus').length;
  const healthyHospitals  = hospitals.filter(h => h.status === 'healthy').length;
  const activeTransfers   = transfers.length;
  const totalTransferredUnits = transfers.reduce((acc, t) => acc + (t.quantity || 0), 0);

  return {
    totalHospitals,
    criticalHospitals,
    lowStockHospitals,
    surplusHospitals,
    healthyHospitals,
    activeTransfers,
    totalTransferredUnits
  };
}
