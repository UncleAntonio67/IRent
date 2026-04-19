<template>
  <view class="h-screen bg-slate-50 text-slate-800">
    <view class="mx-auto max-w-md h-screen flex flex-col shadow-2xl bg-slate-50 relative overflow-hidden">
      <view class="bg-white-80 border-b px-5 pb-3 border-slate-200-60 relative shrink-0 sticky-header z-20 shadow-soft" :style="{ paddingTop: headerTopPadding + 'px' }">
        <view class="flex items-center justify-between gap-3">
          <view class="flex items-center gap-3 min-w-0">
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
        </view>

        <view v-if="!subPage" class="mt-3 p-4 rounded-2xl profile-hero text-white relative overflow-hidden border border-white-20 shadow-soft">
          <view class="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white-20"></view>
          <view class="absolute -right-2 -top-2 w-28 h-28 rounded-full bg-white-20"></view>
          <view class="absolute -right-6 -bottom-8 text-8xl font-semibold opacity-10 pointer-events-none select-none">我</view>

          <view class="flex items-center gap-3 relative z-10">
            <view class="w-12 h-12 bg-white-20 rounded-full flex items-center justify-center text-white font-semibold text-lg border border-white-20">{{ profileInitial }}</view>
            <view class="min-w-0">
              <view class="text-lg font-black truncate">{{ profileName }}</view>
              <view class="flex gap-1_5 mt-1_5 flex-wrap">
                <view class="profile-hero-chip">{{ currentUser ? '微信已登录' : '本地访客' }}</view>
                <view class="profile-hero-chip">租户隔离</view>
                <view class="profile-hero-chip">R2 存储</view>
              </view>
            </view>
          </view>

          <view class="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-white-20 relative z-10">
            <view class="text-center">
              <view class="text-xl font-black font-mono">{{ stats.propertyCount }}</view>
              <view class="text-3xs text-slate-200 font-medium mt-1">管理院落</view>
            </view>
            <view class="text-center border-l border-white-20">
              <view class="text-xl font-black font-mono">{{ stats.totalRooms }}</view>
              <view class="text-3xs text-slate-200 font-medium mt-1">总房间</view>
            </view>
            <view class="text-center border-l border-white-20">
              <view class="text-xl font-black font-mono text-blue-200">{{ stats.rentedRooms }}</view>
              <view class="text-3xs text-slate-200 font-medium mt-1">已入住</view>
            </view>
          </view>
        </view>
      </view>

      <scroll-view :scroll-y="Boolean(subPage)" class="page-scroll" :scroll-with-animation="true">
        <view class="p-4 stack-4" :style="{ paddingBottom: !subPage ? '16rpx' : '32rpx' }">
          <view v-if="!subPage" class="stack-4">
            <view class="overflow-hidden surface-card" :class="UI.card">
              <view class="p-3">
                <view class="flex items-center justify-between gap-3">
                  <view class="min-w-0">
                    <view class="font-bold text-slate-800 text-sm">{{ currentUser ? '当前租户' : '微信登录' }}</view>
                    <view class="text-3xs text-slate-400 mt-1">{{ currentUser ? '切换后将自动切到该租户的独立数据' : '登录后每个微信用户拥有自己的完整数据空间' }}</view>
                  </view>
                  <button v-if="!currentUser" class="px-3 py-2 rounded-xl btn-blue text-xs font-semibold tap-scale shrink-0" @click="loginTenant">微信登录</button>
                </view>
                <view v-if="users.length" class="mt-3 flex gap-2 overflow-x-auto whitespace-nowrap">
                  <button
                    v-for="user in users"
                    :key="user.id"
                    class="px-3 py-2 rounded-xl border text-xs font-semibold tap-scale shrink-0"
                    :class="currentUser?.id === user.id ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'"
                    @click="switchTenantUser(user.id)"
                  >{{ user.nickName }}</button>
                </view>
              </view>
            </view>

            <view class="overflow-hidden surface-card" :class="UI.card">
              <view v-for="(item, i) in menuA" :key="item.id" class="p-3 flex items-center justify-between tap-scale" :class="i !== menuA.length - 1 ? 'border-b border-slate-100' : ''" @click="openSubPage(item.id)">
                <view class="flex items-center gap-3 min-w-0">
                  <view class="w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-sm shadow-soft" :class="item.bg">
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
              <view v-for="(item, i) in menuB" :key="item.id" class="p-3 flex items-center justify-between tap-scale" :class="i !== menuB.length - 1 ? 'border-b border-slate-100' : ''" @click="openSubPage(item.id)">
                <view class="flex items-center gap-3 min-w-0">
                  <view class="w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-sm shadow-soft" :class="item.bg">
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

            <view v-if="currentUser" class="pt-1">
              <button class="w-full py-3 rounded-xl profile-logout-button text-sm font-semibold tap-scale" @click="logout">退出登录</button>
            </view>
          </view>

          <view v-else-if="subPage === 'allDocuments'" class="stack-4">
            <view class="flex items-center gap-2">
              <view class="flex-1 profile-search-field">
                <input
                  v-model="docSearchDraft"
                  type="text"
                  confirm-type="search"
                  @confirm="applyDocSearch"
                  class="w-full text-xs font-medium text-slate-700 profile-search-input"
                  placeholder="搜索姓名、房号或手机号"
                  placeholder-class="profile-search-placeholder"
                />
              </view>
              <button class="rounded-xl btn-blue text-xs font-semibold tap-scale profile-search-button" @click="applyDocSearch">查询</button>
            </view>

            <view v-if="filteredDocs.length === 0" class="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-slate-400 font-medium text-sm">暂无匹配的档案记录</view>

            <view v-else class="stack-3">
              <view v-for="doc in filteredDocs" :key="doc.id" class="p-3 rounded-xl surface-card">
                <view class="flex justify-between items-center mb-2 border-b border-slate-100 pb-2 gap-3">
                  <view class="min-w-0">
                    <view class="font-bold text-slate-800 text-sm truncate">{{ doc.roomNo }} · {{ doc.tenant || '未录入租客' }}</view>
                    <view class="text-2xs text-slate-400 mt-0_5 truncate">{{ doc.propertyName }} - {{ doc.blockName }}</view>
                  </view>
                  <view class="text-xs text-slate-500 font-mono shrink-0">{{ doc.phone || '-' }}</view>
                </view>
                <view class="flex gap-2 mb-2">
                  <view class="px-2 py-1 rounded-lg text-3xs font-semibold border" :class="doc.hasIdCardPic ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-400 border-slate-200'">{{ doc.hasIdCardPic ? '身份证已归档' : '身份证缺失' }}</view>
                  <view class="px-2 py-1 rounded-lg text-3xs font-semibold border" :class="doc.hasContract ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-200'">{{ doc.hasContract ? '合同已归档' : '合同缺失' }}</view>
                </view>
                <view class="flex gap-2">
                  <button class="flex-1 py-1_5 rounded-xl text-xs font-semibold tap-scale" :class="doc.hasIdCardPic ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-slate-50 text-slate-400 border border-slate-200'" :disabled="!doc.hasIdCardPic" @click="openAttachment('idCard', doc)">{{ doc.hasIdCardPic ? '查看身份证' : '暂无证件' }}</button>
                  <button class="flex-1 py-1_5 rounded-xl text-xs font-semibold tap-scale" :class="doc.hasContract ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-slate-50 text-slate-400 border border-slate-200'" :disabled="!doc.hasContract" @click="openAttachment('contract', doc)">{{ doc.hasContract ? '查看电子合同' : '暂无合同' }}</button>
                </view>
              </view>
            </view>
          </view>

          <view v-else-if="subPage === 'utilityTemplate'" class="stack-4">
            <view class="p-5 rounded-2xl bg-orange-50 border border-orange-200">
              <view class="flex items-start gap-3">
                <view class="w-9 h-9 rounded-xl bg-white text-orange-500 flex items-center justify-center font-semibold shadow-soft shrink-0">水</view>
                <view class="text-sm text-orange-800 font-medium leading-relaxed">设置全局默认水电单价。调整后仅影响以后新生成的计费，以前已生成的费用不回写。</view>
              </view>
            </view>

            <view class="p-5 rounded-2xl surface-card">
              <view class="font-bold text-slate-900">默认水电单价模板</view>
              <view class="grid grid-cols-2 gap-3 mt-4">
                <view class="p-4 rounded-2xl surface-muted">
                  <view class="text-xs text-slate-500 font-bold">水费（元/吨）</view>
                  <input v-model="form.waterPriceDefault" type="number" class="mt-2 w-full px-3 py-3 input-soft rounded-xl font-mono text-center" />
                </view>
                <view class="p-4 rounded-2xl surface-muted">
                  <view class="text-xs text-slate-500 font-bold">电费（元/度）</view>
                  <input v-model="form.electricPriceDefault" type="number" class="mt-2 w-full px-3 py-3 input-soft rounded-xl font-mono text-center" />
                </view>
              </view>
            </view>
            <view class="h-20"></view>
          </view>

          <view v-else-if="subPage === 'contractLibrary'" class="stack-4">
            <button class="w-full py-6 rounded-2xl bg-white border-2 border-indigo-200 border-dashed text-indigo-600 font-semibold tap-scale flex flex-col items-center justify-center gap-2" @click="toastSoon">
              <view class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold text-xl">合</view>
              上传新的合同模板扫描件
            </button>

            <view class="overflow-hidden surface-card" :class="UI.card">
              <view class="p-4 border-b border-slate-100 bg-slate-50">
                <view class="text-xs font-bold text-slate-500">已归档的标准模板库</view>
              </view>
              <view>
                <view v-for="(tpl, i) in contractTemplates" :key="tpl.id" class="p-4 flex items-center justify-between gap-3" :class="i !== contractTemplates.length - 1 ? 'border-b border-slate-100' : ''">
                  <view class="flex items-center gap-3 min-w-0">
                    <view class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold text-sm shrink-0">文</view>
                    <view class="min-w-0">
                      <view class="font-bold text-slate-800 text-sm truncate">{{ tpl.title }}</view>
                      <view class="text-2xs text-slate-400 font-medium mt-1">最近使用 {{ tpl.lastUsed }}</view>
                    </view>
                  </view>
                  <button class="px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold border border-blue-200 tap-scale" @click="openTemplatePreview(tpl)">预览</button>
                </view>
              </view>
            </view>
          </view>

          <view v-else-if="subPage === 'autoReminder'" class="stack-4">
            <view class="p-5 rounded-2xl bg-amber-50 border border-amber-200">
              <view class="flex items-start gap-3">
                <view class="w-9 h-9 rounded-xl bg-white text-amber-500 flex items-center justify-center font-semibold shadow-soft shrink-0">提</view>
                <view class="text-sm text-amber-800 font-medium leading-relaxed">当前只做自我提醒管理，不生成催缴文案，也不向微信外部推送消息。</view>
              </view>
            </view>

            <view class="p-5 rounded-2xl surface-card stack-5">
              <view class="flex justify-between items-center gap-3">
                <view class="min-w-0">
                  <view class="font-bold text-slate-800 text-base">到期前 3 天提醒</view>
                  <view class="text-xs text-slate-400 font-medium mt-1">提醒自己提前准备收款</view>
                </view>
                <view class="w-12 h-7 rounded-full p-1 transition-colors shrink-0" :class="reminderForm.advance ? 'bg-amber-500' : 'bg-slate-200'" @click="reminderForm.advance = !reminderForm.advance"><view class="w-5 h-5 bg-white rounded-full transition-transform shadow-soft" :class="reminderForm.advance ? 'translate-x-5' : 'translate-x-0'"></view></view>
              </view>

              <view class="border-t border-slate-100"></view>

              <view class="flex justify-between items-center gap-3">
                <view class="min-w-0">
                  <view class="font-bold text-slate-800 text-base">到期当天提醒</view>
                  <view class="text-xs text-slate-400 font-medium mt-1">账单到期当天再次提示</view>
                </view>
                <view class="w-12 h-7 rounded-full p-1 transition-colors shrink-0" :class="reminderForm.overdue ? 'bg-rose-500' : 'bg-slate-200'" @click="reminderForm.overdue = !reminderForm.overdue"><view class="w-5 h-5 bg-white rounded-full transition-transform shadow-soft" :class="reminderForm.overdue ? 'translate-x-5' : 'translate-x-0'"></view></view>
              </view>

              <view class="border-t border-slate-100"></view>

              <view class="flex justify-between items-center gap-3">
                <view class="min-w-0">
                  <view class="font-bold text-slate-800 text-base">逾期 3 天标记</view>
                  <view class="text-xs text-slate-400 font-medium mt-1">用于标记需要重点跟进的房间</view>
                </view>
                <view class="w-12 h-7 rounded-full p-1 transition-colors shrink-0" :class="reminderForm.warnThreeDays ? 'bg-rose-600' : 'bg-slate-200'" @click="reminderForm.warnThreeDays = !reminderForm.warnThreeDays"><view class="w-5 h-5 bg-white rounded-full transition-transform shadow-soft" :class="reminderForm.warnThreeDays ? 'translate-x-5' : 'translate-x-0'"></view></view>
              </view>
            </view>
            <view class="h-20"></view>
          </view>

          <view v-else-if="subPage === 'exportReport'" class="stack-4">
            <view class="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
              <view class="flex items-center gap-3">
                <view class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 font-semibold text-base border border-emerald-100 shadow-soft shrink-0">表</view>
                <view class="text-sm text-emerald-800 font-medium leading-relaxed">支持导出单个房间或全部房间的完整流水，并附汇总行，便于对账与留档。</view>
              </view>
            </view>

            <view class="p-5 rounded-2xl surface-card stack-4">
              <view>
                <view class="text-sm font-bold text-slate-800">导出范围</view>
                <view class="text-xs text-slate-400 font-medium mt-1">可导出全部房间流水，也可按房间单独导出。</view>
              </view>
              <view class="p-4 rounded-2xl surface-muted">
                <view class="text-xs text-slate-500 font-bold">导出模式</view>
                <view class="flex gap-2 mt-2">
                  <button class="flex-1 py-3 rounded-xl border text-sm font-semibold tap-scale" :class="exportMode==='all' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'" @click="exportMode='all'">全部房间</button>
                  <button class="flex-1 py-3 rounded-xl border text-sm font-semibold tap-scale" :class="exportMode==='room' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'" @click="exportMode='room'">单个房间</button>
                </view>
              </view>
              <view v-if="exportMode==='room'" class="p-4 rounded-2xl surface-muted">
                <view class="text-xs text-slate-500 font-bold">选择房间</view>
                <scroll-view scroll-x class="mt-2 whitespace-nowrap">
                  <view class="inline-flex gap-2">
                    <button
                      v-for="item in exportRoomOptions"
                      :key="item.key"
                      class="px-3 py-2 rounded-xl border text-xs font-semibold tap-scale shrink-0"
                      :class="selectedExportRoomKey===item.key ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'"
                      @click="selectedExportRoomKey=item.key"
                    >{{ item.label }}</button>
                  </view>
                </scroll-view>
              </view>
              <view class="p-4 rounded-2xl surface-muted">
                <view class="text-xs text-slate-500 font-bold">导出内容</view>
                <view class="text-sm text-slate-700 font-medium mt-2 leading-relaxed">包含日期、房间、租客、类型、标题、金额、凭证状态及汇总数据。</view>
              </view>
              <view v-if="exportPreviewSummary" class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <view class="text-xs text-emerald-700 font-bold">汇总预览</view>
                <view class="grid grid-cols-3 gap-3 mt-3">
                  <view><view class="text-2xs text-emerald-700">流水笔数</view><view class="text-sm font-semibold text-emerald-900 mt-1">{{ exportPreviewSummary.count }}</view></view>
                  <view><view class="text-2xs text-emerald-700">租金合计</view><view class="text-sm font-semibold text-emerald-900 mt-1">￥{{ exportPreviewSummary.rent }}</view></view>
                  <view><view class="text-2xs text-emerald-700">附加费合计</view><view class="text-sm font-semibold text-emerald-900 mt-1">￥{{ exportPreviewSummary.extra }}</view></view>
                </view>
              </view>
            </view>
            <view class="h-20"></view>
          </view>

          <view v-else class="stack-4">
            <view class="p-5 rounded-2xl surface-card">
              <view class="font-bold text-slate-900">该功能下一步完善</view>
              <view class="text-sm text-slate-600 font-medium leading-relaxed mt-2">当前优先保证房态、记账、档案和历史追溯的闭环稳定，后续再补更完整的业务能力。</view>
            </view>
          </view>
        </view>
      </scroll-view>

      <view v-if="subPage === 'utilityTemplate'" class="absolute inset-x-0 bottom-0 p-5 bg-white border-t border-slate-200-60 shadow-top-soft">
        <button class="w-full py-4 rounded-xl btn-blue font-semibold tap-scale" @click="saveConfig">保存并应用全局设置</button>
      </view>

      <view v-if="subPage === 'autoReminder'" class="absolute inset-x-0 bottom-0 p-5 bg-white border-t border-slate-200-60 shadow-top-soft">
        <button class="w-full py-4 rounded-xl btn-blue font-semibold tap-scale" @click="saveReminder">保存提醒设置</button>
      </view>

      <view v-if="subPage === 'exportReport'" class="absolute inset-x-0 bottom-0 p-5 bg-white border-t border-slate-200-60 shadow-top-soft">
        <button class="w-full py-4 rounded-xl btn-emerald font-semibold tap-scale" @click="exportReportFile">生成并导出 CSV</button>
      </view>

      <BaseCenteredModal :open="attachmentOpen" title="档案预览" subtitle="查看身份证、合同和模板图片" body-class="stack-3" @close="closeAttachment">
        <view v-if="attachmentInfo" class="stack-3">
          <view class="p-4 rounded-2xl surface-muted">
            <view class="text-xs text-slate-500 font-semibold">对象</view>
            <view class="text-base font-semibold text-slate-900 mt-2">{{ attachmentInfo.title }}</view>
            <view v-if="attachmentInfo.subtitle" class="text-xs text-slate-500 font-mono mt-2">{{ attachmentInfo.subtitle }}</view>
          </view>

          <view class="p-4 rounded-2xl surface-card">
            <view class="text-xs text-slate-500 font-semibold">预览</view>
            <image v-if="attachmentInfo.filePath || attachmentInfo.url" :src="attachmentInfo.filePath || attachmentInfo.url" mode="aspectFit" class="mt-3 h-44 w-full rounded-2xl bg-slate-50 border border-slate-200" @click="previewAttachmentImage" />
            <view v-else class="mt-3 h-44 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-semibold">暂无图片预览</view>
          </view>
        </view>
      </BaseCenteredModal>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { properties, globalConfig, saveGlobalConfig } from '../../data/rentStore'
