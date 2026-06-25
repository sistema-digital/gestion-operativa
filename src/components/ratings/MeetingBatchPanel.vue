<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { CalendarDays, Presentation } from 'lucide-vue-next';
import BaseButton from '@/components/BaseButton.vue';
import BaseToggle from '@/components/BaseToggle.vue';
import type {
  MeetingBatchDraftPayload,
  MeetingBatchItem,
} from '@/components/ratings/meetingBatch.types';

interface RatingLevel {
  puntuacion: number;
  etiqueta?: string | null;
}

const props = defineProps<{
  items: MeetingBatchItem[];
  levels: RatingLevel[];
  isSavingBySupervisor: Record<number, boolean>;
  errorBySupervisor: Record<number, string>;
  rangeLabel: string;
}>();

const emit = defineEmits<{
  save: [payload: MeetingBatchDraftPayload];
}>();

const WEEKDAY_ORDER: Record<string, number> = {
  Lunes: 1,
  Martes: 2,
  Miercoles: 3,
  Jueves: 4,
  Viernes: 5,
};

const drafts = ref<Record<number, { puntuacion: number; observacionGerencia: string }>>({});

watch(
  () => props.items,
  (items) => {
    const nextDrafts: Record<number, { puntuacion: number; observacionGerencia: string }> = {};

    items.forEach((item) => {
      const fallbackScore = props.levels.at(-1)?.puntuacion ?? 5;
      nextDrafts[item.supervisorId] = {
        puntuacion: item.currentMeetingScore ?? fallbackScore,
        observacionGerencia: item.managementObservation,
      };
    });

    drafts.value = nextDrafts;
  },
  { immediate: true }
);

const sortedItems = computed(() => {
  return [...props.items].sort((left, right) => {
    if (left.assignedMeetingWeekday !== right.assignedMeetingWeekday) {
      const leftOrder = WEEKDAY_ORDER[left.assignedMeetingWeekday] ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = WEEKDAY_ORDER[right.assignedMeetingWeekday] ?? Number.MAX_SAFE_INTEGER;

      return leftOrder - rightOrder;
    }

    return left.supervisorName.localeCompare(right.supervisorName);
  });
});

const updateScore = (supervisorId: number, puntuacion: number) => {
  if (!drafts.value[supervisorId]) return;
  drafts.value[supervisorId].puntuacion = puntuacion;
};

const saveItem = (supervisorId: number) => {
  const draft = drafts.value[supervisorId];

  if (!draft) return;

  emit('save', {
    supervisorId,
    puntuacion: draft.puntuacion,
    observacionGerencia: draft.observacionGerencia,
  });
};
</script>

<template>
  <section class="space-y-4">
    <div class="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
      <p class="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-700">Batch semanal de reunión</p>
      <p class="mt-1 text-sm text-gray-700">
        {{ rangeLabel }}. 
      </p>
    </div>

    <div v-if="sortedItems.length === 0" class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
      No hay supervisores con día asignado para mostrar en este batch.
    </div>

    <BaseToggle
      v-for="item in sortedItems"
      :key="item.supervisorId"
      :title="item.supervisorName"
      :extra="item.assignedMeetingWeekday"
      extra-class="!bg-amber-100 !text-amber-800"
    >
      <div class="space-y-4">
        <div class="grid gap-3 md:grid-cols-2">
          <div class="rounded-xl border border-gray-200 bg-white px-3 py-2">
            <p class="text-[10px] font-bold uppercase tracking-widest text-gray-500">Fecha evaluada</p>
            <p class="mt-1 text-sm font-semibold text-gray-900">
              {{ item.evaluatedDate || 'Pendiente' }}
            </p>
          </div>
          <div class="rounded-xl border border-gray-200 bg-white px-3 py-2">
            <p class="text-[10px] font-bold uppercase tracking-widest text-gray-500">Puntuación actual</p>
            <p class="mt-1 text-sm font-semibold text-gray-900">
              {{ item.currentMeetingScore ?? 'Sin registro' }}
            </p>
          </div>
          <div class="rounded-xl border border-gray-200 bg-white px-3 py-2 md:col-span-2">
            <p class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              <Presentation class="h-3.5 w-3.5" />
              Inspector base
            </p>
            <p class="mt-1 text-sm font-semibold text-gray-900">{{ item.inspectorName || 'Sin inspector registrado' }}</p>
          </div>
        </div>

        <div
          class="rounded-xl border px-3 py-2 text-sm"
          :class="item.hasBaseInspection ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-700'"
        >
          <p class="flex items-center gap-2 font-semibold">
            <CalendarDays class="h-4 w-4" />
            {{ item.hasExistingMeeting ? 'Supervisor asistio a reunión' : (item.hasBaseInspection ? 'Existe inspección base; se puede crear la reunión desde este batch.' : 'No existe inspección base disponible para crear la reunión.') }}
          </p>
        </div>

        <div class="rounded-xl border border-gray-200 bg-white px-3 py-3">
          <p class="text-[10px] font-bold uppercase tracking-widest text-gray-500">Observación del supervisor</p>
          <p class="mt-2 whitespace-pre-wrap text-sm text-gray-700">
            {{ item.supervisorObservation || 'Sin observación' }}
          </p>
        </div>

        <div class="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-widest text-amber-700">Ajuste final de gerencia</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <button
                v-for="level in levels"
                :key="level.puntuacion"
                type="button"
                class="h-10 w-10 rounded-lg border text-sm font-bold transition-colors"
                :class="drafts[item.supervisorId]?.puntuacion === level.puntuacion
                  ? 'border-amber-300 bg-amber-200 text-amber-900'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-amber-200 hover:text-amber-700'"
                :disabled="!item.hasBaseInspection || !!isSavingBySupervisor[item.supervisorId]"
                @click="updateScore(item.supervisorId, level.puntuacion)"
              >
                {{ level.puntuacion }}
              </button>
            </div>
          </div>

          <div class="mt-4">
            <label class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-amber-700">
              Observación de gerencia
            </label>
            <textarea
              v-model="drafts[item.supervisorId].observacionGerencia"
              rows="4"
              :disabled="!item.hasBaseInspection || !!isSavingBySupervisor[item.supervisorId]"
              placeholder="Agregar observación reservada de gerencia..."
              class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
            <p class="mt-1 text-[11px] text-gray-500">
              Si lo dejas vacío, no se crea bloque `gerencia`. Si ya existía y lo borras, se elimina solo ese subbloque.
            </p>
          </div>

          <div v-if="errorBySupervisor[item.supervisorId]" class="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">
            {{ errorBySupervisor[item.supervisorId] }}
          </div>

          <div class="mt-4 flex justify-end">
            <BaseButton
              variant="primary"
              :disabled="!item.hasBaseInspection || !!isSavingBySupervisor[item.supervisorId]"
              @click="saveItem(item.supervisorId)"
            >
              {{ isSavingBySupervisor[item.supervisorId] ? 'Guardando...' : (item.hasExistingMeeting ? 'Actualizar reunión' : 'Crear reunión') }}
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseToggle>
  </section>
</template>
