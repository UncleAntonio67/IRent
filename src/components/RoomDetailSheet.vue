<template>
  <view v-if="open" class="fixed inset-0 z-50 bg-slate-900-50 flex items-end justify-center" @click="emit('close')">
    <view class="w-full max-w-md drawer-page-panel sheet-font-boost flex flex-col bg-slate-50 rounded-t-3xl shadow-2xl relative overflow-hidden" @click.stop>
      <view class="bg-white-80 px-5 pb-3 shrink-0" :style="{ paddingTop: headerTopPadding + 'px' }">
        <view class="flex justify-center"><view class="w-10 h-1 rounded-full bg-slate-300 mt-1"></view></view>
        <view class="flex items-center justify-between gap-3 mt-2">
          <view class="flex items-center gap-3 min-w-0">
            <view class="nav-icon-button tap-scale" @click="emit('close')">
              <view class="icon-close"><view class="icon-close-line"></view><view class="icon-close-line icon-close-line-second"></view></view>
            </view>
            <view class="min-w-0">
              <view class="font-black text-slate-900 text-lg font-mono truncate">{{ room?.roomNo || '房间' }}</view>
              <view class="text-xs text-slate-400 font-medium mt-0_5 truncate">{{ roomLocationText }}</view>
            </view>
          </view>
          <button v-if="undoableOperation" class="room-header-undo-button tap-scale" @click="confirmUndoLatest">
            <text class="room-header-undo-icon">↶</text>
            <text>撤销</text>
          </button>
        </view>
        <view class="mt-3">
          <view class="p-1 surface-muted rounded-2xl flex gap-1">
            <view class="flex-1 py-2 rounded-xl text-sm font-bold tap-scale text-center" :class="tab === 'current' ? 'bg-white text-slate-900 shadow-soft' : 'bg-transparent text-slate-500'" @click="tab = 'current'">当前情况</view>
            <view class="flex-1 py-2 rounded-xl text-sm font-bold tap-scale text-center" :class="tab === 'history' ? 'bg-white text-slate-900 shadow-soft' : 'bg-transparent text-slate-500'" @click="tab = 'history'">历史入住</view>
          </view>
        </view>
      </view>

      <scroll-view scroll-y class="drawer-scroll-area" :scroll-with-animation="true" enable-flex>
        <view v-if="!room" class="px-5 pt-3 pb-5">
          <view v-if="shouldShowLoadingState" class="p-4 rounded-2xl surface-card">
            <view class="animate-pulse">
              <view class="h-4 w-24 rounded-full bg-slate-200"></view>
              <view class="mt-3 h-3 w-full rounded-full bg-slate-100"></view>
              <view class="mt-2 h-3 w-4/5 rounded-full bg-slate-100"></view>
              <view class="mt-4 grid grid-cols-2 gap-3">
                <view class="h-20 rounded-2xl bg-slate-100"></view>
                <view class="h-20 rounded-2xl bg-slate-100"></view>
              </view>
            </view>
            <view class="mt-4 text-sm text-slate-500 font-medium">正在加载房间数据…</view>
          </view>
          <view v-else class="p-4 rounded-2xl surface-card"><view class="text-sm text-slate-600 font-medium">房间不存在或参数缺失。</view></view>
        </view>

          <view v-else class="px-5 pt-3 pb-5">
            <view v-if="tab === 'history'" class="stack-3">
              <view class="p-4 rounded-2xl surface-card">
                <view class="flex items-center justify-between"><view class="font-bold text-slate-800 text-sm">历史入住</view><view class="text-2xs text-slate-400 font-medium">时间轴</view></view>
                <view v-if="detailSectionsReady" class="mt-3">
                  <OccupancyTimeline :occupancies="historyTimelineItems" />
                </view>
                <view v-else class="mt-3 animate-pulse">
                  <view class="h-4 w-28 rounded-full bg-slate-200"></view>
                  <view class="mt-3 h-16 rounded-2xl bg-slate-100"></view>
                  <view class="mt-3 h-16 rounded-2xl bg-slate-100"></view>
                </view>
              </view>
            </view>

          <view v-else class="stack-2">
            <SyncNotice />
            <CollapsibleSectionCard
              title="房间概况"
              :expanded="roomOverviewExpanded"
              title-class="text-sm text-slate-700 font-bold"
              @toggle="roomOverviewExpanded = !roomOverviewExpanded"
            >
                <view class="flex items-start justify-between gap-3">
                  <view class="min-w-0">
                    <view class="text-base font-bold text-slate-800">{{ room.roomNo }}</view>
                    <view class="text-xs text-slate-500 font-medium mt-1">{{ room.status === 'empty' ? '当前空置，可直接办理入住。' : `租期 ${fmtDate(room.leaseStart)} 至 ${fmtDate(room.leaseEnd)}` }}</view>
                  </view>
                  <view class="shrink-0 text-right">
                    <view class="text-xs text-slate-500 font-bold">支付约定</view>
                    <view class="text-sm font-bold text-slate-900 mt-1">￥{{ room.rent }}/期</view>
                    <view class="text-2xs text-slate-500 font-medium mt-1">押金 ￥{{ room.deposit }} · {{ cycleLabel(room.paymentCycle) }}</view>
                  </view>
                </view>

                <view class="mt-3 flex items-center gap-2 overflow-hidden">
                <button class="w-11 h-11 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 tap-scale shrink-0 flex flex-col items-center justify-center" @click="handleRoomPhotoUpload"><text class="text-sm font-semibold leading-none">+</text><text class="text-2xs font-medium mt-0_5">上传</text></button>
                  <scroll-view scroll-x class="flex-1 min-w-0 whitespace-nowrap overflow-hidden">
                    <view class="inline-flex gap-2">
                      <view v-for="(photo, index) in roomPhotos.slice(0, 9)" :key="photo.id" class="room-photo-item shrink-0">
                        <button class="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden tap-scale" @click="openRoomPhotoPreview(index)">
                          <image v-if="resolveOfflineImageSrc(photo)" :src="resolveOfflineImageSrc(photo)" mode="aspectFill" class="w-full h-full" />
                          <view v-else class="w-full h-full flex items-center justify-center text-2xs text-slate-400 font-medium">图片</view>
                        </button>
                        <button v-if="canManageTenantData" class="room-photo-delete" @click.stop="confirmRemoveRoomPhoto(photo)">×</button>
                      </view>
                      <view v-if="roomPhotos.length === 0" class="w-11 h-11 px-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 inline-flex items-center justify-center text-2xs text-slate-400 font-bold shrink-0">暂无</view>
                    </view>
                  </scroll-view>
                </view>

                <view v-if="room.status === 'empty'" class="mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <view class="text-sm font-bold text-emerald-800">当前为空置房</view>
                  <view class="text-xs text-emerald-700 font-medium mt-1">建议先补房屋资料，再办理入住。</view>
                </view>
            </CollapsibleSectionCard>

            <CollapsibleSectionCard
              title="当前租客"
              :expanded="currentTenantExpanded"
              title-class="text-sm text-slate-700 font-bold"
              @toggle="currentTenantExpanded = !currentTenantExpanded"
              body-class="flex items-end justify-between gap-2 mt-2"
            >
                <view class="tenant-current-info min-w-0 flex-1">
                  <view class="tenant-current-name">{{ room.tenant || '未入住' }}</view>
                  <button
                    v-if="room.phone"
                    class="tenant-current-phone tap-scale"
                    @click="copyPhone(room.phone)"
                  >
                    {{ room.phone }}
                  </button>
                </view>
                <view class="room-attachment-actions">
                  <view class="room-attachment-action-group">
                    <button v-if="idCardFiles.length || canManageTenantData" class="detail-side-button tap-scale" :class="idCardFiles.length ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'" @click="handleAttachment('idCard')"><view class="detail-side-button-text" :class="idCardFiles.length ? 'text-emerald-800' : 'text-slate-700'">{{ idCardFiles.length ? '身份证已上传' : '上传身份证' }}</view></button>
                    <button v-if="idCardFiles.length && canManageTenantData" class="room-attachment-delete" @click.stop="confirmRemoveAttachment('idCard', idCardFiles[idCardFiles.length - 1])">×</button>
                  </view>
                  <view class="room-attachment-action-group">
                    <button v-if="contractFiles.length || canManageTenantData" class="detail-side-button tap-scale" :class="contractFiles.length ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'" @click="handleAttachment('contract')"><view class="detail-side-button-text" :class="contractFiles.length ? 'text-emerald-800' : 'text-slate-700'">{{ contractFiles.length ? '合同已上传' : '上传合同' }}</view></button>
                    <button v-if="contractFiles.length && canManageTenantData" class="room-attachment-delete" @click.stop="confirmRemoveAttachment('contract', contractFiles[contractFiles.length - 1])">×</button>
                  </view>
                </view>
            </CollapsibleSectionCard>

            <view v-if="!detailSectionsReady && room.status !== 'empty'" class="p-4 rounded-2xl surface-card animate-pulse stack-3">
              <view class="h-4 w-24 rounded-full bg-slate-200"></view>
              <view class="h-28 rounded-2xl bg-slate-100"></view>
              <view class="h-28 rounded-2xl bg-slate-100"></view>
            </view>

            <RoomRentSection
              :visible="detailSectionsReady && room.status !== 'empty'"
              :expanded="rentExpanded"
              :progress-pct="rentProgressPct"
              :paid="rentPaid"
              :expected="rentExpected"
              :terms="rentTermRows"
              @toggle="rentExpanded = !rentExpanded"
              @collect="openRentCollectById"
            />

            <RoomUtilitySection
              :visible="detailSectionsReady"
              :expanded="utilityExpanded"
              :all-included="allUtilitiesIncluded"
              :has-meter-utility="hasMeterUtility"
              :meter-strip-class="meterStripClass"
              :show-water-meter-card="showWaterMeterCard"
              :show-electric-meter-card="showElectricMeterCard"
              :water-meter="room.lastWater"
              :electric-meter="room.lastElectric"
              :water-price="room.waterPrice || 0"
              :electric-price="room.electricPrice || 0"
              :rows="utilityDisplayRows"
              @toggle="utilityExpanded = !utilityExpanded"
              @meter="meterOpen = true"
              @collect="openUtilityCollect"
            />

            <RoomCollectionsSection
              :visible="detailSectionsReady && room.status !== 'empty'"
              :expanded="collectionsExpanded"
              :rows="collectionDisplayRows"
              @toggle="collectionsExpanded = !collectionsExpanded"
            />
          </view>
        </view>
      </scroll-view>

      <view v-if="room && tab === 'current'" class="drawer-action-bar">
          <ActionFooterRow
            v-if="room && room.status === 'empty'"
            :show-secondary="false"
            primary-label="办理入住"
            primary-class="detail-footer-emerald"
            @primary="goCheckIn"
          />
          <ActionFooterRow
            v-else-if="room"
            :show-secondary="false"
            primary-label="办理退租"
            primary-class="detail-footer-rose"
            @primary="checkoutOpen = true"
          />
      </view>

      <ChargeCollectDrawer
        :open="rentCollectOpen"
        :title="selectedRentTerm ? `第${selectedRentTerm.term}期费用收取` : '租金收款'"
        hero-label="应收总额"
        :hero-badge="rentCollectStatusLabel"
        :hero-amount="rentCollectExpectedAmount"
        left-label="已收金额"
        :left-value="`￥${rentCollectReceivedAmount}`"
        right-label="本次待收"
        :right-value="`￥${rentCollectRemainingAmount}`"
        input-label="本次实收金额"
        :model-value="rentQuickForm.amount"
        :placeholder="selectedRentTerm ? `例如 ${termRemaining(selectedRentTerm)}` : '0.00'"
        :receipt-picked="Boolean(receiptFile)"
        :receipt-file-name="receiptFile?.name || '未上传凭证'"
        confirm-label="确认提交收款"
        :confirm-disabled="!canSubmitRentCollection"
        :helper-text="rentCollectOverpaid ? '注意：输入金额超过当前待收金额' : ''"
        @close="rentCollectOpen = false"
        @update:modelValue="rentQuickForm.amount = $event"
        @pick-receipt="pickReceipt"
        @confirm="submitRentQuickCollection"
      />

      <ChargeCollectDrawer
        :open="utilitiesCollectOpen"
        :title="utilityCollectTitle"
        hero-label="费用应收"
        :hero-badge="utilityCollectStatusLabel"
        :hero-amount="utilityCollectExpectedAmount"
        left-label="已收金额"
        :left-value="`￥${utilityCollectPaidAmount}`"
        right-label="本次待收"
        :right-value="`￥${utilityCollectOutstandingAmount}`"
        :input-label="utilityCollectInputLabel"
        :model-value="utilityQuickForm.amount"
        placeholder="0.00"
        :receipt-picked="Boolean(receiptFile)"
        :receipt-file-name="receiptFile?.name || '未上传凭证'"
        confirm-label="确认提交收款"
        :confirm-disabled="!canSubmitUtilityCollection"
        :helper-text="utilityCollectHelperText"
        hero-tone="amber"
        @close="utilitiesCollectOpen = false"
        @update:modelValue="utilityQuickForm.amount = $event"
        @pick-receipt="pickReceipt"
        @confirm="submitUtilityQuickCollection"
      />

      <MeterEntryModal
        :open="meterOpen"
        title="录入水电表"
        subtitle="录入本期读数后生成应收费用"
        :water="meterForm.water"
        :electric="meterForm.electric"
        :water-photo-picked="meterPhotoPicked.water"
        :electric-photo-picked="meterPhotoPicked.electric"
        @close="meterOpen = false"
        @update:water="meterForm.water = $event"
        @update:electric="meterForm.electric = $event"
        @pick-water-photo="pickMeterPhoto('water')"
        @pick-electric-photo="pickMeterPhoto('electric')"
        @confirm="confirmMeter"
      />

      <CheckoutSettlementModal
        :open="checkoutOpen"
        title="办理退租"
        subtitle="确认结算后完成退租"
        :rent-status-text="checkoutRentStatusText"
        :rent-status-note="checkoutRentStatusNote"
        :rent-status-class="checkoutRentStatusClass"
        :utility-status-text="checkoutUtilityStatusText"
        :utility-status-note="checkoutUtilityStatusNote"
        :utility-status-class="checkoutUtilityStatusClass"
        :deposit-collected="checkoutDepositCollected"
        :water="checkoutForm.water"
        :electric="checkoutForm.electric"
        :gas="checkoutForm.gas"
        :refund="checkoutForm.refund"
        @close="checkoutOpen = false"
        @update:water="checkoutForm.water = $event"
        @update:electric="checkoutForm.electric = $event"
        @update:gas="checkoutForm.gas = $event"
        @update:refund="checkoutForm.refund = $event"
        @confirm="confirmCheckout"
      />

      <BaseCenteredModal :open="attachmentPreviewOpen" title="资料预览" subtitle="查看房屋资料" body-class="stack-3" @close="attachmentPreviewOpen = false"><view v-if="attachmentPreview" class="p-3 rounded-2xl surface-card"><view class="text-xs text-slate-500 font-bold">{{ previewTypeLabel }}</view><image v-if="attachmentPreviewLocalSrc" :src="attachmentPreviewLocalSrc" mode="aspectFit" class="w-full h-52 rounded-2xl bg-slate-50 mt-3" @click="previewAttachmentImage" /><view v-else class="text-sm text-slate-700 font-medium mt-2">{{ attachmentPreview.previewText || '暂无预览内容。' }}</view></view></BaseCenteredModal>

    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import BaseCenteredModal from './BaseCenteredModal.vue'
