<script setup lang="ts">
import { computed, onMounted } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import { ShieldCheck } from "lucide-vue-next";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import { PANEL_ADMIN_FEATURES } from "@/constants/panelAdminPermissions";

const route = useRoute();
const router = useRouter();
const featureAccessStore = useFeatureAccessStore();
const canViewMaintenancePlan = computed(() =>
  featureAccessStore.tieneFuncionalidad(
    PANEL_ADMIN_FEATURES.viewMaintenancePlan,
  ),
);

const openFirstAvailableSection = (): void => {
  if (route.name === "PanelAdmin" && canViewMaintenancePlan.value) {
    void router.replace({ name: "PanelAdminMaintenancePlan" });
  }
};

onMounted(openFirstAvailableSection);
</script>

<template>
  <RouterView v-if="canViewMaintenancePlan" />

  <div
    v-else
    class="mx-auto flex min-h-80 max-w-2xl flex-col items-center justify-center px-4 text-center"
  >
    <ShieldCheck class="mb-3 size-9 text-gray-300" aria-hidden="true" />
    <h1 class="text-sm font-bold text-gray-700">Panel administrativo</h1>
    <p class="mt-1 text-xs text-gray-500">
      No tienes secciones habilitadas dentro del panel administrativo.
    </p>
  </div>
</template>
