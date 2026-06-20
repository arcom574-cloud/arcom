import { create } from 'zustand';

const initialLeads = [
  { id: 1, name: 'أحمد محمد', phone: '01001234567', project: 'مشروع النخيل', source: 'Facebook', status: 'جديد', time: '2026-06-07 09:00' },
  { id: 2, name: 'سارة علي', phone: '01112345678', project: 'برج الأعمال', source: 'Google', status: 'متابعة', time: '2026-06-07 08:40' },
  { id: 3, name: 'محمود حسن', phone: '01234567890', project: 'فيلات الساحل', source: 'Facebook', status: 'مهتم', time: '2026-06-07 08:00' },
  { id: 4, name: 'نورا أحمد', phone: '01098765432', project: 'كمبوند أكتوبر', source: 'Google', status: 'جديد', time: '2026-06-07 07:00' },
  { id: 5, name: 'كريم عمر', phone: '01187654321', project: 'مشروع النخيل', source: 'الموقع', status: 'متابعة', time: '2026-06-07 06:00' },
  { id: 6, name: 'منى سامي', phone: '01011223344', project: 'برج الأعمال', source: 'Facebook', status: 'مغلق', time: '2026-06-06 15:00' },
  { id: 7, name: 'طارق فوزي', phone: '01122334455', project: 'فيلات الساحل', source: 'Google', status: 'جديد', time: '2026-06-06 14:00' },
  { id: 8, name: 'هبة رضا', phone: '01233445566', project: 'كمبوند أكتوبر', source: 'الموقع', status: 'مهتم', time: '2026-06-06 13:00' },
];

interface Lead {
  id: number;
  name: string;
  phone: string;
  project: string;
  source: string;
  status: string;
  time: string;
}

interface Store {
  leads: Lead[];
  addLead: (lead: Omit<Lead, 'id' | 'time'>) => void;
  updateStatus: (id: number, status: string) => void;
}

export const useStore = create<Store>((set) => ({
  leads: initialLeads,
  addLead: (lead) => set((state) => ({
    leads: [{
      ...lead,
      id: state.leads.length + 1,
      time: new Date().toLocaleString('ar-EG'),
    }, ...state.leads],
  })),
  updateStatus: (id, status) => set((state) => ({
    leads: state.leads.map(l => l.id === id ? { ...l, status } : l),
  })),
}));