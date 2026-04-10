<template>
  <view class="min-h-screen bg-slate-900-45 flex items-end justify-center" @click="closeSelf">
    <view class="w-full max-w-md drawer-page-panel flex flex-col bg-slate-50 rounded-t-3xl shadow-2xl relative overflow-hidden" @click.stop>
      <view class="bg-white-80 border-b px-5 pt-3 pb-3 border-slate-200-60 relative shrink-0">
        <view class="flex justify-center">
          <view class="w-12 h-1_5 rounded-full bg-slate-200 mt-1"></view>
        </view>
        <view class="flex items-center justify-between gap-3">
          <view class="flex items-center gap-3 min-w-0">
            <button class="nav-icon-button tap-scale" @click="closeSelf"><view class="icon-close"><view class="icon-close-line"></view><view class="icon-close-line icon-close-line-second"></view></view></button>
            <view class="min-w-0">
              <view class="flex items-center gap-2 min-w-0">
                <view class="font-black text-slate-900 text-lg font-mono truncate">{{ room?.roomNo || '房间' }}</view>
                <view v-if="room" class="text-2xs font-bold px-2 py-1 rounded-full border" :class="statusTag(room.status)">
                  {{ statusLabel(room.status) }}
                </view>
              </view>
              <view class="text-xs text-slate-400 font-medium mt-0_5 truncate">
                {{ property?.name || '' }}<text v-if="property" class="mx-1 text-slate-200">|</text>{{ block?.name || '' }}
              </view>
            </view>
          </view>

          <button class="px-3 py-1_5 rounded-full text-xs font-bold btn-soft text-slate-600 tap-scale" @click="rentCollectOpen = true">
            记收
          </button>
        </view>

        <view class="mt-4">
          <view class="p-1 surface-muted rounded-2xl flex gap-1">
            <button
              class="flex-1 py-2 rounded-xl text-xs font-black tap-scale"
              :class="tab === 'current' ? 'bg-white text-slate-900 shadow-soft' : 'bg-transparent text-slate-500'"
              @click="tab = 'current'"
            >
              当前情况
            </button>
            <button
              class="flex-1 py-2 rounded-xl text-xs font-black tap-scale"
              :class="tab === 'history' ? 'bg-white text-slate-900 shadow-soft' : 'bg-transparent text-slate-500'"
              @click="tab = 'history'"
            >
              历史入住
            </button>
          </view>
        </view>
      </view>

      <scroll-view scroll-y class="drawer-scroll-area" :scroll-with-animation="true" enable-flex>
        <view v-if="!room" class="p-5">
          <view class="p-5 rounded-2xl surface-card">
            <view class="text-sm text-slate-600 font-medium leading-relaxed">房间不存在或参数缺失。</view>
          </view>
        </view>

        <view v-else class="p-5 stack-4">
          <view v-if="tab === 'history'" class="stack-4">
            <view class="p-5 rounded-2xl surface-card">
              <view class="flex items-center justify-between">
                <view class="font-black text-slate-800">历史入住情况</view>
                <view class="text-2xs text-slate-400 font-bold">时间轴</view>
              </view>
              <view class="text-xs text-slate-400 font-medium mt-1">按时间轴组织，可追溯上一任租客与空置期。</view>
              <view class="mt-4">
                <OccupancyTimeline :occupancies="room.occupancies || []" />
              </view>
            </view>

            <view class="p-5 rounded-2xl surface-card">
              <view class="font-black text-slate-800">流转记录</view>
              <view class="text-xs text-slate-400 font-medium mt-1">这里是操作留痕，包含记账、抄表、退租等。</view>
              <view v-if="room.history.length === 0" class="text-sm text-slate-500 font-medium mt-3">暂无记录。</view>
              <view v-else class="mt-3 stack-2">
                <view v-for="h in room.history.slice(0, 10)" :key="h.id" class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <view class="flex items-center justify-between gap-3">
                    <view class="font-black text-slate-700 text-sm">{{ h.type }}</view>
                    <view class="text-2xs text-slate-400 font-mono">{{ h.date }}</view>
                  </view>
                  <view class="text-xs text-slate-600 font-medium leading-relaxed mt-1">{{ h.remark }}</view>
                </view>
              </view>
            </view>

            <view class="h-16"></view>
          </view>

          <view v-else class="stack-4">
          <view v-if="room.status === 'empty'" class="p-5 rounded-2xl surface-card">
            <view class="font-black text-slate-800">当前房间为空置</view>
            <view class="text-sm text-slate-600 font-medium leading-relaxed mt-2">
              空置房建议先通过“办理入住”录入租客与双证，再进入详情管理。
            </view>
            <button class="w-full py-4 rounded-xl btn-emerald font-bold tap-scale mt-4" @click="goCheckIn">
              去办理入住
            </button>
          </view>

          <view class="p-5 rounded-2xl surface-card">
            <view class="flex items-start justify-between gap-3">
              <view class="min-w-0">
                <view class="text-xs text-slate-400 font-bold">租客</view>
                <view class="text-base font-black text-slate-800 mt-1 truncate">
                  {{ room.tenant || '未办理入住' }}
                </view>
                <view class="text-xs text-slate-500 font-mono mt-1">
                  {{ room.phone || '手机号未录入' }}
                </view>
              </view>
              <view class="flex gap-2 shrink-0">
                <button
                  class="px-3 py-2 rounded-xl text-xs font-bold border tap-scale"
                  :class="room.hasIdCardPic ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'"
                  @click="handleAttachment('idCard')"
                >
                  {{ room.hasIdCardPic ? '查看身份证' : '上传身份证' }}
                </button>
                <button
                  class="px-3 py-2 rounded-xl text-xs font-bold border tap-scale"
                  :class="room.hasContract ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'"
                  @click="handleAttachment('contract')"
                >
                  {{ room.hasContract ? '查看合同' : '上传合同' }}
                </button>
              </view>
            </view>

            <view class="grid grid-cols-3 gap-3 mt-4">
              <view class="p-3 rounded-xl surface-muted">
                <view class="text-2xs text-slate-500 font-bold">租金</view>
                <view class="text-sm font-black text-slate-800 mt-1">¥{{ room.rent }}/期</view>
              </view>
              <view class="p-3 rounded-xl surface-muted">
                <view class="text-2xs text-slate-500 font-bold">押金</view>
                <view class="text-sm font-black text-slate-800 mt-1">¥{{ room.deposit }}</view>
              </view>
              <view class="p-3 rounded-xl surface-muted">
                <view class="text-2xs text-slate-500 font-bold">周期</view>
                <view class="text-sm font-black text-slate-800 mt-1">{{ cycleLabel(room.paymentCycle) }}</view>
              </view>
            </view>

            <view v-if="room.status === 'overdue' || room.status === 'due_soon'" class="p-4 rounded-2xl border mt-4" :class="room.status === 'overdue' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'">
              <view class="flex items-center justify-between gap-3">
                <view>
                  <view class="text-xs font-bold" :class="room.status === 'overdue' ? 'text-rose-700' : 'text-amber-700'">
                    {{ room.status === 'overdue' ? '已逾期待收' : '临期待收' }}
                  </view>
                  <view class="text-2xs font-mono mt-1" :class="room.status === 'overdue' ? 'text-rose-600' : 'text-amber-600'">
                    截止 {{ room.nextDueDate || '本期' }}
                  </view>
                </view>
                <view class="text-lg font-black font-mono" :class="room.status === 'overdue' ? 'text-rose-700' : 'text-amber-700'">
                  ¥{{ room.nextDueAmount || room.rent * (room.paymentCycle || 1) }}
                </view>
              </view>
              <view class="flex gap-2 mt-3">
                <button class="flex-1 py-3 rounded-xl btn-slate text-xs font-bold tap-scale" @click="rentCollectOpen = true">
                  去收房租
                </button>
                <button class="flex-1 py-3 rounded-xl btn-amber text-xs font-bold tap-scale" @click="utilitiesCollectOpen = true">
                  去收水电
                </button>
              </view>
            </view>
          </view>

          <view v-if="room.status !== 'empty'" class="p-5 rounded-2xl surface-card">
            <view class="flex items-center justify-between gap-3">
              <view>
                <view class="font-black text-slate-800">收费进度</view>
                <view class="text-xs text-slate-400 font-medium mt-1">按期收款为主，支持灵活收费，确保都收完。</view>
              </view>
              <view
                class="text-2xs font-bold px-3 py-1 rounded-full border shrink-0"
                :class="overallOutstandingCount === 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'"
              >
                {{ overallOutstandingCount === 0 ? '已收清' : `待收 ${overallOutstandingCount}` }}
              </view>
            </view>

            <view class="mt-4">
              <view class="h-2 rounded-full bg-slate-200 overflow-hidden">
                <view
                  class="h-2 rounded-full"
                  :class="overallOutstandingCount === 0 ? 'bg-emerald-500' : 'bg-blue-600'"
                  :style="{ width: overallProgressPct + '%' }"
                ></view>
              </view>
              <view class="flex items-center justify-between text-2xs text-slate-500 font-mono mt-2">
                <view>已收 ¥{{ overallPaid }}</view>
                <view>应收 ¥{{ overallExpected }}</view>
              </view>
            </view>

            <view class="mt-4 stack-3">
              <button class="w-full p-4 rounded-2xl surface-muted tap-scale text-left" @click="rentCollectOpen = true">
                <view class="flex items-center justify-between gap-3">
                  <view class="min-w-0">
                    <view class="font-black text-slate-900">收房租</view>
                    <view class="text-xs text-slate-500 font-mono mt-1">
                      ¥{{ rentPaid }} / ¥{{ rentExpected }}
                      <text class="mx-2 text-slate-200">|</text>
                      {{ rentProgressPct }}%
                    </view>
                  </view>
                  <view
                    class="text-2xs font-bold px-3 py-1 rounded-full border shrink-0"
                    :class="rentOutstandingCount === 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'"
                  >
                    {{ rentOutstandingCount === 0 ? '已收清' : `待收${rentOutstandingCount}` }}
                  </view>
                </view>
                <view class="mt-3 h-2 rounded-full bg-white border border-slate-200-60 overflow-hidden">
                  <view class="h-2 bg-slate-900 rounded-full" :style="{ width: rentProgressPct + '%' }"></view>
                </view>
              </button>

              <button class="w-full p-4 rounded-2xl surface-muted tap-scale text-left" @click="utilitiesCollectOpen = true">
                <view class="flex items-center justify-between gap-3">
                  <view class="min-w-0">
                    <view class="font-black text-slate-900">收水电</view>
                    <view class="text-xs text-slate-500 font-mono mt-1">
                      ¥{{ utilitiesPaid }} / ¥{{ utilitiesExpected }}
                      <text class="mx-2 text-slate-200">|</text>
                      {{ utilitiesProgressPct }}%
                    </view>
                  </view>
                  <view
                    class="text-2xs font-bold px-3 py-1 rounded-full border shrink-0"
                    :class="utilitiesOutstandingCount === 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'"
                  >
                    {{ utilitiesOutstandingCount === 0 ? '已收清' : `待收${utilitiesOutstandingCount}` }}
                  </view>
                </view>
                <view class="mt-3 h-2 rounded-full bg-white border border-slate-200 overflow-hidden">
                  <view class="h-2 bg-amber-500 rounded-full" :style="{ width: utilitiesProgressPct + '%' }"></view>
                </view>
              </button>
            </view>
          </view>

          <view class="p-5 rounded-2xl surface-card">
            <view class="flex items-center justify-between">
              <view class="font-black text-slate-800">水电抄表</view>
              <button class="text-blue-600 text-xs font-bold tap-scale" @click="meterOpen = true">录入抄表</button>
            </view>
            <view class="grid grid-cols-2 gap-3 mt-4">
              <view class="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <view class="text-2xs text-slate-500 font-bold">上次水表</view>
                <view class="text-sm font-black text-slate-800 mt-1">{{ room.lastWater }}</view>
              </view>
              <view class="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <view class="text-2xs text-slate-500 font-bold">上次电表</view>
                <view class="text-sm font-black text-slate-800 mt-1">{{ room.lastElectric }}</view>
              </view>
            </view>
            <view class="text-2xs text-slate-400 font-medium mt-3">
              单价：水 ¥{{ room.waterPrice }}/吨 电 ¥{{ room.electricPrice }}/度
            </view>
          </view>

          <view class="p-5 rounded-2xl surface-card">
            <view class="flex items-center justify-between">
              <view class="font-black text-slate-800">杂费与灵活收费</view>
              <button class="text-blue-600 text-xs font-bold tap-scale" @click="utilitiesCollectOpen = true">管理</button>
            </view>
            <view v-if="room.bills.length === 0" class="text-sm text-slate-500 font-medium mt-3">暂无记录。</view>
            <view v-else class="mt-3 stack-2">
              <view
                v-for="bill in room.bills.filter((b) => b.type !== 'rent').slice(0, 6)"
                :key="bill.id"
                class="p-4 rounded-2xl border"
                :class="bill.status === 'paid' ? 'bg-emerald-50 border-emerald-200' : bill.status === 'unpaid' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'"
              >
                <view class="flex items-center justify-between gap-3">
                  <view class="min-w-0">
                    <view class="font-black text-slate-800 text-sm truncate">{{ bill.title }}</view>
                    <view class="text-2xs text-slate-500 font-mono mt-1">
                      到期 {{ bill.dueDate || '-' }}<text class="mx-1 text-slate-200">|</text>{{ bill.status === 'paid' ? '已结清' : '待记收' }}
                    </view>
                  </view>
                  <view class="text-slate-900 font-black font-mono">锟{ bill.amount }}</view>
                </view>
              </view>
            </view>
          </view>

          <view class="p-5 rounded-2xl surface-card">
            <view class="font-black text-slate-800">流转记录</view>
            <view v-if="room.history.length === 0" class="text-sm text-slate-500 font-medium mt-3">暂无记录。</view>
            <view v-else class="mt-3 stack-2">
              <view v-for="h in room.history.slice(0, 6)" :key="h.id" class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <view class="flex items-center justify-between gap-3">
                  <view class="font-black text-slate-700 text-sm">{{ h.type }}</view>
                  <view class="text-2xs text-slate-400 font-mono">{{ h.date }}</view>
                </view>
                <view class="text-xs text-slate-600 font-medium leading-relaxed mt-1">{{ h.remark }}</view>
              </view>
            </view>
          </view>

          <view class="h-16"></view>
          </view>
        </view>
      </scroll-view>

      <view v-if="room && tab === 'current' && room.status !== 'empty'" class="absolute inset-x-0 bottom-0 bg-white border-t border-slate-200-60">
        <view class="px-5 py-2 flex items-center justify-end">
          <button class="px-4 py-2 rounded-xl btn-rose text-xs font-black tap-scale" @click="checkoutOpen = true">
            退租
          </button>
        </view>
      </view>

      <InnerDrawer :open="rentCollectOpen" title="收房租" subtitle="按期为主，灵活补充，确保账齐" @close="rentCollectOpen = false">
        <view class="stack-3">
          <view class="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <view class="text-xs text-slate-200 font-bold">房租进度</view>
            <view class="text-2xl font-black font-mono mt-2">¥{{ rentPaid }} / ¥{{ rentExpected }}</view>
            <view class="text-xs text-slate-200 font-medium mt-2">
              {{ rentOutstandingCount === 0 ? '本租约房租已收清' : `还有 ${rentOutstandingCount} 期未收完` }}
            </view>
            <view class="mt-4 h-2 rounded-full bg-white-20 overflow-hidden">
              <view class="h-2 bg-emerald-400 rounded-full" :style="{ width: rentProgressPct + '%' }"></view>
            </view>
            <view class="flex items-center justify-between text-2xs text-slate-200 font-mono mt-2">
              <view>{{ rentProgressPct }}%</view>
              <view>待收 ¥{{ Math.max(0, Math.round((rentExpected - rentPaid) * 100) / 100) }}</view>
            </view>
          </view>

            <view class="p-4 rounded-2xl surface-card">
              <view class="flex items-center justify-between">
                <view class="font-black text-slate-800">按期收款</view>
                <view class="text-2xs text-slate-400 font-bold">分期条目</view>
              </view>
            <view v-if="rentTerms.length === 0" class="text-sm text-slate-500 font-medium mt-3">暂无分期条目。</view>
            <view v-else class="mt-3 stack-2">
              <view
                v-for="term in rentTerms"
                :key="term.id"
                class="p-4 rounded-2xl border border-slate-200-60 bg-white flex items-start justify-between gap-3"
              >
                <view class="min-w-0">
                  <view class="font-black text-slate-800 text-sm">
                    第 {{ term.term }} 期<text class="mx-1 text-slate-200">|</text>
                    <text class="font-mono text-slate-500">{{ fmtDate(term.startDate) }}~{{ fmtDate(term.endDate) }}</text>
                  </view>
                  <view class="text-2xs text-slate-500 font-mono mt-1">
                    到期 {{ fmtDate(term.dueDate) }}
                    <text class="mx-1 text-slate-200">|</text>
                    应收 ¥{{ term.expectedAmount }}
                    <text class="mx-1 text-slate-200">|</text>
                    已收 ¥{{ term.paidAmount }}
                  </view>
                  <view class="flex gap-2 mt-3">
                    <button
                      class="px-3 py-2 rounded-xl text-xs font-bold tap-scale"
                      :class="term.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'btn-blue'"
                      :disabled="term.status === 'paid'"
                      @click="markTermPaid(term.id)"
                    >
                      {{ term.status === 'paid' ? '已记收' : '记为已收' }}
                    </button>
                  </view>
                </view>
                <view class="text-2xs font-bold px-3 py-1 rounded-full border shrink-0" :class="termTag(term.status)">
                  {{ termStatusText(term.status) }}
                </view>
              </view>
            </view>
          </view>

          <view class="p-4 rounded-2xl surface-card">
            <view class="flex items-center justify-between">
              <view class="font-black text-slate-800">灵活收费</view>
              <view class="text-2xs text-slate-400 font-bold">特殊情况</view>
            </view>
            <view class="text-xs text-slate-400 font-medium mt-1">例如补差价、钥匙押金、维修分摊等。</view>

            <view v-if="customBills.length === 0" class="text-sm text-slate-500 font-medium mt-3">暂无灵活收费项。</view>
            <view v-else class="mt-3 stack-2">
              <view
                v-for="bill in customBills"
                :key="bill.id"
                class="p-4 rounded-2xl border border-slate-200-60 bg-white flex items-center justify-between gap-3"
              >
                <view class="min-w-0">
                  <view class="font-black text-slate-800 text-sm truncate">{{ bill.title }}</view>
                  <view class="text-2xs text-slate-500 font-mono mt-1">¥{{ bill.amount }}<text class="mx-2 text-slate-200">|</text>到期 {{ fmtDate(bill.dueDate) }}</view>
                </view>
                <button
                  class="px-3 py-2 rounded-xl text-xs font-bold tap-scale"
                  :class="bill.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'btn-blue'"
                  :disabled="bill.status === 'paid'"
                  @click="markBillPaid(bill.id)"
                >
                  {{ bill.status === 'paid' ? '已记收' : '记收' }}
                </button>
              </view>
            </view>

            <view class="grid grid-cols-2 gap-3 mt-4">
              <view class="p-3 rounded-2xl surface-muted">
                <view class="text-2xs text-slate-500 font-bold">项目</view>
                <input v-model="flexForm.title" type="text" class="mt-2 w-full px-3 py-3 input-soft rounded-xl font-medium text-xs" placeholder="例如：维修分摊" />
              </view>
              <view class="p-3 rounded-2xl surface-muted">
                <view class="text-2xs text-slate-500 font-bold">金额</view>
                <input v-model="flexForm.amount" type="number" class="mt-2 w-full px-3 py-3 input-soft rounded-xl font-mono text-xs" placeholder="例如：120" />
              </view>
            </view>
            <button class="w-full py-4 rounded-xl btn-slate font-bold tap-scale mt-3" @click="addFlexCharge">
              添加灵活收费项
            </button>
          </view>

          <view class="p-4 rounded-2xl surface-muted">
            <view class="text-xs text-slate-500 font-bold">支付凭证(可选)</view>
            <view class="flex items-center justify-between gap-3 mt-2">
              <view class="text-sm text-slate-700 font-medium">{{ receiptPicked ? '已选择截图(模拟)' : '未选择' }}</view>
              <button class="px-3 py-2 rounded-xl btn-slate text-xs font-bold tap-scale" @click="pickReceipt">选择截图</button>
            </view>
          </view>
        </view>
      </InnerDrawer>

      <InnerDrawer :open="utilitiesCollectOpen" title="收水电" subtitle="抄表生成杂费单，记账收齐" @close="utilitiesCollectOpen = false">
        <view class="stack-3">
          <view class="p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
            <view class="text-xs text-amber-50 font-bold">水电杂费进度</view>
            <view class="text-2xl font-black font-mono mt-2">¥{{ utilitiesPaid }} / ¥{{ utilitiesExpected }}</view>
            <view class="text-xs text-amber-50 font-medium mt-2">
              {{ utilitiesOutstandingCount === 0 ? '杂费已收清' : `还有 ${utilitiesOutstandingCount} 笔杂费待记账` }}
            </view>
            <view class="mt-4 h-2 rounded-full bg-white-20 overflow-hidden">
              <view class="h-2 bg-slate-900 rounded-full" :style="{ width: utilitiesProgressPct + '%' }"></view>
            </view>
            <view class="flex items-center justify-between text-2xs text-amber-50 font-mono mt-2">
              <view>{{ utilitiesProgressPct }}%</view>
              <view>待收 ¥{{ Math.max(0, Math.round((utilitiesExpected - utilitiesPaid) * 100) / 100) }}</view>
            </view>
          </view>

          <button class="w-full py-4 rounded-xl btn-amber font-bold tap-scale" @click="meterOpen = true">
            去抄表生成杂费单
          </button>

          <view class="p-4 rounded-2xl surface-card">
            <view class="flex items-center justify-between">
              <view class="font-black text-slate-800">杂费单</view>
              <view class="text-2xs text-slate-400 font-bold">可记收</view>
            </view>
            <view v-if="utilitiesBills.length === 0" class="text-sm text-slate-500 font-medium mt-3">暂无杂费单。</view>
            <view v-else class="mt-3 stack-2">
              <view
                v-for="bill in utilitiesBills"
                :key="bill.id"
                class="p-4 rounded-2xl border border-slate-200-60 bg-white flex items-center justify-between gap-3"
              >
                <view class="min-w-0">
                  <view class="font-black text-slate-800 text-sm truncate">{{ bill.title }}</view>
                  <view class="text-2xs text-slate-500 font-mono mt-1">¥{{ bill.amount }}<text class="mx-2 text-slate-200">|</text>到期 {{ fmtDate(bill.dueDate) }}</view>
                </view>
                <button
                  class="px-3 py-2 rounded-xl text-xs font-bold tap-scale"
                  :class="bill.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'btn-blue'"
                  :disabled="bill.status === 'paid'"
                  @click="markBillPaid(bill.id)"
                >
                  {{ bill.status === 'paid' ? '已记收' : '记收' }}
                </button>
              </view>
            </view>
          </view>

          <view class="p-4 rounded-2xl surface-muted">
            <view class="text-xs text-slate-500 font-bold">支付凭证(可选)</view>
            <view class="flex items-center justify-between gap-3 mt-2">
              <view class="text-sm text-slate-700 font-medium">{{ receiptPicked ? '已选择截图(模拟)' : '未选择' }}</view>
              <button class="px-3 py-2 rounded-xl btn-slate text-xs font-bold tap-scale" @click="pickReceipt">
                选择截图
              </button>
            </view>
          </view>
        </view>
      </InnerDrawer>

      <InnerDrawer :open="meterOpen" title="水电抄表" subtitle="录入本期读数，自动计算差值与费用" @close="meterOpen = false">
        <view class="stack-3">
          <view class="p-4 rounded-2xl surface-muted">
            <view class="text-xs text-slate-500 font-bold">上期底数</view>
            <view class="text-sm text-slate-700 font-mono mt-2">
              水 {{ room?.lastWater }}<text class="mx-2 text-slate-200">|</text>电 {{ room?.lastElectric }}
            </view>
          </view>

          <view class="grid grid-cols-2 gap-3">
            <view class="p-4 rounded-2xl surface-card">
              <view class="text-xs text-slate-500 font-bold">本期水表</view>
              <input v-model="meterForm.water" type="number" class="mt-2 w-full px-3 py-3 input-soft rounded-xl font-mono" placeholder="例如：135.9" />
            </view>
            <view class="p-4 rounded-2xl surface-card">
              <view class="text-xs text-slate-500 font-bold">本期电表</view>
              <input v-model="meterForm.electric" type="number" class="mt-2 w-full px-3 py-3 input-soft rounded-xl font-mono" placeholder="例如：500" />
            </view>
          </view>

          <view v-if="meterCalc" class="p-4 rounded-2xl surface-card">
            <view class="font-black text-slate-800">自动计算</view>
            <view class="text-xs text-slate-500 font-mono mt-2">
              水 {{ meterCalc.waterDiff }} 吨 = ¥{{ meterCalc.waterCost }}
            </view>
            <view class="text-xs text-slate-500 font-mono mt-1">
              电 {{ meterCalc.electricDiff }} 度 = ¥{{ meterCalc.electricCost }}
            </view>
            <view class="mt-3 flex items-center justify-between">
              <view class="text-xs text-slate-400 font-bold">合计</view>
              <view class="text-lg font-black font-mono text-slate-900">¥{{ meterCalc.total }}</view>
            </view>
          </view>
        </view>
        <template #footer>
          <button class="w-full py-4 rounded-xl btn-amber font-bold tap-scale" @click="confirmMeter">
            生成杂费单
          </button>
        </template>
      </InnerDrawer>

      <InnerDrawer :open="writeoffOpen" title="记账收款" subtitle="标记已收，可选凭证截图留存(模拟)" @close="writeoffOpen = false">
        <view class="stack-3">
          <view v-if="unpaidBills.length === 0" class="p-4 rounded-2xl surface-card">
            <view class="text-sm text-slate-600 font-medium">暂无待记收账单。</view>
          </view>

          <view v-else class="stack-2">
            <view
              v-for="bill in unpaidBills"
              :key="bill.id"
              class="p-4 rounded-2xl surface-card flex items-center justify-between gap-3"
            >
              <view class="min-w-0">
                <view class="font-black text-slate-800 text-sm truncate">{{ bill.title }}</view>
                <view class="text-2xs text-slate-500 font-mono mt-1">¥{{ bill.amount }}<text class="mx-2 text-slate-200">|</text>到期 {{ bill.dueDate || '-' }}</view>
              </view>
              <button class="px-3 py-2 rounded-xl btn-blue text-xs font-bold tap-scale" @click="markBillPaid(bill.id)">
                记收
              </button>
            </view>
          </view>

          <view class="p-4 rounded-2xl surface-muted">
            <view class="text-xs text-slate-500 font-bold">支付凭证</view>
            <view class="flex items-center justify-between gap-3 mt-2">
              <view class="text-sm text-slate-700 font-medium">{{ receiptPicked ? '已选择截图(模拟)' : '未选择' }}</view>
              <button class="px-3 py-2 rounded-xl btn-slate text-xs font-bold tap-scale" @click="pickReceipt">
                选择截图
              </button>
            </view>
          </view>
        </view>
      </InnerDrawer>

      <InnerDrawer :open="checkoutOpen" title="办理退租" subtitle="影响房态与财务的操作会写入流转记录" @close="checkoutOpen = false">
        <view class="stack-3">
          <view class="p-4 rounded-2xl surface-card">
            <view class="text-xs text-slate-500 font-bold">最终水表</view>
            <input v-model="checkoutForm.water" type="number" class="mt-2 w-full px-3 py-3 input-soft rounded-xl font-mono" placeholder="例如：140" />
          </view>
          <view class="p-4 rounded-2xl surface-card">
            <view class="text-xs text-slate-500 font-bold">最终电表</view>
            <input v-model="checkoutForm.electric" type="number" class="mt-2 w-full px-3 py-3 input-soft rounded-xl font-mono" placeholder="例如：520" />
          </view>
          <view class="p-4 rounded-2xl surface-card">
            <view class="text-xs text-slate-500 font-bold">押金应退</view>
            <input v-model="checkoutForm.refund" type="number" class="mt-2 w-full px-3 py-3 input-soft rounded-xl font-mono" placeholder="例如：2000" />
          </view>
        </view>
        <template #footer>
          <button
            class="w-full py-4 rounded-xl font-bold tap-scale"
            :class="'btn-rose'"
            @click="confirmCheckout"
          >
            确认退租
          </button>
        </template>
      </InnerDrawer>

      <InnerDrawer :open="attachmentPreviewOpen" title="档案预览" subtitle="身份证/合同归档查看（模拟）" @close="attachmentPreviewOpen = false">
        <view v-if="attachmentPreview" class="stack-3">
          <view class="p-4 rounded-2xl surface-muted">
            <view class="text-xs text-slate-500 font-bold">文件名称</view>
            <view class="text-sm text-slate-800 font-mono mt-2 break-all">{{ attachmentPreview.name || '-' }}</view>
          </view>
          <view class="grid grid-cols-2 gap-3">
            <view class="p-4 rounded-2xl surface-card">
              <view class="text-xs text-slate-500 font-bold">房间</view>
              <view class="text-sm font-black text-slate-900 mt-2">{{ attachmentPreview.roomNo || '-' }}</view>
            </view>
            <view class="p-4 rounded-2xl surface-card">
              <view class="text-xs text-slate-500 font-bold">租客</view>
              <view class="text-sm font-black text-slate-900 mt-2">{{ attachmentPreview.tenant || '-' }}</view>
            </view>
          </view>
          <view class="p-4 rounded-2xl surface-card">
            <view class="text-xs text-slate-500 font-bold">上传时间</view>
            <view class="text-sm text-slate-700 font-mono mt-2">{{ attachmentPreview.uploadedAt || '-' }}</view>
          </view>
          <view class="p-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50">
            <view class="text-xs text-slate-500 font-bold">{{ attachmentPreview.type === 'idCard' ? '身份证影像' : '合同文件' }}</view>
            <view class="text-sm text-slate-700 font-medium leading-relaxed mt-3">
              {{ attachmentPreview.previewText || '预览占位（后续可接入 Cloudflare R2 实际文件地址）' }}
            </view>
          </view>
        </view>
      </InnerDrawer>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import InnerDrawer from '../../components/InnerDrawer.vue'
