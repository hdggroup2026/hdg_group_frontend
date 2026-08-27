<!--
  MỤC 341 (27/08/2026) — TRANG CHỦ: BẢNG ĐIỀU KHIỂN.
  MỤC 342 (27/08/2026) — thêm nội dung ô Tiến Nga và ô Hụi.
  MỤC 343 (27/08/2026) — hiện hai số tài sản/công nợ Hụi để đối chiếu.
  MỤC 344 (27/08/2026) — ô Tiến Nga hiện thêm phần Tài sản (ứng + kho mủ tồn).
  MỤC 347 (27/08/2026) — ô Thu hoạch đọc đúng bảng, khớp báo cáo bot gửi.

  Thay khối "Nội dung trang chủ đang được thiết kế" của MỤC 255 bằng số
  liệu thật. s68 chốt 27/08: bảng cân đối lên đầu, các ô dự án đẩy xuống
  dưới và mỗi ô hiện nội dung của dự án đó.

  🔴 ĐÂY LÀ CÔNG CỤ SOI LỖI, KHÔNG PHẢI BÁO CÁO

  s68 nói rõ: hệ thống kế toán chưa hoàn thiện, hiện số ra để tìm chỗ
  sai rồi dọn dần. Vì vậy màn này có ba quy ước KHÔNG được bỏ:

    ① Nhãn "Số chưa kiểm chứng" luôn nằm TRÊN bảng cân đối.
       Xoá nhãn là biến công cụ soi lỗi thành báo cáo chính thức.
    ② Ô không có số thì in dấu — KHÔNG in số 0.
       Số 0 nhìn giống số thật và sẽ giấu mất lỗi.
    ③ Dòng ghi chú của mỗi dự án (số hộ công nợ âm, số ngày thiếu dữ
       liệu…) phải hiện. Đó chính là thứ cần tìm.

  ⚠️ Bố cục xem trên điện thoại rộng ~390 điểm ảnh.
  Xem docs/quy_uoc_bo_cuc_the.md.
