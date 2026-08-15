
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
            ><image v-if="currentUser?.avatarUrl" :src="currentUser.avatarUrl" mode="aspectFill" class="profile-avatar-image" />{{ currentUser?.avatarUrl ? '' : profileInitial }}</view>
            <view class="min-w-0 flex-1">
              <view class="text-lg font-black truncate">{{ profileName }}</view>
              <view class="flex gap-1_5 mt-1_5 flex-wrap">
                <view class="profile-hero-chip">{{ currentUser ? '公共账户已登录' : '未登录' }}</view>
                <view class="profile-hero-chip">{{ tenantRoleLabel }}</view>
                <view class="profile-hero-chip">公共账户</view>
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

      <view v-if="subPage === 'allDocuments'" class="profile-doc-search shrink-0">
        <view class="profile-doc-search-row"><input v-model="docKeyword" class="doc-input" placeholder="搜索姓名、房号或手机号" placeholder-class="doc-placeholder" confirm-type="search" @confirm="docKeyword = docKeyword.trim()" /><button class="profile-doc-search-button" @click="docKeyword = docKeyword.trim()">搜索</button></view>
      </view>

      <scroll-view scroll-y class="page-scroll" :scroll-with-animation="true">
        <view class="p-4 stack-4" :style="{ paddingBottom: !subPage ? '176rpx' : '64rpx' }">
          <view v-if="!subPage" class="stack-4">
            <view class="overflow-hidden surface-card" :class="UI.card">
              <view class="p-3 stack-3">
                <view class="flex items-center justify-between gap-3">
                  <view class="min-w-0">
                    <view class="font-bold text-slate-800 text-sm">{{ currentUser ? '当前账户：admin' : '公共账户登录' }}</view>
                    <view class="text-3xs text-slate-400 mt-1">
                      {{ currentUser ? '当前为唯一公共管理账户。' : '点击登录即可进入公共管理账户。' }}
                    </view>
                  </view>
                  <button
                    v-if="!currentUser"
                    class="px-3 py-2 rounded-xl btn-blue text-xs font-semibold tap-scale shrink-0"
                    @click="loginTenant"
                  >登录</button>
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
              v-if="false"
              class="w-full py-3 rounded-xl bg-white border border-rose-200 text-rose-500 text-sm font-semibold tap-scale"
              @click="logout"
            >退出登录</button>
          </view>
          <view v-else-if="subPage === 'allDocuments'" class="stack-3">
            <view class="surface-card" :class="UI.card">
              <view class="doc-table-head"><text>租客</text><text>房间</text><text>状态</text><text>资料</text></view>
              <view v-if="filteredDocs.length" class="divide-y divide-slate-100">
                <view v-for="doc in pagedDocs" :key="doc.id" class="doc-list-row">
                  <view class="doc-tenant-cell"><view class="font-bold text-slate-900 text-sm truncate">{{ doc.tenantName || '未填写租客' }}</view></view>
                  <view class="doc-room-cell text-2xs text-slate-400 truncate">{{ doc.roomShortLabel }}</view>
                  <view class="doc-status-cell text-2xs text-slate-400 truncate">{{ doc.statusText }}</view>
                  <view class="doc-list-actions">
                    <button
                      class="flex-1 doc-file-button tap-scale"
                      :class="doc.identityFiles.length ? 'doc-file-button-ready' : 'doc-file-button-empty'"
                      @click="handleDocumentAction(doc, 'idCard')"
                    >{{ doc.identityFiles.length ? '查看身份证' : '补录身份证' }}</button>
                    <button
                      class="flex-1 doc-file-button tap-scale"
                      :class="doc.contractFiles.length ? 'doc-file-button-ready' : 'doc-file-button-empty'"
                      @click="handleDocumentAction(doc, 'contract')"
                    >{{ doc.contractFiles.length ? '查看合同' : '补录合同' }}</button>
                  </view>
                </view>
              </view>
              <view v-else class="p-6 text-center text-sm text-slate-400">暂无匹配的档案记录</view>
            </view>
            <view v-if="docTotalPages > 1" class="profile-pagination"><button class="profile-page-button" :disabled="docPage === 1" @click="docPage -= 1">上一页</button><text>{{ docPage }} / {{ docTotalPages }}</text><button class="profile-page-button" :disabled="docPage === docTotalPages" @click="docPage += 1">下一页</button></view>
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

          <view v-else-if="subPage === 'dataRestore'" class="stack-3">
            <view class="surface-card" :class="UI.card">
              <view class="p-4 text-xs text-slate-500 leading-6">
                每日中午 12:00、晚上 20:00 自动保留完整快照；每次业务操作结束 30 分钟后也会备份。快照包含房源、入住、账务、证件、合同及服务器本地附件，保留最近 3 天。
              </view>
            </view>
            <view class="surface-card" :class="UI.card">
              <view class="p-3 flex items-center justify-between gap-3 border-b border-slate-100">
                <view>
                  <view class="font-bold text-slate-800 text-sm">当前备份状态</view>
                  <view v-if="currentCloudBackup" class="text-3xs text-emerald-600 mt-1">当前版本 · {{ formatBackupTime(currentCloudBackup.createdAt) }}</view>
                  <view v-else class="text-3xs text-amber-600 mt-1">未备份 · 请手动备份或等待自动备份</view>
                </view>
                <button class="px-3 py-2 rounded-xl btn-blue text-xs font-semibold" :loading="cloudBackupCreating" @click="createManualBackup">立即备份</button>
              </view>
              <view class="p-3 flex items-center justify-between gap-3 border-b border-slate-100">
                <view><view class="font-bold text-slate-800 text-sm">可恢复的数据备份</view><view class="text-3xs text-slate-400 mt-1">最近 3 天 · {{ cloudBackups.length }} 个版本</view></view>
                <button class="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold" @click="loadCloudBackups">刷新</button>
              </view>
              <view v-if="cloudBackupLoading" class="p-5 text-center text-sm text-slate-400">正在读取备份…</view>
              <view v-else-if="cloudBackups.length" class="divide-y divide-slate-100">
                <view v-for="backup in cloudBackups" :key="backup.id" class="p-3 flex items-center justify-between gap-3">
                  <view class="min-w-0"><view class="font-bold text-slate-800 text-sm">{{ formatBackupTime(backup.createdAt) }}</view><view class="text-3xs text-emerald-600 mt-1">已备份 · {{ formatBackupReason(backup.reason) }}</view><view class="text-3xs text-slate-400 mt-1 truncate">房源 {{ backup.summary?.properties || 0 }} · 房间 {{ backup.summary?.rooms || 0 }} · 流水 {{ backup.summary?.collections || 0 }} · 附件 {{ backup.summary?.attachments || 0 }}</view></view>
                  <button class="shrink-0 px-3 py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-semibold" :loading="restoringBackupId === backup.id" @click="confirmRestoreBackup(backup)">恢复</button>
                </view>
              </view>
              <view v-else class="p-5 text-center text-sm text-slate-400">未备份。可点击“立即备份”，或等待定时与操作后自动备份。</view>
            </view>
          </view>

          <view v-else-if="subPage === 'exportReport'" class="stack-3">
            <view class="profile-export-toolbar">
              <view class="surface-card" :class="UI.card">
                <view class="p-4 text-xs text-slate-500 leading-6">
                  支持导出单个房间或全部房间的流水明细，并带租金与附加费汇总。
                </view>
              </view>

              <view class="surface-card mt-3" :class="UI.card">
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
            </view>
            <view class="surface-card" :class="UI.card">
              <view class="px-3 py-2 bg-slate-50 text-3xs font-semibold text-slate-500">导出流水（{{ exportTransactions.length }} 条）</view>
              <view class="export-table-head"><text>房间</text><text>项目</text><text>时间</text><text>金额</text></view>
              <view v-if="pagedExportTransactions.length" class="divide-y divide-slate-100">
                <view v-for="item in pagedExportTransactions" :key="item.id" class="export-table-row">
                  <view class="text-xs font-semibold text-slate-700 truncate">{{ item.roomNo }}</view>
                  <view class="min-w-0"><view class="text-xs font-semibold text-slate-700 truncate">{{ item.title }}</view><view class="text-2xs text-slate-400 truncate">{{ item.tenant || '未填写租客' }}</view></view>
                  <view class="text-2xs text-slate-400 font-mono truncate">{{ item.payDate || '-' }}</view>
                  <view class="font-mono text-xs font-bold text-emerald-700 text-right">¥{{ fmtMoney(item.amount) }}</view>
                </view>
              </view>
              <view v-else class="p-4 text-center text-sm text-slate-400">暂无流水</view>
            </view>
            <view v-if="exportTotalPages > 1" class="profile-pagination"><button class="profile-page-button" :disabled="exportPage === 1" @click="exportPage -= 1">上一页</button><text>{{ exportPage }} / {{ exportTotalPages }}</text><button class="profile-page-button" :disabled="exportPage === exportTotalPages" @click="exportPage += 1">下一页</button></view>
            <view v-if="exportFilePath" class="export-file-path">已生成文件：{{ exportFilePath }}</view>
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

      <view v-if="!isLoggedIn" class="absolute inset-0 z-50 bg-slate-50 flex items-center justify-center px-8">
        <view class="w-full rounded-3xl bg-white p-6 text-center shadow-soft">
          <view class="text-lg font-black text-slate-900">登录公共账户</view>
          <view class="mt-2 text-sm text-slate-400">登录后可查看房源、账务和租客资料。</view>
          <button class="mt-5 w-full py-3 rounded-xl btn-blue text-sm font-semibold" @click="loginTenant">立即登录</button>
        </view>
      </view>

    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { createCloudExportTask, fetchCloudExportTasks, getCachedCloudExportTasks } from '../../api/exports.js'