import SyncNotice from './SyncNotice.vue'
import OccupancyTimeline from './OccupancyTimeline.vue'
import CollapsibleSectionCard from './CollapsibleSectionCard.vue'
import RoomRentSection from './RoomRentSection.vue'
import RoomUtilitySection from './RoomUtilitySection.vue'
import RoomCollectionsSection from './RoomCollectionsSection.vue'
import ChargeCollectDrawer from './ChargeCollectDrawer.vue'
import MeterEntryModal from './MeterEntryModal.vue'
import CheckoutSettlementModal from './CheckoutSettlementModal.vue'
import ActionFooterRow from './ActionFooterRow.vue'
import { safeNavigateTo } from '../utils/navigation'
import { getDrawerHeaderTopPadding } from '../utils/layout'
import { cloneProperties, findBlock, findProperty, findRoomWithFloor, mergeCloudRoomDetail, setProperties } from '../data/rentStore'
import { canManageTenantData } from '../data/authStore'
import { fetchRoomDetail, getCachedRoomDetail, submitLatestCollectionUndo, submitLatestRoomOperationUndo, submitMeterReading, submitRentCollection, submitRoomCheckout, submitUtilityCollection } from '../api/rooms'
import { deleteRoomAttachmentFromCloud, deleteRoomPhotoFromCloud, uploadAttachmentForRoom } from '../api/attachments.js'
import { canUseCloudBackup, hasCloudApiBaseUrl } from '../config/cloud'
import { createClientOperationId, discardPendingAttachmentUpload, enqueueSyncTask, hasPendingSyncForRoom } from '../data/syncQueue.js'
import { ATTACHMENT_FILE_LIMITS, formatShortDate, getPaymentCycleLabel, ROOM_PHOTO_LIMIT } from '../domain/rent-models'
import { computeCollectionSummary, computeMeterCharge, createRoomTreeMutator, createUtilitiesBillFromMeter, getCollectedDepositAmount, getLatestUndoableRoomOperation, getRoomAttachmentFiles, markPaymentTermPaid, recordDirectUtilityCollection, recordRentCollection, recordRoomOperation, undoLatestRoomOperation, uploadRoomAttachment, uploadRoomPhoto, checkoutRoomWithSettlement } from '../domain/rent-room-service'
import { chooseImages, chooseSingleImage, previewChosenImage, previewChosenImages, resolveOfflineImageSrc } from '../utils/media'
import { parseNonNegativeNumber, parsePositiveAmount } from '../utils/validation'

