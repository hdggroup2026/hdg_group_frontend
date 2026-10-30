<!--
  MỤC 723 (30/10/2026) — PHẦN GIẢI THÍCH của Sơ đồ vận hành. Nội dung = bản xem trước s68 đã xem
  30/10 (artifact "Sơ đồ vận hành HDG"), chép nguyên chữ; màu trỏ vào token HDG.
  ⚠️ Số liệu cố định ở đây (37 việc nền, 95 bảng, ≈600 nhóm) là số đo 30/10 — map liên kết bên cạnh
  mới là phần đọc trực tiếp từ máy chủ.
-->
<template>
  <div class="gt">

  <!-- ═══════════ BẢN ĐỒ ═══════════ -->
  <div class="map" role="img" aria-label="Sơ đồ: người dùng web qua Cloudflare và ngrok vào máy chủ; máy chủ nối database và Telegram; dịch vụ phụ bên dưới">
    <section class="zone zone--quiet area-dev">
      <div class="label">Nơi sửa code</div>
      <h3>Máy sửa (PC Windows)</h3>
      <div class="box"><b>Bản sao để chạy thử</b><span>Database bản sao + web chạy thử. Bot <b>tắt</b> (dùng chung token với máy chủ).</span></div>
      <div class="box"><b>Claude sửa code ở đây</b><span>Chạy bộ test (≈3.680 ca, phải 0 đỏ) rồi mới đẩy lên GitHub.</span></div>
    </section>

    <section class="zone zone--quiet area-top">
      <div class="label">Kho code</div>
      <h3>GitHub (2 kho riêng tư)</h3>
      <div class="box"><b>hdg_group_backend</b><span>Máy chủ kéo về khi bấm <code>10_CAP_NHAT_CODE.bat</code>.</span></div>
      <div class="box"><b>hdg_group_frontend</b><span>Đẩy lên là Cloudflare tự dựng web mới ngay.</span></div>
    </section>

    <section class="zone zone--quiet area-top2">
      <div class="label">Sao lưu</div>
      <h3>Bản sao an toàn</h3>
      <div class="box"><b>Database</b><span>Hẹn giờ tự chạy + nút <code>05</code>. Lưu ở 2 nơi: <code>_sao_luu</code> và <code>C:\HDG_SAO_LUU_DB</code> (giữ 30 bản).</span></div>
      <div class="box"><b>Mã nguồn</b><span>Tự nén trước mỗi lần cập nhật code (giữ 10 bản).</span></div>
    </section>

    <section class="zone area-user">
      <div class="label">Cửa vào 1 · trình duyệt</div>
      <h3>Trang web HDG</h3>
      <div class="box"><b>Người dùng</b><span>Owner, Admin, kế toán Tiến Nga, quản lý từng dự án. Mỗi tài khoản chỉ thấy dự án được cấp quyền.</span></div>
      <div class="box"><b>Cloudflare</b><span>Chứa trang web (Vue). Không chứa dữ liệu: mọi con số đều hỏi máy chủ.</span></div>
      <div class="box"><b>ngrok (đường hầm)</b><span>Địa chỉ cố định dẫn từ Internet vào cổng 8000 của máy chủ. Máy chủ không cần mở cổng ra ngoài.</span></div>
    </section>

    <div class="arrow area-a1"><i>⇄</i>hỏi / ghi<br>dữ liệu</div>

    <section class="zone zone--core area-core">
      <div class="label">Trái tim · máy chủ Windows</div>
      <h3>Một chương trình, ba phần</h3>
      <div class="box"><b>API cho web (FastAPI)</b><span>42 nhóm đường API. Kiểm đăng nhập + quyền từng mảng (xem / sửa / xoá). Sửa trên web thì báo vào nhóm Telegram liên quan.</span></div>
      <div class="box"><b>Bot Telegram (Pyrogram)</b><span>111 file xử lý lệnh, nút bấm, ảnh chấm công, tin nhắn trong nhóm.</span></div>
      <div class="box"><b>Việc tự chạy theo giờ</b><span>37 việc nền: tổng hợp mua mủ / quỹ / kho / thu hoạch cuối ngày, nhắc hạn (xe, giấy tờ, SIM, hợp đồng thuê, lãi vay, hụi), chấm công tự động, báo cáo tuần / tháng, bảng lương, quét nhóm, đối chiếu sổ cái, nhịp sống.</span></div>
      <div class="box" style="border-color: var(--green)"><b>PostgreSQL 17 (database)</b><span>95 bảng: hộ dân, thu mua, quỹ, kho, đối tác, nhân sự, chấm công, xe, thiết bị, SIM, giấy tờ, hụi, cho thuê, tín dụng, nhóm Telegram, nhật ký. Web và bot đọc / ghi <b>cùng một nơi</b>.</span></div>
      <div class="stat"><span>Bật bằng <b>01_BAT_BOT.bat</b></span><span>Nhật ký: thư mục <b>Logs/</b></span><span>Tự kiểm mốc database lúc bật</span></div>
    </section>

    <div class="arrow area-a2"><i>⇄</i>lệnh · tin báo<br>· file</div>

    <section class="zone zone--tg area-tg">
      <div class="label">Cửa vào 2 · Telegram</div>
      <h3>Nhóm Telegram</h3>
      <div class="box"><b>Bot @QLThanhVien_bot</b><span>Nhận lệnh <code>/…</code> và nút bấm, trả lời, gửi báo cáo, ảnh, file Excel.</span></div>
      <div class="box"><b>≈600 nhóm</b><span>Nhóm Main <b>I. TN - Tổng Quản Lý</b> (lệnh quản trị như <code>/kick_user</code>), nhóm main / member từng dự án, nhóm riêng từng nhân viên (GGO…), nhóm hộ dân.</span></div>
      <div class="box"><b>Tài khoản đọc tin (2 số)</b><span>Chỉ <b>đọc</b> tin chưa đọc để hiện trên web (Dự án Telegram). Không gửi, không sửa, không đánh dấu đã đọc.</span></div>
    </section>

    <section class="zone zone--quiet area-svc">
      <div class="label">Dịch vụ phụ máy chủ gọi tới</div>
      <h3>Công cụ đi kèm</h3>
      <div class="box"><b>Google Vertex AI (Gemini)</b><span>Trợ lý AI trả lời lệnh <code>/hoi</code> dựa trên tài liệu <code>tai_lieu_ai/</code>.</span></div>
      <div class="box"><b>Chromium (chạy ngầm)</b><span>Vẽ ảnh báo cáo, biểu đồ, bảng chấm công, phiếu lương để gửi vào nhóm.</span></div>
      <div class="box"><b>File Excel / Word</b><span>Xuất danh sách, bảng lương, sổ sách thành file rồi gửi qua Telegram hoặc tải trên web.</span></div>
    </section>

    <section class="zone zone--quiet area-svc2">
      <div class="label">Bên ngoài · không nối trực tiếp</div>
      <h3>Có liên quan nhưng không kết nối</h3>
      <div class="box"><b>Google Sheets</b><span><span class="pill off">không dùng</span> Hệ thống không đọc / ghi Google Sheets. Số liệu nằm trong database, xuất ra Excel khi cần.</span></div>
      <div class="box"><b>MoMo</b><span><span class="pill off">ngoài hệ thống</span> MoMo tự nạp SIM. Bot chỉ hỏi hạn dùng cuối tháng rồi báo hạn mới vào nhóm.</span></div>
      <div class="box"><b>Zalo</b><span><span class="pill off">chỉ lưu thông tin</span> Là một cột liên hệ của đối tác, không gửi tin qua Zalo.</span></div>
    </section>
  </div>

  <!-- ═══════════ LUỒNG VIỆC ═══════════ -->
  <h2>Một việc đi qua hệ thống thế nào</h2>
  <p class="lead">Ba đường đi thường gặp nhất. Các bước theo đúng thứ tự máy chạy.</p>
  <div class="flows">
    <section class="flow">
      <span class="pill ok">Từ web</span>
      <h3>Kế toán nhập trên web</h3>
      <ol>
        <li>Mở web, đăng nhập. Web lấy quyền, chỉ hiện dự án được cấp.</li>
        <li>Nhập phiếu và bấm Lưu. Web gửi qua ngrok tới API máy chủ.</li>
        <li>API kiểm quyền rồi ghi vào database.</li>
        <li>Máy chủ báo vào nhóm Telegram liên quan: giá trị cũ ➜ mới, kèm tên người sửa.</li>
      </ol>
      <div class="eg">Ví dụ: "Chi trả công nợ" đối tác. Đổi công nợ đối tác + tạo phiếu thu / chi gắn quỹ (thu: quỹ tăng, chi: quỹ giảm).</div>
    </section>
    <section class="flow">
      <span class="pill" style="color:var(--blue);background:var(--blue-soft)">Từ Telegram</span>
      <h3>Nhân viên gõ lệnh trong nhóm</h3>
      <ol>
        <li>Gõ <code>/</code> trong nhóm. Telegram hiện danh sách lệnh đã gợi ý cho đúng loại nhóm đó.</li>
        <li>Bot nhận lệnh, kiểm người gõ (Owner / Admin / chức danh) và nhóm.</li>
        <li>Bot đọc hoặc ghi database, dùng chung dữ liệu với web.</li>
        <li>Trả lời trong nhóm: tin nhắn, ảnh do Chromium vẽ, hoặc file Excel.</li>
      </ol>
      <div class="eg">Danh sách lệnh nào ở nhóm nào: xem trang web <b>Danh sách lệnh</b> (mới, MỤC 720–721).</div>
    </section>
    <section class="flow">
      <span class="pill warn">Tự chạy</span>
      <h3>Việc theo giờ, không ai bấm</h3>
      <ol>
        <li>37 việc nền chạy cùng bot, mỗi việc tự canh giờ của mình.</li>
        <li>Tới giờ: đọc database, tính tổng / tìm thứ sắp hết hạn.</li>
        <li>Gửi vào đúng nhóm: nhóm dự án, nhóm Main, nhóm riêng nhân viên.</li>
        <li>Ghi nhật ký. Việc nào hỏng thì báo lỗi, không làm dừng việc khác.</li>
      </ol>
      <div class="eg">Ví dụ: 22:00 ngày 1 báo hạn SIM MoMo mới · cuối ngày tổng hợp thu mua mủ · 08:20 thứ Hai báo cáo kho.</div>
    </section>
  </div>

  <!-- ═══════════ THÀNH PHẦN ═══════════ -->
  <h2>Từng thành phần: nằm ở đâu, hỏng thì sao</h2>
  <div class="tbl-wrap">
    <table>
      <thead><tr><th>Thành phần</th><th>Nằm ở đâu</th><th>Làm gì</th><th>Nếu ngừng</th></tr></thead>
      <tbody>
        <tr><td>Máy chủ Windows</td><td>Một máy, chạy 24/7</td><td>Chạy API + bot + việc theo giờ + database</td><td><span class="pill warn">mọi thứ dừng</span> Web không tải được số, bot im lặng. Bấm <code>01_BAT_BOT.bat</code> để bật lại.</td></tr>
        <tr><td>Database</td><td>PostgreSQL 17 trên máy chủ</td><td>Kho dữ liệu duy nhất</td><td><span class="pill warn">mọi thứ dừng</span> Có bản sao tự động ở 2 nơi; khôi phục phải nhờ Claude, không có nút tự khôi phục.</td></tr>
        <tr><td>ngrok</td><td>Chạy kèm bot trên máy chủ</td><td>Cho web ngoài Internet gọi tới máy chủ</td><td>Web mở được nhưng báo không đọc được dữ liệu; Telegram vẫn chạy.</td></tr>
        <tr><td>Cloudflare</td><td>Dịch vụ ngoài</td><td>Phát trang web</td><td>Không vào được web; bot Telegram vẫn chạy bình thường.</td></tr>
        <tr><td>Bot Telegram</td><td>Trong chương trình máy chủ</td><td>Lệnh, nút, tin báo, việc theo giờ</td><td>Nhóm không nhận tin, lệnh không trả lời; web vẫn xem / sửa được.</td></tr>
        <tr><td>Tài khoản đọc tin</td><td>2 số điện thoại đăng nhập trên máy chủ</td><td>Đếm và đọc tin chưa đọc cho web</td><td>Chỉ mất mục đọc tin trên web. Đăng nhập lại bằng <code>20_DANG_NHAP_TELEGRAM.bat</code>.</td></tr>
        <tr><td>Vertex AI</td><td>Google Cloud</td><td>Trợ lý <code>/hoi</code></td><td>Chỉ <code>/hoi</code> không trả lời được.</td></tr>
        <tr><td>GitHub</td><td>Dịch vụ ngoài</td><td>Giữ code, chuyển code sang máy chủ / Cloudflare</td><td>Không cập nhật được code mới; hệ thống đang chạy không ảnh hưởng.</td></tr>
      </tbody>
    </table>
  </div>

  <!-- ═══════════ CẬP NHẬT + AN TOÀN ═══════════ -->
  <div class="grid2">
    <section class="note">
      <div class="label">Đường đi của một lần sửa code</div>
      <h3>Từ máy sửa tới máy chủ</h3>
      <ul>
        <li>Claude sửa trên máy sửa, chạy test trên database bản sao.</li>
        <li>Đẩy backend lên GitHub ➜ anh bấm <code>10_CAP_NHAT_CODE.bat</code> trên máy chủ: tự tắt bot, sao lưu code, kéo code mới, bật lại bot.</li>
        <li>Có thay đổi database thì dừng lại: <code>05</code> sao lưu ➜ <code>11</code> xem trước (chụp ảnh) ➜ <code>12</code> làm thật ➜ <code>01</code> bật bot.</li>
        <li>Web chỉ đẩy <b>sau</b> khi máy chủ đã xong, vì đẩy web là lên Cloudflare ngay.</li>
      </ul>
    </section>
    <section class="note">
      <div class="label">Nguyên tắc an toàn đang giữ</div>
      <h3>Những thứ không bao giờ làm</h3>
      <ul>
        <li>Không bật bot trên máy sửa: trùng token sẽ lỗi 409 và gửi tin thật vào nhóm.</li>
        <li>Không đưa mật khẩu, token, file phiên Telegram vào GitHub hay gói giao.</li>
        <li>Việc dính tiền / dữ liệu thật luôn 2 bước: XEM TRƯỚC ➜ anh gửi ảnh ➜ LÀM THẬT.</li>
        <li>Tin báo không in mật khẩu, PUK, ICCID, số tài khoản ngân hàng.</li>
      </ul>
    </section>
  </div>

  <p class="src">Nguồn: đọc mã nguồn backend bản <code>0fed2e6</code> và web bản 30/10/2026 trên máy sửa. Số bảng database lấy từ bản sao lưu máy chủ 30/10 (95 bảng); số nhóm Telegram từ database bản sao 10/10 (627 nhóm). Số việc nền (37) đếm từ <code>app/main.py</code>.</p>
  </div>
