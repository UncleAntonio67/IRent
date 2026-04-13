<template>
  <CheckInSheet
    :open="true"
    :property-id="propertyId"
    :block-id="blockId"
    :room-id="roomId"
    @close="closeSelf"
    @checked-in="handleCheckedIn"
    @request-detail="goRoomDetail"
  />
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import CheckInSheet from '../../components/CheckInSheet.vue'
import { safeNavigateBack, safeNavigateTo } from '../../utils/navigation'

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

function goRoomDetail() {
  safeNavigateTo(`/pages/room/detail?propertyId=${propertyId.value}&blockId=${blockId.value}&roomId=${roomId.value}`)
}

function handleCheckedIn() {
  goRoomDetail()
}
</script>