import OccupancyTimeline from '../../components/OccupancyTimeline.vue'
import { safeNavigateBack, safeRedirectTo, safeSwitchTab } from '../../utils/navigation'
import {
  cloneProperties,
  findBlock,
  findProperty,
  findRoomWithFloor,
  getStatusLabel,
  setProperties,
} from '../../data/rentStore'

const headerTopPadding = ref(44)
const propertyId = ref('')
const blockId = ref('')
const roomId = ref('')

const meterOpen = ref(false)
const writeoffOpen = ref(false)
const checkoutOpen = ref(false)
const tab = ref('current') // current | history
const rentCollectOpen = ref(false)
const utilitiesCollectOpen = ref(false)
const attachmentPreviewOpen = ref(false)
const attachmentPreview = ref(null)

const receiptPicked = ref(false)
const flexForm = ref({ title: '', amount: '' })

const meterForm = ref({ water: '', electric: '' })
const checkoutForm = ref({ water: '', electric: '', refund: '' })
const checkinForm = ref({ tenant: '', phone: '' })

onLoad((query) => {
  try {
    const sys = uni.getSystemInfoSync()
    headerTopPadding.value = Math.max(18, Math.min(24, (sys.statusBarHeight || 20)))
  } catch {
    headerTopPadding.value = 44
  }

  propertyId.value = String(query?.propertyId || '')
  blockId.value = String(query?.blockId || '')
  roomId.value = String(query?.roomId || '')
})

