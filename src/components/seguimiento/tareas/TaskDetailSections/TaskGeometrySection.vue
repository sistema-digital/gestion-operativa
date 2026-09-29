<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";
import { Crosshair, MapPin, Pencil } from "lucide-vue-next";
import TaskControlZoneEditor from "./TaskControlZoneEditor.vue";
import TaskZoneDetailCard from "./TaskZoneDetailCard.vue";
import type { SeguimientoCoordinates } from "@/seguimiento/shared/seguimiento.types";
import type {
  TareaRastreoCambioZonaControl,
  TareaRastreoZonaDetalleDto,
  TareaSeguimientoDetail,
} from "@/stores/seguimiento/tareas/tareasSeguimiento.types";

type ControlZoneEditorMode = "remove" | "replace";

const props = defineProps<{
  task: TareaSeguimientoDetail;
  editingControlZoneId?: string | null;
  updatingControlZones?: boolean;
}>();
const emit = defineEmits<{
  focus: [coordinates: SeguimientoCoordinates | null];
  beginControlZoneEdit: [zoneId: string];
  beginControlZoneGeometryEdit: [zoneId: string];
  cancelControlZoneEdit: [];
  updateControlZones: [changes: TareaRastreoCambioZonaControl[]];
}>();
const editorMode = shallowRef<ControlZoneEditorMode | null>(null);
const routePoint = computed(() => {
  const point = props.task.routePoint;
  return point &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude)
    ? point
    : null;
});
const focusPoint = computed(
  () => routePoint.value ?? props.task.visualLocation,
);
const pointLabel = computed(() =>
  focusPoint.value
    ? `${focusPoint.value.latitude.toFixed(5)}, ${focusPoint.value.longitude.toFixed(5)}`
    : "Sin ubicación disponible",
);
const controlZoneCount = computed(() => props.task.controlZones?.length ?? 0);
const permanenceZoneCount = computed(() => props.task.permanenceZones.length);
const zoneDetails = computed(() => props.task.zoneDetails);
const canEditControlZones = computed(
  () =>
    props.task.type !== "duda" &&
    props.task.permissions.puede_editar_geometria_control,
);
const selectedControlZone = computed(
  () =>
    props.task.controlZoneReferences.find(
      (zone) => zone.id === props.editingControlZoneId,
    ) ?? null,
);
const selectedZoneDetail = computed<TareaRastreoZonaDetalleDto | null>(
  () =>
    zoneDetails.value.find(
      (zone) => zone.id === selectedControlZone.value?.id,
    ) ?? null,
);

function openControlZoneEditor(
  zoneId: string,
  mode: ControlZoneEditorMode,
): void {
  if (!canEditControlZones.value) return;
  editorMode.value = mode;
  emit("beginControlZoneEdit", zoneId);
}

function beginControlZoneGeometryEdit(zoneId: string): void {
  const zoneDetail = zoneDetails.value.find((zone) => zone.id === zoneId);
  const hasVisitHistory =
    Boolean(zoneDetail?.visitas.length) ||
    (zoneDetail?.tiempo.cantidad_visitas ?? 0) > 0;
  if (!canEditControlZones.value || hasVisitHistory) return;
  editorMode.value = null;
  emit("beginControlZoneGeometryEdit", zoneId);
}

function closeControlZoneEditor(): void {
  if (props.updatingControlZones) return;
  editorMode.value = null;
  emit("cancelControlZoneEdit");
}

function submitControlZoneChanges(
  changes: TareaRastreoCambioZonaControl[],
): void {
  emit("updateControlZones", changes);
}

watch(
  () => props.editingControlZoneId,
  (zoneId) => {
    if (zoneId) return;
    editorMode.value = null;
  },
);
</script>