import { currentUser, users, loginWithWeChatProfile, switchTenant, logoutTenant, buildTenantStorageKey } from '../../data/authStore'
import { UI } from '../../ui/ui'
import BaseCenteredModal from '../../components/BaseCenteredModal.vue'
import { getPageHeaderTopPadding } from '../../utils/layout'
import { previewChosenImage } from '../../utils/media'

const headerTopPadding = ref(44)
const subPage = ref('')
const profileName = computed(() => currentUser.value?.nickName || '未登录')
const profileInitial = computed(() => String(profileName.value || '未').trim().slice(0, 1) || '未')

const form = ref({
  waterPriceDefault: String(globalConfig.value.waterPriceDefault),
  electricPriceDefault: String(globalConfig.value.electricPriceDefault),
})

const docSearchDraft = ref('')
const docSearch = ref('')
const reminderForm = ref({ advance: true, overdue: true, warnThreeDays: false })
const exportMode = ref('all')
const selectedExportRoomKey = ref('')
const contractTemplates = [
  { id: 'tpl_1', title: '标准住宅租赁合同_v2.0', lastUsed: '2天前' },
  { id: 'tpl_2', title: '商铺专属租赁合同_通用版', lastUsed: '1个月前' },
]

const attachmentOpen = ref(false)
const attachmentInfo = ref(null)

