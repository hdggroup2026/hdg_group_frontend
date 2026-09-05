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
           class="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200">
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

          <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <textarea
              v-model="cauHoiAI"
              rows="3"
              :disabled="dangHoiAI"
              placeholder="Ví dụ: công thức tính lương tăng ca là gì?"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400"
            ></textarea>

            <div class="mt-2 flex items-center gap-3">
              <button
                :disabled="dangHoiAI || !cauHoiAI.trim()"
                class="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-medium px-4 py-2 transition"
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
                 class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm whitespace-pre-wrap"
                 :class="loiAI
                   ? 'text-amber-800 dark:text-amber-200'
                   : 'text-gray-800 dark:text-gray-100'">
              {{ traLoiAI }}
            </div>
          </div>
        </section>

        <!-- ═══════════════════════════════════════════════════════════
             KHỐI 0B — VIỆC CẦN LÀM (MỤC 395, 29/08/2026)

             s68 nêu: *"Rental và Credit hiện ngày phát sinh, xếp theo
             thời gian thay vì theo mã hợp đồng."*

             🔴 KHỐI NÀY BACKEND ĐÃ TÍNH TỪ MỤC 329 (26/08/2026) MÀ CHƯA
             TỪNG HIỆN LÊN MÀN NÀO. `HomeView` đọc mỗi `bang_dieu_khien`
             rồi vứt phần còn lại của gói trả về. Không có lỗi, không có
             dòng đỏ — backend làm đúng, làm đủ, và không ai thấy.

             🔴 KHÔNG XẾP LẠI Ở ĐÂY. Backend đã xếp sẵn theo ngày tăng
             dần và báo bằng khoá `xep_theo`. Xếp lần nữa ở frontend là
             hai nơi cùng quyết thứ tự — sớm muộn ra hai danh sách khác
             nhau cho cùng một dữ liệu.

             ⚠️ Đặt NGAY DƯỚI ô trợ lý, TRÊN bảng cân đối: đây là thứ
             phải làm hôm nay, còn bảng cân đối là thứ để đọc. Việc phải
             làm mà nằm dưới bốn khối số thì trên điện thoại phải cuộn
             qua ba màn mới thấy.
             ═══════════════════════════════════════════════════════════ -->
        <section v-if="vieccanLam" class="mb-8">
          <h2 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Việc cần làm
            <span v-if="vieccanLam.so_dong"
                  class="ml-1 tabular-nums text-gray-400 dark:text-gray-500">
              ({{ vieccanLam.so_dong }})
            </span>
          </h2>

          <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <!-- 🔴 Không có việc tồn thì NÓI THẲNG. Để trống làm người
                 xem tưởng trang lỗi, và họ sẽ bấm tải lại mãi. Câu chữ
                 lấy từ backend (`chu_khi_rong`), không tự viết lại. -->
            <div v-if="!vieccanLam.danh_sach || vieccanLam.danh_sach.length === 0"
                 class="text-sm text-gray-500 dark:text-gray-400">
              {{ vieccanLam.chu_khi_rong || 'Hôm nay không có việc tồn.' }}
            </div>

            <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700">
              <li v-for="(v, i) in vieccanLam.danh_sach" :key="i">
                <!-- ⚠️ Dòng KHÔNG có `duong_dan` thì KHÔNG cho bấm.
                     Mảng Giấy tờ chưa có màn web nên backend trả `null`
                     (MỤC 395). Cho bấm rồi rơi vào trang 404 tệ hơn hẳn
                     một dòng chỉ để đọc — `disabled` làm con trỏ không
                     đổi thành bàn tay, nên người dùng biết ngay. -->
                <button type="button"
                        :disabled="!v.duong_dan"
                        class="w-full text-left py-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded px-1 -mx-1 disabled:cursor-default enabled:hover:bg-gray-50 dark:enabled:hover:bg-gray-700/40"
                        @click="moViec(v)">
                  <span class="text-sm text-gray-800 dark:text-gray-100 min-w-0 break-words">
                    {{ v.chu }}
                  </span>
                  <!-- ⚠️ Ô này CHỈ hiện khi backend có tính ra được ngày.
                       Hợp đồng chưa khai ngày bắt đầu thuê thì `so_ngay_tre`
                       là `null`, và câu `chu` của backend đã nói rõ lý do —
                       in thêm một con số 0 ở đây là bịa. -->
                  <span v-if="chuTre(v.so_ngay_tre)"
                        class="ml-auto shrink-0 text-xs tabular-nums"
                        :class="mauTre(v.so_ngay_tre)">
                    {{ chuTre(v.so_ngay_tre) }}
                  </span>
                </button>
              </li>
            </ul>

            <!-- Backend nuốt lỗi từng nguồn một để một bảng hỏng không
                 làm trắng cả khối. Nhưng nuốt rồi phải NÓI RA, nếu không
                 người dùng nhìn danh sách thiếu mà tưởng là đủ. -->
            <div v-if="vieccanLam.loi && vieccanLam.loi.length"
                 class="mt-3 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700 text-[11px] text-amber-700 dark:text-amber-300">
              Chưa đọc được {{ vieccanLam.loi.length }} nguồn:
              {{ vieccanLam.loi.join(' · ') }}
            </div>
          </div>
        </section>

        <!-- ═══════════════════════════════════════════════════════════
             KHỐI 0C — CẢNH BÁO BẤT THƯỜNG (MỤC 395)

             Cũng là khối MỤC 329 chưa từng hiện. Nó chứa cả cảnh báo
             "Database chưa chạy migration" (MỤC 321) — đúng thứ đã làm
             s68 mất thời gian ngày 21/08 vì không ai thấy.
             ═══════════════════════════════════════════════════════════ -->
        <section v-if="canhBao && canhBao.so_dong" class="mb-8">
          <h2 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Cảnh báo bất thường
            <span v-if="canhBao.diem !== null && canhBao.diem !== undefined"
                  class="ml-1 tabular-nums text-gray-400 dark:text-gray-500">
              · sức khoẻ {{ canhBao.diem }}/100
            </span>
          </h2>

          <div class="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
            <ul class="space-y-1.5">
              <li v-for="(c, i) in canhBao.canh_bao" :key="i" class="text-sm">
                <span class="font-medium text-amber-900 dark:text-amber-200">{{ c.muc }}</span>
                <span v-if="c.chi_tiet" class="text-amber-700 dark:text-amber-300">
                  — {{ c.chi_tiet }}
                </span>
              </li>
            </ul>
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
          <div class="mb-3 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
            ⚠️ {{ canDoi.canh_bao }}
          </div>

          <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <!-- Bảng cuộn ngang CÓ CHỦ Ý: 4 cột số không nhét vừa 390
                 điểm ảnh, mà cắt bớt cột thì mất luôn cột Chênh lệch. -->
            <div class="overflow-x-auto">
              <table class="w-full text-sm min-w-[460px]">
                <thead>
                  <tr class="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
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
                      <!-- MỤC 399 — nguồn của hai con số trên cùng dòng.
                           Gộp một dòng chứ không tách hai: bảng này đã
                           ba cột, thêm hai dòng nữa là mỗi dự án chiếm
                           bốn dòng trên điện thoại. -->
                      <div v-if="d.nguon_tai_san || d.nguon_cong_no"
                           class="mt-0.5 text-[11px] leading-snug text-gray-400 dark:text-gray-500">
                        <span v-if="d.nguon_tai_san">TS: {{ d.nguon_tai_san }}</span>
                        <span v-if="d.nguon_tai_san && d.nguon_cong_no"> · </span>
                        <span v-if="d.nguon_cong_no">CN: {{ d.nguon_cong_no }}</span>
                      </div>
                      <div v-if="d.ghi_chu"
                           class="mt-1 text-[11px] leading-snug text-amber-700 dark:text-amber-300 max-w-[240px]">
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
            <div class="px-3 py-2 text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
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
          <div class="mb-3 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
            ⚠️ {{ baBang.canh_bao }}
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div v-for="b in baBang.bang" :key="b.ten"
                 class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden flex flex-col">
              <div class="px-3 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
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
                    <!-- ══ MỤC 399 (29/08/2026) — HIỆN NGUỒN CỦA TỪNG Ô ══
                         🔴 Backend gắn `nguon` cho MỌI ô số từ MỤC 340
                         (27/08) — tên bảng và cột đã cộng ra con số đó.
                         Frontend chưa từng in nó ra.

                         Màn này là CÔNG CỤ SOI LỖI, không phải báo cáo.
                         Thấy một con số lạ mà không biết nó lấy từ đâu
                         thì không soi được gì — phải mở mã nguồn ra đọc,
                         và lúc đó công cụ mất tác dụng. -->
                    <div v-if="ke.nguon" class="text-[11px] leading-snug text-gray-400 dark:text-gray-500">
                      {{ ke.nguon }}
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
                    <!-- ══ MỤC 399 (29/08/2026) — HIỆN NGUỒN CỦA TỪNG Ô ══
                         🔴 Backend gắn `nguon` cho MỌI ô số từ MỤC 340
                         (27/08) — tên bảng và cột đã cộng ra con số đó.
                         Frontend chưa từng in nó ra.

                         Màn này là CÔNG CỤ SOI LỖI, không phải báo cáo.
                         Thấy một con số lạ mà không biết nó lấy từ đâu
                         thì không soi được gì — phải mở mã nguồn ra đọc,
                         và lúc đó công cụ mất tác dụng. -->
                    <div v-if="ke.nguon" class="text-[11px] leading-snug text-gray-400 dark:text-gray-500">
                      {{ ke.nguon }}
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
                    <!-- ══ MỤC 399 (29/08/2026) — HIỆN NGUỒN CỦA TỪNG Ô ══
                         🔴 Backend gắn `nguon` cho MỌI ô số từ MỤC 340
                         (27/08) — tên bảng và cột đã cộng ra con số đó.
                         Frontend chưa từng in nó ra.

                         Màn này là CÔNG CỤ SOI LỖI, không phải báo cáo.
                         Thấy một con số lạ mà không biết nó lấy từ đâu
                         thì không soi được gì — phải mở mã nguồn ra đọc,
                         và lúc đó công cụ mất tác dụng. -->
                    <div v-if="ke.nguon" class="text-[11px] leading-snug text-gray-400 dark:text-gray-500">
                      {{ ke.nguon }}
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
              <div v-if="b.lai_lo" class="px-3 py-2.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
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
            class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex flex-col"
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
            <div v-if="d.ten === 'Credit' && bang?.credit" class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
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
            <div v-else-if="d.ten === 'Rental' && bang?.rental" class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
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
            <div v-else-if="d.ten === 'Thu hoạch' && bang?.thu_hoach" class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
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
                     class="mt-2 rounded bg-amber-50 dark:bg-amber-900/20 px-2 py-1 text-[11px] text-amber-700 dark:text-amber-300">
                  {{ bang.thu_hoach.so_ngay_thieu_so_lieu }} ngày trong tháng
                  chưa có phiếu thu mua nào
                </div>
              </template>
            </div>

            <!-- ── Ggomoosin ── -->
            <div v-else-if="d.ten === 'Ggomoosin' && bang?.ggomoosin" class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
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
            <div v-else-if="d.ten === 'Tiến Nga' && bang?.tien_nga" class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
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
            <div v-else-if="d.ten === 'Hụi' && bang?.hui" class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
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
                <!-- MỤC 399 (29/08/2026) — backend đếm sẵn `so_luot` và
                     `da_dong` từ MỤC 340, frontend chỉ in phần CHƯA đóng.
                     Nhìn mỗi "3 lượt chưa đóng" thì không biết là 3/4 hay
                     3/40 — mà đó mới là thứ nói lên tình hình. -->
                <div v-if="bang.hui.dong_tien.so_luot > 0"
                     class="flex justify-between text-xs mb-1">
                  <span class="text-gray-500 dark:text-gray-400">Lượt đóng tháng này</span>
                  <span class="tabular-nums font-medium text-gray-800 dark:text-gray-100">
                    {{ bang.hui.dong_tien.da_dong }}/{{ bang.hui.dong_tien.so_luot }}
                  </span>
                </div>
                <div v-if="bang.hui.dong_tien.chua_dong > 0"
                     class="mt-2 rounded bg-amber-50 dark:bg-amber-900/20 px-2 py-1 text-[11px] text-amber-700 dark:text-amber-300">
                  {{ bang.hui.dong_tien.chua_dong }} lượt chưa đóng
                  ({{ tien(bang.hui.dong_tien.tien_chua_dong) }})
                </div>
              </template>
            </div>

            <!-- ── Other: 10 mục đến hạn gần nhất (MỤC 348) ── -->
            <div v-else-if="d.ten === 'Other' && bang?.sap_den_han" class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
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
                   class="mb-2 rounded bg-red-50 dark:bg-red-900/20 px-2 py-1 text-[11px] text-red-700 dark:text-red-300 font-medium">
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
                     class="mb-2 rounded bg-red-50 dark:bg-red-900/20 px-2 py-1 text-[11px] text-red-700 dark:text-red-300 font-medium">
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
                  <!-- ══ MỤC 387 (29/08/2026) — THÊM LẦN GẦN NHẤT ══
                       s68 nêu 29/08: nhìn "Test001 · 7 lần" thì không biết
                       bảy lần đó là hôm qua hay từ tuần trước — mà đó chính
                       là thứ quyết định có phải đi xem không.

                       ⚠️ Lấy lần MỚI NHẤT, không phải lần đầu. Ai dò mật
                       khẩu thì lần gần nhất mới là thứ đáng lo. -->
                  <!-- ══ MỤC 394 (29/08/2026) — Ô TICK "ĐÃ KIỂM TRA" ══
                       s68 chốt: tick xong bấm F5 thì dòng đó không hiện nữa.

                       ⚠️ Ô tick KHÔNG BAO GIỜ ở trạng thái đã tick trên màn
                       này: tick xong là dòng biến mất khỏi danh sách. Nên
                       nó là một NÚT HÀNH ĐỘNG chứ không phải trạng thái —
                       vì vậy có chữ "đã kiểm" ngay cạnh, để không ai tưởng
                       mình tick hụt. -->
                  <div v-for="t in bang.dang_nhap_hong.theo_ten" :key="t.ten"
                       class="flex items-baseline gap-2 text-[11px]">
                    <label class="flex items-center gap-1 shrink-0 cursor-pointer select-none"
                           :title="'Đánh dấu đã kiểm ' + t.so_lan + ' lần sai của ' + t.ten">
                      <input type="checkbox"
                             class="h-3 w-3 cursor-pointer accent-blue-600 disabled:cursor-wait"
                             :disabled="dangXuLyTen !== ''"
                             :checked="false"
                             @change="tickDaKiem(t.ten)" />
                      <span class="text-gray-400 dark:text-gray-500">
                        {{ dangXuLyTen === t.ten ? 'đang lưu…' : 'đã kiểm' }}
                      </span>
                    </label>
                    <span class="w-[7rem] shrink-0 text-gray-600 dark:text-gray-300 break-all">
                      {{ t.ten }}
                    </span>
                    <span class="tabular-nums text-gray-500 shrink-0">{{ t.so_lan }} lần</span>
                    <span class="tabular-nums text-gray-400 dark:text-gray-500 ml-auto">
                      {{ t.lan_gan_nhat || '—' }}
                    </span>
                  </div>

                  <!-- 🔴 Hỏng thì nói ra NGAY CẠNH ô tick, không nuốt.
                       Nuốt lỗi thì người dùng bấm, thấy dòng vẫn còn, rồi
                       bấm tiếp — mà lần nào cũng hỏng như nhau. -->
                  <div v-if="loiTick"
                       class="mt-1.5 rounded bg-red-50 dark:bg-red-900/20 px-2 py-1 text-[11px] text-red-700 dark:text-red-300">
                    {{ loiTick }}
                  </div>
                </div>

                <!-- ══════════════════════════════════════════════════════
                     MỤC 394 (29/08/2026) — DANH SÁCH ĐÃ ĐÁNH DẤU, CÓ NÚT GỠ

                     🔴 KHỐI NÀY LÀ ĐƯỜNG QUAY LẠI. Thiếu nó thì ô tick là
                     một chiều: tick nhầm một cái là dòng cảnh báo bảo mật
                     biến mất vĩnh viễn và không ai biết.

                     ⚠️ Danh sách lấy từ máy chủ (`theo_ten_da_kiem`), KHÔNG
                     phải từ bộ nhớ trình duyệt. Nhớ trong trình duyệt thì
                     bấm F5 một cái là mất, và lúc đó lại thành một chiều.
                     ══════════════════════════════════════════════════ -->
                <div v-if="bang.dang_nhap_hong.theo_ten_da_kiem?.length"
                     class="mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                  <div class="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Đã đánh dấu ({{ bang.dang_nhap_hong.so_da_kiem }} dòng)
                  </div>
                  <div v-for="t in bang.dang_nhap_hong.theo_ten_da_kiem" :key="'dk-' + t.ten"
                       class="flex items-baseline gap-2 text-[11px] text-gray-400 dark:text-gray-500">
                    <span class="w-[7rem] shrink-0 break-all line-through">{{ t.ten }}</span>
                    <span class="tabular-nums shrink-0">{{ t.so_lan }} lần</span>
                    <span class="tabular-nums shrink-0">{{ t.kiem_luc }}</span>
                    <button type="button"
                            class="ml-auto shrink-0 text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-wait"
                            :disabled="dangXuLyTen !== ''"
                            @click="goDauDaKiem(t.ten)">
                      {{ dangXuLyTen === t.ten ? 'đang gỡ…' : 'gỡ dấu' }}
                    </button>
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
                  <!-- MỤC 399 (29/08/2026) — backend đã tách sẵn main /
                       member từ MỤC 340, frontend chưa in ra. s68 chốt
                       27/08 (yêu cầu số 7): ô này phải hiện "số nhóm
                       từng dự án" — mà một dự án có hai loại nhóm với
                       vai trò khác hẳn nhau, gộp lại là mất thông tin. -->
                  <!-- ══════════════════════════════════════════════════
                       MỤC 526 (05/09/2026) — BẤM SỐ THÌ HIỆN RA LÀ NHỮNG
                       NHÓM NÀO

                       s68 05/09: *"Các nhóm main khi bấm vào số thì hiện
                       danh sách nhóm main giúp tôi luôn."*

                       ⚠️ Làm CẢ số member, không chỉ số main. Hai con số
                       nằm sát nhau mà một bấm được một không thì người
                       dùng bấm cái kia tưởng máy hỏng.

                       ⚠️ Máy chủ chưa gửi danh sách (bản cũ) thì số hiện
                       như chữ thường, KHÔNG bấm được. Cho bấm vào chỗ
                       không có dữ liệu là mở ra hộp rỗng — quy tắc từ
                       MỤC 438.

                       ⚠️ Dùng `<button>`, KHÔNG dùng `<span @click>`.
                       ══════════════════════════════════════════════════ -->
                  <span v-if="t.so_nhom_main !== undefined"
                        class="tabular-nums text-[11px] text-gray-400 dark:text-gray-500">
                    (<button v-if="t.nhom_main && t.nhom_main.length" type="button"
                             class="underline decoration-dotted underline-offset-2 hover:text-blue-600 dark:hover:text-blue-400"
                             :title="`Xem ${t.so_nhom_main} nhóm main của ${t.du_an}`"
                             @click.stop="moDsNhom(t, 'main')">{{ t.so_nhom_main }}</button><template
                             v-else>{{ t.so_nhom_main }}</template> main ·
                    <button v-if="t.nhom_member && t.nhom_member.length" type="button"
                            class="underline decoration-dotted underline-offset-2 hover:text-blue-600 dark:hover:text-blue-400"
                            :title="`Xem ${t.so_nhom_member} nhóm member của ${t.du_an}`"
                            @click.stop="moDsNhom(t, 'member')">{{ t.so_nhom_member }}</button><template
                            v-else>{{ t.so_nhom_member }}</template> member)
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

    <!-- ══════════════════════════════════════════════════════════════
         MỤC 526 (05/09/2026) — HỘP DANH SÁCH NHÓM
         ══════════════════════════════════════════════════════════════ -->
    <el-dialog v-model="hienDsNhom" :width="rongHopNhom" align-center destroy-on-close>
      <template #header>
        <span class="font-bold">
          NHÓM {{ loaiDangXem === 'main' ? 'MAIN' : 'MEMBER' }}
          <span class="text-blue-600 ml-1">{{ duAnDangXem?.du_an }}</span>
        </span>
      </template>

      <div class="max-h-[60vh] overflow-y-auto">
        <ol v-if="dsNhomDangXem.length" class="space-y-1">
          <li v-for="(n, i) in dsNhomDangXem" :key="n.chat_id"
              class="flex items-baseline gap-2 text-sm py-1 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
            <span class="w-7 shrink-0 text-right tabular-nums text-gray-400">{{ i + 1 }}.</span>
            <span class="flex-1 min-w-0 break-words text-gray-800 dark:text-gray-100">{{ n.ten }}</span>
            <span class="shrink-0 font-mono text-[11px] text-gray-400 select-all">{{ n.chat_id }}</span>
          </li>
        </ol>
        <div v-else class="text-center text-gray-400 py-6 text-sm">
          Dự án này chưa có nhóm {{ loaiDangXem === 'main' ? 'main' : 'member' }} nào.
        </div>
      </div>

      <template #footer>
        <span class="text-sm text-gray-400 mr-3">Tổng: <b>{{ dsNhomDangXem.length }}</b> nhóm</span>
        <el-button type="primary" @click="hienDsNhom = false">Đóng</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'   // MỤC 526 — thêm computed
