<!--
  MỤC 341 (27/08/2026) — TRANG CHỦ: BẢNG ĐIỀU KHIỂN.
  MỤC 342 (27/08/2026) — thêm nội dung ô Tiến Nga và ô Hụi.
  MỤC 343 (27/08/2026) — hiện hai số tài sản/công nợ Hụi để đối chiếu.
  MỤC 344 (27/08/2026) — ô Tiến Nga hiện thêm phần Tài sản (ứng + kho mủ tồn).
  MỤC 347 (27/08/2026) — ô Thu hoạch đọc đúng bảng, khớp báo cáo bot gửi.
  MỤC 348 (27/08/2026) — ô Other hiện 10 mục đến hạn gần nhất toàn hệ thống.
  MỤC 350 (27/08/2026) — ô Telegram: số đứng sát nhãn, không dàn ra hai mép.
  MỤC 351 (27/08/2026) — ô Nhật ký: 10 lần đăng nhập thất bại gần nhất (chỉ admin).
  MỤC 353 (27/08/2026) — hộp hỏi trợ lý AI ngay trên Trang Chủ (chỉ admin).

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
             KHỐI 0 — HỎI TRỢ LÝ AI (MỤC 353, chuyển lên đầu ở MỤC 382)

             s68 chốt: hỏi gì về hệ thống thì hỏi ngay trên Trang Chủ,
             không phải mở Telegram.

             🔴 MỤC 382 (28/08/2026) — CHUYỂN TỪ CUỐI TRANG LÊN ĐẦU.

             s68 chỉ thẳng chỗ đặt: ngay dưới dòng chào, TRÊN bảng cân
             đối. Ở cuối trang thì phải cuộn qua ba bảng số mới tới —
             mà đây là thứ dùng thường xuyên nhất, không phải thứ đọc
             sau cùng.

             🔴 Chỉ hiện khi tài khoản là admin. Nhưng đó chỉ là để đỡ
             rối mắt — máy chủ mới là chỗ chặn thật (trả 403).
             ═══════════════════════════════════════════════════════════ -->
        <section v-if="laAdmin" class="mb-8">
          <h2 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            Hỏi trợ lý AI về hệ thống
          </h2>

          <div class="rounded-xl border border-gray-200 dark:border-gray-700
                      bg-white dark:bg-gray-800 p-4">
            <textarea
              v-model="cauHoiAI"
              rows="3"
              :disabled="dangHoiAI"
              placeholder="Ví dụ: công thức tính lương tăng ca là gì?"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-900 px-3 py-2 text-sm
                     text-gray-800 dark:text-gray-100
                     focus:outline-none focus:border-blue-400"
            ></textarea>

            <div class="mt-2 flex items-center gap-3">
              <button
                :disabled="dangHoiAI || !cauHoiAI.trim()"
                class="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300
                       dark:disabled:bg-gray-700 text-white text-sm font-medium
                       px-4 py-2 transition"
                @click="hoiAI"
              >
                {{ dangHoiAI ? 'Đang hỏi…' : 'Hỏi' }}
              </button>
              <!--
                ⚠️ Trợ lý gọi ra mạng Google, có thể mất vài giây. Không có
                dòng này thì người dùng tưởng nút hỏng rồi bấm liên tục.
              -->
              <span v-if="dangHoiAI" class="text-xs text-gray-500 dark:text-gray-400">
                Có thể mất vài giây…
              </span>
            </div>

            <!--
              🔴 Hỏng thì in NGUYÊN VĂN câu trợ lý trả về, không thay bằng
              "có lỗi xảy ra". Hàm `hoi_ai` đã viết sẵn câu nói rõ hỏng ở
              đâu (thiếu khoá, thiếu file tài khoản…) — nuốt nó đi là người
              đọc không biết nên chờ hay nên đi sửa cấu hình.
            -->
            <div v-if="traLoiAI"
                 class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700
                        text-sm whitespace-pre-wrap"
                 :class="loiAI
                   ? 'text-amber-800 dark:text-amber-200'
                   : 'text-gray-800 dark:text-gray-100'">
              {{ traLoiAI }}
            </div>
          </div>
        </section>

        <!-- ═══════════════════════════════════════════════════════════
             KHỐI 1 — BẢNG CÂN ĐỐI. s68 chốt: đặt LÊN ĐẦU (dưới ô trợ lý).
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
             KHỐI 1B — BA BẢNG HẠCH TOÁN ĐỘC LẬP (MỤC 366, 28/08/2026)

             🔴 s68 chốt 28/08, thay hẳn ý "gộp toàn công ty":
             "Hạch toán độc lập để coi Tiến Nga sản xuất cao su bị hao hụt
              thì có lợi nhuận hay không. Chứ không đem lợi nhuận các mảng
              khác bù vào làm không xác định được hiệu quả sản xuất."

             KHÔNG có dòng tổng ba bảng. Bảng "Cân đối toàn công ty" ở
             trên GIỮ NGUYÊN để đối chiếu trong lúc chuyển đổi — s68 xem
             quen rồi mới bỏ.

             ⚠️ Không dùng bảng ngang: ba bảng × nhiều dòng trên màn 350px
             là vuốt ngang liên tục. Dùng thẻ dọc theo
             `tai_lieu_ai/quy_uoc_bo_cuc_the.md`.
             ═══════════════════════════════════════════════════════════ -->
        <section v-if="baBang && baBang.bang" class="mb-8">
          <h2 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Hạch toán độc lập từng mảng
          </h2>

          <!-- 🔴 Nhãn cảnh báo. KHÔNG XOÁ. -->
          <div class="mb-3 rounded-lg border border-amber-300 dark:border-amber-700
                      bg-amber-50 dark:bg-amber-900/20 px-3 py-2
                      text-xs text-amber-800 dark:text-amber-200">
            ⚠️ {{ baBang.canh_bao }}
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div v-for="b in baBang.bang" :key="b.ten"
                 class="rounded-xl border border-gray-200 dark:border-gray-700
                        bg-white dark:bg-gray-800 overflow-hidden flex flex-col">
              <div class="px-3 py-2.5 border-b border-gray-100 dark:border-gray-700
                          bg-gray-50 dark:bg-gray-700/30">
                <span class="font-semibold text-sm text-gray-800 dark:text-gray-100">
                  {{ b.ten }}
                </span>
              </div>

              <div class="p-3 space-y-3 flex-1 text-sm">
                <!-- Tài sản -->
                <div v-if="b.tai_san && b.tai_san.length">
                  <div class="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Tài sản</div>
                  <div v-for="[ten, ke] in b.tai_san" :key="'ts-' + ten" class="mb-1.5">
                    <div class="flex justify-between gap-2">
                      <span class="text-gray-500 dark:text-gray-400">{{ ten }}</span>
                      <span class="tabular-nums" :class="o(ke.so)">{{ tien(ke.so) }}</span>
                    </div>
                    <div v-if="ke.ghi_chu" class="text-[11px] leading-snug text-amber-700 dark:text-amber-300">
                      {{ ke.ghi_chu }}
                    </div>
                  </div>
                </div>

                <!-- Công nợ -->
                <div v-if="b.cong_no && b.cong_no.length">
                  <div class="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Công nợ</div>
                  <div v-for="[ten, ke] in b.cong_no" :key="'cn-' + ten" class="mb-1.5">
                    <div class="flex justify-between gap-2">
                      <span class="text-gray-500 dark:text-gray-400">{{ ten }}</span>
                      <span class="tabular-nums" :class="o(ke.so)">{{ tien(ke.so) }}</span>
                    </div>
                    <div v-if="ke.ghi_chu" class="text-[11px] leading-snug text-amber-700 dark:text-amber-300">
                      {{ ke.ghi_chu }}
                    </div>
                  </div>
                </div>

                <!-- Hiệu quả trong năm -->
                <div v-if="b.hieu_qua && b.hieu_qua.length">
                  <div class="text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                    Hiệu quả từ đầu năm
                  </div>
                  <div v-for="[ten, ke] in b.hieu_qua" :key="'hq-' + ten" class="mb-1.5">
                    <div class="flex justify-between gap-2">
                      <span class="text-gray-500 dark:text-gray-400">{{ ten }}</span>
                      <span class="tabular-nums" :class="o(ke.so)">{{ tien(ke.so) }}</span>
                    </div>
                    <div v-if="ke.ghi_chu" class="text-[11px] leading-snug text-amber-700 dark:text-amber-300">
                      {{ ke.ghi_chu }}
                    </div>
                  </div>
                </div>

                <!-- Bảng Dịch vụ dùng dạng dòng cũ -->
                <div v-if="b.dong && b.dong.length">
                  <div v-for="d in b.dong" :key="d.du_an"
                       class="mb-2 pb-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                    <div class="font-medium text-gray-800 dark:text-gray-100">{{ d.du_an }}</div>
                    <div class="flex justify-between gap-2 mt-0.5">
                      <span class="text-gray-500 dark:text-gray-400">Tài sản</span>
                      <span class="tabular-nums" :class="o(d.tai_san)">{{ tien(d.tai_san) }}</span>
                    </div>
                    <div class="flex justify-between gap-2">
                      <span class="text-gray-500 dark:text-gray-400">Công nợ</span>
                      <span class="tabular-nums" :class="o(d.cong_no)">{{ tien(d.cong_no) }}</span>
                    </div>
                    <div v-if="d.ghi_chu" class="mt-1 text-[11px] leading-snug text-amber-700 dark:text-amber-300">
                      {{ d.ghi_chu }}
                    </div>
                  </div>
                  <div class="flex justify-between gap-2 pt-1 font-semibold">
                    <span class="text-gray-700 dark:text-gray-200">Cộng ba mảng</span>
                    <span class="tabular-nums" :class="mauChenh(b.tong?.chenh_lech)">
                      {{ tien(b.tong?.chenh_lech) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Lãi / lỗ — dòng cuối, chữ to nhất trong thẻ -->
              <div v-if="b.lai_lo" class="px-3 py-2.5 border-t border-gray-100 dark:border-gray-700
                                          bg-gray-50 dark:bg-gray-700/30">
                <div class="flex justify-between items-baseline gap-2">
                  <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {{ b.lai_lo.so !== null && b.lai_lo.so < 0 ? 'Lỗ' : 'Lãi' }}
                  </span>
                  <span class="text-base font-bold tabular-nums" :class="mauChenh(b.lai_lo.so)">
                    {{ tien(b.lai_lo.so) }}
                  </span>
                </div>
                <!-- ⚠️ Ghi chú ở đây là thứ CẦN ĐỌC, không phải chú thích
                     phụ: nó nói số này còn thiếu chi phí gì. -->
                <div v-if="b.lai_lo.ghi_chu"
                     class="mt-1 text-[11px] leading-snug text-amber-700 dark:text-amber-300">
                  {{ b.lai_lo.ghi_chu }}
                </div>
              </div>
            </div>
          </div>

          <div class="mt-2 px-1 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
            {{ baBang.vi_sao_khong_tong }}
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

            <!-- ── Other: 10 mục đến hạn gần nhất (MỤC 348) ── -->
            <div v-else-if="d.ten === 'Other' && bang?.sap_den_han" class="mt-3 pt-3
                 border-t border-gray-100 dark:border-gray-700">
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Đến hạn gần nhất — toàn hệ thống
                <span v-if="bang.sap_den_han.tong_tim_thay > bang.sap_den_han.so_dong">
                  (10 trên {{ bang.sap_den_han.tong_tim_thay }})
                </span>
              </div>

              <!--
                🔴 Quá hạn cấp bách hơn sắp hạn. Đếm riêng và in đỏ ở đầu,
                đừng để nó lẫn vào danh sách rồi trôi mất.
              -->
              <div v-if="bang.sap_den_han.so_qua_han > 0"
                   class="mb-2 rounded bg-red-50 dark:bg-red-900/20 px-2 py-1
                          text-[11px] text-red-700 dark:text-red-300 font-medium">
                {{ bang.sap_den_han.so_qua_han }} mục ĐÃ QUÁ HẠN
              </div>

              <div v-if="bang.sap_den_han.so_dong === 0"
                   class="text-xs text-gray-500">{{ bang.sap_den_han.chu_khi_rong }}</div>

              <ul v-else class="space-y-2">
                <li v-for="(m, i) in bang.sap_den_han.danh_sach" :key="i"
                    class="text-xs">
                  <div class="flex justify-between gap-2">
                    <span class="text-gray-700 dark:text-gray-200 break-all">
                      {{ m.ten || m.ma || m.loai }}
                    </span>
                    <span class="shrink-0 tabular-nums font-medium"
                          :class="m.con_lai_ngay < 0
                            ? 'text-red-600 dark:text-red-400'
                            : (m.con_lai_ngay <= 7
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-gray-600 dark:text-gray-300')">
                      {{ m.ngay }}
                    </span>
                  </div>
                  <div class="text-[11px] text-gray-400 dark:text-gray-500">
                    {{ m.mang }} · {{ m.loai }}
                    <span v-if="m.ma"> · {{ m.ma }}</span>
                    <span v-if="m.con_lai_ngay < 0"
                          class="text-red-600 dark:text-red-400 font-medium">
                      · quá hạn {{ m.qua_han }} ngày
                    </span>
                    <span v-else-if="m.con_lai_ngay === 0"
                          class="text-red-600 dark:text-red-400 font-medium">
                      · hết hạn HÔM NAY
                    </span>
                    <span v-else> · còn {{ m.con_lai_ngay }} ngày</span>
                  </div>
                </li>
              </ul>
            </div>

            <!-- ── Nhật ký: 10 lần đăng nhập hỏng (MỤC 351) ── -->
            <div v-else-if="d.ten === 'Nhật ký' && bang?.dang_nhap_hong"
                 class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <!--
                🔴 Người thường KHÔNG thấy nội dung — máy chủ trả rỗng kèm
                `duoc_xem: false`. Hiện câu giải thích thay vì ô trống, để
                không ai tưởng màn hỏng.
              -->
              <div v-if="!bang.dang_nhap_hong.duoc_xem"
                   class="text-xs text-gray-500 dark:text-gray-400">
                {{ bang.dang_nhap_hong.chu_khi_rong }}
              </div>
              <template v-else>
                <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  10 lần đăng nhập thất bại gần nhất
                </div>

                <!--
                  Một tên chiếm quá nửa danh sách = dấu hiệu bị dò mật khẩu,
                  khác hẳn nhiều người cùng quên mật khẩu. Nổi lên đầu, in đỏ.
                -->
                <div v-if="bang.dang_nhap_hong.co_dau_hieu_do_mat_khau"
                     class="mb-2 rounded bg-red-50 dark:bg-red-900/20 px-2 py-1
                            text-[11px] text-red-700 dark:text-red-300 font-medium">
                  ⚠️ Một tên đăng nhập chiếm quá nửa số lần sai — có thể đang
                  bị dò mật khẩu
                </div>

                <div v-if="bang.dang_nhap_hong.so_dong === 0"
                     class="text-xs text-gray-500">
                  {{ bang.dang_nhap_hong.chu_khi_rong }}
                </div>

                <ul v-else class="space-y-1.5">
                  <li v-for="(n, i) in bang.dang_nhap_hong.danh_sach" :key="i"
                      class="text-xs">
                    <div class="flex items-baseline gap-2">
                      <span class="w-[7rem] shrink-0 text-gray-700 dark:text-gray-200 break-all">
                        {{ n.ten_go_vao }}
                      </span>
                      <span class="tabular-nums text-gray-500 dark:text-gray-400">
                        {{ n.luc }}
                      </span>
                    </div>
                    <div class="text-[11px] text-amber-700 dark:text-amber-300">
                      {{ n.ket_qua_chu }}
                      <span v-if="n.ip" class="text-gray-400 dark:text-gray-500">
                        · IP {{ n.ip }}
                      </span>
                    </div>
                  </li>
                </ul>

                <div v-if="bang.dang_nhap_hong.theo_ten.length > 1"
                     class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div class="text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Gom theo tên gõ vào
                  </div>
                  <div v-for="t in bang.dang_nhap_hong.theo_ten" :key="t.ten"
                       class="flex items-baseline gap-2 text-[11px]">
                    <span class="w-[7rem] shrink-0 text-gray-600 dark:text-gray-300 break-all">
                      {{ t.ten }}
                    </span>
                    <span class="tabular-nums text-gray-500">{{ t.so_lan }} lần</span>
                  </div>
                </div>
              </template>
            </div>

            <!-- ── Dự án Telegram ── -->
            <div v-else-if="d.ten === 'Dự án Telegram' && bang?.telegram"
                 class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <!--
                MỤC 350 (27/08/2026) — SỐ ĐỨNG SÁT NHÃN, KHÔNG DÀN RA HAI MÉP.

                Trước đó dùng `justify-between`: nhãn dính mép trái, số dính
                mép phải. Trên iPad ngang thẻ rộng gần 500 điểm ảnh nên giữa
                hai bên là một khoảng trắng dài — mắt phải rê hết chiều ngang
                mới nối được "Tiến Nga" với "496", và rất dễ đọc lệch dòng.

                Nay nhãn có bề rộng cố định, số đứng ngay sau. Cả cụm nằm
                bên trái, sát tiêu đề ô.

                ⚠️ Bề rộng nhãn đặt bằng `rem` chứ không phải `px`: MỤC 349
                đã tăng cỡ chữ gốc, dùng px thì nhãn không giãn theo và tên
                dự án dài sẽ bị cắt.
              -->
              <div class="flex items-baseline gap-2 text-xs mb-2">
                <span class="w-[9rem] shrink-0 text-gray-500 dark:text-gray-400">
                  Tổng số nhóm
                </span>
                <span class="tabular-nums font-medium text-gray-800 dark:text-gray-100">
                  {{ bang.telegram.tong_so_nhom }}
                </span>
              </div>
              <ul class="space-y-1">
                <li v-for="t in bang.telegram.theo_du_an" :key="t.du_an_id"
                    class="flex items-baseline gap-2 text-xs">
                  <span class="w-[9rem] shrink-0 text-gray-700 dark:text-gray-200 break-words">
                    {{ t.du_an }}
                  </span>
                  <span class="tabular-nums text-gray-600 dark:text-gray-300">
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
import { mauSo } from '@/utils/mauSo'
import { useRouter } from 'vue-router'
import { layQuyen, danhSachDuocVao, type DuAn } from '@/constants/duAn'
import { trangChuService } from '@/api/trangChu'

const router = useRouter()

const dangTai = ref(true)
const loi = ref('')
const duAnCuaToi = ref<DuAn[]>([])
const bang = ref<any>(null)
const canDoi = ref<any>(null)
// MỤC 366 (28/08/2026) — ba bảng hạch toán độc lập.
const baBang = ref<any>(null)

// MỤC 353 — hộp hỏi trợ lý AI
const laAdmin = ref(false)
const cauHoiAI = ref('')
const traLoiAI = ref('')
const loiAI = ref(false)
const dangHoiAI = ref(false)

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
// MỤC 380 — `o` cũng theo quy tắc màu chung. Trước đây nó chỉ phân biệt
// "có số" (đen) với "không có số" (xám nhạt); nay số còn mang màu theo
// dấu, còn việc in dấu gạch cho ô trống là việc của `tien()`.
const o = (x: number | null | undefined): string => mauSo(x)

// ══ MỤC 380 (28/08/2026) — DÙNG QUY TẮC MÀU CHUNG ══
// s68 chốt: toàn bộ số trên web — âm đỏ tươi, dương xanh biển, 0 xám.
// Bản cũ chỉ tô đỏ số âm, số dương để đen — nên nhìn bảng không phân
// biệt được ô có số với ô bằng 0.
const mauChenh = (x: number | null | undefined): string => mauSo(x)

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
  // MỤC 353 — chỉ admin thấy hộp hỏi AI. Đây là ẩn cho đỡ rối mắt;
  // chặn thật nằm ở máy chủ (trả 403), xem lời ghi ở `trangChu.ts`.
  laAdmin.value = kq.quyen.includes('admin')

  // ⚠️ Số liệu hỏng KHÔNG được làm mất lưới dự án. Lưới dự án mới là thứ
  // giúp người dùng đi tiếp — đó là lý do Trang Chủ tồn tại (MỤC 255).
  try {
    const tt = await trangChuService.laySoLieu()
    bang.value = tt?.bang_dieu_khien || null
    canDoi.value = bang.value?.can_doi || null
    baBang.value = bang.value?.ba_bang || null
  } catch (e) {
    bang.value = null
    canDoi.value = null
    baBang.value = null
  }

  dangTai.value = false
})

/**
 * MỤC 353 — gửi câu hỏi cho trợ lý AI.
 *
 * ⚠️ Chặn bấm hai lần bằng `dangHoiAI`. Mỗi lần hỏi là một lượt gọi ra
 * mạng Google — bấm liên tục vừa chậm vừa tốn.
 */
const hoiAI = async () => {
  const cau = cauHoiAI.value.trim()
  if (!cau || dangHoiAI.value) return

  dangHoiAI.value = true
  traLoiAI.value = ''
  loiAI.value = false
  try {
    const kq = await trangChuService.hoiAI(cau)
    traLoiAI.value = kq.tra_loi
    loiAI.value = !kq.thanh_cong
  } catch (e: any) {
    loiAI.value = true
    traLoiAI.value = e?.status === 403
      ? 'Chỉ quản trị viên mới hỏi được trợ lý AI.'
      : (e?.message || 'Không hỏi được trợ lý AI.')
  } finally {
    dangHoiAI.value = false
  }
}
</script>
