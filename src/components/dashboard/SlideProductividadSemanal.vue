<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { Copy, Download, Loader2, RefreshCw } from 'lucide-vue-next';
import ProductividadSemanalAreaSlideLegacy from '@/components/dashboard/ProductividadSemanalAreaSlide.vue';
import ProductividadSemanalAreaSlideV2 from '@/components/dashboard/ProductividadSemanalAreaSlideV2.vue';
import { useProductividadSlidePngExport } from '@/composables/useProductividadSlidePngExport';
import { useHorasTrabajoStore } from '@/stores/horasTrabajoStore';
import { useMaintenanceStore } from '@/stores/maintenanceStore';
import { useHorasPerdidasAreaMotivoStore } from '@/stores/db_mantenimiento/horas_perdidas_area_motivo/horasPerdidasAreaMotivo.store';
import { getWeekNumber } from '@/utils/dateUtils';

const horasTrabajoStore = useHorasTrabajoStore();
const maintenanceStore = useMaintenanceStore();
const horasPerdidasAreaMotivoStore = useHorasPerdidasAreaMotivoStore();
const {
  productividadSemanal,
  productividadSemanalLoading,
  productividadSemanalError,
  productividadSemanalDashboardTablas,
} = storeToRefs(horasTrabajoStore);

const currentWeek = String(getWeekNumber(new Date()));
const horasPerdidasFechaDesde = '2026-04-06';

const currentSlideIndex = ref(0);
const slideCaptureRef = useTemplateRef<HTMLElement>('slideCaptureRef');

const productivitySlides = computed(() => productividadSemanal.value?.areas ?? []);
const activeSlide = computed(() => productivitySlides.value[currentSlideIndex.value] ?? null);
const dashboardTables = computed(() => productividadSemanalDashboardTablas.value);
const activeSlideComponent = computed(() => {
  const areaName = activeSlide.value?.area?.trim().toLowerCase() || '';
  return areaName === 'servicios generales'
    ? ProductividadSemanalAreaSlideLegacy
    : ProductividadSemanalAreaSlideV2;
});
const canGoPrevious = computed(() => currentSlideIndex.value > 0);
const canGoNext = computed(() => currentSlideIndex.value < productivitySlides.value.length - 1);
const weekLabel = computed(() => productividadSemanal.value?.semana || currentWeek);

const {
  copyActiveSlideToClipboard,
  exportError,
  exportSlidesAsPng,
  isCopying,
  isExporting,
} = useProductividadSlidePngExport({
  currentSlideIndex,
  slideElement: slideCaptureRef,
  slides: productivitySlides,
  weekLabel,
});

const fetchProductividad = () => {
  return horasTrabajoStore.fetchProductividadSemanalPorEquipo(currentWeek, 3);
};

const loadProductividad = () => {
  void fetchProductividad().catch(() => undefined);
};

const loadDashboardTables = () => {
  void Promise.all([
    maintenanceStore.fetchAllOrders(),
    horasTrabajoStore.fetchData(),
    horasPerdidasAreaMotivoStore.cargarResumen(horasPerdidasFechaDesde),
  ]).catch(() => undefined);
};

const goPrevious = () => {
  if (!canGoPrevious.value) return;
  currentSlideIndex.value -= 1;
};

const goNext = () => {
  if (productivitySlides.value.length === 0) return;

  if (!canGoNext.value) {
    currentSlideIndex.value = 0;
    return;
  }

  currentSlideIndex.value += 1;
};

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  return target.isContentEditable
    || tagName === 'input'
    || tagName === 'textarea'
    || tagName === 'select';
};

const handleKeyNavigation = (event: KeyboardEvent) => {
  if (isEditableTarget(event.target)) return;
  if (productivitySlides.value.length <= 1) return;

  const pressedKey = event.key.toLowerCase();

  if (pressedKey === 's') {
    event.preventDefault();
    goNext();
    return;
  }

  if (pressedKey === 'a') {
    event.preventDefault();

    if (!canGoPrevious.value) {
      currentSlideIndex.value = Math.max(productivitySlides.value.length - 1, 0);
      return;
    }

    goPrevious();
  }
};

watch(productivitySlides, (slides) => {
  if (currentSlideIndex.value > slides.length - 1) {
    currentSlideIndex.value = Math.max(slides.length - 1, 0);
  }
});

onMounted(() => {
  loadProductividad();
  loadDashboardTables();
  window.addEventListener('keydown', handleKeyNavigation);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyNavigation);
});
</script>

<template>
  <section
    class="weekly-productivity-section relative overflow-hidden bg-white"
  >
    <div
      v-if="productividadSemanalLoading"
      class="flex h-full items-center justify-center"
    >
      <Loader2 class="h-8 w-8 animate-spin text-main" />
    </div>

    <div
      v-else-if="productividadSemanalError"
      class="flex h-full flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <p class="max-w-md text-sm font-semibold text-gray-500">
        {{ productividadSemanalError }}
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg bg-main px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-main-light"
        @click.stop="loadProductividad"
      >
        <RefreshCw class="h-4 w-4" />
        Reintentar
      </button>
    </div>

    <div v-else-if="activeSlide" ref="slideCaptureRef" class="weekly-productivity-frame">
      <component
        :is="activeSlideComponent"
        :key="activeSlide.area"
        :area="activeSlide"
        :semana="productividadSemanal?.semana || currentWeek"
        :dashboard-tables="dashboardTables"
        aria-label="Productividad semanal"
      />
    </div>

    <div
      v-else
      class="flex h-full items-center justify-center px-6 text-center"
    >
      <p class="max-w-md text-sm font-semibold text-gray-500">
        No hay datos de productividad semanal para la semana {{ currentWeek }}.
      </p>
    </div>

    <div
      v-if="activeSlide"
      class="absolute right-4 top-4 z-20 flex flex-col items-end gap-2"
    >
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white/95 px-4 py-2 text-sm font-bold text-main shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isCopying || isExporting"
        @click.stop="copyActiveSlideToClipboard"
      >
        <Loader2 v-if="isCopying" class="h-4 w-4 animate-spin" />
        <Copy v-else class="h-4 w-4" />
        {{ isCopying ? 'Copiando PNG...' : '' }}
      </button>

      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white/95 px-4 py-2 text-sm font-bold text-main shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isExporting || isCopying"
        @click.stop="exportSlidesAsPng"
      >
        <Loader2 v-if="isExporting" class="h-4 w-4 animate-spin" />
        <Download v-else class="h-4 w-4" />
        {{ isExporting ? 'Generando PNG...' : '' }}
      </button>

      <p
        v-if="exportError"
        class="max-w-xs rounded-lg bg-white/95 px-3 py-2 text-right text-xs font-semibold text-danger shadow-sm"
      >
        {{ exportError }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.weekly-productivity-section {
  height: 100%;
}

.weekly-productivity-frame {
  height: 100%;
  margin: 0 auto;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0.35rem 0;
  width: 100%;
}
</style>