const stats = computed(() => {
  const allRooms = properties.value.flatMap((p) => (p.blocks || []).flatMap((b) => (b.floors || []).flatMap((f) => f.rooms || [])))
  return {
    propertyCount: properties.value.length,
    totalRooms: allRooms.length,
    rentedRooms: allRooms.filter((r) => r.status !== 'empty').length,
  }
})

const menuA = [
  { id: 'allDocuments', icon: '档', label: '租客证件与合同归档', desc: '查看身份证、合同与归档状态', bg: 'bg-blue-50', color: 'text-blue-600' },
  { id: 'utilityTemplate', icon: '水', label: '默认水电单价模板', desc: '统一配置默认水电价格', bg: 'bg-orange-50', color: 'text-orange-600' },
  { id: 'contractLibrary', icon: '合', label: '电子租赁合同库', desc: '管理合同模板与预览入口', bg: 'bg-indigo-50', color: 'text-indigo-600' },
]

const menuB = [
  { id: 'autoReminder', icon: '提', label: '到期提醒机制', desc: '仅做自我提醒，不做外部推送', bg: 'bg-amber-50', color: 'text-amber-600' },
  { id: 'exportReport', icon: '表', label: '数据报表导出', desc: '导出房间流水与汇总', bg: 'bg-emerald-50', color: 'text-emerald-600' },
]

