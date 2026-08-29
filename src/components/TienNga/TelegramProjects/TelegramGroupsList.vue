<template>
  <div class="telegram-groups-list h-full p-6 overflow-y-auto flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">

    <!-- Breadcrumb / Back navigation -->
    <div class="flex items-center gap-3 mb-6 shrink-0">
      <el-button
        v-if="currentStep > 1"
        link
        type="primary"
        class="!text-blue-500 !text-blue-400 !font-semibold !text-sm hover:!text-blue-600"
        @click="goBack"
      >
        <el-icon class="mr-1"><ArrowLeft /></el-icon>
        Quay lại
      </el-button>

      <!-- Breadcrumb -->
      <div class="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 flex-1 min-w-0">
        <span
          class="cursor-pointer hover:text-blue-500 transition-colors shrink-0"
          :class="currentStep === 1 ? 'text-blue-600 dark:text-blue-400 font-bold' : ''"
          @click="goToStep(1)">
          Dự án
        </span>
        <template v-if="currentStep >= 2">
          <el-icon :size="12"><ArrowRight /></el-icon>
          <span
            class="truncate cursor-pointer hover:text-blue-500 transition-colors"
            :class="currentStep === 2 ? 'text-blue-600 dark:text-blue-400 font-bold' : ''"
            @click="goToStep(2)">
            {{ selectedProject?.project_name || 'Nhóm Main' }}
          </span>
        </template>
        <template v-if="currentStep === 3">
          <el-icon :size="12"><ArrowRight /></el-icon>
          <span class="truncate text-blue-600 dark:text-blue-400 font-bold">
            {{ selectedMainGroup?.group_name || 'Members' }}
          </span>
        </template>
      </div>
    </div>

    <!-- ===== STEP 1: Danh sách Dự án ===== -->
    <div v-if="currentStep === 1" v-loading="loading" class="flex-1 min-h-0 flex flex-col overflow-y-auto">
      <div class="flex items-center justify-between mb-5 shrink-0">
        <h3 class="text-lg font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <span class="w-2.5 h-2.5 bg-blue-500 dark:bg-blue-400 rounded-full"></span>
          QUẢN LÝ DỰ ÁN
          <span class="ml-2 text-xs text-gray-400 dark:text-gray-500 font-semibold bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
            {{ projects.length }}
          </span>
        </h3>
        <el-button 
          type="primary" 
          class="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 border-none rounded-xl font-semibold shadow-md transition-all duration-300 hover:shadow-lg text-white flex items-center"
          @click="handleOpenCreateProjectDialog"
        >
          <el-icon class="mr-1.5"><Plus /></el-icon>
          Thêm dự án
        </el-button>
      </div>

      <!-- Single Row Project Cards Container with Horizontal Scroll -->
      <div v-if="projects.length > 0" class="flex flex-nowrap overflow-x-auto gap-5 p-1 pb-4 scrollbar-thin">
        <div
          v-for="(proj, idx) in projects"
          :key="proj.id"
          class="group relative rounded-2xl border border-gray-100 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 min-w-[280px] sm:min-w-[320px] max-w-[350px] shrink-0 flex flex-col justify-between"
          @click="selectProject(proj)"
        >
          <div>
            <div class="flex items-start gap-3">
              <div
                class="p-2.5 rounded-xl text-white shadow-sm flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                :style="{ backgroundColor: getCardColor(idx) }"
              >
                <el-icon :size="20"><Connection /></el-icon>
              </div>
              <div class="flex-1 min-w-0 text-left">
                <div class="flex items-center justify-between gap-1">
                  <h4 class="font-bold text-gray-800 dark:text-gray-100 text-[15px] line-clamp-2 leading-snug flex-1">
                    {{ proj.project_name }}
                  </h4>

                  <!-- Dropdown Action Menu for Project -->
                  <el-dropdown trigger="click" @command="(cmd: string) => handleProjectCommand(cmd, proj)">
                    <el-button link type="info" class="p-1 !text-gray-400 hover:!text-gray-600 dark:hover:!text-gray-200" @click.stop>
                      <el-icon :size="16"><MoreFilled /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="edit">
                          <el-icon class="mr-1"><Edit /></el-icon>
                          Đổi tên
                        </el-dropdown-item>
                        <el-dropdown-item command="delete" divided class="!text-red-500">
                          <el-icon class="mr-1"><Delete /></el-icon>
                          Xóa dự án
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
                <div class="text-[11px] text-gray-400 mt-2">
                  ID: {{ proj.id.substring(0, 8) }}...
                </div>
              </div>
            </div>
          </div>

          <div class="mt-5 pt-3 border-t border-gray-50 dark:border-gray-700/40 flex items-center justify-between text-[11px] font-semibold text-blue-600 dark:text-blue-400 opacity-70 group-hover:opacity-100 transition-opacity">
            <span>Xem nhóm Telegram</span>
            <el-icon class="ml-1 transition-transform duration-300 group-hover:translate-x-1"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="!loading" class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
        <el-icon class="text-6xl mb-4"><Connection /></el-icon>
        <p class="text-lg">Chưa có dự án nào</p>
        <el-button type="primary" link class="mt-2 font-bold" @click="handleOpenCreateProjectDialog">Thêm dự án đầu tiên</el-button>
      </div>
    </div>

    <!-- ===== STEP 2: Danh sách Nhóm Main ===== -->
    <div v-else-if="currentStep === 2" v-loading="loading" class="flex-1 min-h-0 overflow-y-auto">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-lg font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <span class="w-2.5 h-2.5 bg-emerald-500 dark:bg-emerald-400 rounded-full"></span>
          Nhóm Main
          <span class="ml-2 text-xs text-gray-400 dark:text-gray-500 font-semibold bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
            {{ mainGroups.length }}
          </span>
        </h3>
      </div>

      <div v-if="mainGroups.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 p-1">
        <div
          v-for="(group, idx) in mainGroups"
          :key="group.chat_id"
          class="group relative rounded-2xl border border-gray-100 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          @click="selectMainGroup(group)"
        >
          <div class="flex items-start gap-3">
            <div
              class="p-2.5 rounded-xl text-white shadow-sm flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
              :style="{ backgroundColor: getMainGroupColor(idx) }"
            >
              <el-icon :size="20"><ChatLineRound /></el-icon>
            </div>
            <div class="flex-1 min-w-0 text-left">
              <div class="flex items-center justify-between gap-1">
                <h4 class="font-bold text-gray-800 dark:text-gray-100 text-[15px] line-clamp-2 leading-snug flex-1">
                  {{ group.group_name || 'Nhóm không tên' }}
                </h4>
                <el-dropdown trigger="click" @command="(cmd: string) => handleGroupCommand(cmd, group)">
                  <el-button link type="info" class="p-1 !text-gray-400 hover:!text-gray-600 dark:hover:!text-gray-200" @click.stop>
                    <el-icon :size="16"><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="detail">
                        <el-icon class="mr-1"><View /></el-icon>
                        Chi tiết
                      </el-dropdown-item>
                      <el-dropdown-item command="copy-chat-id">
                        <el-icon class="mr-1"><CopyDocument /></el-icon>
                        Copy Chat ID
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
              <div class="flex items-center gap-3 mt-2">
                <span class="text-[11px] text-gray-400 flex items-center gap-1">
                  <el-icon :size="12"><User /></el-icon>
                  {{ group.member_count }} thành viên
                </span>
                <span v-if="group.custom_title" class="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">
                  {{ group.custom_title }}
                </span>
              </div>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-gray-50 dark:border-gray-700/40 flex items-center justify-between text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 opacity-70 group-hover:opacity-100 transition-opacity">
            <span>Xem nhóm con</span>
            <el-icon class="ml-1 transition-transform duration-300 group-hover:translate-x-1"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="!loading" class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
        <el-icon class="text-6xl mb-4"><ChatLineRound /></el-icon>
        <p class="text-lg">Dự án này chưa có nhóm Main nào</p>
      </div>
    </div>

    <!-- ===== STEP 3: Thông tin Main + Danh sách Member ===== -->
    <div v-else-if="currentStep === 3" v-loading="loading" class="flex-1 min-h-0 overflow-y-auto">
      <!-- Main Group Header Card -->
      <div v-if="selectedMainGroup" class="mb-6 rounded-2xl border border-emerald-200 dark:border-emerald-700/60 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-5">
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-xl bg-emerald-500 text-white shadow-md flex items-center justify-center shrink-0">
            <el-icon :size="24"><ChatLineRound /></el-icon>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-gray-800 dark:text-gray-100 text-lg">
              {{ selectedMainGroup.group_name || 'Nhóm không tên' }}
            </h3>
            <div class="flex items-center gap-4 mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              <span class="flex items-center gap-1">
                <el-icon :size="14"><User /></el-icon>
                {{ selectedMainGroup.member_count }} thành viên
              </span>
              <span v-if="selectedMainGroup.custom_title" class="bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded text-xs font-medium">
                {{ selectedMainGroup.custom_title }}
              </span>
              <span class="text-xs text-gray-400">
                Chat ID: {{ selectedMainGroup.chat_id }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Member Groups -->
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-lg font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <span class="w-2.5 h-2.5 bg-violet-500 dark:bg-violet-400 rounded-full"></span>
          Nhóm Member
          <span class="ml-2 text-xs text-gray-400 dark:text-gray-500 font-semibold bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
            {{ memberGroups.length }}
          </span>
        </h3>
      </div>

      <div v-if="memberGroups.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 p-1">
        <div
          v-for="(group, idx) in memberGroups"
          :key="group.chat_id"
          class="relative rounded-2xl border border-gray-100 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
        >
          <div class="flex items-start gap-3">
            <div
              class="p-2.5 rounded-xl text-white shadow-sm flex items-center justify-center shrink-0"
              :style="{ backgroundColor: getMemberGroupColor(idx) }"
            >
              <el-icon :size="20"><User /></el-icon>
            </div>
            <div class="flex-1 min-w-0 text-left">
              <div class="flex items-center justify-between gap-1">
                <h4 class="font-bold text-gray-800 dark:text-gray-100 text-[15px] line-clamp-2 leading-snug flex-1">
                  {{ group.group_name || 'Nhóm không tên' }}
                </h4>
                <el-dropdown trigger="click" @command="(cmd: string) => handleGroupCommand(cmd, group)">
                  <el-button link type="info" class="p-1 !text-gray-400 hover:!text-gray-600 dark:hover:!text-gray-200" @click.stop>
                    <el-icon :size="16"><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="detail">
                        <el-icon class="mr-1"><View /></el-icon>
                        Chi tiết
                      </el-dropdown-item>
                      <el-dropdown-item command="copy-chat-id">
                        <el-icon class="mr-1"><CopyDocument /></el-icon>
                        Copy Chat ID
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
              <div class="flex items-center gap-3 mt-2">
                <span class="text-[11px] text-gray-400 flex items-center gap-1">
                  <el-icon :size="12"><User /></el-icon>
                  {{ group.member_count }} thành viên
                </span>
                <span v-if="group.custom_title" class="text-[10px] bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded font-medium">
                  {{ group.custom_title }}
                </span>
              </div>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t border-gray-50 dark:border-gray-700/40 text-[11px] text-gray-400">
            Chat ID: {{ group.chat_id }}
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="!loading" class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
        <el-icon class="text-6xl mb-4"><User /></el-icon>
        <p class="text-lg">Nhóm Main này chưa có nhóm Member nào</p>
      </div>
    </div>

    <!-- ===== Dialog: Chi tiết thành viên nhóm ===== -->
    <el-dialog
      v-model="memberDialogVisible"
      :title="detailGroupName"
      width="750px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-loading="memberDialogLoading" class="min-h-[200px]">
        <!-- Group info header -->
        <div class="mb-4 flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <div class="p-2 rounded-lg bg-blue-500 text-white">
            <el-icon :size="18"><ChatLineRound /></el-icon>
          </div>
          <div>
            <div class="font-bold text-gray-800 dark:text-gray-100 text-sm">{{ detailGroupName }}</div>
            <div class="text-xs text-gray-400 mt-0.5">{{ groupMembers.length }} thành viên</div>
          </div>
        </div>

        <!-- Members table -->
        <!-- ══════════════════════════════════════════════════════════════
             MỤC 398 (29/08/2026) — BỎ CỘT GHIM, BẢNG CHỈ HIỆN TỪ 768px

             Cột ghim `fixed` chiếm chỗ CỐ ĐỊNH và không co theo màn hình.
             Trên màn 390px, mấy cột ghim cộng lại đã hết chỗ, nên vùng
             cuộn còn lại bằng 0 và vuốt ngang không có tác dụng — người
             dùng vuốt mà màn hình không nhúc nhích.

             Đã bỏ 0 cột ghim ở bảng này.
             ══════════════════════════════════════════════════════════ -->
        <el-table v-if="hienBang" :data="groupMembers" style="width: 100%" max-height="400" stripe>
          <el-table-column label="#" width="52" type="index" />
          <el-table-column prop="full_name" label="Họ tên" min-width="108">
            <template #default="scope">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-800 dark:text-gray-100">{{ scope.row.full_name || '—' }}</span>
                <el-tag v-if="scope.row.is_bot" type="info" size="small" effect="light" round>Bot</el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="user_name" label="Username" min-width="122">
            <template #default="scope">
              <span class="text-blue-500">{{ scope.row.user_name ? `@${scope.row.user_name}` : '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="role" label="Vai trò" width="79" align="center">
            <template #default="scope">
              <el-tag
                :type="scope.row.role === 'main' ? 'success' : scope.row.role === 'member' ? 'primary' : 'info'"
                effect="light"
                round
                size="small"
              >
                {{ scope.row.role }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="member_status" label="Trạng thái" width="86" align="center">
            <template #default="scope">
              <el-tag
                :type="scope.row.member_status === 'member' || scope.row.member_status === 'administrator' || scope.row.member_status === 'creator' ? 'success' : 'danger'"
                effect="light"
                round
                size="small"
              >
                {{ scope.row.member_status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="slot_name" label="Slot" min-width="86">
            <template #default="scope">
              <span class="text-gray-500 dark:text-gray-400 text-xs">{{ scope.row.slot_name || '—' }}</span>
            </template>
          </el-table-column>
        </el-table>

<!-- ══════════════════════════════════════════════════════════════
             MỤC 398 (29/08/2026) — THẺ DỌC CHO MÀN HẸP

             🔴 SINH RA TỪ CHÍNH ĐỊNH NGHĨA CỘT CỦA BẢNG Ở TRÊN.
             Mỗi ô dưới đây là NGUYÊN VĂN phần hiển thị của cột tương
             ứng, chỉ đổi chỗ đặt. Nên thẻ và bảng không thể lệch nhau về
             màu, định dạng số hay nhãn trạng thái — chúng là cùng một
             đoạn mã.

             ⚠️ Sửa cách hiển thị một cột thì phải sửa CẢ HAI chỗ. Sửa mỗi
             bảng là điện thoại và máy tính hiện hai kiểu khác nhau cho
             cùng một con số.
             ══════════════════════════════════════════════════════════ -->
        <div v-if="hienThe" class="flex-1 min-h-0 overflow-y-auto p-3">
          <div v-if="groupMembers.length > 0" class="grid grid-cols-1 gap-4">
            <div
              v-for="(row, i) in (groupMembers as any[])"
              :key="row.id || row.contract_id || i"
              class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm"
            >
              <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
                <div class="min-w-0 break-words">
                  —
                </div>
              </div>
              <div class="space-y-2 text-sm text-left">
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Họ tên:</span>
                  <span class="text-right break-words min-w-0">
                    <div class="flex items-center gap-2">
                                    <span class="font-medium text-gray-800 dark:text-gray-100">{{ row.full_name || '—' }}</span>
                                    <el-tag v-if="row.is_bot" type="info" size="small" effect="light" round>Bot</el-tag>
                                  </div>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Username:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="text-blue-500">{{ row.user_name ? `@${row.user_name}` : '—' }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Vai trò:</span>
                  <span class="text-right break-words min-w-0">
                    <el-tag
                                    :type="row.role === 'main' ? 'success' : row.role === 'member' ? 'primary' : 'info'"
                                    effect="light"
                                    round
                                    size="small"
                                  >
                                    {{ row.role }}
                                  </el-tag>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Trạng thái:</span>
                  <span class="text-right break-words min-w-0">
                    <el-tag
                                    :type="row.member_status === 'member' || row.member_status === 'administrator' || row.member_status === 'creator' ? 'success' : 'danger'"
                                    effect="light"
                                    round
                                    size="small"
                                  >
                                    {{ row.member_status }}
                                  </el-tag>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Slot:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="text-gray-500 dark:text-gray-400 text-xs">{{ row.slot_name || '—' }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <p class="text-base font-medium">Không có dòng nào khớp bộ lọc</p>
          </div>
        </div>

        <!-- Empty -->
        <div v-if="!memberDialogLoading && groupMembers.length === 0" class="flex flex-col items-center justify-center py-10 text-gray-400">
          <el-icon class="text-4xl mb-3"><User /></el-icon>
          <p>Không tìm thấy thành viên nào</p>
        </div>
      </div>
    </el-dialog>

    <!-- Create/Edit Project Dialog -->
    <el-dialog 
      v-model="projectDialogVisible" 
      :title="isProjectEdit ? 'CHỈNH SỬA TÊN DỰ ÁN' : 'TẠO DỰ ÁN MỚI'" 
      width="450px" 
      destroy-on-close 
      align-center
      class="custom-dark-dialog"
    >
      <el-form 
        :model="projectForm" 
        :rules="projectRules" 
        ref="projectFormRef" 
        label-position="top"
        class="mt-2"
        @submit.prevent="submitProjectForm"
      >
        <el-form-item label="Tên dự án" prop="project_name" required>
          <el-input v-model="projectForm.project_name" placeholder="Ví dụ: Dự án Tây Nguyên" autofocus />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="flex justify-end gap-3 pr-2">
          <el-button @click="projectDialogVisible = false">Hủy</el-button>
          <el-button 
            type="primary" 
            @click="submitProjectForm" 
            :loading="projectSubmitting"
            class="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 border-none font-semibold text-white"
          >
            Xác nhận
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { Connection, ChatLineRound, ArrowLeft, ArrowRight, User, MoreFilled, View, CopyDocument, Plus, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { tienNgaService } from '@/api/tienNgaService'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'

const { laManHep, hienBang, hienThe } = dungManHep()

interface Project {
  id: string
  project_name: string
}

interface TelegramGroup {
  chat_id: string
  group_name: string | null
  member_count: number
  custom_title: string | null
}

// State
const loading = ref(false)
const currentStep = ref(1)

// Step 1: Projects
const projects = ref<Project[]>([])

// Step 2: Main Groups
const selectedProject = ref<Project | null>(null)
const mainGroups = ref<TelegramGroup[]>([])

// Step 3: Member Groups
const selectedMainGroup = ref<TelegramGroup | null>(null)
const memberGroups = ref<TelegramGroup[]>([])

// Member detail dialog
const memberDialogVisible = ref(false)
const memberDialogLoading = ref(false)
const groupMembers = ref<any[]>([])
const detailGroupName = ref('')

// Project Dialog State
const projectDialogVisible = ref(false)
const isProjectEdit = ref(false)
const editingProjectId = ref<string | null>(null)
const projectSubmitting = ref(false)
const projectFormRef = ref()
const projectForm = reactive({
  project_name: ''
})

const projectRules = {
  project_name: [
    { required: true, message: 'Vui lòng nhập tên dự án', trigger: 'blur' },
    { min: 3, message: 'Tên dự án phải từ 3 ký tự trở lên', trigger: 'blur' }
  ]
}

// Color palettes
const projectColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6']
const mainGroupColors = ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6']
const memberGroupColors = ['#8b5cf6', '#a855f7', '#7c3aed', '#6366f1', '#4f46e5', '#818cf8', '#c084fc', '#a78bfa']

const getCardColor = (index: number) => projectColors[index % projectColors.length]
const getMainGroupColor = (index: number) => mainGroupColors[index % mainGroupColors.length]
const getMemberGroupColor = (index: number) => memberGroupColors[index % memberGroupColors.length]

// Fetch projects
const fetchProjects = async () => {
  loading.value = true
  try {
    const data = await tienNgaService.getProjects()
    projects.value = data
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error.message || 'Lỗi khi tải danh sách dự án')
  } finally {
    loading.value = false
  }
}

// Fetch main groups for a project
const fetchMainGroups = async (projectId: string) => {
  loading.value = true
  try {
    const data = await tienNgaService.getTelegramGroups({
      project_id: projectId,
      role: 'main'
    })
    mainGroups.value = data
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error.message || 'Lỗi khi tải danh sách nhóm Main')
  } finally {
    loading.value = false
  }
}

// Fetch member groups for a main group
const fetchMemberGroups = async (projectId: string, parentId: string) => {
  loading.value = true
  try {
    const data = await tienNgaService.getTelegramGroups({
      project_id: projectId,
      role: 'member',
      parent_id: parentId
    })
    memberGroups.value = data
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error.message || 'Lỗi khi tải danh sách nhóm Member')
  } finally {
    loading.value = false
  }
}

// Navigation
const selectProject = async (proj: Project) => {
  selectedProject.value = proj
  currentStep.value = 2
  await fetchMainGroups(proj.id)
}

const selectMainGroup = async (group: TelegramGroup) => {
  selectedMainGroup.value = group
  currentStep.value = 3
  if (selectedProject.value) {
    await fetchMemberGroups(selectedProject.value.id, group.chat_id)
  }
}

const goBack = () => {
  if (currentStep.value === 3) {
    currentStep.value = 2
    selectedMainGroup.value = null
    memberGroups.value = []
  } else if (currentStep.value === 2) {
    currentStep.value = 1
    selectedProject.value = null
    mainGroups.value = []
  }
}

const goToStep = (step: number) => {
  if (step >= currentStep.value) return
  if (step === 1) {
    currentStep.value = 1
    selectedProject.value = null
    selectedMainGroup.value = null
    mainGroups.value = []
    memberGroups.value = []
  } else if (step === 2) {
    currentStep.value = 2
    selectedMainGroup.value = null
    memberGroups.value = []
  }
}

// Group card command handler
const handleGroupCommand = async (cmd: string, group: TelegramGroup) => {
  if (cmd === 'detail') {
    detailGroupName.value = group.group_name || 'Nhóm không tên'
    memberDialogVisible.value = true
    memberDialogLoading.value = true
    groupMembers.value = []
    try {
      const data = await tienNgaService.getTelegramProjectMembers({
        chat_id: group.chat_id
      })
      groupMembers.value = data
    } catch (error: any) {
      console.error(error)
      ElMessage.error(error.message || 'Lỗi khi tải danh sách thành viên')
    } finally {
      memberDialogLoading.value = false
    }
  } else if (cmd === 'copy-chat-id') {
    try {
      await navigator.clipboard.writeText(group.chat_id)
      ElMessage.success(`Đã copy Chat ID: ${group.chat_id}`)
    } catch {
      ElMessage.error('Không thể copy Chat ID')
    }
  }
}

// Project management handlers
const handleOpenCreateProjectDialog = () => {
  isProjectEdit.value = false
  editingProjectId.value = null
  projectForm.project_name = ''
  projectDialogVisible.value = true
}

const handleOpenEditProjectDialog = (proj: Project) => {
  isProjectEdit.value = true
  editingProjectId.value = proj.id
  projectForm.project_name = proj.project_name
  projectDialogVisible.value = true
}

const handleProjectCommand = (cmd: string, proj: Project) => {
  if (cmd === 'edit') {
    handleOpenEditProjectDialog(proj)
  } else if (cmd === 'delete') {
    handleDeleteProject(proj)
  }
}

const submitProjectForm = async () => {
  if (!projectFormRef.value) return
  await projectFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      projectSubmitting.value = true
      try {
        if (isProjectEdit.value && editingProjectId.value) {
          const payload = [{
            id: editingProjectId.value,
            project_name: projectForm.project_name.trim()
          }]
          await tienNgaService.updateProjects(payload)
          ElMessage.success('Cập nhật tên dự án thành công!')
        } else {
          const payload = [{
            project_name: projectForm.project_name.trim()
          }]
          await tienNgaService.addProjects(payload)
          ElMessage.success('Tạo dự án mới thành công!')
        }
        projectDialogVisible.value = false
        await fetchProjects()
      } catch (error: any) {
        ElMessage.error(error.message || 'Không thể thực hiện yêu cầu')
      } finally {
        projectSubmitting.value = false
      }
    }
  })
}

const handleDeleteProject = (proj: Project) => {
  ElMessageBox.confirm(
    `Bạn có chắc chắn muốn xóa dự án "${proj.project_name}" không?`,
    'Xác nhận xóa dự án',
    {
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy bỏ',
      type: 'warning'
    }
  ).then(async () => {
    loading.value = true
    try {
      await tienNgaService.deleteProjects([proj.id])
      ElMessage.success('Đã xóa dự án thành công!')
      await fetchProjects()
    } catch (error: any) {
      ElMessage.error(error.message || 'Không thể xóa dự án.')
    } finally {
      loading.value = false
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchProjects()
})
</script>

<style scoped>
.telegram-groups-list :deep(.el-loading-mask) {
  border-radius: 16px;
}
</style>
