# Kế Hoạch Triển Khai: Quản Lý Thông Báo & Lên Lịch Hẹn (Rental, Credit, Hụi)

> Dựa trên tài liệu backend `scheduled_notification_system.md`, dưới đây là kế hoạch chi tiết hiện thực giao diện **Quản lý Thông báo** và nút thao tác nhanh **Lên lịch hẹn** ở Frontend cho 3 module: **Rental (Cho Thuê/BĐS)**, **Credit (Tín Dụng)** và **Rosca (Hụi)**.

---

## 1. Vấn đề gặp phải

### 1.1 Chưa có giao diện Quản lý Thông báo tập trung

Backend đã cung cấp đầy đủ REST API cho Scheduled Notification tại `/api/v1/scheduled-notifications/*` (CRUD configs, toggle, test, logs). Tuy nhiên, Frontend **hoàn toàn chưa có** giao diện nào để admin/người dùng quản lý cấu hình thông báo tự động.

**Hiện trạng Sidebar các module:**

| Module | Sidebar hiện tại | Thiếu |
|--------|------------------|-------|
| **Rental** | `1-1` Quản lý BĐS, `1-2` Quản lý hợp đồng | Menu Quản lý Thông báo |
| **Credit** | `1-1` Quản lý mã vay | Menu Quản lý Thông báo |
| **Rosca** | `players` Người chơi, `list` Danh sách Hụi | Menu Quản lý Thông báo |

### 1.2 Thiếu thao tác nhanh "Lên lịch hẹn" từ danh sách

Khi đang quản lý BĐS, Hợp đồng cho thuê, Mã vay, hoặc Dây hụi — admin muốn đặt lịch thông báo **ngay tại dòng thực thể đó** mà không cần phải rời sang màn hình quản lý chung rồi gõ tay lại mã thực thể.

**Hiện trạng cột Thao tác (el-dropdown):**

| Component | Các action hiện có | Thiếu |
|-----------|-------------------|-------|
| `Rental/ContractList.vue` (dòng 100-115) | Chỉnh sửa, Xóa | Lên lịch hẹn |
| `Rental/RealEstateCards.vue` (dòng 192-203) | Chi tiết, Chỉnh sửa, Xóa | Lên lịch hẹn |
| `Credit/ContractList.vue` (dòng 178-189) | Chi tiết, Chỉnh sửa, Xóa | Lên lịch hẹn |
| `Rosca/List.vue` (dòng 154-165) | Chi tiết, Chỉnh sửa, Xóa | Lên lịch hẹn |

### 1.3 Ràng buộc thiết kế

- **Giữ nguyên 100%** format giao diện, design system (Element Plus + Tailwind CSS), màu sắc, dark mode, responsive layout
- Pattern đã có: `el-splitter` cho desktop ≥1024px, collapsed sidebar cho tablet, dropdown mobile menu cho mobile
- Cột Thao tác dùng `el-dropdown` + `MoreFilled` icon với `@command` handler

---

## 2. Ý tưởng và hướng giải quyết

### 2.1 Kiến trúc tổng quan

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        Sidebar Module (Rental / Credit / Hụi)               │
│   ├── Menu hiện tại (BĐS, Hợp đồng, Mã vay, Người chơi, Danh sách)        │
│   └── 🔔 Quản lý Thông báo  ← [THÊM MỚI]                                  │
└──────────────────────────┬───────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│            Reusable: ScheduledNotificationManagement.vue                     │
│            (nhận prop moduleKey: 'rental' | 'credit' | 'rosca')             │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Filter Bar: [Trạng thái] [Loại thông báo] [Tìm kiếm]  [+ Tạo mới]  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ el-table: STT | Nhóm TG | Loại TB | Tần suất | Giờ | Bật/Tắt | ⋮   │  │
│  │ Thao tác: [Gửi thử] [Sửa] [Xóa] [Xem Log]                          │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Pagination: el-pagination (total, sizes, prev, pager, next, jumper)  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│         Nút "Lên lịch hẹn" trong Cột Thao tác các bảng danh sách            │
│                                                                              │
│  HĐ / BĐS / Mã vay / Dây hụi ──(Click "Lên lịch hẹn")──►                   │
│       ScheduledNotificationModal.vue (Dialog)                                │
│       → Pre-fill: module_key, notify_type, reference info                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Chiến lược Component

