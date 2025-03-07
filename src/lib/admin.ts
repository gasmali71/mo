import { supabase } from './supabase';

export interface AdminUser {
  id: string;
  user_id: string;
  role: 'read_only' | 'manager' | 'super_admin';
  is_active: boolean;
  permissions: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export async function checkAdminAccess(
  userId: string,
  requiredRole?: AdminUser['role']
): Promise<boolean> {
  try {
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !adminUser) {
      return false;
    }

    if (requiredRole) {
      const roleHierarchy = {
        'read_only': 0,
        'manager': 1,
        'super_admin': 2
      };

      return roleHierarchy[adminUser.role] >= roleHierarchy[requiredRole];
    }

    return true;
  } catch (error) {
    console.error('Error checking admin access:', error);
    return false;
  }
}

export async function logAdminAction(
  userId: string,
  action: string,
  details: Record<string, any>
): Promise<void> {
  try {
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!adminUser) {
      throw new Error('Admin user not found');
    }

    await supabase
      .from('admin_audit_log')
      .insert({
        admin_id: adminUser.id,
        action,
        details,
        ip_address: await fetch('https://api.ipify.org?format=json')
          .then(res => res.json())
          .then(data => data.ip)
          .catch(() => null)
      });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

export async function getAdminSettings(): Promise<Record<string, any> | null> {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('settings')
      .single();

    if (error) throw error;
    return data?.settings || null;
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return null;
  }
}

export async function updateAdminSettings(
  userId: string,
  settings: Record<string, any>
): Promise<void> {
  try {
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('user_id', userId)
      .single();

    if (!adminUser || adminUser.role !== 'super_admin') {
      throw new Error('Unauthorized');
    }

    const { error } = await supabase
      .from('admin_settings')
      .update({
        settings,
        updated_by: adminUser.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1);

    if (error) throw error;

    await logAdminAction(userId, 'update_settings', settings);
  } catch (error) {
    console.error('Error updating admin settings:', error);
    throw error;
  }
}

export async function getAdminAuditLog(
  userId: string,
  filters?: {
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<any[]> {
  try {
    let query = supabase
      .from('admin_audit_log')
      .select(`
        *,
        admin:admin_users(
          id,
          user:users(email)
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.action) {
      query = query.eq('action', filters.action);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching admin audit log:', error);
    return [];
  }
}