import { mauSo } from '@/utils/mauSo'
import { useRouter } from 'vue-router'
import { layQuyen, danhSachDuocVao, type DuAn } from '@/constants/duAn'
import { trangChuService } from '@/api/trangChu'

// ══════════════════════════════════════════════════════════════════
// MỤC 526 (05/09/2026) — BẤM SỐ NHÓM ĐỂ XEM LÀ NHỮNG NHÓM NÀO
//
// 🔴 Danh sách lấy THẲNG từ dữ liệu bảng điều khiển đã tải sẵn, không
// gọi thêm đường mạng nào. Máy chủ (`bot/utils/bang_dieu_khien.py`, hàm
// `tinh_telegram_nhom`) trả kèm `nhom_main` và `nhom_member` ngay trong
// cùng lời gọi đã dựng ra con số. Nhờ vậy số hiện trên màn và danh sách
// bấm ra CHẮC CHẮN cùng một nguồn — không có chuyện đếm 12 mà liệt kê
// ra 11.
// ══════════════════════════════════════════════════════════════════
const hienDsNhom = ref(false)
const duAnDangXem = ref<any | null>(null)
const loaiDangXem = ref<'main' | 'member'>('main')

const dsNhomDangXem = computed(() => {
  const d = duAnDangXem.value
  if (!d) return []
  return (loaiDangXem.value === 'main' ? d.nhom_main : d.nhom_member) || []
})

