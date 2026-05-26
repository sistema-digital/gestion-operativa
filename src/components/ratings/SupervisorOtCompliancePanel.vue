<script setup lang="ts">
import { computed } from 'vue';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  ShieldCheck,
  TimerReset,
} from 'lucide-vue-next';
import BaseToggle from '@/components/BaseToggle.vue';
import type {
  PuntuacionSupervisorOtArea,
  PuntuacionSupervisorOtOrden,
  PuntuacionSupervisorOtResumen,
} from '@/stores/ratingsStore.types';

type PanelMode = 'panel' | 'toggle';
type ScoreTone = 'success' | 'warning' | 'danger' | 'neutral';

interface MecanicoGrupo {
  key: string;
  nombre: string;
  total: number;
  aTiempo: number;
  ots: PuntuacionSupervisorOtOrden[];
}

const props = withDefaults(defineProps<{
  area: PuntuacionSupervisorOtArea | null;
  fecha: string;
  isLoading: boolean;
  error: string | null;
  mode?: PanelMode;
}>(), {
  mode: 'panel',
});

const resumenVacio: PuntuacionSupervisorOtResumen = {
  total: 0,
  a_tiempo: 0,
  fuera_de_tiempo: 0,
  sin_historial: 0,
  porcentaje: 0,
  puntuacion: null,
  etiqueta: 'SIN_OT',
};

const resumen = computed(() => props.area?.resumen ?? resumenVacio);

const scoreTone = computed<ScoreTone>(() => {
  const score = resumen.value.puntuacion;

  if (score === null) return 'neutral';
  if (score >= 5) return 'success';
  if (score >= 3) return 'warning';
  return 'danger';
});

const scoreBadgeClass = computed(() => {
  const classes: Record<ScoreTone, string> = {
    success: '!bg-emerald-50 !text-emerald-700 border !border-emerald-200',
    warning: '!bg-amber-50 !text-amber-700 border !border-amber-200',
    danger: '!bg-rose-50 !text-rose-700 border !border-rose-200',
    neutral: '!bg-gray-50 !text-gray-500 border !border-gray-200',
  };

  return classes[scoreTone.value];
});

const progressClass = computed(() => {
  const classes: Record<ScoreTone, string> = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    neutral: 'bg-gray-300',
  };

  return classes[scoreTone.value];
});

const progressWidth = computed(() => `${Math.min(Math.max(resumen.value.porcentaje, 0), 100)}%`);

const metricas = computed(() => [
  {
    label: 'Total OT',
    value: resumen.value.total,
    icon: ClipboardCheck,
    className: 'text-slate-700 bg-slate-50 border-slate-100',
  },
  {
    label: 'A Tiempo',
    value: resumen.value.a_tiempo,
    icon: CheckCircle2,
    className: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  },
  {
    label: 'Gestionadas Tarde',
    value: resumen.value.fuera_de_tiempo,
    icon: TimerReset,
    className: 'text-amber-700 bg-amber-50 border-amber-100',
  },
  {
    label: 'Sin Historial',
    value: resumen.value.sin_historial,
    icon: AlertCircle,
    className: 'text-violet-700 bg-violet-50 border-violet-100',
  },
  {
    label: 'Hora de Corte',
    value: '23:30',
    icon: Clock3,
    className: 'text-cyan-700 bg-cyan-50 border-cyan-100',
  },
]);