| Component | Loại | Mục đích |
|-----------|------|----------|
| `ScheduledNotificationManagement.vue` | **Reusable View** | Màn hình CRUD chính — dùng chung cho 3 module, phân biệt bằng prop `moduleKey` |
| `ScheduledNotificationModal.vue` | **Reusable Dialog** | Form tạo/sửa config — dùng tại cả màn quản lý lẫn nút "Lên lịch hẹn" trong bảng |
| `ScheduledNotificationLogsModal.vue` | **Reusable Dialog** | Xem lịch sử log gửi thông báo của 1 config cụ thể |
| `scheduledNotificationService.ts` | **API Service** | Wrap toàn bộ REST API backend |

### 2.3 Tại sao dùng 1 Reusable Component thay vì 3 file riêng?

- Cả 3 module đều gọi **cùng API endpoint** `/api/v1/scheduled-notifications`
- Chỉ khác `module_key` filter → dùng prop phân biệt
- 1 nơi bảo trì, thêm feature mới → cả 3 module tự cập nhật
- Đảm bảo **100% nhất quán UI/UX** giữa các module

---

## 3. Plan từng giai đoạn

### Giai đoạn 1: API Service & Reusable Components (Frontend Core)

#### [NEW] `src/api/scheduledNotificationService.ts`

Service gọi REST API backend:

```typescript
// Các method chính:
getConfigs(params?: { module_key, is_enabled, notify_type })
getConfigById(id: string)
createConfig(data: ScheduledNotifyConfigPayload)
updateConfig(id: string, data: Partial<ScheduledNotifyConfigPayload>)
deleteConfig(id: string)
toggleConfig(id: string)
testConfig(id: string)
getLogs(params?: { config_id, module_key, status, start_date, end_date, search_query })
```

Pattern theo `src/api/apiConfig.ts` — dùng `getApiUrl()` + `getApiHeaders()`.

---

#### [NEW] `src/components/ScheduledNotification/ScheduledNotificationModal.vue`

Dialog form tạo/sửa config:

- **Props**: `moduleKey`, `visible`, `editData?` (null = tạo mới), `prefillData?` (từ nút "Lên lịch hẹn")
- **Form fields** (Element Plus):
  - `notify_type`: `el-select` — danh sách phụ thuộc `moduleKey`
  - `chat_id` + `group_name`: `el-input` hoặc `el-select` (gợi ý từ TG groups)
  - `schedule_type`: `el-radio-group` (Daily / Weekly / Monthly / Yearly / Specific Date)
  - `schedule_hour` + `schedule_minute`: `el-time-select`
  - `schedule_day_of_week`: `el-select` (0-6, ẩn khi không phải weekly)
  - `schedule_day_of_month`: `el-input-number` (1-31, ẩn khi không phải monthly/yearly)
  - `schedule_month`: `el-select` (1-12, ẩn khi không phải yearly)
  - `schedule_specific_date`: `el-date-picker` (ẩn khi không phải specific_date)
  - `message_template`: `el-input type="textarea"` + placeholder chip buttons
  - `is_enabled`: `el-switch`
- **Placeholder Chips**: Danh sách nút bấm chèn nhanh (`{customer_name}`, `{contract_id}`, ...) tương ứng từng module — click → insert tại cursor vào textarea
- **Validation rules**: `chat_id` required, `schedule_type` required, conditional required cho `day_of_week` / `day_of_month` / `specific_date`
- **Dark mode**: Dùng class pattern `custom-dark-dialog`, `custom-dark-input`, `highlight-select` giống `Rental/ContractList.vue`

**Bảng Placeholder theo module:**

| Module | Placeholders |
|--------|-------------|
| **Credit** | `{customer_name}`, `{customer_id}`, `{contact_info}`, `{contract_id}`, `{interest_amount}`, `{remaining_principal}`, `{interest_debt}`, `{due_date}`, `{interest_start_date}`, `{days_late}`, `{days_text}`, `{monthly_interest_rate}` |
| **Rental** | `{customer_name}`, `{customer_id}`, `{contact_info}`, `{contract_id}`, `{monthly_rental}`, `{rental_debt}`, `{real_estate_id}`, `{type_contract}`, `{start_rental}`, `{end_rental}`, `{days_late}`, `{days_text}` |
| **Rosca** | `{rosca_code}`, `{owner_name}`, `{payment_day}`, `{base_amount}`, `{min_bid}`, `{max_bid}`, `{total_parts}`, `{period_type}` |

