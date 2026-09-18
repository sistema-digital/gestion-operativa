import { defineStore } from "pinia";
import { supabase } from "@/lib/supabase";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";

const SESSION_VALIDATION_TIMEOUT_MS = 10_000;

export type SessionValidationStatus =
  "idle" | "validando" | "timeout" | "error" | "sin_sesion" | "autorizado";

type ValidationResult = Exclude<SessionValidationStatus, "idle" | "validando">;

interface SessionValidationState {
  pendingProtectedPath: string | null;
  status: SessionValidationStatus;
}

const hasValidSession = (
  session: {
    access_token: string;
    expires_at?: number;
  } | null,
): boolean => {
  if (!session?.access_token) return false;

  return (
    session.expires_at === undefined || session.expires_at * 1_000 > Date.now()
  );
};

const createTimeout = (): Promise<"timeout"> =>
  new Promise((resolve) => {
    window.setTimeout(() => resolve("timeout"), SESSION_VALIDATION_TIMEOUT_MS);
  });

export const useSessionValidationStore = defineStore("sessionValidation", {
  state: (): SessionValidationState => ({
    pendingProtectedPath: null,
    status: "idle",
  }),

  getters: {
    isBlocking: (state): boolean =>
      state.status === "validando" ||
      state.status === "timeout" ||
      state.status === "error",
    isValidating: (state): boolean => state.status === "validando",
  },

  actions: {
    clearPendingProtectedPath(): void {
      this.pendingProtectedPath = null;
    },

    reset(): void {
      this.pendingProtectedPath = null;
      this.status = "idle";
    },

    setPendingProtectedPath(path: string): void {
      this.pendingProtectedPath = path;
    },

    async validateSession(): Promise<ValidationResult> {
      if (this.status === "validando") {
        return "error";
      }

      this.status = "validando";

      const validation = this.performValidation();
      const result = await Promise.race([validation, createTimeout()]);

      this.status = result;
      return result;
    },

    async performValidation(): Promise<ValidationResult> {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) return "error";
        if (!hasValidSession(data.session)) return "sin_sesion";

        await useFeatureAccessStore().cargarFuncionalidadesPermitidas();
        return "autorizado";
      } catch {
        return "error";
      }
    },
  },
});
