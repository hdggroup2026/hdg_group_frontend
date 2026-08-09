# Hệ Thống Cấu Hình Thông Báo Lên Lịch (Scheduled Notification Config)

> Gửi thông báo tự động đến nhóm Telegram theo `chat_id` chỉ định, với lịch trình cấu hình linh hoạt (hàng tuần, hàng tháng, hàng năm, hoặc ngày cụ thể). Áp dụng cho **Rental**, **Credit**, **Hụi (Rosca)**.

---

## 1. Vấn đề gặp phải

### 1.1 Hiện trạng hệ thống

Hệ thống hiện tại có **15 async worker** chạy nền trong `bot/utils/scheduler.py` (150KB, 2843 dòng), được khởi tạo qua `asyncio.create_task()` trong `app/main.py`:

| Worker | Chức năng | Cách cấu hình |
|--------|-----------|---------------|
| `bad_debt_notification_worker` | Cảnh báo nợ xấu Credit | Hardcode logic: quá hạn 7 ngày |
| `interest_payment_notification_worker` | Nhắc đóng lãi Credit | Hardcode: ngày `interest_start_date.day` hàng tháng |
| `rental_payment_notification_worker` | Nhắc đóng tiền thuê | Hardcode: ngày `start_rental.day` hàng tháng, 0-7 ngày |
| `rosca_payment_notification_worker` | Nhắc đóng hụi | Hardcode: `payment_day` + `bidding_time` |
| `checkin_reminder_worker` | Nhắc chấm công | Hardcode: sau giờ start_time 30 phút |
| `document_reminder_worker` | Nhắc giấy tờ xe | Hardcode |
| 9 worker khác | Báo cáo tổng hợp hàng ngày/tháng | Cấu hình qua `appsettings.json` → `Scheduler` section |

### 1.2 Các vấn đề cốt lõi

#### ❌ P1: Hardcode hoàn toàn – Không thể tùy chỉnh lịch gửi

Mỗi worker đều **hardcode** logic thời gian chạy bên trong vòng lặp `while True`. Ví dụ:

```python
# rental_payment_notification_worker (line 1190)
cfg = settings.SCHEDULER_RENTAL
if now.hour == cfg.get('hour', 8) and now.minute == cfg.get('minute', 0):
```

- Chỉ có thể thay đổi `hour` + `minute` qua `appsettings.json`, **không thể** thay đổi tần suất (hàng tuần/tháng/năm) hay chat_id đích.
- Mỗi khi cần thêm/sửa lịch → phải **sửa code** + **restart server**.

#### ❌ P2: Chat_id đích bị hardcode theo business logic

- **Credit**: Tìm chat_id qua `TelegramProjectMember` → `group_name` matching → `parent_id` (main group) hoặc `member_chat_id`.
- **Rental**: Tương tự Credit, tìm qua project "Rental" → member group.
- **Rosca**: Tìm qua `RoscaMember.telegram_group` → `TelegramProjectMember`.

→ Không có cách nào để **admin chỉ định trực tiếp** gửi đến chat_id nào.

#### ❌ P3: Không có giao diện quản lý

- Không thể tạo/sửa/xóa cấu hình notification từ Frontend.
- Không có lịch sử gửi notification theo lịch (chỉ có `NotifyLog` cho notification hành vi CRUD).

#### ❌ P4: Scheduler.py quá phình to

- 150KB, 2843 dòng, **monolithic** – tất cả worker nằm trong 1 file.
- Code duplicate rất nhiều (pattern resolve chat_id lặp lại ở mỗi worker).

#### ❌ P5: Thiếu khả năng mở rộng

- Hệ thống `NotifyConfig` hiện có (bảng `notify_configs`) chỉ phục vụ cho **notification hành vi** (CRUD events), không hỗ trợ **scheduled notification**.
- Không có model/schema cho notification lên lịch.

### 1.3 Sơ đồ hiện trạng

```
┌──────────────────────────────────────────────────────────────────┐
│                     main.py lifespan                             │
│   asyncio.create_task(worker_1)                                  │
│   asyncio.create_task(worker_2)                                  │
│   ...                                                            │
│   asyncio.create_task(worker_15)                                 │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                scheduler.py (150KB, 2843 dòng)                   │
│                                                                  │
│  ┌────────────────────────────┐  ┌─────────────────────────────┐ │
│  │ bad_debt_notification      │  │ interest_payment_notif      │ │
│  │ → hardcode: quá hạn 7 ngày│  │ → hardcode: interest_day    │ │
│  │ → resolve chat_id qua     │  │ → resolve chat_id qua      │ │
│  │   TelegramProjectMember   │  │   TelegramProjectMember     │ │
│  └────────────┬───────────────┘  └──────────────┬──────────────┘ │
│               │                                  │               │
│  ┌────────────────────────────┐  ┌─────────────────────────────┐ │
│  │ rental_payment_notif       │  │ rosca_payment_notif         │ │
│  │ → hardcode: start_rental   │  │ → hardcode: payment_day     │ │
│  │   .day, 0-7 ngày nhắc     │  │   + bidding_time            │ │
│  │ → resolve chat_id qua     │  │ → resolve chat_id qua      │ │
│  │   project "Rental"        │  │   RoscaMember.telegram_group│ │
│  └────────────┬───────────────┘  └──────────────┬──────────────┘ │
│               │                                  │               │
│               ▼                                  ▼               │
│          bot.send_message(chat_id, text, parse_mode=HTML)        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Ý tưởng và hướng giải quyết

### 2.1 Tổng quan giải pháp: Database-driven Scheduled Notification

Xây dựng một hệ thống **cấu hình thông báo lên lịch** lưu trong database, với:

- **1 bảng `scheduled_notify_configs`**: Lưu cấu hình lịch gửi (module, chat_id, tần suất, template message)
- **1 bảng `scheduled_notify_logs`**: Lưu lịch sử gửi
- **1 unified scheduler worker**: Thay thế nhiều worker riêng lẻ bằng 1 worker chung đọc config từ DB

### 2.2 Kiến trúc mới

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (Vue.js)                            │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │       Scheduled Notification Management Page                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │  │
│  │  │ Tạo mới  │  │ Danh sách│  │ Bật/Tắt  │  │ Xem lịch sử  │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ HTTP REST API
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Backend API (FastAPI)                            │
│                                                                     │
│  /api/v1/scheduled-notifications/configs     (CRUD)                 │
│  /api/v1/scheduled-notifications/configs/{id}/toggle                │
│  /api/v1/scheduled-notifications/configs/{id}/test                  │
│  /api/v1/scheduled-notifications/logs        (GET)                  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    CRUD Layer                                 │  │
│  │  scheduled_notify CRUD  ←→  PostgreSQL                        │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Scheduler Engine                                │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │           unified_scheduled_notify_worker                      │ │
│  │                  (1 worker duy nhất)                            │ │
│  │                                                                │ │
│  │  Mỗi phút:                                                    │ │
│  │    1. Đọc configs từ DB (is_enabled=True)                      │ │
│  │    2. Check schedule match (Schedule Evaluator)                │ │
│  │    3. Resolve data (Module Data Resolver)                      │ │
│  │    4. Build message (Message Builder)                          │ │
│  │    5. Send → bot.send_message()                                │ │
│  │    6. Log result → scheduled_notify_logs                       │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐   │
│  │ CreditResolver  │  │ RentalResolver  │  │  RoscaResolver   │   │
│  │ - interest      │  │ - rental_payment│  │  - rosca_payment │   │
│  │ - bad_debt      │  │                 │  │                  │   │
│  └─────────────────┘  └─────────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Thiết kế bảng `scheduled_notify_configs`

```python
class ScheduleType(str, enum.Enum):
    DAILY = "daily"                      # Hàng ngày
    WEEKLY = "weekly"                    # Hàng tuần
    MONTHLY = "monthly"                  # Hàng tháng
    YEARLY = "yearly"                    # Hàng năm
    SPECIFIC_DATE = "specific_date"      # Ngày cụ thể

