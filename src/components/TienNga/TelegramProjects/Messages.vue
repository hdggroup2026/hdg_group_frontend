<template>
  <div @click="closeContextMenu" class="h-full flex overflow-hidden bg-gray-50 dark:bg-gray-900 rounded-lg shadow-inner">
    <!-- LEFT SIDEBAR: Chat List & Groups -->
    <div class="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col shrink-0">
      <!-- Header / New Chat Button -->
      <div class="p-4 border-b border-gray-150 dark:border-gray-700 space-y-3 shrink-0">
        <button 
          @click="selectNewChat" 
          class="w-full py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-gray-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 active:scale-98 shadow-sm"
        >
          <el-icon :size="16"><Plus /></el-icon>
          <span>Cuộc trò chuyện mới</span>
        </button>

        <!-- Group Search Input -->
        <el-input
          v-model="groupSearch"
          placeholder="Tìm nhóm Telegram..."
          :prefix-icon="Search"
          clearable
          @input="handleSearchInput"
          class="custom-search-input"
        />
      </div>

      <!-- Scrollable Group List Grouped by Project -->
      <div class="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 custom-scrollbar">
        <div v-if="loadingGroups" class="flex flex-col items-center justify-center py-10 space-y-2">
          <el-icon class="animate-spin text-blue-500 text-2xl"><Loading /></el-icon>
          <span class="text-xs text-gray-400">Đang tải danh sách nhóm...</span>
        </div>
        
        <div v-else-if="filteredProjectsTree.length === 0" class="text-center py-10 text-xs text-gray-400">
          Không tìm thấy nhóm hoặc dự án nào
        </div>

        <template v-else>
          <!-- Loop through projects -->
          <div 
            v-for="project in filteredProjectsTree" 
            :key="project.id"
            class="space-y-1.5"
          >
            <!-- Project Accordion Header -->
            <div 
              @click="toggleProject(project.id)"
              class="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 hover:bg-gray-100/70 dark:hover:bg-gray-800/80 cursor-pointer select-none transition-all duration-200 border border-gray-100 dark:border-gray-700/60 shadow-sm"
            >
              <div class="flex items-center gap-2 min-w-0">
                <el-icon class="text-blue-500 shrink-0"><Connection /></el-icon>
                <span class="text-xs font-extrabold text-gray-750 dark:text-gray-200 truncate uppercase tracking-wider">
                  {{ project.project_name }}
                </span>
              </div>
              <el-icon 
                class="text-gray-400 dark:text-gray-500 transition-transform duration-250 shrink-0" 
                :class="{ 'rotate-90': expandedProjects.includes(project.id) }"
                :size="12"
              >
                <ArrowRight />
              </el-icon>
            </div>

            <!-- Project Content (Main & Member groups) -->
            <div 
              v-show="expandedProjects.includes(project.id)" 
              class="pl-2.5 mt-1 space-y-3.5 border-l border-dashed border-gray-200 dark:border-gray-700/80 ml-3.5"
            >
              <!-- 1. MAIN GROUPS SECTION -->
              <div>
                <div 
                  @click="toggleMainSection(project.id)"
                  class="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-gray-550 dark:text-gray-455 uppercase tracking-widest select-none w-full cursor-pointer hover:text-blue-500 transition-colors"
                >
                  <el-checkbox
                    v-if="project.mainGroups.length > 0"
                    :model-value="isAllMainSelected(project)"
                    :indeterminate="isMainIndeterminate(project)"
                    @change="(val) => toggleSelectAllMain(val, project)"
                    @click.stop
                    class="mr-1 scale-90"
                    style="height: auto; margin-right: 4px;"
                  />
                  <el-icon :size="10" class="text-blue-500"><ChatLineRound /></el-icon>
                  <span>Nhóm Main</span>
                  <span class="ml-1 font-mono text-[9px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.25 rounded-full shrink-0">
                    {{ project.mainGroups.length }}
                  </span>
                  
                  <el-icon 
                    class="ml-auto text-gray-400 transition-transform duration-200"
                    :class="{ 'rotate-90': expandedMainSections.includes(project.id) }"
                    :size="10"
                  >
                    <ArrowRight />
                  </el-icon>
                </div>

                <div v-show="expandedMainSections.includes(project.id)" class="space-y-1 mt-1">
                  <div v-if="project.mainGroups.length === 0" class="text-[10px] text-gray-400 italic pl-3 py-1 select-none">
                    Không có nhóm main
                  </div>

                  <div class="space-y-1" v-else>
                    <div 
                      v-for="grp in project.mainGroups" 
                      :key="grp.chat_id"
                      @click="handleGroupItemClick(grp)"
                      class="group p-2.5 rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-2.5 relative select-none border border-transparent"
                      :class="[
                        isGroupSelected(grp)
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold border-blue-100 dark:border-blue-900/40 shadow-sm'
                          : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/30 text-gray-700 dark:text-gray-300'
                      ]"
                    >
                      <el-checkbox
                        :model-value="isGroupSelected(grp)"
                        @change="(val) => handleCheckboxChange(val, grp)"
                        @click.stop
                        class="mr-1"
                        style="height: auto; margin-right: 4px;"
                      />
                      <!-- Small Avatar / Initials -->
                      <div class="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold shrink-0 text-xs shadow-sm group-hover:scale-105 transition-transform duration-200">
                        {{ (grp.group_name || grp.title).substring(0, 2).toUpperCase() }}
                      </div>
                      <!-- Details -->
                      <div class="flex-1 min-w-0 text-left">
                        <div class="flex items-center justify-between gap-1">
                          <div class="text-xs font-semibold truncate leading-tight flex-1">{{ grp.group_name || grp.title }}</div>
                          <span v-if="grp.last_activity" class="text-[9px] text-gray-400 font-mono shrink-0">{{ formatShortTime(grp.last_activity) }}</span>
                        </div>
                        <div v-if="grp.custom_title" class="mt-0.5">
                          <span class="text-[9px] px-1 py-0.25 rounded font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            {{ grp.custom_title }}
                          </span>
                        </div>
                        <p class="text-[9px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                          {{ grp.last_message ? (grp.last_message.text_content || `[${grp.last_message.message_type}]`) : `ID: ${grp.chat_id}` }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 2. MEMBER GROUPS SECTION -->
              <div>
                <div 
                  @click="toggleMemberSection(project.id)"
                  class="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-gray-550 dark:text-gray-455 uppercase tracking-widest select-none w-full cursor-pointer hover:text-purple-500 transition-colors"
                >
                  <el-checkbox
                    v-if="project.memberGroups.length > 0"
                    :model-value="isAllMemberSelected(project)"
                    :indeterminate="isMemberIndeterminate(project)"
                    @change="(val) => toggleSelectAllMember(val, project)"
                    @click.stop
                    class="mr-1 scale-90"
                    style="height: auto; margin-right: 4px;"
                  />
                  <el-icon :size="10" class="text-purple-500"><User /></el-icon>
                  <span>Nhóm Member</span>
                  <span class="ml-1 font-mono text-[9px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.25 rounded-full shrink-0">
                    {{ project.memberGroups.length }}
                  </span>
                  
                  <el-icon 
                    class="ml-auto text-gray-400 transition-transform duration-200"
                    :class="{ 'rotate-90': expandedMemberSections.includes(project.id) }"
                    :size="10"
                  >
                    <ArrowRight />
                  </el-icon>
                </div>

                <div v-show="expandedMemberSections.includes(project.id)" class="space-y-1 mt-1">
                  <div v-if="project.memberGroups.length === 0" class="text-[10px] text-gray-400 italic pl-3 py-1 select-none">
                    Không có nhóm member
                  </div>

                  <div class="space-y-1" v-else>
                    <div 
                      v-for="grp in project.memberGroups" 
                      :key="grp.chat_id"
                      @click="handleGroupItemClick(grp)"
                      class="group p-2.5 rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-2.5 relative select-none border border-transparent"
                      :class="[
                        isGroupSelected(grp)
                          ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-semibold border-purple-100 dark:border-purple-900/40 shadow-sm'
                          : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/30 text-gray-700 dark:text-gray-300'
                      ]"
                    >
                      <el-checkbox
                        :model-value="isGroupSelected(grp)"
                        @change="(val) => handleCheckboxChange(val, grp)"
                        @click.stop
                        class="mr-1"
                        style="height: auto; margin-right: 4px;"
                      />
                      <!-- Small Avatar / Initials -->
                      <div class="w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 font-bold shrink-0 text-xs shadow-sm group-hover:scale-105 transition-transform duration-200">
                        {{ (grp.group_name || grp.title).substring(0, 2).toUpperCase() }}
                      </div>
                      <!-- Details -->
                      <div class="flex-1 min-w-0 text-left">
                        <div class="flex items-center justify-between gap-1">
                          <div class="text-xs font-semibold truncate leading-tight flex-1">{{ grp.group_name || grp.title }}</div>
                          <span v-if="grp.last_activity" class="text-[9px] text-gray-400 font-mono shrink-0">{{ formatShortTime(grp.last_activity) }}</span>
                        </div>
                        <div v-if="grp.custom_title" class="mt-0.5">
                          <span class="text-[9px] px-1 py-0.25 rounded font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-655 dark:text-purple-400">
                            {{ grp.custom_title }}
                          </span>
                        </div>
                        <p class="text-[9px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                          {{ grp.last_message ? (grp.last_message.text_content || `[${grp.last_message.message_type}]`) : `ID: ${grp.chat_id}` }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- User footer profile stub -->
      <div class="p-4 border-t border-gray-150 dark:border-gray-700 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
        <div class="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
          AD
        </div>
        <div class="flex-1 min-w-0 text-left">
          <div class="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">Administrator</div>
          <div class="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-time Connected
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT PANEL: Chat Area -->
    <div class="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950 relative">
      
      <!-- Top header (Only shown if activeGroup is selected) -->
      <div v-if="activeGroup" class="h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs">
            {{ (activeGroup.group_name || activeGroup.title).substring(0, 2).toUpperCase() }}
          </div>
          <div class="min-w-0 text-left">
            <div class="flex items-center gap-2">
              <h4 class="text-sm font-bold text-gray-800 dark:text-gray-100 truncate mt-0.5">{{ activeGroup.group_name || activeGroup.title }}</h4>
              <span v-if="activeGroup.custom_title" class="text-[9px] bg-blue-50 dark:bg-blue-900/30 text-blue-650 dark:text-blue-400 px-1.5 py-0.25 rounded font-medium mt-0.5">
                {{ activeGroup.custom_title }}
              </span>
            </div>
            <p class="text-[10px] text-gray-400 font-mono truncate">Chat ID: {{ activeGroup.chat_id }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Chat Message Search Field -->
          <div class="flex items-center">
            <transition name="el-fade-in-linear">
              <div v-if="showChatMessageSearch" class="flex items-center mr-2">
                <el-input 
                  v-model="messageSearchQuery"
                  ref="messageSearchInputRef"
                  placeholder="Tìm nội dung tin nhắn..."
                  size="default"
                  clearable
                  class="custom-search-input w-64 md:w-72 text-sm"
                  @input="handleMessageSearchInput"
                  @clear="handleMessageSearchClear"
                >
                  <template #prefix>
                    <el-icon :size="16" class="text-blue-500"><Search /></el-icon>
                  </template>
                </el-input>
              </div>
            </transition>

            <el-tooltip :content="showChatMessageSearch ? 'Đóng tìm kiếm' : 'Tìm kiếm nội dung tin nhắn'" placement="top">
              <el-button 
                size="default" 
                :type="showChatMessageSearch ? 'danger' : 'info'"
                :plain="!showChatMessageSearch"
                circle
                @click="toggleMessageSearch"
                class="font-semibold shadow-sm flex items-center justify-center cursor-pointer transition-all duration-200"
              >
                <el-icon :size="16">
                  <Close v-if="showChatMessageSearch" />
                  <Search v-else />
                </el-icon>
              </el-button>
            </el-tooltip>
          </div>

          <el-button 
            size="default" 
            type="primary" 
            :icon="InfoFilled"
            @click="showGroupMembers"
            class="font-semibold shadow-sm"
          >
            Thông tin nhóm
          </el-button>
        </div>
      </div>

      <!-- Top header for bulk broadcast -->
      <div v-else-if="selectedGroups.length > 1" class="h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-xs shadow-sm">
            BS
          </div>
          <div class="min-w-0 text-left">
            <h4 class="text-sm font-bold text-gray-800 dark:text-gray-100 truncate mt-0.5">Gửi tới {{ selectedGroups.length }} nhóm</h4>
            <p class="text-[10px] text-gray-400 font-medium truncate">Chế độ gửi tin nhắn hàng loạt</p>
          </div>
        </div>
      </div>

      <!-- Scrollable Message Feed -->
      <div 
        ref="feedContainer" 
        @scroll="handleFeedScroll"
        class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
        :class="selectedGroups.length > 0 ? 'bg-white dark:bg-gray-900/30' : 'flex items-center justify-center'"
      >
        <!-- 1. EMPTY STATE / WELCOME PAGE (No group selected) -->
        <div v-if="selectedGroups.length === 0" class="max-w-xl text-center space-y-8 select-none p-4">
          <!-- Pulse Animated Icon -->
          <div class="flex justify-center">
            <div class="relative flex items-center justify-center w-20 h-20 bg-blue-500 rounded-3xl text-white shadow-lg shadow-blue-500/20 transform rotate-12 transition-all hover:scale-105 duration-300">
              <span class="absolute w-20 h-20 bg-blue-500/30 rounded-3xl animate-ping -z-10"></span>
              <el-icon :size="40"><ChatDotSquare /></el-icon>
            </div>
          </div>

          <div class="space-y-2">
            <h2 class="text-2xl font-extrabold text-gray-800 dark:text-gray-100">Tiến Nga Telegram Assistant</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Giao diện gửi tin nhắn và quản lý hoạt động nhóm thông qua chatbot. Hãy chọn một hoặc nhiều nhóm ở thanh bên trái để bắt đầu.
            </p>
          </div>

          <!-- Suggested Action Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div 
              v-for="card in suggestCards" 
              :key="card.title"
              @click="applySuggestion(card.message)"
              class="p-4 rounded-2xl border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 group/card active:scale-98"
            >
              <div class="font-bold text-sm text-gray-800 dark:text-gray-100 flex items-center justify-between mb-1">
                <span>{{ card.title }}</span>
                <el-icon class="text-gray-300 group-hover/card:text-blue-500 transition-colors"><TopRight /></el-icon>
              </div>
              <p class="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 leading-relaxed">
                {{ card.desc }}
              </p>
            </div>
          </div>
        </div>

        <!-- 2. MESSAGES FEED (Exactly one group selected) -->
        <template v-else-if="selectedGroups.length === 1">
          <!-- Infinite Scroll Loading Spinner at top -->
          <div v-if="loadingOlderMessages" class="flex justify-center py-2">
            <el-icon class="animate-spin text-blue-500 text-lg"><Loading /></el-icon>
            <span class="text-xs text-gray-400 ml-2">Đang tải tin nhắn cũ...</span>
          </div>

          <!-- System Welcome Banner inside chat -->
          <div v-else-if="!hasMoreMessages && chatMessages.length > 0" class="flex justify-center my-4">
            <div class="px-4 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-400 font-semibold tracking-wider uppercase select-none">
              Đã hiển thị toàn bộ lịch sử tin nhắn
            </div>
          </div>

          <div v-if="loadingMessages && chatMessages.length === 0" class="flex flex-col items-center justify-center py-16 space-y-2">
            <el-icon class="animate-spin text-blue-500 text-3xl"><Loading /></el-icon>
            <span class="text-xs text-gray-400 font-medium">Đang tải lịch sử tin nhắn...</span>
          </div>

          <div v-else-if="chatMessages.length === 0" class="text-center py-16 text-sm text-gray-400 italic">
            Chưa có tin nhắn nào trong nhóm này
          </div>

          <!-- Chat history rendering -->
          <template v-else>
            <div 
              v-for="msg in chatMessages" 
              :key="msg.id || msg.message_id"
              class="flex items-start gap-4 max-w-3xl mx-auto"
              :class="isMessageMine(msg) ? 'flex-row-reverse' : ''"
            >
              <!-- Avatar -->
              <div 
                class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm font-bold text-xs select-none"
                :class="isMessageMine(msg) ? 'bg-blue-600 text-white' : (msg.is_bot ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white')"
              >
                {{ isMessageMine(msg) ? 'AD' : (msg.is_bot ? 'BOT' : (msg.full_name || msg.username || 'TG').substring(0, 2).toUpperCase()) }}
              </div>

              <!-- Message Bubble -->
              <div class="space-y-1 max-w-[80%] text-left">
                <div class="text-[10px] text-gray-400 font-semibold select-none flex items-center gap-2" :class="isMessageMine(msg) ? 'justify-end' : ''">
                  <span>{{ msg.full_name || msg.username || (msg.is_bot ? 'Bot Telegram' : 'Người dùng') }}</span>
                  <span>•</span>
                  <span>{{ formatLogTime(msg.date) }}</span>
                  <span v-if="msg.is_edited" class="text-[9px] italic text-gray-400">(đã sửa)</span>
                </div>
                
                <div 
                  @contextmenu.prevent="openContextMenu($event, msg)"
                  class="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap select-text font-sans cursor-text"
                  :class="[
                    isMessageMine(msg)
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-500/10'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-850 dark:text-gray-150 rounded-tl-none shadow-sm'
                  ]"
                >
                  <!-- Media / Attachments Rendering -->
                  <div v-if="msg.attachments && msg.attachments.length > 0" class="space-y-2.5 mb-2">
                    <div v-for="att in msg.attachments" :key="att.id">
                      <!-- Image preview -->
                      <div v-if="att.file_type === 'photo' || (att.mime_type && att.mime_type.startsWith('image/'))" class="rounded-xl overflow-hidden max-w-xs border border-gray-200 dark:border-gray-700 shadow-sm">
                        <el-image 
                          :src="getMediaUrl(att.download_url || att.id)" 
                          :preview-src-list="[getMediaUrl(att.download_url || att.id)]"
                          preview-teleported
                          fit="cover"
                          class="w-full max-h-60 rounded-xl cursor-pointer"
                          loading="lazy"
                        />
                      </div>
                      <!-- File / Document download card -->
                      <div v-else class="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 flex items-center justify-between gap-3 max-w-xs shadow-sm">
                        <div class="flex items-center gap-2 min-w-0">
                          <div class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs select-none shrink-0">
                            {{ getFileExtension(att.file_name) }}
                          </div>
                          <div class="min-w-0 text-left">
                            <p class="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{{ att.file_name || 'File đính kèm' }}</p>
                            <p class="text-[10px] text-gray-400 font-mono">{{ formatFileSize(att.file_size || 0) }}</p>
                          </div>
                        </div>
                        <a 
                          :href="getMediaUrl(att.download_url || att.id)" 
                          target="_blank" 
                          download 
                          class="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors shrink-0 flex items-center justify-center"
                          title="Tải tệp"
                        >
                          <el-icon :size="16"><Download /></el-icon>
                        </a>
                      </div>
                    </div>
                  </div>

                  <!-- Text content -->
                  <div v-if="msg.text_content" v-html="formatMessageText(msg.text_content)"></div>
                </div>
              </div>
            </div>
          </template>
        </template>

        <!-- 3. BULK BROADCAST PANEL (Multiple groups selected) -->
        <template v-else>
          <div class="max-w-3xl mx-auto space-y-6 text-left">
            <div class="p-6 rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/10 flex items-start gap-4">
              <div class="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <el-icon :size="24"><ChatDotSquare /></el-icon>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-base font-extrabold text-gray-850 dark:text-gray-150">Chế độ gửi hàng loạt</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Bạn đang chọn <strong>{{ selectedGroups.length }}</strong> nhóm để gửi tin nhắn đồng thời. Nội dung tin nhắn và tài liệu đính kèm sẽ được gửi tuần tự đến từng nhóm.
                </p>
                <div class="mt-3 flex items-center gap-2">
                  <el-button 
                    size="small" 
                    type="danger" 
                    plain 
                    class="font-semibold"
                    @click="selectedGroups = []"
                  >
                    Bỏ chọn tất cả
                  </el-button>
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <h4 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Danh sách nhóm nhận tin ({{ selectedGroups.length }})</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div 
                  v-for="grp in selectedGroups" 
                  :key="grp.chat_id"
                  class="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between gap-3"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div 
                      class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]"
                      :class="grp.role === 'main' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-650 dark:text-purple-400'"
                    >
                      {{ (grp.group_name || grp.title).substring(0, 2).toUpperCase() }}
                    </div>
                    <div class="min-w-0 text-left">
                      <div class="text-xs font-bold text-gray-800 dark:text-gray-200 truncate leading-tight">{{ grp.group_name || grp.title }}</div>
                      <div class="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span class="text-[8px] font-mono text-gray-400 dark:text-gray-500">ID: {{ grp.chat_id }}</span>
                        <span class="text-[8px] font-semibold px-1 rounded" :class="grp.role === 'main' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-650 dark:text-purple-400'">
                          {{ grp.role === 'main' ? 'Main' : 'Member' }}
                        </span>
                        <span v-if="grp.custom_title" class="text-[8px] font-semibold px-1 rounded" :class="grp.role === 'main' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-650 dark:text-purple-400'">
                          {{ grp.custom_title }}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="shrink-0 flex items-center">
                    <template v-if="broadcastStatus[grp.chat_id]">
                      <el-icon v-if="broadcastStatus[grp.chat_id]?.status === 'sending'" class="animate-spin text-blue-500" :size="16"><Loading /></el-icon>
                      <el-icon v-else-if="broadcastStatus[grp.chat_id]?.status === 'success'" class="text-green-500" :size="16"><CircleCheck /></el-icon>
                      <el-tooltip 
                        v-else-if="broadcastStatus[grp.chat_id]?.status === 'failed'"
                        class="item"
                        effect="dark"
                        :content="broadcastStatus[grp.chat_id]?.error || 'Lỗi không xác định'"
                        placement="top"
                      >
                        <el-icon class="text-red-500 cursor-pointer" :size="16"><CircleClose /></el-icon>
                      </el-tooltip>
                      <span v-else class="text-[10px] text-gray-400 font-medium">Chờ...</span>
                    </template>
                    <button 
                      v-else
                      @click="handleCheckboxChange(false, grp)" 
                      class="w-6 h-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-650 transition-colors"
                    >
                      <el-icon :size="12"><Close /></el-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

      </div>

      <!-- Bottom Chat Input Bar -->
      <div class="p-4 bg-white dark:bg-gray-800 border-t border-gray-150 dark:border-gray-700 shrink-0 z-10 shadow-lg">
        <div class="max-w-3xl mx-auto space-y-3">
          
          <!-- Selected File Preview Card -->
          <div v-if="selectedFile" class="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 animate-fade-in">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs select-none">
                {{ getFileExtension(selectedFile.name) }}
              </div>
              <div class="min-w-0 text-left">
                <p class="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{{ selectedFile.name }}</p>
                <p class="text-[10px] text-gray-400 font-mono">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
            </div>
            <button @click="removeSelectedFile" class="w-6 h-6 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
              <el-icon><Close /></el-icon>
            </button>
          </div>

          <!-- Input Row -->
          <div 
            class="relative flex items-end border rounded-2xl p-2 pr-3 focus-within:border-blue-500 dark:focus-within:border-blue-500 transition-all duration-200 shadow-inner"
            :class="[
              isDragging 
                ? 'border-blue-500 dark:border-blue-500 bg-blue-50/10' 
                : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
            ]"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
          >
            <!-- Hidden Input File -->
            <input 
              type="file" 
              ref="fileInputRef" 
              style="display: none" 
              @change="handleFileChange" 
            />

            <!-- Attachment Button (+) -->
            <button 
              @click="triggerFileSelect"
              class="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-all duration-200 shadow-sm shrink-0 active:scale-95 cursor-pointer mr-1"
              title="Đính kèm tệp tin"
            >
              <el-icon :size="18"><Plus /></el-icon>
            </button>

            <textarea
              v-model="typedMessage"
              ref="chatInputRef"
              rows="1"
              placeholder="Nhập tin nhắn..."
              class="flex-1 bg-transparent border-0 outline-none resize-none px-3 py-2 text-sm text-gray-800 dark:text-gray-100 max-h-40 min-h-[36px] custom-scrollbar focus:ring-0"
              @keydown.enter.exact.prevent="sendMessage"
              @input="adjustTextareaHeight"
            ></textarea>

            <button 
              @click="sendMessage"
              :disabled="(!typedMessage.trim() && !selectedFile) || sendingMessage"
              class="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:bg-gray-200 dark:disabled:bg-gray-800 text-white disabled:text-gray-400 transition-all duration-200 shadow-md shrink-0 active:scale-95 cursor-pointer ml-2"
            >
              <el-icon v-if="sendingMessage" class="animate-spin"><Loading /></el-icon>
              <el-icon v-else :size="16"><Promotion /></el-icon>
            </button>
          </div>

        </div>
        <p class="text-[10px] text-gray-400 text-center mt-2 select-none">
          Bot Telegram sẽ gửi tài liệu hoặc tin nhắn trực tiếp đến nhóm dưới tên của quản trị viên.
        </p>
      </div>

    </div>

    <!-- Group Info & Media Drawer -->
    <el-drawer
      v-model="memberDrawerVisible"
      title="THÔNG TIN NHÓM"
      direction="rtl"
      size="480px"
      destroy-on-close
      class="custom-member-drawer"
    >
      <div class="h-full flex flex-col overflow-hidden bg-gray-50/50 dark:bg-gray-900/30" @wheel="handleTabHeaderWheel">
        <el-tabs 
          v-model="groupInfoActiveTab" 
          class="group-info-tabs h-full flex flex-col"
        >
          
          <!-- TAB 1: THÀNH VIÊN -->
          <el-tab-pane label="Thành viên" name="members">
            <template #label>
              <span class="flex items-center gap-1.5 font-bold text-sm">
                <span>Thành viên</span>
                <span class="px-1.5 py-0.25 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold">
                  {{ groupMembers.length }}
                </span>
              </span>
            </template>
            
            <div v-loading="loadingMembers" class="h-full flex flex-col p-3 space-y-3">
              <div v-if="groupMembers.length === 0" class="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2">
                <el-icon :size="40" class="text-gray-300 dark:text-gray-600"><UserFilled /></el-icon>
                <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Không tìm thấy thành viên nào</p>
              </div>
              <div v-else class="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                <div 
                  v-for="mbr in groupMembers" 
                  :key="mbr.user_id || mbr.id"
                  @contextmenu.prevent="openMemberContextMenu($event, mbr)"
                  class="group/member flex items-center gap-3 p-3 rounded-2xl border border-gray-150 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:border-blue-400/80 dark:hover:border-blue-500/80 hover:shadow-md hover:shadow-blue-500/10 -translate-y-0 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer select-none"
                  title="Nhấn chuột phải để hiển thị tùy chọn"
                >
                  <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-bold flex items-center justify-center text-xs shadow-sm group-hover/member:scale-110 group-hover/member:shadow-md transition-all duration-200 shrink-0">
                    {{ (mbr.name || mbr.username || 'M').substring(0, 1).toUpperCase() }}
                  </div>
                  
                  <div class="flex-1 min-w-0 text-left">
                    <div class="text-sm font-bold text-gray-800 dark:text-gray-100 group-hover/member:text-blue-600 dark:group-hover/member:text-blue-400 transition-colors truncate">
                      {{ mbr.name || '—' }}
                    </div>
                    <div class="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                      @{{ mbr.username || 'N/A' }}
                    </div>
                  </div>

                  <el-tag size="small" :type="getMemberRoleType(mbr.status)" effect="plain" class="font-bold scale-90 border-0 shadow-2xs group-hover/member:scale-95 transition-transform">
                    {{ translateRole(mbr.status) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- TAB 2: MEDIA (Hình ảnh & Video) -->
          <el-tab-pane label="Media" name="media">
            <template #label>
              <span class="flex items-center gap-1.5 font-bold text-sm">
                <span>Media</span>
                <span v-if="groupMediaList.length > 0" class="px-1.5 py-0.25 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-bold">
                  {{ groupMediaList.length }}
                </span>
              </span>
            </template>
            <div class="h-full p-3 overflow-y-auto custom-scrollbar">
              <div v-if="groupMediaList.length === 0" class="flex flex-col items-center justify-center py-16 text-center space-y-2">
                <el-icon :size="36" class="text-gray-300 dark:text-gray-600"><Picture /></el-icon>
                <p class="text-xs text-gray-400">Chưa có hình ảnh hoặc video nào trong nhóm</p>
              </div>
              <div v-else class="grid grid-cols-3 gap-2">
                <div v-for="(item, idx) in groupMediaList" :key="item.id || idx" class="relative group rounded-xl overflow-hidden aspect-square border border-gray-100 dark:border-gray-800 shadow-xs bg-gray-100 dark:bg-gray-800">
                  <!-- Video Attachment Rendering -->
                  <div v-if="isVideoAttachment(item)" class="w-full h-full relative bg-black flex items-center justify-center">
                    <video 
                      :src="getMediaUrl(item.download_url || item.id)"
                      class="w-full h-full object-cover"
                      controls
                      preload="metadata"
                    />
                  </div>
                  <!-- Image Attachment Rendering with Teleported Preview -->
                  <el-image 
                    v-else
                    :src="getMediaUrl(item.download_url || item.id)" 
                    :preview-src-list="groupMediaPreviewList"
                    :initial-index="getImagePreviewIndex(item)"
                    preview-teleported
                    fit="cover" 
                    class="w-full h-full cursor-pointer hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- TAB 3: FILE (Tệp tài liệu) -->
          <el-tab-pane label="File" name="files">
            <template #label>
              <span class="flex items-center gap-1.5 font-bold text-sm">
                <span>File</span>
                <span v-if="groupFileList.length > 0" class="px-1.5 py-0.25 text-xs rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 font-bold">
                  {{ groupFileList.length }}
                </span>
              </span>
            </template>
            <div class="h-full p-3 overflow-y-auto space-y-2 custom-scrollbar">
              <div v-if="groupFileList.length === 0" class="flex flex-col items-center justify-center py-16 text-center space-y-2">
                <el-icon :size="36" class="text-gray-300 dark:text-gray-600"><Document /></el-icon>
                <p class="text-xs text-gray-400">Chưa có tệp tài liệu nào (Excel, Word, PDF, JSON...)</p>
              </div>
              <div v-else v-for="file in groupFileList" :key="file.id" class="p-3 rounded-xl border border-gray-150 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 flex items-center justify-between gap-3 shadow-2xs hover:border-blue-300 transition-all">
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 font-bold flex items-center justify-center text-xs shrink-0 select-none">
                    {{ getFileExtension(file.file_name) }}
                  </div>
                  <div class="min-w-0 text-left">
                    <p class="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{{ file.file_name || 'Tệp tài liệu' }}</p>
                    <p class="text-[10px] text-gray-400 font-mono mt-0.5">{{ formatFileSize(file.file_size) }}</p>
                  </div>
                </div>
                <a 
                  :href="getMediaUrl(file.download_url || file.id)" 
                  target="_blank" 
                  download 
                  class="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors shrink-0 flex items-center justify-center"
                  title="Tải tệp"
                >
                  <el-icon :size="16"><Download /></el-icon>
                </a>
              </div>
            </div>
          </el-tab-pane>

          <!-- TAB 4: LINKS (Đường liên kết) -->
          <el-tab-pane label="Links" name="links">
            <template #label>
              <span class="flex items-center gap-1.5 font-bold text-sm">
                <span>Links</span>
                <span v-if="groupLinkList.length > 0" class="px-1.5 py-0.25 text-xs rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 font-bold">
                  {{ groupLinkList.length }}
                </span>
              </span>
            </template>
            <div class="h-full p-3 overflow-y-auto space-y-2 custom-scrollbar">
              <div v-if="groupLinkList.length === 0" class="flex flex-col items-center justify-center py-16 text-center space-y-2">
                <el-icon :size="36" class="text-gray-300 dark:text-gray-600"><LinkIcon /></el-icon>
                <p class="text-xs text-gray-400">Chưa có liên kết URL nào trong tin nhắn</p>
              </div>
              <div v-else v-for="(item, idx) in groupLinkList" :key="idx" class="p-3 rounded-xl border border-gray-150 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 space-y-1.5 shadow-2xs hover:border-blue-300 transition-all text-left">
                <div class="flex items-center justify-between text-[10px] text-gray-400 font-medium">
                  <span>Gửi bởi: <strong class="text-gray-700 dark:text-gray-300">{{ item.sender_name }}</strong></span>
                  <span>{{ formatLogTime(item.date) }}</span>
                </div>
                <a 
                  :href="item.url" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline break-all flex items-center gap-1"
                >
                  <el-icon :size="12" class="shrink-0"><TopRight /></el-icon>
                  <span class="truncate">{{ item.url }}</span>
                </a>
              </div>
            </div>
          </el-tab-pane>

          <!-- TAB 5: VOICE (Tin nhắn thoại) -->
          <el-tab-pane label="Voice" name="voice">
            <template #label>
              <span class="flex items-center gap-1.5 font-bold text-sm">
                <span>Voice</span>
                <span v-if="groupVoiceList.length > 0" class="px-1.5 py-0.25 text-xs rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold">
                  {{ groupVoiceList.length }}
                </span>
              </span>
            </template>
            <div class="h-full p-3 overflow-y-auto space-y-2 custom-scrollbar">
              <div v-if="groupVoiceList.length === 0" class="flex flex-col items-center justify-center py-16 text-center space-y-2">
                <el-icon :size="36" class="text-gray-300 dark:text-gray-600"><Microphone /></el-icon>
                <p class="text-xs text-gray-400">Chưa có tin nhắn thoại nào</p>
              </div>
              <div v-else v-for="v in groupVoiceList" :key="v.id" class="p-3 rounded-xl border border-gray-150 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 flex items-center justify-between gap-3 shadow-2xs">
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 font-bold flex items-center justify-center text-xs shrink-0">
                    <el-icon :size="18"><Microphone /></el-icon>
                  </div>
                  <div class="min-w-0 text-left">
                    <p class="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{{ v.file_name || 'Tin nhắn thoại' }}</p>
                    <p class="text-[10px] text-gray-400 font-mono mt-0.5">{{ formatFileSize(v.file_size) }}</p>
                  </div>
                </div>
                <a 
                  :href="getMediaUrl(v.download_url || v.id)" 
                  target="_blank" 
                  download 
                  class="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors shrink-0 flex items-center justify-center"
                  title="Tải Voice"
                >
                  <el-icon :size="16"><Download /></el-icon>
                </a>
              </div>
            </div>
          </el-tab-pane>

          <!-- TAB 6: MUSIC (Nhạc / Âm thanh) -->
          <el-tab-pane label="Music" name="music">
            <template #label>
              <span class="flex items-center gap-1.5 font-bold text-sm">
                <span>Music</span>
                <span v-if="groupMusicList.length > 0" class="px-1.5 py-0.25 text-xs rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-bold">
                  {{ groupMusicList.length }}
                </span>
              </span>
            </template>
            <div class="h-full p-3 overflow-y-auto space-y-2 custom-scrollbar">
              <div v-if="groupMusicList.length === 0" class="flex flex-col items-center justify-center py-16 text-center space-y-2">
                <el-icon :size="36" class="text-gray-300 dark:text-gray-600"><Headset /></el-icon>
                <p class="text-xs text-gray-400">Chưa có bản nhạc / âm thanh nào</p>
              </div>
              <div v-else v-for="m in groupMusicList" :key="m.id" class="p-3 rounded-xl border border-gray-150 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 flex items-center justify-between gap-3 shadow-2xs">
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 font-bold flex items-center justify-center text-xs shrink-0">
                    <el-icon :size="18"><Headset /></el-icon>
                  </div>
                  <div class="min-w-0 text-left">
                    <p class="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{{ m.file_name || 'Bản nhạc' }}</p>
                    <p class="text-[10px] text-gray-400 font-mono mt-0.5">{{ formatFileSize(m.file_size) }}</p>
                  </div>
                </div>
                <a 
                  :href="getMediaUrl(m.download_url || m.id)" 
                  target="_blank" 
                  download 
                  class="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition-colors shrink-0 flex items-center justify-center"
                  title="Tải Nhạc"
                >
                  <el-icon :size="16"><Download /></el-icon>
                </a>
              </div>
            </div>
          </el-tab-pane>

          <!-- TAB 7: GIF (Ảnh động) -->
          <el-tab-pane label="GIF" name="gif">
            <template #label>
              <span class="flex items-center gap-1.5 font-bold text-sm">
                <span>GIF</span>
                <span v-if="groupGifList.length > 0" class="px-1.5 py-0.25 text-xs rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 font-bold">
                  {{ groupGifList.length }}
                </span>
              </span>
            </template>
            <div class="h-full p-3 overflow-y-auto custom-scrollbar">
              <div v-if="groupGifList.length === 0" class="flex flex-col items-center justify-center py-16 text-center space-y-2">
                <el-icon :size="36" class="text-gray-300 dark:text-gray-600"><Film /></el-icon>
                <p class="text-xs text-gray-400">Chưa có ảnh GIF nào</p>
              </div>
              <div v-else class="grid grid-cols-3 gap-2">
                <div v-for="g in groupGifList" :key="g.id" class="relative group rounded-xl overflow-hidden aspect-square border border-gray-100 dark:border-gray-800 shadow-xs bg-gray-100 dark:bg-gray-800">
                  <el-image 
                    :src="getMediaUrl(g.download_url || g.id)" 
                    :preview-src-list="[getMediaUrl(g.download_url || g.id)]"
                    fit="cover" 
                    class="w-full h-full cursor-pointer hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </el-tab-pane>

        </el-tabs>
      </div>
    </el-drawer>

    <!-- Context Menu for Message Actions -->
    <div 
      v-if="contextMenuVisible" 
      ref="contextMenuRef"
      :style="{ top: `${contextMenuY}px`, left: `${contextMenuX}px` }"
      class="fixed z-50 min-w-[160px] bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-xl shadow-xl py-1.5 animate-fade-in select-none text-left"
      @click.stop
    >
      <button 
        @click="copyMessageText"
        class="w-full px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/80 flex items-center gap-2 transition-colors cursor-pointer"
      >
        <el-icon :size="14"><DocumentCopy /></el-icon>
        <span>Sao chép nội dung</span>
      </button>
      
      <div class="my-1 border-t border-gray-100 dark:border-gray-700"></div>

      <button 
        @click="deleteSelectedChatMessage"
        class="w-full px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 transition-colors cursor-pointer"
      >
        <el-icon :size="14"><Delete /></el-icon>
        <span>Xóa tin nhắn</span>
      </button>
    </div>

    <!-- Context Menu for Group Member Actions -->
    <div 
      v-if="memberContextMenuVisible" 
      ref="memberContextMenuRef"
      :style="{ top: `${memberContextMenuY}px`, left: `${memberContextMenuX}px` }"
      class="fixed z-[9999] min-w-[160px] bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-xl shadow-xl py-1.5 animate-fade-in select-none text-left"
      @click.stop
    >
      <button 
        @click="deleteMemberFromGroup"
        class="w-full px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 transition-colors cursor-pointer"
      >
        <el-icon :size="14"><Delete /></el-icon>
        <span>Xóa thành viên</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, Plus, Promotion, Loading, User, UserFilled, TopRight, Close, Connection, ChatLineRound, ArrowRight, CircleCheck, CircleClose, Download, Delete, DocumentCopy, InfoFilled, Picture, Document, Link as LinkIcon, Microphone, Headset, Film } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { telegramService } from '@/api/telegramService'
import { tienNgaService } from '@/api/tienNgaService'
import { getApiUrl } from '@/api/apiConfig'

const route = useRoute()
const router = useRouter()

interface TelegramGroup {
  chat_id: string;
  title: string;
  group_name?: string;
  custom_title?: string;
  username?: string;
  type?: string;
  role?: string;
  parent_id?: string;
  parentName?: string;
  project_id?: string;
  total_messages?: number;
  last_message?: any;
  last_activity?: string;
}

interface ChatAttachment {
  id: string;
  file_type: string;
  file_id?: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  download_url?: string;
}

interface ChatMessage {
  id: string;
  message_id: number;
  chat_id: string;
  group_name?: string;
  user_id?: string;
  username?: string;
  full_name?: string;
  is_bot: boolean;
  message_type: string;
  text_content?: string;
  reply_to_message_id?: number;
  has_media: boolean;
  is_edited?: boolean;
  edited_at?: string;
  attachments?: ChatAttachment[];
  date: string;
  created_at?: string;
}

interface GroupMember {
  id?: string;
  user_id: string;
  name: string;
  username: string;
  status: string;
  project_id?: string;
}

// State
const loadingGroups = ref(false)
const groupSearch = ref('')
const groups = ref<TelegramGroup[]>([])
const selectedGroups = ref<TelegramGroup[]>([])

const activeGroup = computed({
  get() {
    return selectedGroups.value.length === 1 ? selectedGroups.value[0] : null
  },
  set(val) {
    if (val) {
      selectedGroups.value = [val]
    } else {
      selectedGroups.value = []
    }
  }
})

interface BroadcastGroupStatus {
  status: 'pending' | 'sending' | 'success' | 'failed';
  error?: string;
}
const broadcastStatus = ref<Record<string, BroadcastGroupStatus>>({})

const typedMessage = ref('')
const sendingMessage = ref(false)

const isMessageMine = (msg: any) => {
  if (!msg) return false
  if (msg.is_mine !== undefined) return Boolean(msg.is_mine)
  if (msg.full_name && (msg.full_name.includes('Admin') || msg.full_name.includes('Web'))) {
    return true
  }
  return false
}

// Context Menu State
const contextMenuVisible = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const selectedContextMenuMsg = ref<ChatMessage | null>(null)
const contextMenuRef = ref<HTMLElement | null>(null)

// Member Context Menu State
const memberContextMenuVisible = ref(false)
const memberContextMenuX = ref(0)
const memberContextMenuY = ref(0)
const selectedMemberForContext = ref<GroupMember | null>(null)
const memberContextMenuRef = ref<HTMLElement | null>(null)

const openContextMenu = (event: MouseEvent, msg: ChatMessage) => {
  closeMemberContextMenu()
  const menuWidth = 175
  const menuHeight = 90
  let x = event.clientX
  let y = event.clientY

  if (x + menuWidth > window.innerWidth) {
    x = Math.max(10, event.clientX - menuWidth)
  }
  if (y + menuHeight > window.innerHeight) {
    y = Math.max(10, event.clientY - menuHeight)
  }

  contextMenuX.value = x
  contextMenuY.value = y
  selectedContextMenuMsg.value = msg
  contextMenuVisible.value = true
}

const closeContextMenu = () => {
  contextMenuVisible.value = false
  selectedContextMenuMsg.value = null
}

const openMemberContextMenu = (event: MouseEvent, mbr: GroupMember) => {
  closeContextMenu()
  const menuWidth = 175
  const menuHeight = 55
  let x = event.clientX
  let y = event.clientY

  if (x + menuWidth > window.innerWidth) {
    x = Math.max(10, event.clientX - menuWidth)
  }
  if (y + menuHeight > window.innerHeight) {
    y = Math.max(10, event.clientY - menuHeight)
  }

  memberContextMenuX.value = x
  memberContextMenuY.value = y
  selectedMemberForContext.value = mbr
  memberContextMenuVisible.value = true
}

const closeMemberContextMenu = () => {
  memberContextMenuVisible.value = false
  selectedMemberForContext.value = null
}

const closeAllContextMenus = () => {
  closeContextMenu()
  closeMemberContextMenu()
}

const copyMessageText = async () => {
  const targetMsg = selectedContextMenuMsg.value
  const selectedText = window.getSelection()?.toString().trim()
  closeContextMenu()

  if (selectedText) {
    try {
      await navigator.clipboard.writeText(selectedText)
      ElMessage.success('Đã sao chép đoạn văn bản đã chọn!')
      return
    } catch {
      // Fallback
    }
  }

  if (!targetMsg || !targetMsg.text_content) {
    ElMessage.warning('Không có nội dung văn bản để sao chép!')
    return
  }
  try {
    await navigator.clipboard.writeText(targetMsg.text_content)
    ElMessage.success('Đã sao chép toàn bộ nội dung tin nhắn!')
  } catch {
    ElMessage.error('Không thể sao chép nội dung!')
  }
}

const deleteSelectedChatMessage = async () => {
  const targetMsg = selectedContextMenuMsg.value
  closeContextMenu()
  if (!targetMsg) return

  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa tin nhắn này không? Tin nhắn cũng sẽ bị xóa khỏi nhóm Telegram nếu Bot có đủ quyền.',
      'XÁC NHẬN XÓA TIN NHẮN',
      {
        confirmButtonText: 'Xóa ngay',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning',
        confirmButtonClass: 'el-button--danger font-bold',
        center: true
      }
    )
  } catch {
    return // User canceled
  }

  try {
    const msgIdToDelete = targetMsg.id || String(targetMsg.message_id)
    await tienNgaService.deleteTelegramChatMessage(msgIdToDelete, targetMsg.chat_id)
    
    chatMessages.value = chatMessages.value.filter(
      m => String(m.id) !== String(targetMsg.id) && m.message_id !== targetMsg.message_id
    )
    ElMessage.success('Đã xóa tin nhắn thành công!')
  } catch (error: any) {
    console.error('Lỗi khi xóa tin nhắn:', error)
    ElMessage.error(error.message || 'Không thể xóa tin nhắn!')
  }
}