// Hộp rộng 640px trên máy tính, 95% bề ngang trên điện thoại — hộp cố
// định trên màn 390px là tràn ra ngoài mép (bài học MỤC 519).
const rongHopNhom = computed(() =>
  (typeof window !== 'undefined' && window.innerWidth < 768) ? '95%' : '640px')

const moDsNhom = (duAn: any, loai: 'main' | 'member') => {
  duAnDangXem.value = duAn
  loaiDangXem.value = loai
  hienDsNhom.value = true
}



const router = useRouter()

const dangTai = ref(true)
const loi = ref('')
const duAnCuaToi = ref<DuAn[]>([])
const bang = ref<any>(null)
const canDoi = ref<any>(null)
// MỤC 395 (29/08/2026) — hai khối của MỤC 329, trước nay bị vứt đi.
const vieccanLam = ref<any>(null)
const canhBao = ref<any>(null)
// MỤC 366 (28/08/2026) — ba bảng hạch toán độc lập.
const baBang = ref<any>(null)

// ══════════════════════════════════════════════════════════════════════
// MỤC 394 (29/08/2026) — Ô TICK "ĐÃ KIỂM TRA" Ở THẺ NHẬT KÝ
//
// `dangXuLyTen` giữ TÊN đang gọi máy chủ, không phải cờ true/false: có
// nhiều dòng cùng lúc trên màn, một cờ chung thì bấm dòng này lại khoá
// hết các dòng kia và người dùng tưởng màn đơ.
const dangXuLyTen = ref('')
const loiTick = ref('')

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
  await taiSoLieu()

  dangTai.value = false
})