const property = computed(() => (propertyId.value ? findProperty(propertyId.value) : null))
const block = computed(() => (propertyId.value && blockId.value ? findBlock(propertyId.value, blockId.value) : null))
const roomWithFloor = computed(() =>
  propertyId.value && blockId.value && roomId.value ? findRoomWithFloor(propertyId.value, blockId.value, roomId.value) : null
)
const room = computed(() => roomWithFloor.value?.room || null)
const attachmentFiles = computed(() => room.value?.attachmentFiles || { idCard: null, contract: null })

const unpaidBills = computed(() => (room.value?.bills || []).filter((b) => b.status === 'unpaid'))
const utilitiesBills = computed(() => (room.value?.bills || []).filter((b) => b.type === 'utilities'))
const customBills = computed(() => (room.value?.bills || []).filter((b) => b.type === 'custom'))
const rentTerms = computed(() => room.value?.paymentSchedule || [])

const rentExpected = computed(() => Math.round(rentTerms.value.reduce((s, t) => s + Number(t.expectedAmount || 0), 0) * 100) / 100)
const rentPaid = computed(() => Math.round(rentTerms.value.reduce((s, t) => s + Number(t.paidAmount || 0), 0) * 100) / 100)
const rentOutstandingCount = computed(() => rentTerms.value.filter((t) => t.status !== 'paid').length)
const rentProgressPct = computed(() => {
  if (!rentExpected.value) return 0
  return Math.min(100, Math.max(0, Math.round((rentPaid.value / rentExpected.value) * 100)))
})

