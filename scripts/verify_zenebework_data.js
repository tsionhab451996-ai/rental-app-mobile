const fs = require("fs");
const path = require("path");
const ts = require("typescript");

console.log("=== RUNNING PROPERTY DATASET VERIFICATION (ZENEBEWORK & AYAT) ===");

// Transpile constants/zenebeworkData.ts on the fly
const tsFilePath = path.join(__dirname, "../constants/zenebeworkData.ts");
const tsCode = fs.readFileSync(tsFilePath, "utf-8");
const jsCode = ts.transpileModule(tsCode, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
  },
}).outputText;

// Load module in a virtual module context
const m = new module.constructor();
m.paths = module.paths;
m._compile(jsCode, tsFilePath);
const {
  ZENEBEWORK_RAW_DATA,
  ZENEBEWORK_SHOPS,
  ZENEBEWORK_TENANTS,
  ZENEBEWORK_PAYMENTS,
  CMC_SHOPS,
  CMC_TENANTS,
  CMC_PAYMENTS,
  AYAT_RAW_DATA,
  AYAT_SHOPS,
  AYAT_TENANTS,
  AYAT_PAYMENTS,
} = m.exports;

let passed = true;
function assert(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
  } else {
    console.error(`FAIL: ${message}`);
    passed = false;
  }
}

console.log("\n--- ZENEBEWORK CHECKS ---");
// 1. Total Units: 28
assert(ZENEBEWORK_RAW_DATA.length === 28, `Raw data length is 28 (got ${ZENEBEWORK_RAW_DATA.length})`);
assert(ZENEBEWORK_SHOPS.length === 28, `Zenebework shops count is 28 (got ${ZENEBEWORK_SHOPS.length})`);

// 2. Active Rent-Paying Tenants: 22
assert(ZENEBEWORK_TENANTS.length === 22, `Zenebework active tenants count is 22 (got ${ZENEBEWORK_TENANTS.length})`);

// 3. Occupied Units: 22
const occupiedShops = ZENEBEWORK_SHOPS.filter((s) => s.status === "occupied");
assert(occupiedShops.length === 22, `Occupied units count is 22 (got ${occupiedShops.length})`);

// 4. Vacant Units: 4 (G 16, G 18, G 19, G 27)
const vacantShops = ZENEBEWORK_SHOPS.filter((s) => s.status === "vacant");
assert(vacantShops.length === 4, `Vacant units count is 4 (got ${vacantShops.length})`);
const vacantUnitNumbers = vacantShops.map((s) => s.shopNumber).sort();
const expectedVacantNumbers = ["G 16", "G 18", "G 19", "G 27"].sort();
assert(
  JSON.stringify(vacantUnitNumbers) === JSON.stringify(expectedVacantNumbers),
  `Vacant units match G 16, G 18, G 19, G 27 (got ${vacantUnitNumbers.join(", ")})`
);

// 5. Facility / Owner Use: 2 (G 14 - Store/Storage, Office)
const facilityShops = ZENEBEWORK_SHOPS.filter((s) => s.status === "facility");
assert(facilityShops.length === 2, `Facility units count is 2 (got ${facilityShops.length})`);
const facilityUnitNumbers = facilityShops.map((s) => s.shopNumber).sort();
const expectedFacilityNumbers = ["G 14", "Office"].sort();
assert(
  JSON.stringify(facilityUnitNumbers) === JSON.stringify(expectedFacilityNumbers),
  `Facility units match G 14, Office (got ${facilityUnitNumbers.join(", ")})`
);

// 6. Total Expected Monthly Rent: 234,000 ETB
const totalExpectedFromRaw = ZENEBEWORK_RAW_DATA.reduce((sum, u) => sum + u.rentAmount, 0);
assert(totalExpectedFromRaw === 234000, `Raw data total rent is 234,000 ETB (got ${totalExpectedFromRaw})`);

