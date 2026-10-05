<!--
  MỤC 649 (05/10/2026) — LỊCH SỬ CHECK IN/OUT TẬP TRUNG.

  s68 05/10: *"Thêm tab lịch sử check in / out của tất cả nhân viên
  ggomoosin để cho bộ phận nhân sự check luôn. Thay vì check trên từng
  nhóm telegram của từng nhân sự. Thì check tập trung trên web. Sau khi
  check xong thì xác nhận và tính tiền lương cho từng người."*

  🔴 MÀN NÀY XẾP NGƯỜI CẦN XỬ LÝ LÊN ĐẦU, KHÔNG XẾP THEO TÊN

  Nhân sự mở màn này để tìm chỗ SAI, không phải để đọc hết. Xếp theo tên
  thì người có 9 ngày thiếu chấm công nằm giữa danh sách và bị cuộn qua.
  Backend đã xếp theo số dòng bất thường giảm dần — frontend giữ nguyên
  thứ tự đó, KHÔNG xếp lại.

  🔴 MỖI DÒNG ĐÁNG NGỜ NÓI RÕ VÌ SAO

  Tô đỏ một ô thì người đọc vẫn phải tự đoán. Backend trả về danh sách lý
  do cụ thể ("Có vào, KHÔNG có ra", "Tăng ca 2.0 giờ CHƯA ai duyệt") và
  màn này in thẳng ra.

  ⚠️ KHÔNG CÓ NÚT XOÁ, KHÔNG CÓ NÚT SỬA. Màn này chỉ ĐỌC. Sửa công vẫn ở
  tab *Chấm công*, chốt lương vẫn ở tab *Xuất lương* — nơi đã có đủ ràng
  buộc. Thêm đường ghi thứ hai vào cùng một bảng là tạo hai chỗ sửa cho
  một dữ liệu, và sớm muộn chúng khác nhau.