const utilitiesExpected = computed(() =>
  Math.round(utilitiesBills.value.reduce((s, b) => s + Number(b.amount || 0), 0) * 100) / 100
)
const utilitiesPaid = computed(() =>
  Math.round(utilitiesBills.value.filter((b) => b.status === 'paid').reduce((s, b) => s + Number(b.amount || 0), 0) * 100) / 100
)
const utilitiesOutstandingCount = computed(() => utilitiesBills.value.filter((b) => b.status !== 'paid').length)
const utilitiesProgressPct = computed(() => {
  if (!utilitiesExpected.value) return 0
  return Math.min(100, Math.max(0, Math.round((utilitiesPaid.value / utilitiesExpected.value) * 100)))
})

const customExpected = computed(() => Math.round(customBills.value.reduce((s, b) => s + Number(b.amount || 0), 0) * 100) / 100)
const customPaid = computed(() => Math.round(customBills.value.filter((b) => b.status === 'paid').reduce((s, b) => s + Number(b.amount || 0), 0) * 100) / 100)
const customOutstandingCount = computed(() => customBills.value.filter((b) => b.status !== 'paid').length)

const overallExpected = computed(() => Math.round((rentExpected.value + utilitiesExpected.value + customExpected.value) * 100) / 100)
const overallPaid = computed(() => Math.round((rentPaid.value + utilitiesPaid.value + customPaid.value) * 100) / 100)
const overallOutstandingCount = computed(() => rentOutstandingCount.value + utilitiesOutstandingCount.value + customOutstandingCount.value)
const overallProgressPct = computed(() => {
  if (!overallExpected.value) return 0
  return Math.min(100, Math.max(0, Math.round((overallPaid.value / overallExpected.value) * 100)))
})

