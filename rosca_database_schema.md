# Thiết Kế Cơ Sở Dữ Liệu: Hệ Thống Quản Lý Hụi (ROSCA)

Tài liệu này mô tả chi tiết thiết kế cơ sở dữ liệu để vận hành một hệ thống quản lý Hụi, đáp ứng nghiệp vụ cho cả **Chủ hụi** và **Người chơi**. Thay vì gom tất cả vào một bảng (gây lặp dữ liệu và khó tính toán), hệ thống được chuẩn hóa thành 3 bảng chính để quản lý linh hoạt từng kỳ khui hụi và dòng tiền.

---

## 1. Bảng `Roscas` (Thông tin Dây Hụi / Bát Hụi)
Bảng này đóng vai trò lưu trữ "Luật chơi" và thông tin cấu hình chung của cả 1 dây hụi. *Chủ hụi sẽ thao tác chính với bảng này khi tạo dây mới.*

| Tên trường (Field) | Kiểu dữ liệu | Mô tả chi tiết | Đối chiếu với yêu cầu |
| :--- | :--- | :--- | :--- |
| `id` | UUID/Int | Khóa chính định danh dây hụi | |
| `code` | String | Mã số dây hụi | **Mã hụi** |
| `owner_id` | UUID | Người làm chủ hụi (FK -> Users) | **Chủ hụi** |
| `base_amount` | Decimal | Số tiền gốc 1 phần/chân (VD: Hụi 10 triệu) | |
| `min_bid_amount` | Decimal | Mức kêu giá/bỏ hụi thấp nhất | **Số tiền đóng tối thiểu** |
| `max_bid_amount` | Decimal | Mức kêu giá/bỏ hụi cao nhất (trần) | **Số tiền đóng tối đa** |
| `total_parts` | Int | Tổng số lượng chân hụi tham gia | **Số chân tham gia** |
| `commission_fee` | Decimal | Mức tiền chủ hụi lấy mỗi kỳ khui | **Tiền thảo** |
| `start_date` | Date | Ngày bắt đầu dây hụi | **Ngày mở hụi** |
| `end_date` | Date | Ngày dự kiến kết thúc dây hụi | **Ngày kết thúc hụi** |
| `bidding_time` | Time | Giờ bỏ thăm / khui hụi hàng kỳ | **Giờ bỏ hụi** |
| `period_type` | Enum | Loại hụi (Hụi Ngày, Hụi Tháng, v.v.) | |
| `status` | Enum | Trạng thái (Draft, Active, Closed) | |
| `note` | Text | Ghi chú chung của dây hụi | **Note** |

---

## 2. Bảng `Rosca_Members` (Danh sách Chân Hụi / Người Chơi)
Bảng này quản lý danh sách những người tham gia vào một dây hụi cụ thể. Nơi đây lưu trữ các chỉ số tổng hợp về dòng tiền để hiển thị lên App cho người chơi xem.

| Tên trường (Field) | Kiểu dữ liệu | Mô tả chi tiết | Đối chiếu với yêu cầu |
| :--- | :--- | :--- | :--- |
| `id` | UUID/Int | Khóa chính | |
| `rosca_id` | UUID | Dây hụi đang tham gia (FK -> Roscas) | |
| `player_id` | UUID | Thông tin người chơi (FK -> Users) | |
| `parts_count` | Int | Số lượng chân chơi (VD: 1 người chơi 2 chân) | |
| `total_contributed`| Decimal | Tổng tiền đã đóng từ đầu dây đến hiện tại | |
| `total_received` | Decimal | Tổng tiền đã nhận (nếu đã hốt hụi) | |
| `total_profit` | Decimal | `total_received` - `total_contributed` | **Tổng lợi nhuận** |
| `profit_rate` | Float | Phần trăm lợi nhuận sinh ra (%) | **Tỷ suất lợi nhuận** |
| `status` | Enum | Trạng thái (Playing, Defaulted - Bể hụi) | |
| `note` | Text | Ghi chú riêng cho người chơi này | **Note** |

---

## 3. Bảng `Rosca_Rounds` (Chi tiết các Kỳ Khui Hụi)
Bảng này lưu lại lịch sử của từng kỳ (lần) mở hụi. Mỗi khi đến "Giờ bỏ hụi", Chủ hụi sẽ cập nhật thông tin vào đây.

| Tên trường (Field) | Kiểu dữ liệu | Mô tả chi tiết | Đối chiếu với yêu cầu |
| :--- | :--- | :--- | :--- |
| `id` | UUID/Int | Khóa chính | |
| `rosca_id` | UUID | Ký khui của dây hụi nào? (FK -> Roscas) | |
| `round_number` | Int | Kỳ thứ mấy (Kỳ 1, Kỳ 2...) | |
| `bidding_date` | Date | Ngày thực hiện khui hụi | |
| `winner_member_id`| UUID | Ai là người trúng/hốt hụi? (FK -> Members)| |
| `bid_amount` | Decimal | Giá người thắng đã kêu/bỏ | |
| `withdrawn_amount`| Decimal | Tiền thực nhận sau khi trừ thảo & hụi chết | **Số tiền rút hụi** |
| `commission_taken`| Decimal | Số tiền thảo thực tế chủ hụi đã thu kỳ này | |
| `living_fee` | Decimal | Tiền Hụi sống (Người chưa hốt cần đóng) | |
| `dead_fee` | Decimal | Tiền Hụi chết (Người đã hốt cần đóng) | |
| `status` | Enum | Trạng thái kỳ (Pending, Completed) | |

---

## 💡 Luồng Hoạt Động (Workflow)

### Dành cho Chủ hụi (Owner)
1. **Khởi tạo:** Tạo 1 record ở bảng `Roscas` (nhập Mã, Tiền thảo, Số chân...) và thêm người vào `Rosca_Members`.
2. **Khui hụi:** Đến ngày giờ khui, tạo 1 record ở bảng `Rosca_Rounds`. Nhập `winner_member_id` (người hốt) và `bid_amount` (giá bỏ).
3. **Theo dõi:** Hệ thống tự động tính ra `living_fee` và `dead_fee` để chủ hụi đi thu.

### Dành cho Người chơi (Player)
1. **Tham gia:** Mở App, xem thông tin dây mình được add ở bảng `Roscas`.
2. **Theo dõi dòng tiền:** Bất cứ khi nào chủ hụi cập nhật kỳ khui, hệ thống tự chia tiền, cập nhật tiền cần nộp, tự động tính lại **Tổng lợi nhuận** (`total_profit`) và **Tỷ suất** (`profit_rate`) ở bảng `Rosca_Members`.
3. **Rút hụi:** Khi trúng, người chơi thấy ngay **Số tiền rút hụi** (`withdrawn_amount`) mình sẽ được nhận trong kỳ đó ở bảng `Rosca_Rounds`.
