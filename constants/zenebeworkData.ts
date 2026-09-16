import type { PropertyName } from "@/contexts/PropertyContext";
import type { Shop } from "@/contexts/ShopContext";
import type { Tenant } from "@/contexts/TenantContext";
import type { Payment, PaymentStatus } from "@/contexts/PaymentContext";

export interface ZenebeworkUnitRaw {
  unitNumber: string;
  tenantName: string;
  rentAmount: number;
  businessType: string;
  phoneNumber: string;
  nationalId: string;
  status: "Occupied" | "Vacant" | "Facility";
}

/**
 * Raw dataset strictly scoped to Zenebework as provided:
 * Total Units: 28
 * Active Rent-Paying Tenants: 22
 * Vacant Units: 4 (G 16, G 18, G 19, G 27)
 * Facility / Owner Use: 2 (G 14 - Store/Storage, Office)
 * Total Expected Monthly Rent: 234,000 ETB
 */
export const ZENEBEWORK_RAW_DATA: ZenebeworkUnitRaw[] = [
  {
    unitNumber: "G 01",
    tenantName: "Tesfaun Girma",
    rentAmount: 12000,
    businessType: "Mobile Repair",
    phoneNumber: "0913 17 54 06",
    nationalId: "3961 4986 9064 5746",
    status: "Occupied"
  },
  {
    unitNumber: "G 02",
    tenantName: "Teyiba delil",
    rentAmount: 15000,
    businessType: "Khat house",
    phoneNumber: "0968 74 21 47",
    nationalId: "6274 9021 5263 1457",
    status: "Occupied"
  },
  {
    unitNumber: "G 03",
    tenantName: "Abdulrahman Meno",
    rentAmount: 12000,
    businessType: "Bakery",
    phoneNumber: "-",
    nationalId: "4215 7806 4187 3584",
    status: "Occupied"
  },
  {
    unitNumber: "G 04",
    tenantName: "Mares Samuel",
    rentAmount: 11000,
    businessType: "Clothing",
    phoneNumber: "0946 96 19 20",
    nationalId: "6410 3620 8452 1530",
    status: "Occupied"
  },
  {
    unitNumber: "G 05",
    tenantName: "Kiflu Hasan",
    rentAmount: 10000,
    businessType: "Stationery",
    phoneNumber: "0911 82 89 59",
    nationalId: "3620 7147 8350 2742",
    status: "Occupied"
  },
  {
    unitNumber: "G 06",
    tenantName: "Tewodros Girma",
    rentAmount: 10000,
    businessType: "Spice Shop",
    phoneNumber: "0938 99 39 00",
    nationalId: "2159 8164 8930 9719",
    status: "Occupied"
  },
  {
    unitNumber: "G 07",
    tenantName: "Ashebir eshetu",
    rentAmount: 10000,
    businessType: "Steam",
    phoneNumber: "0910 10 50 34",
    nationalId: "5329 5079 8017 3514",
    status: "Occupied"
  },
  {
    unitNumber: "G 08",
    tenantName: "Tewodros",
    rentAmount: 10000,
    businessType: "Water",
    phoneNumber: "0955 77 56 73",
    nationalId: "-",
    status: "Occupied"
  },
  {
    unitNumber: "G 09",
    tenantName: "Yidnekachew Melese",
    rentAmount: 11000,
    businessType: "Steam Coffee",
    phoneNumber: "0993 82 57",
    nationalId: "6276 1956 3173 0264",
    status: "Occupied"
  },
  {
    unitNumber: "G 10",
    tenantName: "Seble tsegaye",
    rentAmount: 10000,
    businessType: "Breakfast House",
    phoneNumber: "0922 53 91 32",
    nationalId: "5215 9825 7451 6047",
    status: "Occupied"
  },
  {
    unitNumber: "G 11",
    tenantName: "Edelawit game zone",
    rentAmount: 20000,
    businessType: "Game zone (ከረንቡላ)",
    phoneNumber: "0936 52 03 72",
    nationalId: "2681 9621 6318 7237",
    status: "Occupied"
  },
  {
    unitNumber: "G 12",
    tenantName: "Enanaye Werku",
    rentAmount: 15000,
    businessType: "Breakfast House",
    phoneNumber: "0910 84 46 40",
    nationalId: "2814 6206 9037 4507",
    status: "Occupied"
  },
  {
    unitNumber: "G 13",
    tenantName: "Edelawit Buna",
    rentAmount: 6000,
    businessType: "Coffee & Tea",
    phoneNumber: "0936 52 03 72",
    nationalId: "2681 9621 6318 7237",
    status: "Occupied"
  },
  {
    unitNumber: "G 14",
    tenantName: "-",
    rentAmount: 0,
    businessType: "House Store / Storage",
    phoneNumber: "-",
    nationalId: "-",
    status: "Facility"
  },
  {
    unitNumber: "G 15",
    tenantName: "Mohammed Hasan",
    rentAmount: 9000,
    businessType: "Storage / Goods Keep",
    phoneNumber: "0912 96 75 89",
    nationalId: "2153 2712 0528 3073",
    status: "Occupied"
  },
  {
    unitNumber: "G 16",
    tenantName: "-",
    rentAmount: 0,
    businessType: "-",
    phoneNumber: "-",
    nationalId: "-",
    status: "Vacant"
  },
  {
    unitNumber: "G 17",
    tenantName: "Tadele Genfu",
    rentAmount: 12000,
    businessType: "Men's Hair Salon",
    phoneNumber: "0927 22 82 82",
    nationalId: "9135 1952 8469 7149",
    status: "Occupied"
  },
  {
    unitNumber: "G 18",
    tenantName: "-",
    rentAmount: 0,
    businessType: "-",
    phoneNumber: "-",
    nationalId: "-",
    status: "Vacant"
  },
  {
    unitNumber: "G 19",
    tenantName: "-",
    rentAmount: 0,
    businessType: "-",
    phoneNumber: "-",
    nationalId: "-",
    status: "Vacant"
  },
  {
    unitNumber: "G 20",
    tenantName: "Sefrash kassaye",
    rentAmount: 7500,
    businessType: "Mini cafe",
    phoneNumber: "0954 33 21 78",
    nationalId: "6104 7186 7260 2312",
    status: "Occupied"
  },
  {
    unitNumber: "G 21",
    tenantName: "abdurahib",
    rentAmount: 7000,
    businessType: "Household Goods Store",
    phoneNumber: "0911 70 87 96",
    nationalId: "-",
    status: "Occupied"
  },
  {
    unitNumber: "G 22",
    tenantName: "Wubealem Melaku",
    rentAmount: 12000,
    businessType: "Mini cafe",
    phoneNumber: "0907 67 89 76",
    nationalId: "2781 6835 1986 3853",
    status: "Occupied"
  },
  {
    unitNumber: "G 23",
    tenantName: "Belaynesh Fikre",
    rentAmount: 12000,
    businessType: "Milk House (Dairy Bar)",
    phoneNumber: "0922 14 90 32",
    nationalId: "6125 8965 3860 2356",
    status: "Occupied"
  },
  {
    unitNumber: "G 24",
    tenantName: "Mekdes Neguse",
    rentAmount: 7500,
    businessType: "Clothes Shop",
    phoneNumber: "0947 64 89 61",
    nationalId: "6508 1453 9673 6982",
    status: "Occupied"
  },
  {
    unitNumber: "G 25",
    tenantName: "Mengistu Destaw",
    rentAmount: 7500,
    businessType: "PlayStation",
    phoneNumber: "0963 32 92 69",
    nationalId: "4632 6137 9236 8975",
    status: "Occupied"
  },
  {
    unitNumber: "G 26",
    tenantName: "Elshaday alena",
    rentAmount: 7500,
    businessType: "Breakfast House",
    phoneNumber: "0925 13 45 94",
    nationalId: "003046206",
    status: "Occupied"
  },
  {
    unitNumber: "G 27",
    tenantName: "-",
    rentAmount: 0,
    businessType: "-",
    phoneNumber: "-",
    nationalId: "-",
    status: "Vacant"
  },
  {
    unitNumber: "Office",
    tenantName: "-",
    rentAmount: 0,
    businessType: "Office",
    phoneNumber: "-",
    nationalId: "-",
    status: "Facility"
  }
];