class ScheduledNotifyConfig(Base):
    __tablename__ = "scheduled_notify_configs"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)

    # ── Module binding ────────────────────
    module_key = Column(String, nullable=False, index=True)   # "credit", "rental", "rosca"
    module_name = Column(String, nullable=False)              # "Tín Dụng", "Cho Thuê", "Hụi"
    notify_type = Column(String, nullable=False)              # "interest_payment", "bad_debt",
                                                              # "rental_payment", "rosca_payment"

    # ── Target ────────────────────────────
    chat_id = Column(String, nullable=False)                  # Chat ID nhóm Telegram đích
    group_name = Column(String, nullable=True)                # Tên nhóm (hiển thị)

    # ── Schedule ──────────────────────────
    schedule_type = Column(Enum(ScheduleType), nullable=False)
    schedule_hour = Column(Integer, default=8)                # Giờ gửi (0-23)
    schedule_minute = Column(Integer, default=0)              # Phút gửi (0-59)
    schedule_day_of_week = Column(Integer, nullable=True)     # 0=Mon..6=Sun (cho weekly)
    schedule_day_of_month = Column(Integer, nullable=True)    # 1-31 (cho monthly)
    schedule_month = Column(Integer, nullable=True)           # 1-12 (cho yearly)
    schedule_specific_date = Column(Date, nullable=True)      # Ngày cụ thể

    # ── Message template ──────────────────
    message_template = Column(Text, nullable=True)            # Template tùy chỉnh (optional)

    # ── Control ───────────────────────────
    is_enabled = Column(Boolean, default=True)
    max_retry_days = Column(Integer, default=7)               # Số ngày nhắc lại tối đa
    escalate_to_chat_id = Column(String, nullable=True)       # Chat ID leo thang (main group)
    escalate_after_days = Column(Integer, default=7)          # Leo thang sau N ngày

    # ── Filter conditions (JSON) ──────────
    filter_conditions = Column(Text, nullable=True)           # JSON: {"status": "active", ...}

    # ── Metadata ──────────────────────────
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now)
```

### 2.4 Thiết kế bảng `scheduled_notify_logs`

```python
class ScheduledNotifyLog(Base):
    __tablename__ = "scheduled_notify_logs"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    config_id = Column(UUID, ForeignKey("scheduled_notify_configs.id"))

    module_key = Column(String, nullable=False)
    notify_type = Column(String, nullable=False)
    chat_id = Column(String, nullable=False)
    group_name = Column(String, nullable=True)

    # ── Reference ─────────────────────────
    reference_id = Column(String, nullable=True)              # contract_id, rosca_code, etc.
    reference_name = Column(String, nullable=True)            # Tên khách hàng, tên dây hụi

    # ── Result ────────────────────────────
    message_id = Column(Integer, nullable=True)               # Telegram message ID
    message_content = Column(Text, nullable=True)             # Nội dung đã gửi
    status = Column(String, nullable=False)                   # SUCCESS / FAILED / SKIPPED
    error_message = Column(Text, nullable=True)

    # ── Timing ────────────────────────────
    scheduled_at = Column(DateTime, nullable=True)            # Thời gian lên lịch
    sent_at = Column(DateTime, default=datetime.datetime.now) # Thời gian gửi thực tế
```

### 2.5 Quy tắc đặt tên `notify_type`

#### Naming Convention: `{module}_{mục_đích}`

```
notify_type = "{module}_{purpose}"

Ví dụ:
  credit_interest    → module = credit,  mục đích = interest (đóng lãi)
  rental_payment     → module = rental,  mục đích = payment (đóng tiền thuê)
  rosca_bidding      → module = rosca,   mục đích = bidding (khui hụi)
  general_meeting    → module = general, mục đích = meeting (họp)
```

> `notify_type` là **free-form String** — có thể mở rộng không giới hạn mà không cần migration DB.
> Chỉ cần tuân thủ format `module_purpose` để dễ quản lý và phân loại.

#### Bảng tổng hợp `notify_type`

**Module: Credit (Tín dụng)**

| notify_type | Loại | Mô tả |
|------------|------|--------|
| `credit_interest` | 🔄 Business | Nhắc đóng lãi hàng tháng |
| `credit_bad_debt` | 🔄 Business | Cảnh báo nợ xấu (quá hạn gốc) |
| `credit_maturity` | 🔄 Business | Cảnh báo hợp đồng sắp đáo hạn |
| `credit_principal` | 🔄 Business | Nhắc đóng gốc định kỳ |
| `credit_other` | ✨ Tự do | Thông báo tùy ý liên quan Credit |

**Module: Rental (Cho thuê)**

| notify_type | Loại | Mô tả |
|------------|------|--------|
| `rental_payment` | 🔄 Business | Nhắc đóng tiền thuê hàng tháng |
| `rental_maintenance` | ✨ Tự do | Nhắc lịch sửa chữa / bảo trì nhà |
| `rental_contract_expiry` | 🔄 Business | Cảnh báo hợp đồng thuê sắp hết hạn |
| `rental_deposit` | ✨ Tự do | Nhắc hoàn trả tiền cọc |
| `rental_other` | ✨ Tự do | Thông báo tùy ý liên quan Rental |

**Module: Rosca (Hụi)**

| notify_type | Loại | Mô tả |
|------------|------|--------|
| `rosca_payment` | 🔄 Business | Nhắc đóng tiền hụi hàng kỳ |
| `rosca_bidding` | 🔄 Business | Nhắc lịch khui hụi / bỏ thăm |
| `rosca_defaulted` | 🔄 Business | Cảnh báo bể hụi |
| `rosca_other` | ✨ Tự do | Thông báo tùy ý liên quan Hụi |

**Module: General (Chung)**

| notify_type | Loại | Mô tả |
|------------|------|--------|
| `general_reminder` | ✨ Tự do | Nhắc nhở chung (VD: nhắc nộp báo cáo) |
| `general_meeting` | ✨ Tự do | Nhắc lịch họp định kỳ |
| `general_announcement` | ✨ Tự do | Thông báo / công bố chung |
| `general_other` | ✨ Tự do | Thông báo tùy ý bất kỳ |

> **🔄 Business**: Resolver tự động query DB, lấy dữ liệu hợp đồng/khách hàng rồi build message.
>
> **✨ Tự do**: Không query DB — gửi trực tiếp `message_template` mà admin tự viết.

#### Cách thêm notify_type mới

Chỉ cần đặt tên theo format `module_purpose` rồi tạo config qua API. Ví dụ:

```
Cần nhắc kiểm tra PCCC hàng quý cho Rental?
  → notify_type = "rental_fire_safety"
  → module_key  = "rental"

Cần nhắc đóng phí quản lý chung cư?
  → notify_type = "rental_management_fee"
  → module_key  = "rental"

Cần gửi báo cáo lợi nhuận Hụi cuối tháng?
  → notify_type = "rosca_profit_report"
  → module_key  = "rosca"
