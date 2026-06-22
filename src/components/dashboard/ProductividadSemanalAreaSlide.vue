<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  Forklift,
  MapPin,
  Tractor,
  UserRound,
} from 'lucide-vue-next';
import type {
  ProductividadSemanalArea,
  ProductividadSemanalEquipo,
} from '@/stores/horasTrabajo.types';
import type { ProductividadDashboardTableItem } from '@/stores/productividadSemanalDashboard.types';
import { useUsageOrdenesActividadUsuariosStore } from '@/stores/db_mantenimiento/usage_ordenes_actividad_usuarios/usageOrdenesActividadUsuarios.store';
import { formatPanamaDateTime } from '@/utils/dateUtils';

const props = defineProps<{
  area: ProductividadSemanalArea;
  semana: string;
  dashboardTables?: ProductividadDashboardTableItem[];
  availableAreas?: ProductividadSemanalArea[];
}>();
const emit = defineEmits<{
  selectArea: [area: ProductividadSemanalArea];
}>();

const usageOrdenesActividadUsuariosStore = useUsageOrdenesActividadUsuariosStore();

const normalizeAreaKey = (value: string) => String(value || '')
  .trim()
  .toUpperCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const formatAreaName = (value: string) => String(value || '')
  .trim()
  .toLowerCase()
  .split(/\s+/)
  .filter(Boolean)
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

const formatHours = (value: number | null | undefined) => {
  const hours = Number(value || 0);
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
};

const equipmentDescription = (equipment: ProductividadSemanalEquipo) => (
  equipment.descripcion?.trim() || 'Sin descripción registrada.'
);

const restoParrafo = computed(() => {
  const parrafo = props.area.resto?.parrafo?.trim() || '';
  if (parrafo.length <= 500) return parrafo;

  const base = parrafo.slice(0, 500);
  const lastSemicolonIndex = base.lastIndexOf(';');
  const trimmed = (lastSemicolonIndex >= 0 ? base.slice(0, lastSemicolonIndex) : base).trim();

  return `${trimmed}; entre otros.`;
});

const rankClass = (index: number) => {
  if (index === 0) return 'bg-main text-white';
  if (index === 1) return 'bg-[#939077] text-white';
  return 'bg-accent text-white';
};

const isAreaMenuOpen = ref(false);
const areaSelectorRef = useTemplateRef<HTMLElement>('areaSelectorRef');
const availableAreaOptions = computed(() => (
  props.availableAreas?.length ? props.availableAreas : [props.area]
));
const canChooseArea = computed(() => availableAreaOptions.value.length > 1);

const isCurrentArea = (candidateArea: ProductividadSemanalArea) => (
  normalizeAreaKey(candidateArea.area) === normalizeAreaKey(props.area.area)
);

const areaUsageActivity = computed(() => (
  usageOrdenesActividadUsuariosStore.obtenerPorArea(props.area.area)[0] ?? null
));

const formatUsageDateTime = (value: string | null) => (
  value ? formatPanamaDateTime(value) : 'Sin registro'
);

const formatUsageText = (value: string | null | undefined, fallback = 'Sin registro') => {
  const normalized = String(value || '').trim();
  return normalized || fallback;
};

const formatOmStatusLabel = (value: string | null | undefined) => {
  const normalized = String(value || '').trim();

  if (!normalized) {
    return 'Sin registro';
  }

  return normalized.toUpperCase() === 'NR' ? 'Buen Estado' : normalized;
};

const latestUpdatedOrderLabel = computed(() => {
  const activity = areaUsageActivity.value;

  if (!activity) {
    return 'Sin registro';
  }

  const equipo = formatUsageText(activity.equipo_actualizado, '');
  const descripcion = formatUsageText(activity.descripcion_actualizada, '');
  const estadoAnterior = formatOmStatusLabel(activity.estado_anterior);
  const estadoNuevo = formatOmStatusLabel(activity.estado_nuevo);
  const orderParts = [equipo, descripcion].filter(Boolean);
  const orderLabel = orderParts.length > 0 ? orderParts.join(' ') : formatUsageText(activity.id_orden_actualizada);

  return `${orderLabel}: ${estadoAnterior} -> ${estadoNuevo}`;
});

const toggleAreaMenu = () => {
  if (!canChooseArea.value) return;
  isAreaMenuOpen.value = !isAreaMenuOpen.value;
};

const closeAreaMenu = () => {
  isAreaMenuOpen.value = false;
};

const handleAreaSelect = (selectedArea: ProductividadSemanalArea) => {
  emit('selectArea', selectedArea);
  closeAreaMenu();
};

