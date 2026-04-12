<template>
  <view v-if="open" class="fixed inset-0 z-50 bg-slate-900-45 flex items-end justify-center" @click="emit('close')">
    <view class="w-full max-w-md drawer-page-panel sheet-font-boost flex flex-col bg-slate-50 rounded-t-3xl shadow-2xl relative overflow-hidden" @click.stop>
      <view class="bg-white-80 border-b px-5 pb-3 border-slate-200-60 shrink-0" :style="{ paddingTop: headerTopPadding + 'px' }">
        <view class="flex justify-center"><view class="w-12 h-1_5 rounded-full bg-slate-200 mt-1"></view></view>
        <view class="flex items-center justify-between gap-3 mt-2">
          <view class="flex items-center gap-3 min-w-0">
            <button class="nav-icon-button tap-scale" @click="emit('close')">
              <view class="icon-close"><view class="icon-close-line"></view><view class="icon-close-line icon-close-line-second"></view></view>
            </button>
            <view class="min-w-0">
              <view class="font-black text-slate-900 text-lg font-mono truncate">{{ room?.roomNo || '房间' }}</view>
              <view class="text-xs text-slate-400 font-medium mt-0_5 truncate">{{ roomLocationText }}</view>
            </view>
          </view>
          <button v-if="room && room.status !== 'empty'" class="nav-icon-button tap-scale" @click="openEditModal">
            <view class="icon-settings">
              <view class="icon-settings-ring"></view>
              <view class="icon-settings-core"></view>
            </view>
          </button>
        </view>
        <view class="mt-3">
          <view class="p-1 surface-muted rounded-2xl flex gap-1">
            <button class="flex-1 py-2 rounded-xl text-xs font-black tap-scale" :class="tab === 'current' ? 'bg-white text-slate-900 shadow-soft' : 'bg-transparent text-slate-500'" @click="tab = 'current'">当前情况</button>
            <button class="flex-1 py-2 rounded-xl text-xs font-black tap-scale" :class="tab === 'history' ? 'bg-white text-slate-900 shadow-soft' : 'bg-transparent text-slate-500'" @click="tab = 'history'">历史入住</button>
          </view>
        </view>
      </view>

      <scroll-view scroll-y class="drawer-scroll-area" :scroll-with-animation="true" enable-flex>
        <view v-if="!room" class="px-5 pt-3 pb-5">
          <view class="p-4 rounded-2xl surface-card"><view class="text-sm text-slate-600 font-medium">房间不存在或参数缺失。</view></view>
        </view>

        <view v-else class="px-5 pt-3 pb-5">
          <view v-if="tab === 'history'" class="stack-3">
            <view class="p-4 rounded-2xl surface-card">
              <view class="flex items-center justify-between"><view class="font-semibold text-slate-800 text-sm">历史入住</view><view class="text-2xs text-slate-400 font-medium">时间轴</view></view>
              <view class="mt-3">
                <OccupancyTimeline :occupancies="historyTimelineItems" />
              </view>
            </view>
          </view>

          <view v-else class="stack-2">
            <CollapsibleSectionCard
              title="房间概况"
              :expanded="roomOverviewExpanded"
              title-class="text-xs text-slate-400 font-bold"
              @toggle="roomOverviewExpanded = !roomOverviewExpanded"
            >
                <view class="flex items-start justify-between gap-3">
                  <view class="min-w-0">
                    <view class="text-base font-semibold text-slate-800">{{ room.roomNo }}</view>
                    <view class="text-xs text-slate-500 font-medium mt-1">{{ room.status === 'empty' ? '当前空置，可直接补资料后办理入住。' : `租期 ${fmtDate(room.leaseStart)} 至 ${fmtDate(room.leaseEnd)}` }}</view>
                  </view>
                  <view class="shrink-0 text-right">
                    <view class="text-xs text-slate-400 font-bold">支付约定</view>
                    <view class="text-sm font-semibold text-slate-900 mt-1">￥{{ room.rent }}/期</view>
                    <view class="text-2xs text-slate-500 font-medium mt-1">押金 ￥{{ room.deposit }} · {{ cycleLabel(room.paymentCycle) }}</view>
                  </view>
                </view>

                <view class="mt-3 flex items-center gap-2 overflow-hidden">
                  <button class="w-11 h-11 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 tap-scale shrink-0 flex flex-col items-center justify-center" @click="handleRoomPhotoUpload"><text class="text-sm font-black leading-none">+</text><text class="text-2xs font-medium mt-0_5">上传</text></button>
                  <scroll-view scroll-x class="flex-1 min-w-0 whitespace-nowrap overflow-hidden">
                    <view class="inline-flex gap-2">
                      <button v-for="photo in roomPhotos.slice(0, 6)" :key="photo.id" class="w-11 h-11 px-2 rounded-xl border border-slate-200 bg-slate-50 text-left tap-scale inline-flex flex-col justify-end overflow-hidden shrink-0" @click="openRoomPhotoPreview(photo)">
                        <view class="text-2xs font-semibold text-slate-700 truncate">{{ room.roomNo }}</view>
                        <view class="text-2xs text-slate-400 truncate">{{ photo.name }}</view>
                      </button>
                      <view v-if="roomPhotos.length === 0" class="w-11 h-11 px-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 inline-flex items-center justify-center text-2xs text-slate-400 font-bold shrink-0">暂无</view>
                    </view>
                  </scroll-view>
                </view>

                <view v-if="room.status === 'empty'" class="mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <view class="text-sm font-semibold text-emerald-800">当前为空置房</view>
                  <view class="text-xs text-emerald-700 font-medium mt-1">建议先补房屋照片和档案资料，再办理入住。</view>
                </view>
            </CollapsibleSectionCard>

            <CollapsibleSectionCard
              title="当前租客"
              :expanded="currentTenantExpanded"
              title-class="text-xs text-slate-400 font-bold"
              @toggle="currentTenantExpanded = !currentTenantExpanded"
              body-class="flex items-end justify-between gap-2 mt-2"
            >
                <view class="min-w-0 flex-1">
                  <view class="text-sm font-semibold text-slate-900">{{ room.tenant || '未入住' }}</view>
                  <button
                    v-if="room.phone"
                    class="mt-1 text-2xs text-slate-500 font-mono text-left bg-transparent p-0 tap-scale"
                    @click="copyPhone(room.phone)"
                  >
                    {{ room.phone }}
                  </button>
                </view>
                <button class="px-3 py-2 rounded-xl border text-center tap-scale shrink-0" style="min-width: 112rpx;" :class="room.hasIdCardPic ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'" @click="handleAttachment('idCard')">
                  <view class="text-xs font-semibold" :class="room.hasIdCardPic ? 'text-emerald-800' : 'text-slate-700'">{{ room.hasIdCardPic ? '查看身份证' : '上传身份证' }}</view>
                </button>
                <button class="px-3 py-2 rounded-xl border text-center tap-scale shrink-0" style="min-width: 112rpx;" :class="room.hasContract ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'" @click="handleAttachment('contract')">
                  <view class="text-xs font-semibold" :class="room.hasContract ? 'text-emerald-800' : 'text-slate-700'">{{ room.hasContract ? '查看合同' : '上传合同' }}</view>
                </button>
            </CollapsibleSectionCard>

            <CollapsibleSectionCard
              v-if="room.status !== 'empty'"
              title="租金收费"
              :expanded="rentExpanded"
              title-class="text-xs text-slate-400 font-bold"
              @toggle="rentExpanded = !rentExpanded"
            >
              <view class="flex items-center justify-between gap-3">
                <view class="flex items-center gap-2 shrink-0"><view class="status-lamp" :class="rentStatusLampClass"></view><view class="text-2xs text-slate-500 font-bold">{{ overallOutstandingCount === 0 ? '已覆盖' : `待收 ${overallOutstandingCount}` }}</view></view>
              </view>
              <view class="mt-3 p-3 rounded-2xl surface-muted">
                <view class="flex items-center justify-between text-xs font-bold text-slate-500">
                  <view>房租收费进度</view>
                  <view>{{ overallProgressPct }}%</view>
                </view>
                <view class="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <view class="h-2 rounded-full bg-blue-600" :style="{ width: overallProgressPct + '%' }"></view>
                </view>
                <view class="flex items-center justify-between text-2xs text-slate-500 font-mono mt-2">
                  <view>已收 ￥{{ overallPaid }}</view>
                  <view>应收 ￥{{ overallExpected }}</view>
                </view>
              </view>
              <view class="mt-2 rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                <view class="utility-table-head">
                  <text>期次</text>
                  <text>金额</text>
                  <text>状态</text>
                  <text>操作</text>
                </view>
                <view v-for="term in rentTerms" :key="term.id" class="utility-table-row">
                  <view class="utility-cell utility-type">
                    <view class="text-center">
                      <view class="utility-type-name">{{ term.term }}</view>
                    </view>
                  </view>
                  <view class="rent-cell term-money-stack">
                    <view class="term-money-row"><text class="term-money-label">应</text><text class="term-money-value">￥{{ term.expectedAmount }}</text></view>
                    <view class="term-money-row term-money-sub"><text class="term-money-label">收</text><text class="term-money-value">￥{{ Number(term.coveredAmount || term.paidAmount || 0) }}</text></view>
                  </view>
                  <view class="rent-cell term-state">
                    <view class="term-status-lamp" :class="termStatusLampClass(term)"></view>
                  </view>
                  <view class="utility-cell utility-action">
                    <button
                      class="utility-action-primary tap-scale"
                      :class="termRemaining(term) <= 0 ? 'term-action-button-done' : 'term-action-button-active'"
                      :disabled="termRemaining(term) <= 0"
                      @click="openRentCollect(term)"
                    >
                      {{ termRemaining(term) <= 0 ? '已收' : Number(term.coveredAmount || term.paidAmount || 0) > 0 ? '补收' : '收费' }}
                    </button>
                  </view>
                </view>
              </view>
            </CollapsibleSectionCard>

            <CollapsibleSectionCard
              title="附加收费"
              :expanded="utilityExpanded"
              title-class="text-xs text-slate-400 font-bold"
              @toggle="utilityExpanded = !utilityExpanded"
            >
              <view v-if="allUtilitiesIncluded" class="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-500 font-medium">
                水费、电费、燃汽、供暖均已包含在房租中。
              </view>

              <view v-else-if="hasMeterUtility" class="utility-meter-strip mt-3" :class="meterStripClass">
                <view v-if="showWaterMeterCard" class="utility-meter-card p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <view class="text-2xs text-slate-500 font-medium">当前水表</view>
                  <view class="text-sm font-semibold text-slate-900 mt-1">{{ room.lastWater }}</view>
                  <view class="text-2xs text-slate-400 mt-1">单价 ￥{{ room.waterPrice || 0 }}/吨</view>
                </view>
                <view v-if="showElectricMeterCard" class="utility-meter-card p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <view class="text-2xs text-slate-500 font-medium">当前电表</view>
                  <view class="text-sm font-semibold text-slate-900 mt-1">{{ room.lastElectric }}</view>
                  <view class="text-2xs text-slate-400 mt-1">单价 ￥{{ room.electricPrice || 0 }}/度</view>
                </view>
                <view class="utility-meter-action">
                  <button class="utility-meter-button tap-scale" @click="meterOpen = true">
                    <text>抄</text>
                    <text>表</text>
                  </button>
                </view>
              </view>

              <view v-if="utilityTableRows.length > 0" class="mt-2 rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                <view class="utility-table-head">
                  <text>项目</text>
                  <text>金额</text>
                  <text>状态</text>
                  <text>操作</text>
                </view>
                <view v-for="item in utilityTableRows" :key="item.type" class="utility-table-row">
                  <view class="utility-cell utility-type">
                    <view class="text-center">
                      <view class="utility-type-name">{{ utilityTypeLabel(item.type) }}</view>
                    </view>
                  </view>
                  <view class="utility-cell term-money-stack utility-money-cell">
                    <view class="term-money-row"><text class="term-money-label">应</text><text class="term-money-value">￥{{ item.expected }}</text></view>
                    <view class="term-money-row term-money-sub"><text class="term-money-label">收</text><text class="term-money-value">￥{{ item.paid }}</text></view>
                  </view>
                  <view class="utility-cell term-state">
                    <view class="term-status-lamp" :class="utilityStatusLampClass(item)"></view>
                  </view>
                  <view class="utility-cell utility-action">
                    <view v-if="utilityChargeConfig[item.type] === 'included'" class="utility-included-text">
                      已计入租金
                    </view>
                    <button
                      v-else
                      class="utility-action-primary tap-scale"
                      :class="'term-action-button-active'"
                      @click="openUtilityCollect(item.type)"
                    >
                      收费
                    </button>
                  </view>
                </view>
              </view>
            </CollapsibleSectionCard>

            <CollapsibleSectionCard
              v-if="room.status !== 'empty'"
              title="收费明细"
              :expanded="collectionsExpanded"
              title-class="text-xs text-slate-400 font-bold"
              @toggle="collectionsExpanded = !collectionsExpanded"
            >
              <view v-if="allCollectionRows.length === 0" class="text-sm text-slate-500 font-medium">暂无收款记录。</view>
              <view v-else class="rounded-2xl border border-slate-200 overflow-hidden">
                <view class="compact-table-head"><text>日期</text><text>项目</text><text class="text-right">金额</text></view>
                <view v-for="item in allCollectionRows" :key="item.id" class="compact-table-row"><text class="compact-table-date">{{ fmtDate(item.paidAt) }}</text><view class="min-w-0"><view class="compact-table-title truncate">{{ collectionScopeText(item) }}</view><view class="compact-table-sub">{{ item.note || defaultCollectionNote(item) }}</view></view><text class="compact-table-amount">￥{{ item.amount }}</text></view>
              </view>
            </CollapsibleSectionCard>
            <view class="h-16"></view>
          </view>
        </view>
      </scroll-view>

      <view class="absolute inset-x-0 bottom-0 bg-white border-t border-slate-200-60">
        <view class="px-5 py-3">
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
      </view>

      <ChargeCollectDrawer
        :open="rentCollectOpen"
        :title="selectedRentTerm ? `第${selectedRentTerm.term}期费用收取` : '租金收款'"
        :subtitle="rentCollectDocumentNo"
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
        :receipt-picked="receiptPicked"
        receipt-file-name="receipt_mock_001.jpg"
        confirm-label="确认提交收款"
        :confirm-disabled="!canSubmitRentCollection"
        :confirm-badge="Number(rentQuickForm.amount || 0) > 0 ? `￥${Number(rentQuickForm.amount || 0)}` : ''"
        :helper-text="rentCollectOverpaid ? '注意：输入金额超过当前待收金额' : ''"
        @close="rentCollectOpen = false"
        @update:modelValue="rentQuickForm.amount = $event"
        @pick-receipt="pickReceipt"
        @confirm="submitRentQuickCollection"
      />

      <ChargeCollectDrawer
        :open="utilitiesCollectOpen"
        :title="utilityCollectTitle"
        :subtitle="utilityCollectDocumentNo"
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
        :receipt-picked="receiptPicked"
        receipt-file-name="utility_receipt_mock_001.jpg"
        confirm-label="确认提交收款"
        :confirm-disabled="!canSubmitUtilityCollection"
        :confirm-badge="Number(utilityQuickForm.amount || 0) > 0 ? `￥${Number(utilityQuickForm.amount || 0)}` : ''"
        :helper-text="utilitySupportsMeter ? '水费、电费可先抄表生成费用单，再回来确认收款。' : ''"
        hero-tone="amber"
        @close="utilitiesCollectOpen = false"
        @update:modelValue="utilityQuickForm.amount = $event"
        @pick-receipt="pickReceipt"
        @confirm="submitUtilityQuickCollection"
      />

      <MeterEntryModal
        :open="meterOpen"
        title="录入水电表"
        subtitle="输入本期水表、电表读数，点击后回写应收费用"
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
        subtitle="确认租金、附加费用结算后完成退租"
        :rent-status-text="checkoutRentStatusText"
        :rent-status-note="checkoutRentStatusNote"
        :rent-status-class="checkoutRentStatusClass"
        :utility-status-text="checkoutUtilityStatusText"
        :utility-status-note="checkoutUtilityStatusNote"
        :utility-status-class="checkoutUtilityStatusClass"
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

      <EditRoomInfoModal
        :open="editOpen"
        :tenant="editForm.tenant"
        :phone="editForm.phone"
        :rent="editForm.rent"
        :deposit="editForm.deposit"
        :payment-cycle="editForm.paymentCycle"
        :lease-start="editForm.leaseStart"
        :lease-end="editForm.leaseEnd"
        @close="editOpen = false"
        @update:tenant="editForm.tenant = $event"
        @update:phone="editForm.phone = $event"
        @update:rent="editForm.rent = $event"
        @update:deposit="editForm.deposit = $event"
        @update:paymentCycle="editForm.paymentCycle = $event"
        @update:leaseStart="editForm.leaseStart = $event"
        @update:leaseEnd="editForm.leaseEnd = $event"
        @confirm="confirmEditRoom"
      />

      <BaseCenteredModal :open="attachmentPreviewOpen" title="资料预览" subtitle="查看房屋照片、身份证和合同的模拟内容" body-class="stack-3" @close="attachmentPreviewOpen = false"><view v-if="attachmentPreview" class="stack-3"><view class="p-3 rounded-2xl surface-muted"><view class="text-xs text-slate-500 font-bold">文件名称</view><view class="text-sm text-slate-800 font-mono mt-2 break-all">{{ attachmentPreview.name || '-' }}</view></view><view class="p-3 rounded-2xl surface-card"><view class="text-xs text-slate-500 font-bold">{{ previewTypeLabel }}</view><view class="text-sm text-slate-700 font-medium mt-2">{{ attachmentPreview.previewText || '暂无预览内容。' }}</view></view></view></BaseCenteredModal>

    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import BaseCenteredModal from './BaseCenteredModal.vue'