```

Nếu là loại ✨ Tự do → chỉ cần tạo config + viết `message_template`, **không cần code**.
Nếu là loại 🔄 Business → cần thêm handler trong Resolver tương ứng.

#### Ví dụ sử dụng `rental_maintenance` — Nhắc lịch sửa chữa nhà:

```json
{
  "module_key": "rental",
  "module_name": "Cho Thuê",
  "notify_type": "rental_maintenance",
  "chat_id": "-100xxxxx",
  "group_name": "Nhóm Quản Lý BĐS",
  "schedule_type": "monthly",
  "schedule_day_of_month": 15,
  "schedule_hour": 9,
  "schedule_minute": 0,
  "message_template": "🔧 <b>NHẮC NHỞ BẢO TRÌ ĐỊNH KỲ</b>\n\nVui lòng kiểm tra và bảo trì các hạng mục:\n• Hệ thống điện\n• Hệ thống nước\n• Điều hòa / Quạt\n• Cửa / Khóa\n\n<i>Liên hệ Admin nếu cần hỗ trợ.</i>",
  "is_enabled": true
}
```

#### Ví dụ sử dụng `general_meeting` — Nhắc họp đầu tuần:

```json
{
  "module_key": "general",
  "module_name": "Chung",
  "notify_type": "general_meeting",
  "chat_id": "-100xxxxx",
  "group_name": "Nhóm Ban Giám Đốc",
  "schedule_type": "weekly",
  "schedule_day_of_week": 0,
  "schedule_hour": 8,
  "schedule_minute": 30,
  "message_template": "📋 <b>NHẮC NHỞ HỌP GIAO BAN ĐẦU TUẦN</b>\n\nThời gian: 9:00 sáng hôm nay\nĐịa điểm: Phòng họp tầng 2\n\n<i>Các thành viên vui lòng chuẩn bị báo cáo tuần.</i>",
  "is_enabled": true
}
```

### 2.6 Message Template Override

Mặc định, loại **🔄 Business** sẽ dùng message được build tự động từ code. Nhưng nếu admin muốn **tùy chỉnh nội dung**, chỉ cần điền `message_template` trong config → hệ thống sẽ dùng template đó thay thế.

#### Quy tắc ưu tiên:

```
message_template có giá trị?
  ├─ CÓ  → Dùng template + thay placeholder bằng dữ liệu thực
  └─ KHÔNG (null) → Dùng message mặc định từ code (_build_xxx_message)
```

> Quy tắc này áp dụng cho **tất cả** notify_type — cả Business lẫn Tự do.
> Nghĩa là anh có thể tùy chỉnh nội dung cho `credit_interest`, `rental_payment`,... mà không cần sửa code.

#### Ví dụ: Tùy chỉnh message cho `credit_interest`

**Mặc định (message_template = null)** → Hệ thống tự build:

```
🔔 THÔNG BÁO ĐÓNG TIỀN LÃI (Đến hạn hôm nay) 🔔

Khách hàng: Nguyễn Văn A
Mã Khách Hàng: CR001
Liên hệ: @nguyenvana
Mã Hợp Đồng: HD-2025-001
Số tiền lãi cần đóng: 5,000,000 VND
━━━━━━━━━━━━━━━
Quý khách vui lòng thanh toán đúng hạn...
```

**Tùy chỉnh (có message_template)** → Admin tự viết:

```json
{
  "module_key": "credit",
  "notify_type": "credit_interest",
  "chat_id": "-100xxxxx",
  "schedule_type": "monthly",
  "schedule_day_of_month": 15,
  "schedule_hour": 8,
  "message_template": "💰 Xin chào <b>{customer_name}</b>,\n\nHĐ <code>{contract_id}</code> đến hạn đóng lãi tháng này.\n📌 Số tiền: <b>{interest_amount} VNĐ</b>\n📌 Dư nợ gốc: {remaining_principal} VNĐ\n📌 Trạng thái: {days_text}\n\nVui lòng thanh toán và gửi biên lai. Cảm ơn Quý Khách! 🙏"
}
```

Kết quả sau khi thay placeholder:

```
💰 Xin chào Nguyễn Văn A,

HĐ HD-2025-001 đến hạn đóng lãi tháng này.
📌 Số tiền: 5,000,000 VNĐ
📌 Dư nợ gốc: 100,000,000 VNĐ
📌 Trạng thái: Đến hạn hôm nay

Vui lòng thanh toán và gửi biên lai. Cảm ơn Quý Khách! 🙏
```

#### Bảng Placeholder cho từng module

**Module: Credit**

| Placeholder | Mô tả | Ví dụ giá trị |
|------------|--------|---------------|
| `{customer_name}` | Tên khách hàng | Nguyễn Văn A |
| `{customer_id}` | Mã khách hàng | CR001 |
| `{contact_info}` | Liên hệ (Telegram username) | @nguyenvana |
| `{contract_id}` | Mã hợp đồng | HD-2025-001 |
| `{interest_amount}` | Số tiền lãi cần đóng | 5,000,000 |
| `{remaining_principal}` | Dư nợ gốc còn lại | 100,000,000 |
| `{interest_debt}` | Nợ lãi tích lũy | 10,000,000 |
| `{due_date}` | Ngày đáo hạn gốc | 15/06/2026 |
| `{interest_start_date}` | Ngày bắt đầu tính lãi | 01/01/2025 |
| `{days_late}` | Số ngày trễ hạn | 3 |
| `{days_text}` | Mô tả trạng thái | Đến hạn hôm nay / Trễ hạn 3 ngày |
| `{monthly_interest_rate}` | Lãi suất tháng (%) | 1.5 |

**Module: Rental**

| Placeholder | Mô tả | Ví dụ giá trị |
|------------|--------|---------------|
| `{customer_name}` | Tên khách thuê | Trần Văn B |
| `{customer_id}` | Mã khách hàng | RT001 |
| `{contact_info}` | Liên hệ | @tranvanb |
| `{contract_id}` | Mã hợp đồng | HĐ-THUÊ-001 |
| `{monthly_rental}` | Tiền thuê / tháng | 8,000,000 |
| `{rental_debt}` | Công nợ hiện tại | 16,000,000 |
| `{real_estate_id}` | Mã bất động sản | BDS-001 |
| `{type_contract}` | Loại hợp đồng | Cho thuê dài hạn |
| `{start_rental}` | Ngày bắt đầu thuê | 01/03/2025 |
| `{end_rental}` | Ngày kết thúc thuê | 01/03/2026 |
| `{days_late}` | Số ngày trễ hạn | 5 |
| `{days_text}` | Mô tả trạng thái | Nhắc nhở lần 5 - Trễ hạn 5 ngày |

**Module: Rosca**

| Placeholder | Mô tả | Ví dụ giá trị |
|------------|--------|---------------|
| `{rosca_code}` | Mã dây hụi | HUI-2025-01 |
| `{owner_name}` | Tên chủ hụi | Lê Thị C |
| `{payment_day}` | Ngày đóng hụi | 15 |
| `{base_amount}` | Số tiền gốc 1 chân | 10,000,000 |
| `{min_bid}` | Mức bỏ hụi tối thiểu | 500,000 |
| `{max_bid}` | Mức bỏ hụi tối đa | 2,000,000 |
| `{total_parts}` | Tổng số chân hụi | 20 |
| `{period_type}` | Loại hụi | Hụi Tháng |

> **Lưu ý**: Placeholder sử dụng cú pháp Python `str.format()`. Nếu template chứa placeholder không hợp lệ hoặc thiếu dữ liệu → hệ thống sẽ gửi message mặc định thay thế (safe fallback).

### 2.7 Module Data Resolver Pattern

Thay vì hardcode logic trong mỗi worker, ta tạo **resolver pattern** cho từng module:

```python
def _render_template(template: str, data: dict) -> str:
    """
    Thay placeholder trong template bằng dữ liệu thực.
    Safe fallback: nếu placeholder thiếu → giữ nguyên {placeholder}.
    """
    try:
        # Dùng format_map để không raise KeyError khi thiếu key
        class SafeDict(dict):
            def __missing__(self, key):
                return f"{{{key}}}"
        return template.format_map(SafeDict(data))
    except Exception:
        return template  # Trả template gốc nếu có lỗi