const meterCalc = computed(() => {
  if (!room.value) return null
  const waterNow = Number(meterForm.value.water)
  const electricNow = Number(meterForm.value.electric)
  if (!Number.isFinite(waterNow) || !Number.isFinite(electricNow)) return null

  const waterDiff = Math.max(0, Number((waterNow - room.value.lastWater).toFixed(1)))
  const electricDiff = Math.max(0, Number((electricNow - room.value.lastElectric).toFixed(1)))
  const waterCost = Number((waterDiff * room.value.waterPrice).toFixed(2))
  const electricCost = Number((electricDiff * room.value.electricPrice).toFixed(2))
  const total = Number((waterCost + electricCost).toFixed(2))
  return { waterDiff, electricDiff, waterCost, electricCost, total, waterNow, electricNow }
})

function closeSelf() {
  safeNavigateBack({ fallbackUrl: '/pages/workbench/index', fallbackType: 'switchTab' })
}

function statusLabel(status) {
  return getStatusLabel(status)
}

function statusTag(status) {
  switch (status) {
    case 'overdue':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'due_soon':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'rented':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'empty':
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200'
  }
}

function cycleLabel(cycle) {
  const n = Number(cycle || 0)
  if (n === 1) return '月付'
  if (n === 3) return '季付'
  if (n === 6) return '半年付'
  if (n === 12) return '年付'
  return `${n}个月`
}

