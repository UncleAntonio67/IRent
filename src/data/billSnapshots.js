import { buildTenantStorageKey } from './authStore.js'

const BILL_ENTRIES_CACHE_KEY = 'bill_entries_cache_v2'

function normalizeMoney(value) {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount)) return 0
  return Math.round(amount * 100) / 100
}

function toLedgerKind(kind) {
  if (kind === 'rent') return 'rent'
  if (['water', 'electric', 'gas', 'heating', 'utilities'].includes(String(kind || ''))) return 'utilities'
  return 'custom'
}

export function buildBillEntriesSnapshot(propertyTree = []) {
  const entries = []
  for (const property of propertyTree || []) {
    for (const block of property.blocks || []) {
      for (const floor of block.floors || []) {
        for (const room of floor.rooms || []) {
          const collectionTermIds = new Set()
          const collectionBillIds = new Set()
          for (const collection of room.collections || []) {
            const amount = normalizeMoney(collection.amount)
            if (amount <= 0) continue
            for (const termId of collection.termIds || []) collectionTermIds.add(termId)
            if (collection.billId) collectionBillIds.add(collection.billId)
            entries.push({
              key: `collection_${property.id}_${block.id}_${room.id}_${collection.id}`,
              kind: toLedgerKind(collection.kind),
              propertyId: property.id,
              blockId: block.id,
              roomId: room.id,
              roomNo: room.roomNo,
              tenant: room.tenant || '',
              title: collection.title || '收费',
              amount,
              dueDate: '',
              payDate: collection.paidAt || '',
              receiptPic: Boolean(collection.receiptPic),
              receiptFile: collection.receiptFile || null,
            })
          }

          for (const term of room.paymentSchedule || []) {
            const expectedAmount = normalizeMoney(term.expectedAmount || 0)
            const coveredAmount = normalizeMoney(term.coveredAmount || term.paidAmount || 0)
            if (collectionTermIds.has(term.id) || !(term.status === 'paid' && coveredAmount >= expectedAmount && expectedAmount > 0)) continue
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
            if (collectionBillIds.has(bill.id) || bill.status !== 'paid' || bill.type === 'rent') continue
            entries.push({
              key: `bill_${property.id}_${block.id}_${room.id}_${bill.id}`,
              kind: toLedgerKind(bill.type),
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

          // Check-out clears current collections. Preserve completed leases in
          // the ledger through their archived charge data instead of showing
          // generic room-operation history.
          for (const occupancy of room.occupancies || []) {
            const archive = occupancy?.archive
            if (!archive || occupancy.status === 'active') continue

            const archiveTermIds = new Set()
            const archiveBillIds = new Set()
            for (const [index, collection] of (archive.collections || []).entries()) {
              const amount = normalizeMoney(collection.amount)
              if (amount <= 0) continue
              for (const termId of collection.termIds || []) archiveTermIds.add(termId)
              if (collection.billId) archiveBillIds.add(collection.billId)
              entries.push({
                key: `archive_collection_${property.id}_${block.id}_${room.id}_${occupancy.id || 'lease'}_${collection.id || index}`,
                kind: toLedgerKind(collection.kind),
                propertyId: property.id,
                blockId: block.id,
                roomId: room.id,
                roomNo: room.roomNo,
                tenant: occupancy.tenant || room.tenant || '',
                title: collection.title || '收费',
                amount,
                dueDate: '',
                payDate: collection.paidAt || occupancy.endDate || '',
                receiptPic: Boolean(collection.receiptPic),
                receiptFile: collection.receiptFile || null,
              })
            }

            for (const [index, term] of (archive.paymentSchedule || []).entries()) {
              const expectedAmount = normalizeMoney(term.expectedAmount || 0)
              const coveredAmount = normalizeMoney(term.coveredAmount || term.paidAmount || 0)
              if (archiveTermIds.has(term.id) || !(term.status === 'paid' && coveredAmount >= expectedAmount && expectedAmount > 0)) continue
              entries.push({
                key: `archive_rent_${property.id}_${block.id}_${room.id}_${occupancy.id || 'lease'}_${term.id || index}`,
                kind: 'rent',
                propertyId: property.id,
                blockId: block.id,
                roomId: room.id,
                roomNo: room.roomNo,
                tenant: occupancy.tenant || room.tenant || '',
                title: `房租 第${term.term || index + 1}期`,
                amount: expectedAmount,
                dueDate: term.dueDate || '',
                payDate: term.payDate || occupancy.endDate || '',
                receiptPic: Boolean(term.receiptPic),
                receiptFile: term.receiptFile || null,
              })
            }

            for (const [index, bill] of (archive.bills || []).entries()) {
              const amount = normalizeMoney(bill.amount || 0)
              if (archiveBillIds.has(bill.id) || bill.status !== 'paid' || bill.type === 'rent' || amount <= 0) continue
              entries.push({
                key: `archive_bill_${property.id}_${block.id}_${room.id}_${occupancy.id || 'lease'}_${bill.id || index}`,
                kind: toLedgerKind(bill.type),
                propertyId: property.id,
                blockId: block.id,
                roomId: room.id,
                roomNo: room.roomNo,
                tenant: occupancy.tenant || room.tenant || '',
                title: bill.title || '费用',
                amount,
                dueDate: bill.dueDate || '',
                payDate: bill.payDate || occupancy.endDate || '',
                receiptPic: Boolean(bill.receiptPic),
                receiptFile: bill.receiptFile || null,
              })
            }
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