---

#### [NEW] `src/components/ScheduledNotification/ScheduledNotificationLogsModal.vue`

Dialog xem log:

- **Props**: `configId`, `visible`
- Filter: `status` (SUCCESS / FAILED / SKIPPED), `start_date`, `end_date`
- `el-table` hiển thị: Thời gian gửi, Trạng thái (el-tag), Mã tham chiếu, Nội dung tin nhắn (show-overflow-tooltip), Lỗi (nếu có)
- Pagination giống pattern hiện tại

---

#### [NEW] `src/components/ScheduledNotification/ScheduledNotificationManagement.vue`

Màn hình CRUD chính:

- **Props**: `moduleKey: 'rental' | 'credit' | 'rosca'`
- **Filter Bar**:
  - `el-select` lọc `is_enabled` (Tất cả / Đang bật / Đã tắt)
  - `el-select` lọc `notify_type` (danh sách phụ thuộc moduleKey)
  - `el-input` tìm kiếm (group_name, chat_id)
  - `el-button` Refresh + Thêm Thông báo
- **Data Table** (`el-table`):
  - Cột: STT, Tên nhóm/Chat ID, Loại thông báo (`el-tag`), Tần suất, Thời gian gửi (HH:MM), Bật/Tắt (`el-switch` inline gọi `toggleConfig`), Thao tác
  - Thao tác `el-dropdown`: Gửi thử, Chỉnh sửa, Xem Log, Xóa (divided, red)
- **Pagination**: `el-pagination` pattern giống `ContractList.vue`
- **Styling**: 100% giống pattern `rental-container h-full flex flex-col` + `bg-white dark:bg-gray-800 rounded-lg shadow`

**Bảng notify_type options theo module:**

| Module | notify_type | Label hiển thị |
|--------|------------|----------------|
| **Credit** | `credit_interest` | 💰 Nhắc đóng lãi |
| | `credit_bad_debt` | ⚠️ Cảnh báo nợ xấu |
| | `credit_maturity` | 📅 Cảnh báo đáo hạn |
| | `credit_principal` | 💵 Nhắc đóng gốc |
| | `credit_other` | 📝 Thông báo tùy ý |
| **Rental** | `rental_payment` | 🏠 Nhắc đóng tiền thuê |
| | `rental_maintenance` | 🔧 Nhắc bảo trì |
| | `rental_contract_expiry` | 📅 Cảnh báo hết hạn HĐ |
| | `rental_deposit` | 💰 Nhắc hoàn cọc |
| | `rental_other` | 📝 Thông báo tùy ý |
| **Rosca** | `rosca_payment` | 💰 Nhắc đóng hụi |
| | `rosca_bidding` | 🎯 Nhắc khui hụi |
| | `rosca_defaulted` | ⚠️ Cảnh báo bể hụi |
| | `rosca_other` | 📝 Thông báo tùy ý |

---

### Giai đoạn 2: Tích hợp menu "Quản lý Thông báo" vào Sidebar & Index

#### [MODIFY] `src/components/Rental/Sidebar.vue`

Thêm menu-item thứ 3:

```html
<!-- Thêm sau el-menu-item index="1-2" (dòng ~24) -->
<el-menu-item index="1-3">
  <el-icon><Bell /></el-icon>
  <template #title>Quản lý Thông báo</template>
</el-menu-item>
```

Import thêm `Bell` từ `@element-plus/icons-vue`.

---

#### [MODIFY] `src/components/Rental/Index.vue`

- Import `ScheduledNotificationManagement` component
- Import icon `Bell` từ `@element-plus/icons-vue`
- Cập nhật `subviewMap`: thêm `'scheduled-notifications': '1-3'`
- Cập nhật `indexMap`: thêm `'1-3': 'scheduled-notifications'`
- Cập nhật `viewMap`: thêm `'1-3': ScheduledNotificationWrapper` (wrapper truyền `moduleKey="rental"`)
- Cập nhật `sidebarMenuItems`: thêm `{ index: '1-3', label: 'Quản lý Thông báo', icon: Bell }`
- Cập nhật `watch` route validation: cho phép `'scheduled-notifications'` subview