</template>

<style scoped>
.gt {
  /* Tên biến của bản xem trước (artifact 30/10) trỏ vào token HDG (src/design/tokens.css) */
  --bg: var(--hdg-bg); --card: var(--hdg-card); --line: var(--hdg-border); --alt: var(--hdg-row-alt);
  --fg: var(--hdg-text); --muted: var(--hdg-text-muted);
  --green: var(--hdg-primary); --green-soft: var(--hdg-primary-soft); --green-deep: var(--hdg-primary);
  --gold: var(--hdg-gold); --gold-text: var(--hdg-gold-text); --gold-soft: var(--hdg-gold-soft);
  --blue: var(--hdg-info-text); --blue-soft: var(--hdg-info-soft);
  --serif: var(--hdg-font-serif); --sans: var(--hdg-font-sans); --mono: var(--hdg-font-mono);
  font-size: 15px; line-height: 1.6;
}
.gt h2, .gt h3 { font-family: var(--serif); text-wrap: balance; margin: 0; }
.gt h2 { font-size: 22px; margin-top: 40px; }
.gt .lead { color: var(--muted); max-width: 70ch; margin: 6px 0 0; }
.gt .label { font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
.gt code { font-family: var(--mono); font-size: .9em; }
.gt .pill { display: inline-flex; align-items: center; gap: 6px; padding: 1px 9px; border-radius: 999px; font-size: 13px; font-weight: 600; }
.gt .pill::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.gt .ok { color: var(--green); background: var(--green-soft); }
.gt .warn { color: var(--gold-text); background: var(--gold-soft); }
.gt .off { color: var(--muted); background: var(--alt); border: 1px solid var(--line); }
/* ── Bản đồ ── */
.map { margin-top: 26px; display: grid; gap: 14px;
  grid-template-columns: minmax(0, 1fr) 56px minmax(0, 1.25fr) 56px minmax(0, 1fr);
  grid-template-areas: "dev . top . top2" "user a1 core a2 tg" "x . svc . svc2"; align-items: stretch; }
.zone { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 16px 18px; min-width: 0; }
.zone h3 { font-size: 18px; margin: 4px 0 10px; }
.zone--core { border: 2px solid var(--green); box-shadow: 0 1px 2px rgba(20,40,25,.06), 0 6px 18px rgba(20,40,25,.07); }
.zone--tg { border-color: var(--blue); }
.zone--quiet { background: var(--alt); }
.box { border: 1px solid var(--line); border-radius: 9px; padding: 9px 12px; margin-top: 8px; background: var(--card); }
.box > b { display: block; font-size: 14.5px; }
.box > span { display: block; font-size: 13px; color: var(--muted); line-height: 1.45; }
.zone--core .box { background: var(--alt); }
.arrow { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  color: var(--muted); font-size: 12.5px; text-align: center; line-height: 1.3; }
.arrow i { font-style: normal; font-size: 24px; color: var(--green); line-height: 1; }
.area-dev { grid-area: dev; } .area-top { grid-area: top; } .area-top2 { grid-area: top2; }
.area-user { grid-area: user; } .area-a1 { grid-area: a1; } .area-core { grid-area: core; }
.area-a2 { grid-area: a2; } .area-tg { grid-area: tg; } .area-svc { grid-area: svc; } .area-svc2 { grid-area: svc2; } .area-x { grid-area: x; }
.stat { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 10px; font-size: 13px; color: var(--muted); }
.stat b { color: var(--fg); font-variant-numeric: tabular-nums; }

@media (max-width: 980px) {
  .map { grid-template-columns: minmax(0, 1fr); grid-template-areas: "user" "a1" "core" "a2" "tg" "svc" "svc2" "top" "top2" "dev" "x"; }
  .arrow { flex-direction: row; padding: 2px 0; }
  .arrow i { transform: rotate(90deg); }
}

/* ── Luồng việc ── */
.flows { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 14px; }
.flow { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 16px 18px; min-width: 0; }
.flow h3 { font-size: 17px; }
.flow ol { margin: 10px 0 0; padding-left: 20px; display: grid; gap: 6px; }
.flow li { padding-left: 2px; }
.flow .eg { margin-top: 10px; font-size: 13px; color: var(--muted); border-top: 1px dashed var(--line); padding-top: 8px; }
@media (max-width: 980px) { .flows { grid-template-columns: minmax(0, 1fr); } }

/* ── Bảng ── */
.tbl-wrap { overflow-x: auto; margin-top: 14px; background: var(--card); border: 1px solid var(--line); border-radius: 14px; }
table { border-collapse: collapse; width: 100%; min-width: 760px; font-size: 14px; }
th, td { text-align: left; padding: 10px 14px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); background: var(--alt); }
tr:last-child td { border-bottom: 0; }
td:first-child { font-weight: 600; white-space: nowrap; }

.grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 14px; }
@media (max-width: 760px) { .grid2 { grid-template-columns: minmax(0, 1fr); } }
.note { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 16px 18px; min-width: 0; }
.note h3 { font-size: 17px; margin-bottom: 6px; }
.note ul { margin: 6px 0 0; padding-left: 18px; display: grid; gap: 4px; }
.src { margin-top: 40px; font-size: 13px; color: var(--muted); border-top: 1px solid var(--line); padding-top: 12px; }
</style>