function goCheckIn() {
  safeRedirectTo(`/pages/room/checkin?propertyId=${propertyId.value}&blockId=${blockId.value}&roomId=${roomId.value}`)
}

function fmtDate(iso) {
  const s = String(iso || '').trim()
  if (!s) return '-'
  return s.replace(/-/g, '.')
}

function termStatusText(status) {
  if (status === 'paid') return '已结清'
  if (status === 'overdue') return '欠费'
  if (status === 'due_soon') return '临期'
  return '待收'
}

function termTag(status) {
  if (status === 'paid') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'overdue') return 'bg-rose-50 text-rose-700 border-rose-200'
  if (status === 'due_soon') return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-slate-50 text-slate-600 border-slate-200'
}

function markTermPaid(termId) {
  const next = cloneProperties()
  const hit = findRoomInNext(next)
  if (!hit) return
  const term = (hit.room.paymentSchedule || []).find((t) => t.id === termId)
  if (!term) return
  if (term.status === 'paid') return
  term.paidAmount = term.expectedAmount
  term.status = 'paid'
  term.payDate = todayStr()
  term.receiptPic = Boolean(receiptPicked.value)

  hit.room.history.unshift({
    id: `h_${Date.now()}`,
    type: 'rent_writeoff',
    date: todayStr(),
    remark: `记收房租：第 ${term.term} 期，¥${term.expectedAmount}`,
  })
  setProperties(next)
  receiptPicked.value = false
  uni.showToast({ title: '已记收', icon: 'success' })
}

