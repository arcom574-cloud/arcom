'use client';
import { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/lib/supabase';

export type Branch = { id: string; name: string; };

export function useBranch() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranchState] = useState<string>('all');
  const [userBranch, setUserBranch] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');

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
        const savedBranch = localStorage.getItem('crm_selected_branch');
        if (savedBranch) setSelectedBranchState(savedBranch);
      } else {
        setSelectedBranchState(user.branch_id || 'all');
      }
    };
    load();
  }, []);

  const setSelectedBranch = (id: string) => {
    setSelectedBranchState(id);
    localStorage.setItem('crm_selected_branch', id);
  };

  const branchFilter = userRole === 'superadmin' ? selectedBranch : userBranch;

  return { branches, selectedBranch, setSelectedBranch, userBranch, branchFilter, userRole };
}
