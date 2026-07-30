
<template>
  <view class="h-screen bg-slate-50 text-slate-800">
    <view class="mx-auto max-w-md h-screen flex flex-col shadow-2xl bg-slate-50 relative overflow-hidden">
      <view
        class="bg-white-80 px-5 pb-3 relative shrink-0 sticky-header z-20 shadow-soft"
        :style="{ paddingTop: headerTopPadding + 'px' }"
      >
        <view class="flex items-center gap-3">
          <button v-if="subPage" class="nav-icon-button tap-scale" @click="subPage = ''">
            <view class="icon-back">
              <view class="icon-back-line icon-back-line-top"></view>
              <view class="icon-back-line icon-back-line-bottom"></view>
            </view>
          </button>
          <view class="min-w-0">
            <view class="font-black text-slate-900 text-lg truncate">{{ pageTitle }}</view>
            <view class="text-xs text-slate-400 font-medium mt-0_5 truncate">{{ pageSubtitle }}</view>
          </view>
        </view>

        <view
          v-if="!subPage"
          class="mt-3 p-4 rounded-2xl profile-hero text-white relative overflow-hidden shadow-soft"
        >
          <view class="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white-20"></view>
          <view class="absolute -right-2 -top-2 w-28 h-28 rounded-full bg-white-20"></view>

          <view class="flex items-center gap-3 relative z-10">
            <view
              class="w-12 h-12 bg-white-20 rounded-full flex items-center justify-center text-white font-semibold text-lg"
            >{{ profileInitial }}</view>
            <view class="min-w-0 flex-1">
              <view class="text-lg font-black truncate">{{ profileName }}</view>
              <view class="flex gap-1_5 mt-1_5 flex-wrap">
                <view class="profile-hero-chip">{{ currentUser ? '微信已登录' : '本地访客' }}</view>
                <view class="profile-hero-chip">{{ tenantRoleLabel }}</view>
                <view class="profile-hero-chip">租户隔离</view>
                <view class="profile-hero-chip">本地优先</view>
              </view>
            </view>
          </view>

          <view class="grid grid-cols-3 gap-3 mt-4 pt-3 relative z-10">
            <view class="text-center">
              <view class="text-xl font-black font-mono">{{ stats.propertyCount }}</view>
              <view class="text-3xs text-slate-200 font-medium mt-1">管理院落</view>
            </view>
            <view class="text-center">
              <view class="text-xl font-black font-mono">{{ stats.totalRooms }}</view>
              <view class="text-3xs text-slate-200 font-medium mt-1">总房间</view>
            </view>
            <view class="text-center">
              <view class="text-xl font-black font-mono text-blue-200">{{ stats.rentedRooms }}</view>
              <view class="text-3xs text-slate-200 font-medium mt-1">已入住</view>
            </view>
          </view>
        </view>
      </view>

      <scroll-view scroll-y class="page-scroll" :scroll-with-animation="true">
        <view class="p-4 stack-4" :style="{ paddingBottom: !subPage ? '176rpx' : '64rpx' }">
          <view v-if="!subPage" class="stack-4">
            <view class="overflow-hidden surface-card" :class="UI.card">
              <view class="p-3 stack-3">
                <view class="flex items-center justify-between gap-3">
                  <view class="min-w-0">
                    <view class="font-bold text-slate-800 text-sm">{{ currentUser ? '当前租户' : '微信登录' }}</view>
                    <view class="text-3xs text-slate-400 mt-1">
                      {{ currentUser ? '切换后将自动切到该租户的独立本地数据。' : '登录后可恢复当前微信用户的租户空间。' }}
                    </view>
                  </view>
                  <button
                    v-if="!currentUser"
                    class="px-3 py-2 rounded-xl btn-blue text-xs font-semibold tap-scale shrink-0"
                    @click="loginTenant"
                  >微信登录</button>
                </view>
                <view v-if="users.length" class="flex gap-2 overflow-x-auto whitespace-nowrap">
                  <button
                    v-for="user in users"
                    :key="user.id"
                    class="px-3 py-2 rounded-xl border text-xs font-semibold tap-scale shrink-0"
                    :class="user.id === selectedTenantId ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'"
                    @click="switchTenantUser(user.id)"
                  >{{ user.nickName }}</button>
                </view>
              </view>
            </view>

            <view class="overflow-hidden surface-card" :class="UI.card">
              <view
                v-for="(item, index) in visibleMenuA"
                :key="item.id"
                class="p-3 flex items-center justify-between tap-scale"
                :class="index !== visibleMenuA.length - 1 ? 'border-b border-slate-100' : ''"
                @click="openSubPage(item.id)"
              >
                <view class="flex items-center gap-3 min-w-0">
                  <view
                    class="w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-sm shadow-soft"
                    :class="item.bg"
                  >
                    <text :class="item.color">{{ item.icon }}</text>
                  </view>
                  <view class="min-w-0">
                    <view class="font-bold text-slate-800 text-sm truncate">{{ item.label }}</view>
                    <view class="text-3xs text-slate-400 mt-0_5 truncate">{{ item.desc }}</view>
                  </view>
                </view>
                <view class="text-slate-300 text-base">›</view>
              </view>
            </view>

            <view class="overflow-hidden surface-card" :class="UI.card">
              <view
                v-for="(item, index) in visibleMenuB"
                :key="item.id"
                class="p-3 flex items-center justify-between tap-scale"
                :class="index !== visibleMenuB.length - 1 ? 'border-b border-slate-100' : ''"
                @click="openSubPage(item.id)"
              >
                <view class="flex items-center gap-3 min-w-0">
                  <view
                    class="w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-sm shadow-soft"
                    :class="item.bg"
                  >
                    <text :class="item.color">{{ item.icon }}</text>
                  </view>
                  <view class="min-w-0">
                    <view class="font-bold text-slate-800 text-sm truncate">{{ item.label }}</view>
                    <view class="text-3xs text-slate-400 mt-0_5 truncate">{{ item.desc }}</view>
                  </view>
                </view>
                <view class="text-slate-300 text-base">›</view>
              </view>
            </view>

            <button
              class="w-full py-3 rounded-xl bg-white border border-rose-200 text-rose-500 text-sm font-semibold tap-scale"
              @click="logout"
            >退出登录</button>
          </view>
          <view v-else-if="subPage === 'allDocuments'" class="stack-3">
            <view class="surface-card" :class="UI.card">
              <view class="p-3 stack-3">
                <input
                  v-model="docKeyword"
                  class="doc-input"
                  placeholder="搜索姓名、房号或手机号"
                  placeholder-class="doc-placeholder"
                />
                <button class="w-full py-3 rounded-xl btn-blue text-sm font-semibold tap-scale" @click="docKeyword = docKeyword.trim()">
                  查询
                </button>
              </view>
            </view>

            <view class="surface-card" :class="UI.card">
              <view v-if="filteredDocs.length" class="divide-y divide-slate-100">
                <view v-for="doc in filteredDocs" :key="doc.id" class="p-3 stack-2">
                  <view class="flex items-start justify-between gap-3">
                    <view class="min-w-0">
                      <view class="font-bold text-slate-900 text-sm">{{ doc.tenantName || '未填写租客' }}</view>
                      <view class="text-3xs text-slate-400 mt-1">
                        {{ doc.roomLabel }}<text v-if="doc.phone"> · {{ doc.phone }}</text>
                      </view>
                    </view>
                    <view class="text-3xs text-slate-400">{{ doc.statusText }}</view>
                  </view>
                  <view class="flex flex-wrap gap-2">
                    <view class="doc-badge" :class="doc.identityFile ? 'doc-badge-ok' : 'doc-badge-empty'">
                      {{ doc.identityFile ? '身份证已归档' : '身份证缺失' }}
                    </view>
                    <view class="doc-badge" :class="doc.contractFile ? 'doc-badge-ok' : 'doc-badge-empty'">
                      {{ doc.contractFile ? '合同已归档' : '合同缺失' }}
                    </view>
                  </view>
                  <view class="flex gap-2">
                    <button
                      class="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold"
                      @click="openAttachment(doc.identityFile, doc.identityTitle, '暂无证件')"
                    >{{ doc.identityFile ? '查看身份证' : '暂无证件' }}</button>
                    <button
                      class="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold"
                      @click="openAttachment(doc.contractFile, doc.contractTitle, '暂无合同')"
                    >{{ doc.contractFile ? '查看电子合同' : '暂无合同' }}</button>
                  </view>
                </view>
              </view>
              <view v-else class="p-6 text-center text-sm text-slate-400">暂无匹配的档案记录</view>
            </view>
          </view>

          <view v-else-if="subPage === 'utilityTemplate'" class="stack-3">
            <view class="surface-card" :class="UI.card">
              <view class="p-4 text-xs text-slate-500 leading-6">
                设置全局默认水电单价。调整后仅影响以后新生成的计费，以前已生成的费用不回写。
              </view>
            </view>
            <view class="surface-card" :class="UI.card">
              <view class="p-4 stack-3">
                <view>
                  <view class="text-xs font-semibold text-slate-500 mb-2">水费（元/吨）</view>
                  <input
                    v-model="utilityForm.waterPriceDefault"
                    type="digit"
                    class="setting-input setting-input-center"
                    placeholder="输入单价"
                    placeholder-class="doc-placeholder"
                  />
                </view>
                <view>
                  <view class="text-xs font-semibold text-slate-500 mb-2">电费（元/度）</view>
                  <input
                    v-model="utilityForm.electricPriceDefault"
                    type="digit"
                    class="setting-input setting-input-center"
                    placeholder="输入单价"
                    placeholder-class="doc-placeholder"
                  />
                </view>
              </view>
            </view>
          </view>

          <view v-else-if="subPage === 'contractLibrary'" class="stack-3">
            <view class="surface-card" :class="UI.card">
              <view class="p-4 stack-3">
                <view class="text-xs text-slate-500 leading-6">上传与预览合同模板，便于后续快速归档使用。</view>
                <button
                  class="w-full py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold"
                  @click="showTemplateUploadTip"
                >上传新的合同模板扫描件</button>
              </view>
            </view>

            <view class="surface-card" :class="UI.card">
              <view v-if="contractTemplates.length" class="divide-y divide-slate-100">
                <view v-for="item in contractTemplates" :key="item.id" class="p-3 flex items-center justify-between gap-3">
                  <view class="min-w-0">
                    <view class="font-bold text-slate-900 text-sm truncate">{{ item.name }}</view>
                    <view class="text-3xs text-slate-400 mt-1">最近使用 {{ item.updatedAt || '未记录' }}</view>
                  </view>
                  <button
                    class="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold"
                    @click="openTemplatePreview(item)"
                  >预览</button>
                </view>
              </view>
              <view v-else class="p-6 text-center text-sm text-slate-400">暂无已归档的标准模板</view>
            </view>
          </view>

          <view v-else-if="subPage === 'autoReminder'" class="stack-3">
            <view class="surface-card" :class="UI.card">
              <view class="p-4 text-xs text-slate-500 leading-6">
                当前只做自我提醒管理，不生成催缴文案，也不向微信外部推送消息。
              </view>
            </view>
            <view class="surface-card" :class="UI.card">
              <view class="p-3 stack-3">
                <label class="flex items-center justify-between gap-3">
                  <view>
                    <view class="font-bold text-slate-800 text-sm">到期前 3 天提醒</view>
                    <view class="text-3xs text-slate-400 mt-1">提醒自己提前准备收款</view>
                  </view>
                  <switch
                    :checked="reminderForm.remindBefore3Days"
                    color="#2563eb"
                    @change="reminderForm.remindBefore3Days = $event.detail.value"
                  />
                </label>
                <label class="flex items-center justify-between gap-3">
                  <view>
                    <view class="font-bold text-slate-800 text-sm">到期当天提醒</view>
                    <view class="text-3xs text-slate-400 mt-1">账单到期当天再次提示</view>
                  </view>
                  <switch
                    :checked="reminderForm.remindOnDueDate"
                    color="#2563eb"
                    @change="reminderForm.remindOnDueDate = $event.detail.value"
                  />
                </label>
                <label class="flex items-center justify-between gap-3">
                  <view>
                    <view class="font-bold text-slate-800 text-sm">逾期 3 天标记</view>
                    <view class="text-3xs text-slate-400 mt-1">用于标记需要重点跟进的房间</view>
                  </view>
                  <switch
                    :checked="reminderForm.markOverdue3Days"
                    color="#2563eb"
                    @change="reminderForm.markOverdue3Days = $event.detail.value"
                  />
                </label>
              </view>
            </view>
          </view>

          <view v-else-if="subPage === 'exportReport'" class="stack-3">
            <view class="surface-card" :class="UI.card">
              <view class="p-4 text-xs text-slate-500 leading-6">
                支持导出单个房间或全部房间的流水明细，并带租金与附加费汇总。
              </view>
            </view>

            <view class="surface-card" :class="UI.card">
              <view class="p-4 stack-3">
                <view>
                  <view class="text-xs font-semibold text-slate-500 mb-2">导出范围</view>
                  <view class="grid grid-cols-2 gap-2">
                    <button
                      class="px-3 py-2 rounded-xl border text-xs font-semibold"
                      :class="exportMode === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'"
                      @click="exportMode = 'all'"
                    >全部房间</button>
                    <button
                      class="px-3 py-2 rounded-xl border text-xs font-semibold"
                      :class="exportMode === 'room' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'"
                      @click="exportMode = 'room'"
                    >单个房间</button>
                  </view>
                </view>

                <view v-if="exportMode === 'room'">
                  <view class="text-xs font-semibold text-slate-500 mb-2">选择房间</view>
                  <picker
                    mode="selector"
                    :range="exportRoomOptions"
                    range-key="label"
                    :value="selectedExportRoomIndex"
                    @change="handleRoomPickerChange"
                  >
                    <view class="setting-input flex items-center justify-between text-sm text-slate-700">
                      <text>{{ selectedExportRoomLabel }}</text>
                      <text class="text-slate-300">›</text>
                    </view>
                  </picker>
                </view>

                <view class="rounded-2xl bg-slate-50 border border-slate-200 p-3 stack-2">
                  <view class="font-bold text-slate-800 text-sm">汇总预览</view>
                  <view class="grid grid-cols-3 gap-2 text-center">
                    <view>
                      <view class="text-lg font-black text-slate-900">{{ exportPreviewSummary.count }}</view>
                      <view class="text-3xs text-slate-400 mt-1">流水笔数</view>
                    </view>
                    <view>
                      <view class="text-lg font-black text-slate-900">¥{{ fmtMoney(exportPreviewSummary.rentTotal) }}</view>
                      <view class="text-3xs text-slate-400 mt-1">租金合计</view>
                    </view>
                    <view>
                      <view class="text-lg font-black text-slate-900">¥{{ fmtMoney(exportPreviewSummary.utilityTotal) }}</view>
                      <view class="text-3xs text-slate-400 mt-1">附加费合计</view>
                    </view>
                  </view>
                </view>
              </view>
            </view>
            <view v-if="isCloudConfigured" class="surface-card" :class="UI.card">
              <view class="p-3 flex items-center justify-between gap-3 border-b border-slate-100">
                <view>
                  <view class="font-bold text-slate-800 text-sm">云端导出历史</view>
                  <view class="text-3xs text-slate-400 mt-1">最近 20 条导出记录</view>
                </view>
                <button
                  class="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold"
                  @click="loadCloudExportTasks"
                >刷新</button>
              </view>
              <view v-if="cloudExportLoading" class="p-4 text-center text-sm text-slate-400">正在加载导出记录…</view>
              <view v-else-if="cloudExportTasks.length" class="divide-y divide-slate-100">
                <view v-for="task in cloudExportTasks" :key="task.id" class="p-3 stack-2">
                  <view class="flex items-center justify-between gap-3">
                    <view class="font-bold text-slate-900 text-sm">
                      {{ task.scope === 'room' ? '单个房间导出' : '全部房间导出' }}
                    </view>
                    <view class="text-3xs sync-chip" :class="exportTaskStatusClass(task.status)">
                      {{ exportTaskStatusLabel(task.status) }}
                    </view>
                  </view>
                  <view class="text-3xs text-slate-400">{{ formatExportTaskTime(task.createdAt) }}</view>
                  <view class="flex flex-wrap gap-2 text-3xs text-slate-500">
                    <text>流水 {{ Number(task.summary?.count || 0) }}</text>
                    <text>租金 ¥{{ fmtMoney(task.summary?.rentTotal || 0) }}</text>
                    <text>附加费 ¥{{ fmtMoney(task.summary?.utilityTotal || 0) }}</text>
                  </view>
                  <button
                    v-if="task.fileUrl"
                    class="w-full py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold"
                    @click="copyExportLink(task.fileUrl)"
                  >复制下载链接</button>
                </view>
              </view>
              <view v-else class="p-4 text-center text-sm text-slate-400">暂无云端导出记录</view>
            </view>
          </view>
        </view>
      </scroll-view>

      <view v-if="subPage === 'utilityTemplate' && canManageTenantData" class="page-footer">
        <button class="page-footer-primary" @click="saveConfig">保存单价模板</button>
      </view>
      <view v-else-if="subPage === 'autoReminder' && canManageTenantData" class="page-footer">
        <button class="page-footer-primary" @click="saveReminder">保存提醒设置</button>
      </view>
      <view v-else-if="subPage === 'exportReport' && canManageTenantData" class="page-footer">
        <button class="page-footer-primary" @click="exportReportFile">导出为 CSV</button>
      </view>

      <BaseCenteredModal
        :open="attachmentModalOpen"
        title="资料预览"
        subtitle="查看身份证、合同或模板图片"
        @close="closeAttachment"
      >
        <view v-if="activeAttachment" class="stack-3">
          <view class="rounded-2xl bg-slate-50 border border-slate-200 p-3 stack-2">
            <view class="text-xs font-semibold text-slate-500">标题</view>
            <view class="font-bold text-slate-900 text-sm">{{ attachmentModalTitle }}</view>
          </view>
          <view class="rounded-2xl bg-white border border-slate-200 p-3 stack-3">
            <view class="text-xs font-semibold text-slate-500">预览</view>
            <image
              v-if="resolveAttachmentImageSrc(activeAttachment)"
              :src="resolveAttachmentImageSrc(activeAttachment)"
              mode="aspectFit"
              class="preview-image"
              @click="previewAttachmentImage"
            />
            <view v-else class="preview-empty">暂无图片预览</view>
          </view>
        </view>
      </BaseCenteredModal>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import BaseCenteredModal from '../../components/BaseCenteredModal.vue'