import { createCloudBackup, fetchCloudBackupState, getCachedCloudBackupState, restoreCloudBackup } from '../../api/backups.js'
import { fetchFullPropertiesSnapshot } from '../../api/properties.js'
import { canUseCloudBackup, hasCloudApiBaseUrl, isCloudApiConfigured, withCloudBackupAccess } from '../../config/cloud'
import {
  buildTenantStorageKey,
  canManageTenantData,
  currentProfile,
  currentTenantRole,
  currentUser,
  isLoggedIn,
  loginPublicAccount,
  logoutTenant,
  switchTenant,
  users,
} from '../../data/authStore.js'
import { cloneProperties, globalConfig, properties, saveGlobalConfig, setProperties } from '../../data/rentStore'
import { buildBillEntriesSnapshot } from '../../data/billSnapshots.js'
import { ATTACHMENT_FILE_LIMITS } from '../../domain/rent-models.js'
import { clearPendingSyncTasks, enqueueSyncTask, getPendingSyncSummary, getSyncMode, processSyncQueue, setSyncMode } from '../../data/syncQueue.js'
import { UI } from '../../ui/ui'
import { getPageHeaderTopPadding } from '../../utils/layout'
import { chooseImages, previewChosenImages } from '../../utils/media'
import { getFileSystemManagerSafe, getUserDataPathSafe } from '../../utils/platform-files'