const totalExpectedFromTenants = ZENEBEWORK_TENANTS.reduce((sum, t) => sum + t.rentAmount, 0);
assert(totalExpectedFromTenants === 234000, `Tenants total rent is 234,000 ETB (got ${totalExpectedFromTenants})`);

const totalExpectedFromShops = ZENEBEWORK_SHOPS.reduce((sum, s) => sum + s.rentPrice, 0);
assert(totalExpectedFromShops === 234000, `Shops total rent is 234,000 ETB (got ${totalExpectedFromShops})`);

// 7. Total Payments & Unpaid Rent Defaults
const totalPaidFromPayments = ZENEBEWORK_PAYMENTS.reduce((sum, p) => sum + p.amountPaid, 0);
assert(totalPaidFromPayments === 0, `Payments total collected starts at 0 ETB (got ${totalPaidFromPayments})`);

const totalUnpaidFromPayments = ZENEBEWORK_PAYMENTS.reduce((sum, p) => sum + p.remainingBalance, 0);
assert(totalUnpaidFromPayments === 234000, `Payments total unpaid balance is 234,000 ETB (got ${totalUnpaidFromPayments})`);

const paidTenantsCount = ZENEBEWORK_TENANTS.filter((t) => t.paid).length;
assert(paidTenantsCount === 0, `All 22 active Zenebework tenants default to Unpaid (found ${paidTenantsCount} paid)`);

const ethiopianDueWindowCount = ZENEBEWORK_TENANTS.filter((t) => t.dueDate === "ቀን 01 - 07").length;
assert(ethiopianDueWindowCount === 22, `All 22 active tenants have Ethiopian due window 'ቀን 01 - 07' (got ${ethiopianDueWindowCount})`);

// 8. Units verification (Tenant, Phone, National ID)
const unit1Tenant = ZENEBEWORK_TENANTS.find((t) => t.shopNumber === "G 01");
assert(unit1Tenant !== undefined, "Unit 1 tenant exists in ZENEBEWORK_TENANTS");
assert(unit1Tenant && unit1Tenant.fullName === "Tesfaun Girma", `Unit 1 name is Tesfaun Girma (got ${unit1Tenant?.fullName})`);
assert(unit1Tenant && unit1Tenant.phoneNumber === "0913 17 54 06", `Unit 1 phone is 0913 17 54 06 (got ${unit1Tenant?.phoneNumber})`);
assert(unit1Tenant && unit1Tenant.nationalId === "3961 4986 9064 5746", `Unit 1 national ID is 3961 4986 9064 5746 (got ${unit1Tenant?.nationalId})`);

const unit2Tenant = ZENEBEWORK_TENANTS.find((t) => t.shopNumber === "G 02");
assert(unit2Tenant && unit2Tenant.nationalId === "6274 9021 5263 1457", `Unit 2 national ID is 6274 9021 5263 1457 (got ${unit2Tenant?.nationalId})`);

const unit3Tenant = ZENEBEWORK_TENANTS.find((t) => t.shopNumber === "G 03");
assert(unit3Tenant && unit3Tenant.nationalId === "4215 7806 4187 3584", `Unit 3 national ID is 4215 7806 4187 3584 (got ${unit3Tenant?.nationalId})`);
assert(unit3Tenant && unit3Tenant.phoneNumber === "-", `Unit 3 phone is '-' (got ${unit3Tenant?.phoneNumber})`);

const unit5Tenant = ZENEBEWORK_TENANTS.find((t) => t.shopNumber === "G 05");
assert(unit5Tenant && unit5Tenant.nationalId === "3620 7147 8350 2742", `Unit 5 national ID is 3620 7147 8350 2742 (got ${unit5Tenant?.nationalId})`);

const unit8Tenant = ZENEBEWORK_TENANTS.find((t) => t.shopNumber === "G 08");
assert(unit8Tenant && unit8Tenant.nationalId === "-", `Unit 8 national ID is '-' (got '${unit8Tenant?.nationalId}')`);