import { createCloudExportTask, fetchCloudExportTasks, getCachedCloudExportTasks } from '../../api/exports.js'
import { canUseCloudBackup, hasCloudApiBaseUrl, isCloudApiConfigured, withCloudBackupAccess } from '../../config/cloud'
import {
  buildTenantStorageKey,
  canManageTenantData,
  currentProfile,
  currentTenantRole,
  currentUser,
  loginWithWeChatProfile,
  logoutTenant,
  switchTenant,
  users,
} from '../../data/authStore.js'
import { globalConfig, properties, saveGlobalConfig } from '../../data/rentStore'
import { getPendingSyncSummary, getSyncMode, processSyncQueue, setSyncMode } from '../../data/syncQueue.js'
import { UI } from '../../ui/ui'
import { getPageHeaderTopPadding } from '../../utils/layout'
import { previewChosenImage, resolveOfflineImageSrc } from '../../utils/media'
import { getFileSystemManagerSafe, getUserDataPathSafe } from '../../utils/platform-files'

const REMINDER_STORAGE_KEY = 'irent_reminder_settings_v1'

const headerTopPadding = ref(44)
const subPage = ref('')
const docKeyword = ref('')
const attachmentModalOpen = ref(false)
const activeAttachment = ref(null)
const attachmentModalTitle = ref('')
const selectedTenantId = ref('')
const cloudExportTasks = ref([])
const cloudExportLoading = ref(false)
const exportMode = ref('all')
const selectedExportRoomId = ref('')
const syncSummary = ref(getPendingSyncSummary())
const syncMode = ref(getSyncMode())