const currentYear = new Date().getFullYear();
const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
const currentMonthStr = `${currentYear}-${currentMonth}`;

// Mapped Shops for Zenebework (28 units total: 22 occupied, 4 vacant, 2 facility)
export const ZENEBEWORK_SHOPS: Shop[] = ZENEBEWORK_RAW_DATA.map((item, index) => {
  const statusLower = item.status.toLowerCase() as "occupied" | "vacant" | "facility";
  let shopName = item.businessType !== "-" ? item.businessType : `Unit ${item.unitNumber}`;
  if (item.unitNumber === "Office") {
    shopName = "Property Management Office";
  } else if (item.unitNumber === "G 14") {
    shopName = "House Store / Central Storage";
  } else if (statusLower === "vacant") {
    shopName = `Retail Unit ${item.unitNumber}`;
  }

  const tenantName = item.tenantName !== "-" ? item.tenantName : "";

  return {
    id: `zen-s-${index + 1}`,
    shopNumber: item.unitNumber,
    shopName,
    floor: "Ground",
    rentPrice: item.rentAmount,
    deposit: item.rentAmount,
    waterFee: item.rentAmount > 0 ? 150 : 0,
    electricityFee: item.rentAmount > 0 ? 250 : 0,
    description:
      statusLower === "facility"
        ? "Dedicated owner & facility operational space"
        : statusLower === "vacant"
        ? "Vacant commercial unit available for lease"
        : `${item.businessType} operated by ${item.tenantName}`,
    status: statusLower,
    tenantName,
    property: "Zenebework" as PropertyName,
  };
});

