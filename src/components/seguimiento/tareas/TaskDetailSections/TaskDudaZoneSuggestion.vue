<script setup lang="ts">
import { computed } from "vue";
import { Link2, MapPin, X } from "lucide-vue-next";
import type { TareaDudaZonaRealtimeEvent } from "@/seguimiento/shared/tareas/tareaRealtime.service";

type DudaZonaSugeridaEvent = Extract<
  TareaDudaZonaRealtimeEvent,
  { tipo: "duda_zona_sugerida" }
>;

const props = defineProps<{
  suggestion: DudaZonaSugeridaEvent;
  submitting: boolean;
}>();
const emit = defineEmits<{
  accept: [suggestion: DudaZonaSugeridaEvent];
  discard: [suggestion: DudaZonaSugeridaEvent];
}>();

const distanceLabel = computed(
  () => `${Math.round(props.suggestion.distancia_metros)} m`,
);
const canAdd = computed(() => props.suggestion.acciones.includes("agregar"));
const canDiscard = computed(
  () =>
    props.suggestion.puede_descartar &&
    props.suggestion.acciones.includes("descartar"),
);
</script>

<template>
  <section
    class="rounded-[10px] border border-warning/30 bg-warning-bg/45 p-3"
    aria-label="Posible permanencia relacionada"
  >
    <div class="flex gap-2">
      <MapPin class="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
      <div class="min-w-0">
        <h3 class="text-[11px] font-extrabold text-warning">
          Posible permanencia relacionada
        </h3>
        <p class="mt-1 text-[10px] leading-4 text-slate-700">
          La permanencia cerrada está a {{ distanceLabel }} de esta tarea zona.
          Puedes reutilizar su zona de control sin duplicar geometría.
        </p>
      </div>
    </div>
    <div class="mt-3 grid grid-cols-2 gap-2">
      <button
        v-if="canAdd"
        class="inline-flex min-h-9 cursor-pointer items-center justify-center gap-1 rounded-md bg-main px-2 text-[10px] font-extrabold text-white transition hover:bg-main-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main disabled:cursor-not-allowed disabled:opacity-55"
        type="button"
        :disabled="submitting"
        @click="emit('accept', suggestion)"
      >
        <Link2 class="size-3.5" aria-hidden="true" />
        {{ submitting ? "Agregando…" : "Agregar zona" }}
      </button>
      <button
        v-if="canDiscard"
        class="inline-flex min-h-9 cursor-pointer items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[10px] font-extrabold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main disabled:cursor-not-allowed disabled:opacity-55"
        type="button"
        :disabled="submitting"
        @click="emit('discard', suggestion)"
      >
        <X class="size-3.5" aria-hidden="true" />Descartar duda
      </button>
    </div>
  </section>
</template>
