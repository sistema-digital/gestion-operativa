<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-vue-next';
import ProductividadSemanalAreaSlide from '@/components/dashboard/ProductividadSemanalAreaSlide.vue';
import { useHorasTrabajoStore } from '@/stores/horasTrabajoStore';
import { getWeekNumber } from '@/utils/dateUtils';

const horasTrabajoStore = useHorasTrabajoStore();
const {
  productividadSemanal,
  productividadSemanalLoading,
  productividadSemanalError,
} = storeToRefs(horasTrabajoStore);

const currentWeek = String(getWeekNumber(new Date()));

const currentSlideIndex = ref(0);
const hoverDirection = ref<'previous' | 'next' | null>(null);

const productivitySlides = computed(() => productividadSemanal.value?.areas ?? []);
const activeSlide = computed(() => productivitySlides.value[currentSlideIndex.value] ?? null);
const canGoPrevious = computed(() => currentSlideIndex.value > 0);
const canGoNext = computed(() => currentSlideIndex.value < productivitySlides.value.length - 1);

const fetchProductividad = () => {
  return horasTrabajoStore.fetchProductividadSemanalPorEquipo(currentWeek, 3);
};

const loadProductividad = () => {
  void fetchProductividad().catch(() => undefined);
};

const goPrevious = () => {
  if (!canGoPrevious.value) return;
  currentSlideIndex.value -= 1;
};

const goNext = () => {
  if (!canGoNext.value) return;
  currentSlideIndex.value += 1;
};

const updateHoverDirection = (event: MouseEvent) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const pointerX = event.clientX - rect.left;
  hoverDirection.value = pointerX < rect.width / 2 ? 'previous' : 'next';
};

const handleNavigation = () => {
  if (productivitySlides.value.length <= 1) return;

  if (hoverDirection.value === 'previous') {
    goPrevious();
    return;
  }

  goNext();
};

watch(productivitySlides, (slides) => {
  if (currentSlideIndex.value > slides.length - 1) {
    currentSlideIndex.value = Math.max(slides.length - 1, 0);
  }
});

onMounted(() => {
  loadProductividad();
});
</script>

<template>
  <section
    class="weekly-productivity-section relative overflow-hidden bg-white"
    @mousemove="updateHoverDirection"
    @mouseleave="hoverDirection = null"
    @click="handleNavigation"
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

    <div v-else-if="activeSlide" class="weekly-productivity-frame">
      <ProductividadSemanalAreaSlide
        :key="activeSlide.area"
        :area="activeSlide"
        :semana="productividadSemanal?.semana || currentWeek"
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

    <button
      v-if="hoverDirection === 'previous'"
      type="button"
      class="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-400 shadow-sm transition"
      :class="canGoPrevious ? 'hover:text-main' : 'cursor-not-allowed opacity-40'"
      :disabled="!canGoPrevious"
      aria-label="Diapositiva anterior"
      @click.stop="goPrevious"
    >
      <ChevronLeft class="h-6 w-6" />
    </button>

    <button
      v-if="hoverDirection === 'next'"
      type="button"
      class="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-400 shadow-sm transition"
      :class="canGoNext ? 'hover:text-main' : 'cursor-not-allowed opacity-40'"
      :disabled="!canGoNext"
      aria-label="Diapositiva siguiente"
      @click.stop="goNext"
    >
      <ChevronRight class="h-6 w-6" />
    </button>
  </section>
</template>

<style scoped>
.weekly-productivity-section {
  height: 100%;
}

.weekly-productivity-frame {
  height: 100%;
  margin: 0 auto;
  overflow: hidden;
  width: 90%;
}
</style>