const utilityForm = ref({
  waterPriceDefault: String(globalConfig.value.waterPriceDefault ?? 5.5),
  electricPriceDefault: String(globalConfig.value.electricPriceDefault ?? 1.2),
})

const reminderForm = ref(loadReminderSettings())
const isCloudConfigured = computed(() => isCloudApiConfigured())
const profileName = computed(() => currentUser.value?.nickName || currentProfile.value?.nickName || '微信用户')
const profileInitial = computed(() => String(profileName.value || '微').slice(0, 1))
const tenantRoleLabel = computed(() => {
  switch (String(currentTenantRole.value || '').toUpperCase()) {
    case 'MANAGER': return '管理员'
    case 'VIEWER': return '只读成员'
    default: return '所有者'
  }
})

const stats = computed(() => {
  const rooms = properties.value.flatMap((property) =>
    (property.blocks || []).flatMap((block) => (block.floors || []).flatMap((floor) => floor.rooms || [])),
  )
  return {
    propertyCount: properties.value.length,
    totalRooms: rooms.length,
    rentedRooms: rooms.filter((room) => room.status && room.status !== 'empty').length,
  }
})

const pageTitle = computed(() => ({
  allDocuments: '租客证件与合同归档',
  utilityTemplate: '默认水电单价模板',
  contractLibrary: '电子租赁合同库',
  autoReminder: '到期提醒机制',
  exportReport: '数据报表导出',
}[subPage.value] || '我的'))

