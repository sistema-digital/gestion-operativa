<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Presentation,
  Trash2,
  X,
} from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import type {
  MeetingBatchDraftPayload,
  MeetingBatchItem,
} from "@/components/ratings/meetingBatch.types";

interface RatingLevel {
  puntuacion: number;
  etiqueta?: string | null;
}

const props = defineProps<{
  items: MeetingBatchItem[];
  levels: RatingLevel[];
  isSavingBySupervisor: Record<number, boolean>;
  errorBySupervisor: Record<number, string>;
  successBySupervisor: Record<number, string>;
}>();

const emit = defineEmits<{
  save: [payload: MeetingBatchDraftPayload];
  delete: [supervisorId: number];
}>();

const WEEKDAY_ORDER: Record<string, number> = {
  Lunes: 1,
  Martes: 2,
  Miercoles: 3,
  Jueves: 4,
  Viernes: 5,
};

const drafts = ref<
  Record<number, { puntuacion: number; observacionGerencia: string }>
>({});
const expandedBySupervisor = ref<Record<number, boolean>>({});

watch(
  () => props.items,
  (items) => {
    const nextDrafts: Record<
      number,
      { puntuacion: number; observacionGerencia: string }
    > = {};

    items.forEach((item) => {
      nextDrafts[item.supervisorId] = {
        puntuacion: item.currentMeetingScore ?? 1,
        observacionGerencia: item.managementObservation,
      };
    });

    drafts.value = nextDrafts;
  },
  { immediate: true },
);

const sortedItems = computed(() => {
  return [...props.items].sort((left, right) => {
    if (left.assignedMeetingWeekday !== right.assignedMeetingWeekday) {
      const leftOrder =
        WEEKDAY_ORDER[left.assignedMeetingWeekday] ?? Number.MAX_SAFE_INTEGER;
      const rightOrder =
        WEEKDAY_ORDER[right.assignedMeetingWeekday] ?? Number.MAX_SAFE_INTEGER;

      return leftOrder - rightOrder;
    }

    if (left.assignedMeetingTimeOrder !== right.assignedMeetingTimeOrder) {
      return left.assignedMeetingTimeOrder - right.assignedMeetingTimeOrder;
    }

    return left.supervisorName.localeCompare(right.supervisorName);
  });
});

const isSavingItem = (supervisorId: number): boolean =>
  Boolean(props.isSavingBySupervisor[supervisorId]);

const isItemDisabled = (item: MeetingBatchItem): boolean =>
  !item.inspectorId || isSavingItem(item.supervisorId);

const getAttendanceState = (item: MeetingBatchItem): 1 | 5 | null => {
  const draftScore = drafts.value[item.supervisorId]?.puntuacion;

  if (
    isSavingItem(item.supervisorId) &&
    (draftScore === 1 || draftScore === 5)
  ) {
    return draftScore;
  }

  if (item.currentMeetingScore === 1 || item.currentMeetingScore === 5) {
    return item.currentMeetingScore;
  }

  return null;
};

const isAttendanceSelected = (
  item: MeetingBatchItem,
  puntuacion: 1 | 5,
): boolean => getAttendanceState(item) === puntuacion;

const getMeetingStatusMessage = (item: MeetingBatchItem): string => {
  if (item.hasExistingMeeting) {
    if (isAttendanceSelected(item, 5)) {
      return "Supervisor asistió a reunión.";
    }

    if (isAttendanceSelected(item, 1)) {
      return "Supervisor no asistió a reunión.";
    }

    return "La reunión tiene una calificación detallada.";
  }

  return item.hasBaseInspection
    ? "Existe inspección base; se agregará la reunión."
    : "Se creará un registro exclusivo para la reunión.";
};

const toggleDetails = (supervisorId: number): void => {
  expandedBySupervisor.value = {
    ...expandedBySupervisor.value,
    [supervisorId]: !expandedBySupervisor.value[supervisorId],
  };
};