class CreditNotifyResolver:
    """Resolve dữ liệu cho module Credit."""

    BUSINESS_TYPES = {"credit_interest", "credit_bad_debt", "credit_maturity", "credit_principal"}

    @staticmethod
    def get_pending_items(db, config, current_date):
        if config.notify_type == "credit_interest":
            return _get_interest_due_contracts(db, current_date, config.filter_conditions)
        elif config.notify_type == "credit_bad_debt":
            return _get_bad_debt_contracts(db, current_date, config.filter_conditions)
        elif config.notify_type == "credit_maturity":
            return _get_maturity_contracts(db, current_date, config.filter_conditions)
        elif config.notify_type == "credit_principal":
            return _get_principal_due_contracts(db, current_date, config.filter_conditions)
        else:
            return None  # Loại tự do

    @staticmethod
    def build_message(item, config, days_late):
        # Loại tự do → gửi template trực tiếp
        if config.notify_type not in CreditNotifyResolver.BUSINESS_TYPES:
            return config.message_template

        # Loại Business → chuẩn bị data cho placeholder
        data = {
            "customer_name": item.customer.customer_name,
            "customer_id": item.customer.customer_id or "N/A",
            "contact_info": item.customer.contact_info or "N/A",
            "contract_id": item.contract_id,
            "interest_amount": f"{int(item.monthly_interest_amount or 0):,}",
            "remaining_principal": f"{int(item.remaining_principal or 0):,}",
            "interest_debt": f"{int(item.interest_debt or 0):,}",
            "due_date": item.due_date.strftime("%d/%m/%Y") if item.due_date else "N/A",
            "interest_start_date": item.interest_start_date.strftime("%d/%m/%Y") if item.interest_start_date else "N/A",
            "monthly_interest_rate": item.monthly_interest_rate or 0,
            "days_late": days_late,
            "days_text": "Đến hạn hôm nay" if days_late == 0 else f"Trễ hạn {days_late} ngày",
        }

        # Có message_template → dùng template override
        if config.message_template:
            return _render_template(config.message_template, data)

        # Không có template → dùng message mặc định
        return _build_credit_message(item, config.notify_type, days_late)


class RentalNotifyResolver:
    """Resolve dữ liệu cho module Rental."""

    BUSINESS_TYPES = {"rental_payment", "rental_contract_expiry"}

    @staticmethod
    def get_pending_items(db, config, current_date):
        if config.notify_type == "rental_payment":
            return _get_rental_due_contracts(db, current_date, config.filter_conditions)
        elif config.notify_type == "rental_contract_expiry":
            return _get_expiring_rental_contracts(db, current_date, config.filter_conditions)
        else:
            return None

    @staticmethod
    def build_message(item, config, days_late):
        if config.notify_type not in RentalNotifyResolver.BUSINESS_TYPES:
            return config.message_template

        data = {
            "customer_name": item.customer.customer_name,
            "customer_id": item.customer.customer_id or "N/A",
            "contact_info": item.customer.contact_info or "N/A",
            "contract_id": item.contract_id,
            "monthly_rental": f"{int(item.monthly_rental or 0):,}",
            "rental_debt": f"{int(item.rental_debt or 0):,}",
            "real_estate_id": item.real_estate_id or "N/A",
            "type_contract": item.type_contract or "N/A",
            "start_rental": item.start_rental.strftime("%d/%m/%Y") if item.start_rental else "N/A",
            "end_rental": item.end_rental.strftime("%d/%m/%Y") if item.end_rental else "N/A",
            "days_late": days_late,
            "days_text": "Đến hạn hôm nay" if days_late == 0 else f"Nhắc nhở lần {days_late} - Trễ hạn {days_late} ngày",
        }

        if config.message_template:
            return _render_template(config.message_template, data)
        return _build_rental_message(item, config.notify_type, days_late)


class RoscaNotifyResolver:
    """Resolve dữ liệu cho module Rosca."""

    BUSINESS_TYPES = {"rosca_payment", "rosca_bidding", "rosca_defaulted"}

    @staticmethod
    def get_pending_items(db, config, current_date):
        if config.notify_type == "rosca_payment":
            return _get_rosca_due_items(db, current_date, config.filter_conditions)
        elif config.notify_type == "rosca_bidding":
            return _get_rosca_bidding_items(db, current_date, config.filter_conditions)
        elif config.notify_type == "rosca_defaulted":
            return _get_rosca_defaulted_items(db, current_date, config.filter_conditions)
        else:
            return None

    @staticmethod
    def build_message(item, config, days_late):
        if config.notify_type not in RoscaNotifyResolver.BUSINESS_TYPES:
            return config.message_template

        data = {
            "rosca_code": item.rosca.code,
            "owner_name": item.owner_name,
            "payment_day": item.rosca.payment_day,
            "base_amount": f"{int(item.rosca.base_amount or 0):,}",
            "min_bid": f"{int(item.rosca.min_bid_amount or 0):,}",
            "max_bid": f"{int(item.rosca.max_bid_amount or 0):,}",
            "total_parts": item.rosca.total_parts,
            "period_type": item.rosca.period_type.value if item.rosca.period_type else "N/A",
        }

        if config.message_template:
            return _render_template(config.message_template, data)
        return _build_rosca_message(item, config.notify_type, days_late)


class GeneralNotifyResolver:
    """
    Resolver cho module 'general'.
    Tất cả general_* đều là loại tự do — gửi message_template trực tiếp.
    """

    @staticmethod
    def get_pending_items(db, config, current_date):
        return None

    @staticmethod
    def build_message(item, config, days_late):
        return config.message_template


# Registry — ánh xạ module_key → Resolver class
NOTIFY_RESOLVERS = {
    "credit":  CreditNotifyResolver,
    "rental":  RentalNotifyResolver,
    "rosca":   RoscaNotifyResolver,
    "general": GeneralNotifyResolver,
}
```

#### Luồng xử lý theo loại:

```
Loại 🔄 Business (VD: credit_interest)
  │
  ├─ Resolver.get_pending_items() → [contract_1, contract_2, ...]
  │
  ├─ Với mỗi item:
  │   ├─ Resolver.build_message(item) → HTML message tự động từ data
  │   └─ bot.send_message(chat_id, message) → log SUCCESS
  │
  └─ Gửi nhiều message (1 per item)

Loại ✨ Tự do (VD: rental_maintenance, general_meeting)
  │
  ├─ Resolver.get_pending_items() → None (không query DB)
  │
  ├─ Worker nhận None → gửi trực tiếp
  │   ├─ Resolver.build_message() → config.message_template
  │   └─ bot.send_message(chat_id, message_template) → log SUCCESS
  │
  └─ Gửi 1 message duy nhất
```

### 2.6 Unified Scheduler Worker

```python
async def unified_scheduled_notify_worker():
    """
    Worker duy nhất xử lý tất cả scheduled notifications.
    Mỗi phút: đọc configs từ DB → check schedule → resolve data → send → log.
    """
    LogInfo("Unified scheduled notify worker started.", LogType.SYSTEM_STATUS)

    while True:
        try:
            now = datetime.datetime.now()
            db = SessionLocal()
            try:
                configs = db.query(ScheduledNotifyConfig).filter(
                    ScheduledNotifyConfig.is_enabled == True
                ).all()

                for config in configs:
                    if not _should_trigger(config, now):
                        continue

                    resolver = NOTIFY_RESOLVERS.get(config.module_key)
                    if not resolver:
                        continue

                    items = resolver.get_pending_items(db, config, now.date())
                    for item in items:
                        # Check duplicate
                        if _already_sent_today(db, config.id, item.reference_id, now.date()):
                            continue

                        message = resolver.build_message(item, config, ...)

                        # Send
                        try:
                            msg = await bot.send_message(
                                chat_id=int(config.chat_id),
                                text=message,
                                parse_mode=ParseMode.HTML
                            )
                            _create_log(db, config, item, msg.id, "SUCCESS")
                        except Exception as e:
                            _create_log(db, config, item, None, "FAILED", str(e))

                        await asyncio.sleep(0.5)  # Rate limit protection

            finally:
                db.close()

            # Wait until next minute
            next_run = (now + datetime.timedelta(minutes=1)).replace(second=0, microsecond=0)
            sleep_time = (next_run - datetime.datetime.now()).total_seconds()
            await asyncio.sleep(max(sleep_time, 1))

        except Exception as e:
            LogError(f"Critical error in unified_scheduled_notify_worker: {e}",
                     LogType.SYSTEM_STATUS)
            await asyncio.sleep(60)