const pageSubtitle = computed(() => ({
  allDocuments: '按姓名、房号、手机号搜索',
  utilityTemplate: '统一模板，房间可覆盖',
  contractLibrary: '上传与预览模板',
  autoReminder: '仅自我管理，不生成催缴文案',
  exportReport: '导出 Excel 存档',
}[subPage.value] || '账号与基础设置'))

const menuA = [
  { id: 'allDocuments', label: '租客证件与合同归档', desc: '查看身份证、合同与归档状态', icon: '档', bg: 'bg-blue-50', color: 'text-blue-600' },
  { id: 'utilityTemplate', label: '默认水电单价模板', desc: '统一配置默认水电价格', icon: '水', bg: 'bg-amber-50', color: 'text-amber-600', managerOnly: true },
  { id: 'contractLibrary', label: '电子租赁合同库', desc: '管理合同模板与预览入口', icon: '合', bg: 'bg-indigo-50', color: 'text-indigo-600' },
]

const menuB = [
  { id: 'autoReminder', label: '到期提醒机制', desc: '仅做自我提醒，不外发催缴', icon: '提', bg: 'bg-orange-50', color: 'text-orange-600', managerOnly: true },
  { id: 'exportReport', label: '数据报表导出', desc: '导出房间流水与汇总', icon: '表', bg: 'bg-emerald-50', color: 'text-emerald-600', managerOnly: true },
]

