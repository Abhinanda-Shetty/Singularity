export const hospitalProfile = {
  name: "Hospital A (Central General)",
  location: "Karkala, Karnataka",
  shortCode: "HA",
  systemStatus: "System running",
  lastUpdated: "10 seconds ago",
};

export const kpiCardsData = [
  {
    id: "total-types",
    title: "Total medicine types",
    value: "248",
    change: "+12% from last month",
    isPositive: true,
    type: "medicine",
    colorTheme: "green",
    sparklineColor: "#2E7D52",
    sparklinePoints: [20, 26, 24, 30, 27, 36, 42, 48],
  },
  {
    id: "total-stock",
    title: "Total stock (units)",
    value: "42,360",
    change: "-8% from last month",
    isPositive: false,
    type: "stock",
    colorTheme: "green",
    sparklineColor: "#2E7D52",
    sparklinePoints: [48, 44, 40, 42, 38, 35, 30, 26],
  },
  {
    id: "at-risk",
    title: "At risk (low stock)",
    value: "7",
    change: "-3 from last month",
    isPositive: true, // reduction in risk is positive
    type: "risk",
    colorTheme: "amber",
    sparklineColor: "#F59E0B",
    sparklinePoints: [18, 22, 28, 24, 32, 28, 38, 44],
  },
  {
    id: "expiring-soon",
    title: "Expiring soon",
    value: "3,200",
    change: "+18% from last month",
    isPositive: false, // increase in expiring units is negative
    type: "expiring",
    colorTheme: "rose",
    sparklineColor: "#E11D48",
    sparklinePoints: [20, 22, 30, 28, 36, 32, 42, 48],
  },
];

export const demandChartData = {
  title: "Demand vs Stock Trend",
  subtitle: "Actual medicine consumption vs predicted demand (all medicines)",
  timeRangeOptions: ["Last 14 days", "Last 30 days", "Last 3 months"],
  dates: ["Oct 1", "Oct 3", "Oct 5", "Oct 7", "Oct 9", "Oct 11", "Oct 13", "Oct 14"],
  yAxisLabels: [0, 500, 1000, 1500, 2000],
  actualData: [
    { date: "Oct 1", value: 420 },
    { date: "Oct 3", value: 590 },
    { date: "Oct 5", value: 880 },
    { date: "Oct 7", value: 740 },
    { date: "Oct 8", value: 1100 },
  ],
  predictedData: [
    { date: "Oct 1", value: 400 },
    { date: "Oct 3", value: 570 },
    { date: "Oct 5", value: 780 },
    { date: "Oct 7", value: 980 },
    { date: "Oct 9", value: 1210 },
    { date: "Oct 11", value: 1410 },
    { date: "Oct 13", value: 1540 },
    { date: "Oct 14", value: 1620 },
  ],
};

export const stockStatusData = {
  title: "Medicine stock status",
  subtitle: "Overall distribution of medicine stock",
  totalCount: 248,
  totalLabel: "Total types",
  segments: [
    { label: "In stock", count: 198, percentage: 80, color: "#1F4D3A" },
    { label: "Low stock", count: 23, percentage: 9, color: "#EAB308" },
    { label: "At risk", count: 7, percentage: 3, color: "#E04A4A" },
    { label: "Expiring soon", count: 20, percentage: 8, color: "#95BE9E" },
  ],
};

export const quickInsightsData = [
  {
    id: 1,
    title: "Stock levels are stable",
    description: "Total stock is 8% higher than last month.",
    icon: "chart",
    variant: "default",
  },
  {
    id: 2,
    title: "7 medicines need attention",
    description: "Review low stock items.",
    icon: "warning",
    variant: "default",
  },
  {
    id: 3,
    title: "3,200 units may expire soon",
    description: "Consider redistributing within the network.",
    icon: "alert",
    variant: "urgent",
  },
];

