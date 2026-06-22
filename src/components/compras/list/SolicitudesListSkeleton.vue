<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  variant: 'desktop' | 'mobile';
  rows?: number;
}>(), {
  rows: 4,
});

const skeletonRows = computed(() =>
  Array.from({ length: Math.max(props.rows, 1) }, (_, index) => index)
);
</script>

<template>
  <section
    class="overflow-hidden rounded-2xl border border-stone-300 bg-white/90 shadow-sm"
    aria-label="Cargando solicitudes"
    aria-busy="true"
  >
    <template v-if="variant === 'desktop'">
      <div class="grid grid-cols-[minmax(10rem,1fr)_minmax(20rem,2.3fr)_minmax(8rem,0.9fr)_minmax(7rem,0.8fr)_minmax(10rem,1fr)_minmax(9rem,0.9fr)_minmax(10rem,1fr)] gap-3 border-b border-stone-200 bg-stone-100 px-4 py-3">
        <span
          v-for="index in 7"
          :key="`header-${index}`"
          class="h-3 animate-pulse rounded bg-stone-200"
        />
      </div>

      <div class="divide-y divide-stone-100">
        <div
          v-for="row in skeletonRows"
          :key="`desktop-row-${row}`"
          class="grid grid-cols-[minmax(10rem,1fr)_minmax(20rem,2.3fr)_minmax(8rem,0.9fr)_minmax(7rem,0.8fr)_minmax(10rem,1fr)_minmax(9rem,0.9fr)_minmax(10rem,1fr)] gap-3 px-4 py-4"
        >
          <div class="space-y-2">
            <div class="h-4 w-20 animate-pulse rounded bg-stone-200" />
            <div class="h-3 w-16 animate-pulse rounded bg-stone-100" />
          </div>
          <div class="space-y-2">
            <div class="h-3.5 w-full animate-pulse rounded bg-stone-200" />
            <div class="h-3.5 w-11/12 animate-pulse rounded bg-stone-100" />
            <div class="h-3.5 w-8/12 animate-pulse rounded bg-stone-100" />
          </div>
          <div class="flex items-center">
            <div class="h-8 w-28 animate-pulse rounded-full bg-teal-50" />
          </div>
          <div class="flex items-center">
            <div class="h-7 w-16 animate-pulse rounded-full bg-amber-50" />
          </div>
          <div class="flex items-center gap-2">
            <div class="h-7 w-14 animate-pulse rounded-lg bg-stone-100" />
            <div class="h-7 w-14 animate-pulse rounded-lg bg-stone-100" />
          </div>
          <div class="space-y-2">
            <div class="h-3.5 w-20 animate-pulse rounded bg-stone-200" />
            <div class="h-3.5 w-16 animate-pulse rounded bg-stone-100" />
          </div>
          <div class="flex items-center gap-2">
            <div class="h-7 w-20 animate-pulse rounded-full bg-blue-50" />
            <div class="h-7 w-20 animate-pulse rounded-full bg-rose-50" />
          </div>
        </div>
      </div>
    </template>

    <div v-else class="space-y-3 bg-[#f5f1e8] p-1">
      <article
        v-for="row in skeletonRows"
        :key="`mobile-row-${row}`"
        class="rounded-[1.35rem] border border-stone-200 bg-white p-4 shadow-[0_10px_30px_rgba(41,37,36,0.08)]"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-2">
            <div class="h-6 w-24 animate-pulse rounded bg-stone-200" />
            <div class="h-3.5 w-20 animate-pulse rounded bg-stone-100" />
          </div>
          <div class="h-8 w-28 animate-pulse rounded-full bg-teal-50" />
        </div>

        <div class="mt-4 space-y-2">
          <div class="h-4 w-full animate-pulse rounded bg-stone-200" />
          <div class="h-4 w-11/12 animate-pulse rounded bg-stone-100" />
          <div class="h-4 w-8/12 animate-pulse rounded bg-stone-100" />
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <div class="h-8 w-16 animate-pulse rounded-full bg-amber-50" />
          <div class="h-8 w-28 animate-pulse rounded-full bg-stone-100" />
          <div class="h-8 w-16 animate-pulse rounded-full bg-teal-50" />
          <div class="h-8 w-16 animate-pulse rounded-full bg-teal-50" />
        </div>

        <div class="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
          <div class="h-8 w-24 animate-pulse rounded-full bg-blue-50" />
          <div class="h-8 w-24 animate-pulse rounded-full bg-stone-100" />
        </div>
      </article>
    </div>
  </section>
</template>
