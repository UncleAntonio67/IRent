import { buildTenantStorageKey } from './authStore.js'

const BILL_ENTRIES_CACHE_KEY = 'bill_entries_cache_v2'

function normalizeMoney(value) {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount)) return 0
  return Math.round(amount * 100) / 100
}

export function buildBillEntriesSnapshot(propertyTree = []) {
  const entries = []
  for (const property of propertyTree || []) {
    for (const block of property.blocks || []) {
      for (const floor of block.floors || []) {
        for (const room of floor.rooms || []) {
          for (const term of room.paymentSchedule || []) {
            const expectedAmount = normalizeMoney(term.expectedAmount || 0)
            const coveredAmount = normalizeMoney(term.coveredAmount || term.paidAmount || 0)
            if (!(term.status === 'paid' && coveredAmount >= expectedAmount && expectedAmount > 0)) continue
            entries.push({
              key: `rent_${property.id}_${block.id}_${room.id}_${term.id}`,
              kind: 'rent',
              propertyId: property.id,
              blockId: block.id,
              roomId: room.id,
              roomNo: room.roomNo,
              tenant: room.tenant || '',
              title: `房租 第${term.term}期`,
              amount: expectedAmount,
              dueDate: term.dueDate || '',
              payDate: term.payDate || '',
              receiptPic: Boolean(term.receiptPic),
              receiptFile: term.receiptFile || null,
            })
          }

          for (const bill of room.bills || []) {
            if (bill.status !== 'paid' || bill.type === 'rent') continue
            entries.push({
              key: `bill_${property.id}_${block.id}_${room.id}_${bill.id}`,
              kind: bill.type || 'custom',
              propertyId: property.id,
              blockId: block.id,
              roomId: room.id,
              roomNo: room.roomNo,
              tenant: room.tenant || '',
              title: bill.title || '费用',
              amount: normalizeMoney(bill.amount || 0),
              dueDate: bill.dueDate || '',
              payDate: bill.payDate || '',
              receiptPic: Boolean(bill.receiptPic),
              receiptFile: bill.receiptFile || null,
            })
          }
        }
      }
    }
  }

  return {
    entries,
    _syncedAt: Date.now(),
  }
}

export function getCachedBillEntriesSnapshot() {
  try {
    const stored = uni.getStorageSync(buildTenantStorageKey(BILL_ENTRIES_CACHE_KEY))
    if (Array.isArray(stored)) {
      return { entries: stored, _syncedAt: 0 }
    }
    if (stored && typeof stored === 'object') {
      return {
        entries: Array.isArray(stored.entries) ? stored.entries : [],
        _syncedAt: Number(stored._syncedAt || 0) || 0,
      }
    }
  } catch {
    // Ignore cache read failures.
  }
  return { entries: [], _syncedAt: 0 }
}

export function saveBillEntriesSnapshot(snapshot) {
  try {
    uni.setStorageSync(buildTenantStorageKey(BILL_ENTRIES_CACHE_KEY), {
      entries: snapshot?.entries || [],
      _syncedAt: Number(snapshot?._syncedAt || Date.now()) || Date.now(),
    })
  } catch {
    // Ignore cache write failures.
  }
}

export function refreshBillEntriesSnapshot(propertyTree = []) {
  const snapshot = buildBillEntriesSnapshot(propertyTree)
  saveBillEntriesSnapshot(snapshot)
  return snapshot
}
