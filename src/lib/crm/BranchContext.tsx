'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabaseAdmin } from '@/lib/supabase';

export type Branch = { id: string; name: string; };

type BranchContextType = {
  branches: Branch[];
  selectedBranch: string;
  setSelectedBranch: (id: string) => void;
  userBranch: string | null;
  branchFilter: string | null;
  userRole: string;
  refreshKey: number;
};

const BranchContext = createContext<BranchContextType>({
  branches: [], selectedBranch: 'all', setSelectedBranch: () => {},
  userBranch: null, branchFilter: null, userRole: '', refreshKey: 0,
});

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranchState] = useState<string>('all');
  const [userBranch, setUserBranch] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      const stored = localStorage.getItem('crm_user');
      if (!stored) return;
      const user = JSON.parse(stored);
      setUserRole(user.role);
      setUserBranch(user.branch_id || null);

      if (user.role === 'superadmin') {
        const { data } = await supabaseAdmin.from('branches').select('*').order('created_at');
        if (data) setBranches(data);
        const saved = localStorage.getItem('crm_selected_branch');
        if (saved) setSelectedBranchState(saved);
      } else {
        setSelectedBranchState(user.branch_id || 'all');
      }
    };
    load();
  }, []);

  const setSelectedBranch = (id: string) => {
    setSelectedBranchState(id);
    localStorage.setItem('crm_selected_branch', id);
    setRefreshKey(k => k + 1);
  };

  const branchFilter = userRole === 'superadmin'
    ? (selectedBranch === 'all' ? null : selectedBranch)
    : userBranch;

  return (
    <BranchContext.Provider value={{ branches, selectedBranch, setSelectedBranch, userBranch, branchFilter, userRole, refreshKey }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranchContext() {
  return useContext(BranchContext);
}