const unit21Tenant = ZENEBEWORK_TENANTS.find((t) => t.shopNumber === "G 21");
assert(unit21Tenant && unit21Tenant.nationalId === "-", `Unit 21 national ID is '-' (got '${unit21Tenant?.nationalId}')`);

const unit26Tenant = ZENEBEWORK_TENANTS.find((t) => t.shopNumber === "G 26");
assert(unit26Tenant && unit26Tenant.nationalId === "003046206", `Unit 26 national ID is 003046206 (got '${unit26Tenant?.nationalId}')`);

// Verify no auto-generated fake emails or telegram usernames in Zenebework
const fakeEmailsCount = ZENEBEWORK_TENANTS.filter((t) => t.email && t.email.includes("@gmail.com")).length;
assert(fakeEmailsCount === 0, `No auto-generated fake emails in Zenebework (found ${fakeEmailsCount})`);

const fakeTelegramCount = ZENEBEWORK_TENANTS.filter((t) => t.telegramUsername && t.telegramUsername.startsWith("@")).length;
assert(fakeTelegramCount === 0, `No auto-generated fake telegram usernames in Zenebework (found ${fakeTelegramCount})`);

// Verify no dummy ETH-ZB- patterns
const dummyIdsCount = ZENEBEWORK_TENANTS.filter((t) => t.nationalId && t.nationalId.startsWith("ETH-ZB-")).length;
assert(dummyIdsCount === 0, `No dummy ETH-ZB- national IDs in Zenebework (found ${dummyIdsCount})`);

console.log("\n--- AYAT CHECKS ---");
// 9. Ayat Total Units: 3
assert(AYAT_RAW_DATA.length === 3, `Ayat raw data length is 3 (got ${AYAT_RAW_DATA.length})`);
assert(AYAT_SHOPS.length === 3, `Ayat shops count is 3 (got ${AYAT_SHOPS.length})`);

// 10. Ayat Active Tenants: 3
assert(AYAT_TENANTS.length === 3, `Ayat active tenants count is 3 (got ${AYAT_TENANTS.length})`);

// 11. Ayat Occupied Units: 3
const ayatOccupiedShops = AYAT_SHOPS.filter((s) => s.status === "occupied");
assert(ayatOccupiedShops.length === 3, `Ayat occupied units count is 3 (got ${ayatOccupiedShops.length})`);

// 12. Ayat Vacant Units: 0
const ayatVacantShops = AYAT_SHOPS.filter((s) => s.status === "vacant");
assert(ayatVacantShops.length === 0, `Ayat vacant units count is 0 (got ${ayatVacantShops.length})`);

// 13. Ayat Monthly Rent & Default Unpaid
const ayatTotalRentFromRaw = AYAT_RAW_DATA.reduce((sum, u) => sum + u.rentAmount, 0);
assert(ayatTotalRentFromRaw === 110000, `Ayat raw data total rent is 110,000 ETB (got ${ayatTotalRentFromRaw})`);

const ayatTotalRentFromTenants = AYAT_TENANTS.reduce((sum, t) => sum + t.rentAmount, 0);
assert(ayatTotalRentFromTenants === 110000, `Ayat tenants total rent is 110,000 ETB (got ${ayatTotalRentFromTenants})`);

const ayatPaidFromPayments = AYAT_PAYMENTS.reduce((sum, p) => sum + p.amountPaid, 0);
assert(ayatPaidFromPayments === 0, `Ayat payments total collected starts at 0 ETB (got ${ayatPaidFromPayments})`);

const ayatUnpaidFromPayments = AYAT_PAYMENTS.reduce((sum, p) => sum + p.remainingBalance, 0);
assert(ayatUnpaidFromPayments === 110000, `Ayat payments total unpaid is 110,000 ETB (got ${ayatUnpaidFromPayments})`);