const pageTitle = computed(() => {
  if (!subPage.value) return '我的'
  if (subPage.value === 'utilityTemplate') return '默认水电单价模板'
  if (subPage.value === 'exportReport') return '数据报表导出'
  if (subPage.value === 'allDocuments') return '租客证件与合同归档'
  if (subPage.value === 'contractLibrary') return '电子租赁合同库'
  if (subPage.value === 'autoReminder') return '到期提醒机制'
  return '功能'
})

const pageSubtitle = computed(() => {
  if (!subPage.value) return '账号与基础设置'
  if (subPage.value === 'utilityTemplate') return '统一模板，房间可覆盖'
  if (subPage.value === 'exportReport') return '导出 Excel 存档'
  if (subPage.value === 'allDocuments') return '按姓名、房号、手机号搜索'
  if (subPage.value === 'contractLibrary') return '上传与预览模板'
  if (subPage.value === 'autoReminder') return '仅自我管理，不生成催缴文案'
  return '下一步继续完善'
})

onLoad(() => {
  headerTopPadding.value = getPageHeaderTopPadding(44)

  try {
    const stored = uni.getStorageSync(buildTenantStorageKey('global_config_v1'))
    if (stored && typeof stored === 'object') {
      globalConfig.value = {
        waterPriceDefault: Number(stored.waterPriceDefault || globalConfig.value.waterPriceDefault),
        electricPriceDefault: Number(stored.electricPriceDefault || globalConfig.value.electricPriceDefault),
      }
      form.value.waterPriceDefault = String(globalConfig.value.waterPriceDefault)
      form.value.electricPriceDefault = String(globalConfig.value.electricPriceDefault)
    }
  } catch {}

  try {
    const stored = uni.getStorageSync(buildTenantStorageKey('reminder_config_v1'))
    if (stored && typeof stored === 'object') {
      reminderForm.value = {
        advance: Boolean(stored.advance),
        overdue: Boolean(stored.overdue),
        warnThreeDays: Boolean(stored.warnThreeDays),
      }
    }
  } catch {}
})