const visibleMenuA = computed(() => menuA.filter((item) => !item.managerOnly || canManageTenantData.value))
const visibleMenuB = computed(() => menuB.filter((item) => !item.managerOnly || canManageTenantData.value))
const allDocs = computed(() => {
  const docs = []
  for (const property of properties.value) {
    for (const block of property.blocks || []) {
      for (const floor of block.floors || []) {
        for (const room of floor.rooms || []) {
          const attachments = Array.isArray(room.attachments) ? room.attachments : []
          const identityFile = room.identityCardFile || attachments.find((item) => String(item?.type || '').includes('identity')) || attachments.find((item) => String(item?.name || '').includes('身份证')) || null
          const contractFile = room.contractFile || attachments.find((item) => String(item?.type || '').includes('contract')) || attachments.find((item) => String(item?.name || '').includes('合同')) || null
          docs.push({
            id: room.id,
            tenantName: room.tenantName || room.tenant || '',
            phone: room.phone || room.tenantPhone || '',
            roomLabel: `${property.name} · ${block.name} · ${room.roomNo}`,
            statusText: room.status === 'empty' ? '空置' : '已归档',
            identityFile,
            contractFile,
            identityTitle: `${room.roomNo} 身份证`,
            contractTitle: `${room.roomNo} 合同`,
          })
        }
      }
    }
  }
  return docs
})

const filteredDocs = computed(() => {
  const keyword = docKeyword.value.trim()
  if (!keyword) return allDocs.value
  return allDocs.value.filter((item) => [item.tenantName, item.phone, item.roomLabel].some((field) => String(field || '').includes(keyword)))
})

const contractTemplates = computed(() => {
  const list = []
  for (const property of properties.value) {
    for (const block of property.blocks || []) {
      for (const floor of block.floors || []) {
        for (const room of floor.rooms || []) {
          for (const file of room.attachments || []) {
            const name = String(file?.name || '')
            if (!name.includes('合同')) continue
            list.push({ id: file.id || `${room.id}_${name}`, name, updatedAt: file.uploadedAt || file.updatedAt || '', file })
          }
        }
      }
    }
  }
  const seen = new Set()
  return list.filter((item) => {
    if (seen.has(item.name)) return false
    seen.add(item.name)
    return true
  })
})

