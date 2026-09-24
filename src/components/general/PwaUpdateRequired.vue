<script setup lang="ts">
import { AlertTriangle, LoaderCircle, RefreshCw } from "lucide-vue-next";
import type { AppVersion } from "@/pwa/appVersion";

defineProps<{
  version: AppVersion | null;
  isApplying: boolean;
  error: string | null;
}>();

defineEmits<{
  update: [];
}>();
</script>

<template>
  <section
    class="fixed inset-0 z-[10000] flex items-center justify-center bg-main-dark/75 p-3 sm:p-5"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="pwa-update-title"
    aria-describedby="pwa-update-description"
  >
    <div
      class="w-full max-w-md rounded-lg border border-accent/40 bg-second p-4 shadow-xl sm:p-5"
    >
      <div class="flex items-start gap-3">
        <div
          class="flex size-9 shrink-0 items-center justify-center rounded-md bg-warning-bg text-warning"
        >
          <AlertTriangle class="size-5" aria-hidden="true" />
        </div>

        <div class="min-w-0">
          <p
            class="text-xs font-semibold uppercase tracking-[0.12em] text-warning"
          >
            Actualización obligatoria
          </p>
          <h2
            id="pwa-update-title"
            class="mt-1 text-base font-semibold text-gray-900 sm:text-lg"
          >
            Hay una nueva versión disponible
          </h2>
          <p
            id="pwa-update-description"
            class="mt-2 text-xs leading-5 text-gray-600 sm:text-sm"
          >
            {{
              version?.summary ?? "La nueva versión está lista para aplicarse."
            }}
          </p>
        </div>
      </div>

      <div
        v-if="version"
        class="mt-4 rounded-md border border-gray-200 bg-white/70 p-3"
      >
        <p class="text-xs font-semibold text-gray-700">Cambios incluidos</p>
        <ul class="mt-2 space-y-1.5 text-xs leading-5 text-gray-600 sm:text-sm">
          <li
            v-for="change in version.changes"
            :key="change"
            class="flex gap-2"
          >
            <span
              class="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
              aria-hidden="true"
            />
            <span>{{ change }}</span>
          </li>
        </ul>
        <p class="mt-3 text-xs text-gray-500">Versión {{ version.version }}</p>
      </div>

      <p v-if="error" class="mt-3 text-xs font-medium text-danger" role="alert">
        {{ error }}
      </p>

      <button
        type="button"
        class="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-main px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-main-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main disabled:cursor-wait disabled:opacity-70 sm:text-sm"
        :disabled="isApplying"
        @click="$emit('update')"
      >
        <LoaderCircle
          v-if="isApplying"
          class="size-4 animate-spin"
          aria-hidden="true"
        />
        <RefreshCw v-else class="size-4" aria-hidden="true" />
        {{ isApplying ? "Actualizando…" : "Actualizar ahora" }}
      </button>
    </div>
  </section>
</template>