watch(currentUser, () => {
  form.value.waterPriceDefault = String(globalConfig.value.waterPriceDefault)
  form.value.electricPriceDefault = String(globalConfig.value.electricPriceDefault)
  try {
    const stored = uni.getStorageSync(buildTenantStorageKey('reminder_config_v1'))
    reminderForm.value = stored && typeof stored === 'object'
      ? {
          advance: Boolean(stored.advance),
          overdue: Boolean(stored.overdue),
          warnThreeDays: Boolean(stored.warnThreeDays),
        }
      : { advance: true, overdue: true, warnThreeDays: false }
  } catch {
    reminderForm.value = { advance: true, overdue: true, warnThreeDays: false }
  }
})

function openSubPage(id) { subPage.value = id }

const allDocs = computed(() => {
  const out = []
  for (const p of properties.value) {
    for (const b of p.blocks || []) {
      for (const f of b.floors || []) {
        for (const r of f.rooms || []) {
          if (!r || r.status === 'empty') continue
          out.push({
            id: `doc_${p.id}_${b.id}_${r.id}`,
            propertyName: p.name || '',
            blockName: b.name || '',
            roomNo: r.roomNo || '',
            tenant: r.tenant || '',
            phone: r.phone || '',
            hasIdCardPic: Boolean(r.hasIdCardPic),
            hasContract: Boolean(r.hasContract),
            attachmentFiles: r.attachmentFiles || { idCard: null, contract: null },
          })
        }
      }
    }
  }
  out.sort((a, b) => String(a.roomNo).localeCompare(String(b.roomNo)))
  return out
})