const exportTransactions = computed(() => {
  const targetRoomId = exportMode.value === 'room' ? selectedExportRoomId.value : ''
  const rows = []
  for (const property of properties.value) {
    for (const block of property.blocks || []) {
      for (const floor of block.floors || []) {
        for (const room of floor.rooms || []) {
          if (targetRoomId && room.id !== targetRoomId) continue
          for (const item of room.collections || []) {
            rows.push({
              id: item.id || `${room.id}_${item.createdAt || item.payDate || Math.random()}`,
              roomId: room.id,
              roomNo: room.roomNo,
              tenant: room.tenantName || room.tenant || '',
              title: item.title || buildCollectionTitle(item.kind),
              kind: item.kind || 'custom',
              amount: Number(item.amount || 0),
              payDate: item.payDate || item.createdAt || '',
              receiptFile: item.receiptFile || null,
            })
          }
        }
      }
    }
  }
  return rows.sort((a, b) => String(b.payDate || '').localeCompare(String(a.payDate || '')))
})

const exportRoomOptions = computed(() => {
  const list = []
  for (const property of properties.value) {
    for (const block of property.blocks || []) {
      for (const floor of block.floors || []) {
        for (const room of floor.rooms || []) {
          list.push({ id: room.id, label: `${property.name} / ${block.name} / ${room.roomNo}` })
        }
      }
    }
  }
  return list
})

const selectedExportRoomIndex = computed(() => {
  const index = exportRoomOptions.value.findIndex((item) => item.id === selectedExportRoomId.value)
  return index < 0 ? 0 : index
})
const selectedExportRoomLabel = computed(() => exportRoomOptions.value.find((item) => item.id === selectedExportRoomId.value)?.label || '请选择房间')

const exportPreviewSummary = computed(() => exportTransactions.value.reduce((summary, item) => {
  summary.count += 1
  if (item.kind === 'rent') summary.rentTotal += Number(item.amount || 0)
  else summary.utilityTotal += Number(item.amount || 0)
  return summary
}, { count: 0, rentTotal: 0, utilityTotal: 0 }))

const syncPendingTypeItems = computed(() => Object.entries(syncSummary.value.pendingTypeCounts || {})
  .map(([type, count]) => ({ type, count, label: syncTaskTypeLabel(type) }))
  .filter((item) => item.count > 0))

watch(globalConfig, (value) => {
  utilityForm.value = {
    waterPriceDefault: String(value.waterPriceDefault ?? 5.5),
    electricPriceDefault: String(value.electricPriceDefault ?? 1.2),
  }
}, { immediate: true, deep: true })

watch(users, (value) => {
  if (!value.length) {
    selectedTenantId.value = ''
    return
  }
  if (!value.some((item) => item.id === selectedTenantId.value)) selectedTenantId.value = value[0].id
}, { immediate: true, deep: true })

watch(exportRoomOptions, (value) => {
  if (!value.length) {
    selectedExportRoomId.value = ''
    return
  }
  if (!selectedExportRoomId.value || !value.some((item) => item.id === selectedExportRoomId.value)) {
    selectedExportRoomId.value = value[0].id
  }
}, { immediate: true, deep: true })

function loadReminderSettings() {
  const fallback = { remindBefore3Days: true, remindOnDueDate: true, markOverdue3Days: true }
  try {
    const stored = uni.getStorageSync(buildTenantStorageKey(REMINDER_STORAGE_KEY))
    return stored ? { ...fallback, ...stored } : fallback
  } catch {
    return fallback
  }
}

function persistReminderSettings() {
  try { uni.setStorageSync(buildTenantStorageKey(REMINDER_STORAGE_KEY), reminderForm.value) } catch {}
}

function refreshSyncSummary() {
  syncSummary.value = getPendingSyncSummary()
  syncMode.value = getSyncMode()
}

function fmtMoney(value) { return Number(value || 0).toFixed(2) }

