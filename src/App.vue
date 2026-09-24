<script setup lang="ts">
import { storeToRefs } from "pinia";
import Toast from "primevue/toast";
import { computed, watch } from "vue";
import DevInspector from "@/components/DevInspector.vue";
import ModuleNavigationLoader from "@/components/general/ModuleNavigationLoader.vue";
import PwaUpdateRequired from "@/components/general/PwaUpdateRequired.vue";
import SessionValidationLoader from "@/components/general/SessionValidationLoader.vue";
import { usePwaUpdate } from "@/composables/usePwaUpdate";
import { useNavigationLoaderStore } from "@/stores/navigationLoader.store";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import { useSessionValidationStore } from "@/stores/sessionValidation.store";
import { useToast } from "primevue/usetoast";
import { useRouter } from "vue-router";

const router = useRouter();
const toast = useToast();
const navigationLoaderStore = useNavigationLoaderStore();
const sessionValidationStore = useSessionValidationStore();
const featureAccessStore = useFeatureAccessStore();
const { isLoaded: isFeatureAccessLoaded } = storeToRefs(featureAccessStore);
const {
  errorSequence: navigationErrorSequence,
  isLoading: isNavigationLoading,
} = storeToRefs(navigationLoaderStore);
const {
  isBlocking: isSessionValidationBlocking,
  isValidating: isSessionValidating,
  pendingProtectedPath,
  status: sessionValidationStatus,
} = storeToRefs(sessionValidationStore);
const {
  needRefresh,
  version: pwaVersion,
  isVersionResolved: isPwaVersionResolved,
  updateError: pwaUpdateError,
  isApplyingUpdate,
  applyUpdate,
} = usePwaUpdate();

const shouldRequirePwaUpdate = computed(() => {
  if (!needRefresh.value || !isPwaVersionResolved.value) return false;
  if (!pwaVersion.value || pwaVersion.value.appliesToAllUsers) return true;
  if (!isFeatureAccessLoaded.value) return false;

  return pwaVersion.value.affectedFeatures.some((feature) =>
    featureAccessStore.tieneFuncionalidad(feature),
  );
});

const retrySessionValidation = async (): Promise<void> => {
  const result = await sessionValidationStore.validateSession();

  if (result === "sin_sesion") {
    sessionValidationStore.clearPendingProtectedPath();
    await router.replace({ name: "Login" });
    return;
  }

  if (result === "autorizado" && pendingProtectedPath.value) {
    const path = pendingProtectedPath.value;
    sessionValidationStore.clearPendingProtectedPath();
    await router.replace(path);
  }
};

watch(navigationErrorSequence, (errorSequence) => {
  if (errorSequence === 0) return;

  toast.add({
    group: "navigation",
    severity: "error",
    summary: "Error de carga",
    detail: "No se pudo cargar el módulo. Intenta nuevamente.",
    life: 5000,
  });
});
</script>

<template>
  <PwaUpdateRequired
    v-if="shouldRequirePwaUpdate"
    :version="pwaVersion"
    :is-applying="isApplyingUpdate"
    :error="pwaUpdateError"
    @update="applyUpdate"
  />

  <SessionValidationLoader
    :is-validating="isSessionValidating"
    :status="sessionValidationStatus"
    :visible="isSessionValidationBlocking"
    @retry="retrySessionValidation"
  />

  <ModuleNavigationLoader :visible="isNavigationLoading" />

  <Toast group="navigation" position="top-right" />

  <router-view v-slot="{ Component, route }">
    <component :is="Component" :key="route.matched[0]?.path ?? route.path" />
  </router-view>

  <DevInspector />

  <div
    id="toast-container"
    class="fixed top-6 right-6 z-[8000] flex flex-col gap-3 pointer-events-none"
  ></div>
</template>
