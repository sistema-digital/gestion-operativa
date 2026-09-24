import { onBeforeUnmount, onMounted, shallowRef } from "vue";
import { useRegisterSW } from "virtual:pwa-register/vue";
import { fetchAppVersion, type AppVersion } from "@/pwa/appVersion";

const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1_000;

export const usePwaUpdate = () => {
  const version = shallowRef<AppVersion | null>(null);
  const isVersionResolved = shallowRef(false);
  const updateError = shallowRef<string | null>(null);
  const isApplyingUpdate = shallowRef(false);
  let registration: ServiceWorkerRegistration | undefined;
  let updateInterval: number | null = null;

  const loadVersion = async (): Promise<void> => {
    version.value = await fetchAppVersion();
    isVersionResolved.value = true;
  };

  const checkForUpdate = (): void => {
    void registration?.update();
  };

  const handleVisibilityChange = (): void => {
    if (document.visibilityState === "visible") checkForUpdate();
  };

  const { needRefresh, updateServiceWorker } = useRegisterSW({
    immediate: true,
    onNeedRefresh: () => {
      void loadVersion();
    },
    onRegisteredSW: (_serviceWorkerUrl, registeredServiceWorker) => {
      registration = registeredServiceWorker;
    },
  });

  const applyUpdate = async (): Promise<void> => {
    isApplyingUpdate.value = true;
    updateError.value = null;

    try {
      await updateServiceWorker(true);
    } catch {
      isApplyingUpdate.value = false;
      updateError.value =
        "No se pudo aplicar la actualización. Intenta nuevamente.";
    }
  };

  onMounted(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    updateInterval = window.setInterval(
      checkForUpdate,
      UPDATE_CHECK_INTERVAL_MS,
    );
  });

  onBeforeUnmount(() => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);

    if (updateInterval !== null) window.clearInterval(updateInterval);
  });

  return {
    needRefresh,
    version,
    isVersionResolved,
    updateError,
    isApplyingUpdate,
    applyUpdate,
  };
};
