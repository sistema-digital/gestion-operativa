import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import { useSessionValidationStore } from "@/stores/sessionValidation.store";

interface AuthResponse {
  data: {
    session: {
      access_token: string;
      expires_at?: number;
    } | null;
  };
  error: Error | null;
}

const { getSession } = vi.hoisted(() => ({
  getSession: vi.fn<() => Promise<AuthResponse>>(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getSession },
  },
}));

const validSession = (): AuthResponse => ({
  data: {
    session: {
      access_token: "session-token",
      expires_at: Math.floor(Date.now() / 1_000) + 3_600,
    },
  },
  error: null,
});

describe("sessionValidationStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("autoriza solamente después de cargar las funcionalidades", async () => {
    getSession.mockResolvedValue(validSession());
    const featureAccessStore = useFeatureAccessStore();
    const cargarFuncionalidades = vi
      .spyOn(featureAccessStore, "cargarFuncionalidadesPermitidas")
      .mockResolvedValue(["module_dashboard"]);
    const sessionValidationStore = useSessionValidationStore();

    await expect(sessionValidationStore.validateSession()).resolves.toBe(
      "autorizado",
    );

    expect(cargarFuncionalidades).toHaveBeenCalledOnce();
    expect(sessionValidationStore.status).toBe("autorizado");
  });

  it("marca sin sesión sin solicitar funcionalidades", async () => {
    getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    const featureAccessStore = useFeatureAccessStore();
    const cargarFuncionalidades = vi.spyOn(
      featureAccessStore,
      "cargarFuncionalidadesPermitidas",
    );
    const sessionValidationStore = useSessionValidationStore();

    await expect(sessionValidationStore.validateSession()).resolves.toBe(
      "sin_sesion",
    );

    expect(cargarFuncionalidades).not.toHaveBeenCalled();
    expect(sessionValidationStore.status).toBe("sin_sesion");
  });

  it("permite reintentar después de un error recuperable", async () => {
    getSession
      .mockResolvedValueOnce({
        data: { session: null },
        error: new Error("red"),
      })
      .mockResolvedValueOnce(validSession());
    const featureAccessStore = useFeatureAccessStore();
    vi.spyOn(
      featureAccessStore,
      "cargarFuncionalidadesPermitidas",
    ).mockResolvedValue(["module_dashboard"]);
    const sessionValidationStore = useSessionValidationStore();

    await expect(sessionValidationStore.validateSession()).resolves.toBe(
      "error",
    );
    await expect(sessionValidationStore.validateSession()).resolves.toBe(
      "autorizado",
    );
    expect(getSession).toHaveBeenCalledTimes(2);
  });

  it("muestra timeout cuando Auth no responde en diez segundos", async () => {
    vi.useFakeTimers();
    getSession.mockImplementation(() => new Promise<AuthResponse>(() => {}));
    const sessionValidationStore = useSessionValidationStore();

    const validation = sessionValidationStore.validateSession();
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(validation).resolves.toBe("timeout");
    expect(sessionValidationStore.status).toBe("timeout");
  });
});
