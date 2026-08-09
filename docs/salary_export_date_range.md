# Bộ lọc Khoảng thời gian cho tab Xuất lương

Tài liệu tính năng: bổ sung bộ lọc **Khoảng thời gian (từ ngày → đến ngày)** bên cạnh bộ lọc **Tháng** sẵn có ở tab *Xuất lương*.

* **Màn hình:** `/ggomoosin/hr` và `/tien-nga/hr` → tab **Xuất lương**
* **Ngày cập nhật:** 08/08/2026
* **Phạm vi:** frontend (`HDG_Group_Frontend`) + backend (`backend`)
* **Migration DB:** không có — schema bảng `payrolls` giữ nguyên

---

## 1. Tính năng

Tab Xuất lương giờ có **hai** bộ lọc thời gian:

| Bộ lọc | Kiểu | Định dạng | Ví dụ |
|---|---|---|---|
| **Thời gian** | `el-date-picker type="month"` | `YYYY-MM` | `2026-06` |
| **Khoảng thời gian** | `el-date-picker type="daterange"` | `YYYY-MM-DD` | `2026-04-15` → `2026-06-10` |

**Hai bộ lọc dùng được đồng thời** và bổ sung cho nhau:

| Chọn | Ý nghĩa | Kết quả |
|---|---|---|
| Chỉ **Tháng** | Kỳ lương là trọn tháng đó | Hành vi cũ, y hệt trước khi có tính năng |
| Chỉ **Khoảng** | Kỳ lương là các ngày đó | Kỳ được ghi vào **tháng bắt đầu** |
| **Cả hai** | Tháng = bảng lương thuộc tháng nào · Khoảng = kỳ thực tế gồm những ngày nào | Cách dùng khuyến nghị cho chu kỳ lệch tháng |

Cả hai đều `clearable`; nhấn *Tìm kiếm* khi cả hai đều trống sẽ báo lỗi.

**Ví dụ chu kỳ lệch tháng.** Chọn **Tháng 07/2026** cùng khoảng **05/07/2026 → 04/08/2026**: đây là **bảng lương tháng 7**, công chuẩn là 26 ngày làm việc nằm trong kỳ, nhân viên đi làm đủ nhận **trọn một tháng lương**, và bản ghi `Payroll` được ghi vào tháng 07/2026. Xem mục 3 để hiểu đầy đủ.

Nếu tháng được chọn **không nằm trong khoảng** (ví dụ Tháng 3 với khoảng 05/07 → 04/08), API trả về `400` để chặn ghi nhầm tháng.

Bộ chọn khoảng có sẵn 4 shortcut: **Tháng này**, **Tháng trước**, **30 ngày qua**, **Quý này**.

Sau khi tìm kiếm, kỳ lương đang áp dụng hiển thị bằng tag ngay trên các thẻ tổng hợp. Ở chế độ khoảng có thêm tag nhắc kỳ được ghi vào tháng nào.

### Ảnh hưởng tới xuất Excel

| | Chỉ tháng | Chỉ khoảng | Cả hai |
|---|---|---|---|
| Tiêu đề | `BẢNG LƯƠNG THÁNG 06/2026` | `BẢNG LƯƠNG KỲ 05/07/2026 - 04/08/2026` | `BẢNG LƯƠNG THÁNG 07/2026 (KỲ 05/07/2026 - 04/08/2026)` |
| Tên file | `Bang_luong_06_2026.xlsx` | `Bang_luong_20260705_20260804.xlsx` | `Bang_luong_07_2026.xlsx` |
| Tên sheet | `Lương 06_2026` | `Lương 20260705_20260804` | `Lương 07_2026` |

---

## 2. Thay đổi API

### 2.1. `GET /api/v1/get-salaries`

