<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";
import type { Component } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Loader2 } from "lucide-vue-next";

// Maintenance Slides
import MaintSlideOrders from "@/components/maintenance/MaintSlideOrders.vue";
import MaintSlideSG from "@/components/maintenance/MaintSlideSG.vue";
import MaintSlideHours from "@/components/maintenance/MaintSlideHours.vue";
import MaintSlideStages from "@/components/maintenance/MaintSlideStages.vue";
import MaintSlideMetrics from "@/components/maintenance/MaintSlideMetrics.vue";
import MaintSlideUpdates from "@/components/maintenance/MaintSlideUpdates.vue";
import SlideHorasTrabajo from "@/components/dashboard/SlideHorasTrabajo.vue";
import SlideMantenimiento from "@/components/dashboard/SlideMantenimiento.vue";
import SlideProductividadSemanal from "@/components/dashboard/SlideProductividadSemanal.vue";
import SlideServiciosGenerales from "@/components/dashboard/SlideServiciosGenerales.vue";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import { storeToRefs } from "pinia";
import { filterMaintenanceTabs } from "@/maintenance/maintenanceTabs";

type MaintenanceSlide = {
  id: string;
  component: Component;
};

const route = useRoute();
const router = useRouter();
const featureAccessStore = useFeatureAccessStore();
const { isLoaded: isFeatureAccessLoaded } = storeToRefs(featureAccessStore);
const CACHE_LIMIT = 3;
const slideComponents: Record<string, Component> = {
  ordenes: MaintSlideOrders,
  servicios_generales: MaintSlideSG,
  horas_asignadas: MaintSlideHours,
  definiciones_etapas: MaintSlideStages,
  metricas: MaintSlideMetrics,
  actualizaciones: MaintSlideUpdates,
  indicadores: SlideMantenimiento,
  productividad: SlideProductividadSemanal,
  horas_trabajo: SlideHorasTrabajo,
  servicios_generales_analitica: SlideServiciosGenerales,
};

const isLoading = computed(() => !isFeatureAccessLoaded.value);
const activeSlideId = shallowRef("");

const filteredSlides = computed(() => {
  const tabs = filterMaintenanceTabs({
    isFeatureAccessLoaded: isFeatureAccessLoaded.value,
    hasFeatureAccess: featureAccessStore.tieneFuncionalidad,
  });

  return tabs.map((tab): MaintenanceSlide => ({
    id: tab.id,
    component: slideComponents[tab.id],
  }));
});

const activeSlide = computed(
  () =>
    filteredSlides.value.find((slide) => slide.id === activeSlideId.value) ??
    filteredSlides.value[0] ??
    null,
);

const getSlideLoadProps = (slideId: string) => {
  if (slideId !== "indicadores" && slideId !== "productividad") {
    return {};
  }

  return {
    isActive: true,
    loadImmediately: true,
  };
};

const syncRouteWithSlide = async (slideId: string) => {
  if (route.query.maint_slide === slideId) {
    return;
  }

  await router.replace({
    query: {
      ...route.query,
      maint_slide: slideId,
    },
  });
};

const setInitialSlide = () => {
  const requestedSlide =
    typeof route.query.maint_slide === "string" ? route.query.maint_slide : "";
  const firstAvailableSlide = filteredSlides.value[0]?.id ?? "";

  if (
    requestedSlide &&
    filteredSlides.value.some((slide) => slide.id === requestedSlide)
  ) {
    activeSlideId.value = requestedSlide;
    return;
  }

  activeSlideId.value = firstAvailableSlide;
};

watch(
  filteredSlides,
  (slides) => {
    if (slides.length === 0) {
      activeSlideId.value = "";
      return;
    }

    if (!slides.some((slide) => slide.id === activeSlideId.value)) {
      setInitialSlide();
      if (activeSlideId.value) {
        void syncRouteWithSlide(activeSlideId.value).catch((error) => {
          console.error("Error sincronizando tab de mantenimiento:", error);
        });
      }
    }
  },
  { immediate: true },
);

watch(
  () => route.query.maint_slide,
  (newSlide) => {
    if (typeof newSlide !== "string" || !newSlide) {
      return;
    }

    if (filteredSlides.value.some((slide) => slide.id === newSlide)) {
      activeSlideId.value = newSlide;
    }
  },
);
</script>

<template>
  <div class="h-full flex flex-col relative bg-white">
    <div
      v-if="isLoading"
      id="maint-loading-spinner"
      class="flex items-center justify-center h-full"
    >
      <Loader2 class="w-8 h-8 text-main animate-spin" />
    </div>

    <div
      v-if="!isLoading && activeSlide"
      id="maint-tab-panel"
      class="flex-1 overflow-y-auto bg-gray-50/50"
    >
      <div
        class="px-4 py-4 pb-[120px] md:px-8 md:py-8 md:pb-8 lg:px-10 lg:py-10 lg:pb-10"
      >
        <KeepAlive :max="CACHE_LIMIT">
          <component
            :is="activeSlide.component"
            :key="activeSlide.id"
            v-bind="getSlideLoadProps(activeSlide.id)"
          />
        </KeepAlive>
      </div>
    </div>
  </div>
</template>