```

### 2.7 Schedule Evaluator

```python
def _should_trigger(config: ScheduledNotifyConfig, now: datetime.datetime) -> bool:
    """Kiểm tra config có nên trigger tại thời điểm hiện tại."""

    # Check giờ/phút
    if now.hour != config.schedule_hour or now.minute != config.schedule_minute:
        return False

    if config.schedule_type == ScheduleType.DAILY:
        return True

    elif config.schedule_type == ScheduleType.WEEKLY:
        return now.weekday() == config.schedule_day_of_week

    elif config.schedule_type == ScheduleType.MONTHLY:
        target_day = config.schedule_day_of_month
        last_day = calendar.monthrange(now.year, now.month)[1]
        actual_day = min(target_day, last_day)
        return now.day == actual_day

    elif config.schedule_type == ScheduleType.YEARLY:
        if now.month != config.schedule_month:
            return False
        target_day = config.schedule_day_of_month or 1
        last_day = calendar.monthrange(now.year, now.month)[1]
        actual_day = min(target_day, last_day)
        return now.day == actual_day

    elif config.schedule_type == ScheduleType.SPECIFIC_DATE:
        return now.date() == config.schedule_specific_date

    return False
```

### 2.8 So sánh trước/sau

| Tiêu chí | Hiện tại | Giải pháp mới |
|----------|----------|---------------|
| **Số lượng worker** | 15 worker riêng lẻ | 1 unified worker + worker cũ (backward compatible) |
| **Cấu hình lịch** | Hardcode / appsettings.json | Database-driven, quản lý qua API |
| **Chỉ định chat_id** | Tự resolve từ business logic | Admin chỉ định trực tiếp |
| **Tần suất** | Cố định | daily / weekly / monthly / yearly / specific_date |
| **Quản lý** | Sửa code + restart | CRUD API + Frontend UI |
| **Lịch sử** | Console log only | `scheduled_notify_logs` table |
| **Mở rộng** | Viết thêm worker | Thêm resolver + config |

---

## 3. Plan thực hiện các giai đoạn

### Giai đoạn 1: Database & Models (Backend Core)

**Mục tiêu**: Tạo foundation cho hệ thống mới mà không ảnh hưởng hệ thống hiện tại.

| File | Loại | Mô tả |
|------|------|-------|
| `app/models/scheduled_notification.py` | **NEW** | Model `ScheduledNotifyConfig`, `ScheduledNotifyLog`, Enum `ScheduleType` |
| `app/schemas/scheduled_notification.py` | **NEW** | Pydantic schemas: Create, Update, Response cho Config và Log |
| `app/crud/scheduled_notification.py` | **NEW** | CRUD functions: create, update, delete, get_all, get_by_id, get_enabled_configs, create_log, get_logs |
| Alembic migration | **NEW** | Migration cho 2 bảng `scheduled_notify_configs` và `scheduled_notify_logs` |

---

### Giai đoạn 2: Scheduler Engine (Backend Logic)

**Mục tiêu**: Xây dựng engine xử lý lịch trình và gửi thông báo.

| File | Loại | Mô tả |
|------|------|-------|
| `bot/utils/notify_resolvers.py` | **NEW** | `BaseNotifyResolver`, `CreditNotifyResolver`, `RentalNotifyResolver`, `RoscaNotifyResolver`, `NOTIFY_RESOLVERS` registry |
| `bot/utils/schedule_evaluator.py` | **NEW** | `should_trigger()`, xử lý tất cả schedule_type, tránh duplicate |
| `bot/utils/scheduler.py` | **MODIFY** | Thêm function `unified_scheduled_notify_worker()` — **KHÔNG xóa** worker cũ |
| `app/main.py` | **MODIFY** | Import và `asyncio.create_task(unified_scheduled_notify_worker())` trong lifespan |

---

### Giai đoạn 3: REST API (Backend Endpoints)

**Mục tiêu**: Expose CRUD API cho frontend quản lý cấu hình.

| File | Loại | Mô tả |
|------|------|-------|
| `app/api/v1/scheduled_notification.py` | **NEW** | Các endpoint REST API (chi tiết bên dưới) |
| `app/main.py` | **MODIFY** | Đăng ký router mới |

**Danh sách endpoints:**

| Method | Path | Mô tả |
|--------|------|-------|
| `GET` | `/api/v1/scheduled-notifications/configs` | Danh sách configs (filter: module_key, is_enabled) |
| `POST` | `/api/v1/scheduled-notifications/configs` | Tạo config mới |
| `PUT` | `/api/v1/scheduled-notifications/configs/{id}` | Cập nhật config |
| `DELETE` | `/api/v1/scheduled-notifications/configs/{id}` | Xóa config |
| `PATCH` | `/api/v1/scheduled-notifications/configs/{id}/toggle` | Bật/tắt config |
| `GET` | `/api/v1/scheduled-notifications/logs` | Xem lịch sử gửi (filter: config_id, status, date range) |
| `POST` | `/api/v1/scheduled-notifications/configs/{id}/test` | Gửi test thủ công |

---

### Giai đoạn 4: Seed Data & Migration

**Mục tiêu**: Chuyển đổi cấu hình hardcode hiện tại thành database configs.

**Credit configs:**

| notify_type | schedule_type | schedule_hour | Mô tả |
|------------|---------------|---------------|--------|
| `interest_payment` | monthly | 8 | Nhắc đóng lãi hàng tháng theo ngày `interest_start_date.day` |
| `bad_debt` | daily | 8 | Cảnh báo nợ xấu (quá hạn 7 ngày) |

**Rental configs:**

| notify_type | schedule_type | schedule_hour | Mô tả |
|------------|---------------|---------------|--------|
| `rental_payment` | monthly | 16 | Nhắc đóng tiền thuê hàng tháng theo ngày `start_rental.day` |

**Rosca configs:**

| notify_type | schedule_type | schedule_hour | Mô tả |
|------------|---------------|---------------|--------|
| `rosca_payment` | monthly | theo `bidding_time` | Nhắc đóng hụi theo `payment_day` |

---

## 4. Testing và kiểm thử

### 4.1 Unit Test Strategy

| Test Case | Mô tả | Priority |
|-----------|--------|----------|
| `test_schedule_evaluator_daily` | Verify `should_trigger` cho schedule_type=daily | P0 |
| `test_schedule_evaluator_weekly` | Verify cho weekly với day_of_week | P0 |
| `test_schedule_evaluator_monthly` | Verify cho monthly với day_of_month | P0 |
| `test_schedule_evaluator_yearly` | Verify cho yearly | P1 |
| `test_schedule_evaluator_specific_date` | Verify cho specific_date | P1 |
| `test_schedule_evaluator_no_duplicate` | Verify không gửi duplicate trong cùng 1 kỳ | P0 |
| `test_credit_resolver_interest` | Verify CreditNotifyResolver cho interest_payment | P0 |
| `test_credit_resolver_bad_debt` | Verify CreditNotifyResolver cho bad_debt | P0 |
| `test_rental_resolver` | Verify RentalNotifyResolver | P0 |
| `test_rosca_resolver` | Verify RoscaNotifyResolver | P1 |
| `test_message_builder` | Verify message HTML format | P1 |
| `test_crud_create_config` | Verify tạo config mới | P0 |
| `test_crud_toggle_config` | Verify bật/tắt config | P0 |

### 4.2 Integration Test

```bash
# 1. Tạo config test
curl -X POST /api/v1/scheduled-notifications/configs \
  -H "Content-Type: application/json" \
  -d '{
    "module_key": "credit",
    "module_name": "Tín Dụng",
    "notify_type": "interest_payment",
    "chat_id": "-1003991830930",
    "schedule_type": "monthly",
    "schedule_hour": 8,
    "schedule_minute": 0,
    "schedule_day_of_month": 15,
    "is_enabled": true
  }'