const handlePointerDownOutside = (event: MouseEvent) => {
  if (!isAreaMenuOpen.value) return;
  if (!(event.target instanceof Node)) return;
  if (areaSelectorRef.value?.contains(event.target)) return;
  closeAreaMenu();
};

onMounted(() => {
  if (!usageOrdenesActividadUsuariosStore.isLoaded && !usageOrdenesActividadUsuariosStore.isLoading) {
    void usageOrdenesActividadUsuariosStore.cargarActividad().catch(() => null);
  }
  document.addEventListener('mousedown', handlePointerDownOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handlePointerDownOutside);
});
</script>

<template>
  <article class="productivity-slide">
    <header class="hero-panel">
      <div class="hero-content">
        <h1>Productividad semanal por equipo</h1>
        <div class="hero-meta">
          <span><CalendarDays class="meta-icon" /> Semana {{ props.semana }}</span>
          <span><UserRound class="meta-icon" /> Supervisor: {{ props.area.supervisor.nombre }}</span>
          <div ref="areaSelectorRef" class="area-selector">
            <div
              class="area-selector-trigger"
              :class="canChooseArea ? 'is-clickable' : ''"
              role="button"
              :tabindex="canChooseArea ? 0 : -1"
              :aria-expanded="isAreaMenuOpen"
              aria-haspopup="listbox"
              @click="toggleAreaMenu"
              @keydown.enter.prevent="toggleAreaMenu"
              @keydown.space.prevent="toggleAreaMenu"
              @keydown.esc.prevent="closeAreaMenu"
            >
              <span><MapPin class="meta-icon" /> Área: {{ formatAreaName(props.area.area) }}</span>
              <ChevronDown
                v-if="canChooseArea"
                class="meta-icon area-selector-chevron"
                :class="isAreaMenuOpen ? 'is-open' : ''"
              />
            </div>

            <div
              v-if="isAreaMenuOpen"
              class="area-selector-menu"
              role="listbox"
              aria-label="Areas disponibles"
            >
              <div
                v-for="availableArea in availableAreaOptions"
                :key="availableArea.area"
                class="area-selector-option"
                :class="isCurrentArea(availableArea) ? 'is-active' : ''"
                role="option"
                :aria-selected="isCurrentArea(availableArea)"
                @click.stop="handleAreaSelect(availableArea)"
              >
                <div class="area-selector-copy">
                  <strong>{{ formatAreaName(availableArea.area) }}</strong>
                  <p>{{ availableArea.supervisor.nombre || 'Sin supervisor' }}</p>
                </div>
                <Check
                  v-if="isCurrentArea(availableArea)"
                  class="meta-icon area-selector-check"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <img
        class="hero-art"
        src="/icon_productividad_semanal.svg"
        alt=""
        aria-hidden="true"
      />
    </header>

    <main class="content-grid">
      <section class="summary-card">
        <div class="summary-row">
          <span class="summary-icon"><Clock3 class="h-7 w-7" /></span>
          <div>
            <strong>{{ formatHours(props.area.totales.horas_trabajadas) }} h</strong>
            <p>Horas totales trabajadas</p>
          </div>
        </div>

        <div class="summary-row delay-row">
          <span class="summary-icon delay-icon"><Clock3 class="h-7 w-7" /></span>
          <div>
            <strong>{{ formatHours(props.area.totales.retraso) }} h</strong>
            <p>Horas retrasadas</p>
          </div>
        </div>

        <div class="summary-row">
          <span class="summary-icon"><Tractor class="h-7 w-7" /></span>
          <div>
            <strong>{{ props.area.totales.equipos_atendidos }} equipos</strong>
            <p>Equipos con actividad</p>
          </div>
        </div>

        <div class="summary-row">
          <span class="summary-icon"><Forklift class="h-7 w-7" /></span>
          <div>
            <strong>{{ props.area.totales.equipo_con_mas_horas || 'Sin equipo' }}</strong>
            <p>Equipo con más horas</p>
          </div>
        </div>
      </section>

      <section class="ranking-list">
        <article
          v-for="(equipo, index) in props.area.top_equipos"
          :key="`${equipo.equipo}-${index}`"
          class="ranking-card"
        >
          <span class="rank-badge" :class="rankClass(index)">#{{ equipo.posicion || index + 1 }}</span>
          <strong class="equipment-name">{{ equipo.equipo }}</strong>
          <strong class="equipment-hours">{{ formatHours(equipo.horas_trabajadas) }} h</strong>
          <p>{{ equipmentDescription(equipo) }}</p>
        </article>
      </section>
    </main>

    <footer v-if="props.area.resto" class="rest-panel">
      <span class="rest-icon"><FileText class="h-8 w-8" /></span>
      <div class="rest-content">
        <h2>Resto de horas</h2>
        <p>{{ restoParrafo }}</p>
        <div class="usage-activity-row">
          <p>
            <span class="usage-activity-label">Ultima vista de ordenes:</span>
            <span>{{ formatUsageDateTime(areaUsageActivity?.ultima_entrada_ordenes_at ?? null) }}</span>
          </p>
          <p>
            <span class="usage-activity-label">Ultimo cambio de estado:</span>
            <span>{{ formatUsageDateTime(areaUsageActivity?.ultima_actualizacion_om_at ?? null) }}</span>
          </p>
          <p>
            <span class="usage-activity-label">OM actualizada:</span>
            <span>{{ latestUpdatedOrderLabel }}</span>
          </p>
        </div>
      </div>
    </footer>
  </article>