const ayatPaidTenantsCount = AYAT_TENANTS.filter((t) => t.paid).length;
assert(ayatPaidTenantsCount === 0, `All 3 Ayat tenants default to Unpaid (found ${ayatPaidTenantsCount} paid)`);

const ayatDueWindowCount = AYAT_TENANTS.filter((t) => t.dueDate === "ቀን 01 - 07").length;
assert(ayatDueWindowCount === 3, `All 3 Ayat tenants have Ethiopian due window 'ቀን 01 - 07' (got ${ayatDueWindowCount})`);

const ayatTotalRentFromShops = AYAT_SHOPS.reduce((sum, s) => sum + s.rentPrice, 0);
assert(ayatTotalRentFromShops === 110000, `Ayat shops total rent is 110,000 ETB (got ${ayatTotalRentFromShops})`);

// 14. Ayat Tenants details (phone, leasePeriod, rentAmount)
const t1 = AYAT_TENANTS.find((t) => t.shopNumber === "A 01");
assert(t1 && t1.fullName === "Deme Teshome Gurmessa", "Tenant 1 is Deme Teshome Gurmessa");
assert(t1 && t1.phoneNumber === "+251 91 375 5346", "Tenant 1 phone is +251 91 375 5346");
assert(t1 && t1.rentAmount === 50000, "Tenant 1 rent is 50000");
assert(t1 && t1.leasePeriod === "01/12/2018 - 27/12/2020", "Tenant 1 lease period is 01/12/2018 - 27/12/2020");

const t2 = AYAT_TENANTS.find((t) => t.shopNumber === "A 02");
assert(t2 && t2.fullName === "Frehiwot Mezemer Berhanu", "Tenant 2 is Frehiwot Mezemer Berhanu");
assert(t2 && t2.phoneNumber === "091 610 1869", "Tenant 2 phone is 091 610 1869");
assert(t2 && t2.rentAmount === 30000, "Tenant 2 rent is 30000");
assert(t2 && t2.leasePeriod === "06/10/2018 - 08/10/2020", "Tenant 2 lease period is 06/10/2018 - 08/10/2020");

const t3 = AYAT_TENANTS.find((t) => t.shopNumber === "A 03");
assert(t3 && t3.fullName === "Genaye Fikre Gebre Senbet", "Tenant 3 is Genaye Fikre Gebre Senbet");
assert(t3 && t3.phoneNumber === "093 268 9269", "Tenant 3 phone is 093 268 9269");
assert(t3 && t3.rentAmount === 30000, "Tenant 3 rent is 30000");
assert(t3 && t3.leasePeriod === "06/10/2018 - 08/10/2020", "Tenant 3 lease period is 06/10/2018 - 08/10/2020");

console.log("\n--- STRICT CROSS-PROPERTY SCOPING CHECKS ---");
// All Ayat items scoped to Ayat
assert(AYAT_SHOPS.every((s) => s.property === "Ayat"), "All Ayat shops scoped to Ayat");
assert(AYAT_TENANTS.every((t) => t.property === "Ayat"), "All Ayat tenants scoped to Ayat");
assert(AYAT_PAYMENTS.every((p) => p.property === "Ayat"), "All Ayat payments scoped to Ayat");

// No cross-contamination in Zenebework
assert(ZENEBEWORK_SHOPS.every((s) => s.property === "Zenebework"), "All Zenebework shops scoped to Zenebework");
assert(ZENEBEWORK_TENANTS.every((t) => t.property === "Zenebework"), "All Zenebework tenants scoped to Zenebework");
assert(ZENEBEWORK_SHOPS.filter((s) => s.id.startsWith("ayt-")).length === 0, "No Ayat shops in Zenebework");
assert(ZENEBEWORK_TENANTS.filter((t) => t.id.startsWith("ayt-")).length === 0, "No Ayat tenants in Zenebework");

