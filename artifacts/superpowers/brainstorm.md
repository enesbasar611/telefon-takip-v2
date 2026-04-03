## Goal
Fix incorrect hardcoded service data on the Notifications page and refactor the sidebar widgets (Pending Approvals, Delayed Services, Device Tracking) to be dynamic, accurate, and actionable.

## Constraints
- **Tech Stack**: Next.js Server Components for initial data, Client Components for interaction.
- **Consistency**: Maintain the "Google Aura" visual style (high-fidelity feedback).
- **Performance**: Minimize database queries; reuse existing session notifications.

## Known context
- `BildirimlerPage` fetches `getSystemNotifications`.
- `NotificationSidebar` currently has hardcoded stats: `TS-2024-001` (Delayed Alert) and `24 Cihaz Onarımda` (Device Count).
- `getServiceCounts()` provides the real active repair count.
- `DELIVERY_TIME` and `PENDING_APPROVAL` are real notification types ready to be used.

## Risks
- **Data Desync**: Sidebar data must match the main feed's state.
- **Visual Noise**: Sidebar should collapse or simplify when no urgent items exist.

## Options (2)
### Option 1: Props Injection (Selected)
- **Summary**: Fetch `getServiceCounts()` in `BildirimlerPage` and pass as props to `NotificationSidebar`.
- **Pros**: Zero "shimmering", fast initial load.
- **Cons**: Static until full page refresh.

### Option 2: Live Hook (useQuery)
- **Summary**: Use React Query for live sidebar stats.
- **Pros**: Independent updates.
- **Cons**: Extra network round-trip on first load.

## Recommendation
I recommend **Option 1 (Props)** for the initial fix to immediately resolve the "wrong data" issue, as it's the most efficient for the current dashboard architecture.

## Acceptance criteria
- [ ] "24 Cihaz Onarımda" replaced with real data from `getServiceCounts().active`.
- [ ] "Gecikmiş Servis" widget only renders if actual `DELIVERY_TIME` notifications exist.
- [ ] "Hızlandır" button navigates to the specific delayed ticket.
- [ ] Device Tracking progress bar reflects the real `Active / (Active + Done)` ratio.
- [ ] Pending Approval cards use real cost and phone phone data.
