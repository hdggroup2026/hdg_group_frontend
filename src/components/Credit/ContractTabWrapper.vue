<template>
  <div class="credit-module-container h-full p-4 bg-gray-50 dark:bg-gray-900 flex flex-col">
    <!-- ══════════════════════════════════════════════════════════════
         MỤC 527 (05/09/2026) — HAI NÚT CHỌN LUỒNG, NẰM TRÊN HÀNG TAB

         s68 05/09: *"bấm ô 1 vào luồng PQCredit, ô 2 vào luồng KCredit.
         Trong mỗi luồng đều có đầy đủ nội dung từng luồng."* và xác nhận
         lại: *"hai nút bấm nằm ngay trong trang (phía trên hàng tab)
         chứ không phải hai mục menu"*.

         🔴 Đổi nút là đổi TOÀN BỘ bốn tab bên dưới, kể cả mọi con số
         tiền. Nên nút phải to, rõ, và luồng đang chọn phải nhìn là biết
         ngay — nền xanh đặc, không phải viền mờ. Nhầm luồng mà không
         nhận ra là đọc sai tiền của người khác.

         ⚠️ Bốn màn con lọc ở MÁY CHỦ theo `luong` này, không lọc sau khi
         tải. Xem `crud/credit.py` hàm `get_all_credit_customers`.

         ⚠️ Dùng `<button>`, KHÔNG dùng `<div @click>` — quy tắc từ MỤC
         420, 424, 438.
         ══════════════════════════════════════════════════════════════ -->
    <div class="shrink-0 flex flex-wrap items-center gap-2 mb-3">
      <span class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mr-1">
        Luồng:
      </span>

      <button
        v-for="l in DS_LUONG"
        :key="l.ma"
        type="button"
        class="px-4 py-2 rounded-lg text-sm font-bold border transition-colors"
        :class="luong === l.ma
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'"
        :title="l.mo_ta"
        @click="doiLuong(l.ma)"
      >
        {{ l.ten }}
      </button>

      <span class="text-xs text-gray-400 dark:text-gray-500 ml-1">
        Bốn tab bên dưới chỉ hiện dữ liệu của luồng đang chọn.
      </span>
    </div>

    <el-tabs v-model="activeTab" type="border-card" class="credit-tabs flex-1 min-h-0 flex flex-col">
      <!-- Tab 1: Khách hàng -->
      <el-tab-pane name="customers">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><User /></el-icon>
            <span>Khách hàng</span>
          </span>
        </template>
        <CustomerList :key="luong" :luong="luong" />
      </el-tab-pane>

      <!-- Tab 2: Hợp đồng -->
      <el-tab-pane name="contracts">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Files /></el-icon>
            <span>Hợp đồng</span>
          </span>
        </template>
        <ContractList :key="luong" :luong="luong" @switch-tab="(tab) => activeTab = tab" />
      </el-tab-pane>

      <!-- Tab 3: Thanh toán -->
      <el-tab-pane name="payments">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Wallet /></el-icon>
            <span>Thanh toán</span>
          </span>
        </template>
        <PaymentList :key="luong" :luong="luong" />
      </el-tab-pane>

      <!-- Tab 4: Truy xuất thông tin -->
      <el-tab-pane name="query">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Search /></el-icon>
            <span>Truy xuất thông tin</span>
          </span>
        </template>
        <InfoRetrieval :key="luong" :luong="luong" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { refTabBenVung } from '@/composables/tabBenVung'  // MỤC 423
import { User, Files, Wallet, Search } from '@element-plus/icons-vue'
import CustomerList from './CustomerList.vue'
import ContractList from './ContractList.vue'
import PaymentList from './PaymentList.vue'
import InfoRetrieval from './InfoRetrieval.vue'

// ══════════════════════════════════════════════════════════════════
// MỤC 527 (05/09/2026) — MỘT KHUNG, HAI LUỒNG
//
// 🔴 KHÔNG chép file này ra thành hai bản PQ và KK. Hai bản là hai chỗ
// phải sửa mỗi lần đổi, và có ngày lệch nhau — đúng lỗi MỤC 494, 498 đã
// trả giá. Một khung, đổi `luong` rồi truyền xuống bốn màn con.
//
// ⚠️ `:key="luong"` trên bốn màn con là BẮT BUỘC. Thiếu nó, Vue giữ
// nguyên thực thể component khi đổi nút, và màn con không tải lại — nút
// đổi sang KCredit mà bảng vẫn nằm im với dữ liệu PQCredit. Có `key`
// thì component dựng lại và `onMounted` chạy lần nữa.
//
// ⚠️ Giá trị `ma` phải khớp ĐÚNG chữ trong cột `classification` của
// database (`PQCredit`, `KCredit`) — máy chủ so bằng dấu bằng, sai một
// chữ hoa là trả về danh sách rỗng mà không báo lỗi gì.
// ══════════════════════════════════════════════════════════════════
const DS_LUONG = [
  { ma: 'PQCredit', ten: 'PQCredit', mo_ta: 'Khách hàng và hợp đồng luồng PQCredit' },
  { ma: 'KCredit', ten: 'KCredit', mo_ta: 'Khách hàng và hợp đồng luồng KCredit' },
]

// Nhớ luồng đang xem giữa các lần vào, cùng cách tab bền vững của MỤC 423.
const luong = refTabBenVung('credit/luong', 'PQCredit')

// ⚠️ Tab dùng CHUNG một khoá cho cả hai luồng, và đổi luồng thì `doiLuong`
// bên dưới kéo về tab Khách hàng. Lý do: đổi luồng là đổi hẳn tập dữ
// liệu, để nguyên tab Thanh toán là bảng thay số ngay dưới tay mà người
// dùng chưa kịp nhận ra mình đã sang luồng khác — với tiền thì đó là chỗ
// đọc nhầm.
const activeTab = refTabBenVung('credit/contract', 'customers')  // MỤC 423

const doiLuong = (ma: string) => {
  if (luong.value === ma) return
  luong.value = ma
  activeTab.value = 'customers'
}
</script>

<style scoped>
.credit-tabs {
  border-radius: 8px;
  overflow: hidden;
}
.credit-tabs :deep(.el-tabs__content) {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.credit-tabs :deep(.el-tab-pane) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
.credit-tabs .custom-tabs-label .el-icon {
  vertical-align: middle;
}
.credit-tabs .custom-tabs-label span {
  vertical-align: middle;
  margin-left: 4px;
}

html.dark .credit-tabs {
  background-color: #1f2937;
  border-color: #374151;
}
html.dark .credit-tabs :deep(.el-tabs__header) {
  background-color: #111827;
  border-bottom-color: #374151;
}
html.dark .credit-tabs :deep(.el-tabs__item) {
  color: #9ca3af;
  border-color: transparent;
  transition: all 0.3s;
}
html.dark .credit-tabs :deep(.el-tabs__item:hover) {
  color: #d1d5db;
}
html.dark .credit-tabs :deep(.el-tabs__item.is-active) {
  background-color: #1f2937;
  border-right-color: #374151;
  border-left-color: #374151;
  border-bottom-color: #1f2937;
  color: #60a5fa;
}
</style>