const filteredDocs = computed(() => {
  const q = String(docSearch.value || '').trim()
  if (!q) return allDocs.value
  return allDocs.value.filter((d) => String(d.tenant || '').includes(q) || String(d.roomNo || '').includes(q) || String(d.phone || '').includes(q))
})

const exportRoomOptions = computed(() => {
  return properties.value
    .flatMap((property) => (property.blocks || []).flatMap((block) => (block.floors || []).flatMap((floor) => (floor.rooms || []).map((room) => ({
      key: [property.id, block.id, room.id].join('|'),
      label: `${property.name} · ${room.roomNo}`,
      propertyName: property.name,
      blockName: block.name,
      room,
    })))))
    .filter((item) => (item.room.collections || []).length > 0)
})

watch(exportRoomOptions, (next) => {
  if (exportMode.value !== 'room') return
  if (!next.some((item) => item.key === selectedExportRoomKey.value)) {
    selectedExportRoomKey.value = next[0]?.key || ''
  }
}, { immediate: true })

const exportTransactions = computed(() => {
  const targetRooms = exportMode.value === 'room'
    ? exportRoomOptions.value.filter((item) => item.key === selectedExportRoomKey.value)
    : properties.value.flatMap((property) => (property.blocks || []).flatMap((block) => (block.floors || []).flatMap((floor) => (floor.rooms || []).map((room) => ({
        key: [property.id, block.id, room.id].join('|'),
        label: `${property.name} · ${room.roomNo}`,
        propertyName: property.name,
        blockName: block.name,
        room,
      })))))

  return targetRooms
    .flatMap((item) => (item.room.collections || []).map((collection) => ({
      date: collection.paidAt || '',
      propertyName: item.propertyName,
      blockName: item.blockName,
      roomNo: item.room.roomNo || '',
      tenant: item.room.tenant || '',
      type: mapCollectionKindLabel(collection.kind),
      title: collection.title || '',
      amount: Number(collection.amount || 0).toFixed(2),
      receipt: collection.receiptPic ? '有' : '无',
      rawKind: collection.kind,
    })))
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
})