```
# chỉ tháng
GET /api/v1/get-salaries?pre_id=G&date=06/2026

# chỉ khoảng — kỳ ghi vào tháng bắt đầu
GET /api/v1/get-salaries?pre_id=G&start_date=2026-07-05&end_date=2026-08-04

# cả hai — kỳ 05/07-04/08 ghi vào tháng 7 (khuyến nghị)
GET /api/v1/get-salaries?pre_id=G&date=07/2026&start_date=2026-07-05&end_date=2026-08-04
```

| Tham số | Định dạng | Trước | Sau |
|---|---|---|---|
| `pre_id` | chuỗi | tùy chọn | không đổi |
| `date` | `mm/yyyy` | **bắt buộc** | **tùy chọn** |
| `start_date` | `yyyy-mm-dd` | — | **mới**, tùy chọn |
| `end_date` | `yyyy-mm-dd` | — | **mới**, tùy chọn |

* `date` một mình → kỳ là trọn tháng đó.
* `start_date` + `end_date` một mình → kỳ là các ngày đó, ghi vào tháng bắt đầu.
* **Cả ba** → khoảng quyết định các ngày, `date` quyết định tháng ghi sổ.
* Không truyền gì → `400`.
* `date` nằm ngoài khoảng → `400`.

`GetSalaryResponse` giữ nguyên 15 trường cũ, **thêm** 3 trường:

```jsonc
{
  "employee_id": "G010",
  "employee_name": "Huỳnh Công Nhân",
  "standard_workdays": 26,        // ngày công chuẩn TRONG kỳ
  "actual_workdays": 4.0,
  "base_salary": 6700000,         // nguyên tháng, KHÔNG chia tỷ lệ
  // ... các trường tiền khác giữ nguyên tên
  "status": "draft",              // draft | exported
  "start_date": "2026-07-05",     // MỚI
  "end_date": "2026-08-04",       // MỚI
  "period_year": 2026,            // MỚI — tháng ghi sổ (tháng bắt đầu)
  "period_month": 7,              // MỚI
  "is_range": true                // MỚI
}
```

**Lỗi `400` có thể gặp:**

| Tình huống | Thông báo |
|---|---|
| Không truyền tham số thời gian nào | `Either date (mm/yyyy) or start_date + end_date (yyyy-mm-dd) is required.` |
| Chỉ truyền một đầu của khoảng | `Both start_date and end_date are required when filtering by range.` |
| `start_date > end_date` | `start_date must not be after end_date.` |
| Sai định dạng ngày | `Invalid start_date format. Expected yyyy-mm-dd.` |
| `date` nằm ngoài khoảng | `Month 03/2026 is outside the range 2026-07-05 - 2026-08-04.` |

### 2.2. `GET /api/v1/get-payrolls`

Thêm `start_date` / `end_date` (`yyyy-mm-dd`), ưu tiên hơn `date`. Vì bảng `payrolls` khóa theo `year`/`month`, bộ lọc khoảng lấy **mọi bản ghi thuộc các tháng mà khoảng chạm tới**.

### 2.3. `POST /api/v1/add-payrolls`

`PayrollCreate` nhận thêm `start_date` / `end_date` tùy chọn:

```jsonc
{
  "employee_id": "G010",
  "year": 2026, "month": 7,          // = period_year / period_month
  "start_date": "2026-07-05",        // MỚI, tùy chọn
  "end_date": "2026-08-04",          // MỚI, tùy chọn
  "unapproved_leave": 3,
  "base_salary_amount": 0,
  "overtime_salary_amount": 0,
  "total_salary": 0
}
```

Khi có kỳ:
* Bản ghi được lưu vào tháng mà kỳ **bắt đầu** (`period_month` từ `get-salaries`).
* `note` = `"Kỳ lương: 05/07/2026 - 04/08/2026"`.
* `leave` chỉ đếm bản ghi chấm công nằm trong kỳ (đã cắt về đúng tháng của bản ghi) thay vì cả tháng.

Không truyền hai trường này → hành vi y như trước.

---