-->
<template>
  <div class="lich-su-container h-full flex flex-col">
    <!-- ── Thanh lọc ────────────────────────────────────────────── -->
    <div class="flex items-center gap-3 flex-wrap mb-4 shrink-0">
      <div class="flex items-center gap-2">
        <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">
          Khoảng thời gian:
        </span>
        <!--
          ⚠️ THEO ĐÚNG QUY ƯỚC ĐÃ CÓ của `SalaryExport.vue` cùng thư mục:
          `type="daterange"`, hiện `DD/MM/YYYY`, giá trị `YYYY-MM-DD`,
          kèm `:editable="false"` và lớp `custom-dark-input`.

          Bản đầu của mục này viết hai ô `type="date"` với
          `value-format="DD/MM/YYYY"` — chạy được, nhưng là kiểu thứ hai
          cho cùng một việc trong cùng một màn. Người dùng bấm sang tab
          *Xuất lương* thấy ô ngày khác hẳn, và lần sau ai sửa định dạng
          ngày phải nhớ có hai chỗ.
        -->
        <el-date-picker
          v-model="khoangNgay"
          :editable="false"
          type="daterange"
          range-separator="đến"
          start-placeholder="Từ ngày"
          end-placeholder="Đến ngày"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
          :clearable="false"
          class="custom-dark-input"
          style="width: 260px"
        />
      </div>

      <!--
        Mặc định TẮT. Bật sẵn thì người mới vào màn thấy một bảng ngắn và
        tưởng cả dự án chỉ có mấy dòng công.
      -->
      <el-checkbox v-model="chiBatThuong" class="whitespace-nowrap">
        Chỉ hiện dòng cần xem lại
      </el-checkbox>

      <el-button type="primary" :icon="Search" :loading="dangTai" @click="taiLai">
        Tìm kiếm
      </el-button>
    </div>

    <!-- ── Bốn con số chốt ──────────────────────────────────────── -->
    <div v-if="duLieu" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 shrink-0">
      <div class="the-so">
        <div class="the-nhan">NHÂN VIÊN CÓ CÔNG</div>
        <div class="the-gia-tri">
          {{ duLieu.tong.so_nhan_vien }}
          <span class="text-sm font-normal text-gray-500">
            / {{ duLieu.tong.so_nhan_vien_cua_du_an }}
          </span>
        </div>
      </div>
      <div class="the-so">
        <div class="the-nhan">TỔNG DÒNG CÔNG</div>
        <div class="the-gia-tri">{{ duLieu.tong.so_dong }}</div>
      </div>
      <!--
        Số cần xem lại dùng màu ĐỎ theo quy tắc nhận diện: đây là con số
        càng lớn càng xấu. Để màu xanh như ba ô kia thì nhìn lướt không
        phân biệt được ô nào là tin xấu.
      -->
      <div class="the-so">
        <div class="the-nhan">DÒNG CẦN XEM LẠI</div>
        <div class="the-gia-tri" :class="duLieu.tong.so_bat_thuong > 0 ? 'mau-xau' : ''">
          {{ duLieu.tong.so_bat_thuong }}
        </div>
      </div>
      <div class="the-so">
        <div class="the-nhan">ĐÃ CHỐT LƯƠNG</div>
        <div class="the-gia-tri">
          {{ duLieu.tong.so_nguoi_da_chot_luong }}
          <span class="text-sm font-normal text-gray-500">
            / {{ duLieu.tong.so_nhan_vien }}
          </span>
        </div>
      </div>
    </div>

    <el-alert
      v-if="duLieu && duLieu.ghi_chu"
      :title="duLieu.ghi_chu"
      type="info"
      :closable="false"
      show-icon
      class="mb-3 shrink-0"
    />

    <!-- ── Danh sách theo người ─────────────────────────────────── -->
    <div class="flex-1 overflow-auto">
      <el-empty
        v-if="!dangTai && duLieu && !duLieu.nhan_vien.length"
        :description="duLieu.chu_khi_rong || 'Không có dòng chấm công nào.'"
      />

      <el-collapse v-model="dangMo">
        <el-collapse-item
          v-for="nv in duLieu?.nhan_vien || []"
          :key="nv.ma_nhan_vien"
          :name="nv.ma_nhan_vien"
        >
          <template #title>
            <div class="flex items-center gap-2 flex-wrap w-full pr-3">
              <span class="font-semibold">{{ nv.ma_nhan_vien }}</span>
              <span>{{ nv.ho_ten }}</span>

              <el-tag v-if="nv.trang_thai === 'inactive'" type="info" size="small">
                Đã nghỉ việc
              </el-tag>

              <!--
                Nhãn đỏ chỉ hiện khi THẬT SỰ có dòng cần xem. Hiện nhãn
                "0 dòng cần xem" cho mọi người là nhiễu, và lâu ngày mắt
                bỏ qua luôn cả nhãn thật.
              -->
              <el-tag
                v-if="nv.tom_tat.so_dong_bat_thuong > 0"
                type="danger"
                size="small"
              >
                {{ nv.tom_tat.so_dong_bat_thuong }} dòng cần xem
              </el-tag>

              <el-tag v-if="nv.da_chot_luong" type="success" size="small">
                Đã chốt lương {{ nv.ky_da_chot.join(', ') }}
              </el-tag>
              <el-tag v-else type="warning" size="small">Chưa chốt lương</el-tag>

              <span class="ml-auto text-sm text-gray-500 whitespace-nowrap">
                {{ nv.tom_tat.so_ngay_co_cham }} ngày công ·
                {{ nv.tom_tat.tong_gio_lam }} giờ
              </span>
            </div>
          </template>

          <!-- Tóm tắt của riêng người này -->
          <div class="flex gap-4 flex-wrap mb-3 text-sm">
            <span>Ngày nghỉ: <b>{{ nv.tom_tat.so_ngay_nghi }}</b></span>
            <span :class="nv.tom_tat.so_ngay_thieu_cham ? 'mau-xau' : ''">
              Thiếu vào/ra: <b>{{ nv.tom_tat.so_ngay_thieu_cham }}</b>
            </span>
            <span>Tổng tăng ca: <b>{{ nv.tom_tat.tong_tang_ca }}</b> giờ</span>
            <span :class="nv.tom_tat.tang_ca_chua_duyet ? 'mau-xau' : ''">
              Tăng ca chưa duyệt: <b>{{ nv.tom_tat.tang_ca_chua_duyet }}</b>
            </span>
          </div>

          <!-- Màn rộng: bảng. Màn hẹp: thẻ. Ngưỡng dùng chung MỤC 396. -->
          <el-table
            v-if="!laManHep"
            :data="nv.dong"
            size="small"
            border
            :row-class-name="toDongXau"
          >
            <el-table-column prop="ngay" label="Ngày" width="110" />
            <el-table-column prop="thu" label="Thứ" width="80" />
            <el-table-column label="Giờ vào" width="90">
              <template #default="{ row }">
                <span :class="!row.gio_vao ? 'mau-xau' : ''">
                  {{ row.gio_vao || '—' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="Giờ ra" width="90">
              <template #default="{ row }">
                <span :class="!row.gio_ra ? 'mau-xau' : ''">
                  {{ row.gio_ra || '—' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="gio_lam" label="Giờ làm" width="90" />
            <el-table-column prop="di_tre" label="Trễ" width="80" />
            <el-table-column label="Tăng ca" width="110">
              <template #default="{ row }">
                <span v-if="!row.tang_ca">—</span>
                <span v-else>
                  {{ row.tang_ca }}
                  <el-tag
                    v-if="row.tang_ca_da_duyet === true"
                    type="success"
                    size="small"
                  >đã duyệt</el-tag>
                  <el-tag
                    v-else-if="row.tang_ca_da_duyet === false"
                    type="info"
                    size="small"
                  >không tính</el-tag>
                  <el-tag v-else type="danger" size="small">chưa duyệt</el-tag>
                </span>
              </template>
            </el-table-column>
            <el-table-column label="Cần xem lại" min-width="240">
              <template #default="{ row }">
                <span v-if="!row.bat_thuong.length" class="text-gray-400">—</span>
                <div v-else class="flex flex-col gap-1">
                  <span
                    v-for="(ly, i) in row.bat_thuong"
                    :key="i"
                    class="mau-xau text-sm"
                  >{{ ly }}</span>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <div v-else class="flex flex-col gap-2">
            <div
              v-for="(row, i) in nv.dong"
              :key="i"
              class="the-dong"
              :class="row.bat_thuong.length ? 'the-dong-xau' : ''"
            >
              <div class="flex justify-between">
                <b>{{ row.ngay }} {{ row.thu }}</b>
                <span>{{ row.gio_vao || '—' }} → {{ row.gio_ra || '—' }}</span>
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                Giờ làm {{ row.gio_lam }} · Trễ {{ row.di_tre }} ·
                Tăng ca {{ row.tang_ca }}
              </div>
              <div
                v-for="(ly, k) in row.bat_thuong"
                :key="k"
                class="mau-xau text-sm"
              >{{ ly }}</div>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElNotification } from 'element-plus'
import { employeeService } from '@/api/employeeService'
import { dungManHep } from '@/composables/manHep'   // MỤC 396

const { laManHep } = dungManHep()

const DU_AN = 'Ggomoosin'

const duLieu = ref<any>(null)
const dangTai = ref(false)
const chiBatThuong = ref(false)
const dangMo = ref<string[]>([])

/**
 * Mặc định: từ đầu tháng này tới hôm nay.
 *
 * ⚠️ KHÔNG mặc định cả năm. Backend chặn ở 6 tháng, nhưng kể cả trong
 * hạn thì một bảng vài nghìn dòng mở ra là người dùng chờ và tưởng treo.
 * Kỳ lương tính theo tháng nên tháng này là khoảng đúng nhất để mở sẵn.
 */
function isoNgay(d: Date): string {
  const s = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${s(d.getMonth() + 1)}-${s(d.getDate())}`
}

const homNay = new Date()
const khoangNgay = ref<[string, string]>([
  isoNgay(new Date(homNay.getFullYear(), homNay.getMonth(), 1)),
  isoNgay(homNay),
])

async function taiLai() {
  // `:clearable="false"` đã chặn việc xoá trắng, nhưng người dùng vẫn có
  // thể đang mở dở hộp chọn. Kiểm trước khi gọi mạng — gọi rồi mới báo
  // lỗi là một vòng chờ vô ích.
  if (!khoangNgay.value || khoangNgay.value.length !== 2) {
    ElNotification({
      title: 'Chưa chọn khoảng thời gian',
      message: 'Chọn Từ ngày và Đến ngày rồi bấm Tìm kiếm.',
      type: 'warning',
    })
    return
  }
  dangTai.value = true
  try {
    const kq = await employeeService.layLichSuCheckInOut(
      DU_AN, khoangNgay.value[0], khoangNgay.value[1], chiBatThuong.value,
    )
    duLieu.value = kq

    // Mở sẵn người có dòng cần xem — đó là việc nhân sự vào đây để làm.
    // Mở hết thì màn dài hàng nghìn dòng; không mở gì thì phải bấm từng
    // người mới biết ai có vấn đề.
    dangMo.value = (kq.nhan_vien || [])
      .filter((n: any) => n.tom_tat.so_dong_bat_thuong > 0)
      .map((n: any) => n.ma_nhan_vien)
  } catch (e: any) {
    // Câu lỗi đã là tiếng Việt từ backend. In nguyên văn, không bọc thêm.
    ElNotification({
      title: 'Không đọc được lịch sử chấm công',
      message: e?.message || 'Lỗi không rõ.',
      type: 'error',
      duration: 6000,
    })
    duLieu.value = null
  } finally {
    dangTai.value = false
  }
}

function toDongXau({ row }: any) {
  return row?.bat_thuong?.length ? 'dong-xau' : ''
}

onMounted(taiLai)
</script>

<style scoped>
/*
  ⚠️ CSS THUẦN, KHÔNG DÙNG `@apply`.

  Tailwind có chạy trong dự án này (xem `postcss.config.js`), nhưng đếm
  thật thì KHÔNG file `.vue` nào khác dùng `@apply` trong `<style scoped>`
  — tức đường đó chưa từng chạy qua lần build nào ở đây. Mà máy soạn gói
  không cài được `node_modules` để thử.

  Viết thứ chưa ai chạy rồi giao đi là đặt cược vào may mắn: hỏng thì cả
  tab trắng, và s68 là người phát hiện. CSS thuần thì chắc chắn chạy.
*/
.the-so {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 12px;
  background-color: #ffffff;
}
.the-nhan {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
}
.the-gia-tri {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

/* Nền tối — theo đúng cặp màu các màn khác đang dùng. */
:global(.dark) .the-so {
  border-color: #374151;
  background-color: #1f2937;
}
:global(.dark) .the-nhan {
  color: #9ca3af;
}
:global(.dark) .the-gia-tri {
  color: #f3f4f6;
}

/*
  Màu theo logo CD68: âm / xấu là đỏ #E93733.
  Dùng một lớp duy nhất cho mọi chỗ "cần xem lại" — rải mã màu khắp file
  là lần sau đổi màu thương hiệu phải đi tìm từng chỗ.
*/
.mau-xau {
  color: #e93733;
  font-weight: 600;
}

.the-dong {
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  padding: 8px;
}
:global(.dark) .the-dong {
  border-color: #374151;
}
.the-dong-xau {
  border-color: #e93733;
}

:deep(.dong-xau) {
  background-color: rgba(233, 55, 51, 0.06);
}
</style>