const mecanicos = computed<MecanicoGrupo[]>(() => {
  const grouped = new Map<string, MecanicoGrupo>();

  props.area?.ots.forEach((ot) => {
    const key = String(ot.mecanico.id ?? ot.mecanico.nombre ?? 'sin-mecanico');
    const current = grouped.get(key);

    if (current) {
      current.total += 1;
      current.aTiempo += ot.cumplimiento.a_tiempo ? 1 : 0;
      current.ots.push(ot);
      return;
    }

    grouped.set(key, {
      key,
      nombre: ot.mecanico.nombre || 'Sin mecánico',
      total: 1,
      aTiempo: ot.cumplimiento.a_tiempo ? 1 : 0,
      ots: [ot],
    });
  });

  return Array.from(grouped.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
});

const titleExtra = computed(() => {
  const score = resumen.value.puntuacion;

  if (score === null) return 'Sin nota';
  return `${score} / 5`;
});

const casoLabel = (caso: string) => {
  const labels: Record<string, string> = {
    CUMPLIO_MODIFICADO_DESPUES: 'Cumplió, modificado después',
    CUMPLIO_A_TIEMPO: 'A tiempo',
    GESTIONADO_TARDE: 'Gestionado tarde',
    SIN_HISTORIAL: 'Sin historial',
  };

  return labels[caso] || caso;
};

const estadoClass = (aTiempo: boolean) => (
  aTiempo
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : 'bg-rose-50 text-rose-700 border-rose-100'
);

const mechanicComplianceBadgeClass = (aTiempo: number, total: number) => {
  if (total <= 0) return '!bg-gray-50 !text-gray-500 border !border-gray-200';

  const percentage = (aTiempo / total) * 100;

  if (percentage <= 33) return '!bg-rose-50 !text-rose-700 border !border-rose-200';
  if (percentage <= 70) return '!bg-amber-50 !text-amber-700 border !border-amber-200';

  return '!bg-emerald-50 !text-emerald-700 border !border-emerald-200';
};

const getPanamaDateKey = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Panama',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value || '';

  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
};

const getOtDescripcion = (ot: PuntuacionSupervisorOtOrden) => {
  const descripcion = ot.origen.descripcion?.trim();

  if (descripcion) return descripcion;
  return ot.origen.id || 'Sin descripción';
};

const getOtFechaHora = (ot: PuntuacionSupervisorOtOrden) => (
  ot.actualizaciones[0]?.fecha_hora
  || ot.cumplimiento.primer_movimiento?.fecha_hora
  || null
);

const formatFechaHora = (value: string | null) => {
  if (!value) return '--';

  const [datePart, timePart = ''] = value.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);

  if (!year || !month || !day) return value;

  const todayKey = getPanamaDateKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getPanamaDateKey(yesterday);
  const time = timePart.slice(0, 5);

  if (datePart === todayKey) return `Hoy ${time}`;
  if (datePart === yesterdayKey) return `Ayer ${time}`;

  return time ? `${datePart} ${time}` : datePart;
};
</script>

