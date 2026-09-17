<script setup lang="ts">
import { LoaderCircle } from "lucide-vue-next";

defineProps<{
  visible: boolean;
}>();
</script>

<template>
  <Transition name="module-navigation-loader">
    <div
      v-if="visible"
      class="fixed inset-0 z-[9000] flex items-center justify-center bg-main-dark/90 px-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label="Cargando módulo"
    >
      <div
        class="flex min-w-48 flex-col items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-6 py-5 text-center shadow-2xl"
      >
        <LoaderCircle
          class="h-7 w-7 animate-spin text-accent"
          aria-hidden="true"
        />
        <p class="font-body text-sm font-semibold tracking-wide text-white">
          Cargando módulo
        </p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.module-navigation-loader-enter-active,
.module-navigation-loader-leave-active {
  transition: opacity 160ms ease;
}

.module-navigation-loader-enter-from,
.module-navigation-loader-leave-to {
  opacity: 0;
}
</style>