</template>

<style scoped>
.productivity-slide {
  --productivity-slide-scale: 0.76;

  display: flex;
  width: calc(100% / var(--productivity-slide-scale));
  height: calc(100% / var(--productivity-slide-scale));
  min-height: 0;
  flex-direction: column;
  gap: 0.9rem;
  padding: 0.75rem 0 0;
  color: var(--color-gray-700);
  transform: scale(var(--productivity-slide-scale));
  transform-origin: top left;
}

.hero-panel {
  position: relative;
  min-height: 165px;
  overflow: visible;
  border-radius: 0;
  background: linear-gradient(110deg, #fffdf7 0%, #fbfaf5 54%, #f0ede5 100%);
  box-shadow: inset 0 -1px 0 rgba(216, 212, 202, 0.7);
}

.hero-panel::after {
  position: absolute;
  inset: auto 0 0 0;
  height: 68%;
  content: '';
  background:
    linear-gradient(160deg, transparent 56%, rgba(212, 168, 83, 0.12) 56.4%, transparent 57%),
    repeating-linear-gradient(168deg, transparent 0 16px, rgba(216, 212, 202, 0.35) 17px 18px);
  opacity: 0.55;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: calc(100% - 330px);
  padding: 2rem 1.75rem 1.35rem;
}

h1 {
  color: var(--color-main);
  font-size: clamp(1.9rem, 3.4vw, 3rem);
  font-weight: 800;
  line-height: 0.98;
  white-space: nowrap;
}

.hero-meta {
  margin-top: 1.05rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem 1.15rem;
  color: var(--color-gray-500);
  font-size: clamp(0.82rem, 1.45vw, 1rem);
  font-weight: 500;
}

.hero-meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
}

.area-selector {
  position: relative;
}

.area-selector-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 999px;
  outline: none;
}

.area-selector-trigger.is-clickable {
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.area-selector-trigger.is-clickable:hover,
.area-selector-trigger.is-clickable:focus-visible {
  background: rgba(76, 98, 45, 0.08);
  color: var(--color-main);
}

.area-selector-chevron {
  transition: transform 0.2s ease;
}

.area-selector-chevron.is-open {
  transform: rotate(180deg);
}

.area-selector-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 120;
  min-width: 220px;
  overflow: hidden;
  border: 1px solid rgba(216, 212, 202, 0.95);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 14px 28px rgba(26, 25, 23, 0.16);
  padding: 0.35rem;
}

.area-selector-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  border-radius: 10px;
  cursor: pointer;
  padding: 0.65rem 0.8rem;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.area-selector-option:hover {
  background: #f5f6f1;
}

.area-selector-option.is-active {
  background: #e9f0ea;
  color: var(--color-main);
}

.area-selector-copy {
  min-width: 0;
}

.area-selector-copy strong,
.area-selector-copy p {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.area-selector-copy strong {
  font-size: 0.92rem;
}

.area-selector-copy p {
  margin-top: 0.12rem;
  font-size: 0.76rem;
}

.area-selector-check {
  flex: 0 0 auto;
}

.meta-icon {
  height: 1.1rem;
  width: 1.1rem;
}

.hero-art {
  position: absolute;
  right: 1.75rem;
  bottom: 0.8rem;
  z-index: 1;
  height: 150px;
  width: 270px;
  opacity: 0.78;
  object-fit: contain;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.95fr) minmax(360px, 2.1fr);
  gap: 1rem;
  padding: 0 2.25rem;
}

.summary-card, .ranking-card, .rest-panel {
  border: 1px solid rgba(216, 212, 202, 0.9);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 8px 24px rgba(26, 25, 23, 0.08);
}

.summary-card {
  border-radius: 12px;
  padding: 0.9rem 1.25rem;
}

