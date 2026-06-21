'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabaseAdmin } from '@/lib/supabase';

export type Branch = { id: string; name: string; };

export function useBranch() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranchState] = useState<string>('all');
  const [userBranch, setUserBranch] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  const loadBranch = useCallback(() => {
    const stored = localStorage.getItem('crm_user');
    if (!stored) return;
    const user = JSON.parse(stored);
    setUserRole(user.role);
    setUserBranch(user.branch_id || null);

    if (user.role === 'superadmin') {
      const saved = localStorage.getItem('crm_selected_branch');
      setSelectedBranchState(saved || 'all');
    } else {
      setSelectedBranchState(user.branch_id || 'all');
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      loadBranch();
      const stored = localStorage.getItem('crm_user');
      if (!stored) return;
      const user = JSON.parse(stored);
      if (user.role === 'superadmin') {
        const { data } = await supabaseAdmin.from('branches').select('*').order('created_at');
        if (data) setBranches(data);
      }
    };
    loadAll();
  }, []);

  useEffect(() => {
    const handler = () => {
      loadBranch();
      setRefreshKey(k => k + 1);
    };
    window.addEventListener('branch-changed', handler);
    return () => window.removeEventListener('branch-changed', handler);
  }, [loadBranch]);

  const branchFilter = userRole === 'superadmin'
    ? (selectedBranch === 'all' ? null : selectedBranch)
    : userBranch;

  return { branches, selectedBranch, branchFilter, userBranch, userRole, refreshKey };
}