/**
 * MỤC 394 (29/08/2026) — tách phần đọc số liệu ra hàm riêng.
 *
 * Trước đây khối này nằm thẳng trong `onMounted`. Ô tick nhật ký cần đọc
 * lại sau khi ghi, mà chép đôi khối try/catch ra chỗ thứ hai là hai bản
 * xử lý lỗi cho cùng một việc — sớm muộn một bản quên dọn `canDoi`.
 */
const taiSoLieu = async () => {
  try {
    const tt = await trangChuService.laySoLieu()
    bang.value = tt?.bang_dieu_khien || null
    canDoi.value = bang.value?.can_doi || null
    baBang.value = bang.value?.ba_bang || null

    // ══ MỤC 395 (29/08/2026) — GIỮ LẠI KHỐI "VIỆC CẦN LÀM" ══
    //
    // 🔴 Backend tính khối này từ MỤC 329 (26/08/2026) và trả về TRONG
    // MỖI LẦN GỌI. Frontend đọc mỗi `bang_dieu_khien` rồi vứt phần còn
    // lại — nên suốt từ đó tới nay nó chưa từng hiện lên màn nào.
    //
    // Không có lỗi, không có dòng đỏ. Đây là hỏng im lặng ở chiều ngược
    // lại: backend làm đúng, làm đủ, và không ai thấy.
    vieccanLam.value = tt?.viec_can_lam || null
    canhBao.value = tt?.canh_bao || null
  } catch (e) {
    bang.value = null
    canDoi.value = null
    baBang.value = null
    vieccanLam.value = null
    canhBao.value = null
  }
}

