<template>
  <div class="hr-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex justify-between items-center mb-4 shrink-0">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Giới tính:</span>
          <el-select
            v-model="filters.gender"
            placeholder="Tất cả"
            style="width: 140px"
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Tất cả" value="all" />
            <el-option label="Nam" value="Nam" />
            <el-option label="Nữ" value="Nữ" />
          </el-select>
        </div>
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
          <el-input
            v-model="filters.search"
            placeholder="Mã NV, họ tên, SĐT..."
            :prefix-icon="Search"
            clearable
            class="w-64 custom-dark-input"
          />
        </div>
      </div>
      <el-button type="primary" @click="openAddDialog">Thêm nhân viên</el-button>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <el-table v-loading="loading" :data="paginatedData" style="width: 100%" class="flex-1" height="100%" @sort-change="handleSortChange">
        <el-table-column type="selection" width="55" fixed />
        <!-- STT Column -->
        <el-table-column label="STT" width="60" align="center" fixed>
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="Mã NV" width="120" sortable="custom" fixed />
        <el-table-column prop="lastName" label="Họ" width="140" fixed />
        <el-table-column prop="firstName" label="Tên" width="120" fixed />
        <el-table-column prop="username" label="Username" width="150">
          <template #default="scope"><span class="text-blue-500">{{ scope.row.username }}</span></template>
        </el-table-column>
        <el-table-column prop="authorization" label="Ủy quyền" width="140" />
        <el-table-column prop="telegramGroup" label="Nhóm Telegram" width="220" show-overflow-tooltip />
        <el-table-column prop="gender" label="Giới tính" width="110" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.gender === 'Nam' ? 'primary' : 'danger'" effect="light" size="small" round>{{ scope.row.gender }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Ngày sinh" width="130">
          <template #default="scope"><span class="text-xs text-gray-600 dark:text-gray-400">{{ formatDate(scope.row.dob) }}</span></template>
        </el-table-column>
        <el-table-column prop="phone" label="SĐT" width="140" />
        <el-table-column prop="email" label="Email" width="240" show-overflow-tooltip />
        <el-table-column prop="address" label="Địa chỉ" width="320" show-overflow-tooltip />
        <el-table-column prop="idNumber" label="CCCD/CMND" width="160" />
        <el-table-column prop="idPlace" label="Nơi cấp" width="160" />
        <el-table-column prop="nationality" label="Quốc tịch" width="125" />
        <el-table-column prop="maritalStatus" label="Tình trạng hôn nhân" width="170" />
        <el-table-column prop="education" label="Trình độ học vấn" width="165" />
        <el-table-column prop="major" label="Chuyên ngành" width="160" />
        <el-table-column prop="certificate" label="Chứng chỉ" width="160" />
        <el-table-column prop="experience" label="Kinh nghiệm" width="140" />
        <el-table-column prop="department" label="Phòng ban" width="180" />
        <el-table-column prop="position" label="Chức vụ" width="180" />
        <el-table-column prop="contractType" label="Loại hợp đồng" width="150" />
        <el-table-column prop="photoUrl" label="Ảnh nhân viên" width="160" show-overflow-tooltip />
        <el-table-column label="Giờ vào ca" width="120" align="center">
          <template #default="scope">{{ scope.row.shiftStartStr || '07:00' }}</template>
        </el-table-column>
        <el-table-column label="Giờ tan ca" width="120" align="center">
          <template #default="scope">{{ scope.row.shiftEndStr || '16:00' }}</template>
        </el-table-column>
        <el-table-column label="Vào ca T7" width="120" align="center">
          <template #default="scope">{{ scope.row.satShiftStartStr || '07:00' }}</template>
        </el-table-column>
        <el-table-column label="Tan ca T7" width="120" align="center">
          <template #default="scope">{{ scope.row.satShiftEndStr || '11:30' }}</template>
        </el-table-column>
        <el-table-column label="Số giờ làm/ngày" width="150" align="center">
          <template #default="scope"><span class="font-medium">{{ scope.row.workHoursPerDay }}h</span></template>
        </el-table-column>
        <el-table-column label="Lương cơ bản" width="170" align="right">
          <template #default="scope"><span class="font-medium">{{ formatCurrency(scope.row.baseSalary) }}</span></template>
        </el-table-column>
        <el-table-column label="Lương tháng" width="170" align="right">
          <template #default="scope"><span class="font-bold text-green-500">{{ formatCurrency(scope.row.monthlySalary) }}</span></template>
        </el-table-column>
        <el-table-column label="Lương tuần" width="160" align="right">
          <template #default="scope">{{ formatCurrency(scope.row.weeklySalary) }}</template>
        </el-table-column>
        <el-table-column label="Lương ngày" width="160" align="right">
          <template #default="scope">{{ formatCurrency(scope.row.dailySalary) }}</template>
        </el-table-column>
        <el-table-column label="Lương giờ" width="150" align="right">
          <template #default="scope">{{ formatCurrency(scope.row.hourlySalary) }}</template>
        </el-table-column>
        <el-table-column label="Lương làm thêm giờ" width="185" align="right">
          <template #default="scope"><span class="text-orange-500 font-medium">{{ formatCurrency(scope.row.overtimeSalary) }}</span></template>
        </el-table-column>
        <el-table-column label="Tiền thưởng" width="160" align="right">
          <template #default="scope">{{ formatCurrency(scope.row.bonus) }}</template>
        </el-table-column>
        <el-table-column label="Tiền ăn trưa" width="160" align="right">
          <template #default="scope">{{ formatCurrency(scope.row.lunchAllowance) }}</template>
        </el-table-column>
        <el-table-column label="Năng suất" width="150" align="right">
          <template #default="scope">{{ formatCurrency(scope.row.productivity) }}</template>
        </el-table-column>
        <el-table-column label="Phụ cấp khác" width="160" align="right">
          <template #default="scope">{{ formatCurrency(scope.row.otherAllowance) }}</template>
        </el-table-column>
        <el-table-column prop="benefit" label="Phúc lợi" width="160" show-overflow-tooltip />
        <el-table-column label="Số ngày phép năm" width="165" align="center">
          <template #default="scope"><span class="font-medium">{{ scope.row.annualLeaveDays }}</span></template>
        </el-table-column>
        <el-table-column prop="insurance" label="Bảo hiểm" width="175" show-overflow-tooltip />
        <el-table-column label="Bảo hiểm XH" width="160" align="right">
          <template #default="scope">{{ formatCurrency(scope.row.socialInsurance) }}</template>
        </el-table-column>
        <el-table-column prop="careerGoal" label="Mục tiêu nghề nghiệp" width="230" show-overflow-tooltip />
        <el-table-column prop="performanceReview" label="Đánh giá hiệu suất" width="180" />
        <el-table-column prop="bankName" label="Ngân hàng" width="170" />
        <el-table-column prop="bankAccount" label="Số tài khoản" width="180" />
        <el-table-column prop="paymentCode" label="Mã thanh toán" width="150" />
        <el-table-column prop="emergencyPhone" label="SĐT khẩn cấp" width="160" />
        <el-table-column prop="emergencyContact" label="Người liên hệ khẩn cấp" width="220" show-overflow-tooltip />
        <el-table-column label="Auto chấm công" width="150" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.autoAttendance ? 'success' : 'info'" effect="light" size="small" round>
              {{ scope.row.autoAttendance ? 'Có' : 'Không' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="workType" label="Loại công" width="110" align="center" />

        <!-- Thao tác -->
        <el-table-column fixed="right" label="Thao tác" width="90" align="center">
          <template #default="scope">
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, scope.row)">
              <el-button link type="info" class="p-1">
                <el-icon class="text-xl"><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="detail">Chi tiết</el-dropdown-item>
                  <el-dropdown-item command="edit">Chỉnh sửa</el-dropdown-item>
                  <el-dropdown-item command="delete" divided class="!text-red-500">Xóa</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- Phân trang -->
      <div class="mt-auto shrink-0 p-4 flex justify-end border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredData.length"
        />
      </div>
    </div>

    <!-- THÊM/SỬA NHÂN VIÊN DIALOG -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? 'CHỈNH SỬA THÔNG TIN NHÂN VIÊN' : 'THÊM NHÂN VIÊN'" 
      width="900px" 
      destroy-on-close 
      align-center 
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="form" label-width="170px" class="mt-2 compact-form">
          <!-- THÔNG TIN CƠ BẢN -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin cơ bản
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã NV">
                  <el-input v-model="form.code" placeholder="Mã NV..." :disabled="isEdit" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Họ">
                  <el-input v-model="form.lastName" placeholder="Họ..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tên">
                  <el-input v-model="form.firstName" placeholder="Tên..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Username">
                  <el-input v-model="form.username" placeholder="Username..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Ủy quyền">
                  <el-input v-model="form.authorization" placeholder="Ủy quyền..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Nhóm Telegram">
                  <el-input v-model="form.telegramGroup" placeholder="Nhóm TG..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Giới tính">
                  <el-select v-model="form.gender" placeholder="Chọn" style="width: 100%" class="highlight-select">
                    <el-option label="Nam" value="Nam" />
                    <el-option label="Nữ" value="Nữ" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngày sinh">
                  <el-date-picker v-model="form.dob" type="date" placeholder="Chọn" format="DD/MM/YYYY" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="SĐT">
                  <el-input v-model="form.phone" placeholder="SĐT..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Email">
                  <el-input v-model="form.email" placeholder="Email..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Địa chỉ">
                  <el-input v-model="form.address" placeholder="Địa chỉ..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="CCCD/CMND">
                  <el-input v-model="form.idNumber" placeholder="Số CCCD..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Nơi cấp">
                  <el-input v-model="form.idPlace" placeholder="Nơi cấp..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Quốc tịch">
                  <el-input v-model="form.nationality" placeholder="Việt Nam" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tình trạng hôn nhân">
                  <el-select v-model="form.maritalStatus" placeholder="Chọn" style="width: 100%" class="highlight-select">
                    <el-option label="Độc thân" value="Độc thân" />
                    <el-option label="Đã kết hôn" value="Đã kết hôn" />
                    <el-option label="Ly hôn" value="Ly hôn" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ảnh nhân viên">
                  <el-input v-model="form.photoUrl" placeholder="URL ảnh..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- HỌC VẤN & KINH NGHIỆM -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Học vấn & Kinh nghiệm
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Trình độ học vấn">
                  <el-select v-model="form.education" placeholder="Chọn" style="width: 100%" class="highlight-select">
                    <el-option label="Trung học" value="Trung học" />
                    <el-option label="Cao đẳng" value="Cao đẳng" />
                    <el-option label="Đại học" value="Đại học" />
                    <el-option label="Thạc sĩ" value="Thạc sĩ" />
                    <el-option label="Tiến sĩ" value="Tiến sĩ" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Chuyên ngành">
                  <el-input v-model="form.major" placeholder="Chuyên ngành..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Chứng chỉ">
                  <el-input v-model="form.certificate" placeholder="Chứng chỉ..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Kinh nghiệm">
                  <el-input v-model="form.experience" placeholder="Kinh nghiệm..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mục tiêu nghề nghiệp">
                  <el-input v-model="form.careerGoal" type="textarea" :rows="2" placeholder="Mục tiêu..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Đánh giá hiệu suất">
                  <el-input v-model="form.performanceReview" placeholder="Đánh giá..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- CÔNG VIỆC -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              Công việc
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Phòng ban">
                  <el-select v-model="form.department" placeholder="Chọn" style="width: 100%" class="highlight-select">
                    <el-option label="Ban Giám Đốc" value="Ban Giám Đốc" />
                    <el-option label="Phòng Kế Toán" value="Phòng Kế Toán" />
                    <el-option label="Phòng Nhân Sự" value="Phòng Nhân Sự" />
                    <el-option label="Phòng Kinh Doanh" value="Phòng Kinh Doanh" />
                    <el-option label="Phòng Kỹ Thuật" value="Phòng Kỹ Thuật" />
                    <el-option label="Xưởng Sản Xuất" value="Xưởng Sản Xuất" />
                    <el-option label="Đội Vận Tải" value="Đội Vận Tải" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Chức vụ">
                  <el-input v-model="form.position" placeholder="Chức vụ..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Loại hợp đồng">
                  <el-select v-model="form.contractType" placeholder="Chọn" style="width: 100%" class="highlight-select">
                    <el-option label="Chính thức" value="Chính thức" />
                    <el-option label="Thử việc" value="Thử việc" />
                    <el-option label="Thời vụ" value="Thời vụ" />
                    <el-option label="Cộng tác viên" value="Cộng tác viên" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- CA LÀM VIỆC -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-amber-500 rounded-full"></span>
              Ca làm việc
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Giờ vào ca">
                  <el-time-picker v-model="form.shiftStart" placeholder="hh:mm" format="HH:mm" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Giờ tan ca">
                  <el-time-picker v-model="form.shiftEnd" placeholder="hh:mm" format="HH:mm" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Vào ca T7">
                  <el-time-picker v-model="form.satShiftStart" placeholder="hh:mm" format="HH:mm" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tan ca T7">
                  <el-time-picker v-model="form.satShiftEnd" placeholder="hh:mm" format="HH:mm" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Số giờ/ngày">
                  <el-input-number v-model="form.workHoursPerDay" :min="1" :max="24" :precision="2" controls-position="right" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Auto chấm công">
                  <el-select v-model="form.autoAttendance" style="width: 100%" class="highlight-select">
                    <el-option label="Có" :value="true" />
                    <el-option label="Không" :value="false" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Loại công">
                  <el-select v-model="form.workType" style="width: 100%" class="highlight-select">
                    <el-option label="1" :value="1" />
                    <el-option label="2" :value="2" />
                    <el-option label="3" :value="3" />
                    <el-option label="4" :value="4" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- LƯƠNG & PHỤ CẤP -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-rose-500 rounded-full"></span>
              Lương & Phụ cấp
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Lương cơ bản (VNĐ)">
                  <el-input 
                    v-model="form.baseSalary" 
                    placeholder="Nhập lương cơ bản..."
                    :formatter="(value) => !value ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                    :parser="(value) => value.replace(/\./g, '')"
                  >
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Lương tháng (VNĐ)">
                  <el-input 
                    v-model="form.monthlySalary" 
                    placeholder="Nhập lương tháng..."
                    :formatter="(value) => !value ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                    :parser="(value) => value.replace(/\./g, '')"
                  >
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Lương tuần (VNĐ)">
                  <el-input 
                    v-model="form.weeklySalary" 
                    placeholder="Nhập lương tuần..."
                    :formatter="(value) => !value ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                    :parser="(value) => value.replace(/\./g, '')"
                  >
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Lương ngày (VNĐ)">
                  <el-input 
                    v-model="form.dailySalary" 
                    placeholder="Nhập lương ngày..."
                    :formatter="(value) => !value ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                    :parser="(value) => value.replace(/\./g, '')"
                  >
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Lương giờ (VNĐ)">
                  <el-input 
                    v-model="form.hourlySalary" 
                    placeholder="Nhập lương giờ..."
                    :formatter="(value) => !value ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                    :parser="(value) => value.replace(/\./g, '')"
                  >
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Lương OT (VNĐ)">
                  <el-input 
                    v-model="form.overtimeSalary" 
                    placeholder="Nhập lương ot..."
                    :formatter="(value) => !value ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                    :parser="(value) => value.replace(/\./g, '')"
                  >
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template></el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tiền thưởng (VNĐ)">
                  <el-input 
                    v-model="form.bonus" 
                    placeholder="Nhập tiền thưởng..."
                    :formatter="(value) => !value ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                    :parser="(value) => value.replace(/\./g, '')"
                  >
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tiền ăn trưa (VNĐ)">
                  <el-input 
                    v-model="form.lunchAllowance" 
                    placeholder="Nhập tiền ăn trưa..."
                    :formatter="(value) => !value ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                    :parser="(value) => value.replace(/\./g, '')"
                  >
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Năng suất (VNĐ)">
                  <el-input 
                    v-model="form.productivity" 
                    placeholder="Nhập năng suất..."
                    :formatter="(value) => !value ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                    :parser="(value) => value.replace(/\./g, '')"
                  >
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Phụ cấp khác (VNĐ)">
                  <el-input 
                    v-model="form.otherAllowance" 
                    placeholder="Nhập phụ cấp khác..."
                    :formatter="(value) => !value ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                    :parser="(value) => value.replace(/\./g, '')"
                  >
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Phúc lợi">
                  <el-input v-model="form.benefit" placeholder="Phúc lợi..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Số ngày phép năm">
                  <el-input-number v-model="form.annualLeaveDays" :min="0" :max="30" controls-position="right" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Bảo hiểm">
                  <el-input v-model="form.insurance" placeholder="Loại bảo hiểm..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Bảo hiểm XH (VNĐ)">
                  <el-input 
                    v-model="form.socialInsurance" 
                    placeholder="Nhập bảo hiểm xh..."
                    :formatter="(value) => !value ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                    :parser="(value) => value.replace(/\./g, '')"
                  >
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template></el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- NGÂN HÀNG & LIÊN HỆ -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-cyan-500 rounded-full"></span>
              Ngân hàng & Liên hệ khẩn cấp
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Ngân hàng">
                  <el-input v-model="form.bankName" placeholder="Ngân hàng..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Số tài khoản">
                  <el-input v-model="form.bankAccount" placeholder="STK..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã thanh toán">
                  <el-input v-model="form.paymentCode" placeholder="Mã TT..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="SĐT khẩn cấp">
                  <el-input v-model="form.emergencyPhone" placeholder="SĐT khẩn cấp..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Người liên hệ khẩn cấp">
                  <el-input v-model="form.emergencyContact" placeholder="Tên người liên hệ..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="submitForm">Xác nhận</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- CHI TIẾT NHÂN VIÊN DIALOG -->
    <el-dialog 
      v-model="detailDialogVisible" 
      title="CHI TIẾT THÔNG TIN NHÂN VIÊN" 
      width="850px" 
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedEmployee" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden">
        <!-- Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <el-avatar :size="64" :src="selectedEmployee.photoUrl || ''">
            <span class="text-xl font-bold text-gray-500 dark:text-gray-400">
              {{ selectedEmployee.firstName ? selectedEmployee.firstName.charAt(0).toUpperCase() : 'N' }}
            </span>
          </el-avatar>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Nhân viên</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ selectedEmployee.lastName }} {{ selectedEmployee.firstName }} 
              <span class="text-gray-400 dark:text-gray-500 font-medium">({{ selectedEmployee.code }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <span class="text-blue-500 dark:text-blue-400">@{{ selectedEmployee.username || 'chưa có username' }}</span>
              <span class="text-gray-400 dark:text-gray-500">|</span>
              <span class="text-gray-600 dark:text-gray-400 font-semibold">{{ selectedEmployee.position || 'Chưa rõ chức vụ' }}</span>
              <span class="text-gray-400 dark:text-gray-500">|</span>
              <span class="text-gray-600 dark:text-gray-400 font-semibold">{{ selectedEmployee.department || 'Chưa rõ phòng ban' }}</span>
            </div>
          </div>
        </div>

        <!-- 1. THÔNG TIN CÁ NHÂN -->
        <div>
          <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            Thông tin cá nhân
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Giới tính</div>
              <el-tag :type="selectedEmployee.gender === 'Nam' ? 'primary' : 'danger'" effect="light" size="small" round>
                {{ selectedEmployee.gender }}
              </el-tag>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày sinh</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ selectedEmployee.dob ? formatDate(selectedEmployee.dob) : '—' }}
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">SĐT</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedEmployee.phone || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Email</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300 break-all">{{ selectedEmployee.email || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">CCCD / CMND</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedEmployee.idNumber || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Nơi cấp</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedEmployee.idPlace || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Quốc tịch</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedEmployee.nationality || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Hôn nhân</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedEmployee.maritalStatus || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Quyền hạn</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedEmployee.authorization || '—' }}</div>
            </div>
          </div>
          <div class="mt-4">
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Địa chỉ</div>
            <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedEmployee.address || '—' }}</div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 2. HỌC VẤN & KINH NGHIỆM -->
        <div>
          <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
            Học vấn & Kinh nghiệm
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Học vấn</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedEmployee.education || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Chuyên ngành</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedEmployee.major || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Chứng chỉ</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedEmployee.certificate || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Kinh nghiệm</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedEmployee.experience || '—' }}</div>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mục tiêu nghề nghiệp</div>
              <div class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ selectedEmployee.careerGoal || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Đánh giá hiệu suất</div>
              <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedEmployee.performanceReview || '—' }}</div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 3. CÔNG VIỆC & CA LÀM -->
        <div>
          <h4 class="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
            Công việc & Ca làm
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Hợp đồng</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedEmployee.contractType || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Auto chấm công</div>
              <el-tag :type="selectedEmployee.autoAttendance ? 'success' : 'info'" effect="light" size="small" round>
                {{ selectedEmployee.autoAttendance ? 'Có' : 'Không' }}
              </el-tag>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số giờ/ngày</div>
              <div class="text-sm font-bold text-gray-700 dark:text-gray-300">{{ selectedEmployee.workHoursPerDay }} giờ</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Loại công</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedEmployee.workType }}</div>
            </div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Giờ vào ca</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedEmployee.shiftStartStr || '07:00' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Giờ tan ca</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedEmployee.shiftEndStr || '16:00' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Vào ca T7</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedEmployee.satShiftStartStr || '07:00' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tan ca T7</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedEmployee.satShiftEndStr || '11:30' }}</div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 4. LƯƠNG & PHÚC LỢI -->
        <div>
          <h4 class="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-rose-500 rounded-full"></span>
            Lương & Phúc lợi
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Lương cơ bản</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-100">
                {{ formatCurrency(selectedEmployee.baseSalary) }} VNĐ
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Lương tháng</div>
              <div class="text-sm font-bold text-green-500 dark:text-green-400">
                {{ formatCurrency(selectedEmployee.monthlySalary) }} VNĐ
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Lương tuần</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ formatCurrency(selectedEmployee.weeklySalary) }} VNĐ
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Lương ngày</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ formatCurrency(selectedEmployee.dailySalary) }} VNĐ
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Lương giờ</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ formatCurrency(selectedEmployee.hourlySalary) }} VNĐ
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Lương OT</div>
              <div class="text-sm font-bold text-orange-500 dark:text-orange-400">
                {{ formatCurrency(selectedEmployee.overtimeSalary) }} VNĐ
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tiền thưởng</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ formatCurrency(selectedEmployee.bonus) }} VNĐ
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tiền ăn trưa</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ formatCurrency(selectedEmployee.lunchAllowance) }} VNĐ
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Năng suất</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ formatCurrency(selectedEmployee.productivity) }} VNĐ
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Phụ cấp khác</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ formatCurrency(selectedEmployee.otherAllowance) }} VNĐ
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Bảo hiểm XH</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ formatCurrency(selectedEmployee.socialInsurance) }} VNĐ
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Bảo hiểm</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedEmployee.insurance || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số ngày phép năm</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedEmployee.annualLeaveDays }} ngày</div>
            </div>
          </div>
          <div class="mt-4">
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Phúc lợi</div>
            <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedEmployee.benefit || '—' }}</div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 5. NGÂN HÀNG & LIÊN HỆ KHẨN CẤP -->
        <div>
          <h4 class="text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-cyan-500 rounded-full"></span>
            Ngân hàng & Liên hệ khẩn cấp
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngân hàng</div>
              <div class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ selectedEmployee.bankName || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số tài khoản</div>
              <div class="text-sm font-bold text-gray-700 dark:text-gray-300">{{ selectedEmployee.bankAccount || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã thanh toán</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedEmployee.paymentCode || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Liên hệ khẩn cấp</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedEmployee.emergencyContact || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">SĐT khẩn cấp</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedEmployee.emergencyPhone || '—' }}</div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end pr-2">
          <el-button type="primary" @click="detailDialogVisible = false">Đóng</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { MoreFilled, Search } from '@element-plus/icons-vue'
import { ElNotification, ElMessageBox } from 'element-plus'
import { employeeService } from '@/api/employeeService'

// Filters
const filters = reactive({ gender: 'all', search: '' })
const currentPage = ref(1)
const pageSize = ref(10)

watch(() => filters, () => { currentPage.value = 1 }, { deep: true })

// Dialog
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const selectedEmployee = ref<any>(null)
const isEdit = ref(false)

const showEmployeeDetail = (row: any) => {
  selectedEmployee.value = row
  detailDialogVisible.value = true
}

const handleCommand = (command: string, row: any) => {
  if (command === 'detail') {
    showEmployeeDetail(row)
  } else if (command === 'edit') {
    openEditDialog(row)
  } else if (command === 'delete') {
    handleDelete(row)
  }
}

const handleDelete = (row: any) => {
  const name = `${row.lastName} ${row.firstName}`.trim() || row.code
  ElMessageBox.confirm(
    `Bạn có chắc chắn muốn xóa nhân viên "${name}" (${row.code}) không?`,
    'Xác nhận xóa',
    {
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy bỏ',
      type: 'warning'
    }
  ).then(async () => {
    loading.value = true
    try {
      await employeeService.deleteEmployees([row.id])
      ElNotification({ title: 'Thành công', message: 'Đã xóa nhân viên thành công!', type: 'success' })
      fetchEmployees()
    } catch (error: any) {
      ElNotification({
        title: 'Lỗi',
        message: error.message || 'Không thể xóa nhân viên.',
        type: 'error'
      })
    } finally {
      loading.value = false
    }
  }).catch(() => {})
}

const openAddDialog = () => {
  isEdit.value = false
  Object.assign(form, defaultForm())
  dialogVisible.value = true
}

const openEditDialog = (row: any) => {
  isEdit.value = true
  form.code = row.code
  form.lastName = row.lastName
  form.firstName = row.firstName
  form.username = row.username
  form.authorization = row.authorization
  form.telegramGroup = row.telegramGroup
  form.gender = row.gender
  form.dob = row.dob
  form.phone = row.phone
  form.email = row.email
  form.address = row.address
  form.idNumber = row.idNumber
  form.idPlace = row.idPlace
  form.nationality = row.nationality
  form.maritalStatus = row.maritalStatus
  form.education = row.education
  form.major = row.major
  form.certificate = row.certificate
  form.experience = row.experience
  form.department = row.department
  form.position = row.position
  form.contractType = row.contractType
  form.photoUrl = row.photoUrl
  form.shiftStart = row.shiftStart
  form.shiftEnd = row.shiftEnd
  form.satShiftStart = row.satShiftStart
  form.satShiftEnd = row.satShiftEnd
  form.workHoursPerDay = row.workHoursPerDay
  form.baseSalary = row.baseSalary
  form.monthlySalary = row.monthlySalary
  form.weeklySalary = row.weeklySalary
  form.dailySalary = row.dailySalary
  form.hourlySalary = row.hourlySalary
  form.overtimeSalary = row.overtimeSalary
  form.bonus = row.bonus
  form.lunchAllowance = row.lunchAllowance
  form.productivity = row.productivity
  form.otherAllowance = row.otherAllowance
  form.benefit = row.benefit
  form.annualLeaveDays = row.annualLeaveDays
  form.insurance = row.insurance
  form.socialInsurance = row.socialInsurance
  form.bankName = row.bankName
  form.bankAccount = row.bankAccount
  form.paymentCode = row.paymentCode
  form.emergencyPhone = row.emergencyPhone
  form.emergencyContact = row.emergencyContact
  form.autoAttendance = row.autoAttendance
  form.workType = row.workType
  form.careerGoal = row.careerGoal
  form.performanceReview = row.performanceReview
  dialogVisible.value = true
}

const defaultForm = () => ({
  code: '', lastName: '', firstName: '', username: '', authorization: '', telegramGroup: '',
  gender: 'Nam', dob: '', phone: '', email: '', address: '', idNumber: '', idPlace: '',
  nationality: 'Việt Nam', maritalStatus: 'Độc thân', education: 'Đại học', major: '',
  certificate: '', experience: '', department: '', position: '', contractType: 'Chính thức',
  photoUrl: '',
  shiftStart: null as any, shiftEnd: null as any, satShiftStart: null as any, satShiftEnd: null as any,
  workHoursPerDay: 8,
  baseSalary: 0, monthlySalary: 0, weeklySalary: 0, dailySalary: 0,
  hourlySalary: 0, overtimeSalary: 0, bonus: 0, lunchAllowance: 0,
  productivity: 0, otherAllowance: 0, benefit: '', annualLeaveDays: 12,
  insurance: '', socialInsurance: 0,
  bankName: '', bankAccount: '', paymentCode: '',
  emergencyPhone: '', emergencyContact: '',
  autoAttendance: true, workType: 3,
  careerGoal: '', performanceReview: ''
})

const form = reactive(defaultForm())

const submitForm = async () => {
  if (!form.code) {
    ElNotification({ title: 'Cảnh báo', message: 'Vui lòng nhập Mã NV', type: 'warning' })
    return
  }

  // Auto-prefix with 'TN' if not present
  let employeeId = form.code.trim();
  if (!employeeId.toUpperCase().startsWith('TN')) {
    employeeId = 'TN' + employeeId;
  }

  const payload = {
    id: employeeId,
    username: form.username || null,
    authority: form.authorization || null,
    telegram_group: form.telegramGroup || null,
    last_name: form.lastName || null,
    first_name: form.firstName || null,
    gender: form.gender || null,
    birthday: form.dob || null,
    number_phone: form.phone || null,
    email: form.email || null,
    address: form.address || null,
    identity_card: form.idNumber || null,
    place_of_issue: form.idPlace || null,
    nationality: form.nationality || 'Việt Nam',
    marital_status: form.maritalStatus || 'Độc thân',
    status: 'Active',
    experience: form.experience || null,
    company_id: null,
    employee_photo: form.photoUrl || null,
    bank_name: form.bankName || null,
    bank_account_number: form.bankAccount || null,
    code_payment: form.paymentCode || null,
    emergency_phone: form.emergencyPhone || null,
    emergency_contact: form.emergencyContact || null,
    education_level: form.education || null,
    major: form.major || null,
    certificates: form.certificate || null,
    position: form.position || null,
    department: form.department || null,
    working_hours: form.workHoursPerDay ?? 8,
    performance_evaluation: form.performanceReview || null,
    career_goal: form.careerGoal || null,
    contract_type: form.contractType || null,
    benefits: form.benefit || null,
    bonus: form.bonus ?? 0,
    base_salary: form.baseSalary ?? 0,
    insurance: form.insurance || null,
    monthly_salary: form.monthlySalary ?? 0,
    weekly_salary: form.weeklySalary ?? 0,
    daily_salary: form.dailySalary ?? 0,
    hourly_salary: form.hourlySalary ?? 0,
    overtime_salary: form.overtimeSalary ?? 0,
    rate_bhxh: form.socialInsurance ?? 0,
    lunch_allowance: form.lunchAllowance ?? 0,
    productivity_bonus: form.productivity ?? 0,
    other_allowance: form.otherAllowance ?? 0,
    leave_balance: form.annualLeaveDays ?? 12,
    auto_attendance: form.autoAttendance ?? true,
    work_type: form.workType ?? 3,
    total_debt: 0,
    start_time: form.shiftStart ? (form.shiftStart instanceof Date ? form.shiftStart.toISOString() : form.shiftStart) : null,
    end_time: form.shiftEnd ? (form.shiftEnd instanceof Date ? form.shiftEnd.toISOString() : form.shiftEnd) : null,
    sat_start_time: form.satShiftStart ? (form.satShiftStart instanceof Date ? form.satShiftStart.toISOString() : form.satShiftStart) : null,
    sat_end_time: form.satShiftEnd ? (form.satShiftEnd instanceof Date ? form.satShiftEnd.toISOString() : form.satShiftEnd) : null,
  }

  loading.value = true
  try {
    if (isEdit.value) {
      await employeeService.updateEmployee(payload)
      ElNotification({ title: 'Thành công', message: 'Đã cập nhật thông tin nhân viên thành công!', type: 'success' })
    } else {
      await employeeService.addEmployee(payload)
      ElNotification({ title: 'Thành công', message: 'Đã thêm nhân viên mới thành công!', type: 'success' })
    }
    dialogVisible.value = false
    fetchEmployees()
  } catch (error: any) {
    ElNotification({
      title: 'Lỗi',
      message: error.message || 'Không thể thêm nhân viên mới.',
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Helpers
const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN').format(v)
const formatDate = (d: string) => { if (!d) return ''; const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}` }

const allData = ref<any[]>([])
const loading = ref(false)

// Helper to format ISO datetime string to HH:MM
const formatTime = (isoString: string | null | undefined) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '';
  }
}

const mapApiToEmployee = (apiEmp: any) => {
  return {
    id: apiEmp.id,
    code: apiEmp.id,
    lastName: apiEmp.last_name || '',
    firstName: apiEmp.first_name || '',
    username: apiEmp.username || '',
    authorization: apiEmp.authority || '',
    telegramGroup: apiEmp.telegram_group || '',
    gender: apiEmp.gender || 'Nam',
    dob: apiEmp.birthday || '',
    phone: apiEmp.number_phone || '',
    email: apiEmp.email || '',
    address: apiEmp.address || '',
    idNumber: apiEmp.identity_card || '',
    idPlace: apiEmp.place_of_issue || '',
    nationality: apiEmp.nationality || 'Việt Nam',
    maritalStatus: apiEmp.marital_status || 'Độc thân',
    education: apiEmp.education_level || '',
    major: apiEmp.major || '',
    certificate: apiEmp.certificates || '',
    experience: apiEmp.experience || '',
    department: apiEmp.department || '',
    position: apiEmp.position || '',
    contractType: apiEmp.contract_type || 'Chính thức',
    photoUrl: apiEmp.employee_photo || '',
    shiftStart: apiEmp.start_time || null,
    shiftEnd: apiEmp.end_time || null,
    satShiftStart: apiEmp.sat_start_time || null,
    satShiftEnd: apiEmp.sat_end_time || null,
    shiftStartStr: formatTime(apiEmp.start_time) || '07:00',
    shiftEndStr: formatTime(apiEmp.end_time) || '16:00',
    satShiftStartStr: formatTime(apiEmp.sat_start_time) || '07:00',
    satShiftEndStr: formatTime(apiEmp.sat_end_time) || '11:30',
    workHoursPerDay: apiEmp.working_hours ?? 8,
    baseSalary: apiEmp.base_salary ?? 0,
    monthlySalary: apiEmp.monthly_salary ?? 0,
    weeklySalary: apiEmp.weekly_salary ?? 0,
    dailySalary: apiEmp.daily_salary ?? 0,
    hourlySalary: apiEmp.hourly_salary ?? 0,
    overtimeSalary: apiEmp.overtime_salary ?? 0,
    bonus: apiEmp.bonus ?? 0,
    lunchAllowance: apiEmp.lunch_allowance ?? 0,
    productivity: apiEmp.productivity_bonus ?? 0,
    otherAllowance: apiEmp.other_allowance ?? 0,
    benefit: apiEmp.benefits || '',
    annualLeaveDays: apiEmp.leave_balance ?? 12,
    insurance: apiEmp.insurance || '',
    socialInsurance: apiEmp.rate_bhxh ?? 0,
    bankName: apiEmp.bank_name || '',
    bankAccount: apiEmp.bank_account_number || '',
    paymentCode: apiEmp.code_payment || '',
    emergencyPhone: apiEmp.emergency_phone || '',
    emergencyContact: apiEmp.emergency_contact || '',
    autoAttendance: apiEmp.auto_attendance ?? true,
    workType: apiEmp.work_type ?? 3,
    careerGoal: apiEmp.career_goal || '',
    performanceReview: apiEmp.performance_evaluation || ''
  }
}

const fetchEmployees = async () => {
  loading.value = true
  try {
    const data = await employeeService.getEmployees('TN')
    allData.value = data.map(mapApiToEmployee)
  } catch (error: any) {
    ElNotification({
      title: 'Lỗi',
      message: error.message || 'Không thể lấy danh sách nhân viên.',
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchEmployees()
})

const filteredData = computed(() => {
  return allData.value.filter(e => {
    if (filters.gender !== 'all' && e.gender !== filters.gender) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const fullName = `${e.lastName} ${e.firstName}`.toLowerCase()
      if (!fullName.includes(q) && !e.code.toLowerCase().includes(q) && !e.phone.includes(q)) return false
    }
    return true
  })
})

const sortProp = ref('')
const sortOrder = ref('')

const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  sortProp.value = prop
  sortOrder.value = order
  currentPage.value = 1
}

const sortedData = computed(() => {
  const list = [...filteredData.value]
  if (!sortProp.value || !sortOrder.value) return list

  return list.sort((a: any, b: any) => {
    const valA = a[sortProp.value] ?? ''
    const valB = b[sortProp.value] ?? ''

    let res = 0
    if (typeof valA === 'number' && typeof valB === 'number') {
      res = valA - valB
    } else {
      res = String(valA).localeCompare(String(valB), 'vi', { numeric: true })
    }

    return sortOrder.value === 'ascending' ? res : -res
  })
})

const paginatedData = computed(() => {
  const s = (currentPage.value - 1) * pageSize.value
  return sortedData.value.slice(s, s + pageSize.value)
})
</script>

<style scoped>
.hr-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

.hr-container :deep(.el-table td.el-table__cell .cell) {
  white-space: nowrap !important;
}

html.dark .hr-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}
html.dark .hr-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}
html.dark .hr-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}
html.dark .hr-container :deep(.el-table .el-table-fixed-column--left),
html.dark .hr-container :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
}

html.dark .custom-dark-select :deep(.el-input__wrapper),
html.dark .custom-dark-input :deep(.el-input__wrapper) {
  background-color: #1f2937;
  box-shadow: 0 0 0 1px #374151 inset;
}
html.dark .custom-dark-select :deep(.el-input__inner),
html.dark .custom-dark-input :deep(.el-input__inner) {
  color: #f3f4f6;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}
</style>