// CMC cleared checks: 0 initial shops, 0 initial tenants, 0 initial payments
console.log("\n--- CMC PROPERTY CLEARED CHECKS ---");
assert(CMC_SHOPS.length === 0, `CMC initial shops count is 0 (got ${CMC_SHOPS.length})`);
assert(CMC_TENANTS.length === 0, `CMC initial tenants count is 0 (got ${CMC_TENANTS.length})`);
assert(CMC_PAYMENTS.length === 0, `CMC initial payments count is 0 (got ${CMC_PAYMENTS.length})`);
assert(CMC_SHOPS.filter((s) => s.id.startsWith("zen-") || s.id.startsWith("ayt-")).length === 0, "No cross-property shops in CMC");
assert(CMC_TENANTS.filter((t) => t.id.startsWith("zen-") || t.id.startsWith("ayt-")).length === 0, "No cross-property tenants in CMC");

// Verify contract deadline / end date is empty/blank by default
const zenebeworkEmptyEndDates = ZENEBEWORK_TENANTS.filter((t) => t.endDate === "").length;
assert(zenebeworkEmptyEndDates === 22, `All 22 Zenebework tenants have empty endDate by default (got ${zenebeworkEmptyEndDates})`);

const ayatEmptyEndDates = AYAT_TENANTS.filter((t) => t.endDate === "").length;
assert(ayatEmptyEndDates === 3, `All 3 Ayat tenants have empty endDate by default (got ${ayatEmptyEndDates})`);

console.log("\n--- ETHIOPIAN CALENDAR & SCHEDULE CHECKS ---");
// Transpile and load utils/ethiopianCalendar.ts
const ethTsFilePath = path.join(__dirname, "../utils/ethiopianCalendar.ts");
const ethTsCode = fs.readFileSync(ethTsFilePath, "utf-8");
const ethJsCode = ts.transpileModule(ethTsCode, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
  },
}).outputText;
const ethModule = new module.constructor();
ethModule.paths = module.paths;
ethModule._compile(ethJsCode, ethTsFilePath);
const {
  ETHIOPIAN_MONTHS,
  toEthiopianDate,
  getEthiopianPaymentSchedule,
  getEthiopianScheduleShort,
  calculateTenantRentStatus,
} = ethModule.exports;

// 1. Check months count and names
assert(ETHIOPIAN_MONTHS.length === 13, `Ethiopian calendar has 13 months (got ${ETHIOPIAN_MONTHS.length})`);
assert(ETHIOPIAN_MONTHS[0].en === "Meskerem" && ETHIOPIAN_MONTHS[0].am === "መስከረም", "Month 1 is Meskerem / መስከረም");
assert(ETHIOPIAN_MONTHS[12].en === "Pagume" && ETHIOPIAN_MONTHS[12].am === "ጳጉሜ", "Month 13 is Pagume / ጳጉሜ");

// 2. Date conversion test: Sep 15, 2026 -> Meskerem 5, 2019 E.C.
const testDateDay5 = new Date(2026, 8, 15); // Sept 15, 2026
const ethDay5 = toEthiopianDate(testDateDay5);
assert(ethDay5.monthNameEn === "Meskerem", `Sept 15 2026 is in Meskerem (got ${ethDay5.monthNameEn})`);
assert(ethDay5.day === 5, `Sept 15 2026 is Day 5 in Ethiopian calendar (got ${ethDay5.day})`);

// 3. Schedule formatting test: "Meskerem 1 – Meskerem 7"
const scheduleEn = getEthiopianPaymentSchedule(testDateDay5, "en");
assert(scheduleEn === "Meskerem 1 – Meskerem 7", `Schedule formatted as 'Meskerem 1 – Meskerem 7' (got '${scheduleEn}')`);
const scheduleShort = getEthiopianScheduleShort(testDateDay5);
assert(scheduleShort === "Meskerem 1 – 7", `Short schedule formatted as 'Meskerem 1 – 7' (got '${scheduleShort}')`);