-->
<template>
  <div class="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
    <div class="max-w-5xl mx-auto">

      <!-- Lời chào -->
      <div class="mb-6">
        <h1 class="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">
          Trang Chủ
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ loiChao }}
        </p>
      </div>

      <div v-if="dangTai" class="text-sm text-gray-500 dark:text-gray-400">
        Đang tải…
      </div>

      <div v-else-if="loi"
           class="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20
                  dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200">
        {{ loi }}
      </div>

      <template v-else>

        <!-- ═══════════════════════════════════════════════════════════
             KHỐI 1 — BẢNG CÂN ĐỐI. s68 chốt: đặt LÊN ĐẦU.
             ═══════════════════════════════════════════════════════════ -->
        <section v-if="canDoi" class="mb-8">
          <h2 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Cân đối toàn công ty
          </h2>

          <!-- 🔴 Nhãn cảnh báo. KHÔNG XOÁ. Xem lời ghi ở đầu file. -->
          <div class="mb-3 rounded-lg border border-amber-300 dark:border-amber-700
                      bg-amber-50 dark:bg-amber-900/20 px-3 py-2
                      text-xs text-amber-800 dark:text-amber-200">
            ⚠️ {{ canDoi.canh_bao }}
          </div>

          <div class="rounded-xl border border-gray-200 dark:border-gray-700
                      bg-white dark:bg-gray-800 overflow-hidden">
            <!-- Bảng cuộn ngang CÓ CHỦ Ý: 4 cột số không nhét vừa 390
                 điểm ảnh, mà cắt bớt cột thì mất luôn cột Chênh lệch. -->
            <div class="overflow-x-auto">
              <table class="w-full text-sm min-w-[460px]">
                <thead>
                  <tr class="text-xs text-gray-500 dark:text-gray-400
                             border-b border-gray-200 dark:border-gray-700">
                    <th class="text-left font-medium px-3 py-2">Dự án</th>
                    <th class="text-right font-medium px-3 py-2">Tài sản</th>
                    <th class="text-right font-medium px-3 py-2">Công nợ</th>
                    <th class="text-right font-medium px-3 py-2">Chênh lệch</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="d in canDoi.dong" :key="d.du_an"
                      class="border-b border-gray-100 dark:border-gray-700/50">
                    <td class="px-3 py-2.5 align-top">
                      <div class="font-medium text-gray-800 dark:text-gray-100">
                        {{ d.du_an }}
                      </div>
                      <!-- Ghi chú là thứ CẦN TÌM, không phải chú thích phụ -->
                      <div v-if="d.ghi_chu"
                           class="mt-1 text-[11px] leading-snug text-amber-700
                                  dark:text-amber-300 max-w-[240px]">
                        {{ d.ghi_chu }}
                      </div>
                    </td>
                    <td class="px-3 py-2.5 text-right align-top tabular-nums"
                        :class="o(d.tai_san)">{{ tien(d.tai_san) }}</td>
                    <td class="px-3 py-2.5 text-right align-top tabular-nums"
                        :class="o(d.cong_no)">{{ tien(d.cong_no) }}</td>
                    <td class="px-3 py-2.5 text-right align-top tabular-nums font-medium"
                        :class="mauChenh(d.chenh_lech)">{{ tien(d.chenh_lech) }}</td>
                  </tr>
                  <tr class="bg-gray-50 dark:bg-gray-700/30">
                    <td class="px-3 py-2.5 font-semibold text-gray-800 dark:text-gray-100">
                      Tổng
                    </td>
                    <td class="px-3 py-2.5 text-right tabular-nums font-semibold">
                      {{ tien(canDoi.tong.tai_san) }}
                    </td>
                    <td class="px-3 py-2.5 text-right tabular-nums font-semibold">
                      {{ tien(canDoi.tong.cong_no) }}
                    </td>
                    <td class="px-3 py-2.5 text-right tabular-nums font-semibold"
                        :class="mauChenh(canDoi.tong.chenh_lech)">
                      {{ tien(canDoi.tong.chenh_lech) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Dòng tổng cộng ô trống: cho biết tổng ở trên còn THIẾU
                 bao nhiêu dự án, thay vì để người đọc tưởng đã đủ. -->
            <div class="px-3 py-2 text-[11px] text-gray-500 dark:text-gray-400
                        border-t border-gray-100 dark:border-gray-700">
              Tổng chỉ cộng những ô có số.
              Còn {{ canDoi.tong.so_o_tai_san_con_trong }} ô Tài sản và
              {{ canDoi.tong.so_o_cong_no_con_trong }} ô Công nợ chưa có cách tính.
            </div>
          </div>
        </section>

        <!-- ═══════════════════════════════════════════════════════════
             KHỐI 2 — CÁC Ô DỰ ÁN. s68 chốt: đẩy xuống DƯỚI bảng cân đối.
             ═══════════════════════════════════════════════════════════ -->
        <h2 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
          Dự án của bạn
        </h2>

        <div v-if="duAnCuaToi.length === 0"
             class="text-sm text-gray-500 dark:text-gray-400">
          Chưa có dự án nào được cấp cho tài khoản này.
        </div>

        <!-- 1 cột trên điện thoại: mỗi ô nay có danh sách bên trong, nhét
             2 cột vào 390 điểm ảnh là chữ vỡ hết. -->
        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div
            v-for="d in duAnCuaToi"
            :key="d.ten"
            class="rounded-xl border border-gray-200 dark:border-gray-700
                   bg-white dark:bg-gray-800 p-4 flex flex-col"
          >
            <button class="text-left" @click="moDuAn(d)">
              <div class="font-medium text-gray-800 dark:text-gray-100">
                {{ d.ten }}
              </div>
              <div class="text-xs text-gray-400 dark:text-gray-500">
                {{ d.duongMacDinh }}
              </div>
            </button>

            <!-- ── Credit ── -->
            <div v-if="d.ten === 'Credit' && bang?.credit" class="mt-3 pt-3
                 border-t border-gray-100 dark:border-gray-700">
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Lãi tháng {{ bang.credit.thang }}
                · đã thu <b class="text-emerald-600 dark:text-emerald-400">{{ bang.credit.so_da_thu }}</b>
                · chưa thu <b class="text-amber-600 dark:text-amber-400">{{ bang.credit.so_chua_thu }}</b>
              </div>
              <div v-if="bang.credit.so_dong === 0"
                   class="text-xs text-gray-500">{{ bang.credit.chu_khi_rong }}</div>
              <ul v-else class="space-y-1">
                <li v-for="m in bang.credit.danh_sach.slice(0, 8)" :key="m.ma"
                    class="flex justify-between gap-2 text-xs">
                  <span class="text-gray-700 dark:text-gray-200 break-all">{{ m.ma }}</span>
                  <span class="shrink-0 tabular-nums"
                        :class="m.trang_thai === 'da_thu'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'">
                    {{ m.trang_thai === 'da_thu'
                        ? tien(m.tien)
                        : '(dự kiến ' + tien(m.tien_du_kien) + ')' }}
                  </span>
                </li>
              </ul>
              <div v-if="bang.credit.so_dong > 8"
                   class="mt-1.5 text-[11px] text-gray-400">
                …còn {{ bang.credit.so_dong - 8 }} mã nữa
              </div>
            </div>

            <!-- ── Rental ── -->
            <div v-else-if="d.ten === 'Rental' && bang?.rental" class="mt-3 pt-3
                 border-t border-gray-100 dark:border-gray-700">
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Thuê tháng {{ bang.rental.thang }}
                · đã thu <b class="text-emerald-600 dark:text-emerald-400">{{ bang.rental.so_da_thu }}</b>
                · chưa thu <b class="text-amber-600 dark:text-amber-400">{{ bang.rental.so_chua_thu }}</b>
              </div>
              <div v-if="bang.rental.so_dong === 0"
                   class="text-xs text-gray-500">{{ bang.rental.chu_khi_rong }}</div>
              <ul v-else class="space-y-1">
                <li v-for="m in bang.rental.danh_sach.slice(0, 8)" :key="m.ma"
                    class="flex justify-between gap-2 text-xs">
                  <span class="text-gray-700 dark:text-gray-200 break-all">{{ m.ma }}</span>
                  <span class="shrink-0 tabular-nums"
                        :class="m.trang_thai === 'da_thu'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'">
                    {{ m.trang_thai === 'da_thu'
                        ? tien(m.tien)
                        : '(dự kiến ' + tien(m.tien_du_kien) + ')' }}
                  </span>
                </li>
              </ul>
              <div v-if="bang.rental.so_dong > 8"
                   class="mt-1.5 text-[11px] text-gray-400">
                …còn {{ bang.rental.so_dong - 8 }} mã nữa
              </div>
            </div>

            <!-- ── Thu hoạch (MỤC 347: đọc cùng nguồn với bot) ── -->
            <div v-else-if="d.ten === 'Thu hoạch' && bang?.thu_hoach" class="mt-3 pt-3
                 border-t border-gray-100 dark:border-gray-700">
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Tháng {{ bang.thu_hoach.thang }}
                · {{ bang.thu_hoach.so_ray }} rẫy · {{ bang.thu_hoach.so_ho }} hộ
              </div>
              <div v-if="bang.thu_hoach.so_dong === 0"
                   class="text-xs text-gray-500">{{ bang.thu_hoach.chu_khi_rong }}</div>
              <template v-else>
                <!--
                  Bảy dòng này khớp đúng bảng bot gửi vào nhóm Telegram
                  mỗi ngày 17:30. Đối chiếu được ngay: luỹ kế tháng trong
                  tin bot phải bằng dòng "Thành tiền" ở đây.
                -->
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-gray-500 dark:text-gray-400">Mủ nước</span>
                  <span class="tabular-nums font-medium text-gray-800 dark:text-gray-100">
                    {{ soLe(bang.thu_hoach.mu_nuoc_kg) }} kg
                  </span>
                </div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-gray-500 dark:text-gray-400">Mủ khô</span>
                  <span class="tabular-nums font-medium text-gray-800 dark:text-gray-100">
                    {{ soLe(bang.thu_hoach.mu_kho_kg) }} kg
                  </span>
                </div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-gray-500 dark:text-gray-400">Số độ TB</span>
                  <span class="tabular-nums text-gray-800 dark:text-gray-100">
                    {{ soLe(bang.thu_hoach.do_trung_binh) }}%
                  </span>
                </div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-gray-500 dark:text-gray-400">Đơn giá TB</span>
                  <span class="tabular-nums text-gray-800 dark:text-gray-100">
                    {{ tien(bang.thu_hoach.don_gia_trung_binh) }}/kg
                  </span>
                </div>
                <div class="flex justify-between text-xs mb-2">
                  <span class="text-gray-500 dark:text-gray-400">Thành tiền</span>
                  <span class="tabular-nums font-medium text-gray-800 dark:text-gray-100">
                    {{ tien(bang.thu_hoach.thanh_tien) }}
                  </span>
                </div>
                <div class="flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
                  <span>Cây cạo</span>
                  <span class="tabular-nums">{{ bang.thu_hoach.so_cay_cao }}</span>
                </div>
                <div class="flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
                  <span>Tiền cạo</span>
                  <span class="tabular-nums">{{ tien(bang.thu_hoach.tien_cao) }}</span>
                </div>
                <div class="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                  {{ bang.thu_hoach.so_dong }} phiếu thu mua
                </div>
                <!-- Dấu hiệu THIẾU DỮ LIỆU, không phải chỉ số năng suất -->
                <div v-if="bang.thu_hoach.so_ngay_thieu_so_lieu > 0"
                     class="mt-2 rounded bg-amber-50 dark:bg-amber-900/20 px-2 py-1
                            text-[11px] text-amber-700 dark:text-amber-300">
                  {{ bang.thu_hoach.so_ngay_thieu_so_lieu }} ngày trong tháng
                  chưa có phiếu thu mua nào
                </div>
              </template>
            </div>

            <!-- ── Ggomoosin ── -->
            <div v-else-if="d.ten === 'Ggomoosin' && bang?.ggomoosin" class="mt-3 pt-3
                 border-t border-gray-100 dark:border-gray-700">
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Chấm công sai quy trình · tháng {{ bang.ggomoosin.thang }}
                (tính đến ngày {{ bang.ggomoosin.tinh_den_ngay }})
              </div>
              <div v-if="bang.ggomoosin.so_nguoi === 0"
                   class="text-xs text-gray-500">{{ bang.ggomoosin.chu_khi_rong }}</div>
              <ul v-else class="space-y-1.5">
                <li v-for="n in bang.ggomoosin.danh_sach.slice(0, 8)"
                    :key="n.ma_nhan_vien" class="text-xs">
                  <div class="flex justify-between gap-2">
                    <span class="text-gray-700 dark:text-gray-200">
                      {{ n.ho_ten || n.ma_nhan_vien }}
                    </span>
                    <span class="shrink-0 font-medium text-amber-600 dark:text-amber-400">
                      {{ n.tong_so_ngay_sai }} ngày
                    </span>
                  </div>
                  <div class="text-[11px] text-gray-400 dark:text-gray-500">
                    <span v-if="n.so_ngay_khong_check_in > 0">
                      không check-in {{ n.so_ngay_khong_check_in }}
                    </span>
                    <span v-if="n.so_ngay_khong_check_in > 0
                                && n.so_ngay_khong_check_out > 0"> · </span>
                    <span v-if="n.so_ngay_khong_check_out > 0">
                      không check-out {{ n.so_ngay_khong_check_out }}
                    </span>
                  </div>
                </li>
              </ul>
              <div v-if="bang.ggomoosin.so_nguoi > 8"
                   class="mt-1.5 text-[11px] text-gray-400">
                …còn {{ bang.ggomoosin.so_nguoi - 8 }} người nữa
              </div>
            </div>

            <!-- ── Tiến Nga (MỤC 342) ── -->
            <div v-else-if="d.ten === 'Tiến Nga' && bang?.tien_nga" class="mt-3 pt-3
                 border-t border-gray-100 dark:border-gray-700">
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Mua mủ tháng {{ bang.tien_nga.thang }}
              </div>
              <div v-if="bang.tien_nga.mua_mu.so_dong === 0"
                   class="text-xs text-gray-500">{{ bang.tien_nga.chu_khi_rong }}</div>
              <template v-else>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-gray-500 dark:text-gray-400">Mủ thực tế</span>
                  <span class="tabular-nums font-medium text-gray-800 dark:text-gray-100">
                    {{ soLe(bang.tien_nga.mua_mu.kg_thuc_te) }} kg
                  </span>
                </div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-gray-500 dark:text-gray-400">Mủ khô</span>
                  <span class="tabular-nums font-medium text-gray-800 dark:text-gray-100">
                    {{ soLe(bang.tien_nga.mua_mu.kg_mu_kho) }} kg
                  </span>
                </div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-gray-500 dark:text-gray-400">Thành tiền</span>
                  <span class="tabular-nums font-medium text-gray-800 dark:text-gray-100">
                    {{ tien(bang.tien_nga.mua_mu.thanh_tien) }}
                  </span>
                </div>
                <div class="flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
                  <span>{{ bang.tien_nga.mua_mu.so_ho }} hộ · {{ bang.tien_nga.mua_mu.so_dong }} dòng</span>
                </div>
                <!--
                  MỤC 347 — Tiến Nga và Thu hoạch dùng chung bảng mua mủ.
                  Nói rõ phần trùng để không ai cộng hai ô lại với nhau.
                -->
                <div v-if="bang.tien_nga.so_dong_thuoc_thu_hoach > 0"
                     class="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                  ⚠️ Trong đó {{ bang.tien_nga.so_dong_thuoc_thu_hoach }} dòng
                  thuộc mảng Thu hoạch — hai ô đếm chung phần này
                </div>
              </template>

              <!--
                🔴 BẢN ĐẾM LỖI. Đây là lý do khối này tồn tại.
                MỤC 300 đo total_debt lệch 517/562 hộ. Con số dưới đây
                phải GIẢM DẦN theo tiến độ s68 dọn tay.
                ⚠️ Về 0 rồi vẫn giữ, để lần sau ai nhập sai là thấy ngay.
              -->
              <div class="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div class="text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Việc cần dọn — cột công nợ
                </div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-gray-500 dark:text-gray-400">Hộ công nợ ÂM</span>
                  <span class="tabular-nums font-medium"
                        :class="bang.tien_nga.suc_khoe_cong_no.so_ho_no_am > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-emerald-600 dark:text-emerald-400'">
                    {{ bang.tien_nga.suc_khoe_cong_no.so_ho_no_am }}
                  </span>
                </div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-gray-500 dark:text-gray-400">Hộ để trống</span>
                  <span class="tabular-nums font-medium"
                        :class="bang.tien_nga.suc_khoe_cong_no.so_ho_no_trong > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'">
                    {{ bang.tien_nga.suc_khoe_cong_no.so_ho_no_trong }}
                  </span>
                </div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-gray-500 dark:text-gray-400">Dòng mua chưa kiểm</span>
                  <span class="tabular-nums font-medium"
                        :class="bang.tien_nga.mua_mu.so_dong_chua_kiem > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'">
                    {{ bang.tien_nga.mua_mu.so_dong_chua_kiem }}
                  </span>
                </div>
                <div class="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                  Trên tổng {{ bang.tien_nga.suc_khoe_cong_no.so_ho_active }} hộ đang hoạt động
                </div>
              </div>

              <!--
                MỤC 344 — hai số này đi thẳng vào cột Tài sản của dòng
                Tiến Nga ở bảng cân đối đầu trang. Hiện lại ở đây để đối
                chiếu tại chỗ, không phải mò.
              -->
              <div class="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div class="text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Tài sản
                </div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-gray-500 dark:text-gray-400">Ứng cho hộ dân</span>
                  <span class="tabular-nums font-medium text-gray-800 dark:text-gray-100">
                    {{ tien(bang.tien_nga.suc_khoe_cong_no.tai_san_ung_ho_dan) }}
                  </span>
                </div>
                <div class="flex justify-between text-xs">
                  <span class="text-gray-500 dark:text-gray-400">Kho mủ tồn</span>
                  <span class="tabular-nums font-medium text-gray-800 dark:text-gray-100">
                    {{ tien(bang.tien_nga.kho_mu_ton.thanh_tien) }}
                  </span>
                </div>
                <!--
                  Tồn ÂM là dấu hiệu sổ kho sai, không phải kho rỗng.
                  Phải nổi lên, không lẫn vào chữ xám.
                -->
                <div v-if="bang.tien_nga.kho_mu_ton.kg !== null"
                     class="text-[11px] mt-1"
                     :class="bang.tien_nga.kho_mu_ton.kg < 0
                       ? 'text-red-600 dark:text-red-400 font-medium'
                       : 'text-gray-400 dark:text-gray-500'">
                  {{ soLe(bang.tien_nga.kho_mu_ton.kg) }} kg
                  <span v-if="bang.tien_nga.kho_mu_ton.don_gia_bq !== null">
                    × {{ tien(bang.tien_nga.kho_mu_ton.don_gia_bq) }}/kg (giá vốn)
                  </span>
                  <span v-if="bang.tien_nga.kho_mu_ton.kg < 0">
                    — 🔴 tồn ÂM, sổ kho đang sai
                  </span>
                </div>
              </div>
            </div>

            <!-- ── Hụi (MỤC 342) ── -->
            <div v-else-if="d.ten === 'Hụi' && bang?.hui" class="mt-3 pt-3
                 border-t border-gray-100 dark:border-gray-700">
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Tháng {{ bang.hui.thang }}
              </div>
              <div v-if="bang.hui.so_day_dang_chay === 0"
                   class="text-xs text-gray-500">{{ bang.hui.chu_khi_rong }}</div>
              <template v-else>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-gray-500 dark:text-gray-400">Dây đang chạy</span>
                  <span class="tabular-nums font-medium text-gray-800 dark:text-gray-100">
                    {{ bang.hui.so_day_dang_chay }}
                  </span>
                </div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-gray-500 dark:text-gray-400">Chân đang chơi</span>
                  <span class="tabular-nums font-medium text-gray-800 dark:text-gray-100">
                    {{ bang.hui.so_chan_dang_choi }}
                  </span>
                </div>
                <!-- Bể hụi là mất tiền thật, luôn hiện kể cả bằng 0 -->
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-gray-500 dark:text-gray-400">Chân bể hụi</span>
                  <span class="tabular-nums font-medium"
                        :class="bang.hui.so_chan_be_hui > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-emerald-600 dark:text-emerald-400'">
                    {{ bang.hui.so_chan_be_hui }}
                  </span>
                </div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-gray-500 dark:text-gray-400">Đã đóng vào</span>
                  <span class="tabular-nums text-gray-800 dark:text-gray-100">
                    {{ tien(bang.hui.tong_da_dong) }}
                  </span>
                </div>
                <div class="flex justify-between text-xs mb-2">
                  <span class="text-gray-500 dark:text-gray-400">Đã nhận ra</span>
                  <span class="tabular-nums text-gray-800 dark:text-gray-100">
                    {{ tien(bang.hui.tong_da_nhan) }}
                  </span>
                </div>

                <!--
                  MỤC 343 — hai dòng này ĐI THẲNG vào bảng cân đối ở đầu
                  trang. Hiện lại ở đây để đối chiếu: nhìn ô Hụi là biết
                  dòng Hụi trên bảng lấy số từ đâu, không phải mò.
                -->
                <div class="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div class="flex justify-between text-xs mb-1">
                    <span class="text-gray-500 dark:text-gray-400">
                      Tài sản (chưa hốt)
                    </span>
                    <span class="tabular-nums font-medium text-gray-800 dark:text-gray-100">
                      {{ tien(bang.hui.tai_san_chua_hot) }}
                    </span>
                  </div>
                  <div class="flex justify-between text-xs mb-2">
                    <span class="text-gray-500 dark:text-gray-400">
                      Công nợ (nợ hụi chết)
                    </span>
                    <span class="tabular-nums font-medium text-gray-800 dark:text-gray-100">
                      {{ tien(bang.hui.no_da_hot_va_hui_chet) }}
                    </span>
                  </div>
                </div>

                <div v-if="bang.hui.ky_trong_thang.length > 0"
                     class="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div class="text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Kỳ khui trong tháng
                  </div>
                  <div v-for="k in bang.hui.ky_trong_thang.slice(0, 6)"
                       :key="String(k.ky_so) + k.ngay"
                       class="flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
                    <span>Kỳ {{ k.ky_so }} · {{ k.ngay }}</span>
                    <span>{{ k.trang_thai }}</span>
                  </div>
                </div>

                <!-- Chưa đóng gồm CẢ Unpaid VÀ Late -->
                <div v-if="bang.hui.dong_tien.chua_dong > 0"
                     class="mt-2 rounded bg-amber-50 dark:bg-amber-900/20 px-2 py-1
                            text-[11px] text-amber-700 dark:text-amber-300">
                  {{ bang.hui.dong_tien.chua_dong }} lượt chưa đóng
                  ({{ tien(bang.hui.dong_tien.tien_chua_dong) }})
                </div>
              </template>
            </div>

            <!-- ── Dự án Telegram ── -->
            <div v-else-if="d.ten === 'Dự án Telegram' && bang?.telegram"
                 class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div class="flex justify-between text-xs mb-2">
                <span class="text-gray-500 dark:text-gray-400">Tổng số nhóm</span>
                <span class="tabular-nums font-medium text-gray-800 dark:text-gray-100">
                  {{ bang.telegram.tong_so_nhom }}
                </span>
              </div>
              <ul class="space-y-1">
                <li v-for="t in bang.telegram.theo_du_an" :key="t.du_an_id"
                    class="flex justify-between gap-2 text-xs">
                  <span class="text-gray-700 dark:text-gray-200 break-all">{{ t.du_an }}</span>
                  <span class="shrink-0 tabular-nums text-gray-600 dark:text-gray-300">
                    {{ t.so_nhom }}
                  </span>
                </li>
              </ul>
              <!-- Nói rõ vì sao cộng các dòng không ra tổng -->
              <div class="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                Tổng đếm nhóm khác nhau; một nhóm gắn nhiều dự án chỉ tính một lần.
              </div>
            </div>
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { layQuyen, danhSachDuocVao, type DuAn } from '@/constants/duAn'
import { trangChuService } from '@/api/trangChu'

const router = useRouter()

const dangTai = ref(true)
const loi = ref('')
const duAnCuaToi = ref<DuAn[]>([])
const bang = ref<any>(null)
const canDoi = ref<any>(null)

const loiChao = new Date().getHours() < 12
  ? 'Chào buổi sáng.'
  : new Date().getHours() < 18
    ? 'Chào buổi chiều.'
    : 'Chào buổi tối.'

/**
 * 🔴 Ô KHÔNG CÓ SỐ THÌ IN DẤU GẠCH, KHÔNG IN 0.
 *
 * Đây là quy ước quan trọng nhất của màn này. Số 0 nhìn giống số thật —
 * người đọc sẽ tưởng dự án đó không có công nợ, trong khi sự thật là
 * chưa ai viết cách tính. Mà tìm ra đúng những chỗ đó mới là mục đích.
 */
const tien = (x: number | null | undefined): string => {
  if (x === null || x === undefined) return '—'
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(x)
}

const soLe = (x: number | null | undefined): string => {
  if (x === null || x === undefined) return '—'
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(x)
}

/** Ô trống thì làm mờ, để mắt lướt qua nhận ra ngay chỗ còn thiếu. */
const o = (x: number | null | undefined): string =>
  (x === null || x === undefined)
    ? 'text-gray-300 dark:text-gray-600'
    : 'text-gray-800 dark:text-gray-100'

const mauChenh = (x: number | null | undefined): string => {
  if (x === null || x === undefined) return 'text-gray-300 dark:text-gray-600'
  return x < 0
    ? 'text-red-600 dark:text-red-400'
    : 'text-gray-800 dark:text-gray-100'
}

const moDuAn = (d: DuAn) => {
  if (d.duong === '/trang-chu') return
  router.push(d.duongMacDinh)
}

onMounted(async () => {
  const kq = await layQuyen()
  if (kq.trangThai === 'loi') {
    // Đọc lỗi KHÔNG được hiểu là "không có dự án nào" — nói rõ là lỗi.
    loi.value = 'Không đọc được danh sách dự án: ' + kq.loi
    dangTai.value = false
    return
  }
  duAnCuaToi.value = danhSachDuocVao(kq.quyen).filter(
    (d) => d.duong !== '/trang-chu'
  )

  // ⚠️ Số liệu hỏng KHÔNG được làm mất lưới dự án. Lưới dự án mới là thứ
  // giúp người dùng đi tiếp — đó là lý do Trang Chủ tồn tại (MỤC 255).
  try {
    const tt = await trangChuService.laySoLieu()
    bang.value = tt?.bang_dieu_khien || null
    canDoi.value = bang.value?.can_doi || null
  } catch (e) {
    bang.value = null
    canDoi.value = null
  }

  dangTai.value = false
})
</script>