function addFlexCharge() {
  if (!room.value) return
  const title = String(flexForm.value.title || '').trim()
  const amount = Number(flexForm.value.amount)
  if (!title || !Number.isFinite(amount) || amount <= 0) {
    uni.showToast({ title: '请填写项目和金额', icon: 'none' })
    return
  }
  const next = cloneProperties()
  const hit = findRoomInNext(next)
  if (!hit) return
  const nowDate = todayStr().slice(0, 10)
  hit.room.bills.unshift({
    id: `bc_${Date.now()}`,
    title,
    type: 'custom',
    amount: Number(amount.toFixed(2)),
    status: 'unpaid',
    dueDate: nowDate,
    payDate: '',
    receiptPic: false,
  })
  hit.room.history.unshift({
    id: `h_${Date.now()}`,
    type: 'custom_charge',
    date: todayStr(),
    remark: `新增灵活收费：${title}，¥${Number(amount.toFixed(2))}`,
  })
  setProperties(next)
  flexForm.value = { title: '', amount: '' }
  uni.showToast({ title: '已添加', icon: 'success' })
}

function pickReceipt() {
  receiptPicked.value = true
  uni.showToast({ title: '已选择截图(模拟)', icon: 'none' })
}

function todayStr() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function buildAttachmentFile(type) {
  const now = todayStr()
  if (type === 'idCard') {
    return {
      name: `${room.value?.tenant || '租客'}_身份证.jpg`,
      uploadedAt: now,
      source: 'mock',
      previewText: '身份证正反面影像（模拟）',
    }
  }
  return {
    name: `${room.value?.roomNo || '房间'}_租赁合同.pdf`,
    uploadedAt: now,
    source: 'mock',
    previewText: '电子合同归档文件（模拟）',
  }
}

function openAttachmentPreview(type, file) {
  if (!room.value || !file) return
  attachmentPreview.value = {
    type,
    name: file.name || '',
    uploadedAt: file.uploadedAt || '',
    previewText: file.previewText || '',
    tenant: room.value.tenant || '',
    roomNo: room.value.roomNo || '',
  }
  attachmentPreviewOpen.value = true
}

function handleAttachment(type) {
  const file = attachmentFiles.value?.[type] || null
  if (file) {
    openAttachmentPreview(type, file)
    return
  }
  uploadAttachment(type)
}