// Mapped Tenants for Zenebework (22 active rent-paying tenants, default status Unpaid)
export const ZENEBEWORK_TENANTS: Tenant[] = ZENEBEWORK_RAW_DATA
  .filter((item) => item.status === "Occupied" && item.tenantName !== "-")
  .map((item, index) => {
    return {
      id: `zen-t-${index + 1}`,
      fullName: item.tenantName,
      phoneNumber: item.phoneNumber,
      telegramUsername: "",
      email: "",
      nationalId: item.nationalId,
      businessType: item.businessType,
      shopNumber: item.unitNumber,
      startDate: `${currentYear}-01-01`,
      endDate: "",
      depositPaid: item.rentAmount,
      emergencyContact: "",
      address: `Zenebework Commercial Plaza, Unit ${item.unitNumber}, Kolfe Keranio, Addis Ababa`,
      notes: `${item.businessType} - Active commercial tenant`,
      rentAmount: item.rentAmount,
      dueDate: "ቀን 01 - 07",
      paid: false,
      lastPaymentDate: null,
      notificationId: null,
      history: [],
      property: "Zenebework" as PropertyName,
    };
  });

// Mapped Payments for Zenebework (22 active rent-paying tenants, default status unpaid, total owed 234,000 ETB)
export const ZENEBEWORK_PAYMENTS: Payment[] = ZENEBEWORK_RAW_DATA
  .filter((item) => item.status === "Occupied" && item.tenantName !== "-")
  .map((item, index) => ({
    id: `zen-pay-${index + 1}`,
    tenantId: `zen-t-${index + 1}`,
    tenantName: item.tenantName,
    shopNumber: item.unitNumber,
    monthlyRent: item.rentAmount,
    paymentMonth: currentMonthStr,
    dueDate: "ቀን 01 - 07",
    paymentDate: "",
    amountPaid: 0,
    remainingBalance: item.rentAmount,
    fine: 0,
    notes: `Monthly rent due for ${currentMonthStr} (ቀን 01 - 07)`,
    status: "unpaid" as PaymentStatus,
    createdAt: `${currentMonthStr}-01T10:00:00.000Z`,
    property: "Zenebework" as PropertyName,
  }));

// CMC property entity initialized with 0 pre-populated records (ready for landlord manual entry)
export const CMC_SHOPS: Shop[] = [];
export const CMC_TENANTS: Tenant[] = [];
export const CMC_PAYMENTS: Payment[] = [];