const REMINDER_STORAGE_KEY = 'irent_reminder_settings_v1'

const headerTopPadding = ref(44)
const subPage = ref('')
const docKeyword = ref('')
const docPage = ref(1)
const exportPage = ref(1)
const exportFilePath = ref('')
const PAGE_SIZE = 20
const selectedTenantId = ref('')
const cloudExportTasks = ref([])
const cloudExportLoading = ref(false)
const cloudBackups = ref([])
const cloudBackupLoading = ref(false)
const cloudBackupCreating = ref(false)
const restoringBackupId = ref('')
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
const currentCloudBackup = ref(null)
const profileName = computed(() => currentUser.value?.nickName || currentProfile.value?.nickName || '微信用户')
const profileInitial = computed(() => currentUser.value ? '管' : '访')
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
  autoReminder: '到期提醒机制',
  dataRestore: '数据恢复',
  exportReport: '数据报表导出',
}[subPage.value] || '我的'))

const pageSubtitle = computed(() => ({
  allDocuments: '按姓名、房号、手机号搜索',
  utilityTemplate: '统一模板，房间可覆盖',
  autoReminder: '仅自我管理，不生成催缴文案',
  dataRestore: '恢复最近 3 天内的完整数据快照',
  exportReport: '导出 Excel 存档',
}[subPage.value] || '账号与基础设置'))