const exportPreviewSummary = computed(() => {
  if (exportTransactions.value.length === 0) return null
  const rent = exportTransactions.value
    .filter((item) => item.rawKind === 'rent')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const extra = exportTransactions.value
    .filter((item) => item.rawKind !== 'rent')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)
  return {
    count: exportTransactions.value.length,
    rent: rent.toFixed(2),
    extra: extra.toFixed(2),
  }
})

function applyDocSearch() {
  docSearch.value = String(docSearchDraft.value || '').trim()
}

function saveConfig() {
  const water = Number(form.value.waterPriceDefault)
  const electric = Number(form.value.electricPriceDefault)
  if (!Number.isFinite(water) || water <= 0 || !Number.isFinite(electric) || electric <= 0) {
    uni.showToast({ title: '请填写正确的单价', icon: 'none' })
    return
  }
  saveGlobalConfig({ waterPriceDefault: water, electricPriceDefault: electric })
  uni.showToast({ title: '已保存', icon: 'success' })
  subPage.value = ''
}

function saveReminder() {
  try { uni.setStorageSync(buildTenantStorageKey('reminder_config_v1'), reminderForm.value) } catch {}
  uni.showToast({ title: '已保存', icon: 'success' })
  subPage.value = ''
}

function toastSoon() {
  uni.showToast({ title: '该功能下一步完善', icon: 'none' })
}

async function loginTenant() {
  try {
    await loginWithWeChatProfile()
    uni.showToast({ title: '登录成功', icon: 'success' })
  } catch (error) {
    if (!String(error?.errMsg || error?.message || '').includes('cancel')) {
      uni.showToast({ title: '登录失败', icon: 'none' })
    }
  }
}

function switchTenantUser(userId) {
  const switched = switchTenant(userId)
  if (!switched) return
  uni.showToast({ title: `已切换到${switched.nickName}`, icon: 'none' })
}

