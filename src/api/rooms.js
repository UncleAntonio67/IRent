import { apiRequest } from './client'
import { mapServerRoomDetail } from './mappers'
import { buildTenantStorageKey } from '../data/authStore.js'
import { hasCloudApiBaseUrl } from '../config/cloud'

const ROOM_DETAIL_CACHE_KEY = 'room_detail_cache_v1'
const roomDetailInflightMap = new Map()
const ROOM_DETAIL_CACHE_LIMIT = 40
const ROOM_DETAIL_CACHE_MAX_AGE = 6 * 60 * 60 * 1000

function isLegacyLocalRoomId(roomId) {
  return /^r\d+$/i.test(String(roomId || ''))
}

function loadRoomDetailCacheMap() {
  try {
    return uni.getStorageSync(buildTenantStorageKey(ROOM_DETAIL_CACHE_KEY)) || {}
  } catch {
    return {}
  }
}

function saveRoomDetailCacheMap(cacheMap) {
  try {
    uni.setStorageSync(buildTenantStorageKey(ROOM_DETAIL_CACHE_KEY), cacheMap)
  } catch {
    // Ignore cache write failures.
  }
}

export function getCachedRoomDetail(roomId) {
  if (!roomId) return null
  const cacheMap = loadRoomDetailCacheMap()
  return cacheMap[roomId] || null
}

export function isRoomDetailFresh(roomId, maxAge = ROOM_DETAIL_CACHE_MAX_AGE) {
  const cached = getCachedRoomDetail(roomId)
  return Boolean(cached && Date.now() - Number(cached._cachedAt || 0) <= maxAge)
}

export function setCachedRoomDetail(roomId, roomDetail) {
  if (!roomId || !roomDetail) return roomDetail || null
  const cacheMap = loadRoomDetailCacheMap()
  cacheMap[roomId] = {
    ...(cacheMap[roomId] || {}),
    ...roomDetail,
    _cachedAt: Date.now(),
  }
  const roomIds = Object.keys(cacheMap)
    .sort((leftId, rightId) => Number(cacheMap[rightId]?._cachedAt || 0) - Number(cacheMap[leftId]?._cachedAt || 0))
  roomIds.slice(ROOM_DETAIL_CACHE_LIMIT).forEach((staleRoomId) => {
    delete cacheMap[staleRoomId]
  })
  saveRoomDetailCacheMap(cacheMap)
  return cacheMap[roomId]
}

export async function fetchRoomDetail(roomId) {
  if (hasCloudApiBaseUrl() && isLegacyLocalRoomId(roomId)) {
    const error = new Error('STALE_LOCAL_ROOM_ID')
    error.code = 'STALE_LOCAL_ROOM_ID'
    throw error
  }
  const result = await apiRequest(`/rooms/${roomId}`)
  const roomDetail = mapServerRoomDetail(result.room || {})
  setCachedRoomDetail(roomId, roomDetail)
  return roomDetail
}

export async function prefetchRoomDetail(roomId) {
  if (!roomId) return null
  const cached = getCachedRoomDetail(roomId)
  if (cached) return cached
  return null
}

export async function prefetchRoomDetails(roomIds, limit = 8) {
  const nextRoomIds = [...new Set((roomIds || []).filter(Boolean))]
    .filter((roomId) => !getCachedRoomDetail(roomId))
    .slice(0, limit)
  if (!nextRoomIds.length) return []
  return nextRoomIds.map(() => null)
}

export async function submitRoomCheckIn(roomId, payload) {
  const result = await apiRequest(`/rooms/${roomId}/checkin`, {
    method: 'POST',
    data: payload,
  })
  const roomDetail = mapServerRoomDetail(result.room || {})
  setCachedRoomDetail(roomId, roomDetail)
  return roomDetail
}

export async function submitRentCollection(roomId, payload) {
  const result = await apiRequest(`/rooms/${roomId}/rent-collections`, {
    method: 'POST',
    data: payload,
  })
  const roomDetail = mapServerRoomDetail(result.room || {})
  setCachedRoomDetail(roomId, roomDetail)
  return roomDetail
}

export async function submitUtilityCollection(roomId, payload) {
  const result = await apiRequest(`/rooms/${roomId}/utility-collections`, {
    method: 'POST',
    data: payload,
  })
  const roomDetail = mapServerRoomDetail(result.room || {})
  setCachedRoomDetail(roomId, roomDetail)
  return roomDetail
}

export async function submitMeterReading(roomId, payload) {
  const result = await apiRequest(`/rooms/${roomId}/meter-readings`, {
    method: 'POST',
    data: payload,
  })
  const roomDetail = mapServerRoomDetail(result.room || {})
  setCachedRoomDetail(roomId, roomDetail)
  return roomDetail
}

export async function submitRoomCheckout(roomId, payload) {
  const result = await apiRequest(`/rooms/${roomId}/checkout`, {
    method: 'POST',
    data: payload,
  })
  const roomDetail = mapServerRoomDetail(result.room || {})
  setCachedRoomDetail(roomId, roomDetail)
  return roomDetail
}

export async function submitLatestCollectionUndo(roomId, payload) {
  const result = await apiRequest(`/rooms/${roomId}/undo-latest-collection`, {
    method: 'POST',
    data: payload,
  })
  const roomDetail = mapServerRoomDetail(result.room || {})
  setCachedRoomDetail(roomId, roomDetail)
  return roomDetail
}

export async function submitLatestRoomOperationUndo(roomId, payload) {
  const result = await apiRequest(`/rooms/${roomId}/undo-latest-operation`, {
    method: 'POST',
    data: payload,
  })
  const roomDetail = mapServerRoomDetail(result.room || {})
  setCachedRoomDetail(roomId, roomDetail)
  return roomDetail
}
