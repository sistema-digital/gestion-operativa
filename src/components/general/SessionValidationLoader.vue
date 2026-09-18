<script setup lang="ts">
import { AlertCircle, LoaderCircle, RefreshCw } from "lucide-vue-next";
import { computed } from "vue";
import type { SessionValidationStatus } from "@/stores/sessionValidation.store";

const props = defineProps<{
  isValidating: boolean;
  status: SessionValidationStatus;
  visible: boolean;
}>();

const emit = defineEmits<{
  retry: [];
}>();

const isRetryState = computed(
  (): boolean => props.status === "timeout" || props.status === "error",
);
</script>

<template>
  <Transition name="session-validation-loader">
    <section
      v-if="visible"
      class="fixed inset-0 z-[10000] flex items-center justify-center bg-main-dark/95 px-4 backdrop-blur-sm"
      aria-live="assertive"
      aria-modal="true"
      role="alertdialog"
    >
      <div
        class="flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-5 py-5 text-center shadow-2xl sm:max-w-sm sm:px-6"
      >
        <LoaderCircle
          v-if="status === 'validando'"
          class="h-7 w-7 animate-spin text-accent"
          aria-hidden="true"
        />
        <AlertCircle v-else class="h-7 w-7 text-accent" aria-hidden="true" />

        <div class="space-y-1">
          <p class="font-body text-sm font-semibold tracking-wide text-white">
            <template v-if="status === 'validando'">
              Validando credenciales
            </template>
            <template v-else-if="status === 'timeout'">
              La validación está tardando más de lo esperado
            </template>
            <template v-else>
              No se pudieron validar las credenciales
            </template>
          </p>
          <p v-if="isRetryState" class="font-body text-xs text-white/70">
            Revisa tu conexión e inténtalo nuevamente.
          </p>
        </div>

        <button
          v-if="isRetryState"
          type="button"
          class="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 font-body text-xs font-semibold text-main-dark transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isValidating"
          @click="emit('retry')"
        >
          <RefreshCw
            class="h-4 w-4"
            :class="{ 'animate-spin': isValidating }"
            aria-hidden="true"
          />
          Reintentar
        </button>
      </div>
    </section>
  </Transition>
</template>

<style scoped>
.session-validation-loader-enter-active,
.session-validation-loader-leave-active {
  transition: opacity 160ms ease;
}

.session-validation-loader-enter-from,
.session-validation-loader-leave-to {
  opacity: 0;
}
</style>