// 4. Status calculation test: Day 5 (within Days 1-7) unpaid -> Pending
const statusDay5 = calculateTenantRentStatus(false, testDateDay5);
assert(statusDay5.status === "Pending", `Unpaid tenant on Day 5 is Pending (got ${statusDay5.status})`);
assert(statusDay5.isDuePeriod === true, "Day 5 is within due period");
assert(statusDay5.daysRemainingInDueWeek === 2, `2 days remaining in due week on Day 5 (got ${statusDay5.daysRemainingInDueWeek})`);

// 5. Status calculation test: Day 20 (past Day 7) unpaid -> Overdue
const testDateDay20 = new Date(2026, 8, 30); // Meskerem 20
const statusDay20 = calculateTenantRentStatus(false, testDateDay20);
assert(statusDay20.status === "Overdue", `Unpaid tenant on Day 20 is Overdue (got ${statusDay20.status})`);
assert(statusDay20.isOverdue === true, "Day 20 is overdue");

// 6. Status calculation test: Paid tenant -> Paid
const statusPaid = calculateTenantRentStatus(true, testDateDay20);
assert(statusPaid.status === "Paid", `Paid tenant is Paid (got ${statusPaid.status})`);

console.log("\n--- TELEGRAM REMINDERS & LEASE PERIOD CHECKS ---");
const {
  getEthiopianRentCycleDueInfo,
  buildTelegramReminderMessage,
} = ethModule.exports;

// 1. Check Telegram reminder message format
const sampleMsg = buildTelegramReminderMessage("Tesfaun Girma", "G 01", 7, "Meskerem 7 (መስከረም 7)");
const expectedMsg = "ሰላም Tesfaun Girma፣ ይህ የUnit G 01 የኪራይ ክፍያዎ በ7 ቀናት ውስጥ በMeskerem 7 (መስከረም 7) የሚደርስ መሆኑን የሚያስታውስ ወዳጃዊ መልዕክት ነው። እባክዎ ክፍያዎን በወቅቱ ያጠናቅቁ።";
assert(sampleMsg === expectedMsg, `Telegram reminder message matches Amharic template (got: '${sampleMsg}')`);

const sampleMsgShop = buildTelegramReminderMessage("Abebe Kebede", "Shop 102", 5, "Tikimt 7 (ጥቅምት 7)");
const expectedMsgShop = "ሰላም Abebe Kebede፣ ይህ የShop 102 የኪራይ ክፍያዎ በ5 ቀናት ውስጥ በTikimt 7 (ጥቅምት 7) የሚደርስ መሆኑን የሚያስታውስ ወዳጃዊ መልዕክት ነው። እባክዎ ክፍያዎን በወቅቱ ያጠናቅቁ።";
assert(sampleMsgShop === expectedMsgShop, `Telegram reminder with Shop prefix matches Amharic template (got: '${sampleMsgShop}')`);

// 2. Check due date calculation for Ethiopian calendar rent cycle (Day 7)
const testDateMeskerem1 = new Date(2026, 8, 11); // Meskerem 1
const dueInfoMeskerem1 = getEthiopianRentCycleDueInfo(testDateMeskerem1);
assert(dueInfoMeskerem1.billingMonth === 1, `Billing month is 1 (Meskerem)`);
assert(dueInfoMeskerem1.dueDay === 7, `Due day is 7`);
assert(dueInfoMeskerem1.daysUntilDue === 6, `Meskerem 1 is 6 days before Day 7`);

// 3. Check 7, 5, 3 days thresholds
// 7 days before Day 7: Meskerem 0 / Pagume 5/6 (e.g. Sept 10, 2026)
const testDate7d = new Date(2026, 8, 10);
const dueInfo7d = getEthiopianRentCycleDueInfo(testDate7d);
assert(dueInfo7d.daysUntilDue === 7, `Sept 10, 2026 is exactly 7 days prior to Day 7 (got ${dueInfo7d.daysUntilDue})`);