// Official dataset strictly scoped to Ayat property
export interface AyatUnitRaw {
  id: number;
  unitNumber: string;
  tenantName: string;
  phoneNumber: string;
  businessType: string;
  rentAmount: number;
  leasePeriod: string;
  status: "Occupied" | "Vacant" | "Facility";
}

export const AYAT_RAW_DATA: AyatUnitRaw[] = [
  {
    id: 1,
    unitNumber: "A 01",
    tenantName: "Deme Teshome Gurmessa",
    phoneNumber: "+251 91 375 5346",
    businessType: "Men's Barber Shop",
    rentAmount: 50000,
    leasePeriod: "01/12/2018 - 27/12/2020",
    status: "Occupied",
  },
  {
    id: 2,
    unitNumber: "A 02",
    tenantName: "Frehiwot Mezemer Berhanu",
    phoneNumber: "091 610 1869",
    businessType: "Traditional Herbal Smoke (Weiba Tis)",
    rentAmount: 30000,
    leasePeriod: "06/10/2018 - 08/10/2020",
    status: "Occupied",
  },
  {
    id: 3,
    unitNumber: "A 03",
    tenantName: "Genaye Fikre Gebre Senbet",
    phoneNumber: "093 268 9269",
    businessType: "Bakery & Bread Shop",
    rentAmount: 30000,
    leasePeriod: "06/10/2018 - 08/10/2020",
    status: "Occupied",
  },
];

// Mapped Shops for Ayat (3 units total: 3 occupied, 0 vacant, 0 facility, total rent: 110,000 ETB)
export const AYAT_SHOPS: Shop[] = AYAT_RAW_DATA.map((item) => {
  const statusLower = item.status.toLowerCase() as "occupied" | "vacant" | "facility";
  return {
    id: `ayt-s-${item.id}`,
    shopNumber: item.unitNumber,
    shopName: item.businessType,
    floor: "Ground",
    rentPrice: item.rentAmount,
    deposit: item.rentAmount,
    waterFee: item.rentAmount >= 50000 ? 300 : 200,
    electricityFee: item.rentAmount >= 50000 ? 450 : 300,
    description: `${item.businessType} operated by ${item.tenantName}`,
    status: statusLower,
    tenantName: item.tenantName,
    property: "Ayat" as PropertyName,
  };
});

// Mapped Tenants for Ayat (3 active rent-paying tenants, default status Unpaid, total 110,000 ETB)
export const AYAT_TENANTS: Tenant[] = AYAT_RAW_DATA.map((item) => {
  return {
    id: `ayt-t-${item.id}`,
    fullName: item.tenantName,
    phoneNumber: item.phoneNumber,
    telegramUsername: "",
    email: "",
    nationalId: "",
    businessType: item.businessType,
    shopNumber: item.unitNumber,
    startDate: "2018-10-01",
    endDate: "",
    leasePeriod: item.leasePeriod,
    depositPaid: item.rentAmount,
    emergencyContact: "",
    address: `Ayat Grand Mall & Executive Suites, Unit ${item.unitNumber}, Bole Subcity, Addis Ababa`,
    notes: `${item.businessType} - Lease Period: ${item.leasePeriod}`,
    rentAmount: item.rentAmount,
    dueDate: "ቀን 01 - 07",
    paid: false,
    lastPaymentDate: null,
    notificationId: null,
    history: [],
    property: "Ayat" as PropertyName,
  };
});

// Mapped Payments for Ayat (3 payments, total 110,000 ETB owed, default status unpaid)
export const AYAT_PAYMENTS: Payment[] = AYAT_RAW_DATA.map((item) => ({
  id: `ayt-pay-${item.id}`,
  tenantId: `ayt-t-${item.id}`,
  tenantName: item.tenantName,
  shopNumber: item.unitNumber,
  monthlyRent: item.rentAmount,
  paymentMonth: currentMonthStr,
  dueDate: "ቀን 01 - 07",
  paymentDate: "",
  amountPaid: 0,
  remainingBalance: item.rentAmount,
  fine: 0,
  notes: `Monthly rent due for ${currentMonthStr} (ቀን 01 - 07)`,
  status: "unpaid" as PaymentStatus,
  createdAt: `${currentMonthStr}-01T10:00:00.000Z`,
  property: "Ayat" as PropertyName,
}));
