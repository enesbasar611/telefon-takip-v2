# Graph Report - telefon-takip-v2  (2026-10-16)

## Corpus Check
- 533 files · ~557,104 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2624 nodes · 5851 edges · 76 communities detected
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 1087 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 142|Community 142]]
- [[_COMMUNITY_Community 143|Community 143]]

## God Nodes (most connected - your core abstractions)
1. `getShopId()` - 337 edges
2. `serializePrisma()` - 193 edges
3. `cn()` - 177 edges
4. `getUserId()` - 61 edges
5. `Badge()` - 55 edges
6. `auth` - 48 edges
7. `Input` - 45 edges
8. `Label` - 42 edges
9. `Card` - 37 edges
10. `CardContent` - 33 edges

## Surprising Connections (you probably didn't know these)
- `refreshTicket()` --calls--> `getServiceTicketById()`  [INFERRED]
  src\app\(dashboard)\sorgula\sorgula-client.tsx → src\lib\actions\service-actions.ts
- `PATCH()` --calls--> `getShopId()`  [INFERRED]
  src\app\api\customers\[id]\tax\route.ts → src\lib\auth.ts
- `GET()` --calls--> `getShopId()`  [INFERRED]
  src\app\api\edm\invoices\[id]\route.ts → src\lib\auth.ts
- `DELETE()` --calls--> `getShopId()`  [INFERRED]
  src\app\api\edm\invoices\[id]\route.ts → src\lib\auth.ts
- `GET()` --calls--> `getShopId()`  [INFERRED]
  src\app\api\whatsapp\config\route.ts → src\lib\auth.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.01
Nodes (248): bulkDeleteAgendaEventsAction(), clearMonthAgendaEventsAction(), completeAgendaEventAction(), createAgendaEventAction(), createRecurringAgendaEventsAction(), deleteAgendaEventAction(), getCalendarEventsAction(), realizeAgendaEventAction() (+240 more)

### Community 1 - "Community 1"
Cohesion: 0.01
Nodes (308): getUnifiedHistory(), getProfitabilityByModel(), getProfitMatrix(), getReturnAnalytics(), getTopRepairedModels(), clearAllActivityLogs(), getActivityLogs(), LogFilter (+300 more)

