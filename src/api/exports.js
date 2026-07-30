import { apiRequest } from './client'
import { buildTenantStorageKey } from '../data/authStore.js'

const EXPORT_TASK_CACHE_KEY = 'export_task_cache_v1'

function loadExportTaskCache() {
  try {
    return uni.getStorageSync(buildTenantStorageKey(EXPORT_TASK_CACHE_KEY)) || []
  } catch {
    return []
  }
}

function saveExportTaskCache(tasks) {
  try {
    uni.setStorageSync(buildTenantStorageKey(EXPORT_TASK_CACHE_KEY), tasks || [])
  } catch {
    // Ignore cache write failures.
  }
}

export function getCachedCloudExportTasks() {
  return loadExportTaskCache()
}

export async function createCloudExportTask(payload) {
  const result = await apiRequest('/exports', {
    method: 'POST',
    data: payload,
  })
  const task = result.task || null
  if (task) {
    const nextTasks = [task, ...loadExportTaskCache().filter((item) => item.id !== task.id)].slice(0, 20)
    saveExportTaskCache(nextTasks)
  }
  return task
}

export async function fetchCloudExportTasks() {
  const result = await apiRequest('/exports')
  const tasks = result.tasks || []
  saveExportTaskCache(tasks)
  return tasks
}