.summary-row {
  display: grid;
  grid-template-columns: 54px 1fr;
  gap: 1rem;
  align-items: center;
  padding: 0.55rem 0;
}

.summary-row + .summary-row {
  border-top: 1px solid rgba(201, 195, 180, 0.75);
}

.summary-icon, .rest-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #eef1e8;
  color: #4c622d;
}

.summary-icon {
  height: 50px;
  width: 50px;
}

.summary-row strong {
  color: var(--color-main);
  font-size: clamp(1.3rem, 2.45vw, 2.15rem);
  line-height: 1.05;
}

.summary-row p, .ranking-card p, .rest-panel p {
  color: var(--color-gray-600);
  font-size: clamp(0.78rem, 1.2vw, 0.98rem);
  line-height: 1.35;
}

.delay-row {
  margin: 0.35rem 0;
  border-top: 0 !important;
}

.delay-row + .summary-row {
  border-top: 0;
}

.delay-icon {
  background: rgba(192, 57, 43, 0.12);
  color: var(--color-danger);
}

.delay-row strong {
  color: var(--color-danger);
}

.ranking-list {
  display: grid;
  gap: 0.7rem;
}

.ranking-card {
  display: grid;
  grid-template-columns: 58px minmax(100px, 1fr) 88px minmax(190px, 1.25fr);
  align-items: center;
  gap: 1rem;
  min-height: 78px;
  max-height: 95px;
  border-radius: 10px;
  padding: 0.8rem 1.15rem;
}

.rank-badge {
  display: inline-flex;
  height: 46px;
  width: 46px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 1.18rem;
  font-weight: 800;
}

.equipment-name {
  color: var(--color-main);
  font-size: clamp(1.15rem, 2vw, 1.65rem);
}

.equipment-hours {
  border-right: 2px solid rgba(216, 212, 202, 0.9);
  color: var(--color-gray-900);
  font-size: clamp(1.2rem, 2.1vw, 1.75rem);
  line-height: 1;
  padding-right: 1rem;
  text-align: right;
}

.rest-panel {
  display: flex;
  gap: 1.15rem;
  align-items: center;
  margin: 0 2.25rem 1rem;
  border-radius: 10px;
  background: linear-gradient(90deg, #e9f0ea 0%, #f5f7f2 100%);
  padding: 0.85rem 1.35rem;
}

.rest-icon {
  flex: 0 0 auto;
  height: 56px;
  width: 56px;
}

.rest-panel h2 {
  color: var(--color-main);
  font-size: clamp(0.95rem, 1.6vw, 1.25rem);
  font-weight: 800;
}

.rest-content {
  min-width: 0;
  flex: 1;
}

.usage-activity-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem 0.9rem;
  margin-top: 0.65rem;
  padding-top: 0.55rem;
  border-top: 1px solid rgba(201, 195, 180, 0.5);
  color: rgba(88, 88, 88, 0.92);
  font-size: 0.7rem;
  line-height: 1.35;
}

.usage-activity-row p {
  min-width: 0;
}

.usage-activity-label {
  margin-right: 0.25rem;
  color: rgba(76, 98, 45, 0.78);
  font-weight: 600;
}

@media (max-width: 1100px) {
  .productivity-slide { --productivity-slide-scale: 0.82; }
  .hero-art { display: none; }
  .hero-content { max-width: none; }
  .content-grid { grid-template-columns: 1fr; padding: 0 1.25rem; }
  .ranking-card { grid-template-columns: 64px 1fr 96px; }
  .ranking-card p { grid-column: 2 / -1; }
  .equipment-hours { border-right: 0; padding-right: 0; }
  .rest-panel { margin-inline: 1.25rem; }
  .usage-activity-row { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .productivity-slide { --productivity-slide-scale: 0.72; }
  .productivity-slide { padding-top: 0.75rem; }
  .hero-content { padding: 2.25rem 1.25rem; }
  h1 { font-size: 1.55rem; }
  .hero-meta { gap: 0.65rem; }
  .hero-meta span { width: 100%; }
  .summary-card { padding: 1rem 1.25rem; }
  .summary-row { grid-template-columns: 56px 1fr; gap: 1rem; }
  .summary-icon { height: 54px; width: 54px; }
  .ranking-card { grid-template-columns: 54px 1fr; gap: 0.8rem; padding: 1rem; }
  .rank-badge { height: 48px; width: 48px; font-size: 1.15rem; }
  .equipment-hours { grid-column: 2; text-align: left; }
  .ranking-card p { grid-column: 1 / -1; }
  .rest-panel { align-items: flex-start; gap: 1rem; padding: 1rem; }
  .rest-icon { height: 56px; width: 56px; }
}
</style>
