import { defineStore } from "pinia";
import { computed, ref } from "vue";
import {
  supabase,
  supabaseCompras,
  supabaseEquipos,
  supabaseRatings,
} from "@/lib/supabase";

export interface UserProfile {
  id: number;
  created_at: string;
  email: string | null;
  nombre: string | null;
  area: string | null;
  role: string | null;
}

export interface UserAuthDatabaseIds {
  compras: string | null;
  mantenimiento: string | null;
  equipos: string | null;
  calificaciones: string | null;
}

interface FetchCurrentUserProfileOptions {
  includeEmailsFilter?: boolean;
}

export const useUserStore = defineStore("user", () => {
  const profile = ref<UserProfile | null>(null);
  const email = ref("");
  const idsUser = ref<UserAuthDatabaseIds>({
    compras: null,
    mantenimiento: null,
    equipos: null,
    calificaciones: null,
  });
  const allProfiles = ref<UserProfile[]>([]);
  const emailsFilter = ref<string[]>([]);
  const isLoading = ref(false);
  const isLoaded = ref(false);
  const isEmailsFilterLoaded = ref(false);
  const error = ref<string | null>(null);
  let profileLoadPromise: Promise<UserProfile | null> | null = null;
  let emailsFilterLoadPromise: Promise<string[]> | null = null;

  const nombre = computed(() => profile.value?.nombre || "");
  const area = computed(() => (profile.value?.area || "").toUpperCase());
  const role = computed(() => profile.value?.role || "");

  const fetchCurrentUserProfile = async (
    force = false,
    options: FetchCurrentUserProfileOptions = {},
  ): Promise<UserProfile | null> => {
    const includeEmailsFilter = options.includeEmailsFilter ?? true;

    if (isLoaded.value && !force) {
      if (includeEmailsFilter && !isEmailsFilterLoaded.value) {
        await buildEmailsFilter();
      }

      return profile.value;
    }

    if (profileLoadPromise) {
      const currentProfile = await profileLoadPromise;

      if (includeEmailsFilter && !isEmailsFilterLoaded.value) {
        await buildEmailsFilter();
      }

      return currentProfile;
    }

    profileLoadPromise = (async (): Promise<UserProfile | null> => {
      isLoading.value = true;
      error.value = null;

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError) throw authError;

        const [comprasAuth, equiposAuth, ratingsAuth] = await Promise.all([
          supabaseCompras.auth.getUser(),
          supabaseEquipos.auth.getUser(),
          supabaseRatings.auth.getUser(),
        ]);

        idsUser.value = {
          mantenimiento: user?.id || null,
          compras: comprasAuth.data.user?.id || null,
          equipos: equiposAuth.data.user?.id || null,
          calificaciones: ratingsAuth.data.user?.id || null,
        };

        email.value = user?.email || "";
        profile.value = null;
        allProfiles.value = [];
        emailsFilter.value = [];
        isEmailsFilterLoaded.value = false;

        if (!email.value) {
          isLoaded.value = true;
          return null;
        }

        const { data: currentProfile, error: profileError } = await supabase
          .from("PROFILE")
          .select("*")
          .eq("email", email.value)
          .maybeSingle();

        if (profileError) throw profileError;

        profile.value = currentProfile || null;
        if (includeEmailsFilter) {
          await buildEmailsFilter();
        }

        isLoaded.value = true;
        return profile.value;
      } catch (fetchError) {
        console.error("Error fetching user profile:", fetchError);
        error.value =
          fetchError instanceof Error
            ? fetchError.message
            : "No se pudo cargar el perfil de usuario";
        throw fetchError;
      } finally {
        isLoading.value = false;
      }
    })();

    try {
      const currentProfile = await profileLoadPromise;

      if (includeEmailsFilter && !isEmailsFilterLoaded.value) {
        await buildEmailsFilter();
      }

      return currentProfile;
    } finally {
      profileLoadPromise = null;
    }
  };

  const buildEmailsFilter = async () => {
    if (isEmailsFilterLoaded.value) return emailsFilter.value;

    if (emailsFilterLoadPromise) return emailsFilterLoadPromise;

    emailsFilterLoadPromise = (async (): Promise<string[]> => {
      const userArea = area.value;

      if (userArea === "ALL" || userArea === "ALMACEN") {
        const { data: profiles, error: profilesError } = await supabase
          .from("PROFILE")
          .select("*");

        if (profilesError) throw profilesError;

        allProfiles.value = profiles || [];
        emailsFilter.value = [];
      } else if (!userArea) {
        emailsFilter.value = email.value ? [email.value] : [];
      } else {
        const { data: profiles, error: profilesError } = await supabase
          .from("PROFILE")
          .select("*")
          .or(`area.ilike.${userArea},email.eq.${email.value}`);

        if (profilesError) throw profilesError;

        allProfiles.value = profiles || [];

        const profileEmails = allProfiles.value
          .map((item) => item.email)
          .filter((item): item is string => Boolean(item));

        emailsFilter.value = Array.from(
          new Set([...profileEmails, email.value].filter(Boolean)),
        );
      }

      isEmailsFilterLoaded.value = true;
      return emailsFilter.value;
    })();

    try {
      return await emailsFilterLoadPromise;
    } finally {
      emailsFilterLoadPromise = null;
    }
  };

  const getProfileAttribute = <K extends keyof UserProfile>(key: K) => {
    return profile.value?.[key] ?? null;
  };

  const getProfile = () => profile.value;
  const getEmail = () => email.value;
  const getNombre = () => nombre.value;
  const getArea = () => area.value;
  const getRole = () => role.value;
  const getEmailsFilter = () => [...emailsFilter.value];

  const reset = () => {
    profile.value = null;
    email.value = "";
    idsUser.value = {
      compras: null,
      mantenimiento: null,
      equipos: null,
      calificaciones: null,
    };
    allProfiles.value = [];
    emailsFilter.value = [];
    isLoaded.value = false;
    isEmailsFilterLoaded.value = false;
    error.value = null;
  };

  return {
    profile,
    email,
    idsUser,
    nombre,
    area,
    role,
    allProfiles,
    emailsFilter,
    isLoading,
    isLoaded,
    isEmailsFilterLoaded,
    error,
    fetchCurrentUserProfile,
    buildEmailsFilter,
    getProfileAttribute,
    getProfile,
    getEmail,
    getNombre,
    getArea,
    getRole,
    getEmailsFilter,
    reset,
  };
});