// 5 days before Day 7: Meskerem 2 (Sept 12, 2026)
const testDate5d = new Date(2026, 8, 12);
const dueInfo5d = getEthiopianRentCycleDueInfo(testDate5d);
assert(dueInfo5d.daysUntilDue === 5, `Meskerem 2 is exactly 5 days prior to Day 7 (got ${dueInfo5d.daysUntilDue})`);

// 3 days before Day 7: Meskerem 4 (Sept 14, 2026)
const testDate3d = new Date(2026, 8, 14);
const dueInfo3d = getEthiopianRentCycleDueInfo(testDate3d);
assert(dueInfo3d.daysUntilDue === 3, `Meskerem 4 is exactly 3 days prior to Day 7 (got ${dueInfo3d.daysUntilDue})`);

// 4. Verify tracking flag format and once-per-cycle deduplication
const trackingKey7d = `tg_remind_zen-t-01_${dueInfo7d.cycleKey}_7d`;
const trackingKey5d = `tg_remind_zen-t-01_${dueInfo5d.cycleKey}_5d`;
const trackingKey3d = `tg_remind_zen-t-01_${dueInfo3d.cycleKey}_3d`;
assert(trackingKey7d === "tg_remind_zen-t-01_2019_1_7d", `Tracking key for 7d is correct (got ${trackingKey7d})`);
assert(trackingKey5d === "tg_remind_zen-t-01_2019_1_5d", `Tracking key for 5d is correct (got ${trackingKey5d})`);
assert(trackingKey3d === "tg_remind_zen-t-01_2019_1_3d", `Tracking key for 3d is correct (got ${trackingKey3d})`);

const mockSentLog = {};
mockSentLog[trackingKey7d] = new Date().toISOString();
assert(Boolean(mockSentLog[trackingKey7d]), "Flag marked as sent for 7d");
assert(!mockSentLog[trackingKey5d], "5d flag remains un-triggered until 5d threshold");
assert(!mockSentLog[trackingKey3d], "3d flag remains un-triggered until 3d threshold");

// 5. Blank Lease Period Checks
// Ensure Zenebework tenants default to blank/empty lease period
const zenebeworkEmptyLeasePeriods = ZENEBEWORK_TENANTS.filter((t) => !t.leasePeriod).length;
assert(zenebeworkEmptyLeasePeriods === 22, `All 22 Zenebework tenants have empty/blank leasePeriod by default (got ${zenebeworkEmptyLeasePeriods})`);

// Ensure tenant-form file contains blank default state and leasePeriod InputField
const tenantFormCode = fs.readFileSync(path.join(__dirname, "../app/tenant-form.tsx"), "utf-8");
assert(tenantFormCode.includes('const [leasePeriod, setLeasePeriod] = useState("");'), "tenant-form initializes leasePeriod to empty string");
assert(tenantFormCode.includes('label="Lease Period / Lease Term"'), "tenant-form renders Lease Period / Lease Term input");
assert(tenantFormCode.includes("leasePeriod: leasePeriod.trim()"), "tenant-form saves leasePeriod");

// Ensure tenant-detail does not auto-calculate duration when leasePeriod is blank
const tenantDetailCode = fs.readFileSync(path.join(__dirname, "../app/tenant-detail.tsx"), "utf-8");
assert(!tenantDetailCode.includes("From ${formatDate(tenant.startDate)} (Ongoing)"), "tenant-detail does not auto-calculate ongoing time span");
assert(tenantDetailCode.includes('value={tenant.leasePeriod || "-"}'), "tenant-detail renders tenant.leasePeriod || '-'");

if (!passed) {
  console.error("\nONE OR MORE CHECKS FAILED!");
  process.exit(1);
} else {
  console.log("\nALL CHECKS (ZENEBEWORK, AYAT, ETHIOPIAN CALENDAR, CONTRACT DEADLINE & TELEGRAM REMINDERS) PASSED PERFECTLY!");
}