<template>
  <BaseToggle
    v-if="mode === 'toggle'"
    title="Cumplimiento de Cierre de Jornada"
    :extra="titleExtra"
    :extra-class="scoreBadgeClass"
    :initiallyOpen="false"
    class="border-cyan-200 ring-1 ring-cyan-100 bg-cyan-50/40 shadow-sm"
  >
    <div class="px-2 py-3">
      <div class="compliance-card compliance-card--flat">
        <slot name="content" />
        <div class="compliance-content">
          <div v-if="isLoading" class="compliance-state">
            <Loader2 class="h-5 w-5 animate-spin text-main" aria-hidden="true" />
            <span>Cargando cumplimiento…</span>
          </div>
          <div v-else-if="error" class="compliance-state compliance-state--error">
            <AlertCircle class="h-5 w-5" aria-hidden="true" />
            <span>{{ error }}</span>
          </div>
          <div v-else-if="!area" class="compliance-state">
            <ShieldCheck class="h-5 w-5 text-gray-300" aria-hidden="true" />
            <span>No hay cumplimiento OT para este supervisor en la fecha seleccionada.</span>
          </div>
          <template v-else>
            <div class="compliance-summary">
              <div v-for="metrica in metricas" :key="metrica.label" class="metric-card" :class="metrica.className">
                <component :is="metrica.icon" class="h-4 w-4" aria-hidden="true" />
                <span>{{ metrica.label }}</span>
                <strong>{{ metrica.value }}</strong>
              </div>
            </div>

            <div class="mechanic-list">
              <BaseToggle
                v-for="mecanico in mecanicos"
                :key="mecanico.key"
                :title="mecanico.nombre"
                :extra="`${mecanico.aTiempo}/${mecanico.total} a tiempo`"
                :extra-class="mechanicComplianceBadgeClass(mecanico.aTiempo, mecanico.total)"
                :initiallyOpen="false"
                class="border-gray-100 bg-white shadow-sm"
              >
                <div class="record-list">
                  <article v-for="ot in mecanico.ots" :key="ot.id" class="record-row">
                    <div class="min-w-0">
                      <p class="record-title">{{ getOtDescripcion(ot) }}</p>
                      <p class="record-update">
                        {{ ot.estado_actual || 'Sin estado' }} · {{ formatFechaHora(getOtFechaHora(ot)) }}
                      </p>
                    </div>
                    <span class="record-status" :class="estadoClass(ot.cumplimiento.a_tiempo)">
                      {{ casoLabel(ot.cumplimiento.caso) }}
                    </span>
                  </article>
                </div>
              </BaseToggle>
            </div>
          </template>
        </div>
      </div>
    </div>
  </BaseToggle>

  <aside v-else class="compliance-card" aria-label="Cumplimiento de cierre de jornada">
    <header class="compliance-header">
      <div class="compliance-brand">
        <div class="compliance-icon">
          <ShieldCheck class="h-6 w-6" aria-hidden="true" />
        </div>
        <div class="min-w-0">
          <h4>Cumplimiento de Cierre de Jornada</h4>
          <p>{{ area?.supervisor.nombre || 'Seleccione un supervisor' }}</p>
        </div>
      </div>
      <div class="score-badge" :class="scoreBadgeClass">
        <span>Puntaje</span>
        <strong>{{ titleExtra }}</strong>
      </div>
    </header>

    <div class="progress-track" aria-hidden="true">
      <div class="progress-fill" :class="progressClass" :style="{ width: progressWidth }" />
    </div>

    <div v-if="isLoading" class="compliance-state">
      <Loader2 class="h-5 w-5 animate-spin text-main" aria-hidden="true" />
      <span>Cargando cumplimiento…</span>
    </div>
    <div v-else-if="error" class="compliance-state compliance-state--error">
      <AlertCircle class="h-5 w-5" aria-hidden="true" />
      <span>{{ error }}</span>
    </div>
    <div v-else-if="!area" class="compliance-state">
      <RefreshCw class="h-5 w-5 text-gray-300" aria-hidden="true" />
      <span>Al seleccionar supervisor se mostrarán los registros OT de {{ fecha }}.</span>
    </div>
    <template v-else>
      <div class="compliance-summary">
        <div v-for="metrica in metricas" :key="metrica.label" class="metric-card" :class="metrica.className">
          <component :is="metrica.icon" class="h-4 w-4" aria-hidden="true" />
          <span>{{ metrica.label }}</span>
          <strong>{{ metrica.value }}</strong>
        </div>
      </div>

      <section class="mechanic-section" aria-label="Listado de OT por mecánico">
        <div class="section-title">
          <span>Listado de OT</span>
          <small>{{ mecanicos.length }} mecánicos</small>
        </div>

        <div v-if="mecanicos.length === 0" class="empty-records">
          No hay registros para desplegar.
        </div>
        <div v-else class="mechanic-list">
          <BaseToggle
            v-for="mecanico in mecanicos"
            :key="mecanico.key"
            :title="mecanico.nombre"
            :extra="`${mecanico.aTiempo}/${mecanico.total} a tiempo`"
            :extra-class="mechanicComplianceBadgeClass(mecanico.aTiempo, mecanico.total)"
            :initiallyOpen="false"
            class="border-gray-100 bg-white shadow-sm"
          >
            <div class="record-list">
              <article v-for="ot in mecanico.ots" :key="ot.id" class="record-row">
                <div class="min-w-0">
                  <p class="record-title">{{ getOtDescripcion(ot) }}</p>
                  <p class="record-meta">
                    {{ ot.estado_actual || 'Sin estado' }}
                  </p>
                  <p class="record-update">
                    Última actualización {{ formatFechaHora(getOtFechaHora(ot)) }}
                  </p>
                </div>
                <span class="record-status" :class="estadoClass(ot.cumplimiento.a_tiempo)">
                  {{ casoLabel(ot.cumplimiento.caso) }}
                </span>
              </article>
            </div>
          </BaseToggle>
        </div>
      </section>
    </template>
  </aside>
