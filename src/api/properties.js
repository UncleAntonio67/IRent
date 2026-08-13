import { apiRequest } from './client'
import { mapServerFullPropertySnapshot, mapServerPropertyTree } from './mappers'
import { buildTenantStorageKey } from '../data/authStore.js'

const PROPERTY_TREE_CACHE_KEY = 'property_tree_cache_v1'
const PROPERTY_TREE_CACHE_MAX_AGE = 6 * 60 * 60 * 1000

function loadPropertyTreeCache() {
  try {
    const stored = uni.getStorageSync(buildTenantStorageKey(PROPERTY_TREE_CACHE_KEY))
    if (Array.isArray(stored)) {
      return { items: stored, _syncedAt: 0 }
    }
    if (stored && typeof stored === 'object') {
      return {
        items: Array.isArray(stored.items) ? stored.items : [],
        _syncedAt: Number(stored._syncedAt || 0) || 0,
      }
    }
    return { items: [], _syncedAt: 0 }
  } catch {
    return { items: [], _syncedAt: 0 }
  }
}

function savePropertyTreeCache(nextTree) {
  try {
    uni.setStorageSync(buildTenantStorageKey(PROPERTY_TREE_CACHE_KEY), {
      items: nextTree || [],
      _syncedAt: Date.now(),
    })
  } catch {
    // Ignore cache write failures.
  }
}

export function getCachedPropertiesTree() {
  return loadPropertyTreeCache().items
}

export function isPropertiesTreeFresh(maxAge = PROPERTY_TREE_CACHE_MAX_AGE) {
  const cache = loadPropertyTreeCache()
  return Array.isArray(cache.items) && cache.items.length > 0 && Date.now() - Number(cache._syncedAt || 0) <= maxAge
}

export async function fetchPropertiesTree() {
  const result = await apiRequest('/properties')
  const nextTree = mapServerPropertyTree(result.items || [])
  savePropertyTreeCache(nextTree)
  return nextTree
}

export async function fetchFullPropertiesSnapshot() {
  const result = await apiRequest('/properties/full-snapshot')
  const nextTree = mapServerFullPropertySnapshot(result.items || [])
  savePropertyTreeCache(nextTree)
  return nextTree
}

function mapRoomStatusToServer(status) {
  if (status === 'rented') return 'RENTED'
  if (status === 'due_soon') return 'DUE_SOON'
  if (status === 'overdue') return 'OVERDUE'
  return 'EMPTY'
}

function serializeRoomForServer(room = {}) {
  return {
    id: room.id,
    roomNo: room.roomNo,
    status: mapRoomStatusToServer(room.status),
    tenant: room.tenant || '',
    phone: room.phone || '',
    idCard: room.idCard || '',
    rent: Number(room.rent || 0) || 0,
    deposit: Number(room.deposit || 0) || 0,
    paymentCycle: Number(room.paymentCycle || 0) || 0,
    leaseStart: room.leaseStart || '',
    leaseEnd: room.leaseEnd || '',
    waterPrice: Number(room.waterPrice || 0) || 0,
    electricPrice: Number(room.electricPrice || 0) || 0,
    gasPrice: Number(room.gasPrice || 0) || 0,
    heatingPrice: Number(room.heatingPrice || 0) || 0,
    utilityChargeConfig: {
      water: room.utilityChargeConfig?.water || '',
      electric: room.utilityChargeConfig?.electric || '',
      gas: room.utilityChargeConfig?.gas || '',
      heating: room.utilityChargeConfig?.heating || '',
    },
    lastWater: Number(room.lastWater || 0) || 0,
    lastElectric: Number(room.lastElectric || 0) || 0,
    lastGas: Number(room.lastGas || 0) || 0,
  }
}

function serializePropertyTreeForServer(tree = []) {
  return (tree || []).map((property) => ({
    id: property.id,
    name: property.name,
    blocks: (property.blocks || []).map((block) => ({
      id: block.id,
      name: block.name,
      floors: (block.floors || []).map((floorItem) => ({
        id: floorItem.id || `${block.id}_floor_${floorItem.floor}`,
        floor: Number(floorItem.floor || floorItem.floorNo || 0) || 0,
        rooms: (floorItem.rooms || []).map(serializeRoomForServer),
      })),
    })),
  }))
}

function serializeFullRoomForServer(room = {}) {
  return {
    ...serializeRoomForServer(room),
    paymentSchedule: Array.isArray(room.paymentSchedule) ? room.paymentSchedule : [],
    bills: Array.isArray(room.bills) ? room.bills : [],
    collections: Array.isArray(room.collections) ? room.collections : [],
    meterReadings: Array.isArray(room.meterReadings) ? room.meterReadings : [],
    occupancies: Array.isArray(room.occupancies) ? room.occupancies : [],
    history: Array.isArray(room.history) ? room.history : [],
  }
}

function serializeFullPropertyTreeForServer(tree = []) {
  return (tree || []).map((property) => ({
    id: property.id,
    name: property.name,
    blocks: (property.blocks || []).map((block) => ({
      id: block.id,
      name: block.name,
      floors: (block.floors || []).map((floorItem) => ({
        id: floorItem.id || `${block.id}_floor_${floorItem.floor}`,
        floor: Number(floorItem.floor || floorItem.floorNo || 0) || 0,
        rooms: (floorItem.rooms || []).map(serializeFullRoomForServer),
      })),
    })),
  }))
}

export async function migrateLocalPropertiesSnapshot(tree = []) {
  const result = await apiRequest('/properties/migrate-local', {
    method: 'POST',
    data: { items: serializeFullPropertyTreeForServer(tree) },
  })
  const nextTree = mapServerFullPropertySnapshot(result.items || [])
  savePropertyTreeCache(nextTree)
  return nextTree
}

export async function submitPropertiesTreeSnapshot(tree = []) {
  await apiRequest('/properties/sync', {
    method: 'POST',
    data: { items: serializePropertyTreeForServer(tree) },
  })
  // Structure mutations must not replace the detailed local rooms with the
  // summary response. Re-read the authoritative full snapshot instead.
  return fetchFullPropertiesSnapshot()
}
