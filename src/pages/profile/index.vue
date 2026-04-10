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
              <view class="font-black text-slate-900 text-base truncate">{{ pageTitle }}</view>
              <view class="text-xs text-slate-400 font-medium mt-0_5 truncate">{{ pageSubtitle }}</view>
            </view>
          </view>
        </view>

        <view v-if="!subPage" class="mt-4 p-6 rounded-2xl profile-hero text-white relative overflow-hidden border-none shadow-lg">
          <view class="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white-20"></view>
          <view class="absolute -right-2 -top-2 w-28 h-28 rounded-full bg-white-20"></view>
          <view class="absolute -right-6 -bottom-8 text-8xl font-black opacity-10 pointer-events-none select-none">我</view>

          <view class="flex items-center gap-4 relative z-10">
            <view class="w-16 h-16 bg-white-20 rounded-full flex items-center justify-center text-white font-black text-2xl border border-white-20">{{ profileInitial }}</view>
            <view class="min-w-0">
              <view class="text-xl font-black truncate">{{ profileName }}</view>
              <view class="flex gap-2 mt-2 flex-wrap">
                <view class="profile-hero-chip">高级专业版</view>
                <view class="profile-hero-chip">已实名</view>
                <view class="profile-hero-chip">R2 存储</view>
              </view>
            </view>
          </view>

          <view class="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white-20 relative z-10">
            <view class="text-center">
              <view class="text-2xl font-black font-mono">{{ stats.propertyCount }}</view>
              <view class="text-3xs text-slate-200 font-medium mt-1">管理院落</view>
            </view>
            <view class="text-center border-l border-white-20">
              <view class="text-2xl font-black font-mono">{{ stats.totalRooms }}</view>
              <view class="text-3xs text-slate-200 font-medium mt-1">总房间</view>
            </view>
            <view class="text-center border-l border-white-20">
              <view class="text-2xl font-black font-mono text-blue-200">{{ stats.rentedRooms }}</view>
              <view class="text-3xs text-slate-200 font-medium mt-1">已入住</view>
            </view>
          </view>
        </view>
      </view>

      <scroll-view scroll-y class="page-scroll" :scroll-with-animation="true">
        <view class="p-5 stack-5" style="padding-bottom: 32rpx;">
          <view v-if="!subPage" class="stack-5">
            <view class="px-1">
              <view class="text-2xs font-black tracking-wide text-slate-400">资料与档案</view>
            </view>
            <view class="overflow-hidden surface-card" :class="UI.card">
              <view v-for="(item, i) in menuA" :key="item.id" class="p-4 flex items-center justify-between tap-scale" :class="i !== menuA.length - 1 ? 'border-b border-slate-100' : ''" @click="openSubPage(item.id)">
                <view class="flex items-center gap-3 min-w-0">
                  <view class="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-soft" :class="item.bg">
                    <text :class="item.color">{{ item.icon }}</text>
                  </view>
                  <view class="min-w-0">
                    <view class="font-bold text-slate-800 text-sm truncate">{{ item.label }}</view>
                    <view class="text-2xs text-slate-400 mt-1 truncate">{{ item.desc }}</view>
                  </view>
                </view>
                <view class="text-slate-300 font-black">›</view>
              </view>
            </view>

            <view class="px-1">
              <view class="text-2xs font-black tracking-wide text-slate-400">设置与导出</view>
            </view>
            <view class="overflow-hidden surface-card" :class="UI.card">
              <view v-for="(item, i) in menuB" :key="item.id" class="p-4 flex items-center justify-between tap-scale" :class="i !== menuB.length - 1 ? 'border-b border-slate-100' : ''" @click="openSubPage(item.id)">
                <view class="flex items-center gap-3 min-w-0">
                  <view class="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-soft" :class="item.bg">
                    <text :class="item.color">{{ item.icon }}</text>
                  </view>
                  <view class="min-w-0">
                    <view class="font-bold text-slate-800 text-sm truncate">{{ item.label }}</view>
                    <view class="text-2xs text-slate-400 mt-1 truncate">{{ item.desc }}</view>
                  </view>
                </view>
                <view class="text-slate-300 font-black">›</view>
              </view>
            </view>

            <view class="pt-2 pb-6">
              <button class="w-full py-3 rounded-xl btn-slate font-bold tap-scale mb-3" @click="resetDemo">重置演示数据</button>
              <button class="w-full py-3 rounded-xl btn-soft text-rose-600 font-bold tap-scale" @click="logout">安全退出登录</button>
            </view>
          </view>

          <view v-else-if="subPage === 'allDocuments'" class="stack-4">
            <view class="relative">
              <view class="absolute left-4 w-7 h-7 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-xs" style="top: 50%; transform: translateY(-50%);">搜</view>
              <input v-model="docSearch" type="text" class="w-full pl-12 pr-4 py-3 rounded-2xl input-soft font-medium text-slate-800" placeholder="搜索姓名 / 房号 / 手机号" />
            </view>

            <view v-if="filteredDocs.length === 0" class="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-slate-400 font-medium text-sm">暂无匹配的档案记录</view>

            <view v-else class="stack-3">
              <view v-for="doc in filteredDocs" :key="doc.id" class="p-4 rounded-2xl surface-card">
                <view class="flex justify-between items-center mb-3 border-b border-slate-100 pb-2 gap-3">
                  <view class="min-w-0">
                    <view class="font-black text-slate-800 text-sm truncate">{{ doc.roomNo }} · {{ doc.tenant || '未录入租客' }}</view>
                    <view class="text-2xs text-slate-400 mt-0_5 truncate">{{ doc.propertyName }} - {{ doc.blockName }}</view>
                  </view>
                  <view class="text-xs text-slate-500 font-mono shrink-0">{{ doc.phone || '-' }}</view>
                </view>
                <view class="flex gap-2 mb-3">
                  <view class="px-2 py-1 rounded-lg text-3xs font-black border" :class="doc.hasIdCardPic ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-400 border-slate-200'">{{ doc.hasIdCardPic ? '身份证已归档' : '身份证缺失' }}</view>
                  <view class="px-2 py-1 rounded-lg text-3xs font-black border" :class="doc.hasContract ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-200'">{{ doc.hasContract ? '合同已归档' : '合同缺失' }}</view>
                </view>
                <view class="flex gap-2">
                  <button class="flex-1 py-2 rounded-xl text-xs font-black tap-scale" :class="doc.hasIdCardPic ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-slate-50 text-slate-400 border border-slate-200'" :disabled="!doc.hasIdCardPic" @click="openAttachment('idCard', doc)">{{ doc.hasIdCardPic ? '查看身份证' : '暂无证件' }}</button>
                  <button class="flex-1 py-2 rounded-xl text-xs font-black tap-scale" :class="doc.hasContract ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-slate-50 text-slate-400 border border-slate-200'" :disabled="!doc.hasContract" @click="openAttachment('contract', doc)">{{ doc.hasContract ? '查看电子合同' : '暂无合同' }}</button>
                </view>
              </view>
            </view>
          </view>

          <view v-else-if="subPage === 'utilityTemplate'" class="stack-4">
            <view class="p-5 rounded-2xl bg-orange-50 border border-orange-200">
              <view class="flex items-start gap-3">
                <view class="w-9 h-9 rounded-xl bg-white text-orange-500 flex items-center justify-center font-black shadow-soft shrink-0">水</view>
                <view class="text-sm text-orange-800 font-medium leading-relaxed">设置全局默认水电单价。新建房源时默认采用这套模板，房间层级仍可单独覆盖。</view>
              </view>
            </view>

            <view class="p-5 rounded-2xl surface-card">
              <view class="font-black text-slate-900">默认水电单价模板</view>
              <view class="grid grid-cols-2 gap-3 mt-4">
                <view class="p-4 rounded-2xl surface-muted">
                  <view class="text-xs text-slate-500 font-bold">水费（元/吨）</view>
                  <input v-model="form.waterPriceDefault" type="number" class="mt-2 w-full px-3 py-3 input-soft rounded-xl font-mono" />
                </view>
                <view class="p-4 rounded-2xl surface-muted">
                  <view class="text-xs text-slate-500 font-bold">电费（元/度）</view>
                  <input v-model="form.electricPriceDefault" type="number" class="mt-2 w-full px-3 py-3 input-soft rounded-xl font-mono" />
                </view>
              </view>
            </view>
            <view class="h-20"></view>
          </view>

          <view v-else-if="subPage === 'contractLibrary'" class="stack-4">
            <button class="w-full py-6 rounded-2xl bg-white border-2 border-indigo-200 border-dashed text-indigo-600 font-black tap-scale flex flex-col items-center justify-center gap-2" @click="toastSoon">
              <view class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl">合</view>
              上传新的合同模板扫描件
            </button>

            <view class="overflow-hidden surface-card" :class="UI.card">
              <view class="p-4 border-b border-slate-100 bg-slate-50">
                <view class="text-xs font-bold text-slate-500">已归档的标准模板库</view>
              </view>
              <view>
                <view v-for="(tpl, i) in contractTemplates" :key="tpl.id" class="p-4 flex items-center justify-between gap-3" :class="i !== contractTemplates.length - 1 ? 'border-b border-slate-100' : ''">
                  <view class="flex items-center gap-3 min-w-0">
                    <view class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm shrink-0">文</view>
                    <view class="min-w-0">
                      <view class="font-black text-slate-800 text-sm truncate">{{ tpl.title }}</view>
                      <view class="text-2xs text-slate-400 font-medium mt-1">最近使用 {{ tpl.lastUsed }}</view>
                    </view>
                  </view>
                  <button class="px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-black border border-blue-200 tap-scale" @click="openTemplatePreview(tpl)">预览</button>
                </view>
              </view>
            </view>
          </view>

          <view v-else-if="subPage === 'autoReminder'" class="stack-4">
            <view class="p-5 rounded-2xl bg-amber-50 border border-amber-200">
              <view class="flex items-start gap-3">
                <view class="w-9 h-9 rounded-xl bg-white text-amber-500 flex items-center justify-center font-black shadow-soft shrink-0">提</view>
                <view class="text-sm text-amber-800 font-medium leading-relaxed">当前只做自我提醒管理，不生成催缴文案，也不向微信外部推送消息。</view>
              </view>
            </view>

            <view class="p-5 rounded-2xl surface-card stack-5">
              <view class="flex justify-between items-center gap-3">
                <view class="min-w-0">
                  <view class="font-black text-slate-800 text-base">到期前 3 天提醒</view>
                  <view class="text-xs text-slate-400 font-medium mt-1">提醒自己提前准备收款</view>
                </view>
                <view class="w-12 h-7 rounded-full p-1 transition-colors shrink-0" :class="reminderForm.advance ? 'bg-amber-500' : 'bg-slate-200'" @click="reminderForm.advance = !reminderForm.advance"><view class="w-5 h-5 bg-white rounded-full transition-transform shadow-soft" :class="reminderForm.advance ? 'translate-x-5' : 'translate-x-0'"></view></view>
              </view>

              <view class="border-t border-slate-100"></view>

              <view class="flex justify-between items-center gap-3">
                <view class="min-w-0">
                  <view class="font-black text-slate-800 text-base">到期当天提醒</view>
                  <view class="text-xs text-slate-400 font-medium mt-1">账单到期当天再次提示</view>
                </view>
                <view class="w-12 h-7 rounded-full p-1 transition-colors shrink-0" :class="reminderForm.overdue ? 'bg-rose-500' : 'bg-slate-200'" @click="reminderForm.overdue = !reminderForm.overdue"><view class="w-5 h-5 bg-white rounded-full transition-transform shadow-soft" :class="reminderForm.overdue ? 'translate-x-5' : 'translate-x-0'"></view></view>
              </view>

              <view class="border-t border-slate-100"></view>

              <view class="flex justify-between items-center gap-3">
                <view class="min-w-0">
                  <view class="font-black text-slate-800 text-base">逾期 3 天标记</view>
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
                <view class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 font-black text-base border border-emerald-100 shadow-soft shrink-0">表</view>
                <view class="text-sm text-emerald-800 font-medium leading-relaxed">支持导出账单与租客明细为 Excel 文件，用于本地留档。当前页面先保留导出入口和范围设置。</view>
              </view>
            </view>

            <view class="p-5 rounded-2xl surface-card stack-4">
              <view>
                <view class="text-sm font-black text-slate-800">导出范围</view>
                <view class="text-xs text-slate-400 font-medium mt-1">当前版本先展示导出配置 UI</view>
              </view>
              <view class="p-4 rounded-2xl surface-muted">
                <view class="text-xs text-slate-500 font-bold">院落</view>
                <view class="text-sm text-slate-700 font-medium mt-2">当前所有院落</view>
              </view>
              <view class="p-4 rounded-2xl surface-muted">
                <view class="text-xs text-slate-500 font-bold">时间范围</view>
                <view class="flex gap-2 mt-2">
                  <view class="flex-1 py-3 rounded-xl bg-white border border-emerald-200 text-emerald-700 text-center text-sm font-bold">本月</view>
                  <view class="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-center text-sm font-bold">本年</view>
                  <view class="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-center text-sm font-bold">全部</view>
                </view>
              </view>
            </view>
            <view class="h-20"></view>
          </view>

          <view v-else class="stack-4">
            <view class="p-5 rounded-2xl surface-card">
              <view class="font-black text-slate-900">该功能下一步完善</view>
              <view class="text-sm text-slate-600 font-medium leading-relaxed mt-2">当前优先保证房态、记账、档案和历史追溯的闭环稳定，后续再补更完整的业务能力。</view>
            </view>
          </view>
        </view>
      </scroll-view>

      <view v-if="subPage === 'utilityTemplate'" class="absolute inset-x-0 bottom-0 p-5 bg-white border-t border-slate-200-60 shadow-top-soft">
        <button class="w-full py-4 rounded-xl btn-blue font-bold tap-scale" @click="saveConfig">保存并应用全局设置</button>
      </view>

      <view v-if="subPage === 'autoReminder'" class="absolute inset-x-0 bottom-0 p-5 bg-white border-t border-slate-200-60 shadow-top-soft">
        <button class="w-full py-4 rounded-xl btn-blue font-bold tap-scale" @click="saveReminder">保存提醒设置</button>
      </view>

      <view v-if="subPage === 'exportReport'" class="absolute inset-x-0 bottom-0 p-5 bg-white border-t border-slate-200-60 shadow-top-soft">
        <button class="w-full py-4 rounded-xl btn-emerald font-bold tap-scale" @click="toastSoon">生成并导出 Excel</button>
      </view>

      <BottomDrawer :open="attachmentOpen" title="档案预览" subtitle="这里预览文件占位图，后续可接入 R2 真实文件" @close="closeAttachment">
        <view v-if="attachmentInfo" class="stack-3">
          <view class="p-4 rounded-2xl surface-muted">
            <view class="text-xs text-slate-500 font-bold">对象</view>
            <view class="text-base font-black text-slate-900 mt-2">{{ attachmentInfo.title }}</view>
            <view v-if="attachmentInfo.subtitle" class="text-xs text-slate-500 font-mono mt-2">{{ attachmentInfo.subtitle }}</view>
          </view>

          <view class="p-4 rounded-2xl surface-card">
            <view class="text-xs text-slate-500 font-bold">预览</view>
            <view class="mt-3 h-44 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold">文件预览占位</view>
            <view class="text-2xs text-slate-400 font-medium mt-3">当前仅保留结构与入口，真实文件后续保存到对象存储并做鉴权访问。</view>
          </view>
        </view>
      </BottomDrawer>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { properties, globalConfig, resetDemoProperties } from '../../data/rentStore'