# 2. Gửi test thủ công
curl -X POST /api/v1/scheduled-notifications/configs/{id}/test

# 3. Xem logs
curl "/api/v1/scheduled-notifications/logs?config_id={id}"
```

### 4.3 Manual Verification Checklist

- [ ] Tạo config → Verify xuất hiện trong DB
- [ ] Gửi test → Verify message xuất hiện trong nhóm Telegram
- [ ] Verify log được tạo với status SUCCESS
- [ ] Tắt config → Verify worker skip config đó
- [ ] Bật lại → Verify worker xử lý bình thường
- [ ] Kiểm tra backward compatibility: Worker cũ vẫn chạy bình thường
- [ ] Kiểm tra edge case: tháng 2 (28/29 ngày), ngày 31
- [ ] Kiểm tra rate limit: gửi nhiều notification liên tục
- [ ] Kiểm tra restart server: worker khởi động lại bình thường, không gửi duplicate

### 4.4 Edge Cases cần kiểm thử

| Edge Case | Mô tả | Expected Behavior |
|-----------|--------|-------------------|
| Tháng 2, config day=31 | Monthly schedule ngày 31 nhưng tháng chỉ có 28/29 ngày | Fallback về ngày cuối tháng (28 hoặc 29) |
| Chat ID invalid | Config có chat_id không tồn tại | Log status=FAILED, không crash worker |
| Bot disconnected | Bot mất kết nối Telegram | Skip gửi, log FAILED, retry lần sau |
| Duplicate prevention | Server restart giữa chừng | Check log trước khi gửi → skip nếu đã SUCCESS hôm nay |
| Empty result set | Resolver trả về 0 items | Skip silently, không tạo log |
| filter_conditions invalid | JSON parse error | Log warning, treat as no filter (return all items) |

---

## 5. Đánh giá rủi ro và phản biện

### 5.1 Rủi ro kỹ thuật

| Rủi ro | Mức độ | Giải pháp giảm thiểu |
|--------|--------|---------------------|
| **Duplicate message** – Worker chạy lại khi restart | 🔴 Cao | Check `scheduled_notify_logs` trước khi gửi. Nếu đã gửi SUCCESS cho config_id + reference_id + ngày hôm nay → skip |
| **Race condition** – Multiple instance cùng gửi | 🟡 TB | Hiện tại chỉ chạy 1 instance. Nếu scale → cần distributed lock (Redis) |
| **DB connection leak** – Worker không close session | 🟡 TB | Dùng `try/finally` pattern giống các worker hiện tại |
| **Telegram rate limit** – Gửi quá nhiều message/giây | 🟡 TB | Thêm `asyncio.sleep(0.5)` giữa mỗi lần gửi |
| **Config lỗi** – Admin nhập sai chat_id | 🟢 Thấp | Validate chat_id format khi tạo config. Endpoint `/test` để kiểm tra trước |
| **Migration fail** – Alembic conflict | 🟢 Thấp | Tạo migration riêng biệt, chỉ ADD bảng mới (không ALTER bảng cũ) |

### 5.2 Rủi ro vận hành

| Rủi ro | Mức độ | Giải pháp |
|--------|--------|-----------|
| **Backward compatibility** | 🔴 Cao | **KHÔNG xóa** worker cũ. Unified worker chạy song song. Khi ổn định → deprecate dần |
| **Data consistency** | 🟡 TB | Seed data phải khớp chính xác với logic worker cũ |
| **Performance** | 🟢 Thấp | Unified worker query DB mỗi phút → tải không đáng kể (< 20 configs) |

### 5.3 Phản biện và trả lời

#### ❓ "Tại sao không dùng APScheduler hoặc Celery Beat?"

**Trả lời**: Hệ thống hiện tại dùng `asyncio` pattern thuần. Thêm APScheduler/Celery sẽ:

- Tăng complexity (thêm dependency, cần Redis/RabbitMQ cho Celery)
- Phá vỡ kiến trúc hiện có (15 worker đều dùng asyncio)
- Overkill cho quy mô hiện tại (< 20 scheduled configs)

Giải pháp DB-driven + asyncio worker là **phù hợp nhất** cho codebase hiện tại. Khi scale lên, có thể migrate sang APScheduler mà không thay đổi model/API.

#### ❓ "Tại sao không sửa worker cũ mà tạo worker mới?"

**Trả lời**: Nguyên tắc **backward compatibility**:

- Worker cũ đã chạy ổn định production
- Tạo worker mới chạy song song → zero downtime
- Khi unified worker đã được verify → deprecate worker cũ dần dần
- Nếu có vấn đề → tắt unified worker, worker cũ vẫn hoạt động

#### ❓ "filter_conditions dạng JSON có linh hoạt nhưng khó validate?"

**Trả lời**: Đúng, đây là trade-off. Giải pháp:

- Mỗi resolver tự validate filter_conditions theo schema riêng
- API endpoint validate trước khi save vào DB
- Frontend chỉ expose UI cho các filter đã biết (không cho nhập JSON raw)
- Nếu filter invalid → resolver trả về empty list (safe default)

#### ❓ "Làm sao handle trường hợp ngày 31 cho monthly schedule?"

**Trả lời**: Logic giống worker hiện tại:

```python
try:
    due_date = datetime.date(year, month, schedule_day_of_month)
except ValueError:
    due_date = datetime.date(year, month, calendar.monthrange(year, month)[1])
```

Nếu config `schedule_day_of_month=31` mà tháng chỉ có 28/30 ngày → fallback về ngày cuối tháng.

#### ❓ "Worker mới có conflict với worker cũ không? (gửi double message)"

**Trả lời**: Không, vì:

- Worker cũ gửi đến chat_id được **resolve tự động** từ business logic (`TelegramProjectMember`)
- Worker mới gửi đến chat_id được **chỉ định trực tiếp** trong config
- Admin tạo config mới sẽ chỉ định chat_id khác hoặc disable worker cũ trước
- Nếu cùng chat_id → admin có thể tắt config mới hoặc tắt worker cũ (comment out trong `main.py`)

---

## 6. Hướng dẫn sử dụng API

> **Base URL**: `http://localhost:8000/api/v1/scheduled-notifications`

### 6.1 Tổng quan Endpoints

| Method | Path | Mô tả |
|--------|------|--------|
| `GET` | `/configs` | Danh sách configs (có filter) |
| `GET` | `/configs/{id}` | Chi tiết 1 config |
| `POST` | `/configs` | Tạo config mới |
| `PUT` | `/configs/{id}` | Cập nhật config |
| `DELETE` | `/configs/{id}` | Xóa config |
| `PATCH` | `/configs/{id}/toggle` | Bật/tắt config |
| `POST` | `/configs/{id}/test` | Gửi test thủ công |
| `GET` | `/logs` | Xem lịch sử gửi |

---

### 6.2 Tạo config mới — `POST /configs`

#### Ví dụ 1: Nhắc đóng lãi Credit hàng tháng (🔄 Business)