## 3. Công thức tính lương theo khoảng

> **Nguyên tắc:** một khoảng ngày là **một kỳ lương duy nhất, bằng một tháng lương** — không phải tổng của các phần tháng.

### Ngày công chuẩn của kỳ

Đếm số ngày làm việc (theo `work_type` của nhân viên) **nằm trong chính kỳ đó**:

```
S_kỳ = số ngày làm việc trong [start_date, end_date]
```

Ví dụ kỳ `05/07/2026 → 04/08/2026` với `work_type = 3` (nghỉ Chủ nhật):

| Phần | Ngày công |
|---|---|
| 05/07 → 31/07 | 23 |
| 01/08 → 04/08 | 3 |
| **S_kỳ** | **26 ngày** |

### Công thức

Các khoản theo tháng được tính **trọn vẹn một lần** cho cả kỳ. Lương tăng ca lấy chính xác từ chấm công trong kỳ. Đây đúng là công thức tháng cũ, chỉ thay mẫu số:

```
total = (base + ot_amt + lunch + productivity + other) / S_kỳ × actual
        + bonus − bhxh − penalty
```

trong đó `actual` = ngày công thực tế từ chấm công trong kỳ, `ot_amt` = giờ tăng ca trong kỳ × đơn giá.

### Kỳ thuộc về tháng nào

Do **bộ lọc Tháng** quyết định. Chọn Tháng 07/2026 cùng khoảng `05/07 → 04/08` thì bản ghi `Payroll` được ghi với `year=2026, month=7`.

Không chọn tháng thì kỳ mặc định thuộc **tháng bắt đầu** của khoảng.

Tháng được chọn phải nằm trong khoảng, nếu không API trả `400`. Với khoảng `05/07 → 04/08` thì chỉ chấp nhận tháng 7 hoặc tháng 8.

API luôn trả về `period_year` / `period_month` để frontend dùng trực tiếp làm khóa, không phải tự suy ra.

### Tính chất bảo toàn

Khoảng phủ trọn đúng một tháng dương lịch cho **kết quả giống hệt** chế độ tháng:

* `start_date=2026-06-01&end_date=2026-06-30` ≡ `date=06/2026`

Đã kiểm chứng trên dữ liệu thật cho tháng 5, 6, 7/2026 — lệch 0 trên cả 13 trường (xem mục 5).

### ⚠️ Khoảng phủ nhiều tháng

Vì một khoảng là *một* kỳ lương, chọn `01/05 → 30/06` **không** cho ra tổng lương hai tháng, mà cho ra **một tháng lương** trải trên số ngày công của cả hai tháng.

Chế độ khoảng dành cho **chu kỳ trả lương lệch tháng** (mùng 5 đến mùng 4, ngày 26 đến ngày 25...). Muốn xem nhiều tháng thì tra từng tháng một.

### Trạng thái

| `status` | Ý nghĩa | Hiển thị trên UI |
|---|---|---|
| `draft` | Tháng của kỳ chưa có bản ghi `Payroll` | *Nháp* (xám) |
| `exported` | Tháng của kỳ đã có bản ghi `Payroll` | *Đã xuất* (xanh) |

---

## 4. File đã thay đổi

### Backend (`d:\ExtraJob\backend`)

| File | Thay đổi |
|---|---|
| `app/api/v1/salary.py` | Viết lại `get_salaries`: gộp hai chế độ về một đường tính theo cửa sổ ngày. Thêm helper `_parse_month`, `_parse_day`, `_month_windows`, `_working_days`. |
| `app/schemas/salary.py` | `GetSalaryResponse` thêm `start_date`, `end_date`, `is_range`. |
| `app/api/v1/attendance.py` | `get_payrolls` thêm lọc theo khoảng; `add_payrolls` ghi nhận kỳ vào `note` và thu hẹp phạm vi đếm `leave`. |
| `app/schemas/payroll.py` | `PayrollCreate` thêm `start_date`, `end_date`. |
| `docs/api_documentation.md` | Bổ sung mục D2 (công thức theo khoảng), D3 (ghi nhận kỳ) và bảng tham số thời gian. |