// Comprehensive catalog of medicines for inter-hospital requests & inventory
export const mockMedicines = [
  { id: 1, name: "Amoxicillin 500mg", category: "Antibiotics", unit: "tablets", currentStock: 1420 },
  { id: 2, name: "Augmentin 625 Duo (Amox + Clav)", category: "Antibiotics", unit: "tablets", currentStock: 860 },
  { id: 3, name: "Paracetamol 650mg (Dolo / Calpol)", category: "Analgesic / Antipyretic", unit: "tablets", currentStock: 4500 },
  { id: 4, name: "Pantoprazole 40mg (Pan 40)", category: "Gastrointestinal", unit: "tablets", currentStock: 2100 },
  { id: 5, name: "Ceftriaxone 1g Injection", category: "Injectables / Critical Care", unit: "vials", currentStock: 320 },
  { id: 6, name: "Azithromycin 500mg (Azee / Azithral)", category: "Antibiotics", unit: "tablets", currentStock: 940 },
  { id: 7, name: "Salbutamol 100mcg Inhaler (Asthalin)", category: "Respiratory", unit: "inhalers", currentStock: 180 },
  { id: 8, name: "Meropenem 1g IV", category: "Critical Care / Antibiotics", unit: "vials", currentStock: 75 },
  { id: 9, name: "Enoxaparin 40mg Injection (Clexane)", category: "Anticoagulants / ICU", unit: "pre-filled syringes", currentStock: 110 },
  { id: 10, name: "Insulin Glargine 100IU/ml (Lantus)", category: "Endocrine / Diabetes", unit: "vials", currentStock: 95 },
  { id: 11, name: "Ondansetron 4mg (Emeset)", category: "Antiemetic", unit: "ampoules", currentStock: 680 },
  { id: 12, name: "Metformin 500mg SR (Glycomet)", category: "Endocrine / Diabetes", unit: "tablets", currentStock: 3200 },
  { id: 13, name: "Tramadol 50mg/ml Injection", category: "Analgesic / ICU", unit: "ampoules", currentStock: 240 },
  { id: 14, name: "Ciprofloxacin 500mg (Ciplox)", category: "Antibiotics", unit: "tablets", currentStock: 1150 },
  { id: 15, name: "Dexamethasone 4mg/ml Injection", category: "Steroids / Emergency", unit: "vials", currentStock: 430 },
  { id: 16, name: "Furosemide 20mg (Lasix)", category: "Cardiovascular / Diuretics", unit: "ampoules", currentStock: 520 },
  { id: 17, name: "Atorvastatin 20mg (Atorva)", category: "Cardiovascular", unit: "tablets", currentStock: 1800 },
  { id: 18, name: "Piperacillin + Tazobactam 4.5g (Pipzo)", category: "Critical Care / Antibiotics", unit: "vials", currentStock: 85 }
];

export const mockHospitals = [
  { id: 1, name: "City General Hospital", type: "general", address: "101 Main Street, Mumbai, Maharashtra 400001", patient_capacity: 500, latitude: 19.076, longitude: 72.8777 },
  { id: 2, name: "Northern District Hospital", type: "general", address: "45 North Road, Delhi 110001", patient_capacity: 350, latitude: 28.7041, longitude: 77.1025 },
  { id: 3, name: "Rural Health Centre East", type: "rural", address: "Village Panchayat Road, Patna, Bihar 800001", patient_capacity: 80, latitude: 25.5941, longitude: 85.1376 },
  { id: 4, name: "Cardiac Specialty Institute", type: "specialty", address: "200 Heart Avenue, Bangalore, Karnataka 560001", patient_capacity: 200, latitude: 12.9716, longitude: 77.5946 },
  { id: 5, name: "South Urban Medical Centre", type: "urban", address: "78 Park Street, Chennai, Tamil Nadu 600001", patient_capacity: 450, latitude: 13.0827, longitude: 80.2707 }
];

export const mockTransfers = [
  {
    donor_hospital_name: "City General Hospital",
    donor_surplus: 1450,
    recipient_hospital_name: "Rural Health Centre East",
    medicine_name: "Amoxicillin 500mg",
    medicine_category: "Antibiotics",
    medicine_id: 1,
    transfer_qty: 450,
    distance_km: 1420,
    transport_time_days: 0.8,
    recipient_priority_score: 95
  },
  {
    donor_hospital_name: "Cardiac Specialty Institute",
    donor_surplus: 620,
    recipient_hospital_name: "South Urban Medical Centre",
    medicine_name: "Ceftriaxone 1g Injection",
    medicine_category: "Injectables / Critical Care",
    medicine_id: 5,
    transfer_qty: 180,
    distance_km: 345,
    transport_time_days: 0.25,
    recipient_priority_score: 88
  },
  {
    donor_hospital_name: "Northern District Hospital",
    donor_surplus: 850,
    recipient_hospital_name: "Rural Health Centre East",
    medicine_name: "Salbutamol 100mcg Inhaler",
    medicine_category: "Respiratory",
    medicine_id: 7,
    transfer_qty: 120,
    distance_km: 980,
    transport_time_days: 0.6,
    recipient_priority_score: 82
  },
  {
    donor_hospital_name: "City General Hospital",
    donor_surplus: 2200,
    recipient_hospital_name: "Cardiac Specialty Institute",
    medicine_name: "Paracetamol 650mg (Dolo)",
    medicine_category: "Analgesic / Antipyretic",
    medicine_id: 3,
    transfer_qty: 800,
    distance_km: 980,
    transport_time_days: 0.5,
    recipient_priority_score: 70
  },
  {
    donor_hospital_name: "South Urban Medical Centre",
    donor_surplus: 280,
    recipient_hospital_name: "Cardiac Specialty Institute",
    medicine_name: "Meropenem 1g IV",
    medicine_category: "Critical Care / Antibiotics",
    medicine_id: 8,
    transfer_qty: 60,
    distance_km: 345,
    transport_time_days: 0.25,
    recipient_priority_score: 91
  }
];

