import { supabase } from '@/lib/supabase';

export type CurrentUserIdentity = {
  email: string;
  nombre: string;
};

const normalizeEmail = (value: string | null | undefined) => {
  return value?.trim().toLowerCase() ?? '';
};

const isEmail = (value: string) => {
  return value.includes('@');
};

export const getCurrentUserIdentity = async (): Promise<CurrentUserIdentity> => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  const email = user?.email ?? '';

  if (!email) {
    return {
      email: '',
      nombre: ''
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('PROFILE')
    .select('nombre')
    .eq('email', email)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  return {
    email,
    nombre: profile?.nombre?.trim() ?? ''
  };
};

export const resolveCreatedByDisplay = async (
  createdBy: string | null | undefined,
  currentUser?: CurrentUserIdentity
) => {
  const rawValue = createdBy?.trim();

  if (!rawValue) {
    return 'Sistema';
  }

  if (!isEmail(rawValue)) {
    return rawValue;
  }

  const identity = currentUser ?? await getCurrentUserIdentity();

  if (normalizeEmail(rawValue) === normalizeEmail(identity.email)) {
    return identity.nombre || rawValue;
  }

  const { data: profile, error } = await supabase
    .from('PROFILE')
    .select('nombre')
    .eq('email', rawValue)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return profile?.nombre?.trim() || rawValue;
};