```bash
curl -X POST http://localhost:8000/api/v1/scheduled-notifications/configs \
  -H "Content-Type: application/json" \
  -d '{
    "module_key": "credit",
    "module_name": "Tín Dụng",
    "notify_type": "credit_interest",
    "chat_id": "-1003991830930",
    "group_name": "Nhóm Tín Dụng",
    "schedule_type": "daily",
    "schedule_hour": 8,
    "schedule_minute": 0,
    "is_enabled": true
  }'
```

> Loại Business: không cần `message_template` — hệ thống tự query DB và build message.
> `schedule_type: daily` + `schedule_hour: 8` → chạy mỗi ngày lúc 8:00, kiểm tra hợp đồng nào đến/quá hạn lãi.

**Response** (200):

```json
{
  "id": "9d56123b-3e97-4410-bfba-e35f26d174c1",
  "module_key": "credit",
  "module_name": "Tín Dụng",
  "notify_type": "credit_interest",
  "chat_id": "-1003991830930",
  "group_name": "Nhóm Tín Dụng",
  "schedule_type": "daily",
  "schedule_hour": 8,
  "schedule_minute": 0,
  "schedule_day_of_week": null,
  "schedule_day_of_month": null,
  "schedule_month": null,
  "schedule_specific_date": null,
  "message_template": null,
  "is_enabled": true,
  "max_retry_days": 7,
  "escalate_to_chat_id": null,
  "escalate_after_days": 7,
  "filter_conditions": null,
  "created_by": null,
  "created_at": "2026-07-28T23:12:25.837321",
  "updated_at": "2026-07-28T23:12:25.837321"
}
```

#### Ví dụ 2: Nhắc đóng tiền thuê Rental hàng tháng (🔄 Business) + Template tùy chỉnh

```bash
curl -X POST http://localhost:8000/api/v1/scheduled-notifications/configs \
  -H "Content-Type: application/json" \
  -d '{
    "module_key": "rental",
    "module_name": "Cho Thuê",
    "notify_type": "rental_payment",
    "chat_id": "-1003991830930",
    "group_name": "Nhóm Cho Thuê",
    "schedule_type": "daily",
    "schedule_hour": 16,
    "schedule_minute": 0,
    "message_template": "🏠 Xin chào {customer_name},\n\nHĐ {contract_id} đến hạn đóng tiền thuê.\n💰 Số tiền: {monthly_rental} VNĐ\n📌 Trạng thái: {days_text}\n\nVui lòng thanh toán. Cảm ơn!",
    "is_enabled": true
  }'
```

> Có `message_template` → override message mặc định, dùng placeholder `{customer_name}`, `{contract_id}`, ...

#### Ví dụ 3: Nhắc bảo trì nhà hàng tháng (✨ Tự do)

```bash
curl -X POST http://localhost:8000/api/v1/scheduled-notifications/configs \
  -H "Content-Type: application/json" \
  -d '{
    "module_key": "rental",
    "module_name": "Cho Thuê",
    "notify_type": "rental_maintenance",
    "chat_id": "-1003991830930",
    "group_name": "Nhóm Quản Lý BĐS",
    "schedule_type": "monthly",
    "schedule_day_of_month": 15,
    "schedule_hour": 9,
    "schedule_minute": 0,
    "message_template": "🔧 <b>NHẮC NHỞ BẢO TRÌ ĐỊNH KỲ</b>\n\nVui lòng kiểm tra và bảo trì các hạng mục:\n• Hệ thống điện\n• Hệ thống nước\n• Điều hòa / Quạt\n• Cửa / Khóa\n\n<i>Liên hệ Admin nếu cần hỗ trợ.</i>",
    "is_enabled": true
  }'
```

> Loại Tự do: **bắt buộc** phải có `message_template` — gửi trực tiếp nội dung này.

#### Ví dụ 4: Nhắc họp đầu tuần (✨ Tự do — General)

```bash
curl -X POST http://localhost:8000/api/v1/scheduled-notifications/configs \
  -H "Content-Type: application/json" \
  -d '{
    "module_key": "general",
    "module_name": "Chung",
    "notify_type": "general_meeting",
    "chat_id": "-1003991830930",
    "group_name": "Nhóm Ban Giám Đốc",
    "schedule_type": "weekly",
    "schedule_day_of_week": 0,
    "schedule_hour": 8,
    "schedule_minute": 30,
    "message_template": "📋 <b>NHẮC NHỞ HỌP GIAO BAN ĐẦU TUẦN</b>\n\nThời gian: 9:00 sáng hôm nay\nĐịa điểm: Phòng họp tầng 2\n\n<i>Các thành viên vui lòng chuẩn bị báo cáo tuần.</i>",
    "is_enabled": true
  }'
```

> `schedule_day_of_week: 0` = Thứ Hai. (0=Mon, 1=Tue, ..., 6=Sun)

#### Ví dụ 5: Thông báo 1 lần vào ngày cụ thể

```bash
curl -X POST http://localhost:8000/api/v1/scheduled-notifications/configs \
  -H "Content-Type: application/json" \
  -d '{
    "module_key": "general",
    "module_name": "Chung",
    "notify_type": "general_announcement",
    "chat_id": "-1003991830930",
    "group_name": "Nhóm Toàn Công Ty",
    "schedule_type": "specific_date",
    "schedule_specific_date": "2026-08-15",
    "schedule_hour": 9,
    "schedule_minute": 0,
    "message_template": "🎉 <b>THÔNG BÁO NGHỈ LỄ</b>\n\nCông ty nghỉ lễ ngày 15/08/2026.\nChúc mọi người nghỉ ngơi vui vẻ! 🎊",
    "is_enabled": true
  }'
```

---

### 6.3 Danh sách configs — `GET /configs`

```bash
# Lấy tất cả
curl http://localhost:8000/api/v1/scheduled-notifications/configs

# Filter theo module
curl "http://localhost:8000/api/v1/scheduled-notifications/configs?module_key=credit"

# Filter theo trạng thái bật
curl "http://localhost:8000/api/v1/scheduled-notifications/configs?is_enabled=true"

# Filter theo notify_type
curl "http://localhost:8000/api/v1/scheduled-notifications/configs?notify_type=credit_interest"

# Kết hợp nhiều filter
curl "http://localhost:8000/api/v1/scheduled-notifications/configs?module_key=rental&is_enabled=true"
```

**Response** (200):

```json
[
  {
    "id": "9d56123b-...",
    "module_key": "credit",
    "notify_type": "credit_interest",
    "chat_id": "-1003991830930",
    "schedule_type": "daily",
    "schedule_hour": 8,
    "is_enabled": true,
    "...": "..."
  },
  {
    "id": "a1b2c3d4-...",
    "module_key": "rental",
    "notify_type": "rental_maintenance",
    "schedule_type": "monthly",
    "schedule_day_of_month": 15,
    "is_enabled": true,
    "...": "..."
  }
]
```

---

### 6.4 Chi tiết 1 config — `GET /configs/{id}`

```bash
curl http://localhost:8000/api/v1/scheduled-notifications/configs/9d56123b-3e97-4410-bfba-e35f26d174c1
```

---

### 6.5 Cập nhật config — `PUT /configs/{id}`

Chỉ gửi các field cần thay đổi (ngoại trừ `id` bắt buộc):

```bash
# Đổi giờ gửi từ 8:00 → 9:30
curl -X PUT http://localhost:8000/api/v1/scheduled-notifications/configs/9d56123b-3e97-4410-bfba-e35f26d174c1 \
  -H "Content-Type: application/json" \
  -d '{
    "id": "9d56123b-3e97-4410-bfba-e35f26d174c1",
    "schedule_hour": 9,
    "schedule_minute": 30
  }'
```

