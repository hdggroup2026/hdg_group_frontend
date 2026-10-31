<script setup>
  import { RouterView, RouterLink } from 'vue-router'

  // MỤC 726 (01/11/2026) — DẢI BÁO "BẢN XEM TRƯỚC".
  // s68 01/11 chọn đề xuất số 1: web mới đẩy lên nhánh `xem-truoc` trước, Cloudflare
  // tự dựng bản xem trước ở https://xem-truoc-hdggroup.hdggroup2026.workers.dev
  // (mọi nhánh khác `main` đều có link dạng <tên-nhánh>-hdggroup.…). s68 duyệt xong
  // mới đẩy `main` (= bản thật).
  // 🔴 Bản xem trước dùng CHUNG máy chủ + database THẬT — bấm Lưu là lưu thật. Dải
  // này để không ai nhầm hai trang mà tưởng thao tác ở bản xem trước là "thử chơi".
  // VÌ SAO nhận theo tên miền, không theo biến build: Cloudflare dựng cùng một lệnh
  // build cho mọi nhánh, chỉ tên miền là khác.
  const laBanXemTruoc = /-hdggroup\.hdggroup2026\.workers\.dev$/.test(window.location.hostname)
</script>

<template>
  <div v-if="laBanXemTruoc"
       style="position: fixed; top: 0; left: 0; right: 0; z-index: 99999; pointer-events: none;
              background: #b9382b; color: #fff; font: 600 12px/1.6 system-ui, sans-serif;
              text-align: center; padding: 2px 8px;">
    BẢN XEM TRƯỚC — dữ liệu THẬT, bấm Lưu là lưu thật
  </div>
  <RouterView />
</template>