function openAttachment(type, doc) {
  const file = doc?.attachmentFiles?.[type] || null
  const label = type === 'idCard' ? '身份证' : '电子合同'
  attachmentInfo.value = {
    title: `${doc.roomNo} · ${doc.tenant || '租客'} · ${label}`,
    subtitle: `${doc.propertyName} - ${doc.blockName} | ${doc.phone || '-'}${file?.uploadedAt ? ` | ${file.uploadedAt}` : ''}`,
    type,
    fileName: file?.name || '',
    previewText: file?.previewText || '',
    filePath: file?.filePath || '',
    url: file?.url || '',
  }
  attachmentOpen.value = true
}

function openTemplatePreview(tpl) {
  attachmentInfo.value = {
    title: `合同模板预览: ${tpl.title}`,
    subtitle: `最近使用 ${tpl.lastUsed}`,
    type: 'contract_template',
  }
  attachmentOpen.value = true
}

function closeAttachment() {
  attachmentOpen.value = false
  attachmentInfo.value = null
}

function previewAttachmentImage() {
  if (attachmentInfo.value) previewChosenImage(attachmentInfo.value)
}

function logout() {
  logoutTenant()
  uni.showToast({ title: '已退出登录', icon: 'none' })
}

function mapCollectionKindLabel(kind) {
  if (kind === 'rent') return '租金'
  if (kind === 'water') return '水费'
  if (kind === 'electric') return '电费'
  if (kind === 'gas') return '燃气'
  if (kind === 'heating') return '供暖'
  return '其它'
}

function buildCsvContent() {
  const rows = [
    ['日期', '院落', '楼栋', '房间', '租客', '类型', '标题', '金额', '凭证状态'],
    ...exportTransactions.value.map((item) => [
      item.date,
      item.propertyName,
      item.blockName,
      item.roomNo,
      item.tenant,
      item.type,
      item.title,
      item.amount,
      item.receipt,
    ]),
  ]
  if (exportPreviewSummary.value) {
    rows.push([])
    rows.push(['汇总', '', '', '', '', '', '流水笔数', String(exportPreviewSummary.value.count), ''])
    rows.push(['汇总', '', '', '', '', '', '租金合计', exportPreviewSummary.value.rent, ''])
    rows.push(['汇总', '', '', '', '', '', '附加费合计', exportPreviewSummary.value.extra, ''])
  }
  return `\ufeff${rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')}`
}

function exportReportFile() {
  if (exportTransactions.value.length === 0) {
    uni.showToast({ title: '暂无可导出流水', icon: 'none' })
    return
  }
  const fs = uni.getFileSystemManager?.() || wx.getFileSystemManager?.()
  if (!fs) {
    uni.showToast({ title: '当前环境不支持导出', icon: 'none' })
    return
  }
  const userPath = (uni.env && uni.env.USER_DATA_PATH) || wx.env.USER_DATA_PATH
  const scopeLabel = exportMode.value === 'room'
    ? (exportRoomOptions.value.find((item) => item.key === selectedExportRoomKey.value)?.room.roomNo || 'room')
    : 'all_rooms'
  const filePath = `${userPath}/irent_export_${scopeLabel}_${Date.now()}.csv`
  try {
    fs.writeFileSync(filePath, buildCsvContent(), 'utf8')
    uni.openDocument({
      filePath,
      showMenu: true,
      fileType: 'csv',
      fail: () => uni.showToast({ title: '文件已生成', icon: 'none' }),
    })
  } catch {
    uni.showToast({ title: '导出失败', icon: 'none' })
  }
}
</script>

<style>
.profile-hero {
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.18), transparent 28%),
    linear-gradient(180deg, #2953c7 0%, #3f6ee8 100%);
}

.profile-hero-chip {
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.92);
  font-size: 10px;
  font-weight: 600;
}

.profile-search-field {
  padding: 0.25rem 0.625rem;
  border-radius: 0.75rem;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92);
  min-height: 28px;
}

.profile-search-input {
  min-height: 14px;
  line-height: 14px;
  padding: 0;
  margin: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.profile-search-placeholder {
  color: #94a3b8;
}

.profile-search-button {
  min-height: 28px;
  min-width: 64px;
  padding: 0 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.profile-logout-button {
  background: #ffffff;
  border: 1px solid rgba(244, 63, 94, 0.2);
  color: #e11d48;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}
</style>
