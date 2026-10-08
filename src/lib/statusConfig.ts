export interface StatusStyle {
  label: string;
  pill: string;
  badgePill: string;
}

export const STATUS_CONFIG: Record<string, StatusStyle> = {
  send: {
    label: 'Send',
    pill: 'bg-[#fed7d7] text-[#991b1b]',
    badgePill: 'bg-[#fed7d7] text-[#991b1b] border border-rose-300/60 shadow-xs font-semibold',
  },
  signed: {
    label: 'Signed',
    pill: 'bg-[#fef3c7] text-[#92400e]',
    badgePill: 'bg-[#fef3c7] text-[#92400e] border border-amber-300/60 shadow-xs font-semibold',
  },
  paid_active: {
    label: 'Paid / Active',
    pill: 'bg-[#dcfce7] text-[#166534]',
    badgePill: 'bg-[#dcfce7] text-[#166534] border border-emerald-300/60 shadow-xs font-semibold',
  },
  waiting: {
    label: 'Waiting',
    pill: 'bg-[#581c87] text-[#ffffff]',
    badgePill: 'bg-[#581c87] text-[#ffffff] border border-purple-950 shadow-xs font-semibold',
  },
  not_renew: {
    label: 'Not renew',
    pill: 'bg-[#e2e8f0] text-[#334155]',
    badgePill: 'bg-[#e2e8f0] text-[#334155] border border-slate-300 shadow-xs font-semibold',
  },
  expired: {
    label: 'Expired',
    pill: 'bg-[#991b1b] text-[#ffffff]',
    badgePill: 'bg-[#991b1b] text-[#ffffff] border border-red-950 shadow-xs font-semibold',
  },
  blank: {
    label: '(Blank)',
    pill: 'bg-slate-800 text-slate-400',
    badgePill: 'bg-slate-800 text-slate-400 border border-slate-700/60 font-medium',
  },
};

export const STATUS_OPTIONS = [
  { id: 'send', label: 'Send', pill: 'bg-[#fed7d7] text-[#991b1b]' },
  { id: 'signed', label: 'Signed', pill: 'bg-[#fef3c7] text-[#92400e]' },
  { id: 'paid_active', label: 'Paid / Active', pill: 'bg-[#dcfce7] text-[#166534]' },
  { id: 'waiting', label: 'Waiting', pill: 'bg-[#581c87] text-[#ffffff]' },
  { id: 'not_renew', label: 'Not renew', pill: 'bg-[#e2e8f0] text-[#334155]' },
  { id: 'expired', label: 'Expired', pill: 'bg-[#991b1b] text-[#ffffff]' },
  { id: 'blank', label: '(Blank)', pill: 'bg-slate-800 text-slate-400' },
];

export const getStatusCategory = (status?: string): 'send' | 'signed' | 'paid_active' | 'waiting' | 'not_renew' | 'expired' | 'blank' => {
  const s = (status || '').trim().toLowerCase();
  if (!s || s === '(ว่าง)' || s === '(blank)' || s === '-') return 'blank';
  if (s === 'send') return 'send';
  if (s === 'signed') return 'signed';
  if (s.includes('wait')) return 'waiting';
  if (s.includes('not renew') || s.includes('notrenew')) return 'not_renew';
  if (s.includes('expire')) return 'expired';
  if (s.includes('paid') || s.includes('active')) return 'paid_active';
  return 'blank';
};