function uploadAttachment(type) {
  if (!room.value) return
  const next = cloneProperties()
  const hit = findRoomInNext(next)
  if (!hit) return

  if (type === 'idCard') hit.room.hasIdCardPic = true
  if (type === 'contract') hit.room.hasContract = true
  hit.room.attachmentFiles = hit.room.attachmentFiles || { idCard: null, contract: null }
  hit.room.attachmentFiles[type] = buildAttachmentFile(type)
  hit.room.history.unshift({
    id: `h_${Date.now()}`,
    type: type === 'idCard' ? 'upload_id' : 'upload_contract',
    date: todayStr(),
    remark: type === 'idCard' ? '上传身份证照片(模拟)' : '上传合同扫描件(模拟)',
  })
  setProperties(next)
  openAttachmentPreview(type, hit.room.attachmentFiles[type])
  uni.showToast({ title: '档案已更新(模拟)', icon: 'none' })
}

function markBillPaid(billIdToPay) {
  const next = cloneProperties()
  const hit = findRoomInNext(next)
  if (!hit) return

  const bill = hit.room.bills.find((b) => b.id === billIdToPay)
  if (!bill) return
  bill.status = 'paid'
  bill.payDate = todayStr()
  bill.receiptPic = Boolean(receiptPicked.value)
  hit.room.history.unshift({
    id: `h_${Date.now()}`,
    type: 'writeoff',
    date: todayStr(),
    remark: `记收账单：${bill.title}（¥${bill.amount}）`,
  })
  setProperties(next)
  receiptPicked.value = false
  uni.showToast({ title: '已记收', icon: 'success' })
}

function confirmMeter() {
  if (!room.value || !meterCalc.value) {
    uni.showToast({ title: '请先录入读数', icon: 'none' })
    return
  }
  const next = cloneProperties()
  const hit = findRoomInNext(next)
  if (!hit) return

  const mrId = `mr_${Date.now()}`
  const billId = `bu_${Date.now()}`
  const nowDate = todayStr().slice(0, 10)

  hit.room.meterReadings.unshift({
    id: mrId,
    date: nowDate,
    waterRead: meterCalc.value.waterNow,
    electricRead: meterCalc.value.electricNow,
    total: meterCalc.value.total,
    billId,
  })
  hit.room.bills.unshift({
    id: billId,
    title: `${nowDate} 水电杂费`,
    type: 'utilities',
    amount: meterCalc.value.total,
    status: 'unpaid',
    dueDate: nowDate,
    payDate: '',
    receiptPic: false,
  })
  hit.room.lastWater = meterCalc.value.waterNow
  hit.room.lastElectric = meterCalc.value.electricNow
  hit.room.history.unshift({
    id: `h_${Date.now()}`,
    type: 'meter',
    date: todayStr(),
    remark: `录入抄表并生成杂费单：水 ¥${meterCalc.value.waterCost}，电 ¥${meterCalc.value.electricCost}，合计 ¥${meterCalc.value.total}`,
  })

  setProperties(next)
  meterOpen.value = false
  meterForm.value = { water: '', electric: '' }
  utilitiesCollectOpen.value = true
  uni.showToast({ title: '已生成杂费单(模拟)', icon: 'success' })
}

function confirmCheckout() {
  if (!room.value) return

  const waterNow = Number(checkoutForm.value.water)
  const electricNow = Number(checkoutForm.value.electric)
  const refund = Number(checkoutForm.value.refund)
  if (!Number.isFinite(waterNow) || !Number.isFinite(electricNow) || !Number.isFinite(refund)) {
    uni.showToast({ title: '请完整填写退租结算', icon: 'none' })
    return
  }

  const next = cloneProperties()
  const hit = findRoomInNext(next)
  if (!hit) return

  const prevTenant = hit.room.tenant || '未知租客'

  const now = todayStr()
  const nowDate = now.slice(0, 10)

  // Archive current lease (if any) into occupancy history.
  hit.room.occupancies = Array.isArray(hit.room.occupancies) ? hit.room.occupancies : []
  const activeOcc = hit.room.occupancies.find((o) => o.status === 'active') || null
  if (activeOcc) {
    activeOcc.status = 'completed'
    activeOcc.endDate = nowDate
    activeOcc.archive = {
      bills: hit.room.bills || [],
      meterReadings: hit.room.meterReadings || [],
      paymentSchedule: hit.room.paymentSchedule || [],
    }
    activeOcc.remark = activeOcc.remark || '退租归档'
  }
  hit.room.activeOccupancyId = ''

  // Start new idle period after checkout.
  hit.room.occupancies.unshift({
    id: `oc_idle_${Date.now()}`,
    kind: 'idle',
    status: 'idle',
    startDate: nowDate,
    endDate: '',
    remark: '退租后空置',
    archive: null,
  })

  hit.room.status = 'empty'
  hit.room.tenant = ''
  hit.room.phone = ''
  hit.room.idCard = ''
  hit.room.hasIdCardPic = false
  hit.room.hasContract = false
  hit.room.attachmentFiles = { idCard: null, contract: null }
  hit.room.lastWater = waterNow
  hit.room.lastElectric = electricNow
  hit.room.bills = []
  hit.room.meterReadings = []
  hit.room.paymentSchedule = []
  hit.room.history.unshift({
    id: `h_${Date.now()}`,
    type: 'checkout',
    date: now,
    remark: `办理退租：${prevTenant}，押金应退 ¥${refund}，读数水 ${waterNow} / 电 ${electricNow}`,
  })
  setProperties(next)
  checkoutOpen.value = false
  uni.showToast({ title: '已退租(模拟)', icon: 'success' })
}

function findRoomInNext(next) {
  const p = next.find((pp) => pp.id === propertyId.value)
  if (!p) return null
  const b = p.blocks.find((bb) => bb.id === blockId.value)
  if (!b) return null
  for (const f of b.floors) {
    const r = f.rooms.find((rr) => rr.id === roomId.value)
    if (r) return { room: r, floor: f.floor }
  }
  return null
}
</script>




