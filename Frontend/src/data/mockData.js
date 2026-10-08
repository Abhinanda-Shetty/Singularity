export const hospitalProfile = {
  name: "Hospital A",
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