### Frontend (`d:\ExtraJob\HDG_Group_Frontend`)

| File | Thay đổi |
|---|---|
| `src/api/employeeService.ts` | `getSalaries` và `getPayrolls` nhận thêm `startDate`, `endDate`. |
| `src/components/Ggomoosin/HR/SalaryExport.vue` | Thêm bộ lọc khoảng dùng chung với bộ lọc tháng, shortcut, nhãn kỳ lương, đặt tên Excel theo kỳ, CSS dark mode cho range picker. |
| `src/components/TienNga/HR/SalaryExport.vue` | Đồng bộ y hệt, chỉ khác `PRE_ID`. |

> **Lưu ý bảo trì:** hai file `SalaryExport.vue` là bản sao của nhau, chỉ khác đúng dòng `const PRE_ID`. Mọi thay đổi phải áp dụng cho **cả hai**. Nên tách thành composable dùng chung khi có dịp.

---

## 5. Kiểm thử đã thực hiện

### Tự động

* `pnpm type-check` — sạch. `pnpm build-only` — build thành công.
* `py_compile` toàn bộ file backend đã sửa — sạch.
* **Unit test helper** (10 case): cắt cửa sổ tháng cho khoảng trọn tháng / nhiều tháng / vắt qua năm / một ngày; đếm ngày công; parser chấp nhận đầu vào hợp lệ và từ chối đầu vào sai.
* **Test end-to-end trên DB thật** (7 nhân viên `pre_id=G`):

| Kiểm tra | Kết quả |
|---|---|
| **Tháng 7 + khoảng `05/07 → 04/08`** (kịch bản chính) | Chạy được, công chuẩn **26 ngày**, `period_month = 7` cho 7/7 nhân viên |
| Chỉ khoảng, không chọn tháng | Kết quả **y hệt** trường hợp trên, lệch 0 |
| Tháng 8 + cùng khoảng đó | `period_month = 8`, số tiền **không đổi** — chỉ đổi tháng ghi sổ |
| Chỉ chọn tháng 7 | Công chuẩn 27 (trọn tháng), khác với 26 của kỳ — đúng |
| Khoảng trọn tháng + đúng tháng đó vs chế độ tháng (T5, T6, T7/2026) | Lệch **0** trên cả 13 trường, 7/7 nhân viên, cả 3 tháng |
| Lương cơ bản trong kỳ | Nguyên tháng `6,700,000` — không bị chia tỷ lệ |
| Đi làm đủ 26/26 ngày của kỳ | Bằng đúng đi đủ 27/27 ngày của tháng 7 → **một tháng lương trọn vẹn** |
| Tháng nằm ngoài khoảng (Tháng 3 + `05/07 → 04/08`) | Trả `400`: `Month 03/2026 is outside the range...` |
| 4 trường hợp lỗi đầu vào khác | Đều trả về `400` với thông báo đúng |

### Cần kiểm thử thủ công trên UI