function formatSyncTime(value) {
  if (!value) return ''
  const date = new Date(Number(value))
  if (Number.isNaN(date.getTime())) return ''
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

function syncTaskTypeLabel(type) {
  switch (type) {
    case 'properties.treeSync': return '结构'
    case 'room.checkin': return '入住'
    case 'room.rentCollection': return '房租'
    case 'room.utilityCollection': return '附加费'
    case 'room.meterReading': return '抄表'
    case 'room.checkout': return '退租'
    case 'attachment.upload': return '附件'
    default: return '同步'
  }
}

function formatSyncError(raw) {
  const text = String(raw || '')
  if (!text) return '未记录失败原因'
  if (text.includes('WEEKLY_SYNC_WAITING_FOR_WIFI')) return '当前网络不适合备份，已延后到下次可用时机'
  if (text.includes('timeout')) return '网络超时，等待稍后重试'
  if (text.includes('request:fail')) return '网络请求失败，等待稍后重试'
  if (text.includes('401')) return '云端未授权，需要重新建立登录会话'
  if (text.includes('404')) return '云端接口暂不可用，请稍后重试'
  if (text.includes('UPLOAD_FAILED')) return '文件上传失败，等待稍后重试'
  return text
}

function buildCollectionTitle(kind) {
  switch (kind) {
    case 'rent': return '房租收款'
    case 'water': return '水费收款'
    case 'electric': return '电费收款'
    case 'gas': return '燃气收款'
    case 'heating': return '供暖收款'
    default: return '附加收费'
  }
}

function exportTaskStatusLabel(status) {
  switch (String(status || '').toUpperCase()) {
    case 'PROCESSING': return '生成中'
    case 'SUCCEEDED': return '已完成'
    case 'FAILED': return '失败'
    default: return '待处理'
  }
}

function exportTaskStatusClass(status) {
  switch (String(status || '').toUpperCase()) {
    case 'PROCESSING': return 'bg-blue-50 text-blue-700 border border-blue-100'
    case 'SUCCEEDED': return 'bg-emerald-50 text-emerald-700 border border-emerald-100'
    case 'FAILED': return 'bg-rose-50 text-rose-700 border border-rose-100'
    default: return 'bg-slate-50 text-slate-600 border border-slate-200'
  }
}

function formatExportTaskTime(value) {
  if (!value) return '未记录时间'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')} ${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`
}
async function retryPendingSync() {
  refreshSyncSummary()
  if (!canUseCloudBackup()) {
    uni.showToast({ title: '当前未启用云端备份', icon: 'none' })
    return
  }
  if (!syncSummary.value.count) {
    uni.showToast({ title: '当前没有待备份数据', icon: 'none' })
    return
  }
  uni.showLoading({ title: '正在备份', mask: true })
  try {
    await processSyncQueue({ source: 'manual' })
    refreshSyncSummary()
    uni.showToast({ title: '已开始后台备份', icon: 'success' })
  } catch {
    refreshSyncSummary()
    uni.showToast({ title: '备份失败，请稍后重试', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

function updateSyncMode(mode) {
  const nextMode = setSyncMode(mode)
  syncMode.value = nextMode
  uni.showToast({ title: nextMode === 'manual' ? '已切换为仅手动同步' : '已开启自动同步', icon: 'none' })
}

function openSubPage(id) {
  const managerOnlyPages = ['utilityTemplate', 'autoReminder', 'exportReport']
  if (managerOnlyPages.includes(id) && !canManageTenantData.value) {
    uni.showToast({ title: '当前角色无权进入该页面', icon: 'none' })
    return
  }
  subPage.value = id
  if (id === 'exportReport') void loadCloudExportTasks()
}

function saveConfig() {
  if (!canManageTenantData.value) {
    uni.showToast({ title: '当前角色无权保存配置', icon: 'none' })
    return
  }
  const water = Number(utilityForm.value.waterPriceDefault)
  const electric = Number(utilityForm.value.electricPriceDefault)
  if (!(water > 0) || !(electric > 0)) {
    uni.showToast({ title: '请填写正确的单价', icon: 'none' })
    return
  }
  saveGlobalConfig({ waterPriceDefault: water, electricPriceDefault: electric })
  uni.showToast({ title: '已保存', icon: 'success' })
}

function saveReminder() {
  if (!canManageTenantData.value) {
    uni.showToast({ title: '当前角色无权保存设置', icon: 'none' })
    return
  }
  persistReminderSettings()
  uni.showToast({ title: '已保存', icon: 'success' })
}

async function loginTenant() {
  try {
    await loginWithWeChatProfile()
    selectedTenantId.value = users.value[0]?.id || ''
    uni.showToast({ title: '登录成功', icon: 'success' })
    refreshSyncSummary()
  } catch {
    uni.showToast({ title: '登录失败', icon: 'none' })
  }
}

async function switchTenantUser(userId) {
  try {
    await switchTenant(userId)
    selectedTenantId.value = userId
    reminderForm.value = loadReminderSettings()
    refreshSyncSummary()
    cloudExportTasks.value = getCachedCloudExportTasks()
    uni.showToast({ title: '已切换租户', icon: 'none' })
  } catch {
    uni.showToast({ title: '切换租户失败', icon: 'none' })
  }
}

function openAttachment(file, title, emptyTitle) {
  if (!file) {
    uni.showToast({ title: emptyTitle || '暂无资料', icon: 'none' })
    return
  }
  activeAttachment.value = file
  attachmentModalTitle.value = title || file.name || '资料预览'
  attachmentModalOpen.value = true
}

function openTemplatePreview(item) { openAttachment(item?.file, item?.name || '合同模板', '暂无模板') }
function closeAttachment() { attachmentModalOpen.value = false; activeAttachment.value = null; attachmentModalTitle.value = '' }
function previewAttachmentImage() { if (activeAttachment.value) previewChosenImage(activeAttachment.value) }
function resolveAttachmentImageSrc(file) { return resolveOfflineImageSrc(file) }

function logout() {
  logoutTenant()
  selectedTenantId.value = ''
  subPage.value = ''
  reminderForm.value = loadReminderSettings()
  refreshSyncSummary()
  uni.showToast({ title: '已退出登录', icon: 'none' })
}

function handleRoomPickerChange(event) {
  const index = Number(event?.detail?.value || 0)
  selectedExportRoomId.value = exportRoomOptions.value[index]?.id || ''
}

function buildCsvContent(rows) {
  const lines = ['房间,租客,项目,类型,金额,记收时间']
  rows.forEach((item) => {
    lines.push([
      item.roomNo,
      item.tenant || '未填写租客',
      item.title,
      item.kind === 'rent' ? '租金' : '附加费',
      Number(item.amount || 0).toFixed(2),
      item.payDate || '',
    ].map((field) => `"${String(field).replaceAll('"', '""')}"`).join(','))
  })
  lines.push('')
  lines.push(`"流水笔数","${exportPreviewSummary.value.count}"`)
  lines.push(`"租金合计","${fmtMoney(exportPreviewSummary.value.rentTotal)}"`)
  lines.push(`"附加费合计","${fmtMoney(exportPreviewSummary.value.utilityTotal)}"`)
  return lines.join('\n')
}

async function exportReportFile() {
  if (!canManageTenantData.value) {
    uni.showToast({ title: '当前角色无权导出数据', icon: 'none' })
    return
  }
  const rows = exportTransactions.value
  if (!rows.length) {
    uni.showToast({ title: '暂无可导出流水', icon: 'none' })
    return
  }
  if (isCloudConfigured.value) {
    try {
      const task = await withCloudBackupAccess(() => createCloudExportTask({ scope: exportMode.value, roomId: exportMode.value === 'room' ? selectedExportRoomId.value : '' }))
      await loadCloudExportTasks()
      if (task?.fileUrl) {
        await copyExportLink(task.fileUrl)
        uni.showToast({ title: '导出链接已复制', icon: 'success' })
      } else {
        uni.showToast({ title: '云端导出已生成', icon: 'success' })
      }
      return
    } catch {
      uni.showToast({ title: '云端导出失败，改用本地导出', icon: 'none' })
    }
  }
  const fs = getFileSystemManagerSafe()
  const userDataPath = getUserDataPathSafe()
  if (!fs || !userDataPath) {
    uni.showToast({ title: '当前环境不支持导出', icon: 'none' })
    return
  }
  const filePath = `${userDataPath}/irent_export_${Date.now()}.csv`
  try {
    fs.writeFileSync(filePath, `\ufeff${buildCsvContent(rows)}`, 'utf8')
    await uni.setClipboardData({ data: filePath })
    uni.showToast({ title: '文件已生成', icon: 'success' })
  } catch {
    uni.showToast({ title: '导出失败', icon: 'none' })
  }
}

async function loadCloudExportTasks() {
  if (!isCloudConfigured.value) {
    cloudExportTasks.value = getCachedCloudExportTasks()
    return
  }
  cloudExportLoading.value = true
  try {
    cloudExportTasks.value = await withCloudBackupAccess(() => fetchCloudExportTasks())
  } catch {
    cloudExportTasks.value = getCachedCloudExportTasks()
    uni.showToast({ title: '读取导出记录失败', icon: 'none' })
  } finally {
    cloudExportLoading.value = false
  }
}

async function copyExportLink(url) {
  try {
    await uni.setClipboardData({ data: url })
  } catch {
    uni.showToast({ title: '复制失败', icon: 'none' })
  }
}

function showTemplateUploadTip() { uni.showToast({ title: '该功能下一步完善', icon: 'none' }) }

onLoad(() => {
  headerTopPadding.value = getPageHeaderTopPadding(44)
  selectedTenantId.value = users.value[0]?.id || ''
  cloudExportTasks.value = getCachedCloudExportTasks()
  refreshSyncSummary()
})

onShow(() => {
  refreshSyncSummary()
  cloudExportTasks.value = getCachedCloudExportTasks()
})
</script>

<style>
.profile-hero { background: linear-gradient(135deg, #2563eb 0%, #3b82f6 58%, #60a5fa 100%); }
.profile-hero-chip { padding: 6rpx 14rpx; border-radius: 9999rpx; background: rgba(255,255,255,0.18); border: 0; font-size: 20rpx; line-height: 1.2; font-weight: 600; color: #eff6ff; }
.sync-chip { padding: 6rpx 14rpx; border-radius: 9999rpx; background: #f8fafc; border: 0; color: #475569; font-size: 20rpx; line-height: 1.2; font-weight: 600; }
.doc-input, .setting-input { width: 100%; min-height: 84rpx; padding: 0 24rpx; border-radius: 24rpx; border: 1rpx solid #e2e8f0; background: #f8fafc; color: #0f172a; font-size: 28rpx; font-weight: 500; box-sizing: border-box; }
.setting-input-center { text-align: center; }
.doc-placeholder { color: #94a3b8; }
.doc-badge { padding: 8rpx 16rpx; border-radius: 9999rpx; font-size: 20rpx; line-height: 1.2; font-weight: 600; }
.doc-badge-ok { color: #047857; background: #ecfdf5; border: 0; }
.doc-badge-empty { color: #64748b; background: #f8fafc; border: 0; }
.page-footer { padding: 12rpx 16rpx 20rpx; border-top: 1rpx solid rgba(226,232,240,0.72); background: rgba(248,250,252,0.96); }
.page-footer-primary { width: 100%; height: 88rpx; padding: 0; border-radius: 24rpx; background: #2563eb; color: #ffffff; font-size: 28rpx; font-weight: 700; line-height: 1; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
.preview-image { width: 100%; height: 360rpx; border-radius: 24rpx; background: #f8fafc; border: 1rpx solid #e2e8f0; }
.preview-empty { height: 360rpx; border-radius: 24rpx; background: #f8fafc; border: 1rpx solid #e2e8f0; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 26rpx; font-weight: 600; }
</style>
