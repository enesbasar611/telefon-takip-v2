# Graph Report - telefon-takip-v2  (2026-05-18)

## Corpus Check
- 406 files · ~335,805 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1829 nodes · 6817 edges · 112 communities (88 shown, 24 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `83d4502e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 107|Community 107]]

## God Nodes (most connected - your core abstractions)
1. `getShopId()` - 294 edges
2. `cn()` - 227 edges
3. `serializePrisma()` - 186 edges
4. `Button` - 145 edges
5. `DialogContent` - 85 edges
6. `Input` - 82 edges
7. `DialogHeader()` - 79 edges
8. `DialogTitle` - 79 edges
9. `Badge()` - 77 edges
10. `Label` - 69 edges

## Surprising Connections (you probably didn't know these)
- `MobileScannerSettingsPage()` --calls--> `useScanner()`  [EXTRACTED]
  src/app/(dashboard)/ayarlar/moduller/page.tsx → src/hooks/use-scanner.ts
- `CourierPage()` --calls--> `getStaff()`  [INFERRED]
  src/app/(dashboard)/kurye/page.tsx → src/lib/actions/staff-actions.ts
- `GET()` --calls--> `getShopId()`  [EXTRACTED]
  src/app/api/whatsapp/config/route.ts → src/lib/auth.ts
- `POST()` --calls--> `getShopId()`  [EXTRACTED]
  src/app/api/whatsapp/config/route.ts → src/lib/auth.ts
- `OnboardingPage()` --calls--> `cn()`  [EXTRACTED]
  src/app/onboarding/page.tsx → src/lib/utils.ts

## Communities (112 total, 24 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (105): deleteCustomer(), deleteProduct(), globalSearchAction(), deleteServiceTicket(), deleteSupplier(), AdminFormsEditor(), ShopForm(), BarcodeLabelPrintDialog() (+97 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (50): backupToDriveAction(), ensureGoogleDriveFolderAction(), ExportCategory, fullResetAction(), getExportData(), importData(), softResetAction(), transactionResetAction() (+42 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (52): clearCategoryProducts(), createCategory(), CreateCategoryData, deleteCategory(), getAllCategories, reorderCategories(), updateCategory(), UpdateCategoryData (+44 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (52): getCustomersPaginated(), getDeadStockCount(), approveShortageItem(), assignShortageBulkToCourier(), assignShortageToCourier(), deleteShortageItem(), deleteShortageItems(), finishCourierDay() (+44 more)

### Community 4 - "Community 4"
Cohesion: 0.1
Nodes (34): findCustomerByName(), findCustomerByPhone(), INDUSTRIES, BarcodeLabelPrintDialogProps, AIReport, CustomerFormValues, customerSchema, REQUIRED_FIELDS (+26 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (42): getProductMovements(), MobileSidebar(), useSupplierOrders(), CustomerInfo, DeviceExpertInfo, DeviceReceiptModal(), DeviceReceiptModalProps, FormType (+34 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (18): CreateDeviceModal, DeviceAiStockAdviceModal, DeviceHubDataProps, DeviceImportModal, DeviceMonthlySalesModal, ExpiringWarrantiesModal, DeviceAiStockAdviceModal(), DeviceAiStockAdviceModalProps (+10 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (29): CreateEventModalProps, DayDetailsModalProps, AddCustomerDialogProps, EditCustomerClientProps, DailySession, ReminderManagementProps, BulkAddProductModalProps, Category (+21 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (33): createDeviceEntry(), searchProducts, CustomerDebtPanelProps, Condition, CreateDeviceModal(), DeviceFormValues, deviceSchema, POPULAR_BRANDS (+25 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (36): sendWhatsAppAction(), updateManualTransaction(), getPOSInitialData(), createSale(), deleteSale(), deleteSales(), getSaleById(), addPartToService() (+28 more)

### Community 10 - "Community 10"
Cohesion: 0.1
Nodes (32): getProfitabilityByModel(), getProfitMatrix(), getReturnAnalytics(), getTopRepairedModels(), getAccountBalanceDetails(), getCollectionDetails(), getCriticalStockDetails(), getDailySalesDetails() (+24 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (27): CashflowChart(), CashflowChartProps, COLORS, DeviceBrandChart(), DeviceBrandChartProps, SalesTrendChart(), SalesTrendChartProps, ServiceStatusChart() (+19 more)

### Community 12 - "Community 12"
Cohesion: 0.09
Nodes (25): getLiveActivity(), DashboardClient(), DashboardClientProps, SortableItem(), WidgetConfig, DashboardContext, DashboardContextType, DashboardProvider() (+17 more)

### Community 13 - "Community 13"
Cohesion: 0.11
Nodes (32): getDebts(), getThisMonthCollected(), closeDailySession(), createAccount(), createManualTransaction(), deleteAccount(), deleteAttachment(), deleteTransaction() (+24 more)

### Community 14 - "Community 14"
Cohesion: 0.09
Nodes (29): collectDebtPayment(), collectGlobalCustomerPayment(), createDebt(), deleteCustomerPayment(), deleteDebt(), getCustomerStatement(), getDebtStatsDetails(), startTrackingDebt() (+21 more)

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (16): getCustomerById(), CustomerDetailPage(), getLoyaltyTier(), MobileScannerSettingsPage(), Notification, ServiceStatsProps, statusConfig, statusColors (+8 more)

### Community 16 - "Community 16"
Cohesion: 0.1
Nodes (23): getTopProducts(), CustomerDebtPanel(), DashboardContent(), DebtReceiptModal(), DebtReceiptModalProps, TransferModal(), cn(), parseCurrency() (+15 more)

### Community 17 - "Community 17"
Cohesion: 0.1
Nodes (24): CreateAccountModal(), CreateTransactionModalProps, TransactionFormValues, transactionSchema, formatCurrency(), Category, QuickCreateProductModalProps, QuickProductFormValues (+16 more)

### Community 18 - "Community 18"
Cohesion: 0.08
Nodes (20): metadata, BottomNav(), GlobalSearch(), ThemeProvider(), SupplierOrderContext, SupplierOrderContextType, SupplierOrderItem, SupplierOrderList (+12 more)

### Community 19 - "Community 19"
Cohesion: 0.09
Nodes (28): CreateCustomerModal(), Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners (+20 more)

### Community 20 - "Community 20"
Cohesion: 0.11
Nodes (19): getDashboardInit(), getDashboardStats(), getRecentSales(), MobileStatsHeader(), MobileStatsHeaderProps, SmartInsights(), IconMap, StatCard() (+11 more)

### Community 21 - "Community 21"
Cohesion: 0.1
Nodes (24): ensureProductBarcode(), BarcodeCopiesMode, BarcodeLabelSettings, BarcodeLabelSize, BarcodePrintItem, BarcodeProductInput, buildBarcodePrintQueue(), clampInteger() (+16 more)

### Community 22 - "Community 22"
Cohesion: 0.16
Nodes (25): getExchangeRates(), syncAllRates(), AIDiagnosticResult, AIIntentClarification, AIProductResult, AISearchFilters, AIUpdateOperation, AIUpdateResponse (+17 more)

### Community 23 - "Community 23"
Cohesion: 0.13
Nodes (20): bulkDeleteAgendaEventsAction(), clearMonthAgendaEventsAction(), completeAgendaEventAction(), createAgendaEventAction(), createRecurringAgendaEventsAction(), deleteAgendaEventAction(), getCalendarEventsAction(), realizeAgendaEventAction() (+12 more)

### Community 24 - "Community 24"
Cohesion: 0.12
Nodes (19): getReceiptSettings(), getServiceTicketById(), Barcode(), BarcodeComponent, BarcodeProps, ServiceDetailPage(), statusColors, statusLabels (+11 more)

### Community 25 - "Community 25"
Cohesion: 0.12
Nodes (19): DashboardDataContext, DashboardDataContextType, DashboardDataProvider(), DashboardSetting, useDashboardData(), DeviceDateRangeSelector(), DeviceDateRangeSelectorProps, AddDebtModal() (+11 more)

### Community 26 - "Community 26"
Cohesion: 0.16
Nodes (22): createCustomer(), createCustomerMuted(), getCustomers(), resolveCustomerForDebt(), updateCustomer(), deleteDevice(), ensureDeviceCategory(), getDeviceList() (+14 more)

### Community 27 - "Community 27"
Cohesion: 0.11
Nodes (19): createStaff(), getAllLogs(), getRoleTemplates(), getStaffLogs(), updateRoleTemplate(), getDefaultStaffPermissions(), STAFF_PERMISSION_FIELDS, STAFF_ROLE_DEFAULT_PERMISSIONS (+11 more)

### Community 28 - "Community 28"
Cohesion: 0.13
Nodes (20): adjustStockById(), applyBulkAIUpdates(), bulkCreateProducts(), checkStockAndAddShortage(), createCategory(), fixAllBarcodes(), getAllInventoryMovements(), getCriticalProducts() (+12 more)

### Community 29 - "Community 29"
Cohesion: 0.12
Nodes (18): FormFactory(), FormFactoryProps, extractCoreAndAttributes(), Category, CreateProductModalProps, ProductFormValues, productSchema, EditProductModalProps (+10 more)

### Community 30 - "Community 30"
Cohesion: 0.18
Nodes (17): getStaffShell(), DashboardLayout(), defaultAppearanceSettings, fontFamilies, getRadiusForButtonStyle(), getSafeBrandColor(), getSafeFontFamily(), getSafeFontImport() (+9 more)

### Community 31 - "Community 31"
Cohesion: 0.19
Nodes (15): dismissNotificationAction(), getSystemNotifications(), markAllNotificationsAsReadAction(), markNotificationAsReadAction(), NotificationCategory, NotificationType, SystemNotification, getServiceCounts() (+7 more)

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (13): COLOR_HOVER, COLOR_MAP, QUICK_COMMANDS, useScanner(), POSCompact(), POSInterface(), ReceiptModal(), ReceiptModalProps (+5 more)

### Community 33 - "Community 33"
Cohesion: 0.15
Nodes (18): getWhatsAppStatusAction(), generateAndCacheIndustryTemplate(), generateIndustryConfigWithAI(), onboardingAISectorAnalysis(), createShopOnboarding(), finishOnboarding(), getOnboardingAIAnalysis(), getWhatsAppStatusOnboarding() (+10 more)

### Community 34 - "Community 34"
Cohesion: 0.1
Nodes (19): 1️⃣ Document Metadata, 2️⃣ Requirement Validation Summary, 3️⃣ Coverage & Matching Metrics, 4️⃣ Key Gaps / Risks, Test TC001 Log in and land on the dashboard, Test TC002 Create a new repair ticket and see it in the device list, Test TC003 Complete an end-to-end sale and record a transaction, Test TC004 Update a device ticket status to REPAIRING and see it reflected in the list (+11 more)

### Community 35 - "Community 35"
Cohesion: 0.18
Nodes (13): updateShopModules(), IndustryBackground(), IndustryBackgroundProps, FieldDef, FieldType, industries, IndustryConfig, IndustryType (+5 more)

### Community 36 - "Community 36"
Cohesion: 0.15
Nodes (10): authOptions, createShopForGoogleUser(), ensureShopOwnerUser(), ensureSuperAdminUser(), getSession, getShopManagerPermissions(), getSuperAdminPermissions(), isShopOwnerRole() (+2 more)

### Community 37 - "Community 37"
Cohesion: 0.16
Nodes (14): orderAndAddPartToService(), AIAlertType, deleteAIAlert(), getAIAlerts(), resolveAIAlertsForProduct(), triggerAIAnalysis(), createPurchaseOrder(), createSupplier() (+6 more)

### Community 38 - "Community 38"
Cohesion: 0.17
Nodes (17): AIAnalyzeModal(), AISearchModal(), AIUpdateModal(), LayoutCustomizer(), Navbar(), getMenuItems(), Sidebar(), useUI() (+9 more)

### Community 39 - "Community 39"
Cohesion: 0.18
Nodes (10): getRecentTransactions(), Debt, ReceivablesClient(), ReceivablesClientProps, StockStats, ReceivablesStream(), RecentTransactionsStream(), RecentTransactionsStream() (+2 more)

### Community 40 - "Community 40"
Cohesion: 0.22
Nodes (10): getShopHealthAnalysis(), getCategories, getProducts, getProductsForCategorySummary, BulkAddProductModal(), CategorySummaryCards(), CategorySummaryCardsProps, StokPage() (+2 more)

### Community 41 - "Community 41"
Cohesion: 0.14
Nodes (14): app, { createServer }, cron, getLocalIps(), getPreferredIp(), handle, httpServer, io (+6 more)

### Community 42 - "Community 42"
Cohesion: 0.25
Nodes (10): getServiceTickets(), getShop, getWarrantyStats(), getIndustryLabel(), ServisListePage(), ServiceTabsController(), ServiceTabsHeader(), ServiceData() (+2 more)

### Community 43 - "Community 43"
Cohesion: 0.22
Nodes (8): getDailySession(), getDailySummary(), getTransactions(), DailySessionControl(), FinanceDashboard(), DailySessionStream(), FinancialSummaryStream(), TransactionListStream()

### Community 44 - "Community 44"
Cohesion: 0.26
Nodes (3): GET(), POST(), WhatsAppManager

### Community 45 - "Community 45"
Cohesion: 0.23
Nodes (7): saveAIIndustryConfig(), updateSetting(), LayoutCustomizerProps, Announcement, ANNOUNCEMENTS, AnnouncementsModal(), iconMap

### Community 46 - "Community 46"
Cohesion: 0.17
Nodes (11): 1. Teknik Servis Kaydı "Dönüp Durma" Sorunu (Kesin Çözüm), [2024-05-12] - Teknik Servis Kaydı ve WhatsApp Stabilizasyonu (Güncelleme), 2. Profil ve İsim Sorunları (Düzeltildi), 3. Kısayol Düzenlemeleri, Basar Teknik V2 - JOURNAL, Degisiklik Gunlugu, Gelecek Adımlar, Genel Proje Durumu (+3 more)

### Community 47 - "Community 47"
Cohesion: 0.17
Nodes (11): 🏗 1. Genel Mimari (Architecture), 🗺 2. Sayfa Haritası (Sitemap), 🧠 3. Kritik İş Mantığı (Logic), 📊 4. Veri Modeli (Prisma Schema), 🎨 5. Özel Tasarım Kuralları (Design System), 📝 6. Geliştirme Notları, Gelecek Planları, Hassas Noktalar (Caveats) (+3 more)

### Community 48 - "Community 48"
Cohesion: 0.22
Nodes (8): ActionGuideModal(), ActionGuideModalProps, Badge(), colorVariants, DashboardOnboardingClient(), DashboardOnboardingClientProps, FirstTaskCheck(), FirstTaskCheckProps

### Community 49 - "Community 49"
Cohesion: 0.22
Nodes (6): LOADING_MESSAGES, MODULES, OnboardingWizard(), OnboardingWizardProps, Step, SetupCheckProps

### Community 50 - "Community 50"
Cohesion: 0.2
Nodes (9): Acceptance criteria, Constraints, Goal, Known context, Option 1: Props Injection (Selected), Option 2: Live Hook (useQuery), Options (2), Recommendation (+1 more)

### Community 51 - "Community 51"
Cohesion: 0.22
Nodes (6): accountDetailModal, createAccountModal, createTransactionModal, dashboardPage, shortageStatusCard, statDetailModal

### Community 52 - "Community 52"
Cohesion: 0.39
Nodes (4): resendApprovalCode(), verifyApprovalCode(), sendApprovalCodeToAdmin(), transporter

### Community 53 - "Community 53"
Cohesion: 0.36
Nodes (6): getUnifiedHistory(), OperationType, UnifiedOperation, getSales(), SalesHistoryPage(), SalesHistoryClient()

### Community 54 - "Community 54"
Cohesion: 0.29
Nodes (5): cleanClass, content, files, fs, path

### Community 55 - "Community 55"
Cohesion: 0.33
Nodes (6): authMiddleware, config, isOnboardingPage, isVerifyPage, middleware(), role

### Community 56 - "Community 56"
Cohesion: 0.33
Nodes (3): directoryPath, fs, path

### Community 57 - "Community 57"
Cohesion: 0.53
Nodes (4): buildScannerUrl(), isLocalHost(), NetworkInfo, pickLanIp()

### Community 58 - "Community 58"
Cohesion: 0.4
Nodes (4): getExchangeRate(), OrderItem, PurchaseFormProps, QuickProductCreateModal()

### Community 59 - "Community 59"
Cohesion: 0.33
Nodes (3): AuraContext, AuraContextType, AuraType

### Community 61 - "Community 61"
Cohesion: 0.5
Nodes (3): JWT, Session, User

## Knowledge Gaps
- **467 isolated node(s):** `nextConfig`, `content`, `fs`, `path`, `directoryPath` (+462 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getShopId()` connect `Community 13` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 8`, `Community 9`, `Community 10`, `Community 12`, `Community 14`, `Community 15`, `Community 16`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 24`, `Community 26`, `Community 27`, `Community 28`, `Community 30`, `Community 31`, `Community 33`, `Community 35`, `Community 36`, `Community 37`, `Community 38`, `Community 39`, `Community 40`, `Community 42`, `Community 43`, `Community 44`, `Community 45`, `Community 53`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 16` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 23`, `Community 24`, `Community 25`, `Community 27`, `Community 28`, `Community 29`, `Community 30`, `Community 31`, `Community 32`, `Community 33`, `Community 38`, `Community 39`, `Community 40`, `Community 45`, `Community 48`, `Community 58`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Why does `Button` connect `Community 4` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 10`, `Community 11`, `Community 12`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 20`, `Community 22`, `Community 23`, `Community 24`, `Community 25`, `Community 27`, `Community 28`, `Community 29`, `Community 31`, `Community 32`, `Community 33`, `Community 35`, `Community 39`, `Community 43`, `Community 45`, `Community 48`, `Community 49`, `Community 58`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `getShopId()` (e.g. with `parseProductWithAI()` and `parseBulkProductsWithAI()`) actually correct?**
  _`getShopId()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nextConfig`, `content`, `fs` to the rest of the system?**
  _467 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._