# Graph Report - telefon-takip-v2  (2026-05-12)

## Corpus Check
- 421 files · ~323,057 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1700 nodes · 6387 edges · 114 communities (95 shown, 19 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3a23f9c2`
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
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 94|Community 94]]

## God Nodes (most connected - your core abstractions)
1. `getShopId()` - 285 edges
2. `serializePrisma()` - 182 edges
3. `Button` - 142 edges
4. `cn()` - 138 edges
5. `DialogContent` - 85 edges
6. `Input` - 81 edges
7. `DialogTitle` - 79 edges
8. `DialogHeader()` - 78 edges
9. `Badge()` - 74 edges
10. `Label` - 69 edges

## Surprising Connections (you probably didn't know these)
- `CourierPage()` --calls--> `getStaff()`  [INFERRED]
  src/app/(dashboard)/kurye/page.tsx → src/lib/actions/staff-actions.ts
- `Toaster()` --calls--> `useToast()`  [EXTRACTED]
  src/components/ui/toaster.tsx → src/hooks/use-toast.ts
- `ensureDeviceCategory()` --calls--> `getShopId()`  [EXTRACTED]
  src/lib/actions/device-hub-actions.ts → src/lib/auth.ts
- `deleteAttachment()` --calls--> `getShopId()`  [EXTRACTED]
  src/lib/actions/finance-actions.ts → src/lib/auth.ts
- `parseProductWithAI()` --calls--> `getShopId()`  [INFERRED]
  src/lib/actions/gemini-actions.ts → src/lib/auth.ts

## Communities (114 total, 19 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (53): getAccounts(), validateGeminiKeyAction(), AVAILABLE_MODULES, INDUSTRIES, DayDetailsModalProps, BarcodeLabelPrintDialogProps, FormFactoryProps, EditCustomerClientProps (+45 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (35): CreateEventModalProps, AIReport, CourierDashboardClientProps, CustomerFormValues, customerSchema, DeviceAiStockAdviceModalProps, DeviceMonthlySalesModalProps, DeviceSalesChart() (+27 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (55): clearCategoryProducts(), createCategory(), CreateCategoryData, deleteCategory(), reorderCategories(), updateCategory(), UpdateCategoryData, createCustomer() (+47 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (46): getExchangeRates(), syncAllRates(), AIDiagnosticResult, AIIntentClarification, AIProductResult, AISearchFilters, AIUpdateOperation, AIUpdateResponse (+38 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (41): getCustomerById(), getReceiptSettings(), getShopInfo(), serviceTerms, updateReceiptSettings(), getServiceTicketById(), Barcode(), BarcodeComponent (+33 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (42): closeDailySession(), getOrCreateKasaAccount(), getPOSInitialData(), getAllReceiptSettings(), getSaleById(), addServiceLogWithNote(), assignTechnician(), createServiceTicket() (+34 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (41): deleteIndustryTemplate(), getHexColor(), getIndustryTemplates(), seedIndustryTemplates(), updateIndustryTemplate(), updateShopModules(), adminCreateShop(), checkSuperAdmin() (+33 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (37): backupToDriveAction(), ensureGoogleDriveFolderAction(), ExportCategory, fullResetAction(), getExportData(), importData(), softResetAction(), transactionResetAction() (+29 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (36): getWhatsAppStatusAction(), sendWhatsAppAction(), collectDebtPayment(), collectGlobalCustomerPayment(), createDebt(), deleteCustomerPayment(), deleteDebt(), getCustomerStatement() (+28 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (33): getDeadStockCount(), addPartToService(), addShortageItem(), addShortageItems(), approveShortageItem(), assignShortageBulkToCourier(), assignShortageToCourier(), deleteShortageItem() (+25 more)

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (24): cn(), CustomerListClient(), Props, DeviceActionsColumn(), DeviceActionsColumnProps, Account, TransferModal(), useDebounce() (+16 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (27): getProfitabilityByModel(), getProfitMatrix(), getReturnAnalytics(), getTopRepairedModels(), findCustomerByName(), getDashboardInit(), getDashboardStats(), getRecentSales() (+19 more)

### Community 13 - "Community 13"
Cohesion: 0.09
Nodes (17): AddCustomerDialogProps, statusConfig, CATEGORIES, SupplierFormValues, supplierSchema, CATEGORIES, EditSupplierModalProps, SupplierFormValues (+9 more)

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (21): deleteProduct(), AdminFormsEditor(), ConfigEditor(), ShopForm(), BarcodeLabelPrintDialog(), CustomerTableProps, ProductTableProps, ServiceTabsControllerProps (+13 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (18): getLiveActivity(), ActivitySkeleton(), ChartSkeleton(), ListSkeleton(), MobileStatsSkeleton(), StatsSkeleton(), LiveClock(), MobileActionGrid() (+10 more)

### Community 16 - "Community 16"
Cohesion: 0.17
Nodes (13): statusColors, Notification, ServicePartManager(), ServiceStatsProps, statusColors, statusLabels, IconMap, Card (+5 more)

### Community 17 - "Community 17"
Cohesion: 0.16
Nodes (22): deleteServiceTicket(), WhatsAppConfirmModal(), WhatsAppConfirmModalProps, getIndustryLabel(), formatPhone(), EditProductModal(), ServiceDetailActions(), ServiceDetailActionsProps (+14 more)

### Community 18 - "Community 18"
Cohesion: 0.1
Nodes (20): createAccount(), createManualTransaction(), deleteAccount(), deleteAttachment(), deleteTransaction(), deleteTransactions(), getAccountAnalytics(), getDailySession() (+12 more)

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (23): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+15 more)

### Community 20 - "Community 20"
Cohesion: 0.13
Nodes (20): bulkDeleteAgendaEventsAction(), clearMonthAgendaEventsAction(), completeAgendaEventAction(), createAgendaEventAction(), createRecurringAgendaEventsAction(), deleteAgendaEventAction(), getCalendarEventsAction(), realizeAgendaEventAction() (+12 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (21): COLOR_HOVER, COLOR_MAP, GlobalSearch(), QUICK_COMMANDS, useScanner(), getInventoryFormFields(), formatCurrency(), parseCurrency() (+13 more)

### Community 22 - "Community 22"
Cohesion: 0.1
Nodes (22): BarcodeCopiesMode, BarcodeLabelSettings, BarcodeLabelSize, BarcodePrintItem, BarcodeProductInput, buildBarcodePrintQueue(), clampInteger(), compactId() (+14 more)

### Community 23 - "Community 23"
Cohesion: 0.12
Nodes (14): CustomerDebtPanelProps, AddDebtModalProps, DebtDraftItem, DebtReceiptModal(), DebtReceiptModalProps, cn(), Category, CategoryItemProps (+6 more)

### Community 24 - "Community 24"
Cohesion: 0.1
Nodes (14): CashflowChart(), CashflowChartProps, COLORS, DeviceBrandChart(), DeviceBrandChartProps, COLORS, TopProductsChart(), TopProductsChartProps (+6 more)

### Community 25 - "Community 25"
Cohesion: 0.15
Nodes (13): REQUIRED_FIELDS, CHECKLIST_ITEMS, ServiceAIModal(), ServiceAIModalProps, ServiceDetailsModalProps, statusConfig, AddReturnModalProps, InitialReturnItem (+5 more)

### Community 26 - "Community 26"
Cohesion: 0.18
Nodes (17): getStaffShell(), DashboardContent(), DashboardLayout(), defaultAppearanceSettings, fontFamilies, getRadiusForButtonStyle(), getSafeBrandColor(), getSafeFontFamily() (+9 more)

### Community 27 - "Community 27"
Cohesion: 0.11
Nodes (19): AICategoryNode, addInventoryStock(), updateSetting(), AIAnalyzeModal(), AISearchModal(), AIUpdateModal(), LayoutCustomizer(), LayoutCustomizerProps (+11 more)

### Community 28 - "Community 28"
Cohesion: 0.12
Nodes (18): CreateCustomerModal(), CustomerTable(), AccountList(), AddDebtModal(), CreateTransactionModal(), FinansClient(), Summary, Transaction (+10 more)

### Community 29 - "Community 29"
Cohesion: 0.13
Nodes (14): getDeviceList(), getExpiringDevices(), DeviceHubData(), DeviceHubDataProps, DeviceAiStockAdviceModal(), DeviceExportButton(), DeviceExportButtonProps, DeviceImportModal() (+6 more)

### Community 30 - "Community 30"
Cohesion: 0.2
Nodes (15): dismissNotificationAction(), getSystemNotifications(), markAllNotificationsAsReadAction(), markNotificationAsReadAction(), NotificationCategory, NotificationType, SystemNotification, getServiceCounts() (+7 more)

### Community 31 - "Community 31"
Cohesion: 0.13
Nodes (11): metadata, BottomNav(), ThemeProvider(), ShortageProvider(), ProgressBarProvider(), NextAuthProvider(), SocketContext, SocketContextType (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (14): getProductMovements(), useSupplierOrders(), ProductDetailDrawer(), SupplierPickerRow(), SupplierOrderListsPanel(), SupplierOrderListsPanelProps, TedarikcilerPageClient(), SheetContent (+6 more)

### Community 33 - "Community 33"
Cohesion: 0.15
Nodes (15): orderAndAddPartToService(), AIAlertType, deleteAIAlert(), getAIAlerts(), resolveAIAlertsForProduct(), triggerAIAnalysis(), createPurchaseOrder(), createSupplier() (+7 more)

### Community 34 - "Community 34"
Cohesion: 0.1
Nodes (19): 1️⃣ Document Metadata, 2️⃣ Requirement Validation Summary, 3️⃣ Coverage & Matching Metrics, 4️⃣ Key Gaps / Risks, Test TC001 Log in and land on the dashboard, Test TC002 Create a new repair ticket and see it in the device list, Test TC003 Complete an end-to-end sale and record a transaction, Test TC004 Update a device ticket status to REPAIRING and see it reflected in the list (+11 more)

### Community 35 - "Community 35"
Cohesion: 0.15
Nodes (13): Condition, CreateDeviceModal(), DeviceFormValues, deviceSchema, POPULAR_BRANDS, WARRANTY_MONTHS_OPTIONS, Condition, deviceSchema (+5 more)

### Community 36 - "Community 36"
Cohesion: 0.11
Nodes (12): FLAT_AVAILABLE, iconMap, QuickShortcuts(), Shortcut, SHORTCUT_GROUPS, CurrencyConverterModalProps, BulkAddProductModalProps, Category (+4 more)

### Community 37 - "Community 37"
Cohesion: 0.18
Nodes (13): MobileSidebar(), ModeToggle(), DashboardDataContext, DashboardDataContextType, DashboardDataProvider(), useDashboardData(), CurrencyDisplay(), CurrencyPopover() (+5 more)

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (15): checkStaffDeletion(), createStaff(), getAllLogs(), getRoleTemplates(), getStaff(), getStaffLogs(), getStaffPerformance(), updatePassword() (+7 more)

### Community 39 - "Community 39"
Cohesion: 0.15
Nodes (10): SalesTrendChart(), SalesTrendChartProps, ServiceStatusChart(), ServiceStatusChartProps, statusColors, statusLabels, LiveActivityFeed(), ServiceStatusStream() (+2 more)

### Community 40 - "Community 40"
Cohesion: 0.14
Nodes (14): app, { createServer }, cron, getLocalIps(), getPreferredIp(), handle, httpServer, io (+6 more)

### Community 41 - "Community 41"
Cohesion: 0.18
Nodes (13): CreateSupplierModal(), EditSupplierModal(), MalKabulModal(), PurchaseForm(), PurchaseOrderDetailModal(), SupplierAnalysisModal(), SupplierPaymentHistoryModal(), SupplierPaymentModal() (+5 more)

### Community 42 - "Community 42"
Cohesion: 0.17
Nodes (9): CreateStaffModal(), StaffFormValues, staffSchema, StaffDeleteModal(), StaffManagementClientProps, StaffMember, Avatar, AvatarFallback (+1 more)

### Community 43 - "Community 43"
Cohesion: 0.26
Nodes (11): getCashflowReport(), getDashboardStats(), getDetailedExportData(), getDeviceBrandDistribution(), getSalesReport(), getServiceMetrics(), getTopProductsReport(), RaporlarData() (+3 more)

### Community 44 - "Community 44"
Cohesion: 0.19
Nodes (9): getInventoryStats(), Debt, ReceivablesClientProps, IconMap, StockDashboardMetrics(), StockStats, StockMetricsStream(), RevealFinancial() (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.2
Nodes (9): Debt, VeresiyeClientProps, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioItem, DropdownMenuSubContent, DropdownMenuSubTrigger (+1 more)

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (8): getAllCategories(), getSales(), SalesHistoryPage(), KategorilerPage(), CategoryManagementClient(), SalesHistoryClient(), PageHeader(), PageHeaderProps

### Community 47 - "Community 47"
Cohesion: 0.21
Nodes (9): updateDashboardLayout(), DashboardClient(), DashboardClientProps, WidgetConfig, DashboardContext, DashboardContextType, DashboardProvider(), useDashboard() (+1 more)

### Community 48 - "Community 48"
Cohesion: 0.22
Nodes (10): findCustomerByPhone(), FormFactory(), extractCoreAndAttributes(), getIndustryAccessories(), getServiceFormFields(), CreateServiceModal(), CreateServiceModalProps, PatternLock() (+2 more)

### Community 49 - "Community 49"
Cohesion: 0.26
Nodes (5): globalSearchAction(), getDeterministicColor(), getInitials(), GroupedShortage, ShortageStatusCard()

### Community 50 - "Community 50"
Cohesion: 0.17
Nodes (11): 🏗 1. Genel Mimari (Architecture), 🗺 2. Sayfa Haritası (Sitemap), 🧠 3. Kritik İş Mantığı (Logic), 📊 4. Veri Modeli (Prisma Schema), 🎨 5. Özel Tasarım Kuralları (Design System), 📝 6. Geliştirme Notları, Gelecek Planları, Hassas Noktalar (Caveats) (+3 more)

### Community 51 - "Community 51"
Cohesion: 0.24
Nodes (6): getProductsForCategorySummary, BulkAddProductModal(), CategorySummaryCards(), CategorySummaryCardsProps, StokPage(), CategorySummaryStream()

### Community 52 - "Community 52"
Cohesion: 0.22
Nodes (8): searchProducts, Category, QuickCreateProductModal(), QuickCreateProductModalProps, QuickProductFormValues, quickProductSchema, AddShortageForm(), AddShortageFormProps

### Community 53 - "Community 53"
Cohesion: 0.33
Nodes (8): getProfile(), getMenuItems(), Sidebar(), DashboardContentData(), getIndustryConfig(), isModuleEnabled(), BorderBeam(), BorderBeamProps

### Community 54 - "Community 54"
Cohesion: 0.2
Nodes (9): Acceptance criteria, Constraints, Goal, Known context, Option 1: Props Injection (Selected), Option 2: Live Hook (useQuery), Options (2), Recommendation (+1 more)

### Community 55 - "Community 55"
Cohesion: 0.29
Nodes (5): cleanClass, content, files, fs, path

### Community 56 - "Community 56"
Cohesion: 0.29
Nodes (6): SupplierOrderContext, SupplierOrderContextType, SupplierOrderItem, SupplierOrderList, SupplierOrderProvider(), SupplierOrders

### Community 58 - "Community 58"
Cohesion: 0.33
Nodes (3): directoryPath, fs, path

### Community 59 - "Community 59"
Cohesion: 0.33
Nodes (4): AlertItem, CriticalProduct, Supplier, SupplierAnalysisModalProps

### Community 60 - "Community 60"
Cohesion: 0.47
Nodes (4): Announcement, ANNOUNCEMENTS, AnnouncementsModal(), iconMap

### Community 61 - "Community 61"
Cohesion: 0.53
Nodes (4): buildScannerUrl(), isLocalHost(), NetworkInfo, pickLanIp()

### Community 62 - "Community 62"
Cohesion: 0.53
Nodes (4): getDeadStockProducts(), getPendingProcurement(), getReadyDevices(), SmartInsights()

### Community 63 - "Community 63"
Cohesion: 0.33
Nodes (3): AuraContext, AuraContextType, AuraType

### Community 64 - "Community 64"
Cohesion: 0.4
Nodes (4): config, isOnboardingPage, isVerifyPage, role

### Community 65 - "Community 65"
Cohesion: 0.5
Nodes (3): DeviceDateRangeSelector(), DeviceDateRangeSelectorProps, PopoverContent

### Community 66 - "Community 66"
Cohesion: 0.5
Nodes (3): getCustomersPaginated(), CustomersData(), Props

### Community 67 - "Community 67"
Cohesion: 0.6
Nodes (4): getAllInventoryMovements(), getCriticalProducts(), StokHareketleriPage(), StockMovementsClient()

### Community 68 - "Community 68"
Cohesion: 0.5
Nodes (4): getReturnTickets(), metadata, ReturnsPage(), ReturnsClient()

### Community 71 - "Community 71"
Cohesion: 0.5
Nodes (3): JWT, Session, User

## Knowledge Gaps
- **416 isolated node(s):** `prisma`, `nextConfig`, `fs`, `path`, `directoryPath` (+411 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getShopId()` connect `Community 8` to `Community 0`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 9`, `Community 12`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 20`, `Community 26`, `Community 27`, `Community 29`, `Community 30`, `Community 32`, `Community 33`, `Community 38`, `Community 43`, `Community 44`, `Community 46`, `Community 47`, `Community 48`, `Community 49`, `Community 53`, `Community 62`, `Community 66`, `Community 67`, `Community 68`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 23` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 6`, `Community 7`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 19`, `Community 20`, `Community 21`, `Community 24`, `Community 25`, `Community 26`, `Community 27`, `Community 28`, `Community 30`, `Community 31`, `Community 32`, `Community 36`, `Community 37`, `Community 39`, `Community 41`, `Community 42`, `Community 44`, `Community 45`, `Community 47`, `Community 48`, `Community 49`, `Community 52`, `Community 53`, `Community 59`, `Community 60`, `Community 62`, `Community 65`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `serializePrisma()` connect `Community 12` to `Community 0`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 8`, `Community 9`, `Community 15`, `Community 16`, `Community 18`, `Community 20`, `Community 29`, `Community 30`, `Community 32`, `Community 33`, `Community 38`, `Community 39`, `Community 43`, `Community 44`, `Community 46`, `Community 48`, `Community 49`, `Community 51`, `Community 53`, `Community 62`, `Community 66`, `Community 67`, `Community 68`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `getShopId()` (e.g. with `parseProductWithAI()` and `parseBulkProductsWithAI()`) actually correct?**
  _`getShopId()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `prisma`, `nextConfig`, `fs` to the rest of the system?**
  _416 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._