```typescript
// Cập nhật watch:
if (newSubview !== 'real-estate' && newSubview !== 'rental-contract' && newSubview !== 'scheduled-notifications') {
  router.replace('/rental/real-estate')
  return
}

// Cập nhật subviewMap:
const subviewMap: Record<string, string> = {
  'real-estate': '1-1',
  'rental-contract': '1-2',
  'scheduled-notifications': '1-3',    // ← THÊM
}

// Cập nhật indexMap:
const indexMap: Record<string, string> = {
  '1-1': 'real-estate',
  '1-2': 'rental-contract',
  '1-3': 'scheduled-notifications',    // ← THÊM
}

// Cập nhật viewMap: (dùng defineAsyncComponent hoặc wrapper)
const viewMap: Record<string, Component> = {
  '1-1': RealEstateTabWrapper,
  '1-2': ContractTabWrapper,
  '1-3': RentalScheduledNotifications,  // ← THÊM
}

// Cập nhật sidebarMenuItems:
const sidebarMenuItems = [
  { index: '1-1', label: 'Quản lý Bất động sản', icon: OfficeBuilding },
  { index: '1-2', label: 'Quản lý hợp đồng', icon: Files },
  { index: '1-3', label: 'Quản lý Thông báo', icon: Bell },  // ← THÊM
]
```

`RentalScheduledNotifications` là 1 wrapper component nhỏ truyền `module-key="rental"` vào `ScheduledNotificationManagement`.

---

#### [MODIFY] `src/components/Credit/Sidebar.vue`

Thêm menu-item thứ 2:

```html
<!-- Thêm sau el-menu-item index="1-1" (dòng ~19) -->
<el-menu-item index="1-2">
  <el-icon><Bell /></el-icon>
  <template #title>Quản lý Thông báo</template>
</el-menu-item>
```

---

#### [MODIFY] `src/components/Credit/Index.vue`

- Cập nhật `subviewMap`: thêm `'scheduled-notifications': '1-2'`
- Cập nhật `indexMap`: thêm `'1-2': 'scheduled-notifications'`
- Cập nhật `viewMap`: thêm `'1-2': CreditScheduledNotifications` (moduleKey="credit")
- Cập nhật `sidebarMenuItems`: thêm `{ index: '1-2', label: 'Quản lý Thông báo', icon: Bell }`
- Cập nhật `watch` route validation: cho phép `'scheduled-notifications'`

```typescript
// Cập nhật watch:
if (newSubview !== 'contract-management' && newSubview !== 'scheduled-notifications') {
  router.replace('/credit/contract-management')
  return
}

// Cập nhật subviewMap:
const subviewMap: Record<string, string> = {
  'contract-management': '1-1',
  'scheduled-notifications': '1-2',    // ← THÊM
}

// Cập nhật indexMap:
const indexMap: Record<string, string> = {
  '1-1': 'contract-management',
  '1-2': 'scheduled-notifications',    // ← THÊM
}

// Cập nhật viewMap:
const viewMap: Record<string, Component> = {
  '1-1': ContractTabWrapper,
  '1-2': CreditScheduledNotifications,  // ← THÊM
}

// Cập nhật sidebarMenuItems:
const sidebarMenuItems = [
  { index: '1-1', label: 'Quản lý mã vay', icon: Files },
  { index: '1-2', label: 'Quản lý Thông báo', icon: Bell },  // ← THÊM
]
```

---

#### [MODIFY] `src/components/Rosca/Sidebar.vue`

Thêm menu-item thứ 3:

```html
<!-- Thêm sau el-menu-item index="list" (dòng ~24) -->
<el-menu-item index="scheduled-notifications">
  <el-icon><Bell /></el-icon>
  <template #title>Quản lý Thông báo</template>
</el-menu-item>
```

---

#### [MODIFY] `src/components/Rosca/Index.vue`

- Import `ScheduledNotificationManagement`, `Bell` icon
- Thêm rendering condition tại cả 3 nơi (desktop, tablet, mobile):

```html
<ScheduledNotificationManagement v-else-if="activeMenu === 'scheduled-notifications'" module-key="rosca" />
```

- Cập nhật `watch` route validation: cho phép `'scheduled-notifications'`
- Cập nhật `sidebarMenuItems`: thêm `{ index: 'scheduled-notifications', label: 'Quản lý Thông báo', icon: Bell }`