### Community 2 - "Community 2"
Cohesion: 0.02
Nodes (124): getCurrentExchangeRates(), getExchangeRates(), syncAllRates(), checkCustomerEInvoiceStatus(), createAndSendInvoice(), CreateInvoiceInput, getInvoiceViewLink(), testEdmRestLogin() (+116 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (111): dismissNotificationAction(), getBrowserNotificationPreference(), getSystemNotifications(), markAllNotificationsAsReadAction(), markNotificationAsReadAction(), NotificationCategory, NotificationType, snoozeNotificationAction() (+103 more)

### Community 4 - "Community 4"
Cohesion: 0.03
Nodes (66): createEmptyPeriod(), getSalesHistoryReport(), percentChange(), toSupportedCurrency(), getAllReceiptSettings(), getReceiptSettings(), getShopInfo(), serviceTerms (+58 more)

### Community 5 - "Community 5"
Cohesion: 0.03
Nodes (45): clearCategoryProducts(), CreateCategoryData, deleteCategory(), getAllCategories, reorderCategories(), UpdateCategoryData, CategoryAddModal(), CategoryEditModal() (+37 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (58): deleteShortageItems(), addStaffDeduction(), addStaffExpense(), approveCommission(), approveLeaveRequest(), closeFinancialPeriod(), closeStaffFinancialPeriod(), CommissionStatus (+50 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (47): deleteIndustryTemplate(), getHexColor(), getIndustryTemplates(), seedIndustryTemplates(), updateIndustryTemplate(), getDetailedExportData(), adminCreateShop(), checkSuperAdmin() (+39 more)

### Community 8 - "Community 8"
Cohesion: 0.04
Nodes (33): getCustomerById(), findCustomerByName(), findCustomerByPhone(), deleteAccount(), handleDelete(), addItem(), checkPhone(), formatProductPrice() (+25 more)

### Community 9 - "Community 9"
Cohesion: 0.04
Nodes (36): deleteEdmSettings(), disconnectEdm(), getShopEdmSettings(), saveShopEdmSettings(), getWhatsAppStatusOnboarding(), getShop, createWhatsAppTemplate(), deleteWhatsAppTemplate() (+28 more)

### Community 10 - "Community 10"
Cohesion: 0.05
Nodes (25): getCustomerStatement(), adjustDebtForReturns(), buildCustomerExportSections(), exportToCsv(), exportToExcel(), getCompletedReturns(), getExportCustomers(), getPrintableDebts() (+17 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (29): createDeviceEntry(), deleteDevice(), ensureDeviceCategory(), getDeviceById(), getDeviceList(), getExpiringDevices(), updateDeviceExpertise(), Condition (+21 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (27): backupToDriveAction(), ensureGoogleDriveFolderAction(), ExportCategory, fullResetAction(), getExportData(), importData(), sendWhatsAppAction(), softResetAction() (+19 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (30): deleteTransaction(), deleteTransactions(), updateSetting(), handleCurrencyChange(), Announcement, ANNOUNCEMENTS, useDashboardData(), useTenant() (+22 more)

### Community 14 - "Community 14"
Cohesion: 0.07
Nodes (29): getCustomersPaginated(), createMultipleReturnTickets(), IndustryBackgroundProps, FieldDef, FieldType, industries, IndustryConfig, IndustryType (+21 more)

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (37): calculateSmartReplenishment(), deleteSupplier(), emptySmartReplenishmentResult(), getCachedSmartReplenishment(), getCriticalAndOutOfStockProducts(), getPurchaseOrders(), getSmartReplenishmentData(), SmartReplenishmentResult (+29 more)

### Community 16 - "Community 16"
Cohesion: 0.07
Nodes (28): ACTIVE_RETURN_STATUSES, assignReturnToCourier(), buildActiveReturnWhere(), createReturnTicket(), getReturnTickets(), hydrateReturnTicketProductNames(), normalizeReturnProduct(), normalizeReturnRelations() (+20 more)

### Community 17 - "Community 17"
Cohesion: 0.06
Nodes (30): 1. `src/lib/edm/rest-client.ts` — EDM REST Client (Community 30, 36), 2. `src/app/api/edm/invoice/[id]/render/route.ts`, 3. `src/lib/auth.ts`, 4. `src/middleware.ts`, Bilgi Boşluk Farkındalığı, ⚠️ Bilinen Riskler, code:bash (# 1. Bağımlılıkları yükle), code:bash (# Geliştirme ortamında:) (+22 more)

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (25): Akıllı Stok Yenileme İyileştirmeleri Implementation Plan, code:ts (import {), code:ts (export interface SmartReplenishmentResult {), code:powershell (git add src/lib/actions/supplier-actions.ts src/lib/inventor), code:ts (const summary = data?.pages[0]?.summary ?? EMPTY_REPLENISHME), code:tsx (<span>Servis: {item.pendingServiceQty}</span>), code:tsx (<span className="text-[9px] uppercase tracking-widest text-m), code:powershell (git add src/components/supplier/smart-replenishment-panel.ts) (+17 more)

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (20): 1. Teknik Servis KaydÄ± "DÃ¶nÃ¼p Durma" Sorunu (Kesin Ã‡Ã¶zÃ¼m), 1. Teknik Servis Kaydı "Dönüp Durma" Sorunu (Kesin Çözüm), [2024-05-12] - Teknik Servis KaydÄ± ve WhatsApp Stabilizasyonu (GÃ¼ncelleme), [2024-05-12] - Teknik Servis Kaydı ve WhatsApp Stabilizasyonu (Güncelleme), [27.05.2026] - Sati� Ge�mi�i Mod�lerizasyonu ve Performans Optimizasyonu, [27.05.2026] - Satiş Geçmişi Modülerizasyonu ve Performans Optimizasyonu, 2. Profil ve İsim Sorunları (Düzeltildi), 2. Profil ve Ä°sim SorunlarÄ± (DÃ¼zeltildi) (+12 more)

### Community 20 - "Community 20"
Cohesion: 0.16
Nodes (16): buildBarcodePrintQueue(), clampInteger(), compactId(), compactProductName(), extractInitials(), generateProductBarcode(), getBarcodeLabelDimensions(), getCopiesForProduct() (+8 more)

### Community 21 - "Community 21"
Cohesion: 0.1
Nodes (19): 1️⃣ Document Metadata, 2️⃣ Requirement Validation Summary, 3️⃣ Coverage & Matching Metrics, 4️⃣ Key Gaps / Risks, Test TC001 Log in and land on the dashboard, Test TC002 Create a new repair ticket and see it in the device list, Test TC003 Complete an end-to-end sale and record a transaction, Test TC004 Update a device ticket status to REPAIRING and see it reflected in the list (+11 more)

### Community 22 - "Community 22"
Cohesion: 0.12
Nodes (6): normalize(), DashboardWidgetConfig, getSystemDashboardLayout(), isCollapsedDashboardLayout(), normalizeDashboardLayout(), SYSTEM_DASHBOARD_LAYOUT

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (15): Akıllı Stok Yenileme Performansı Implementation Plan, code:ts (revalidateSmartReplenishment(shopId);), code:md (- [x] 2026-07-04: Akıllı stok yenileme performans optimizasy), code:powershell ($env:TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS"}'), code:ts (export interface QuantityAggregateRow {), code:ts (import { revalidateTag } from "next/cache";), code:ts (const [sales30, sales60, sales90, serviceDemand, shortageDem), code:ts (const getCachedRecommendations = (shopId: string) =>) (+7 more)

### Community 24 - "Community 24"
Cohesion: 0.14
Nodes (14): app, { createServer }, cron, getLocalIps(), getPreferredIp(), handle, httpServer, io (+6 more)

### Community 25 - "Community 25"
Cohesion: 0.19
Nodes (5): getLiveActivity(), ActivitySkeleton(), MobileStatsSkeleton(), MobileActionGrid(), MobileActivityStream()

### Community 26 - "Community 26"
Cohesion: 0.18
Nodes (11): calculateServiceProfitAnalytics(), convertServiceProfitAnalyticsCurrency(), convertTryAmount(), roundMoney(), ServiceAnalyticsDisplayCurrency, ServiceAnalyticsPart, ServiceAnalyticsRates, ServiceAnalyticsTicket (+3 more)

### Community 27 - "Community 27"
Cohesion: 0.13
Nodes (14): Akıllı Stok Yenileme İyileştirmeleri Tasarımı, Amaç, API Sonucu ve Sayfalama, code:text (ceil(günlük satış hızı × 30)), code:text (max(0, hedef stok - mevcut stok)), Hata Yönetimi, Kabul Kriterleri, Kapsam (+6 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (3): GET(), POST(), WhatsAppManager

### Community 29 - "Community 29"
Cohesion: 0.15
Nodes (12): 1. Schema Degisikligi Yap, 2. Migration Olustur, 3. Migration Dosyalarini Kontrol Et, 4. Production'da Uygula, code:bash (npx prisma migrate dev --name <anlamli-isim>), code:bash (npx prisma migrate dev --name add_xml_xslt_fields), code:bash (npx prisma migrate deploy), Dogru Kullanim (+4 more)

### Community 30 - "Community 30"
Cohesion: 0.15
Nodes (12): Core Requirements, Goals, Initial Test Coverage, Milestones, Non-Goals, Open Questions, Overview, Problem (+4 more)

### Community 31 - "Community 31"
Cohesion: 0.17
Nodes (9): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+1 more)

### Community 32 - "Community 32"
Cohesion: 0.17
Nodes (11): 🏗 1. Genel Mimari (Architecture), 🗺 2. Sayfa Haritası (Sitemap), 🧠 3. Kritik İş Mantığı (Logic), 📊 4. Veri Modeli (Prisma Schema), 🎨 5. Özel Tasarım Kuralları (Design System), 📝 6. Geliştirme Notları, Gelecek Planları, Hassas Noktalar (Caveats) (+3 more)

### Community 33 - "Community 33"
Cohesion: 0.17
Nodes (11): Akıllı Stok Yenileme Performans Tasarımı, Amaç, Cache, Cache Geçersizleştirme, code:text (smart-replenishment-{shopId}), code:text ([smart-replenishment] slow calculation: <duration>ms), Hata Yönetimi, Kabul Kriterleri (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.29
Nodes (8): createReminderAction(), deleteReminderAction(), getReminders(), updateReminderStatusAction(), fetchReminders(), handleDelete(), handleSave(), handleToggleComplete()

### Community 35 - "Community 35"
Cohesion: 0.2
Nodes (7): accountDetailModal, createAccountModal, createTransactionModal, dashboardPage, replenishmentMutationFiles, shortageStatusCard, statDetailModal

### Community 36 - "Community 36"
Cohesion: 0.2
Nodes (9): Acceptance criteria, Constraints, Goal, Known context, Option 1: Props Injection (Selected), Option 2: Live Hook (useQuery), Options (2), Recommendation (+1 more)

### Community 37 - "Community 37"
Cohesion: 0.36
Nodes (6): clearTimer(), handleContextMenu(), handlePointerCancel(), handlePointerDown(), handlePointerMove(), handlePointerUp()

### Community 38 - "Community 38"
Cohesion: 0.28
Nodes (6): getTransactions(), buildTransactionSearchWhere(), containsSearch(), SEARCH_MODE, emptyFilter, filter

### Community 39 - "Community 39"
Cohesion: 0.22
Nodes (8): Border ve Durum Yönetimi, Fatura Kartlari (List Item) Düzeni ve Kurallari, Genel tasarim Dili ve Tipografi, Konu: /efatura Listeleme Sayfasinin Apple UI Estetiginde ve Urun Detayli Yeniden tasarlanmasi, Sag Kisim (Tutar ve Aksiyonlar), Sol Kisim (Görsel ve Bilgi Hiyerarsisi), Teknik Gereksinimler, UI/UX Tasarim ve Gelistirme Promptu

### Community 40 - "Community 40"
Cohesion: 0.25
Nodes (1): formatWithCurrency()

### Community 41 - "Community 41"
Cohesion: 0.36
Nodes (4): formatMoneyInput(), handleMoneyBlur(), handleMoneyFocus(), parseMoney()

### Community 42 - "Community 42"
Cohesion: 0.25
Nodes (2): getAllSystemAnnouncements(), SystemAnnouncementsPage()

### Community 43 - "Community 43"
Cohesion: 0.29
Nodes (4): City, getDistrictsByCity(), isValidDistrict(), TURKEY_CITIES

### Community 44 - "Community 44"
Cohesion: 0.33
Nodes (1): refreshTicket()

### Community 46 - "Community 46"
Cohesion: 0.33
Nodes (2): COLORS, DeviceBrandChartProps

### Community 48 - "Community 48"
Cohesion: 0.53
Nodes (4): buildScannerUrl(), isLocalHost(), NetworkInfo, pickLanIp()

### Community 49 - "Community 49"
Cohesion: 0.47
Nodes (3): fetchLogs(), handleClearAll(), handleSearch()

### Community 50 - "Community 50"
Cohesion: 0.33
Nodes (3): AuraContext, AuraContextType, AuraType

### Community 52 - "Community 52"
Cohesion: 0.4
Nodes (2): COLORS, TopProductsChartProps

### Community 53 - "Community 53"
Cohesion: 0.6
Nodes (3): addShortcut(), removeShortcut(), saveShortcuts()

### Community 55 - "Community 55"
Cohesion: 0.5
Nodes (2): DeviceMonthlySalesModalProps, DeviceSalesChart()

### Community 59 - "Community 59"
Cohesion: 0.4
Nodes (3): allGroupedStatuses, requiredStatuses, SERVICE_STATUS_GROUPS

### Community 60 - "Community 60"
Cohesion: 0.5
Nodes (2): prisma, { PrismaClient }

### Community 61 - "Community 61"
Cohesion: 0.5
Nodes (2): prisma, { PrismaClient }

### Community 62 - "Community 62"
Cohesion: 0.67
Nodes (3): authMiddleware, config, middleware()

### Community 65 - "Community 65"
Cohesion: 0.5
Nodes (1): CashflowChartProps

### Community 67 - "Community 67"
Cohesion: 0.67
Nodes (2): handleImport(), reset()

### Community 70 - "Community 70"
Cohesion: 0.67
Nodes (1): VERESIYE_LIVE_QUERY_OPTIONS

### Community 71 - "Community 71"
Cohesion: 0.5
Nodes (3): JWT, Session, User

### Community 72 - "Community 72"
Cohesion: 0.5
Nodes (2): providerPath, source

### Community 73 - "Community 73"
Cohesion: 0.5
Nodes (2): prisma, { PrismaClient }

### Community 74 - "Community 74"
Cohesion: 0.5
Nodes (2): prisma, { PrismaClient }

### Community 75 - "Community 75"
Cohesion: 0.5
Nodes (2): prisma, { PrismaClient }

### Community 76 - "Community 76"
Cohesion: 0.5
Nodes (3): DB & PRISMA BEST PRACTICES, KRİTİK VE KORUNACAK ALANLAR (SİLME!), Proje Durum Raporu (Antigravity'den Devam)

### Community 77 - "Community 77"
Cohesion: 0.67
Nodes (1): prisma

### Community 78 - "Community 78"
Cohesion: 0.67
Nodes (1): prisma

### Community 80 - "Community 80"
Cohesion: 1.0
Nodes (2): handleSync(), loadInvoices()

### Community 85 - "Community 85"
Cohesion: 0.67
Nodes (1): DeviceAiStockAdviceModalProps

### Community 86 - "Community 86"
Cohesion: 0.67
Nodes (1): DeviceExportButtonProps

### Community 88 - "Community 88"
Cohesion: 0.67
Nodes (1): DeviceMonthSelectorProps

### Community 92 - "Community 92"
Cohesion: 0.67
Nodes (1): ToasterProps

### Community 93 - "Community 93"
Cohesion: 0.67
Nodes (1): source

### Community 94 - "Community 94"
Cohesion: 1.0
Nodes (1): nextConfig

### Community 142 - "Community 142"
Cohesion: 1.0
Nodes (1): member

### Community 143 - "Community 143"
Cohesion: 1.0
Nodes (1): member

## Knowledge Gaps
- **558 isolated node(s):** `nextConfig`, `{ createServer }`, `{ parse }`, `next`, `{ Server }` (+553 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 40`** (8 nodes): `formatWithCurrency()`, `handleCollectPayment()`, `handleDeleteTransaction()`, `handleSelectAll()`, `handleSelectOne()`, `handleUpdateTransaction()`, `openPaymentModal()`, `customer-debt-panel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (8 nodes): `createSystemAnnouncement()`, `deleteSystemAnnouncement()`, `getActiveSystemAnnouncements()`, `getAllSystemAnnouncements()`, `toggleSystemAnnouncement()`, `SystemAnnouncementsPage()`, `page.tsx`, `system-announcement-actions.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (6 nodes): `handleCopy()`, `handleFilterChange()`, `handleFormSubmit()`, `handleWhatsApp()`, `refreshTicket()`, `sorgula-client.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (6 nodes): `COLORS`, `CustomTooltip()`, `DeviceBrandChart()`, `DeviceBrandChartProps`, `renderCustomLabel()`, `device-brand-chart.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (5 nodes): `COLORS`, `CustomTooltip()`, `TopProductsChart()`, `TopProductsChartProps`, `top-products-chart.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (5 nodes): `DeviceMonthlySalesModal()`, `DeviceMonthlySalesModalProps`, `DeviceSalesChart()`, `device-monthly-sales-modal.tsx`, `device-sales-chart.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (4 nodes): `fetch-sent.js`, `main()`, `prisma`, `{ PrismaClient }`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (4 nodes): `print-raw.js`, `main()`, `prisma`, `{ PrismaClient }`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (4 nodes): `CashflowChart()`, `CashflowChartProps`, `CustomTooltip()`, `cashflow-chart.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (4 nodes): `handleFileUpload()`, `handleImport()`, `reset()`, `device-import-modal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (4 nodes): `VERESIYE_LIVE_QUERY_OPTIONS`, `veresiye-query-options.ts`, `assert()`, `veresiye-query-options.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (4 nodes): `assert()`, `providerPath`, `source`, `query-provider-config.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (4 nodes): `check()`, `check-prisma.js`, `prisma`, `{ PrismaClient }`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (4 nodes): `checkStaff()`, `check_staff.js`, `prisma`, `{ PrismaClient }`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (4 nodes): `getShops()`, `get_shops.js`, `prisma`, `{ PrismaClient }`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (3 nodes): `main()`, `prisma`, `seed.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (3 nodes): `main()`, `prisma`, `check-invoice.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (3 nodes): `handleSync()`, `loadInvoices()`, `efatura-gelen-client.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 85`** (3 nodes): `DeviceAiStockAdviceModal()`, `DeviceAiStockAdviceModalProps`, `device-ai-stock-advice-modal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 86`** (3 nodes): `DeviceExportButton()`, `DeviceExportButtonProps`, `device-export-button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 88`** (3 nodes): `DeviceMonthSelector()`, `DeviceMonthSelectorProps`, `device-month-selector.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 92`** (3 nodes): `sonner.tsx`, `Toaster()`, `ToasterProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 93`** (3 nodes): `assert()`, `source`, `courier-item-name-render.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 94`** (2 nodes): `next.config.mjs`, `nextConfig`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 142`** (2 nodes): `test_crash.js`, `member`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 143`** (2 nodes): `test_crash_null_name.js`, `member`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getShopId()` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 25`, `Community 28`, `Community 34`, `Community 38`?**
  _High betweenness centrality (0.167) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 7`, `Community 9`, `Community 12`, `Community 13`, `Community 14`, `Community 25`, `Community 31`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `serializePrisma()` connect `Community 1` to `Community 0`, `Community 34`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 38`, `Community 8`, `Community 2`, `Community 10`, `Community 11`, `Community 7`, `Community 14`, `Community 15`, `Community 16`, `Community 25`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Are the 294 inferred relationships involving `getShopId()` (e.g. with `PersonelPage()` and `VeresiyePage()`) actually correct?**
  _`getShopId()` has 294 INFERRED edges - model-reasoned connections that need verification._
- **Are the 158 inferred relationships involving `serializePrisma()` (e.g. with `GET()` and `StatsGridStream()`) actually correct?**
  _`serializePrisma()` has 158 INFERRED edges - model-reasoned connections that need verification._
- **Are the 61 inferred relationships involving `cn()` (e.g. with `GlobalSearch()` and `AjandaPageClient()`) actually correct?**
  _`cn()` has 61 INFERRED edges - model-reasoned connections that need verification._
- **Are the 52 inferred relationships involving `getUserId()` (e.g. with `realizeAgendaEventAction()` and `recordAuditLog()`) actually correct?**
  _`getUserId()` has 52 INFERRED edges - model-reasoned connections that need verification._