import { UI } from '../../ui/ui'
import BottomDrawer from '../../components/BottomDrawer.vue'

const headerTopPadding = ref(44)
const subPage = ref('')
const profileName = ref('张总')
const profileInitial = computed(() => String(profileName.value || '张').trim().slice(0, 1) || '张')

const form = ref({
  waterPriceDefault: String(globalConfig.value.waterPriceDefault),
  electricPriceDefault: String(globalConfig.value.electricPriceDefault),
})

const docSearch = ref('')
const reminderForm = ref({ advance: true, overdue: true, warnThreeDays: false })
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
  { id: 'exportReport', icon: '表', label: '数据报表导出', desc: '导出 Excel 留档（UI 预留）', bg: 'bg-emerald-50', color: 'text-emerald-600' },
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
  try {
    const sys = uni.getSystemInfoSync()
    headerTopPadding.value = Math.max(44, (sys.statusBarHeight || 20) + 12)
  } catch {
    headerTopPadding.value = 44
  }

  try {
    const stored = uni.getStorageSync('global_config_v1')
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
    const stored = uni.getStorageSync('reminder_config_v1')
    if (stored && typeof stored === 'object') {
      reminderForm.value = {
        advance: Boolean(stored.advance),
        overdue: Boolean(stored.overdue),
        warnThreeDays: Boolean(stored.warnThreeDays),
      }
    }
  } catch {}
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