import OccupancyTimeline from './OccupancyTimeline.vue'
import CollapsibleSectionCard from './CollapsibleSectionCard.vue'
import ChargeCollectDrawer from './ChargeCollectDrawer.vue'
import MeterEntryModal from './MeterEntryModal.vue'
import CheckoutSettlementModal from './CheckoutSettlementModal.vue'
import EditRoomInfoModal from './EditRoomInfoModal.vue'
import ActionFooterRow from './ActionFooterRow.vue'
import { safeRedirectTo } from '../utils/navigation'
import { getDrawerHeaderTopPadding } from '../utils/layout'
import { cloneProperties, findBlock, findProperty, findRoomWithFloor, generatePaymentSchedule, setProperties } from '../data/rentStore'
import { formatShortDate, getPaymentCycleLabel } from '../domain/rent-models'
import { computeCollectionSummary, computeMeterCharge, createRoomTreeMutator, createUtilitiesBillFromMeter, markPaymentTermPaid, recordDirectUtilityCollection, recordRentCollection, uploadRoomAttachment, uploadRoomPhoto, checkoutRoomWithSettlement } from '../domain/rent-room-service'

const props = defineProps({ open: { type: Boolean, default: false }, propertyId: { type: String, default: '' }, blockId: { type: String, default: '' }, roomId: { type: String, default: '' } })
const emit = defineEmits(['close'])
const headerTopPadding = ref(getDrawerHeaderTopPadding(24))
const propertyId = ref(''); const blockId = ref(''); const roomId = ref(''); const tab = ref('current')
const rentCollectOpen = ref(false); const utilitiesCollectOpen = ref(false); const meterOpen = ref(false); const checkoutOpen = ref(false); const attachmentPreviewOpen = ref(false)
const editOpen = ref(false)
const attachmentPreview = ref(null); const receiptPicked = ref(false)
const selectedRentTermId = ref('')
const collectionsExpanded = ref(false)
const roomOverviewExpanded = ref(true)
const currentTenantExpanded = ref(true)
const rentExpanded = ref(true)
const utilityExpanded = ref(true)
const rentQuickForm = ref({ amount: '', note: '' }); const utilityQuickForm = ref({ type: 'water', amount: '', note: '' }); const meterForm = ref({ water: '', electric: '', gas: '' }); const meterPhotoPicked = ref({ water: false, electric: false }); const checkoutForm = ref({ water: '', electric: '', gas: '', refund: '' })
const editForm = ref({ tenant: '', phone: '', rent: '', deposit: '', paymentCycle: '', leaseStart: '', leaseEnd: '' })
watch(() => [props.propertyId, props.blockId, props.roomId, props.open, room.value?.lastWater, room.value?.lastElectric, room.value?.lastGas, room.value?.deposit], ([a, b, c, opened]) => { propertyId.value = String(a || ''); blockId.value = String(b || ''); roomId.value = String(c || ''); if (opened) { tab.value = 'current'; receiptPicked.value = false; selectedRentTermId.value = ''; roomOverviewExpanded.value = true; currentTenantExpanded.value = true; rentExpanded.value = true; utilityExpanded.value = true; collectionsExpanded.value = true; rentQuickForm.value = { amount: '', note: '' }; utilityQuickForm.value = { type: 'water', amount: '', note: '' }; meterForm.value = { water: room.value?.lastWater ?? '', electric: room.value?.lastElectric ?? '', gas: '' }; meterPhotoPicked.value = { water: false, electric: false }; checkoutForm.value = { water: room.value?.lastWater ?? '', electric: room.value?.lastElectric ?? '', gas: room.value?.lastGas ?? '', refund: room.value?.deposit ?? '' }; editOpen.value = false; editForm.value = { tenant: room.value?.tenant || '', phone: room.value?.phone || '', rent: String(room.value?.rent ?? ''), deposit: String(room.value?.deposit ?? ''), paymentCycle: String(room.value?.paymentCycle ?? ''), leaseStart: room.value?.leaseStart || '', leaseEnd: room.value?.leaseEnd || '' } } }, { immediate: true })
const property = computed(() => (propertyId.value ? findProperty(propertyId.value) : null))
const block = computed(() => (propertyId.value && blockId.value ? findBlock(propertyId.value, blockId.value) : null))
const roomWithFloor = computed(() => propertyId.value && blockId.value && roomId.value ? findRoomWithFloor(propertyId.value, blockId.value, roomId.value) : null)
const room = computed(() => roomWithFloor.value?.room || null)
const roomPhotos = computed(() => room.value?.roomPhotos || [])
const attachmentFiles = computed(() => room.value?.attachmentFiles || { idCard: null, contract: null })
const collectionSummary = computed(() => computeCollectionSummary(room.value))
const roomLocationText = computed(() => [property.value?.name, block.value?.name].filter(Boolean).join(' · '))
const historyOccupancies = computed(() => (room.value?.occupancies || []).filter((occupancy) => occupancy.kind === 'lease'))
const historyTimelineItems = computed(() => historyOccupancies.value.map((occupancy) => ({
  ...occupancy,
  rentTotal: occupancyRentTotal(occupancy),
  extraTotal: occupancyExtraCollectionTotal(occupancy),
})))
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
const overallOutstandingCount = computed(() => collectionSummary.value.overall.outstandingCount)
const overallProgressPct = computed(() => collectionSummary.value.overall.progressPct)
const allCollectionRows = computed(() => [...collectionSummary.value.rent.recentCollections, ...collectionSummary.value.utilities.recentCollections, ...collectionSummary.value.custom.recentCollections].sort((a, b) => String(b.paidAt || '').localeCompare(String(a.paidAt || ''))).slice(0, 8))
const meterCalc = computed(() => computeMeterCharge(room.value, meterForm.value))
const rentStatusLampClass = computed(() => (!room.value || room.value.status === 'empty') ? 'status-lamp-slate' : room.value.status === 'overdue' ? 'status-lamp-rose' : room.value.status === 'due_soon' ? 'status-lamp-amber' : 'status-lamp-emerald')
const selectedRentTerm = computed(() => rentTerms.value.find((term) => term.id === selectedRentTermId.value) || null)
const checkoutRentOutstanding = computed(() => Number(collectionSummary.value.rent.outstandingAmount || 0))
const checkoutUtilityOutstanding = computed(() => Number(collectionSummary.value.utilities.outstandingAmount || 0))
const checkoutRentStatusText = computed(() => `已收 ￥${rentPaid.value}`)
const checkoutRentStatusNote = computed(() => checkoutRentOutstanding.value > 0 ? `待收 ￥${checkoutRentOutstanding.value}` : `应收 ￥${rentExpected.value} 已覆盖`)
const checkoutRentStatusClass = computed(() => checkoutRentOutstanding.value <= 0 ? 'checkout-status-lamp-done' : room.value?.status === 'overdue' ? 'checkout-status-lamp-overdue' : 'checkout-status-lamp-partial')
const checkoutUtilityStatusText = computed(() => `已收 ￥${collectionSummary.value.utilities.paid || 0}`)
const checkoutUtilityStatusNote = computed(() => checkoutUtilityOutstanding.value > 0 ? `待收 ￥${checkoutUtilityOutstanding.value}` : `应收 ￥${collectionSummary.value.utilities.expected || 0} 已覆盖`)
const checkoutUtilityStatusClass = computed(() => checkoutUtilityOutstanding.value <= 0 ? 'checkout-status-lamp-done' : Number(collectionSummary.value.utilities.paid || 0) > 0 ? 'checkout-status-lamp-partial' : 'checkout-status-lamp-pending')
const rentCollectExpectedAmount = computed(() => selectedRentTerm.value ? Number(selectedRentTerm.value.expectedAmount || 0) : Number(rentExpected.value || 0))
const rentCollectReceivedAmount = computed(() => selectedRentTerm.value ? Number(selectedRentTerm.value.coveredAmount || selectedRentTerm.value.paidAmount || 0) : Number(rentPaid.value || 0))
const rentCollectRemainingAmount = computed(() => Math.max(0, Number((rentCollectExpectedAmount.value - rentCollectReceivedAmount.value).toFixed(2))))
const rentCollectInputAmount = computed(() => Number(rentQuickForm.value.amount || 0))
const rentCollectOverpaid = computed(() => rentCollectInputAmount.value > rentCollectRemainingAmount.value && rentCollectRemainingAmount.value > 0)
const canSubmitRentCollection = computed(() => receiptPicked.value && Number.isFinite(rentCollectInputAmount.value) && rentCollectInputAmount.value > 0)
const rentCollectStatusLabel = computed(() => rentCollectRemainingAmount.value <= 0 ? '已收齐' : rentCollectReceivedAmount.value > 0 ? '补收中' : '待收中')
const rentCollectDocumentNo = computed(() => `单据编号：${selectedRentTerm.value?.id || room.value?.id || 'ROOM'}-${String(selectedRentTerm.value?.term || 1).padStart(2, '0')}`)
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
const utilityCollectDocumentNo = computed(() => `单据编号：UTIL-${room.value?.id || 'ROOM'}-${utilityQuickForm.value.type || 'item'}`)
const canSubmitUtilityCollection = computed(() => Number.isFinite(Number(utilityQuickForm.value.amount || 0)) && Number(utilityQuickForm.value.amount || 0) > 0)
const utilityTableRows = computed(() => utilityCards.value.map((item) => ({
  ...item,
  supportsMeter: item.type === 'water' || item.type === 'electric',
})))
const allUtilitiesIncluded = computed(() => ['water', 'electric', 'gas', 'heating'].every((type) => utilityChargeConfig.value[type] === 'included'))
const hasMeterUtility = computed(() => utilityChargeConfig.value.water !== 'included' || utilityChargeConfig.value.electric !== 'included')
const showWaterMeterCard = computed(() => utilityChargeConfig.value.water !== 'included')
const showElectricMeterCard = computed(() => utilityChargeConfig.value.electric !== 'included')
const visibleMeterCardCount = computed(() => Number(showWaterMeterCard.value) + Number(showElectricMeterCard.value))
const meterStripClass = computed(() => visibleMeterCardCount.value <= 1 ? 'utility-meter-strip-single' : 'utility-meter-strip-double')
const cycleLabel = (cycle) => getPaymentCycleLabel(cycle)
const fmtDate = (value) => formatShortDate(value)
const utilityTypeLabel = (type) => type === 'water' ? '水费' : type === 'electric' ? '电费' : type === 'gas' ? '燃汽' : type === 'heating' ? '供暖' : type === 'custom' ? '其他' : '费用'
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
function pickReceipt() { receiptPicked.value = true; uni.showToast({ title: '已选择凭证（模拟）', icon: 'none' }) }
function findRoomDraft(nextProperties) { return createRoomTreeMutator(nextProperties, propertyId.value, blockId.value, roomId.value) }
function updateRoomDraft(mutator) { const nextProperties = cloneProperties(); const hit = findRoomDraft(nextProperties); if (!hit) return false; const changed = mutator(hit.room, hit, nextProperties); if (changed === false) return false; setProperties(nextProperties); return true }
function goCheckIn() { safeRedirectTo(`/pages/room/checkin?propertyId=${propertyId.value}&blockId=${blockId.value}&roomId=${roomId.value}`) }
function openEditModal() { if (!room.value) return; editForm.value = { tenant: room.value.tenant || '', phone: room.value.phone || '', rent: String(room.value.rent ?? ''), deposit: String(room.value.deposit ?? ''), paymentCycle: String(room.value.paymentCycle ?? ''), leaseStart: room.value.leaseStart || '', leaseEnd: room.value.leaseEnd || '' }; editOpen.value = true }
function openRoomPhotoPreview(photo) { if (!room.value || !photo) return; attachmentPreview.value = { type: 'roomPhoto', name: photo.name || '房屋照片', uploadedAt: photo.uploadedAt || '', previewText: photo.remark || '房屋照片预览占位。', tenant: room.value.tenant || '当前无租客', roomNo: room.value.roomNo || '' }; attachmentPreviewOpen.value = true }
function handleRoomPhotoUpload() { let uploadedPhoto = null; const changed = updateRoomDraft((draftRoom) => { uploadedPhoto = uploadRoomPhoto(draftRoom, { now: nowString() }) }); if (!changed || !uploadedPhoto) return; openRoomPhotoPreview(uploadedPhoto) }
function openAttachmentPreview(type, file) { if (!room.value || !file) return; attachmentPreview.value = { type, name: file.name || '', uploadedAt: file.uploadedAt || '', previewText: file.previewText || '', tenant: room.value.tenant || '', roomNo: room.value.roomNo || '' }; attachmentPreviewOpen.value = true }
function handleAttachment(type) { const file = attachmentFiles.value?.[type] || null; if (file) return openAttachmentPreview(type, file); let uploadedFile = null; const changed = updateRoomDraft((draftRoom) => { uploadedFile = uploadRoomAttachment(draftRoom, type, { now: nowString() }) }); if (!changed || !uploadedFile) return; openAttachmentPreview(type, uploadedFile) }
function copyPhone(phone) { uni.setClipboardData({ data: String(phone || ''), showToast: false, success: () => uni.showToast({ title: '手机号已复制', icon: 'none' }) }) }
function openRentCollect(term) { selectedRentTermId.value = term?.id || ''; rentQuickForm.value = { amount: term ? String(termRemaining(term) || '') : '', note: '' }; receiptPicked.value = false; rentCollectOpen.value = true }
function openUtilityCollect(type) {
  const row = utilityCards.value.find((item) => item.type === type)
  utilityQuickForm.value = { type, amount: row && Number(row.outstanding || 0) > 0 ? String(row.outstanding) : '', note: '' }
  receiptPicked.value = false
  utilitiesCollectOpen.value = true
}
function submitRentQuickCollection() { const amount = Number(rentQuickForm.value.amount); const note = String(rentQuickForm.value.note || '').trim(); if (!Number.isFinite(amount) || amount <= 0) return uni.showToast({ title: '请输入有效金额', icon: 'none' }); if (!receiptPicked.value) return uni.showToast({ title: '请先上传凭证', icon: 'none' }); const changed = updateRoomDraft((draftRoom) => selectedRentTermId.value ? markPaymentTermPaid(draftRoom, selectedRentTermId.value, { amount, note, now: nowString(), receiptPicked: receiptPicked.value }) : recordRentCollection(draftRoom, { amount, note, now: nowString(), receiptPicked: receiptPicked.value })); if (!changed) return; selectedRentTermId.value = ''; rentQuickForm.value = { amount: '', note: '' }; receiptPicked.value = false; rentCollectOpen.value = false }
function submitUtilityQuickCollection() { const amount = Number(utilityQuickForm.value.amount); const note = String(utilityQuickForm.value.note || '').trim(); const type = utilityQuickForm.value.type || 'water'; if (!Number.isFinite(amount) || amount <= 0) return uni.showToast({ title: '请输入有效金额', icon: 'none' }); const changed = updateRoomDraft((draftRoom) => recordDirectUtilityCollection(draftRoom, { type, amount, note, title: `${fmtDate(nowString().slice(0, 10))} ${utilityTypeLabel(type)}`, now: nowString(), receiptPicked: receiptPicked.value })); if (!changed) return; utilityQuickForm.value = { type: 'water', amount: '', note: '' }; receiptPicked.value = false; utilitiesCollectOpen.value = false }
function pickMeterPhoto(type) { meterPhotoPicked.value = { ...meterPhotoPicked.value, [type]: true }; uni.showToast({ title: `${type === 'water' ? '水表' : '电表'}照片已上传`, icon: 'none' }) }
function confirmMeter() {
  if (!room.value || !meterCalc.value) return uni.showToast({ title: '请先录入读数', icon: 'none' })
  const changed = updateRoomDraft((draftRoom) => { createUtilitiesBillFromMeter(draftRoom, meterCalc.value, { now: nowString() }) })
  if (!changed) return
  meterOpen.value = false
  meterForm.value = { water: room.value?.lastWater ?? '', electric: room.value?.lastElectric ?? '', gas: '' }
  meterPhotoPicked.value = { water: false, electric: false }
  uni.showToast({ title: '水电费用已更新', icon: 'none' })
}
function confirmCheckout() { const water = Number(checkoutForm.value.water); const electric = Number(checkoutForm.value.electric); const gas = Number(checkoutForm.value.gas); const refund = Number(checkoutForm.value.refund); if (!Number.isFinite(water) || !Number.isFinite(electric) || !Number.isFinite(gas) || !Number.isFinite(refund)) return uni.showToast({ title: '请完整填写退租结算', icon: 'none' }); const changed = updateRoomDraft((draftRoom) => { checkoutRoomWithSettlement(draftRoom, { water, electric, gas, refund }, { now: nowString() }) }); if (!changed) return; checkoutOpen.value = false; emit('close') }
function confirmEditRoom() {
  const tenant = String(editForm.value.tenant || '').trim()
  const phone = String(editForm.value.phone || '').trim()
  const rent = Number(editForm.value.rent)
  const deposit = Number(editForm.value.deposit)
  const paymentCycle = Number(editForm.value.paymentCycle)
  const leaseStart = String(editForm.value.leaseStart || '').trim()
  const leaseEnd = String(editForm.value.leaseEnd || '').trim()
  if (!tenant) return uni.showToast({ title: '请填写租客姓名', icon: 'none' })
  if (!Number.isFinite(rent) || rent <= 0 || !Number.isFinite(deposit) || deposit < 0 || !Number.isFinite(paymentCycle) || paymentCycle <= 0) {
    return uni.showToast({ title: '请完善租约信息', icon: 'none' })
  }
  const changed = updateRoomDraft((draftRoom) => {
    draftRoom.tenant = tenant
    draftRoom.phone = phone
    draftRoom.rent = rent
    draftRoom.deposit = deposit
    draftRoom.paymentCycle = paymentCycle
    draftRoom.leaseStart = leaseStart
    draftRoom.leaseEnd = leaseEnd
    const activeOccupancy = (draftRoom.occupancies || []).find((item) => item.status === 'active')
    if (activeOccupancy) {
      activeOccupancy.tenant = tenant
      activeOccupancy.phone = phone
      activeOccupancy.rent = rent
      activeOccupancy.deposit = deposit
      activeOccupancy.paymentCycle = paymentCycle
      activeOccupancy.startDate = leaseStart
      activeOccupancy.endDate = leaseEnd
    }
    const nextSchedule = generatePaymentSchedule({
      startDate: leaseStart,
      endDate: leaseEnd,
      cycleMonths: paymentCycle,
      rentPerCycle: rent,
    })
    const previousSchedule = Array.isArray(draftRoom.paymentSchedule) ? draftRoom.paymentSchedule : []
    draftRoom.paymentSchedule = nextSchedule.map((term, index) => {
      const previous = previousSchedule[index]
      if (!previous) return term
      const covered = Math.min(Number(term.expectedAmount || 0), Number(previous.coveredAmount || previous.paidAmount || 0))
      return {
        ...term,
        paidAmount: covered,
        coveredAmount: covered,
        payDate: previous.payDate || '',
        receiptPic: Boolean(previous.receiptPic),
        status: covered >= Number(term.expectedAmount || 0) ? 'paid' : covered > 0 ? 'unpaid' : (previous.status || 'unpaid'),
      }
    })
    draftRoom.history.unshift({
      id: `h_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: 'edit_room_info',
      date: nowString(),
      remark: '更新了租客和租约信息',
    })
  })
  if (!changed) return
  editOpen.value = false
  uni.showToast({ title: '已保存修改', icon: 'success' })
}
function occupancyRentTotal(occupancy) {
  if (!occupancy) return 0
  const paymentSchedule = occupancy.archive?.paymentSchedule || []
  if (paymentSchedule.length > 0) {
    return paymentSchedule.reduce((sum, item) => sum + Number(item.expectedAmount || 0), 0)
  }
  if (occupancy.status === 'active') {
    return (room.value?.paymentSchedule || []).reduce((sum, item) => sum + Number(item.expectedAmount || 0), 0)
  }
  return Number(occupancy.rent || 0)
}
function occupancyExtraCollectionTotal(occupancy) {
  if (!occupancy) return 0
  const collections = occupancy.archive?.collections || (occupancy.status === 'active' ? room.value?.collections || [] : [])
  return collections
    .filter((item) => item.kind !== 'rent')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)
}
</script>

<style>
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
.icon-settings { position: relative; width: 30rpx; height: 30rpx; display: flex; align-items: center; justify-content: center; }
.icon-settings-ring { width: 24rpx; height: 24rpx; border: 2rpx solid #64748b; border-radius: 9999rpx; }
.icon-settings-core { position: absolute; width: 8rpx; height: 8rpx; border-radius: 9999rpx; background: #64748b; }
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
.term-no { font-size:28rpx; font-weight:500; color:#0f172a; text-align:center; justify-self:center; }
.term-money-stack { display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; }
.utility-money-cell { align-items:center; }
.utility-money-cell .term-money-row { width:auto; min-width:132rpx; }
.term-money-row { display:grid; grid-template-columns:24rpx minmax(0,1fr); align-items:center; column-gap:6rpx; width:auto; min-width:132rpx; line-height:1.15; }
.term-money-label { font-size:20rpx; color:#94a3b8; font-weight:500; text-align:right; }
.term-money-value { font-size:26rpx; font-weight:500; color:#0f172a; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Courier New',monospace; }
.term-money-sub { margin-top:4rpx; }
.term-money-sub .term-money-value { font-size:22rpx; color:#64748b; }
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
.utility-table-head { display:grid; grid-template-columns:minmax(0,.9fr) minmax(0,1.15fr) minmax(0,.7fr) minmax(0,.95fr); gap:12rpx; padding:16rpx 18rpx; background:#f8fafc; color:#64748b; font-size:26rpx; font-weight:700; align-items:center; text-align:center; }
.utility-table-head > text { justify-self:center; text-align:center; }
.utility-table-row { display:grid; grid-template-columns:minmax(0,.9fr) minmax(0,1.15fr) minmax(0,.7fr) minmax(0,.95fr); gap:12rpx; padding:18rpx 18rpx; border-top:1rpx solid rgba(226,232,240,.9); align-items:center; }
.utility-cell { min-width:0; }
.utility-type { display:flex; align-items:center; justify-content:center; text-align:center; }
.utility-type-name { font-size:26rpx; font-weight:500; color:#0f172a; }
.utility-type-sub { margin-top:6rpx; font-size:22rpx; color:#94a3b8; font-weight:600; }
.utility-action { display:flex; flex-direction:column; gap:8rpx; align-items:center; justify-content:center; }
.utility-action-primary { min-width:96rpx; padding:14rpx 18rpx; border-radius:12rpx; color:#fff; font-size:24rpx; font-weight:700; line-height:1; }
.utility-included-text { font-size: 22rpx; line-height: 1.25; color: #94a3b8; font-weight: 500; text-align: center; }
.detail-footer-emerald { background: linear-gradient(135deg, #34d399, #4ade80); box-shadow: 0 16rpx 28rpx rgba(52, 211, 153, 0.18); }
.detail-footer-rose { background: linear-gradient(135deg, #fb7185, #ef4444); box-shadow: 0 16rpx 28rpx rgba(239, 68, 68, 0.18); }
.rent-collect-hero { padding:32rpx; border-radius:28rpx; color:#fff; background:linear-gradient(135deg,#4f46e5,#3b82f6); box-shadow:0 18rpx 36rpx rgba(59,130,246,.18); position:relative; overflow:hidden; }
.utility-collect-hero { background:linear-gradient(135deg,#f59e0b,#f97316); box-shadow:0 18rpx 36rpx rgba(249,115,22,.18); }
.rent-collect-hero::after { content:''; position:absolute; right:-28rpx; bottom:-28rpx; width:140rpx; height:140rpx; border-radius:9999rpx; background:rgba(255,255,255,.10); filter:blur(6rpx); }
.rent-collect-hero-top { display:flex; align-items:center; justify-content:space-between; gap:16rpx; position:relative; z-index:1; }
.rent-collect-hero-label { font-size:22rpx; font-weight:700; color:rgba(219,234,254,.95); }
.rent-collect-hero-badge { padding:6rpx 14rpx; border-radius:12rpx; font-size:18rpx; font-weight:700; color:#eff6ff; background:rgba(255,255,255,.18); }
.rent-collect-hero-amount { margin-top:18rpx; font-size:54rpx; line-height:1; font-weight:900; position:relative; z-index:1; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Courier New',monospace; }
.rent-collect-hero-bottom { margin-top:24rpx; padding-top:22rpx; border-top:1rpx solid rgba(255,255,255,.22); display:flex; align-items:flex-start; justify-content:space-between; gap:20rpx; position:relative; z-index:1; }
.rent-collect-hero-sub-label { font-size:18rpx; color:rgba(219,234,254,.92); }
.rent-collect-hero-sub-value { margin-top:6rpx; font-size:28rpx; font-weight:800; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Courier New',monospace; }
.rent-collect-section { padding:28rpx; border-radius:28rpx; background:#fff; border:1rpx solid rgba(226,232,240,.9); box-shadow:0 10rpx 28rpx rgba(15,23,42,.05); }
.rent-collect-label { font-size:24rpx; font-weight:800; color:#334155; }
.rent-collect-input-wrap { margin-top:18rpx; position:relative; }
.rent-collect-currency { position:absolute; left:26rpx; top:50%; transform:translateY(-50%); font-size:34rpx; font-weight:800; color:#94a3b8; z-index:1; }
.rent-collect-input { width:100%; height:88rpx; padding:0 24rpx 0 58rpx; border-radius:24rpx; border:1rpx solid rgba(226,232,240,.95); background:#f8fafc; font-size:38rpx; line-height:88rpx; font-weight:800; color:#0f172a; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Courier New',monospace; box-sizing:border-box; }
.rent-collect-alert { margin-top:12rpx; font-size:20rpx; font-weight:700; color:#d97706; }
.rent-upload-zone { width:100%; margin-top:16rpx; padding:22rpx 24rpx; min-height:180rpx; border-radius:24rpx; border:2rpx dashed rgba(203,213,225,.95); background:rgba(248,250,252,.8); display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
.rent-upload-zone-done { border-color:rgba(167,243,208,.95); background:rgba(236,253,245,.9); }
.rent-upload-icon { width:60rpx; height:60rpx; border-radius:9999rpx; display:flex; align-items:center; justify-content:center; background:#fff; border:1rpx solid rgba(226,232,240,.95); color:#94a3b8; font-size:24rpx; font-weight:900; }
.rent-upload-icon-done { background:#10b981; border-color:#10b981; color:#fff; }
.rent-upload-title { margin-top:12rpx; font-size:22rpx; font-weight:700; color:#475569; }
.rent-upload-sub { margin-top:4rpx; font-size:18rpx; color:#94a3b8; }
.rent-footer-confirm-badge { padding:4rpx 10rpx; border-radius:10rpx; background:rgba(255,255,255,.18); font-size:18rpx; font-weight:700; }
.compact-table-head { display:grid; grid-template-columns:minmax(0, .9fr) minmax(0, 2.25fr) minmax(0, .85fr); gap:18rpx; padding:16rpx 20rpx; background:#f8fafc; color:#64748b; font-size:20rpx; font-weight:700; align-items:center; text-align:center; }
.compact-table-head > text:nth-child(1) { text-align:left; }
.compact-table-head > text:nth-child(2) { text-align:left; }
.compact-table-head > text:nth-child(3) { text-align:right; }
.compact-table-row { display:grid; grid-template-columns:minmax(0, .9fr) minmax(0, 2.25fr) minmax(0, .85fr); gap:18rpx; padding:18rpx 20rpx; border-top:1rpx solid rgba(226,232,240,.9); align-items:start; }
.compact-table-date { color:#64748b; font-size:20rpx; line-height:1.35; text-align:left; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Courier New',monospace; }
.compact-table-title { color:#0f172a; font-size:24rpx; font-weight:800; line-height:1.3; }
.compact-table-sub { margin-top:6rpx; color:#94a3b8; font-size:20rpx; font-weight:500; line-height:1.3; }
.compact-table-amount { color:#0f172a; font-size:24rpx; font-weight:800; line-height:1.35; text-align:right; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Courier New',monospace; }
@media (max-width: 380px) {
  .utility-table-head, .utility-table-row { grid-template-columns:minmax(0,.85fr) minmax(0,1.05fr) minmax(0,.65fr) minmax(0,.9fr); gap:8rpx; }
  .utility-meter-strip-double { grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto; gap:10rpx; }
  .utility-meter-strip-single { grid-template-columns:minmax(0,1fr) auto; gap:10rpx; }
  .compact-table-head, .compact-table-row { grid-template-columns:minmax(0, .85fr) minmax(0, 1.95fr) minmax(0, .8fr); gap:10rpx; }
  .rent-collect-hero-amount { font-size:48rpx; }
  .rent-collect-input { font-size:34rpx; }
}
@keyframes room-sheet-enter { from { transform:translateY(36px); opacity:0; } to { transform:translateY(0); opacity:1; } }
</style>
