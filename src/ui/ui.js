export const UI = {
  card: 'bg-white rounded-2xl border border-slate-200-60 shadow-soft',
  btnPrimary:
    'bg-blue-600 text-white font-bold rounded-xl shadow-md tap-scale flex justify-center items-center gap-2',
  btnSecondary:
    'bg-slate-100 text-slate-700 font-bold rounded-xl tap-scale flex justify-center items-center gap-2',
  input:
    'w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none',
  tag(status) {
    switch (status) {
      case 'paid':
      case 'rented':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100'
      case 'unpaid':
        return 'bg-slate-50 text-slate-600 border border-slate-200'
      case 'overdue':
        return 'bg-rose-50 text-rose-600 border border-rose-100'
      case 'due_soon':
        return 'bg-amber-50 text-amber-600 border border-amber-100'
      case 'empty':
      default:
        return 'bg-slate-50 text-slate-500 border border-slate-100'
    }
  },
}

export function getMiniStatusColor(status) {
  switch (status) {
    case 'overdue':
      return 'bg-rose-500'
    case 'due_soon':
      return 'bg-amber-400'
    case 'rented':
      return 'bg-emerald-400'
    case 'empty':
    default:
      return 'bg-slate-200'
  }
}
