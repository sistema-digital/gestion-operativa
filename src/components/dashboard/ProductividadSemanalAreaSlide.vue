<script setup lang="ts">
import { computed } from 'vue';
import {
  CalendarDays,
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

const props = defineProps<{
  area: ProductividadSemanalArea;
  semana: string;
  dashboardTables?: ProductividadDashboardTableItem[];
}>();

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
</script>

<template>
  <article class="productivity-slide">
    <header class="hero-panel">
      <div class="hero-content">
        <h1>Productividad semanal por equipo</h1>
        <div class="hero-meta">
          <span><CalendarDays class="meta-icon" /> Semana {{ props.semana }}</span>
          <span><UserRound class="meta-icon" /> Supervisor: {{ props.area.supervisor.nombre }}</span>
          <span><MapPin class="meta-icon" /> Área: {{ props.area.area }}</span>
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
      <div>
        <h2>Resto de horas</h2>
        <p>{{ restoParrafo }}</p>
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
  overflow: hidden;
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

@media (max-width: 1100px) {
  .productivity-slide { --productivity-slide-scale: 0.82; }
  .hero-art { display: none; }
  .hero-content { max-width: none; }
  .content-grid { grid-template-columns: 1fr; padding: 0 1.25rem; }
  .ranking-card { grid-template-columns: 64px 1fr 96px; }
  .ranking-card p { grid-column: 2 / -1; }
  .equipment-hours { border-right: 0; padding-right: 0; }
  .rest-panel { margin-inline: 1.25rem; }
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