const updateDetailedScore = (
  supervisorId: number,
  puntuacion: number,
): void => {
  const draft = drafts.value[supervisorId];

  if (!draft) return;

  draft.puntuacion = puntuacion;
};

const saveItem = (supervisorId: number) => {
  const draft = drafts.value[supervisorId];

  if (!draft) return;

  emit("save", {
    supervisorId,
    puntuacion: draft.puntuacion,
    observacionGerencia: draft.observacionGerencia,
  });
};

const setAttendance = (item: MeetingBatchItem, puntuacion: 1 | 5): void => {
  if (isItemDisabled(item)) return;

  const draft = drafts.value[item.supervisorId];

  if (!draft) return;

  draft.puntuacion = puntuacion;
  saveItem(item.supervisorId);
};
</script>

<template>
  <section class="space-y-4">
    <div
      v-if="sortedItems.length === 0"
      class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500"
    >
      No hay supervisores con día asignado para mostrar en este batch.
    </div>

    <article
      v-for="item in sortedItems"
      :key="item.supervisorId"
      class="overflow-hidden rounded-3xl border border-stone-300 bg-white shadow-sm"
    >
      <div
        class="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h3
              class="text-base font-extrabold tracking-tight text-gray-950 sm:text-lg"
            >
              {{ item.supervisorName }}
            </h3>
            <span
              class="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800"
            >
              {{ item.assignedMeetingWeekday }}
            </span>
          </div>
          <p class="mt-1 text-sm text-gray-500">
            Reunión programada: {{ item.meetingDate }} ·
            {{ item.assignedMeetingTime }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            class="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:text-sm"
            :class="
              isAttendanceSelected(item, 5)
                ? 'border-emerald-700 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                : 'border-stone-300 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-50'
            "
            :disabled="isItemDisabled(item)"
            @click="setAttendance(item, 5)"
          >
            <Check class="h-4 w-4" />
            Asistió<span v-if="isAttendanceSelected(item, 5)"> · 5</span>
          </button>

          <button
            type="button"
            class="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:text-sm"
            :class="
              isAttendanceSelected(item, 1)
                ? 'border-rose-400 bg-rose-50 text-rose-700 hover:bg-rose-100'
                : 'border-stone-300 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-50'
            "
            :disabled="isItemDisabled(item)"
            @click="setAttendance(item, 1)"
          >
            <X class="h-4 w-4" />
            No asistió
          </button>

          <button
            type="button"
            class="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-800 transition-colors hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            :aria-expanded="Boolean(expandedBySupervisor[item.supervisorId])"
            :aria-controls="`meeting-details-${item.supervisorId}`"
            @click="toggleDetails(item.supervisorId)"
          >
            Ver detalle
            <ChevronDown
              class="h-4 w-4 transition-transform"
              :class="{ 'rotate-180': expandedBySupervisor[item.supervisorId] }"
            />
          </button>

          <button
            v-if="item.hasExistingMeeting"
            type="button"
            class="inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-xl border border-rose-300 bg-white p-2 text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isItemDisabled(item)"
            aria-label="Eliminar calificación"
            title="Eliminar calificación"
            @click="emit('delete', item.supervisorId)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        v-if="expandedBySupervisor[item.supervisorId]"
        :id="`meeting-details-${item.supervisorId}`"
        class="space-y-4 border-t border-gray-100 bg-white p-3 sm:p-4"
      >
        <div class="grid gap-3 md:grid-cols-2">
          <div class="rounded-xl border border-gray-200 bg-white px-3 py-2">
            <p
              class="text-[10px] font-bold uppercase tracking-widest text-gray-500"
            >
              Fecha de reunión
            </p>
            <p class="mt-1 text-sm font-semibold text-gray-900">
              {{ item.meetingDate }}
              · {{ item.assignedMeetingTime }}
            </p>
          </div>
          <div
            v-if="item.currentMeetingScore !== null"
            class="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2"
          >
            <p
              class="text-[10px] font-bold uppercase tracking-widest text-violet-700"
            >
              Calificación vigente
            </p>
            <p class="mt-1 text-sm font-semibold text-violet-950">
              {{ item.currentMeetingScore }} / 5
            </p>
            <p class="mt-1 text-[11px] leading-relaxed text-violet-700">
              La asistencia rápida usa únicamente 1 o 5.
            </p>
          </div>
          <div
            class="rounded-xl border border-gray-200 bg-white px-3 py-2 md:col-span-2"
          >
            <p
              class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500"
            >
              <Presentation class="h-3.5 w-3.5" />
              Inspector base
            </p>
            <p class="mt-1 text-sm font-semibold text-gray-900">
              {{ item.inspectorName || "Sin inspector registrado" }}
            </p>
          </div>
        </div>

        <div
          class="rounded-xl border px-3 py-2 text-sm"
          :class="
            item.hasBaseInspection
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-sky-200 bg-sky-50 text-sky-700'
          "
        >
          <p class="flex items-center gap-2 font-semibold">
            <CalendarDays class="h-4 w-4" />
            {{ getMeetingStatusMessage(item) }}
          </p>
        </div>

        <div class="rounded-xl border border-gray-200 bg-white px-3 py-3">
          <p
            class="text-[10px] font-bold uppercase tracking-widest text-gray-500"
          >
            Observación del supervisor
          </p>
          <p class="mt-2 whitespace-pre-wrap text-sm text-gray-700">
            {{ item.supervisorObservation || "Sin observación" }}
          </p>
        </div>

        <div class="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p
                class="text-[10px] font-bold uppercase tracking-widest text-amber-700"
              >
                Asistencia a reunión
              </p>
              <p class="mt-1 text-xs text-amber-900/80">
                Ajusta la puntuación cuando necesites una evaluación detallada.
              </p>
            </div>
            <p
              class="rounded-lg bg-white px-3 py-2 text-sm font-bold text-amber-900"
            >
              {{ drafts[item.supervisorId]?.puntuacion ?? 1 }} / 5
            </p>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="level in levels"
              :key="level.puntuacion"
              type="button"
              class="h-9 w-9 cursor-pointer rounded-lg border text-xs font-bold transition-colors disabled:cursor-not-allowed"
              :class="
                drafts[item.supervisorId]?.puntuacion === level.puntuacion
                  ? 'border-amber-300 bg-amber-200 text-amber-900'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-amber-200 hover:text-amber-700'
              "
              :disabled="isItemDisabled(item)"
              :aria-label="`Calificar con ${level.puntuacion} puntos`"
              @click="updateDetailedScore(item.supervisorId, level.puntuacion)"
            >
              {{ level.puntuacion }}
            </button>
          </div>

          <div class="mt-4">
            <label
              class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-amber-700"
            >
              Observación de gerencia
            </label>
            <textarea
              v-model="drafts[item.supervisorId].observacionGerencia"
              rows="4"
              :disabled="
                !item.inspectorId || !!isSavingBySupervisor[item.supervisorId]
              "
              placeholder="Agregar observación reservada de gerencia..."
              class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>

          <div
            v-if="errorBySupervisor[item.supervisorId]"
            class="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700"
          >
            {{ errorBySupervisor[item.supervisorId] }}
          </div>

          <div
            v-if="successBySupervisor[item.supervisorId]"
            class="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700"
          >
            {{ successBySupervisor[item.supervisorId] }}
          </div>

          <div class="mt-4 flex justify-end">
            <BaseButton
              variant="primary"
              :disabled="
                !item.inspectorId || !!isSavingBySupervisor[item.supervisorId]
              "
              @click="saveItem(item.supervisorId)"
            >
              {{
                isSavingBySupervisor[item.supervisorId]
                  ? "Guardando..."
                  : item.hasExistingMeeting
                    ? "Actualizar reunión"
                    : "Crear reunión"
              }}
            </BaseButton>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>
