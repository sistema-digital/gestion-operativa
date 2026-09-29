<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";
import { AlertTriangle, Replace, Trash2 } from "lucide-vue-next";
import Multiselect from "vue-multiselect";
import type {
  TareaRastreoCambioZonaControl,
  TareaRastreoZonaDetalleDto,
  TareaSeguimientoZonaControl,
} from "@/stores/seguimiento/tareas/tareasSeguimiento.types";

type TaskControlZoneEditorMode = "remove" | "replace";

const props = defineProps<{
  mode: TaskControlZoneEditorMode;
  zone: TareaSeguimientoZonaControl;
  zoneDetail: TareaRastreoZonaDetalleDto | null;
  replacementZones: TareaSeguimientoZonaControl[];
  controlZoneCount: number;
  submitting: boolean;
}>();
const emit = defineEmits<{
  cancel: [];
  submit: [changes: TareaRastreoCambioZonaControl[]];
}>();

const replacementZone = shallowRef<TareaSeguimientoZonaControl | null>(null);
const canRemove = computed(() => props.controlZoneCount > 1);
const hasVisitHistory = computed(
  () =>
    Boolean(props.zoneDetail?.visitas.length) ||
    Boolean(props.zoneDetail?.tiempo.cantidad_visitas),
);
const canReplace = computed(
  () => Boolean(replacementZone.value) && !props.submitting,
);
const replacementOptions = computed(() =>
  props.replacementZones.filter((zone) => zone.id !== props.zone.id),
);

function replacementZoneLabel(zone: TareaSeguimientoZonaControl): string {
  const index = props.replacementZones.findIndex(
    (candidate) => candidate.id === zone.id,
  );
  return `Zona de control ${index + 1}`;
}

function submitRemoval(): void {
  if (!canRemove.value || props.submitting) return;
  emit("submit", [{ accion: "quitar", id: props.zone.id }]);
}

function submitReplacement(): void {
  if (!replacementZone.value || props.submitting) return;
  emit("submit", [
    {
      accion: "reemplazar",
      id: props.zone.id,
      nueva_zona_id: replacementZone.value.id,
    },
  ]);
}

watch(
  () => [props.zone.id, props.mode] as const,
  () => {
    replacementZone.value = null;
  },
  { immediate: true },
);
</script>

<template>
  <section
    class="rounded-lg border border-main/20 bg-second/45 p-2.5"
    aria-label="Editor de zona de control"
  >
    <div class="flex items-start gap-2">
      <Replace
        v-if="mode === 'replace'"
        class="mt-0.5 size-4 shrink-0 text-main"
        aria-hidden="true"
      />
      <Trash2
        v-else
        class="mt-0.5 size-4 shrink-0 text-danger"
        aria-hidden="true"
      />
      <div class="min-w-0 flex-1">
        <h4 class="text-[10px] font-extrabold text-slate-800">
          {{ mode === "replace" ? "Reemplazar zona" : "Quitar zona" }}
        </h4>
        <p class="mt-0.5 text-[9px] leading-4 text-slate-600">
          {{
            mode === "replace"
              ? "La zona elegida se conservará y esta relación de control se retirará."
              : "La relación de control se eliminará sin borrar la evidencia histórica."
          }}
        </p>
      </div>
    </div>

    <div
      v-if="hasVisitHistory"
      class="mt-2 flex gap-1.5 rounded-md border border-warning/25 bg-warning-bg/55 p-2 text-[9px] leading-4 text-slate-700"
    >
      <AlertTriangle
        class="mt-0.5 size-3.5 shrink-0 text-warning"
        aria-hidden="true"
      />
      Esta zona tiene visitas históricas. No se puede cambiar su geometría; el
      retiro o reemplazo conserva su trazabilidad.
    </div>

    <template v-if="mode === 'replace'">
      <Multiselect
        v-model="replacementZone"
        class="mt-2 text-xs [&_.multiselect]:min-h-9 [&_.multiselect__content-wrapper]:z-[60] [&_.multiselect__input]:mb-0 [&_.multiselect__input]:min-h-8 [&_.multiselect__input]:text-xs [&_.multiselect__option]:px-2 [&_.multiselect__option]:py-2 [&_.multiselect__option]:text-xs [&_.multiselect__select]:h-9 [&_.multiselect__select]:cursor-pointer [&_.multiselect__single]:mb-0 [&_.multiselect__single]:pt-2 [&_.multiselect__single]:text-xs [&_.multiselect__tags]:min-h-9 [&_.multiselect__tags]:border-slate-300 [&_.multiselect__tags]:py-0"
        :options="replacementOptions"
        :custom-label="replacementZoneLabel"
        :show-labels="false"
        :allow-empty="true"
        track-by="id"
        placeholder="Selecciona la zona que conservarás"
        aria-label="Zona de reemplazo"
      />
      <p
        v-if="!replacementOptions.length"
        class="mt-2 text-[9px] text-slate-500"
      >
        Agrega otra zona de control antes de reemplazar esta.
      </p>
    </template>
    <p v-else-if="!canRemove" class="mt-2 text-[9px] text-danger">
      La tarea debe conservar al menos una zona de control activa.
    </p>

    <div class="mt-3 grid grid-cols-2 gap-2">
      <button
        class="min-h-9 cursor-pointer rounded-md border border-slate-300 bg-white px-2 text-[10px] font-extrabold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main disabled:cursor-not-allowed disabled:opacity-55"
        type="button"
        aria-label="Cancelar edición de zona"
        :disabled="submitting"
        @click="emit('cancel')"
      >
        Cancelar
      </button>
      <button
        class="min-h-9 cursor-pointer rounded-md px-2 text-[10px] font-extrabold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main disabled:cursor-not-allowed disabled:opacity-55"
        :class="
          mode === 'replace'
            ? 'bg-main hover:bg-main-light'
            : 'bg-danger hover:bg-danger/90'
        "
        type="button"
        :aria-label="
          mode === 'replace'
            ? 'Confirmar reemplazo de zona'
            : 'Confirmar retiro de zona'
        "
        :disabled="mode === 'replace' ? !canReplace : !canRemove || submitting"
        @click="mode === 'replace' ? submitReplacement() : submitRemoval()"
      >
        {{
          submitting
            ? "Guardando…"
            : mode === "replace"
              ? "Confirmar reemplazo"
              : "Confirmar retiro"
        }}
      </button>
    </div>
  </section>
</template>