```bash
# Thêm/sửa message_template cho config Business
curl -X PUT http://localhost:8000/api/v1/scheduled-notifications/configs/9d56123b-3e97-4410-bfba-e35f26d174c1 \
  -H "Content-Type: application/json" \
  -d '{
    "id": "9d56123b-3e97-4410-bfba-e35f26d174c1",
    "message_template": "💰 Xin chào {customer_name}, HĐ {contract_id} đến hạn đóng lãi. Số tiền: {interest_debt} VND"
  }'
```

```bash
# Đổi chat_id đích (gửi sang nhóm khác)
curl -X PUT http://localhost:8000/api/v1/scheduled-notifications/configs/9d56123b-3e97-4410-bfba-e35f26d174c1 \
  -H "Content-Type: application/json" \
  -d '{
    "id": "9d56123b-3e97-4410-bfba-e35f26d174c1",
    "chat_id": "-100NEW_CHAT_ID",
    "group_name": "Nhóm mới"
  }'
```

---

### 6.6 Xóa config — `DELETE /configs/{id}`

```bash
curl -X DELETE http://localhost:8000/api/v1/scheduled-notifications/configs/9d56123b-3e97-4410-bfba-e35f26d174c1
```

**Response** (200):

```json
{
  "message": "Config deleted successfully",
  "id": "9d56123b-3e97-4410-bfba-e35f26d174c1"
}
```

---

### 6.7 Bật/tắt config — `PATCH /configs/{id}/toggle`

```bash
curl -X PATCH http://localhost:8000/api/v1/scheduled-notifications/configs/9d56123b-3e97-4410-bfba-e35f26d174c1/toggle
```

**Response** (200): Trả về config đã cập nhật với `is_enabled` đảo ngược:

```json
{
  "id": "9d56123b-...",
  "is_enabled": false,
  "...": "..."
}
```

> Gọi lại lần nữa → `is_enabled: true` (toggle).

---

### 6.8 Gửi test thủ công — `POST /configs/{id}/test`

Gửi thông báo **ngay lập tức** — bỏ qua schedule check. Dùng để kiểm tra config hoạt động đúng trước khi bật.

```bash
curl -X POST http://localhost:8000/api/v1/scheduled-notifications/configs/9d56123b-3e97-4410-bfba-e35f26d174c1/test
```

**Response (loại Tự do)** — gửi 1 message:

```json
{
  "config_id": "9d56123b-...",
  "notify_type": "general_meeting",
  "total_items": 0,
  "sent_count": 1,
  "results": [
    {"status": "SUCCESS", "message_id": 12345}
  ]
}
```

**Response (loại Business)** — gửi tối đa 3 items để test:

```json
{
  "config_id": "a1b2c3d4-...",
  "notify_type": "credit_interest",
  "total_items": 15,
  "sent_count": 3,
  "results": [
    {"status": "SUCCESS", "message_id": 12346, "reference_id": "HD-001"},
    {"status": "SUCCESS", "message_id": 12347, "reference_id": "HD-002"},
    {"status": "FAILED", "error": "Chat not found", "reference_id": "HD-003"}
  ]
}
```

> **Lưu ý**: Loại Business chỉ gửi **tối đa 3 items** khi test (tránh spam). Worker thật sẽ gửi toàn bộ.

---

### 6.9 Xem lịch sử gửi — `GET /logs`

```bash
# Tất cả logs
curl http://localhost:8000/api/v1/scheduled-notifications/logs

# Filter theo config_id
curl "http://localhost:8000/api/v1/scheduled-notifications/logs?config_id=9d56123b-3e97-4410-bfba-e35f26d174c1"

# Filter theo module
curl "http://localhost:8000/api/v1/scheduled-notifications/logs?module_key=credit"

# Filter theo trạng thái
curl "http://localhost:8000/api/v1/scheduled-notifications/logs?status=FAILED"

# Filter theo khoảng thời gian
curl "http://localhost:8000/api/v1/scheduled-notifications/logs?start_date=2026-07-01&end_date=2026-07-31"

# Tìm kiếm nội dung
curl "http://localhost:8000/api/v1/scheduled-notifications/logs?search_query=HD-001"

# Kết hợp
curl "http://localhost:8000/api/v1/scheduled-notifications/logs?module_key=credit&status=SUCCESS&start_date=2026-07-28"
```

**Response** (200):

```json
[
  {
    "id": "f1e2d3c4-...",
    "config_id": "9d56123b-...",
    "module_key": "credit",
    "notify_type": "credit_interest",
    "chat_id": "-1003991830930",
    "group_name": "Nhóm Tín Dụng",
    "reference_id": "HD-001",
    "reference_name": "Nguyễn Văn A",
    "message_id": 12345,
    "message_content": "🔔 THÔNG BÁO ĐÓNG TIỀN LÃI...",
    "status": "SUCCESS",
    "error_message": null,
    "scheduled_at": "2026-07-28T08:00:00",
    "sent_at": "2026-07-28T08:00:01.123456"
  }
]
```

---

### 6.10 Bảng tham chiếu nhanh: Tham số Schedule

| schedule_type | Tham số bắt buộc | Ví dụ |
|--------------|-------------------|-------|
| `daily` | `schedule_hour`, `schedule_minute` | Chạy 8:00 mỗi ngày |
| `weekly` | `schedule_hour`, `schedule_minute`, `schedule_day_of_week` | Chạy 8:30 thứ Hai (day=0) |
| `monthly` | `schedule_hour`, `schedule_minute`, `schedule_day_of_month` | Chạy 9:00 ngày 15 hàng tháng |
| `yearly` | `schedule_hour`, `schedule_minute`, `schedule_day_of_month`, `schedule_month` | Chạy 9:00 ngày 1/1 hàng năm |
| `specific_date` | `schedule_hour`, `schedule_minute`, `schedule_specific_date` | Chạy 9:00 ngày 2026-08-15 |

**Giá trị `schedule_day_of_week`:**

| Giá trị | Ngày |
|---------|------|
| 0 | Thứ Hai |
| 1 | Thứ Ba |
| 2 | Thứ Tư |
| 3 | Thứ Năm |
| 4 | Thứ Sáu |
| 5 | Thứ Bảy |
| 6 | Chủ Nhật |

### 6.11 Quy trình sử dụng khuyến nghị

```
Bước 1: Tạo config (POST /configs)
  │
  ├─ Đặt is_enabled = false (tạm tắt)
  │
Bước 2: Gửi test (POST /configs/{id}/test)
  │
  ├─ Kiểm tra message có xuất hiện đúng trong nhóm Telegram
  ├─ Kiểm tra nội dung, format, placeholder
  │
Bước 3: Xem logs (GET /logs?config_id={id})
  │
  ├─ Verify status = SUCCESS
  │
Bước 4: Bật config (PATCH /configs/{id}/toggle)
  │
  ├─ is_enabled → true
  └─ Worker sẽ tự động gửi theo lịch đã cấu hình
```

---

## Phụ lục: Cấu trúc file sau khi hoàn thành

```
backend/
├── app/
│   ├── api/v1/
│   │   └── scheduled_notification.py          ← [NEW] REST API endpoints
│   ├── crud/
│   │   └── scheduled_notification.py          ← [NEW] CRUD functions
│   ├── models/
│   │   └── scheduled_notification.py          ← [NEW] SQLAlchemy models
│   ├── schemas/
│   │   └── scheduled_notification.py          ← [NEW] Pydantic schemas
│   └── main.py                                ← [MODIFY] Thêm router + worker
├── bot/
│   └── utils/
│       ├── scheduler.py                       ← [MODIFY] Thêm unified worker
│       ├── notify_resolvers.py                ← [NEW] Module resolvers
│       └── schedule_evaluator.py              ← [NEW] Schedule logic
├── alembic/
│   └── versions/
│       └── 7784f5563527_add_scheduled_notify.py ← [NEW] Migration
└── docs/
    └── scheduled_notification_system.md       ← [THIS FILE]
```