```typescript
// Cập nhật watch:
if (!['players', 'list', 'scheduled-notifications'].includes(newSubview as string)) {
  router.replace('/rosca/players')
  return
}

// Cập nhật sidebarMenuItems:
const sidebarMenuItems = [
  { index: 'players', label: 'Người chơi', icon: User },
  { index: 'list', label: 'Danh sách Hụi', icon: List },
  { index: 'scheduled-notifications', label: 'Quản lý Thông báo', icon: Bell },  // ← THÊM
]
```

---

### Giai đoạn 3: Thêm nút "Lên lịch hẹn" vào cột Thao tác

#### [MODIFY] `src/components/Rental/ContractList.vue`

Trong `el-dropdown-menu` (dòng ~108-111), thêm **trước** `"delete"`:

```html
<el-dropdown-item command="schedule">🔔 Lên lịch hẹn</el-dropdown-item>
```

Trong `handleCommand` (dòng ~441-447), thêm xử lý:

```typescript
else if (cmd === 'schedule') {
  openScheduleDialog(row)
}
```

`openScheduleDialog(row)` → mở `ScheduledNotificationModal` với prefill:
- `module_key: 'rental'`
- `notify_type: 'rental_payment'`
- `message_template` chứa `{contract_id}` = row.contract_id, `{customer_name}` = row.customer_name

---

#### [MODIFY] `src/components/Rental/RealEstateCards.vue`

Thêm `<el-dropdown-item command="schedule">🔔 Lên lịch hẹn</el-dropdown-item>` vào **cả 2 dropdown**:
- Desktop table view (dòng ~197-201)
- Mobile card view (dòng ~251-255)

Prefill: `module_key: 'rental'`, `notify_type: 'rental_maintenance'`, `real_estate_id` từ row.

> ⚠️ **Lưu ý**: File `RealEstateCards.vue` có **2 dropdown**: 1 cho desktop table view (dòng ~192), 1 cho mobile card view (dòng ~246). Cần thêm vào **cả 2 nơi**.

---

#### [MODIFY] `src/components/Credit/ContractList.vue`

Thêm dropdown-item + handleCommand tương tự Rental, prefill:
- `module_key: 'credit'`
- `notify_type: 'credit_interest'`
- `contract_id`, `customer_name` từ row

---

#### [MODIFY] `src/components/Rosca/List.vue`

Thêm dropdown-item + handleCommand tương tự, prefill:
- `module_key: 'rosca'`
- `notify_type: 'rosca_payment'`
- `rosca_code` từ row

> ⚠️ **Lưu ý**: File `Rosca/List.vue` cũng có **2 dropdown**: 1 cho desktop table (dòng ~154), 1 cho mobile card (dòng ~206). Cần thêm vào **cả 2 nơi**.

---

### Giai đoạn 4: Polish, Responsive & Dark Mode Verification

- Kiểm tra tất cả component mới trên 3 breakpoint: Mobile (<768px), Tablet (768-1024px), Desktop (≥1024px)
- Kiểm tra dark mode toggle hoạt động đúng trên tất cả dialog, form, table
- Kiểm tra sidebar collapse/expand khi resize
- Kiểm tra routing: truy cập trực tiếp URL `/rental/scheduled-notifications`, `/credit/scheduled-notifications`, `/rosca/scheduled-notifications` phải hiển thị đúng

---

## Tổng hợp file thay đổi

| File | Loại | Giai đoạn |
|------|------|-----------|
| `src/api/scheduledNotificationService.ts` | **NEW** | GĐ1 |
| `src/components/ScheduledNotification/ScheduledNotificationModal.vue` | **NEW** | GĐ1 |
| `src/components/ScheduledNotification/ScheduledNotificationLogsModal.vue` | **NEW** | GĐ1 |
| `src/components/ScheduledNotification/ScheduledNotificationManagement.vue` | **NEW** | GĐ1 |
| `src/components/Rental/Sidebar.vue` | **MODIFY** | GĐ2 |
| `src/components/Rental/Index.vue` | **MODIFY** | GĐ2 |
| `src/components/Credit/Sidebar.vue` | **MODIFY** | GĐ2 |
| `src/components/Credit/Index.vue` | **MODIFY** | GĐ2 |
| `src/components/Rosca/Sidebar.vue` | **MODIFY** | GĐ2 |
| `src/components/Rosca/Index.vue` | **MODIFY** | GĐ2 |
| `src/components/Rental/ContractList.vue` | **MODIFY** | GĐ3 |
| `src/components/Rental/RealEstateCards.vue` | **MODIFY** | GĐ3 |
| `src/components/Credit/ContractList.vue` | **MODIFY** | GĐ3 |
| `src/components/Rosca/List.vue` | **MODIFY** | GĐ3 |