const menuA = [
  { id: 'allDocuments', label: '租客证件与合同归档', desc: '查看身份证、合同与归档状态', icon: '档', bg: 'bg-blue-50', color: 'text-blue-600' },
  { id: 'utilityTemplate', label: '默认水电单价模板', desc: '统一配置默认水电价格', icon: '水', bg: 'bg-amber-50', color: 'text-amber-600', managerOnly: true },
  { id: 'dataRestore', label: '数据恢复', desc: '恢复最近 3 天的云端完整备份', icon: '复', bg: 'bg-violet-50', color: 'text-violet-600', managerOnly: true },
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
          const roomLabel = `${property.name} · ${block.name} · ${room.roomNo}`
          const roomShortLabel = `${block.name} · ${room.roomNo}`
          const addDocument = (occupancy, attachmentFiles, statusText) => {
            if (!occupancy?.tenant && !room.tenant) return
            const files = attachmentFiles || {}
            docs.push({
              id: `${room.id}_${occupancy?.id || 'current'}`,
              roomId: room.id,
              propertyId: property.id,
              blockId: block.id,
              occupancyId: occupancy?.id || '',
              isActiveOccupancy: occupancy?.status === 'active' || (!occupancy && room.status !== 'empty'),
              tenantName: occupancy?.tenant || room.tenantName || room.tenant || '',
              phone: occupancy?.phone || room.phone || room.tenantPhone || '',
              roomLabel,
              roomShortLabel,
              statusText,
              identityFiles: Array.isArray(files.idCard) ? files.idCard : (files.idCard ? [files.idCard] : []),
              contractFiles: Array.isArray(files.contract) ? files.contract : (files.contract ? [files.contract] : []),
            })
          }
          const occupancies = (room.occupancies || []).filter((item) => item.kind === 'lease')
          if (occupancies.length) {
            occupancies.forEach((occupancy) => addDocument(
              occupancy,
              occupancy.status === 'active' ? room.attachmentFiles : (occupancy.archive?.attachmentFiles || occupancy.attachmentFiles),
              occupancy.status === 'active' ? '在住' : '已退租归档',
            ))
          } else if (room.tenant) {
            addDocument(null, room.attachmentFiles, room.status === 'empty' ? '空置归档' : '在住')
          }
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
const docTotalPages = computed(() => Math.max(1, Math.ceil(filteredDocs.value.length / PAGE_SIZE)))
const pagedDocs = computed(() => filteredDocs.value.slice((docPage.value - 1) * PAGE_SIZE, docPage.value * PAGE_SIZE))
watch(filteredDocs, () => { docPage.value = 1 })


const exportTransactions = computed(() => {
  const targetRoomId = exportMode.value === 'room' ? selectedExportRoomId.value : ''
  const roomLocations = new Map()
  for (const property of properties.value) {
    for (const block of property.blocks || []) {
      for (const floor of block.floors || []) {
        for (const room of floor.rooms || []) {
          roomLocations.set(room.id, {
            propertyName: property.name || '',
            blockName: block.name || '',
            roomNo: room.roomNo || '',
          })
        }
      }
    }
  }
  return buildBillEntriesSnapshot(properties.value).entries
    .filter((item) => !targetRoomId || item.roomId === targetRoomId)
    .map((item) => ({ ...item, ...(roomLocations.get(item.roomId) || {}), payDate: item.payDate || '' }))
    .sort((a, b) => String(b.payDate || '').localeCompare(String(a.payDate || '')))
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
const exportTotalPages = computed(() => Math.max(1, Math.ceil(exportTransactions.value.length / PAGE_SIZE)))
const pagedExportTransactions = computed(() => exportTransactions.value.slice((exportPage.value - 1) * PAGE_SIZE, exportPage.value * PAGE_SIZE))
watch(exportTransactions, () => { exportPage.value = 1 })

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
  if (!isLoggedIn.value) {
    uni.showToast({ title: '请先登录后再操作', icon: 'none' })
    return
  }
  const managerOnlyPages = ['utilityTemplate', 'autoReminder', 'dataRestore', 'exportReport']
  if (managerOnlyPages.includes(id) && !canManageTenantData.value) {
    uni.showToast({ title: '当前角色无权进入该页面', icon: 'none' })
    return
  }
  subPage.value = id
  if (id === 'exportReport') void loadCloudExportTasks()
  if (id === 'dataRestore') void loadCloudBackups()
}

function formatBackupTime(value) {
  if (!value) return '未知时间'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')} ${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`
}

function formatBackupReason(reason) {
  return {
    scheduled_noon: '定时备份（12:00）',
    scheduled_evening: '定时备份（20:00）',
    activity_quiet: '操作后静默备份',
    manual: '手动备份',
  }[String(reason || '')] || '完整备份'
}

async function loadCloudBackups() {
  if (!isCloudConfigured.value) return
  cloudBackupLoading.value = true
  try {
    const state = await withCloudBackupAccess(() => fetchCloudBackupState())
    cloudBackups.value = state.items
    currentCloudBackup.value = state.currentBackup
  } catch {
    uni.showToast({ title: '读取备份失败，请稍后重试', icon: 'none' })
  } finally {
    cloudBackupLoading.value = false
  }
}

async function createManualBackup() {
  if (cloudBackupCreating.value) return
  cloudBackupCreating.value = true
  uni.showLoading({ title: '正在创建备份', mask: true })
  try {
    await withCloudBackupAccess(() => createCloudBackup())
    await loadCloudBackups()
    uni.showToast({ title: '备份已完成', icon: 'success' })
  } catch {
    uni.showToast({ title: '备份失败，请稍后重试', icon: 'none' })
  } finally {
    cloudBackupCreating.value = false
    uni.hideLoading()
  }
}

async function confirmRestoreBackup(backup) {
  if (restoringBackupId.value) return
  const confirmed = await new Promise((resolve) => uni.showModal({
    title: '确认恢复数据？',
    content: `将恢复到 ${formatBackupTime(backup.createdAt)} 的状态，当前共享数据会被覆盖。恢复前会自动备份当前状态。`,
    confirmText: '确认恢复',
    confirmColor: '#d97706',
    success: (result) => resolve(Boolean(result.confirm)),
    fail: () => resolve(false),
  }))
  if (!confirmed) return
  restoringBackupId.value = backup.id
  uni.showLoading({ title: '正在恢复数据', mask: true })
  try {
    await withCloudBackupAccess(() => restoreCloudBackup(backup.id))
    // A restored snapshot supersedes every offline mutation still waiting on this device.
    clearPendingSyncTasks()
    setProperties(await fetchFullPropertiesSnapshot())
    refreshSyncSummary()
    await loadCloudBackups()
    uni.showToast({ title: '数据已恢复', icon: 'success' })
  } catch {
    uni.showToast({ title: '恢复失败，请稍后重试', icon: 'none' })
  } finally {
    restoringBackupId.value = ''
    uni.hideLoading()
  }
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
    loginPublicAccount()
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

async function handleDocumentAction(doc, type) {
  const documentFiles = type === 'idCard' ? doc.identityFiles : doc.contractFiles
  if (documentFiles.length) {
    if (!previewChosenImages(documentFiles)) uni.showToast({ title: '当前文件暂不支持预览', icon: 'none' })
    return
  }
  if (!canManageTenantData.value) return uni.showToast({ title: '当前角色无权补录资料', icon: 'none' })
  try {
    const fileKey = type === 'idCard' ? 'idCard' : 'contract'
    const fileLimit = ATTACHMENT_FILE_LIMITS[fileKey] || 1
    const selected = await chooseImages({ fallbackPrefix: fileKey, count: fileLimit })
    if (!selected.length) return
    const nextProperties = cloneProperties()
    let targetRoom = null
    for (const property of nextProperties) {
      for (const block of property.blocks || []) {
        for (const floor of block.floors || []) {
          const found = (floor.rooms || []).find((room) => room.id === doc.roomId)
          if (found) { targetRoom = found; break }
        }
        if (targetRoom) break
      }
      if (targetRoom) break
    }
    if (!targetRoom) return uni.showToast({ title: '房间资料不存在', icon: 'none' })
    const prepared = selected.map((picked, index) => ({
      ...picked,
      id: picked.id || `${fileKey}_${Date.now()}_${index}`,
      uploadedAt: picked.uploadedAt || new Date().toISOString().slice(0, 16).replace('T', ' '),
    }))
    const occupancy = (targetRoom.occupancies || []).find((item) => item.id === doc.occupancyId)
    if (occupancy && occupancy.status !== 'active') {
      occupancy.archive = occupancy.archive || {}
      occupancy.archive.attachmentFiles = occupancy.archive.attachmentFiles || { idCard: [], contract: [] }
      const files = occupancy.archive.attachmentFiles[fileKey]
      occupancy.archive.attachmentFiles[fileKey] = (Array.isArray(files) ? files : (files ? [files] : [])).concat(prepared).slice(0, fileLimit)
    } else {
      targetRoom.attachmentFiles = targetRoom.attachmentFiles || { idCard: [], contract: [] }
      const files = targetRoom.attachmentFiles[fileKey]
      targetRoom.attachmentFiles[fileKey] = (Array.isArray(files) ? files : (files ? [files] : [])).concat(prepared).slice(0, fileLimit)
      if (fileKey === 'idCard') targetRoom.hasIdCardPic = true
      else targetRoom.hasContract = true
      if (occupancy) occupancy.attachmentFiles = { ...targetRoom.attachmentFiles }
    }
    setProperties(nextProperties)
    if (canUseCloudBackup()) {
      prepared.forEach((file) => enqueueSyncTask({
        type: 'attachment.upload',
        propertyId: doc.propertyId,
        blockId: doc.blockId,
        roomId: doc.roomId,
        payload: { type: fileKey, file },
      }))
    }
    uni.showToast({ title: '资料已补录', icon: 'success' })
  } catch (error) {
    if (!String(error?.errMsg || '').includes('cancel')) uni.showToast({ title: '选择图片失败', icon: 'none' })
  }
}

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
  const lines = ['iRent 收款流水报表']
  lines.push(`导出时间,${new Date().toLocaleString()}`)
  lines.push(`导出范围,${exportMode.value === 'room' ? selectedExportRoomLabel.value : '全部房间'}`)
  lines.push('')
  lines.push('院落,楼栋,房间,租客,项目,类型,金额,记收时间')
  rows.forEach((item) => {
    lines.push([
      item.propertyName,
      item.blockName,
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
    let savedPath = filePath
    if (typeof uni.saveFile === 'function') {
      try {
        const saved = await new Promise((resolve, reject) => uni.saveFile({ tempFilePath: filePath, success: resolve, fail: reject }))
        savedPath = saved?.savedFilePath || filePath
      } catch {
        // USER_DATA_PATH is already persistent; some mini-program runtimes only
        // allow saveFile for temporary paths.
      }
    }
    await uni.setClipboardData({ data: savedPath })
    exportFilePath.value = savedPath
    uni.showToast({ title: '报表已生成，路径已复制', icon: 'success' })
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


onLoad(() => {
  headerTopPadding.value = getPageHeaderTopPadding(44)
  selectedTenantId.value = users.value[0]?.id || ''
  cloudExportTasks.value = getCachedCloudExportTasks()
  const cachedBackupState = getCachedCloudBackupState()
  cloudBackups.value = cachedBackupState.items
  currentCloudBackup.value = cachedBackupState.currentBackup
  refreshSyncSummary()
})

onShow(() => {
  refreshSyncSummary()
  cloudExportTasks.value = getCachedCloudExportTasks()
  if (!cloudBackups.value.length) {
    const cachedBackupState = getCachedCloudBackupState()
    cloudBackups.value = cachedBackupState.items
    currentCloudBackup.value = cachedBackupState.currentBackup
  }
})
</script>

<style>
.profile-hero { background: linear-gradient(135deg, #2563eb 0%, #3b82f6 58%, #60a5fa 100%); }
.profile-hero-chip { padding: 6rpx 14rpx; border-radius: 9999rpx; background: rgba(255,255,255,0.18); border: 0; font-size: 20rpx; line-height: 1.2; font-weight: 600; color: #eff6ff; }.profile-avatar-image { width: 96rpx; height: 96rpx; border-radius: 999rpx; }
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
.profile-doc-search { padding: 16rpx 32rpx; background: rgba(248,250,252,.98); border-bottom: 1rpx solid #e2e8f0; }.profile-doc-search-row { display: flex; align-items: center; gap: 12rpx; }.profile-doc-search-row .doc-input { flex: 1; min-width: 0; }.profile-doc-search-button { width: 96rpx; height: 76rpx; padding: 0; border-radius: 20rpx; background: #2563eb; color: #fff; font-size: 24rpx; font-weight: 600; display: flex; align-items: center; justify-content: center; }
.profile-export-toolbar { position: sticky; top: 0; z-index: 12; padding-bottom: 8rpx; background: #f8fafc; }
.export-table-head,.export-table-row { display: grid; grid-template-columns: 64rpx minmax(0,1.3fr) minmax(0,1.35fr) minmax(0,.85fr); gap: 12rpx; align-items: center; }.export-table-head { padding: 16rpx 24rpx; background: #f8fafc; color: #94a3b8; font-size: 20rpx; font-weight: 600; }.export-table-row { padding: 18rpx 24rpx; }
.doc-table-head,.doc-list-row { display: grid; grid-template-columns: minmax(0,.8fr) minmax(0,1.1fr) 86rpx 252rpx; gap: 12rpx; align-items: center; }.doc-table-head { padding: 16rpx 20rpx; background: #f8fafc; color: #94a3b8; font-size: 20rpx; font-weight: 600; }.doc-list-row { padding: 18rpx 20rpx; }.doc-tenant-cell,.doc-room-cell,.doc-status-cell { min-width: 0; }.doc-list-actions { display: flex; gap: 8rpx; }.doc-list-actions .doc-file-button { width: 122rpx; min-width: 0; }
.doc-file-button { height: 54rpx; border-radius: 14rpx; font-size: 20rpx; font-weight: 600; display: flex; align-items: center; justify-content: center; }.doc-file-button-ready { background: #dcfce7; color: #166534; }.doc-file-button-empty { background: #f8fafc; color: #94a3b8; }
.profile-pagination { display: flex; align-items: center; justify-content: center; gap: 20rpx; color: #64748b; font-size: 22rpx; font-weight: 600; }.profile-page-button { min-width: 116rpx; height: 58rpx; border-radius: 16rpx; background: #fff; color: #334155; border: 1rpx solid #e2e8f0; font-size: 22rpx; }.profile-page-button[disabled] { color: #cbd5e1; background: #f8fafc; }.export-file-path { padding: 18rpx; border-radius: 18rpx; background: #f8fafc; color: #64748b; font-size: 20rpx; line-height: 1.4; word-break: break-all; }
</style>