/**
 * MỤC 395 — màu và chữ cho ô "số ngày trễ".
 *
 * 🔴 KHÔNG dùng `mauSo`. Bảng màu chung nói về DẤU của một con số tiền
 * (âm đỏ, dương xanh biển, 0 xám). Ở đây số dương nghĩa là ĐÃ QUÁ HẠN —
 * dùng `mauSo` thì quá hạn 90 ngày hiện màu xanh biển như một khoản lãi.
 *
 * ⚠️ `null` = chưa tính được ngày (hợp đồng chưa khai ngày bắt đầu
 * thuê). Trả chuỗi rỗng chứ KHÔNG trả 0 — 0 nghĩa là "đến hạn đúng hôm
 * nay", khác hẳn "chưa biết".
 */
const chuTre = (soNgay: number | null | undefined) => {
  if (soNgay === null || soNgay === undefined) return ''
  if (soNgay > 0) return `quá hạn ${soNgay} ngày`
  if (soNgay === 0) return 'đến hạn hôm nay'
  return `còn ${-soNgay} ngày`
}

const mauTre = (soNgay: number | null | undefined) => {
  if (soNgay === null || soNgay === undefined)
    return 'text-gray-400 dark:text-gray-500'
  if (soNgay > 7) return 'text-red-600 dark:text-red-400 font-semibold'
  if (soNgay > 0) return 'text-amber-700 dark:text-amber-300'
  if (soNgay === 0) return 'text-amber-700 dark:text-amber-300 font-semibold'
  return 'text-gray-500 dark:text-gray-400'
}

