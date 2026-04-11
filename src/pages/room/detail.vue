<template>
  <view class="min-h-screen bg-slate-50">
    <RoomDetailSheet
      :open="true"
      :property-id="propertyId"
      :block-id="blockId"
      :room-id="roomId"
      @close="closeSelf"
    />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import RoomDetailSheet from '../../components/RoomDetailSheet.vue'
import { safeNavigateBack } from '../../utils/navigation'

const propertyId = ref('')
const blockId = ref('')
const roomId = ref('')

onLoad((query) => {
  propertyId.value = String(query?.propertyId || '')
  blockId.value = String(query?.blockId || '')
  roomId.value = String(query?.roomId || '')
})

function closeSelf() {
  safeNavigateBack({ fallbackUrl: '/pages/workbench/index', fallbackType: 'switchTab' })
}
</script>