const deleteMemberFromGroup = async () => {
  const targetMember = selectedMemberForContext.value
  console.log('[deleteMemberFromGroup] Triggered. Target member:', targetMember)
  closeMemberContextMenu()
  if (!targetMember) {
    console.warn('[deleteMemberFromGroup] No targetMember found (selectedMemberForContext is null).')
    return
  }

  const memberName = targetMember.name || (targetMember.username ? `@${targetMember.username}` : targetMember.user_id)

  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa thành viên "${memberName}" khỏi nhóm Telegram không? Thao tác này sẽ dời thành viên khỏi nhóm thực tế.`,
      'XÁC NHẬN XÓA THÀNH VIÊN',
      {
        confirmButtonText: 'Xóa ngay',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning',
        confirmButtonClass: 'el-button--danger font-bold',
        cancelButtonClass: 'font-semibold',
        center: true
      }
    )
  } catch {
    console.log('[deleteMemberFromGroup] User cancelled confirmation dialog.')
    return // User canceled
  }

  let memberIdToDelete = targetMember.id
  if (!memberIdToDelete && activeGroup.value) {
    try {
      console.log('[deleteMemberFromGroup] Member ID missing, fetching DB members for chat_id:', activeGroup.value.chat_id)
      const dbMembers = await tienNgaService.getTelegramProjectMembers({
        chat_id: activeGroup.value.chat_id,
        username: targetMember.username !== 'Unknown' ? targetMember.username : undefined
      })
      const found = dbMembers.find((m: any) => 
        (targetMember.user_id && String(m.user_id) === String(targetMember.user_id)) ||
        (targetMember.username && m.user_name && m.user_name.toLowerCase() === targetMember.username.toLowerCase())
      )
      if (found) {
        memberIdToDelete = found.id
        console.log('[deleteMemberFromGroup] Found DB member ID:', memberIdToDelete)
      }
    } catch (e) {
      console.error('Lỗi tra cứu bản ghi CSDL thành viên:', e)
    }
  }

  if (!memberIdToDelete) {
    console.warn('[deleteMemberFromGroup] Could not find DB record UUID for member:', memberName)
    ElMessage.error(`Không tìm thấy bản ghi CSDL của thành viên "${memberName}" để thực hiện xóa!`)
    return
  }

  try {
    console.log('[deleteMemberFromGroup] Calling deleteUserTelegram with ID:', memberIdToDelete)
    const res = await tienNgaService.deleteUserTelegram([memberIdToDelete])
    console.log('[deleteMemberFromGroup] deleteUserTelegram API result:', res)
    
    ElNotification({
      title: 'THÀNH CÔNG',
      message: `Đã xóa thành viên "${memberName}" khỏi nhóm Telegram thành công!`,
      type: 'success',
      duration: 5000
    })
    await showGroupMembers()
  } catch (error: any) {
    console.error('Lỗi khi xóa thành viên:', error)
    const rawError = error.message || ''
    
    let title = 'KHÔNG THỂ XÓA THÀNH VIÊN'
    let detailMessage = rawError

    if (rawError.includes('USER_ADMIN_INVALID') || rawError.includes('admin privileges')) {
      detailMessage = `Bot Telegram không thể xóa/kick thành viên <strong>${memberName}</strong> vì thành viên này là Quản trị viên (Admin/Owner) trong nhóm.`
    } else if (rawError.includes('CHAT_ADMIN_REQUIRED')) {
      detailMessage = `Bot Telegram không có đủ quyền Quản trị viên (Admin) trong nhóm để dời thành viên <strong>${memberName}</strong>.`
    } else if (rawError.includes('UserNotParticipant')) {
      detailMessage = `Thành viên <strong>${memberName}</strong> hiện đã không còn ở trong nhóm Telegram.`
    }

    ElNotification({
      title: title,
      message: `
        <div style="font-size: 13px; line-height: 1.5;">
          <p style="margin: 0 0 6px 0; font-weight: 500;">${detailMessage}</p>
          <div style="font-size: 11px; color: #9ca3af; margin-top: 4px; word-break: break-all; font-family: monospace;">
            Log chi tiết: ${rawError}
          </div>
        </div>
      `,
      dangerouslyUseHTMLString: true,
      type: 'error',
      duration: 8000
    })
  }
}

// Projects tree state
const loadedProjects = ref<any[]>([])
const expandedProjects = ref<string[]>([])

// Message Search State
const showChatMessageSearch = ref(false)
const messageSearchQuery = ref('')
const messageSearchInputRef = ref<any>(null)
let messageSearchDebounceTimer: any = null

const toggleMessageSearch = () => {
  showChatMessageSearch.value = !showChatMessageSearch.value
  if (showChatMessageSearch.value) {
    nextTick(() => {
      messageSearchInputRef.value?.focus()
    })
  } else if (messageSearchQuery.value) {
    messageSearchQuery.value = ''
    if (activeGroup.value) {
      loadChatHistory(activeGroup.value.chat_id)
    }
  }
}

const handleMessageSearchInput = () => {
  if (messageSearchDebounceTimer) clearTimeout(messageSearchDebounceTimer)
  messageSearchDebounceTimer = setTimeout(() => {
    if (activeGroup.value) {
      loadChatHistory(activeGroup.value.chat_id)
    }
  }, 350)
}

const handleMessageSearchClear = () => {
  messageSearchQuery.value = ''
  if (activeGroup.value) {
    loadChatHistory(activeGroup.value.chat_id)
  }
}

// Chat messages state
const chatMessages = ref<ChatMessage[]>([])
const loadingMessages = ref(false)
const loadingOlderMessages = ref(false)
const hasMoreMessages = ref(true)

const feedContainer = ref<HTMLDivElement | null>(null)
const chatInputRef = ref<HTMLTextAreaElement | null>(null)

// Attachment State
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// WebSocket reference
let chatSocket: WebSocket | null = null
let wsReconnectTimer: any = null

const triggerFileSelect = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0] || null
  }
}

const removeSelectedFile = () => {
  selectedFile.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const isDragging = ref(false)

const handleDragOver = () => {
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0]
    if (file) {
      selectedFile.value = file
      ElMessage.success(`Đã đính kèm tệp: ${file.name}`)
    }
  }
}

const getFileExtension = (filename?: string) => {
  if (!filename) return 'FILE'
  const idx = filename.lastIndexOf('.')
  if (idx === -1) return 'FILE'
  return filename.substring(idx + 1).toUpperCase()
}

const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Media URL Resolution
const apiBaseUrl = ref('')
const getMediaUrl = (downloadUrlOrId?: string) => {
  if (!downloadUrlOrId) return ''
  if (downloadUrlOrId.startsWith('http://') || downloadUrlOrId.startsWith('https://')) {
    return downloadUrlOrId
  }
  const parts = downloadUrlOrId.split('/')
  const idOrName = parts[parts.length - 1]
  return `${apiBaseUrl.value}/telegram/chat/media/${idOrName}`
}

// Member & Group Info Drawer State
const memberDrawerVisible = ref(false)
const loadingMembers = ref(false)
const groupMembers = ref<GroupMember[]>([])
const groupInfoActiveTab = ref('members')

const handleTabHeaderWheel = (e: WheelEvent) => {
  const target = e.target as HTMLElement
  const headerEl = target?.closest('.el-tabs__header') as HTMLElement
  if (headerEl) {
    const scrollEl = headerEl.querySelector('.el-tabs__nav-scroll') as HTMLElement
    if (scrollEl && e.deltaY !== 0) {
      e.preventDefault()
      scrollEl.scrollLeft += e.deltaY * 1.5
    }
  }
}

const isVideoAttachment = (att: ChatAttachment) => {
  if (!att) return false
  return att.file_type === 'video' || (att.mime_type && att.mime_type.startsWith('video/')) || (att.file_name && (att.file_name.toLowerCase().endsWith('.mp4') || att.file_name.toLowerCase().endsWith('.mov') || att.file_name.toLowerCase().endsWith('.mkv') || att.file_name.toLowerCase().endsWith('.webm')))
}

// Categorized Media / Files / Links / Voice / Music / GIF Computeds
const groupMediaList = computed(() => {
  const result: ChatAttachment[] = []
  chatMessages.value.forEach(msg => {
    if (msg.attachments && msg.attachments.length > 0) {
      msg.attachments.forEach(att => {
        const isPhoto = att.file_type === 'photo' || (att.mime_type && att.mime_type.startsWith('image/'))
        const isVideo = isVideoAttachment(att)
        const isGif = att.file_type === 'animation' || att.file_type === 'gif' || (att.file_name && att.file_name.toLowerCase().endsWith('.gif')) || (att.mime_type && att.mime_type.includes('gif'))
        if ((isPhoto || isVideo) && !isGif) {
          result.push(att)
        }
      })
    }
  })
  return result
})

const groupMediaPreviewList = computed(() => {
  return groupMediaList.value
    .filter(item => !isVideoAttachment(item))
    .map(item => getMediaUrl(item.download_url || item.id))
})

const getImagePreviewIndex = (item: ChatAttachment) => {
  const mediaOnlyImages = groupMediaList.value.filter(i => !isVideoAttachment(i))
  const idx = mediaOnlyImages.findIndex(i => (i.id && i.id === item.id) || (i.download_url && i.download_url === item.download_url))
  return idx >= 0 ? idx : 0
}

const groupFileList = computed(() => {
  const result: ChatAttachment[] = []
  chatMessages.value.forEach(msg => {
    if (msg.attachments && msg.attachments.length > 0) {
      msg.attachments.forEach(att => {
        const isPhoto = att.file_type === 'photo' || (att.mime_type && att.mime_type.startsWith('image/'))
        const isVideo = isVideoAttachment(att)
        const isVoice = att.file_type === 'voice' || (att.mime_type && att.mime_type.includes('audio/ogg'))
        const isAudio = att.file_type === 'audio' || (att.mime_type && att.mime_type.startsWith('audio/'))
        const isGif = att.file_type === 'animation' || att.file_type === 'gif' || (att.file_name && att.file_name.toLowerCase().endsWith('.gif'))
        if (!isPhoto && !isVideo && !isVoice && !isAudio && !isGif) {
          result.push(att)
        }
      })
    }
  })
  return result
})

interface ExtractedLink {
  url: string;
  sender_name: string;
  date: string;
}

const groupLinkList = computed(() => {
  const result: ExtractedLink[] = []
  const urlRegex = /(https?:\/\/[^\s]+)/gi
  chatMessages.value.forEach(msg => {
    if (msg.text_content) {
      const matches = msg.text_content.match(urlRegex)
      if (matches) {
        matches.forEach(url => {
          result.push({
            url,
            sender_name: msg.full_name || msg.username || 'Người dùng',
            date: msg.date
          })
        })
      }
    }
  })
  return result
})

const groupVoiceList = computed(() => {
  const result: ChatAttachment[] = []
  chatMessages.value.forEach(msg => {
    if (msg.attachments && msg.attachments.length > 0) {
      msg.attachments.forEach(att => {
        const isVoice = att.file_type === 'voice' || (att.mime_type && (att.mime_type.includes('audio/ogg') || att.mime_type.includes('audio/opus')))
        if (isVoice) {
          result.push(att)
        }
      })
    }
  })
  return result
})

const groupMusicList = computed(() => {
  const result: ChatAttachment[] = []
  chatMessages.value.forEach(msg => {
    if (msg.attachments && msg.attachments.length > 0) {
      msg.attachments.forEach(att => {
        const isAudio = att.file_type === 'audio' || (att.mime_type && (att.mime_type.includes('audio/mpeg') || att.mime_type.includes('audio/mp3') || att.mime_type.includes('audio/wav') || att.mime_type.includes('audio/flac')))
        const isVoice = att.file_type === 'voice' || (att.mime_type && att.mime_type.includes('audio/ogg'))
        if (isAudio && !isVoice) {
          result.push(att)
        }
      })
    }
  })
  return result
})

const groupGifList = computed(() => {
  const result: ChatAttachment[] = []
  chatMessages.value.forEach(msg => {
    if (msg.attachments && msg.attachments.length > 0) {
      msg.attachments.forEach(att => {
        const isGif = att.file_type === 'animation' || att.file_type === 'gif' || (att.file_name && att.file_name.toLowerCase().endsWith('.gif')) || (att.mime_type && att.mime_type.includes('gif'))
        if (isGif) {
          result.push(att)
        }
      })
    }
  })
  return result
})

const suggestCards = [
  {
    title: '📢 Thông báo khẩn cấp',
    desc: 'Gửi tin nhắn thông báo bảo trì, mất điện hoặc thay đổi lịch làm việc khẩn cấp.',
    message: '📢 THÔNG BÁO KHẨN CẤP\n\nKính gửi toàn thể nhân viên, hệ thống máy chủ sẽ tiến hành bảo trì định kỳ từ 22:00 hôm nay đến 02:00 ngày mai. Vui lòng hoàn thành công việc trước thời gian trên.'
  },
  {
    title: '⚡ Lịch bảo dưỡng bồn mủ',
    desc: 'Gửi thông báo lịch trình bảo dưỡng định kỳ bồn mủ cao su cho các xưởng.',
    message: '⚡ LỊCH BẢO DƯỠNG ĐỊNH KỲ\n\nTiến hành sục rửa bồn mủ trung tâm vào lúc 14:00 ngày mai. Kính đề nghị các tổ thu hoạch sắp xếp thời gian tập kết hàng sớm.'
  },
  {
    title: '📝 Cập nhật chính sách hao hụt',
    desc: 'Gửi cập nhật phương pháp tính hao hụt sản lượng mủ khô theo tỷ lệ độ.',
    message: '📝 CẬP NHẬT CHÍNH SÁCH\n\nTừ ngày mai, tỷ lệ độ trừ hao khô sẽ áp dụng phương pháp đo mới tại cân Tiến Nga. Xin thông báo để bà con theo dõi sát.'
  },
  {
    title: '👥 Nhắc nhở chấm công',
    desc: 'Gửi tin nhắn nhắc nhở nộp bảng kê thu mua và chấm công cuối tháng.',
    message: '👥 NHẮC NHỞ HOÀN THÀNH HỒ SƠ\n\nĐề nghị các đại diện xưởng nộp bảng kê thu mua mủ cao su của tháng này trước 17:00 chiều nay để kế toán duyệt lương.'
  }
]

// Projects tree computed for display
const filteredProjectsTree = computed(() => {
  if (!groupSearch.value.trim()) return loadedProjects.value
  
  const q = groupSearch.value.toLowerCase().trim()
  return loadedProjects.value.map(proj => {
    const filteredMains = proj.mainGroups.filter((g: any) => 
      g.title.toLowerCase().includes(q) || g.chat_id.includes(q)
    )
    
    const filteredMembers = proj.memberGroups.filter((g: any) => 
      g.title.toLowerCase().includes(q) || g.chat_id.includes(q) || (g.parentName && g.parentName.toLowerCase().includes(q))
    )
    
    if (proj.project_name.toLowerCase().includes(q) || filteredMains.length > 0 || filteredMembers.length > 0) {
      return {
        ...proj,
        mainGroups: filteredMains,
        memberGroups: filteredMembers
      }
    }
    return null
  }).filter(Boolean) as any[]
})

let searchDebounceTimeout: any = null
const handleSearchInput = () => {
  if (searchDebounceTimeout) clearTimeout(searchDebounceTimeout)
  searchDebounceTimeout = setTimeout(() => {
    fetchGroups()
  }, 400)
}

const toggleProject = (projId: string) => {
  const index = expandedProjects.value.indexOf(projId)
  if (index > -1) {
    expandedProjects.value.splice(index, 1)
  } else {
    expandedProjects.value.push(projId)
  }
}

const expandedMainSections = ref<string[]>([])
const expandedMemberSections = ref<string[]>([])

const toggleMainSection = (projId: string) => {
  const index = expandedMainSections.value.indexOf(projId)
  if (index > -1) {
    expandedMainSections.value.splice(index, 1)
  } else {
    expandedMainSections.value.push(projId)
  }
}

const toggleMemberSection = (projId: string) => {
  const index = expandedMemberSections.value.indexOf(projId)
  if (index > -1) {
    expandedMemberSections.value.splice(index, 1)
  } else {
    expandedMemberSections.value.push(projId)
  }
}

// Auto-expand projects when searching
watch(groupSearch, (newVal) => {
  if (newVal.trim()) {
    filteredProjectsTree.value.forEach(proj => {
      if (!expandedProjects.value.includes(proj.id)) {
        expandedProjects.value.push(proj.id)
      }
      if (!expandedMainSections.value.includes(proj.id)) {
        expandedMainSections.value.push(proj.id)
      }
      if (!expandedMemberSections.value.includes(proj.id)) {
        expandedMemberSections.value.push(proj.id)
      }
    })
  }
})

const handleQueryChatId = () => {
  if (route.query.chat_id && groups.value.length > 0) {
    const targetId = String(route.query.chat_id)
    const targetGroup = groups.value.find(g => String(g.chat_id) === targetId)
    if (targetGroup) {
      selectedGroups.value = [targetGroup]
      if (targetGroup.project_id && !expandedProjects.value.includes(targetGroup.project_id)) {
        expandedProjects.value.push(targetGroup.project_id)
      }
      if (targetGroup.role === 'main' && targetGroup.project_id && !expandedMainSections.value.includes(targetGroup.project_id)) {
        expandedMainSections.value.push(targetGroup.project_id)
      }
      if (targetGroup.role === 'member' && targetGroup.project_id && !expandedMemberSections.value.includes(targetGroup.project_id)) {
        expandedMemberSections.value.push(targetGroup.project_id)
      }
      loadChatHistory(targetGroup.chat_id)
    }
  }
}

watch(() => route.query.chat_id, () => {
  handleQueryChatId()
})

// Fetch Telegram Chat Groups from Backend
const fetchGroups = async () => {
  loadingGroups.value = true
  try {
    const [chatGroupsData, projectsList] = await Promise.all([
      tienNgaService.getTelegramChatGroups({ search_query: groupSearch.value.trim() || undefined }),
      tienNgaService.getProjects()
    ])

    const groupsMap = new Map<string, any>()
    chatGroupsData.forEach((g: any) => {
      groupsMap.set(String(g.chat_id), g)
    })

    const projectsWithMains = await Promise.all(
      projectsList.map(async (proj) => {
        const mains = await tienNgaService.getTelegramGroups({
          project_id: proj.id,
          role: 'main'
        }).catch(err => {
          console.error(`Error loading main groups for project ${proj.project_name}:`, err)
          return []
        })
        
        return {
          id: proj.id,
          project_name: proj.project_name,
          mains
        }
      })
    )
    
    const results = await Promise.all(
      projectsWithMains.map(async (projData) => {
        const mainGroupsMapped = projData.mains.map((m: any) => {
          const chatInfo = groupsMap.get(String(m.chat_id)) || {}
          return {
            chat_id: m.chat_id,
            group_name: m.group_name || chatInfo.group_name || 'Nhóm không tên',
            custom_title: m.custom_title || chatInfo.custom_title || '',
            title: m.custom_title || m.group_name || chatInfo.group_name || 'Nhóm không tên',
            member_count: m.member_count,
            role: 'main',
            project_id: projData.id,
            total_messages: chatInfo.total_messages || 0,
            last_message: chatInfo.last_message || null,
            last_activity: chatInfo.last_activity || null
          }
        })
        
        const memberGroupPromises = mainGroupsMapped.map(async (mainGrp) => {
          const members = await tienNgaService.getTelegramGroups({
            project_id: projData.id,
            role: 'member',
            parent_id: mainGrp.chat_id
          }).catch(err => {
            console.error(`Error loading member groups for main group ${mainGrp.title}:`, err)
            return []
          })
          
          return members.map((m: any) => {
            const chatInfo = groupsMap.get(String(m.chat_id)) || {}
            return {
              chat_id: m.chat_id,
              group_name: m.group_name || chatInfo.group_name || 'Nhóm không tên',
              custom_title: m.custom_title || chatInfo.custom_title || '',
              title: m.custom_title || m.group_name || chatInfo.group_name || 'Nhóm không tên',
              member_count: m.member_count,
              role: 'member',
              parent_id: mainGrp.chat_id,
              parentName: mainGrp.title,
              project_id: projData.id,
              total_messages: chatInfo.total_messages || 0,
              last_message: chatInfo.last_message || null,
              last_activity: chatInfo.last_activity || null
            }
          })
        })
        
        const memberGroupsResults = await Promise.all(memberGroupPromises)
        const memberGroupsMapped = memberGroupsResults.flat()
        
        return {
          id: projData.id,
          project_name: projData.project_name,
          mainGroups: mainGroupsMapped,
          memberGroups: memberGroupsMapped
        }
      })
    )
    
    loadedProjects.value = results
    
    const flatGroups: any[] = []
    results.forEach(proj => {
      flatGroups.push(...proj.mainGroups)
      flatGroups.push(...proj.memberGroups)
    })
    groups.value = flatGroups
    handleQueryChatId()
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error.message || 'Lỗi khi tải danh sách nhóm Telegram')
  } finally {
    loadingGroups.value = false
  }
}

// Auto height adjustment for textarea
const adjustTextareaHeight = () => {
  const textarea = chatInputRef.value
  if (!textarea) return
  textarea.style.height = 'auto'
  textarea.style.height = textarea.scrollHeight + 'px'
}

// Message formatter
const formatMessageText = (text?: string) => {
  if (!text) return ''
  return text.replace(/\n/g, '<br/>')
}

// Reset chat input height
const resetInput = () => {
  typedMessage.value = ''
  nextTick(() => {
    if (chatInputRef.value) {
      chatInputRef.value.style.height = 'auto'
    }
  })
}

// Scroll chat feed to bottom
const scrollToBottom = () => {
  nextTick(() => {
    if (feedContainer.value) {
      feedContainer.value.scrollTop = feedContainer.value.scrollHeight
    }
  })
}

// Suggestions trigger
const applySuggestion = (message: string) => {
  if (!activeGroup.value) {
    if (groups.value.length > 0 && groups.value[0]) {
      activeGroup.value = groups.value[0]
      if (activeGroup.value) {
        updateUrlQuery(activeGroup.value.chat_id)
        loadChatHistory(activeGroup.value.chat_id)
      }
    } else {
      ElMessage.warning('Vui lòng chọn nhóm Telegram trước')
      return
    }
  }
  typedMessage.value = message
  nextTick(() => {
    adjustTextareaHeight()
    if (chatInputRef.value) {
      chatInputRef.value.focus()
    }
  })
}

const updateUrlQuery = (chatId?: string) => {
  const query = { ...route.query }
  if (chatId) {
    query.chat_id = chatId
  } else {
    delete query.chat_id
  }
  router.replace({ path: route.path, query })
}

const selectNewChat = () => {
  activeGroup.value = null
  chatMessages.value = []
  updateUrlQuery(undefined)
}

const isGroupSelected = (group: TelegramGroup) => {
  return selectedGroups.value.some(g => String(g.chat_id) === String(group.chat_id))
}

const handleCheckboxChange = (checked: any, group: TelegramGroup) => {
  if (checked) {
    if (!selectedGroups.value.some(g => String(g.chat_id) === String(group.chat_id))) {
      selectedGroups.value.push(group)
    }
  } else {
    selectedGroups.value = selectedGroups.value.filter(g => String(g.chat_id) !== String(group.chat_id))
  }
  if (selectedGroups.value.length === 1 && activeGroup.value) {
    updateUrlQuery(activeGroup.value.chat_id)
    loadChatHistory(activeGroup.value.chat_id)
  } else {
    updateUrlQuery(undefined)
  }
}

const handleGroupItemClick = (group: TelegramGroup) => {
  showChatMessageSearch.value = false
  messageSearchQuery.value = ''
  selectedGroups.value = [group]
  updateUrlQuery(group.chat_id)
  loadChatHistory(group.chat_id)
}

// Checkboxes for Main Groups
const isAllMainSelected = (project: any) => {
  if (project.mainGroups.length === 0) return false
  return project.mainGroups.every((g: any) => isGroupSelected(g))
}

const isMainIndeterminate = (project: any) => {
  const selectedCount = project.mainGroups.filter((g: any) => isGroupSelected(g)).length
  return selectedCount > 0 && selectedCount < project.mainGroups.length
}

const toggleSelectAllMain = (checked: any, project: any) => {
  if (checked) {
    project.mainGroups.forEach((g: any) => {
      if (!isGroupSelected(g)) {
        selectedGroups.value.push(g)
      }
    })
  } else {
    const mainChatIds = project.mainGroups.map((g: any) => String(g.chat_id))
    selectedGroups.value = selectedGroups.value.filter(g => !mainChatIds.includes(String(g.chat_id)))
  }
  if (selectedGroups.value.length === 1 && activeGroup.value) {
    updateUrlQuery(activeGroup.value.chat_id)
    loadChatHistory(activeGroup.value.chat_id)
  } else {
    updateUrlQuery(undefined)
  }
}

// Checkboxes for Member Groups
const isAllMemberSelected = (project: any) => {
  if (project.memberGroups.length === 0) return false
  return project.memberGroups.every((g: any) => isGroupSelected(g))
}

const isMemberIndeterminate = (project: any) => {
  const selectedCount = project.memberGroups.filter((g: any) => isGroupSelected(g)).length
  return selectedCount > 0 && selectedCount < project.memberGroups.length
}

const toggleSelectAllMember = (checked: any, project: any) => {
  if (checked) {
    project.memberGroups.forEach((g: any) => {
      if (!isGroupSelected(g)) {
        selectedGroups.value.push(g)
      }
    })
  } else {
    const memberChatIds = project.memberGroups.map((g: any) => String(g.chat_id))
    selectedGroups.value = selectedGroups.value.filter(g => !memberChatIds.includes(String(g.chat_id)))
  }
  if (selectedGroups.value.length === 1 && activeGroup.value) {
    loadChatHistory(activeGroup.value.chat_id)
  }
}

// Load Chat History from Backend API with Infinite Scroll Support
const loadChatHistory = async (chatId: string, isLoadMore = false) => {
  if (!chatId) return
  
  if (isLoadMore) {
    if (loadingOlderMessages.value || !hasMoreMessages.value) return
    loadingOlderMessages.value = true
  } else {
    loadingMessages.value = true
    chatMessages.value = []
    hasMoreMessages.value = true
  }

  try {
    const oldestMsgId = isLoadMore && chatMessages.value.length > 0 ? chatMessages.value[0]?.message_id : undefined
    
    const data = await tienNgaService.getTelegramChatMessages({
      chat_id: chatId,
      limit: 50,
      before_message_id: oldestMsgId,
      search_query: messageSearchQuery.value.trim() || undefined
    })

    const fetchedMsgs: ChatMessage[] = data.messages || []
    
    if (fetchedMsgs.length < 50) {
      hasMoreMessages.value = false
    }

    const sortChatMessages = (msgs: ChatMessage[]) => {
      return msgs.sort((a, b) => {
        const timeA = a.date ? new Date(a.date).getTime() : 0
        const timeB = b.date ? new Date(b.date).getTime() : 0
        if (timeA !== timeB) {
          return timeA - timeB
        }
        return (a.message_id || 0) - (b.message_id || 0)
      })
    }

    if (isLoadMore) {
      const currentScrollHeight = feedContainer.value?.scrollHeight || 0
      chatMessages.value = sortChatMessages([...fetchedMsgs, ...chatMessages.value])
      nextTick(() => {
        if (feedContainer.value) {
          feedContainer.value.scrollTop = feedContainer.value.scrollHeight - currentScrollHeight
        }
      })
    } else {
      chatMessages.value = sortChatMessages(fetchedMsgs)
      scrollToBottom()
    }
  } catch (error: any) {
    console.error('Lỗi khi tải lịch sử tin nhắn:', error)
    ElMessage.error(error.message || 'Lỗi khi tải lịch sử tin nhắn')
  } finally {
    loadingMessages.value = false
    loadingOlderMessages.value = false
  }
}

// Handle Feed Infinite Scroll Event
const handleFeedScroll = () => {
  const container = feedContainer.value
  if (!container || !activeGroup.value) return
  if (container.scrollTop < 40 && hasMoreMessages.value && !loadingOlderMessages.value && !loadingMessages.value) {
    loadChatHistory(activeGroup.value.chat_id, true)
  }
}

const formatLogTime = (dateStr?: string) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const hrs = String(d.getHours()).padStart(2, '0')
    const mins = String(d.getMinutes()).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return `${day}/${month} ${hrs}:${mins}`
  } catch (e) {
    return dateStr
  }
}

const formatShortTime = (dateStr?: string) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const hrs = String(d.getHours()).padStart(2, '0')
    const mins = String(d.getMinutes()).padStart(2, '0')
    return `${hrs}:${mins}`
  } catch (e) {
    return ''
  }
}

// Send Message / Attachment via Backend REST APIs
const sendMessage = async () => {
  if (selectedGroups.value.length === 0) {
    ElMessage.warning('Vui lòng chọn ít nhất một nhóm Telegram từ danh sách bên trái!')
    return
  }
  if ((!typedMessage.value.trim() && !selectedFile.value) || sendingMessage.value) return

  const messageText = typedMessage.value.trim()
  const fileObj = selectedFile.value
  sendingMessage.value = true

  if (selectedGroups.value.length === 1) {
    // === SINGLE GROUP MODE ===
    const targetGroup = selectedGroups.value[0]
    if (!targetGroup) return
    const targetChatId = targetGroup.chat_id

    removeSelectedFile()
    resetInput()

    try {
      let res: any
      if (fileObj) {
        const formData = new FormData()
        formData.append('chat_id', targetChatId)
        if (messageText) formData.append('caption', messageText)
        formData.append('file', fileObj)

        res = await tienNgaService.sendTelegramChatAttachment(formData)
      } else {
        res = await tienNgaService.sendTelegramChatMessage({
          chat_id: targetChatId,
          text_content: messageText
        })
      }

      if (res && res.data) {
        const exists = chatMessages.value.some(m => String(m.id) === String(res.data.id) || m.message_id === res.data.message_id)
        if (!exists) {
          chatMessages.value.push(res.data)
        }
      }
      ElMessage.success('Đã gửi tin nhắn thành công!')
      scrollToBottom()
    } catch (error: any) {
      console.error(error)
      ElMessage.error(error.message || 'Lỗi khi gửi tin nhắn tới Telegram')
    } finally {
      sendingMessage.value = false
    }
  } else {
    // === BULK BROADCAST MODE ===
    broadcastStatus.value = {}
    selectedGroups.value.forEach(grp => {
      broadcastStatus.value[grp.chat_id] = { status: 'pending' }
    })

    const totalGroups = selectedGroups.value.length
    let successCount = 0
    let failedCount = 0

    removeSelectedFile()
    resetInput()

    for (const grp of selectedGroups.value) {
      const statusObj = broadcastStatus.value[grp.chat_id]
      if (statusObj) {
        statusObj.status = 'sending'
        try {
          if (fileObj) {
            const formData = new FormData()
            formData.append('chat_id', grp.chat_id)
            if (messageText) formData.append('caption', messageText)
            formData.append('file', fileObj)

            await tienNgaService.sendTelegramChatAttachment(formData)
          } else {
            await tienNgaService.sendTelegramChatMessage({
              chat_id: grp.chat_id,
              text_content: messageText
            })
          }
          statusObj.status = 'success'
          successCount++
        } catch (error: any) {
          console.error(`Failed to send to group ${grp.group_name || grp.title}:`, error)
          statusObj.status = 'failed'
          statusObj.error = error.message || 'Lỗi không xác định'
          failedCount++
        }
      }
    }

    sendingMessage.value = false

    if (failedCount === 0) {
      ElMessage.success(`Đã gửi thành công tới tất cả ${successCount}/${totalGroups} nhóm!`)
    } else if (successCount === 0) {
      ElMessage.error(`Gửi thất bại trên toàn bộ ${failedCount}/${totalGroups} nhóm!`)
    } else {
      ElMessage.warning(`Hoàn thành gửi: Thành công ${successCount}/${totalGroups}, Thất bại ${failedCount}/${totalGroups}`)
    }
  }
}

// WebSocket Real-time Listener Initialization
const initWebSocket = async () => {
  try {
    const wsUrl = await tienNgaService.getTelegramChatWebSocketUrl()
    chatSocket = new WebSocket(wsUrl)

    chatSocket.onopen = () => {
      console.log('[TelegramChatWS] Connected to Web Chat WebSocket channel.')
    }

    chatSocket.onmessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.event === 'NEW_MESSAGE' && payload.data) {
          const newMsg = payload.data
          
          // 1. Update last message & last activity in groups list
          const grp = groups.value.find(g => String(g.chat_id) === String(newMsg.chat_id))
          if (grp) {
            grp.last_message = {
              id: newMsg.id,
              message_id: newMsg.message_id,
              sender_name: newMsg.full_name || newMsg.username,
              message_type: newMsg.message_type,
              text_content: newMsg.text_content,
              date: newMsg.date
            }
            grp.last_activity = newMsg.date
          }

          // 2. If active chat matches, append message to feed
          if (activeGroup.value && String(activeGroup.value.chat_id) === String(newMsg.chat_id)) {
            const exists = chatMessages.value.some(m => String(m.id) === String(newMsg.id) || m.message_id === newMsg.message_id)
            if (!exists) {
              chatMessages.value.push(newMsg)
              chatMessages.value.sort((a, b) => {
                const timeA = a.date ? new Date(a.date).getTime() : 0
                const timeB = b.date ? new Date(b.date).getTime() : 0
                if (timeA !== timeB) return timeA - timeB
                return (a.message_id || 0) - (b.message_id || 0)
              })
              scrollToBottom()
            }
          }
        } else if (payload.event === 'MESSAGE_DELETED' && payload.data) {
          const delData = payload.data
          // 1. Remove deleted message from current chatMessages feed
          chatMessages.value = chatMessages.value.filter(
            m => String(m.id) !== String(delData.id) && m.message_id !== delData.message_id
          )
          // 2. Update sidebar group locally without triggering a full sidebar fetch reload
          const grp = groups.value.find(g => String(g.chat_id) === String(delData.chat_id))
          if (grp && grp.last_message && (String(grp.last_message.id) === String(delData.id) || grp.last_message.message_id === delData.message_id)) {
            const remaining = chatMessages.value.filter(m => String(m.chat_id) === String(delData.chat_id))
            const lastMsg = remaining.length > 0 ? remaining[remaining.length - 1] : null
            if (lastMsg) {
              grp.last_message = {
                id: lastMsg.id,
                message_id: lastMsg.message_id,
                sender_name: lastMsg.full_name || lastMsg.username,
                message_type: lastMsg.message_type,
                text_content: lastMsg.text_content,
                date: lastMsg.date
              }
            } else {
              grp.last_message = null
            }
          }
        } else if (payload.event === 'MESSAGE_EDITED' && payload.data) {
          const editData = payload.data
          const msg = chatMessages.value.find(
            m => String(m.id) === String(editData.id) || m.message_id === editData.message_id
          )
          if (msg) {
            msg.text_content = editData.text_content
            msg.is_edited = true
            msg.edited_at = editData.edited_at
          }
        }
      } catch (err) {
        console.error('[TelegramChatWS] Error parsing message:', err)
      }
    }

    chatSocket.onclose = () => {
      console.warn('[TelegramChatWS] Connection closed. Retrying in 5 seconds...')
      wsReconnectTimer = setTimeout(initWebSocket, 5000)
    }

    chatSocket.onerror = (err) => {
      console.error('[TelegramChatWS] WebSocket error:', err)
      chatSocket?.close()
    }
  } catch (e) {
    console.error('[TelegramChatWS] Error initializing socket:', e)
    wsReconnectTimer = setTimeout(initWebSocket, 5000)
  }
}

// Drawer Details: Show Group Members
const showGroupMembers = async () => {
  if (!activeGroup.value) return
  memberDrawerVisible.value = true
  loadingMembers.value = true
  groupMembers.value = []

  try {
    const [telegramRes, dbRes] = await Promise.allSettled([
      telegramService.getMembersInGroup(activeGroup.value.chat_id, 'telegram'),
      tienNgaService.getTelegramProjectMembers({ chat_id: activeGroup.value.chat_id })
    ])

    const dbMembersList = (dbRes.status === 'fulfilled' && Array.isArray(dbRes.value)) ? dbRes.value : []

    if (telegramRes.status === 'fulfilled' && telegramRes.value && telegramRes.value.members) {
      groupMembers.value = telegramRes.value.members.map((mbr: any) => {
        const matchedDb = dbMembersList.find((dbM: any) => 
          (dbM.user_id && String(dbM.user_id) === String(mbr.user_id)) ||
          (dbM.user_name && mbr.username && dbM.user_name.toLowerCase() === mbr.username.toLowerCase())
        )
        return {
          ...mbr,
          id: matchedDb ? matchedDb.id : undefined,
          project_id: matchedDb ? matchedDb.project_id : undefined
        }
      })
    } else if (dbMembersList.length > 0) {
      groupMembers.value = dbMembersList.map((dbM: any) => ({
        id: dbM.id,
        user_id: dbM.user_id,
        name: dbM.full_name || dbM.user_name || 'Thành viên',
        username: dbM.user_name || '',
        status: dbM.role || dbM.member_status || 'MEMBER',
        project_id: dbM.project_id
      }))
    }
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error.message || 'Không thể tải danh sách thành viên từ Telegram API.')
  } finally {
    loadingMembers.value = false
  }
}

const translateRole = (role: string) => {
  if (!role) return 'Thành viên'
  switch (role.toUpperCase()) {
    case 'OWNER': return 'Trưởng nhóm'
    case 'ADMINISTRATOR': return 'Admin'
    case 'MEMBER': return 'Thành viên'
    default: return 'Thành viên'
  }
}

const getMemberRoleType = (role: string) => {
  if (!role) return 'info'
  switch (role.toUpperCase()) {
    case 'OWNER': return 'danger'
    case 'ADMINISTRATOR': return 'warning'
    default: return 'info'
  }
}

const handleGlobalClickOutside = (e: MouseEvent) => {
  const target = e.target as Node
  // Don't close if clicking inside the context menus
  if (
    (contextMenuRef.value && contextMenuRef.value.contains(target)) ||
    (memberContextMenuRef.value && memberContextMenuRef.value.contains(target))
  ) {
    return
  }
  closeAllContextMenus()
}

onMounted(async () => {
  apiBaseUrl.value = await getApiUrl()
  await fetchGroups()
  initWebSocket()
  window.addEventListener('click', handleGlobalClickOutside, true)
})

onUnmounted(() => {
  window.removeEventListener('click', handleGlobalClickOutside, true)
  if (wsReconnectTimer) clearTimeout(wsReconnectTimer)
  if (chatSocket) {
    chatSocket.onclose = null
    chatSocket.close()
  }
})
</script>

<style scoped>
.custom-search-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  background-color: var(--el-fill-color-blank);
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

html.dark .custom-search-input :deep(.el-input__wrapper) {
  background-color: #1f2937 !important;
  box-shadow: 0 0 0 1px #374151 inset !important;
}
html.dark .custom-search-input :deep(.el-input__inner) {
  color: #f3f4f6 !important;
  -webkit-text-fill-color: #f3f4f6 !important;
}
</style>

<style>
html.dark .custom-member-drawer {
  background-color: #111827 !important;
  border-left: 1px solid #1f2937 !important;
}
html.dark .custom-member-drawer .el-drawer__header {
  color: #f3f4f6 !important;
  border-bottom: 1px solid #1f2937 !important;
  margin-bottom: 0;
  padding: 16px;
  background-color: #111827 !important;
}

.group-info-tabs .el-tabs__header {
  margin-bottom: 0;
  padding: 0 8px;
  background-color: #ffffff;
}
html.dark .group-info-tabs .el-tabs__header {
  background-color: #111827 !important;
}

.group-info-tabs .el-tabs__nav-prev,
.group-info-tabs .el-tabs__nav-next {
  display: none !important;
  visibility: hidden !important;
  width: 0 !important;
  opacity: 0 !important;
  pointer-events: none !important;
}
.group-info-tabs .el-tabs__nav-wrap.is-scrollable {
  padding: 0 !important;
}
.group-info-tabs .el-tabs__nav-scroll {
  overflow-x: auto !important;
  scrollbar-width: none;
}
.group-info-tabs .el-tabs__nav-scroll::-webkit-scrollbar {
  display: none;
}
.group-info-tabs .el-tabs__item {
  font-size: 14px;
  font-weight: 700;
  padding: 0 14px;
  color: #6b7280;
}
html.dark .group-info-tabs .el-tabs__item {
  color: #9ca3af !important;
}
html.dark .group-info-tabs .el-tabs__item.is-active {
  color: #60a5fa !important;
}
.group-info-tabs .el-tabs__nav-wrap::after {
  height: 1px;
}
html.dark .group-info-tabs .el-tabs__nav-wrap::after {
  background-color: #1f2937 !important;
}
.group-info-tabs .el-tabs__content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.group-info-tabs .el-tab-pane {
  height: 100%;
}

/* Element Plus Image Viewer Dark Mode Styling */
html.dark .el-image-viewer__wrapper {
  background-color: rgba(10, 15, 29, 0.92) !important;
  backdrop-filter: blur(16px);
}

html.dark .el-image-viewer__btn {
  background-color: rgba(31, 41, 55, 0.85) !important;
  border: 1px solid rgba(75, 85, 99, 0.5) !important;
  color: #f3f4f6 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
  transition: all 0.2s ease !important;
}

html.dark .el-image-viewer__btn:hover {
  background-color: #2563eb !important;
  color: #ffffff !important;
  border-color: #3b82f6 !important;
  transform: scale(1.08);
}

html.dark .el-image-viewer__close {
  background-color: rgba(31, 41, 55, 0.9) !important;
  border: 1px solid rgba(239, 68, 68, 0.4) !important;
  color: #f87171 !important;
}

html.dark .el-image-viewer__close:hover {
  background-color: #dc2626 !important;
  color: #ffffff !important;
  border-color: #ef4444 !important;
  transform: scale(1.1) rotate(90deg);
}

html.dark .el-image-viewer__actions {
  background-color: rgba(31, 41, 55, 0.85) !important;
  border: 1px solid rgba(75, 85, 99, 0.5) !important;
  backdrop-filter: blur(12px) !important;
  border-radius: 9999px !important;
  padding: 6px 16px !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
}

html.dark .el-image-viewer__actions__inner {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 14px !important;
}

html.dark .el-image-viewer__actions__inner i,
html.dark .el-image-viewer__actions__inner .el-icon {
  color: #d1d5db !important;
  font-size: 18px !important;
  cursor: pointer !important;
  transition: color 0.15s ease, opacity 0.15s ease !important;
}

html.dark .el-image-viewer__actions__inner i:hover,
html.dark .el-image-viewer__actions__inner .el-icon:hover {
  color: #60a5fa !important;
  opacity: 1 !important;
}

/* Element Plus Message Box Global Styling (Light Mode & Dark Mode) */
.el-message-box {
  border-radius: 1rem !important;
  box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.12) !important;
  border: 1px solid #9ca3af !important;
  background-color: #9ca3af !important;
}

.el-message-box__title {
  font-weight: 700 !important;
  color: #111827 !important;
}

.el-message-box__message {
  color: #4b5563 !important;
}

.el-message-box__btns .el-button {
  border-radius: 0.75rem !important;
  font-weight: 600 !important;
}

.el-overlay-message-box {
  background-color: rgba(0, 0, 0, 0.4) !important;
  backdrop-filter: blur(4px) !important;
}

/* Dark Mode Overrides for Message Box */
html.dark .el-message-box {
  background-color: #1f2937 !important;
  border: 1px solid #374151 !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7) !important;
}

html.dark .el-message-box__title {
  color: #f3f4f6 !important;
}

html.dark .el-message-box__message {
  color: #d1d5db !important;
}

html.dark .el-message-box__headerbtn .el-message-box__close {
  color: #9ca3af !important;
}

html.dark .el-message-box__headerbtn .el-message-box__close:hover {
  color: #ef4444 !important;
}

html.dark .el-message-box__btns .el-button:not(.el-button--primary) {
  background-color: #374151 !important;
  border-color: #4b5563 !important;
  color: #e5e7eb !important;
}

html.dark .el-message-box__btns .el-button:not(.el-button--primary):hover {
  background-color: #4b5563 !important;
  color: #ffffff !important;
}

html.dark .el-message-box__btns .el-button--primary {
  background-color: #2563eb !important;
  border-color: #3b82f6 !important;
  color: #ffffff !important;
}

html.dark .el-message-box__btns .el-button--primary:hover {
  background-color: #1d4ed8 !important;
}

html.dark .el-overlay-message-box {
  background-color: rgba(0, 0, 0, 0.75) !important;
  backdrop-filter: blur(4px) !important;
}
</style>