/**
 * MỤC 395 — bấm một dòng thì nhảy tới màn xử lý việc đó.
 *
 * ⚠️ Đường dẫn do BACKEND trả (`duong_dan`), frontend không tự ghép. Ghép
 * ở đây là hai nơi cùng biết đường đi tới màn nào — đổi đường dẫn một
 * bên là bên kia dẫn vào trang trắng.
 */
const moViec = (v: any) => {
  if (v?.duong_dan) router.push(v.duong_dan)
}

/**
 * MỤC 394 — tick "đã kiểm tra" cho một tên trong thẻ Nhật ký.
 *
 * 🔴 TICK XONG PHẢI ĐỌC LẠI SỐ LIỆU TỪ MÁY CHỦ, KHÔNG TỰ XOÁ DÒNG.
 *
 * Tự xoá dòng khỏi mảng trên màn thì nhanh hơn, nhưng lúc đó màn hình
 * nói một đằng và database một nẻo — nếu máy chủ ghi hỏng thì dòng vẫn
 * biến mất và người dùng tưởng đã xử lý xong. Đọc lại là màn hình luôn
 * kể đúng thứ database đang có.
 *
 * ⚠️ Ô tick tác động lên MỌI dòng chưa kiểm của tên đó, không phải một
 * dòng. Đó là chủ ý — xem `tai_lieu_ai/bang_dieu_khien_trang_chu.md`
 * mục MỤC 388.
 */
const tickDaKiem = async (ten: string) => {
  if (dangXuLyTen.value) return
  dangXuLyTen.value = ten
  loiTick.value = ''
  try {
    await trangChuService.danhDauDaKiem(ten)
    await taiSoLieu()
  } catch (e: any) {
    // 🔴 Hỏng thì NÓI RA ngay cạnh ô tick. Nuốt lỗi thì người dùng bấm,
    // thấy dòng vẫn còn, rồi bấm tiếp — mà lần nào cũng hỏng như nhau.
    loiTick.value = e?.message || 'Không ghi được dấu đã kiểm.'
  } finally {
    dangXuLyTen.value = ''
  }
}

/**
 * MỤC 394 — gỡ dấu, cho các dòng của tên đó hiện lại.
 */
const goDauDaKiem = async (ten: string) => {
  if (dangXuLyTen.value) return
  dangXuLyTen.value = ten
  loiTick.value = ''
  try {
    await trangChuService.boDanhDau(ten)
    await taiSoLieu()
  } catch (e: any) {
    loiTick.value = e?.message || 'Không gỡ được dấu đã kiểm.'
  } finally {
    dangXuLyTen.value = ''
  }
}

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