> **4 file mới** + **10 file sửa đổi** = 14 file tổng cộng

---

## 4. Testing và kiểm thử

### 4.1 Test Routing & Sidebar

| Test case | Expected |
|-----------|----------|
| Truy cập `/rental/scheduled-notifications` | Hiển thị đúng ScheduledNotificationManagement với moduleKey="rental" |
| Truy cập `/credit/scheduled-notifications` | Hiển thị đúng với moduleKey="credit" |
| Truy cập `/rosca/scheduled-notifications` | Hiển thị đúng với moduleKey="rosca" |
| Click menu "Quản lý Thông báo" trong sidebar | URL đổi đúng, content area render đúng component |
| Truy cập URL không hợp lệ `/rental/invalid-subview` | Redirect về `/rental/real-estate` |

### 4.2 Test CRUD Config

| Test case | Expected |
|-----------|----------|
| Bấm "+ Tạo mới", để trống `chat_id` → Submit | Hiện validation error: "Vui lòng nhập Chat ID" |
| Chọn schedule_type = `weekly` | Hiện thêm ô chọn `schedule_day_of_week`, ẩn `day_of_month` |
| Chọn schedule_type = `monthly` | Hiện thêm ô chọn `schedule_day_of_month`, ẩn `day_of_week` |
| Chọn schedule_type = `specific_date` | Hiện ô `el-date-picker`, ẩn day_of_week + day_of_month |
| Tạo config mới → Submit | Gọi POST API thành công, bảng refresh, hiện ElMessage.success |
| Bấm "Chỉnh sửa" → Đổi giờ gửi → Submit | Gọi PUT API, bảng refresh |
| Bấm "Xóa" → Confirm | Gọi DELETE API, dòng biến mất, hiện success message |

### 4.3 Test Toggle & Test Send

| Test case | Expected |
|-----------|----------|
| Toggle switch `is_enabled` | Gọi PATCH `/toggle`, switch cập nhật real-time |
| Bấm "Gửi thử" | Gọi POST `/test`, hiện loading → kết quả SUCCESS/FAILED trong ElMessage |
| Bấm "Xem Log" | Mở LogsModal, hiển thị bảng log với pagination |

### 4.4 Test nút "Lên lịch hẹn"

| Test case | Expected |
|-----------|----------|
| Rental ContractList → "Lên lịch hẹn" | Modal mở, `module_key=rental`, `notify_type=rental_payment`, pre-fill `contract_id` + `customer_name` |
| RealEstateCards → "Lên lịch hẹn" | Modal mở, `module_key=rental`, `notify_type=rental_maintenance`, pre-fill `real_estate_id` |
| Credit ContractList → "Lên lịch hẹn" | Modal mở, `module_key=credit`, `notify_type=credit_interest`, pre-fill contract info |
| Rosca List → "Lên lịch hẹn" | Modal mở, `module_key=rosca`, `notify_type=rosca_payment`, pre-fill rosca_code |

### 4.5 Test Responsive & Dark Mode

| Test case | Expected |
|-----------|----------|
| Desktop ≥1024px | el-splitter layout, sidebar mở rộng, bảng full-width |
| Tablet 768-1023px | Sidebar thu gọn (chỉ icon), content full |
| Mobile <768px | Dropdown menu mobile, bảng có scroll ngang |
| Dark mode ON | Tất cả dialog, form, table, tag, switch đổi sang dark theme đúng |

---

## 5. Đánh giá rủi ro và phản biện

### 5.1 Rủi ro kỹ thuật

| Rủi ro | Mức độ | Giải pháp |
|--------|--------|-----------|
| **Chat ID Telegram không hợp lệ** | 🟡 TB | Nút "Gửi thử" cho phép kiểm tra trước khi bật. Validate format `-100...` phía frontend. |
| **Sai cú pháp Placeholder trong Message Template** | 🟡 TB | Cung cấp nút chip bấm chèn `{customer_name}`, `{contract_id}`,... tránh gõ tay sai chính tả. Backend có safe fallback nếu placeholder thiếu. |
| **Route conflict khi thêm subview mới** | 🟢 Thấp | Cập nhật chính xác `watch(() => route.params.subview)` tại mỗi `Index.vue`. Đã xác minh pattern redirect hiện tại. |
| **Import cycle / bundle size** | 🟢 Thấp | Reusable components nằm trong folder riêng `ScheduledNotification/`, chỉ import khi cần. |
| **Backend API chưa deploy** | 🟡 TB | Test với mock data trước. Service layer tách biệt → dễ swap mock ↔ real API. |