function saveConfig() {
  const water = Number(form.value.waterPriceDefault)
  const electric = Number(form.value.electricPriceDefault)
  if (!Number.isFinite(water) || water <= 0 || !Number.isFinite(electric) || electric <= 0) {
    uni.showToast({ title: '请填写正确的单价', icon: 'none' })
    return
  }
  globalConfig.value = { waterPriceDefault: water, electricPriceDefault: electric }
  try { uni.setStorageSync('global_config_v1', globalConfig.value) } catch {}
  uni.showToast({ title: '已保存', icon: 'success' })
  subPage.value = ''
}

function saveReminder() {
  try { uni.setStorageSync('reminder_config_v1', reminderForm.value) } catch {}
  uni.showToast({ title: '已保存', icon: 'success' })
  subPage.value = ''
}

function toastSoon() {
  uni.showToast({ title: '该功能下一步完善', icon: 'none' })
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

function logout() {
  uni.showToast({ title: '已安全退出（模拟）', icon: 'none' })
}

function resetDemo() {
  uni.showModal({
    title: '重置演示数据',
    content: '会恢复完整测试场景，包括欠费、临期、空置、历史归档和抄表样本。',
    success: (res) => {
      if (!res.confirm) return
      resetDemoProperties()
      docSearch.value = ''
      subPage.value = ''
      uni.showToast({ title: '已重置', icon: 'success' })
    },
  })
}
</script>
