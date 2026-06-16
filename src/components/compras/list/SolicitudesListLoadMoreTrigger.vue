<script setup lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  shallowRef,
  useTemplateRef,
  watch,
} from 'vue';

const props = defineProps<{
  loadingMore: boolean;
  hasMore: boolean;
}>();

const emit = defineEmits<{
  (e: 'load-more'): void;
}>();

const triggerRef = useTemplateRef<HTMLDivElement>('trigger');
const observer = shallowRef<IntersectionObserver | null>(null);

const requestLoadMore = (): void => {
  if (!props.hasMore || props.loadingMore) {
    return;
  }

  emit('load-more');
};

const disconnectObserver = (): void => {
  observer.value?.disconnect();
  observer.value = null;
};

const setupObserver = (): void => {
  disconnectObserver();

  if (
    typeof window === 'undefined'
    || !('IntersectionObserver' in window)
    || !triggerRef.value
    || !props.hasMore
  ) {
    return;
  }

  observer.value = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        requestLoadMore();
      }
    },
    {
      rootMargin: '180px 0px',
    }
  );

  observer.value.observe(triggerRef.value);
};

onMounted(() => {
  setupObserver();
});

watch(
  [triggerRef, () => props.hasMore],
  () => {
    setupObserver();
  }
);

watch(
  () => props.loadingMore,
  (isLoadingMore) => {
    if (!isLoadingMore) {
      setupObserver();
    }
  }
);

onBeforeUnmount(() => {
  disconnectObserver();
});
</script>

<template>
  <section class="rounded-2xl border border-stone-300 bg-white/85 p-4 shadow-sm">
    <div ref="trigger" class="h-px w-full" aria-hidden="true" />

    <div class="flex min-h-11 flex-col items-center justify-center gap-3">
      <div
        v-if="loadingMore"
        class="inline-flex items-center gap-2 text-sm font-medium text-stone-600"
      >
        <span class="h-2.5 w-2.5 animate-pulse rounded-full bg-stone-400" />
        <span>Cargando más...</span>
      </div>

      <button
        v-else-if="hasMore"
        type="button"
        class="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
        @click="requestLoadMore"
      >
        Cargar más
      </button>

      <p v-else class="text-sm text-stone-500">
        No hay más resultados por ahora
      </p>
    </div>
  </section>
</template>