<template>
  <section class="rounded-[10px] border border-slate-100 bg-white p-3">
    <h3 class="text-[11px] font-extrabold text-main">Ubicación y geometría</h3>
    <div class="mt-3 grid gap-2">
      <div class="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-[10px] font-extrabold text-slate-700">
              {{ routePoint ? "Punto de enrutado" : "Ubicación detectada" }}
            </p>
            <p class="mt-0.5 font-mono text-[9px] text-slate-500">
              {{ pointLabel }}
            </p>
          </div>
          <button
            v-if="focusPoint"
            class="grid size-8 cursor-pointer place-items-center rounded-md text-main hover:bg-second focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
            type="button"
            aria-label="Enfocar ubicación de la tarea"
            @click="emit('focus', focusPoint)"
          >
            <Crosshair class="size-4" />
          </button>
        </div>
        <div
          v-if="task.type !== 'duda' && zoneDetails.length"
          class="mt-2 grid gap-2"
        >
          <TaskZoneDetailCard
            v-for="(zone, index) in zoneDetails"
            :key="zone.id"
            :zone="zone"
            :index="index"
            :editable="canEditControlZones"
            :can-remove="controlZoneCount > 1"
            :submitting="updatingControlZones"
            @edit-geometry="beginControlZoneGeometryEdit"
            @remove="openControlZoneEditor($event, 'remove')"
            @replace="openControlZoneEditor($event, 'replace')"
          />
          <section
            v-if="selectedControlZone && !editorMode"
            class="flex items-start gap-2 rounded-lg border border-main/20 bg-second/45 p-2.5"
            aria-label="Edición de geometría activa"
          >
            <Pencil
              class="mt-0.5 size-4 shrink-0 text-main"
              aria-hidden="true"
            />
            <div class="min-w-0 flex-1">
              <p class="text-[10px] font-extrabold text-slate-800">
                Editando geometría
              </p>
              <p class="mt-0.5 text-[9px] leading-4 text-slate-600">
                Arrastra o agrega vértices en el mapa. Al soltar un vértice se
                guardará la geometría actualizada.
              </p>
            </div>
            <button
              class="min-h-8 cursor-pointer rounded-md border border-slate-300 bg-white px-2 text-[9px] font-extrabold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
              type="button"
              :disabled="updatingControlZones"
              @click="closeControlZoneEditor"
            >
              Cancelar
            </button>
          </section>
          <TaskControlZoneEditor
            v-if="selectedControlZone && editorMode"
            :mode="editorMode"
            :zone="selectedControlZone"
            :zone-detail="selectedZoneDetail"
            :replacement-zones="task.controlZoneReferences"
            :control-zone-count="controlZoneCount"
            :submitting="Boolean(updatingControlZones)"
            @cancel="closeControlZoneEditor"
            @submit="submitControlZoneChanges"
          />
        </div>
      </div>
      <div
        v-if="task.type === 'duda'"
        class="rounded-lg border border-warning/20 bg-warning-bg/45 p-2.5"
      >
        <p class="text-[10px] font-extrabold text-warning">
          Zona de permanencia detectada
        </p>
        <p class="mt-0.5 text-[9px] text-slate-500">
          {{
            permanenceZoneCount
              ? `${permanenceZoneCount} ${permanenceZoneCount === 1 ? "zona" : "zonas"} detectada(s)`
              : "Sin zona de permanencia disponible"
          }}
        </p>
      </div>
      <div class="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
        <p class="text-[10px] font-extrabold text-slate-700">
          Línea de control
        </p>
        <p class="mt-0.5 text-[9px] text-slate-500">
          {{
            task.controlLine
              ? `${task.controlLine.coordinates.flat().length} puntos de control`
              : "No definida"
          }}
        </p>
      </div>
      <div class="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
        <div class="flex items-center gap-2">
          <MapPin class="size-4 text-main" />
          <div>
            <p class="text-[10px] font-extrabold text-slate-700">
              Zonas asociadas
            </p>
            <p class="mt-0.5 text-[9px] text-slate-500">
              {{
                controlZoneCount
                  ? `${controlZoneCount} ${controlZoneCount === 1 ? "zona" : "zonas"} de control`
                  : "Sin zonas asociadas"
              }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
