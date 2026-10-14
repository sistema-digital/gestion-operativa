<script setup lang="ts">
import { computed, onMounted } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import { Wrench } from "lucide-vue-next";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import { PANEL_ADMIN_FEATURES } from "@/constants/panelAdminPermissions";

const route = useRoute();
const router = useRouter();
const featureAccessStore = useFeatureAccessStore();

const canViewWorkHours = computed(() =>
  featureAccessStore.tieneFuncionalidad(PANEL_ADMIN_FEATURES.viewWorkHours),
);

const openFirstAvailableTab = (): void => {
  if (route.name !== "PanelAdminMaintenancePlan" || !canViewWorkHours.value) {
    return;
  }

  void router.replace({ name: "PanelAdminWorkHours" });
};

onMounted(openFirstAvailableTab);
</script>

<template>
  <section class="min-h-full bg-gray-50/50">
    <RouterView v-if="canViewWorkHours" />

    <div
      v-else
      class="mx-auto flex min-h-64 max-w-2xl flex-col items-center justify-center px-4 text-center"
    >
      <Wrench class="mb-3 size-8 text-gray-300" aria-hidden="true" />
      <h2 class="text-sm font-bold text-gray-700">Sin pestañas disponibles</h2>
      <p class="mt-1 text-xs text-gray-500">
        No tienes permiso para visualizar las secciones de este plan.
      </p>
    </div>
  </section>
</template>