const props = defineProps({ open: { type: Boolean, default: false }, propertyId: { type: String, default: '' }, blockId: { type: String, default: '' }, roomId: { type: String, default: '' } })
const emit = defineEmits(['close'])
const headerTopPadding = ref(getDrawerHeaderTopPadding(24))
const propertyId = ref(''); const blockId = ref(''); const roomId = ref(''); const tab = ref('current')
const rentCollectOpen = ref(false); const utilitiesCollectOpen = ref(false); const meterOpen = ref(false); const checkoutOpen = ref(false); const attachmentPreviewOpen = ref(false)
const attachmentPreview = ref(null); const receiptFile = ref(null)
const cachedRoomFallback = ref(null)
const roomLoading = ref(false)
const roomRefreshing = ref(false)
const selectedRentTermId = ref('')
const collectionsExpanded = ref(false)
const roomOverviewExpanded = ref(true)
const currentTenantExpanded = ref(true)
const rentExpanded = ref(true)
const utilityExpanded = ref(true)
const detailSectionsReady = ref(false)
const rentQuickForm = ref({ amount: '', note: '' }); const utilityQuickForm = ref({ type: 'water', amount: '', note: '' }); const meterForm = ref({ water: '', electric: '', gas: '' }); const meterPhotoPicked = ref({ water: false, electric: false }); const meterPhotoFiles = ref({ water: null, electric: null }); const checkoutForm = ref({ water: '', electric: '', gas: '', refund: '' })
let detailSectionsTimer = null
const property = computed(() => (propertyId.value ? findProperty(propertyId.value) : null))
const block = computed(() => (propertyId.value && blockId.value ? findBlock(propertyId.value, blockId.value) : null))
const roomWithFloor = computed(() => propertyId.value && blockId.value && roomId.value ? findRoomWithFloor(propertyId.value, blockId.value, roomId.value) : null)
function mergeRoomSnapshot(primary, fallback) {
  if (!primary) return fallback || null
  if (!fallback) return primary
  const merged = { ...fallback }
  Object.entries(primary).forEach(([key, value]) => {
    if (value !== undefined && value !== null) merged[key] = value
  })
  return merged
}
const room = computed(() => mergeRoomSnapshot(roomWithFloor.value?.room || null, cachedRoomFallback.value))
const shouldShowLoadingState = computed(() => props.open && roomLoading.value && !room.value)
const roomPhotos = computed(() => room.value?.roomPhotos || [])
const attachmentFiles = computed(() => room.value?.attachmentFiles || { idCard: [], contract: [] })
const idCardFiles = computed(() => getRoomAttachmentFiles(room.value, 'idCard'))
const contractFiles = computed(() => getRoomAttachmentFiles(room.value, 'contract'))
const undoableOperation = computed(() => getLatestUndoableRoomOperation(room.value))
const emptyCollectionSummary = {
  paymentSchedule: [],
  rent: { expected: 0, paid: 0, outstandingAmount: 0, progressPct: 0, recentCollections: [] },
  utilities: { expected: 0, paid: 0, outstandingAmount: 0, byType: [], recentCollections: [] },
  custom: { recentCollections: [] },
  overall: { expected: 0, paid: 0, outstandingCount: 0, progressPct: 0 },
}
const collectionSummary = computed(() => (detailSectionsReady.value ? computeCollectionSummary(room.value) : emptyCollectionSummary))
const roomLocationText = computed(() => [property.value?.name, block.value?.name].filter(Boolean).join(' · '))
const historyOccupancies = computed(() => (detailSectionsReady.value ? (room.value?.occupancies || []).filter((occupancy) => occupancy.kind === 'lease') : []))
const historyTimelineItems = computed(() => historyOccupancies.value.map((occupancy) => ({
  ...occupancy,
  rentTotal: occupancyRentTotal(occupancy),
  extraTotal: occupancyExtraCollectionTotal(occupancy),
})))
function initializeDetailState() {
  propertyId.value = String(props.propertyId || '')
  blockId.value = String(props.blockId || '')
  roomId.value = String(props.roomId || '')
  if (!props.open || !room.value) return
  detailSectionsReady.value = false
  if (detailSectionsTimer) clearTimeout(detailSectionsTimer)
  tab.value = 'current'
  receiptFile.value = null
  selectedRentTermId.value = ''
  roomOverviewExpanded.value = true
  currentTenantExpanded.value = true
  rentExpanded.value = true
  utilityExpanded.value = !['water', 'electric', 'gas', 'heating'].every((type) => room.value?.utilityChargeConfig?.[type] === 'included')
  collectionsExpanded.value = true
  rentQuickForm.value = { amount: '', note: '' }
  utilityQuickForm.value = { type: 'water', amount: '', note: '' }
  meterForm.value = {
    water: room.value?.lastWater ?? '',
    electric: room.value?.lastElectric ?? '',
    gas: '',
  }
  meterPhotoPicked.value = { water: false, electric: false }
  meterPhotoFiles.value = { water: null, electric: null }
  checkoutForm.value = {
    water: room.value?.lastWater ?? '',
    electric: room.value?.lastElectric ?? '',
    gas: room.value?.lastGas ?? '',
    refund: checkoutDepositCollected.value > 0 ? String(checkoutDepositCollected.value) : '',
  }
  detailSectionsTimer = setTimeout(() => {
    detailSectionsReady.value = true
  }, 80)
}

async function syncCloudRoomDetail() {
  if (!props.open || !roomId.value) return
  const cachedDetail = getCachedRoomDetail(roomId.value)
  cachedRoomFallback.value = cachedDetail
  roomLoading.value = false
  if (!hasCloudApiBaseUrl()) {
    roomRefreshing.value = false
    return
  }
  // Do not replace a locally edited room with the last cloud copy before its
  // queued check-in, collection or checkout has reached the server.
  if (hasPendingSyncForRoom(roomId.value)) {
    roomRefreshing.value = false
    return
  }
  roomRefreshing.value = true
  try {
    const detail = await fetchRoomDetail(roomId.value)
    applyCloudRoomDetail(detail)
  } catch {
    // Retain the local aggregate when the server is temporarily unavailable.
  } finally {
    roomRefreshing.value = false
  }
}

function applyCloudRoomDetail(detail) {
  if (!detail) return
  cachedRoomFallback.value = detail
  mergeCloudRoomDetail(propertyId.value, blockId.value, roomId.value, detail)
}

async function runRoomMutation({ cloudAction, localAction, queueTask, successTitle, cloudErrorTitle = '云端提交失败', afterSuccess }) {
  // When a network API is available, business mutations are cloud-first.
  // The durable local queue is only the offline/failure fallback; otherwise
  // every normal online operation would unnecessarily appear as "pending".
  const clientOperationId = queueTask
    ? (queueTask.payload?.clientOperationId || createClientOperationId(queueTask.type))
    : ''
  if (hasCloudApiBaseUrl() && roomId.value) {
    try {
      const detail = await cloudAction(clientOperationId)
      applyCloudRoomDetail(detail)
      if (typeof afterSuccess === 'function') afterSuccess(detail)
      if (successTitle) uni.showToast({ title: successTitle, icon: 'success' })
      return true
    } catch {
      // Fall through to a local, durable fallback below. This keeps an
      // offline action safe without making the online path queue by default.
    }
  }

  const changed = localAction ? localAction() : false
  if (!changed) return false
  if (typeof afterSuccess === 'function') afterSuccess(room.value)
  if (successTitle) uni.showToast({ title: successTitle, icon: 'success' })
  if (canUseCloudBackup() && roomId.value && queueTask) {
    enqueueSyncTask({
      ...queueTask,
      payload: { ...(queueTask.payload || {}), clientOperationId },
      propertyId: propertyId.value,
      blockId: blockId.value,
      roomId: roomId.value,
    })
    uni.showToast({ title: '网络暂不可用，已保存并将自动上传', icon: 'none' })
  }
  return true
}

onMounted(() => {
  initializeDetailState()
  syncCloudRoomDetail()
})

watch(() => props.open, (opened, previous) => {
  if (opened && !previous) {
    cachedRoomFallback.value = getCachedRoomDetail(roomId.value)
    initializeDetailState()
    syncCloudRoomDetail()
  }
})

watch(() => room.value?.id, () => {
  if (props.open) initializeDetailState()
})

watch(() => [props.propertyId, props.blockId, props.roomId], () => {
  propertyId.value = String(props.propertyId || '')
  blockId.value = String(props.blockId || '')
  roomId.value = String(props.roomId || '')
  cachedRoomFallback.value = getCachedRoomDetail(roomId.value)
  roomLoading.value = false
  roomRefreshing.value = false
  if (props.open) syncCloudRoomDetail()
})
const utilitySummaryRows = computed(() => collectionSummary.value.utilities.byType.filter((item) => item.expected > 0 || item.paid > 0 || item.outstanding > 0))
const utilityChargeConfig = computed(() => ({
  water: room.value?.utilityChargeConfig?.water || 'separate',
  electric: room.value?.utilityChargeConfig?.electric || 'separate',
  gas: room.value?.utilityChargeConfig?.gas || 'separate',
  heating: room.value?.utilityChargeConfig?.heating || 'separate',
}))
const rentTerms = computed(() => collectionSummary.value.paymentSchedule || [])
const rentExpected = computed(() => collectionSummary.value.rent.expected)
const rentPaid = computed(() => collectionSummary.value.rent.paid)
const rentProgressPct = computed(() => collectionSummary.value.rent.progressPct)
const overallExpected = computed(() => collectionSummary.value.overall.expected)
const overallPaid = computed(() => collectionSummary.value.overall.paid)
const overallProgressPct = computed(() => collectionSummary.value.overall.progressPct)
function collectionOperationTimestamp(item) {
  const value = String(item?.operationAt || item?.paidAt || '').replace(' ', 'T')
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : 0
}
const allCollectionRows = computed(() => [...collectionSummary.value.rent.recentCollections, ...collectionSummary.value.utilities.recentCollections, ...collectionSummary.value.custom.recentCollections]
  .sort((a, b) => collectionOperationTimestamp(b) - collectionOperationTimestamp(a) || String(b.id || '').localeCompare(String(a.id || '')))
  .slice(0, 8))