| # | Kịch bản | Kỳ vọng |
|---|---|---|
| T1 | Chọn tháng 06/2026 → Tìm kiếm | Số liệu như trước khi có tính năng |
| T2 | Chọn khoảng 01/06→30/06 | Giống hệt T1 |
| T3 | Tháng 07/2026 **+** khoảng 05/07→04/08 | Công chuẩn 26; tag ghi "Bảng lương ghi vào tháng 07/2026" |
| T4 | Chọn tháng và khoảng cùng lúc | Cả hai ô giữ nguyên giá trị, không ô nào bị xóa |
| T4b | Tháng 03/2026 + khoảng 05/07→04/08 | Báo lỗi "Month 03/2026 is outside the range..." |
| T5 | Xóa cả hai → Tìm kiếm | Cảnh báo "Vui lòng chọn tháng hoặc khoảng thời gian" |
| T6 | Xuất Excel ở cả hai chế độ | Tiêu đề / tên file / tên sheet mang đúng kỳ |
| T7 | Xuất lương ở chế độ khoảng | Bản ghi vào tháng **bắt đầu**; `note` ghi đúng kỳ |
| T8 | Xuất lương lần hai cùng kỳ | Trả về `409` (hành vi cũ, chưa đổi) |
| T9 | Dark mode | Range picker nền tối, chữ sáng, không bị trắng |
| T10 | Tab TienNga | Hành vi giống hệt Ggomoosin |
| T11 | Khoảng vắt qua năm (20/12/2025→05/01/2026) | Ghi vào tháng 12/2025, không lỗi |

---

## 6. Hạn chế đã biết & rủi ro

| Mức | Vấn đề | Ghi chú |
|---|---|---|
| 🔴 | **Không chấm công → lương âm.** Công thức là `(...) × thực_tế/chuẩn + thưởng − BHXH − phạt`. Khi ngày công thực tế bằng 0, phần lương bằng 0 nhưng BHXH vẫn bị trừ nguyên → kết quả âm. Ví dụ tháng 08/2026 trả về `-703,500` cho G010. | **Lỗi có sẵn trong code cũ**, không phải do tính năng khoảng. Nhưng chế độ khoảng làm dễ gặp hơn vì kỳ hay chạm sang tháng chưa có dữ liệu chấm công. Cần chốt: kẹp về 0, hay chỉ trừ BHXH khi có ngày công. |
| 🟡 | **Khoảng phủ nhiều tháng cho ra một tháng lương**, không phải tổng các tháng. | Đúng theo nguyên tắc "một kỳ = một tháng lương", nhưng dễ gây hiểu nhầm nếu người dùng chọn `01/05 → 30/06` với ý định xem 2 tháng. Cân nhắc cảnh báo trên UI khi khoảng dài hơn ~35 ngày. |
| 🟡 | **Chưa chặn xuất lương trùng kỳ.** UI vẫn cho chọn dòng đã `exported`; backend trả `409` cho cả lô. | Nên disable dòng đã xuất ở bước sau. |
| 🟡 | **Kỳ lệch tháng ghi đè khóa của tháng bắt đầu.** Xuất kỳ `05/07 → 04/08` rồi sau đó muốn xuất riêng tháng 7 trọn vẹn sẽ bị `409` vì đã có bản ghi cho `(G010, 2026, 7)`. | Đúng về mặt nghiệp vụ (một tháng chỉ có một kỳ lương), nhưng cần người dùng hiểu rõ. |
| 🟡 | **Repo backend đang có 2 alembic head chưa merge** (`c1d2e3f4a5b6`, `d1e2f3a4b5c6`). | Đây là lý do tính năng này cố tình tránh migration. Cần xử lý trước khi thêm cột mới. |
| 🟢 | Khoảng quá dài sẽ lặp truy vấn chấm công theo từng tháng, từng nhân viên. | Chưa giới hạn độ dài khoảng. |

---

## 7. Việc nên làm tiếp

1. **Chốt cách xử lý lương âm** khi không có ngày công (mục 6, dòng đỏ) — đây là lỗi có sẵn nhưng đáng sửa.
2. Merge 2 alembic head, sau đó cân nhắc thêm cột `start_date` / `end_date` vào bảng `payrolls` để lưu kỳ lương có cấu trúc thay vì ghi vào `note`.
3. Tách `SalaryExport.vue` thành composable dùng chung cho Ggomoosin và TienNga.
4. Disable nút *Xuất lương* cho các dòng đã ở trạng thái `exported`.
5. Cân nhắc cảnh báo trên UI khi người dùng chọn khoảng dài hơn một chu kỳ lương.