</template>

<style scoped>
.compliance-card {
  border: 1px solid rgb(226 232 240);
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgb(255 255 255), rgb(248 250 252)),
    radial-gradient(circle at 15% 10%, rgb(6 182 212 / 0.08), transparent 34%);
  box-shadow: 0 18px 45px rgb(15 23 42 / 0.08);
  overflow: hidden;
}

.compliance-card--flat {
  border-radius: 12px;
  box-shadow: none;
}

.compliance-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
}

.compliance-brand {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.compliance-icon {
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 14px;
  color: rgb(15 118 110);
  background: linear-gradient(145deg, rgb(204 251 241), rgb(240 253 250));
  border: 1px solid rgb(153 246 228);
}

.compliance-kicker,
.section-title span {
  color: rgb(100 116 139);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

.compliance-header h4 {
  margin: 2px 0;
  color: rgb(15 23 42);
  font-size: 15px;
  font-weight: 900;
  text-wrap: balance;
}

.compliance-header p {
  color: rgb(71 85 105);
  font-size: 12px;
  line-height: 1.35;
}

.score-badge {
  display: flex;
  min-width: 78px;
  flex-direction: column;
  align-items: center;
  border: 1px solid;
  border-radius: 14px;
  padding: 8px 10px;
  text-align: center;
}

.score-badge span {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
}

.score-badge strong {
  font-variant-numeric: tabular-nums;
  font-size: 18px;
  line-height: 1.1;
}

.progress-track {
  height: 6px;
  margin: 0 18px 18px;
  overflow: hidden;
  border-radius: 999px;
  background: rgb(226 232 240);
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 220ms ease-out;
}

.compliance-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 130px;
  padding: 20px;
  color: rgb(100 116 139);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.compliance-state--error {
  color: rgb(190 18 60);
}

.compliance-summary {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  padding: 0 18px 18px;
}

.metric-card {
  display: flex;
  min-height: 76px;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid;
  border-radius: 12px;
  padding: 10px;
}

.metric-card span {
  color: currentColor;
  font-size: 9px;
  font-weight: 800;
  line-height: 1.15;
  opacity: 0.72;
}

.metric-card strong {
  font-variant-numeric: tabular-nums;
  font-size: 18px;
  line-height: 1;
}

.mechanic-section {
  padding: 0 18px 18px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.section-title small {
  color: rgb(148 163 184);
  font-size: 11px;
  font-weight: 700;
}

.mechanic-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 4px 4px;
}

.record-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid rgb(241 245 249);
  border-radius: 12px;
  background: rgb(248 250 252);
  padding: 10px;
}

.record-title {
  overflow-wrap: anywhere;
  color: rgb(15 23 42);
  font-size: 12px;
  font-weight: 900;
}

.record-meta,
.record-update {
  color: rgb(100 116 139);
  font-size: 11px;
  line-height: 1.35;
}

.record-update {
  margin-top: 3px;
  color: rgb(148 163 184);
}

.record-status {
  flex: 0 0 auto;
  max-width: 132px;
  border: 1px solid;
  border-radius: 999px;
  padding: 5px 8px;
  font-size: 10px;
  font-weight: 900;
  line-height: 1.1;
  text-align: center;
}

.empty-records {
  border: 1px dashed rgb(203 213 225);
  border-radius: 12px;
  padding: 18px;
  color: rgb(148 163 184);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

@media (max-width: 767px) {
  .compliance-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .metric-card:last-child {
    grid-column: span 2;
  }

  .record-row {
    flex-direction: column;
  }

  .record-status {
    max-width: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .progress-fill {
    transition: none;
  }
}
</style>