const meterCalc = computed(() => computeMeterCharge(room.value, meterForm.value))
const selectedRentTerm = computed(() => rentTerms.value.find((term) => term.id === selectedRentTermId.value) || null)
const checkoutRentOutstanding = computed(() => Number(collectionSummary.value.rent.outstandingAmount || 0))
const checkoutUtilityOutstanding = computed(() => Number(collectionSummary.value.utilities.outstandingAmount || 0))
const checkoutRentStatusText = computed(() => `已收 ￥${rentPaid.value}`)
const checkoutRentStatusNote = computed(() => checkoutRentOutstanding.value > 0 ? `待收 ￥${checkoutRentOutstanding.value}` : `应收 ￥${rentExpected.value} 已覆盖`)
const checkoutRentStatusClass = computed(() => checkoutRentOutstanding.value <= 0 ? 'checkout-status-lamp-done' : room.value?.status === 'overdue' ? 'checkout-status-lamp-overdue' : 'checkout-status-lamp-partial')
const checkoutUtilityStatusText = computed(() => `已收 ￥${collectionSummary.value.utilities.paid || 0}`)
const checkoutUtilityStatusNote = computed(() => checkoutUtilityOutstanding.value > 0 ? `待收 ￥${checkoutUtilityOutstanding.value}` : `应收 ￥${collectionSummary.value.utilities.expected || 0} 已覆盖`)
const checkoutUtilityStatusClass = computed(() => checkoutUtilityOutstanding.value <= 0 ? 'checkout-status-lamp-done' : Number(collectionSummary.value.utilities.paid || 0) > 0 ? 'checkout-status-lamp-partial' : 'checkout-status-lamp-pending')
const checkoutDepositCollected = computed(() => getCollectedDepositAmount(room.value))
const rentCollectExpectedAmount = computed(() => selectedRentTerm.value ? Number(selectedRentTerm.value.expectedAmount || 0) : Number(rentExpected.value || 0))
const attachmentPreviewLocalSrc = computed(() => resolveOfflineImageSrc(attachmentPreview.value))
const rentCollectReceivedAmount = computed(() => selectedRentTerm.value ? Number(selectedRentTerm.value.coveredAmount || selectedRentTerm.value.paidAmount || 0) : Number(rentPaid.value || 0))
const rentCollectRemainingAmount = computed(() => Math.max(0, Number((rentCollectExpectedAmount.value - rentCollectReceivedAmount.value).toFixed(2))))
const rentCollectInputAmount = computed(() => Number(rentQuickForm.value.amount || 0))
const rentCollectOverpaid = computed(() => rentCollectInputAmount.value > rentCollectRemainingAmount.value && rentCollectRemainingAmount.value > 0)
const canSubmitRentCollection = computed(() => Number.isFinite(rentCollectInputAmount.value) && rentCollectInputAmount.value > 0)
const rentCollectStatusLabel = computed(() => rentCollectRemainingAmount.value <= 0 ? '已收齐' : rentCollectReceivedAmount.value > 0 ? '补收中' : '待收中')
const previewTypeLabel = computed(() => attachmentPreview.value?.type === 'roomPhoto' ? '房屋照片' : attachmentPreview.value?.type === 'idCard' ? '身份证文件' : attachmentPreview.value?.type === 'contract' ? '合同文件' : '资料文件')
const utilityCards = computed(() => ['water', 'electric', 'gas', 'heating'].map((type) => {
  const row = collectionSummary.value.utilities.byType.find((item) => item.type === type) || { expected: 0, paid: 0, outstanding: 0 }
  return { type, ...row }
}))
const selectedUtilityCard = computed(() => utilityCards.value.find((item) => item.type === utilityQuickForm.value.type) || null)
const utilitySupportsMeter = computed(() => utilityQuickForm.value.type === 'water' || utilityQuickForm.value.type === 'electric')
const utilityCollectTitle = computed(() => `${utilityTypeLabel(utilityQuickForm.value.type)}收费`)
const utilityCollectInputLabel = computed(() => utilitySupportsMeter.value ? '本次收费金额' : '手动输入收费金额')
const utilityCollectExpectedAmount = computed(() => Number(selectedUtilityCard.value?.expected || 0))
const utilityCollectPaidAmount = computed(() => Number(selectedUtilityCard.value?.paid || 0))
const utilityCollectOutstandingAmount = computed(() => Number(selectedUtilityCard.value?.outstanding || 0))
const utilityCollectStatusLabel = computed(() => utilityCollectOutstandingAmount.value <= 0 ? '已收齐' : utilityCollectPaidAmount.value > 0 ? '补收中' : '待收中')
const utilityCollectHelperText = computed(() => {
  if (utilityCollectOutstandingAmount.value > 0) return '已抄表费用请按待收金额一次结清；收费后不会重复生成费用。'
  return utilitySupportsMeter.value ? '水费、电费可先抄表生成费用单，再回来确认收款。' : ''
})
const canSubmitUtilityCollection = computed(() => {
  const amount = Number(utilityQuickForm.value.amount || 0)
  const outstanding = utilityCollectOutstandingAmount.value
  return Number.isFinite(amount) && amount > 0 && (outstanding <= 0 || Math.abs(amount - outstanding) < 0.005)
})
const utilityTableRows = computed(() => utilityCards.value.map((item) => ({
  ...item,
  supportsMeter: item.type === 'water' || item.type === 'electric',
})))
const rentTermRows = computed(() => rentTerms.value.map((term) => {
  const coveredAmount = Number(term.coveredAmount || term.paidAmount || 0)
  const remaining = termRemaining(term)
  return {
    ...term,
    coveredAmount,
    done: remaining <= 0,
    statusLampClass: termStatusLampClass(term),
    actionLabel: remaining <= 0 ? '已收' : coveredAmount > 0 ? '补收' : '收费',
  }
}))
const utilityDisplayRows = computed(() => utilityTableRows.value.map((item) => ({
  ...item,
  label: utilityTypeLabel(item.type),
  included: utilityChargeConfig.value[item.type] === 'included',
  settled: Number(item.outstanding || 0) <= 0 && Boolean(item.hasSettledBill),
  statusLampClass: utilityStatusLampClass(item),
})))
const collectionDisplayRows = computed(() => allCollectionRows.value.map((item) => ({
  ...item,
  dateText: fmtDate(item.operationAt || item.paidAt),
  scopeText: collectionScopeText(item),
  noteText: item.note || defaultCollectionNote(item),
})))
const allUtilitiesIncluded = computed(() => ['water', 'electric', 'gas', 'heating'].every((type) => utilityChargeConfig.value[type] === 'included'))
const hasMeterUtility = computed(() => utilityChargeConfig.value.water !== 'included' || utilityChargeConfig.value.electric !== 'included')
const showWaterMeterCard = computed(() => utilityChargeConfig.value.water !== 'included')
const showElectricMeterCard = computed(() => utilityChargeConfig.value.electric !== 'included')
const visibleMeterCardCount = computed(() => Number(showWaterMeterCard.value) + Number(showElectricMeterCard.value))
const meterStripClass = computed(() => visibleMeterCardCount.value <= 1 ? 'utility-meter-strip-single' : 'utility-meter-strip-double')
const cycleLabel = (cycle) => getPaymentCycleLabel(cycle)
const fmtDate = (value) => formatShortDate(value)
const utilityTypeLabel = (type) => type === 'water' ? '水费' : type === 'electric' ? '电费' : type === 'gas' ? '燃气' : type === 'heating' ? '供暖' : type === 'custom' ? '其他' : '费用'
const utilityTypeIcon = (type) => type === 'water' ? '水' : type === 'electric' ? '电' : type === 'gas' ? '气' : type === 'heating' ? '暖' : '费'
const historyTypeLabel = (type) => ({ checkin: '入住', checkout: '退租', rent_collect: '租金收款', utility_collect: '费用收款', meter: '抄表', upload_room_photo: '房屋照片', upload_id: '身份证', upload_contract: '合同', writeoff: '账单核销', rent_writeoff: '账期核销' }[type] || type)
const collectionScopeText = (item) => item.coverageLabel || item.title || utilityTypeLabel(item.kind)
const defaultCollectionNote = (item) => item.kind === 'rent' ? '租金记收' : '费用记收'
const termRemaining = (term) => Math.max(0, Number((Number(term.expectedAmount || 0) - Number(term.coveredAmount || term.paidAmount || 0)).toFixed(2)))
const termProgressPct = (term) => {
  const expected = Number(term.expectedAmount || 0)
  if (!expected) return 0
  return Math.min(100, Math.max(0, Math.round((Number(term.coveredAmount || term.paidAmount || 0) / expected) * 100)))
}
const termStatusLabel = (term) => termRemaining(term) <= 0 ? '已收' : term.status === 'overdue' ? '逾期' : term.status === 'due_soon' ? '待收' : Number(term.coveredAmount || term.paidAmount || 0) > 0 ? '部分已收' : '待收'
const termStatusClass = (term) => termRemaining(term) <= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : term.status === 'overdue' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
const utilityIconClass = (type) => type === 'water' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : type === 'electric' ? 'bg-amber-50 text-amber-700 border-amber-200' : type === 'gas' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
const termStatusLampClass = (term) => termRemaining(term) <= 0 ? 'term-status-lamp-done' : term.status === 'overdue' ? 'term-status-lamp-overdue' : Number(term.coveredAmount || term.paidAmount || 0) > 0 ? 'term-status-lamp-partial' : 'term-status-lamp-pending'
const termStatusTextClass = (term) => termRemaining(term) <= 0 ? 'text-emerald-600' : term.status === 'overdue' ? 'text-rose-600' : Number(term.coveredAmount || term.paidAmount || 0) > 0 ? 'text-amber-700' : 'text-slate-500'
const utilityStatusLampClass = (item) => Number(item.outstanding || 0) <= 0 ? 'term-status-lamp-done' : Number(item.paid || 0) > 0 ? 'term-status-lamp-partial' : 'term-status-lamp-pending'
const utilityRowMainText = (item) => item.supportsMeter ? `当前表数 ${item.type === 'water' ? room.value?.lastWater || 0 : room.value?.lastElectric || 0}` : '手动输入费用'
const utilityRowSubText = (item) => item.type === 'water' ? `单价 ￥${room.value?.waterPrice || 0}/吨` : item.type === 'electric' ? `单价 ￥${room.value?.electricPrice || 0}/度` : item.type === 'gas' ? '直接录入本次燃气收费' : '直接录入本期供暖收费'
function nowString() { const d = new Date(); const p = (v) => String(v).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}` }
function buildChosenFile(type, rawFile) {
  return {
    ...rawFile,
    source: rawFile?.source || 'local',
    uploadedAt: rawFile?.uploadedAt || nowString(),
    name: rawFile?.name || `${room.value?.roomNo || 'room'}_${type}_${Date.now()}.jpg`,
    filePath: rawFile?.filePath || rawFile?.url || '',
    url: rawFile?.url || rawFile?.filePath || '',
  }
}
async function pickReceipt() {
  try {
    const chosen = await chooseSingleImage({ fallbackPrefix: 'receipt' })
    receiptFile.value = buildChosenFile('receipt', chosen)
  } catch (error) {
    if (!String(error?.errMsg || '').includes('cancel')) uni.showToast({ title: '选择凭证失败', icon: 'none' })
  }
}
function findRoomDraft(nextProperties) { return createRoomTreeMutator(nextProperties, propertyId.value, blockId.value, roomId.value) }
function updateRoomDraft(mutator, operation = null) {
  const nextProperties = cloneProperties()
  const hit = findRoomDraft(nextProperties)
  if (!hit) return false
  const before = operation ? JSON.parse(JSON.stringify(hit.room)) : null
  if (before) delete before.operationLog
  const changed = mutator(hit.room, hit, nextProperties)
  if (changed === false) return false
  if (operation) recordRoomOperation(hit.room, { ...operation, before })
  setProperties(nextProperties)
  return true
}
function confirmUndoLatest() {
  const operation = undoableOperation.value
  if (!operation) return uni.showToast({ title: '暂无可撤销操作', icon: 'none' })
  uni.showModal({
    title: '撤销最近操作',
    content: `将恢复到“${operation.label}”前的状态，已产生的数据会一并恢复。`,
    confirmText: '确认撤销',
    success: async ({ confirm }) => {
      if (!confirm) return
      const fallbackBillType = operation.kind === 'rent_collection'
        ? 'RENT'
        : (operation.label || '').includes('电') ? 'ELECTRIC' : (operation.label || '').includes('燃气') ? 'GAS' : (operation.label || '').includes('供暖') ? 'HEATING' : 'WATER'
      const billType = operation.billType || fallbackBillType
      const isCollectionUndo = ['rent_collection', 'utility_collection'].includes(operation.kind)
      const clientOperationId = createClientOperationId(isCollectionUndo ? 'room.undoCollection' : 'room.undoOperation')
      if (hasCloudApiBaseUrl() && roomId.value) {
        try {
          const detail = isCollectionUndo
            ? await submitLatestCollectionUndo(roomId.value, { billType, clientOperationId })
            : await submitLatestRoomOperationUndo(roomId.value, { kind: operation.kind, before: operation.before || {}, clientOperationId })
          applyCloudRoomDetail(detail)
          uni.showToast({ title: '已撤销最近操作', icon: 'success' })
          return
        } catch {
          // The local fallback below preserves the exact same operation key.
        }
      }
      const changed = updateRoomDraft((draftRoom) => undoLatestRoomOperation(draftRoom, { now: nowString() }))
      if (!changed) return
      if (canUseCloudBackup()) {
        enqueueSyncTask({
          type: isCollectionUndo ? 'room.undoCollection' : 'room.undoOperation',
          propertyId: propertyId.value,
          blockId: blockId.value,
          roomId: roomId.value,
          payload: isCollectionUndo
            ? { billType, clientOperationId }
            : { kind: operation.kind, before: operation.before || {}, clientOperationId },
        })
      }
      uni.showToast({ title: '已撤销最近操作', icon: 'success' })
    },
  })
}
function goCheckIn() { if (!canManageTenantData.value) return uni.showToast({ title: '当前角色无权办理入住', icon: 'none' }); safeNavigateTo(`/pages/room/checkin?propertyId=${propertyId.value}&blockId=${blockId.value}&roomId=${roomId.value}`) }
async function uploadAttachment(type) {
  const limit = ATTACHMENT_FILE_LIMITS[type] || 1
  if (getRoomAttachmentFiles(room.value, type).length >= limit) return uni.showToast({ title: `最多上传 ${limit} 张图片`, icon: 'none' })
  if (!canManageTenantData.value) return uni.showToast({ title: '当前角色无权上传附件', icon: 'none' })
  try {
    const chosen = await chooseSingleImage({ fallbackPrefix: type })
    const prepared = { ...chosen, uploadedAt: nowString() }
    let fileForRoom = prepared
    let queuedForUpload = false
    if (hasCloudApiBaseUrl() && roomId.value) {
      try {
        const confirmed = await uploadAttachmentForRoom({ roomId: roomId.value, type, file: prepared })
        fileForRoom = { ...prepared, ...confirmed, source: 'cloud' }
      } catch {
        queuedForUpload = true
      }
    }
    let uploadedFile = null
    const changed = updateRoomDraft((draftRoom) => {
      uploadedFile = uploadRoomAttachment(draftRoom, type, { now: nowString(), file: fileForRoom })
    })
    if (!changed || !uploadedFile) return
    if (queuedForUpload && canUseCloudBackup() && roomId.value) {
      enqueueSyncTask({
        type: 'attachment.upload',
        propertyId: propertyId.value,
        blockId: blockId.value,
        roomId: roomId.value,
        payload: { type, file: uploadedFile },
      })
    }
    uni.showToast({ title: queuedForUpload ? '网络暂不可用，资料将自动上传' : '资料已上传', icon: queuedForUpload ? 'none' : 'success' })
  } catch (error) {
    if (!String(error?.errMsg || '').includes('cancel')) uni.showToast({ title: '选择图片失败', icon: 'none' })
  }
}
function openRoomPhotoPreview(index = 0) { if (!room.value || !roomPhotos.value.length) return; if (previewChosenImages(roomPhotos.value, index)) return; const photo = roomPhotos.value[index] || roomPhotos.value[0]; attachmentPreview.value = { type: 'roomPhoto', name: photo.name || '房屋照片', uploadedAt: photo.uploadedAt || '', previewText: photo.remark || '房屋照片预览占位。', tenant: room.value.tenant || '当前无租客', roomNo: room.value.roomNo || '', filePath: photo.filePath || '', url: photo.url || '' }; attachmentPreviewOpen.value = true }
function confirmRemoveRoomPhoto(photo) {
  if (!photo?.id) return
  uni.showModal({
    title: '删除房屋图片',
    content: `确定删除“${photo.name || '未命名图片'}”吗？删除后无法恢复。`,
    confirmColor: '#dc2626',
    success: async ({ confirm }) => {
      if (!confirm) return
      let queuedForDeletion = false
      try {
        // Delete by attachment ID whenever a cloud session exists.  The UI
        // source can still be "local" after a reconnect although the upload
        // has already been confirmed by the server.
        if (photo.id && roomId.value && hasCloudApiBaseUrl()) {
          try {
            await deleteRoomPhotoFromCloud(roomId.value, photo)
          } catch (error) {
            // A legacy local thumbnail can have an obsolete generated ID.
            // If its cloud counterpart cannot be identified unambiguously,
            // refresh from the authoritative detail instead of pretending
            // the deletion succeeded locally.
            if (error?.code === 'ATTACHMENT_ID_OUTDATED' || error?.code === 'ATTACHMENT_DELETE_NOT_CONFIRMED') {
              applyCloudRoomDetail(error.roomDetail)
              uni.showToast({ title: '图片状态已刷新，请确认后重试', icon: 'none' })
              return
            }
            enqueueSyncTask({
              type: 'attachment.delete',
              propertyId: propertyId.value,
              blockId: blockId.value,
              roomId: roomId.value,
              payload: { attachmentId: photo.id, photo },
            })
            queuedForDeletion = true
          }
        }
        const changed = updateRoomDraft((draftRoom) => {
          draftRoom.roomPhotos = (draftRoom.roomPhotos || []).filter((item) => item.id !== photo.id)
          discardPendingAttachmentUpload(roomId.value, photo)
        }, { kind: 'delete_room_photo', label: '删除房屋图片', now: nowString() })
        if (changed) {
          uni.showToast({
            title: queuedForDeletion ? '网络暂不可用，删除将自动同步' : '图片已删除',
            icon: queuedForDeletion ? 'none' : 'success',
          })
        }
      } catch (error) {
        uni.showToast({ title: '删除图片失败，请稍后重试', icon: 'none' })
      }
    },
  })
}
async function handleRoomPhotoUpload() {
  if (roomPhotos.value.length >= ROOM_PHOTO_LIMIT) return uni.showToast({ title: '房屋照片最多上传 9 张', icon: 'none' })
  if (!canManageTenantData.value) return uni.showToast({ title: '当前角色无权上传图片', icon: 'none' })
  try {
    const remaining = ROOM_PHOTO_LIMIT - roomPhotos.value.length
    const chosen = await chooseImages({ fallbackPrefix: `${room.value?.roomNo || 'room'}_photo`, count: remaining })
    if (chosen.length === 0) return
    const preparedPhotos = chosen.map((file) => ({ ...file, uploadedAt: nowString() }))
    const filesForRoom = []
    const offlineFiles = []
    for (const file of preparedPhotos) {
      if (hasCloudApiBaseUrl() && roomId.value) {
        try {
          const confirmed = await uploadAttachmentForRoom({ roomId: roomId.value, type: 'roomPhoto', file })
          filesForRoom.push({ ...file, ...confirmed, source: 'cloud' })
          continue
        } catch {
          offlineFiles.push(file)
        }
      }
      filesForRoom.push(file)
    }
    let uploadedPhotos = []
    const changed = updateRoomDraft((draftRoom) => {
      uploadedPhotos = filesForRoom
        .map((file) => uploadRoomPhoto(draftRoom, { now: nowString(), file }))
        .filter(Boolean)
    })
    if (!changed || uploadedPhotos.length === 0) return
    offlineFiles.forEach((file) => enqueueSyncTask({
      type: 'attachment.upload',
      propertyId: propertyId.value,
      blockId: blockId.value,
      roomId: roomId.value,
      payload: { type: 'roomPhoto', file },
    }))
    uni.showToast({ title: offlineFiles.length ? '网络暂不可用，照片将自动上传' : `已上传 ${uploadedPhotos.length} 张照片`, icon: offlineFiles.length ? 'none' : 'success' })
  } catch (error) {
    if (!String(error?.errMsg || '').includes('cancel')) uni.showToast({ title: '选择图片失败', icon: 'none' })
  }
}
function openAttachmentPreview(type, files, index = 0) { const list = Array.isArray(files) ? files : (files ? [files] : []); if (!room.value || list.length === 0) return; if (previewChosenImages(list, index)) return; const file = list[index] || list[0]; attachmentPreview.value = { type, name: file.name || '', uploadedAt: file.uploadedAt || '', previewText: file.previewText || '', tenant: room.value.tenant || '', roomNo: room.value.roomNo || '', filePath: file.filePath || '', url: file.url || '' }; attachmentPreviewOpen.value = true }
function previewAttachmentImage() { if (attachmentPreview.value) previewChosenImage(attachmentPreview.value) }
async function handleAttachment(type) {
  const files = getRoomAttachmentFiles(room.value, type)
  if (files.length > 0) return openAttachmentPreview(type, files)
  return uploadAttachment(type)
}
function confirmRemoveAttachment(type, file) {
  if (!file?.id || !canManageTenantData.value) return
  const label = type === 'idCard' ? '身份证' : '合同'
  uni.showModal({
    title: `删除${label}`,
    content: `确定删除该${label}图片吗？`,
    confirmColor: '#dc2626',
    success: async ({ confirm }) => {
      if (!confirm) return
      let queuedForDeletion = false
      try {
        if (hasCloudApiBaseUrl() && roomId.value) {
          try {
            await deleteRoomAttachmentFromCloud(roomId.value, type, file)
          } catch (error) {
            if (error?.code === 'ATTACHMENT_ID_OUTDATED' || error?.code === 'ATTACHMENT_DELETE_NOT_CONFIRMED') {
              applyCloudRoomDetail(error.roomDetail)
              uni.showToast({ title: '附件状态已刷新，请确认后重试', icon: 'none' })
              return
            }
            enqueueSyncTask({
              type: 'attachment.delete',
              propertyId: propertyId.value,
              blockId: blockId.value,
              roomId: roomId.value,
              payload: { attachmentType: type, attachmentId: file.id, file },
            })
            queuedForDeletion = true
          }
        }
        const changed = updateRoomDraft((draftRoom) => {
          const next = getRoomAttachmentFiles(draftRoom, type).filter((item) => item.id !== file.id)
          draftRoom.attachmentFiles = { ...(draftRoom.attachmentFiles || {}), [type]: next }
          if (type === 'idCard') draftRoom.hasIdCardPic = next.length > 0
          if (type === 'contract') draftRoom.hasContractPic = next.length > 0
          discardPendingAttachmentUpload(roomId.value, file)
        }, { kind: 'delete_attachment', label: `删除${label}`, now: nowString() })
        if (changed) uni.showToast({ title: queuedForDeletion ? '删除已保存，联网后自动同步' : '附件已删除', icon: queuedForDeletion ? 'none' : 'success' })
      } catch {
        uni.showToast({ title: '删除附件失败，请稍后重试', icon: 'none' })
      }
    },
  })
}
function copyPhone(phone) { uni.setClipboardData({ data: String(phone || ''), showToast: false, success: () => uni.showToast({ title: '手机号已复制', icon: 'none' }) }) }
function openRentCollect(term) { if (!canManageTenantData.value) return uni.showToast({ title: '当前角色无权收费', icon: 'none' }); selectedRentTermId.value = term?.id || ''; rentQuickForm.value = { amount: term ? String(termRemaining(term) || '') : '', note: '' }; receiptFile.value = null; rentCollectOpen.value = true }
function openRentCollectById(termId) { openRentCollect(rentTerms.value.find((term) => term.id === termId) || null) }
function openUtilityCollect(type) {
  if (!canManageTenantData.value) return uni.showToast({ title: '当前角色无权收费', icon: 'none' })
  const row = utilityCards.value.find((item) => item.type === type)
  utilityQuickForm.value = { type, amount: row && Number(row.outstanding || 0) > 0 ? String(row.outstanding) : '', note: '' }
  receiptFile.value = null
  utilitiesCollectOpen.value = true
}
async function submitRentQuickCollection() {
  const amount = parsePositiveAmount(rentQuickForm.value.amount)
  const note = String(rentQuickForm.value.note || '').trim()
  if (!amount) return uni.showToast({ title: '请输入有效金额', icon: 'none' })
  const succeeded = await runRoomMutation({
    cloudAction: (clientOperationId) => submitRentCollection(roomId.value, {
      amount,
      paidAt: nowString(),
      note,
      targetTermId: selectedRentTermId.value || null,
      attachmentIds: receiptFile.value?.id ? [receiptFile.value.id] : [],
      clientOperationId,
    }),
    queueTask: {
      type: 'room.rentCollection',
      payload: {
        amount,
        paidAt: nowString(),
        note,
        targetTermId: selectedRentTermId.value || null,
        attachmentIds: receiptFile.value?.id ? [receiptFile.value.id] : [],
        receiptFile: receiptFile.value,
      },
    },
    localAction: () => updateRoomDraft((draftRoom) => (selectedRentTermId.value
      ? markPaymentTermPaid(draftRoom, selectedRentTermId.value, { amount, note, now: nowString(), receiptPicked: Boolean(receiptFile.value), receiptFile: receiptFile.value })
      : recordRentCollection(draftRoom, { amount, note, now: nowString(), receiptPicked: Boolean(receiptFile.value), receiptFile: receiptFile.value })), { kind: 'rent_collection', label: '租金收款', billType: 'RENT', now: nowString() }),
    successTitle: '收款成功',
    cloudErrorTitle: '云端收款失败',
    afterSuccess: () => {
      selectedRentTermId.value = ''
      rentQuickForm.value = { amount: '', note: '' }
      receiptFile.value = null
      rentCollectOpen.value = false
    },
  })
  if (!succeeded) return
}
async function submitUtilityQuickCollection() {
  const amount = parsePositiveAmount(utilityQuickForm.value.amount)
  const note = String(utilityQuickForm.value.note || '').trim()
  const type = utilityQuickForm.value.type || 'water'
  if (!amount) return uni.showToast({ title: '请输入有效金额', icon: 'none' })
  const typeMap = { water: 'WATER', electric: 'ELECTRIC', gas: 'GAS', heating: 'HEATING', custom: 'CUSTOM' }
  const succeeded = await runRoomMutation({
    cloudAction: (clientOperationId) => submitUtilityCollection(roomId.value, {
      billType: typeMap[type] || 'CUSTOM',
      amount,
      paidAt: nowString(),
      note,
      attachmentIds: receiptFile.value?.id ? [receiptFile.value.id] : [],
      clientOperationId,
    }),
    queueTask: {
      type: 'room.utilityCollection',
      payload: {
        billType: typeMap[type] || 'CUSTOM',
        amount,
        paidAt: nowString(),
        note,
        attachmentIds: receiptFile.value?.id ? [receiptFile.value.id] : [],
        receiptFile: receiptFile.value,
      },
    },
    localAction: () => updateRoomDraft((draftRoom) => recordDirectUtilityCollection(draftRoom, {
      type,
      amount,
      note,
      title: `${fmtDate(nowString().slice(0, 10))} ${utilityTypeLabel(type)}`,
      now: nowString(),
      receiptPicked: Boolean(receiptFile.value),
      receiptFile: receiptFile.value,
    }), { kind: 'utility_collection', label: `${utilityTypeLabel(type)}收费`, billType: typeMap[type] || 'CUSTOM', now: nowString() }),
    successTitle: '收费成功',
    cloudErrorTitle: '云端收费失败',
    afterSuccess: () => {
      utilityQuickForm.value = { type: 'water', amount: '', note: '' }
      receiptFile.value = null
      utilitiesCollectOpen.value = false
    },
  })
  if (!succeeded) return
}
async function pickMeterPhoto(type) {
  try {
    const chosen = await chooseSingleImage({ fallbackPrefix: `${type}_meter` })
    const nextFile = buildChosenFile(`${type}_meter`, chosen)
    meterPhotoPicked.value = { ...meterPhotoPicked.value, [type]: true }
    meterPhotoFiles.value = { ...meterPhotoFiles.value, [type]: { ...nextFile, uploadedAt: nextFile.uploadedAt || nowString() } }
  } catch (error) {
    if (!String(error?.errMsg || '').includes('cancel')) uni.showToast({ title: '选择图片失败', icon: 'none' })
  }
}
async function confirmMeter() {
  if (!room.value || !meterCalc.value) return uni.showToast({ title: '请先录入读数', icon: 'none' })
  const attachmentIds = ['water', 'electric']
    .map((type) => meterPhotoFiles.value[type]?.id || '')
    .filter(Boolean)
  const succeeded = await runRoomMutation({
    cloudAction: (clientOperationId) => submitMeterReading(roomId.value, {
      recordedAt: nowString(),
      waterReading: meterCalc.value.waterNow,
      electricReading: meterCalc.value.electricNow,
      gasReading: null,
      attachmentIds,
      clientOperationId,
    }),
    queueTask: {
      type: 'room.meterReading',
      payload: {
        recordedAt: nowString(),
        waterReading: meterCalc.value.waterNow,
        electricReading: meterCalc.value.electricNow,
        gasReading: null,
        attachmentIds,
        meterPhotoFiles: meterPhotoFiles.value,
      },
    },
    localAction: () => updateRoomDraft((draftRoom) => { createUtilitiesBillFromMeter(draftRoom, meterCalc.value, { now: nowString() }) }, { kind: 'meter_entry', label: '抄表生成费用', now: nowString() }),
    successTitle: '应收费用已生成',
    cloudErrorTitle: '抄表提交失败',
    afterSuccess: (detail) => {
      meterOpen.value = false
      meterForm.value = {
        water: detail?.lastWater ?? room.value?.lastWater ?? '',
        electric: detail?.lastElectric ?? room.value?.lastElectric ?? '',
        gas: '',
      }
      meterPhotoPicked.value = { water: false, electric: false }
      meterPhotoFiles.value = { water: null, electric: null }
    },
  })
  if (!succeeded) return
}
async function confirmCheckout() {
  const water = Number(checkoutForm.value.water)
  const electric = Number(checkoutForm.value.electric)
  const gas = Number(checkoutForm.value.gas)
  const refund = checkoutDepositCollected.value > 0 ? Number(checkoutForm.value.refund) : 0
  if (checkoutDepositCollected.value > 0 && (!Number.isFinite(refund) || refund < 0 || refund > checkoutDepositCollected.value)) return uni.showToast({ title: '退押金额应在已收押金范围内', icon: 'none' })
  if (!Number.isFinite(water) || !Number.isFinite(electric) || !Number.isFinite(gas)) return uni.showToast({ title: '请完整填写退租结算', icon: 'none' })
  const succeeded = await runRoomMutation({
    cloudAction: (clientOperationId) => submitRoomCheckout(roomId.value, {
      checkoutDate: nowString(),
      refundAmount: refund,
      note: '',
      attachmentIds: [],
      clientOperationId,
    }),
    queueTask: {
      type: 'room.checkout',
      payload: {
        checkoutDate: nowString(),
        refundAmount: refund,
        note: '',
        attachmentIds: [],
      },
    },
    localAction: () => updateRoomDraft((draftRoom) => { checkoutRoomWithSettlement(draftRoom, { water, electric, gas, refund }, { now: nowString() }) }, { kind: 'checkout', label: '办理退租', now: nowString() }),
    successTitle: '退租完成',
    cloudErrorTitle: '云端退租失败',
    afterSuccess: () => {
      checkoutOpen.value = false
      emit('close')
    },
  })
  if (!succeeded) return
}
function occupancyDateWithin(value, occupancy) {
  const date = String(value || '').slice(0, 10)
  if (!date) return false
  const start = String(occupancy?.startDate || '').slice(0, 10)
  const end = String(occupancy?.endDate || '').slice(0, 10)
  return (!start || date >= start) && (!end || date <= end)
}

function occupancyPaymentSchedule(occupancy) {
  const archived = occupancy?.archive?.paymentSchedule
  if (Array.isArray(archived) && archived.length) return archived
  const source = room.value?.paymentSchedule || []
  if (occupancy?.status === 'active') return source
  return source.filter((term) => occupancyDateWithin(term.startDate || term.dueDate, occupancy))
}

function occupancyBills(occupancy) {
  const archived = occupancy?.archive?.bills
  if (Array.isArray(archived) && archived.length) return archived
  const source = room.value?.bills || []
  if (occupancy?.status === 'active') return source
  return source.filter((bill) => occupancyDateWithin(bill.operationAt || bill.payDate || bill.dueDate, occupancy))
}

function occupancyRentTotal(occupancy) {
  if (!occupancy) return 0
  const paymentSchedule = occupancyPaymentSchedule(occupancy)
  if (paymentSchedule.length > 0) {
    return paymentSchedule.reduce((sum, item) => sum + Number(item.expectedAmount || 0), 0)
  }
  return Number(occupancy.rent || 0)
}

function occupancyExtraCollectionTotal(occupancy) {
  if (!occupancy) return 0
  // Use charge bills as the source of truth, excluding deposit collections and
  // preventing a settled bill and its collection from being counted twice.
  return occupancyBills(occupancy)
    .filter((item) => ['water', 'electric', 'gas', 'heating', 'custom'].includes(item.type || item.kind))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)
}
</script>

<style scoped>
.drawer-page-panel { animation: room-sheet-enter 220ms ease-out; transform-origin: bottom center; }
.sheet-font-boost .text-2xs { font-size: 22rpx !important; }
.sheet-font-boost .text-xs { font-size: 26rpx !important; }
.sheet-font-boost .text-sm { font-size: 30rpx !important; }
.sheet-font-boost .text-base { font-size: 34rpx !important; }
.sheet-font-boost .text-lg { font-size: 38rpx !important; }
.sheet-font-boost .term-no { font-size: 30rpx; }
.sheet-font-boost .term-money-label { font-size: 22rpx; }
.sheet-font-boost .term-money-value { font-size: 28rpx; }
.sheet-font-boost .term-money-sub .term-money-value { font-size: 24rpx; }
.sheet-font-boost .utility-type-name { font-size: 28rpx; }
.sheet-font-boost .utility-action-primary { font-size: 24rpx; }
.sheet-font-boost .compact-table-head { font-size: 22rpx; }
.sheet-font-boost .compact-table-title { font-size: 26rpx; }
.sheet-font-boost .compact-table-sub { font-size: 22rpx; }
.sheet-font-boost .compact-table-amount { font-size: 26rpx; }
.room-header-undo-button { min-width: 92rpx; height: 64rpx; padding: 0 16rpx; border: 0; border-radius: 18rpx; background: #fffbeb; color: #b45309; font-size: 24rpx; font-weight: 600; line-height: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6rpx; flex-shrink: 0; box-sizing: border-box; }
.room-header-undo-icon { font-size: 30rpx; line-height: 1; }
.tenant-current-name { font-size: 30rpx; line-height: 1.35; font-weight: 500; color: #0f172a; }
.tenant-current-phone { display: block; min-height: 36rpx; margin-top: 8rpx; padding: 0; border: 0; background: transparent; color: #64748b; font-size: 26rpx; line-height: 1.4; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; text-align: left; }
.room-attachment-actions { display: flex; align-items: center; gap: 10rpx; flex-shrink: 0; }
.room-photo-item { position: relative; width: 88rpx; height: 88rpx; }
.room-photo-delete { position: absolute; z-index: 2; top: -8rpx; right: -8rpx; width: 30rpx; height: 30rpx; padding: 0; border: 0; border-radius: 50%; background: rgba(255,255,255,.94); color: #64748b; font-size: 24rpx; line-height: 24rpx; font-weight: 700; box-shadow: 0 3rpx 8rpx rgba(15,23,42,.16); }
.room-attachment-action-group { min-width: 0; position: relative; }
.room-attachment-action-group .detail-side-button { min-width: 128rpx; padding: 16rpx 14rpx; border-radius: 14rpx; border-width: 1rpx; text-align: center; }
.room-attachment-action-group .room-attachment-delete { position:absolute; z-index:2; top:-10rpx; right:-8rpx; width:30rpx; height:30rpx; min-width:30rpx; padding:0; border:0; border-radius:50%; background:#64748b; color:#fff; font-size:26rpx; line-height:28rpx; }
.detail-side-button-text { font-size: 24rpx; line-height: 1.15; font-weight: 600; }
.status-lamp { width:18rpx; height:18rpx; border-radius:9999rpx; border:2rpx solid rgba(255,255,255,.95); box-shadow:0 0 0 2rpx rgba(148,163,184,.12); }
.status-lamp-emerald { background:#10b981; box-shadow:0 0 0 2rpx rgba(16,185,129,.16),0 0 10rpx rgba(16,185,129,.35); }
.status-lamp-amber { background:#f59e0b; box-shadow:0 0 0 2rpx rgba(245,158,11,.16),0 0 10rpx rgba(245,158,11,.35); }
.status-lamp-rose { background:#f43f5e; box-shadow:0 0 0 2rpx rgba(244,63,94,.16),0 0 10rpx rgba(244,63,94,.35); }
.status-lamp-slate { background:#94a3b8; box-shadow:0 0 0 2rpx rgba(148,163,184,.16),0 0 10rpx rgba(148,163,184,.28); }
.utility-meter-strip { display:grid; gap:12rpx; align-items:stretch; }
.utility-meter-strip-double { grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto; }
.utility-meter-strip-single { grid-template-columns:minmax(0,1fr) auto; }
.utility-meter-action { display:flex; align-items:center; justify-content:flex-end; }
.utility-meter-card { min-width: 0; }
.utility-meter-button {
  width: 78rpx;
  height: 124rpx;
  padding: 14rpx 0;
  border-radius: 20rpx;
  background: #ecfdf5;
  border: 1rpx solid rgba(167, 243, 208, 0.95);
  color: #047857;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}
.rent-cell { min-width:0; }
.term-no { font-size: 28rpx; font-weight:500; color:#0f172a; text-align:center; justify-self:center; }
.term-money-stack { display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; }
.utility-money-cell { align-items:center; }
.utility-money-cell .term-money-row { width:auto; min-width:132rpx; }
.term-money-row { display:grid; grid-template-columns:24rpx minmax(0,1fr); align-items:center; column-gap:6rpx; width:auto; min-width:132rpx; line-height:1.15; }
.term-money-label { font-size: 20rpx; color:#94a3b8; font-weight:500; text-align:right; }
.term-money-value { font-size: 26rpx; font-weight:500; color:#0f172a; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Courier New',monospace; }
.term-money-sub { margin-top:4rpx; }
.term-money-sub .term-money-value { font-size: 22rpx; color:#64748b; }
.term-state { display:flex; align-items:center; justify-content:center; }
.term-status-lamp { width:16rpx; height:16rpx; border-radius:9999rpx; flex-shrink:0; box-shadow:0 0 0 4rpx rgba(148,163,184,.08); }
.term-status-lamp-done { background:#10b981; box-shadow:0 0 0 4rpx rgba(16,185,129,.12); }
.term-status-lamp-overdue { background:#f43f5e; box-shadow:0 0 0 4rpx rgba(244,63,94,.12); }
.term-status-lamp-partial { background:#f59e0b; box-shadow:0 0 0 4rpx rgba(245,158,11,.12); }
.term-status-lamp-pending { background:#cbd5e1; box-shadow:0 0 0 4rpx rgba(203,213,225,.22); }
.term-action { display:flex; justify-content:center; }
.term-action-button { min-width: 92rpx; padding: 14rpx 18rpx; border-radius: 12rpx; font-size: 24rpx; font-weight: 700; line-height: 1; }
.term-action-button-active { color:#ffffff; background:linear-gradient(135deg,#2563eb,#3b82f6); box-shadow:0 10rpx 18rpx rgba(37,99,235,.18); }
.term-action-button-done { color:#047857; background:#f3fdf6; border:0; box-shadow:none; }
.term-action-button-disabled { color:#94a3b8; background:#f8fafc; border:1rpx solid rgba(203,213,225,.9); box-shadow:none; }
.utility-table-head { display:grid; grid-template-columns:minmax(0,.9fr) minmax(0,1.15fr) minmax(0,.7fr) minmax(0,.95fr); gap:12rpx; padding:16rpx 18rpx; background:#f8fafc; color:#64748b; font-size: 24rpx; font-weight:600; align-items:center; text-align:center; }
.utility-head-label { justify-self:center; text-align:center; }
.utility-table-row { display:grid; grid-template-columns:minmax(0,.9fr) minmax(0,1.15fr) minmax(0,.7fr) minmax(0,.95fr); gap:12rpx; padding:18rpx 18rpx; border-top:1rpx solid rgba(226,232,240,.9); align-items:center; }
.utility-cell { min-width:0; }
.utility-type { display:flex; align-items:center; justify-content:center; text-align:center; }
.utility-type-name { font-size: 26rpx; font-weight:500; color:#0f172a; }
.utility-type-sub { margin-top:6rpx; font-size: 22rpx; color:#94a3b8; font-weight:600; }
.utility-action { display:flex; flex-direction:column; gap:8rpx; align-items:center; justify-content:center; }
.utility-action-primary { min-width:96rpx; padding:14rpx 18rpx; border-radius:12rpx; color:#fff; font-size: 24rpx; font-weight:700; line-height:1; }
.utility-included-text { font-size: 22rpx; line-height: 1.25; color: #94a3b8; font-weight: 500; text-align: center; }
.detail-footer-emerald { background: linear-gradient(135deg, #34d399, #4ade80); box-shadow: 0 16rpx 28rpx rgba(52, 211, 153, 0.18); }
.detail-footer-rose { background: linear-gradient(135deg, #fb7185, #ef4444); box-shadow: 0 16rpx 28rpx rgba(239, 68, 68, 0.18); }
.rent-collect-hero { padding:32rpx; border-radius:28rpx; color:#fff; background:linear-gradient(135deg,#4f46e5,#3b82f6); box-shadow:0 18rpx 36rpx rgba(59,130,246,.18); position:relative; overflow:hidden; }
.utility-collect-hero { background:linear-gradient(135deg,#f59e0b,#f97316); box-shadow:0 18rpx 36rpx rgba(249,115,22,.18); }
.rent-collect-hero-top { display:flex; align-items:center; justify-content:space-between; gap:16rpx; position:relative; z-index:1; }
.rent-collect-hero-label { font-size: 22rpx; font-weight:700; color:rgba(219,234,254,.95); }
.rent-collect-hero-badge { padding:6rpx 14rpx; border-radius:12rpx; font-size: 18rpx; font-weight:700; color:#eff6ff; background:rgba(255,255,255,.18); }
.rent-collect-hero-amount { margin-top:18rpx; font-size: 52rpx; line-height:1; font-weight:800; position:relative; z-index:1; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Courier New',monospace; }
.rent-collect-hero-bottom { margin-top:24rpx; padding-top:22rpx; border-top:1rpx solid rgba(255,255,255,.22); display:flex; align-items:flex-start; justify-content:space-between; gap:20rpx; position:relative; z-index:1; }
.rent-collect-hero-sub-label { font-size: 18rpx; color:rgba(219,234,254,.92); }
.rent-collect-hero-sub-value { margin-top:6rpx; font-size: 28rpx; font-weight:800; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Courier New',monospace; }
.rent-collect-section { padding:28rpx; border-radius:28rpx; background:#fff; border:1rpx solid rgba(226,232,240,.9); box-shadow:0 10rpx 28rpx rgba(15,23,42,.05); }
.rent-collect-label { font-size: 24rpx; font-weight:700; color:#334155; }
.rent-collect-input-wrap { margin-top:18rpx; position:relative; }
.rent-collect-currency { position:absolute; left:26rpx; top:50%; transform:translateY(-50%); font-size: 34rpx; font-weight:800; color:#94a3b8; z-index:1; }
.rent-collect-input { width:100%; height:88rpx; padding:0 24rpx 0 58rpx; border-radius:24rpx; border:1rpx solid rgba(226,232,240,.95); background:#f8fafc; font-size: 38rpx; line-height:88rpx; font-weight:800; color:#0f172a; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Courier New',monospace; box-sizing:border-box; }
.rent-collect-alert { margin-top:12rpx; font-size: 20rpx; font-weight:700; color:#d97706; }
.rent-upload-zone { width:100%; margin-top:16rpx; padding:22rpx 24rpx; min-height:180rpx; border-radius:24rpx; border:2rpx dashed rgba(203,213,225,.95); background:rgba(248,250,252,.8); display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
.rent-upload-zone-done { border-color:rgba(167,243,208,.95); background:rgba(236,253,245,.9); }
.rent-upload-icon { width:60rpx; height:60rpx; border-radius:9999rpx; display:flex; align-items:center; justify-content:center; background:#fff; border:1rpx solid rgba(226,232,240,.95); color:#94a3b8; font-size: 24rpx; font-weight:900; }
.rent-upload-icon-done { background:#10b981; border-color:#10b981; color:#fff; }
.rent-upload-title { margin-top:12rpx; font-size: 22rpx; font-weight:700; color:#475569; }
.rent-upload-sub { margin-top:4rpx; font-size: 18rpx; color:#94a3b8; }
.compact-table-head { display:grid; grid-template-columns:minmax(0, .9fr) minmax(0, 2.25fr) minmax(0, .85fr); gap:18rpx; padding:16rpx 20rpx; background:#f8fafc; color:#64748b; font-size: 20rpx; font-weight:600; align-items:center; text-align:center; }
.compact-head-label { justify-self:stretch; }
.compact-head-label-left { text-align:left; }
.compact-head-label-right { text-align:right; }
.compact-table-row { display:grid; grid-template-columns:minmax(0, .9fr) minmax(0, 2.25fr) minmax(0, .85fr); gap:18rpx; padding:18rpx 20rpx; border-top:1rpx solid rgba(226,232,240,.9); align-items:start; }
.compact-table-date { color:#64748b; font-size: 20rpx; line-height:1.35; text-align:left; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Courier New',monospace; }
.compact-table-title { color:#0f172a; font-size: 24rpx; font-weight:600; line-height:1.3; }
.compact-table-sub { margin-top:6rpx; color:#94a3b8; font-size: 20rpx; font-weight:500; line-height:1.3; }
.compact-table-amount { color:#047857; font-size: 24rpx; font-weight:700; line-height:1.35; text-align:right; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Courier New',monospace; }
@media (max-width: 380px) {
  .utility-table-head, .utility-table-row { grid-template-columns:minmax(0,.85fr) minmax(0,1.05fr) minmax(0,.65fr) minmax(0,.9fr); gap:8rpx; }
  .utility-meter-strip-double { grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto; gap:10rpx; }
  .utility-meter-strip-single { grid-template-columns:minmax(0,1fr) auto; gap:10rpx; }
  .compact-table-head, .compact-table-row { grid-template-columns:minmax(0, .85fr) minmax(0, 1.95fr) minmax(0, .8fr); gap:10rpx; }
  .rent-collect-hero-amount { font-size: 48rpx; }
  .rent-collect-input { font-size: 34rpx; }
}
@keyframes room-sheet-enter { from { transform:translateY(36px); opacity:0; } to { transform:translateY(0); opacity:1; } }
</style>