### 5.2 Rủi ro vận hành

| Rủi ro | Mức độ | Giải pháp |
|--------|--------|-----------|
| **Backward compatibility sidebar** | 🟢 Thấp | Chỉ **thêm** menu-item mới, KHÔNG sửa/xóa menu hiện tại. Index mapping cũ giữ nguyên. |
| **Dark mode không đồng bộ** | 🟢 Thấp | Dùng 100% Element Plus components + Tailwind `dark:` class → tự động theo `html.dark`. |
| **Sidebar collapse hiển thị sai icon** | 🟢 Thấp | Icon `Bell` từ Element Plus Icons đã hỗ trợ collapsed mode giống `OfficeBuilding`, `Files`. |

### 5.3 Phản biện và trả lời

#### ❓ "Tại sao dùng chung 1 Component Reusable cho 3 module thay vì 3 file riêng?"

**Trả lời**: Cả 3 module đều gọi cùng API endpoint `/api/v1/scheduled-notifications`, chỉ khác tham số filter `module_key`. Dùng 1 Reusable Component:
- Giảm 67% code lặp
- Bảo trì 1 nơi — thêm feature tự áp dụng 3 module
- Đảm bảo 100% nhất quán UI/UX

#### ❓ "Modal 'Lên lịch hẹn' từ bảng danh sách — dùng lại Modal từ màn quản lý hay tạo riêng?"

**Trả lời**: **Dùng lại** `ScheduledNotificationModal.vue`. Khi gọi từ bảng danh sách, truyền thêm `prefillData` prop để tự động điền sẵn thông tin thực thể (contract_id, customer_name, rosca_code,...). Không cần tạo Modal riêng — tránh duplicate code.

#### ❓ "Có ảnh hưởng đến hiệu năng khi thêm component mới?"

**Trả lời**: Không đáng kể:
- Component chỉ render khi user navigate đến subview "Quản lý Thông báo"
- Dialog chỉ mount khi mở (Element Plus `destroy-on-close`)
- API call chỉ khi vào màn hình hoặc click action — không polling

---

## Phụ lục: Cấu trúc file sau khi hoàn thành

```
src/
├── api/
│   ├── apiConfig.ts                              (existing)
│   ├── rentalService.ts                           (existing)
│   ├── creditService.ts                           (existing)
│   ├── roscaService.ts                            (existing)
│   └── scheduledNotificationService.ts            ← [NEW]
├── components/
│   ├── ScheduledNotification/                     ← [NEW FOLDER]
│   │   ├── ScheduledNotificationManagement.vue    ← [NEW] Màn hình CRUD chính
│   │   ├── ScheduledNotificationModal.vue         ← [NEW] Dialog tạo/sửa config
│   │   └── ScheduledNotificationLogsModal.vue     ← [NEW] Dialog xem log
│   ├── Rental/
│   │   ├── Sidebar.vue                            ← [MODIFY] Thêm menu Thông báo
│   │   ├── Index.vue                              ← [MODIFY] Thêm subview + routing
│   │   ├── ContractList.vue                       ← [MODIFY] Thêm "Lên lịch hẹn"
│   │   └── RealEstateCards.vue                    ← [MODIFY] Thêm "Lên lịch hẹn"
│   ├── Credit/
│   │   ├── Sidebar.vue                            ← [MODIFY] Thêm menu Thông báo
│   │   ├── Index.vue                              ← [MODIFY] Thêm subview + routing
│   │   └── ContractList.vue                       ← [MODIFY] Thêm "Lên lịch hẹn"
│   └── Rosca/
│       ├── Sidebar.vue                            ← [MODIFY] Thêm menu Thông báo
│       ├── Index.vue                              ← [MODIFY] Thêm subview + routing
│       └── List.vue                               ← [MODIFY] Thêm "Lên lịch hẹn"
└── ...
```