export const mockRequests = [
  {
    id: 101,
    hospital_name: "Rural Health Centre East",
    hospital_id: 3,
    medicine_name: "Amoxicillin 500mg",
    medicine_category: "Antibiotics",
    quantity_required: 450,
    urgency: "Critical",
    status: "Approved",
    needed_by: "2026-10-10",
    created_at: "2026-10-09T02:30:00Z",
    notes: "Rural clinic buffer depleted due to seasonal flood-related infection surge."
  },
  {
    id: 102,
    hospital_name: "South Urban Medical Centre",
    hospital_id: 5,
    medicine_name: "Ceftriaxone 1g Injection",
    medicine_category: "Injectables / Critical Care",
    quantity_required: 180,
    urgency: "Urgent",
    status: "In Transit",
    needed_by: "2026-10-11",
    created_at: "2026-10-09T01:15:00Z",
    notes: "Trauma surgery emergency replenishment corridor active."
  },
  {
    id: 103,
    hospital_name: "Cardiac Specialty Institute",
    hospital_id: 4,
    medicine_name: "Meropenem 1g IV",
    medicine_category: "Critical Care / Antibiotics",
    quantity_required: 60,
    urgency: "Critical",
    status: "Pending",
    needed_by: "2026-10-10",
    created_at: "2026-10-09T03:00:00Z",
    notes: "ICU buffer low for post-operative cardiac patients."
  },
  {
    id: 104,
    hospital_name: "Northern District Hospital",
    hospital_id: 2,
    medicine_name: "Salbutamol 100mcg Inhaler",
    medicine_category: "Respiratory",
    quantity_required: 120,
    urgency: "Normal",
    status: "Pending",
    needed_by: "2026-10-14",
    created_at: "2026-10-08T18:45:00Z",
    notes: "Pediatric respiratory ward routine replenishment."
  },
  {
    id: 105,
    hospital_name: "City General Hospital",
    hospital_id: 1,
    medicine_name: "Augmentin 625 Duo",
    medicine_category: "Antibiotics",
    quantity_required: 300,
    urgency: "Normal",
    status: "Delivered",
    needed_by: "2026-10-08",
    created_at: "2026-10-08T09:20:00Z",
    notes: "Delivered successfully via Southern supply corridor."
  }
];

export const mockRisksData = {
  summary: {
    total_shortage: 5,
    total_at_risk_hospitals: 4,
    total_critical_medicines: 3,
    tier_counts: {
      CRITICAL: 2,
      HIGH: 2,
      MEDIUM: 1,
      LOW: 1
    }
  },
  risk_records: [
    {
      id: "risk-1",
      hospital_name: "Rural Health Centre East",
      hospital_id: 3,
      medicine_name: "Amoxicillin 500mg",
      medicine_category: "Antibiotics",
      current_stock: 35,
      demand_14d: 480,
      safety_stock: 200,
      deficit_qty: 445,
      days_until_stockout: 1.4,
      risk_tier: "CRITICAL",
      urgency_score: 96,
      recommended_action: "Immediate transfer of 450 units from City General Hospital (Mumbai)"
    },
    {
      id: "risk-2",
      hospital_name: "South Urban Medical Centre",
      hospital_id: 5,
      medicine_name: "Ceftriaxone 1g Injection",
      medicine_category: "Injectables / Critical Care",
      current_stock: 45,
      demand_14d: 280,
      safety_stock: 150,
      deficit_qty: 235,
      days_until_stockout: 1.8,
      risk_tier: "CRITICAL",
      urgency_score: 91,
      recommended_action: "Dispatch 180 vials from Cardiac Specialty Institute (Bangalore)"
    },
    {
      id: "risk-3",
      hospital_name: "Cardiac Specialty Institute",
      hospital_id: 4,
      medicine_name: "Meropenem 1g IV",
      medicine_category: "Critical Care / Antibiotics",
      current_stock: 18,
      demand_14d: 80,
      safety_stock: 45,
      deficit_qty: 62,
      days_until_stockout: 3.2,
      risk_tier: "HIGH",
      urgency_score: 85,
      recommended_action: "Draw 60 units from South Urban Medical Centre buffer"
    },
    {
      id: "risk-4",
      hospital_name: "Northern District Hospital",
      hospital_id: 2,
      medicine_name: "Salbutamol 100mcg Inhaler",
      medicine_category: "Respiratory",
      current_stock: 50,
      demand_14d: 190,
      safety_stock: 100,
      deficit_qty: 140,
      days_until_stockout: 4.1,
      risk_tier: "HIGH",
      urgency_score: 78,
      recommended_action: "Redistribute 120 units from City General surplus stock"
    },
    {
      id: "risk-5",
      hospital_name: "City General Hospital",
      hospital_id: 1,
      medicine_name: "Pantoprazole 40mg",
      medicine_category: "Gastrointestinal",
      current_stock: 1200,
      demand_14d: 800,
      safety_stock: 500,
      deficit_qty: 0,
      days_until_stockout: 28.0,
      risk_tier: "LOW",
      urgency_score: 12,
      recommended_action: "Stock level optimal (Available surplus donor node)"
    }
  ]
};
