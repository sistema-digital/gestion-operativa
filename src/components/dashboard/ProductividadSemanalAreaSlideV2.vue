<script setup lang="ts">
import { computed, toRef } from 'vue';
import {
  CalendarDays,
  CircleGauge,
  Clock3,
  FileText,
  Hourglass,
  MapPin,
  Settings2,
  UserRound,
  UsersRound,
} from 'lucide-vue-next';
import { useSlideProductividadViewModel } from '@/composables/useSlideProductividadViewModel';
import type { ProductividadSemanalArea } from '@/stores/horasTrabajo.types';
import type { ProductividadDashboardTableItem } from '@/stores/productividadSemanalDashboard.types';
import type {
  ProductividadSlideHeroMetric,
  ProductividadSlideOperationalCause,
  ProductividadSlidePersonalCause,
} from '@/components/dashboard/productividadSlide.types';

const props = defineProps<{
  area: ProductividadSemanalArea;
  semana: string;
  dashboardTables?: ProductividadDashboardTableItem[];
}>();

const viewModel = useSlideProductividadViewModel({
  area: toRef(props, 'area'),
  dashboardTables: toRef(props, 'dashboardTables'),
  semana: toRef(props, 'semana'),
});

const heroMetrics = computed(() => viewModel.value.heroMetrics);
const idealMetric = computed(() => heroMetrics.value[0] as ProductividadSlideHeroMetric | undefined);
const delayFreeMetric = computed(() => heroMetrics.value[1] as ProductividadSlideHeroMetric | undefined);
const equivalentMetric = computed(() => heroMetrics.value[2] as ProductividadSlideHeroMetric | undefined);

const personalCauses = computed(() => (
  viewModel.value.personalDelay.causes as ProductividadSlidePersonalCause[]
));

const operationalCauses = computed(() => (
  viewModel.value.operationalDelay.causes as ProductividadSlideOperationalCause[]
));

const topTeams = computed(() => viewModel.value.topTeams.slice(0, 3));

const summaryIcons = [Clock3, Clock3, UsersRound, FileText];
const rankClasses = [
  'bg-[#003a24] text-white',
  'bg-[#8a724d] text-white',
  'bg-[#ff6b00] text-white',
];

const formatPercent = (value: number, withSign = false) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const prefix = withSign && safeValue > 0 ? '+' : '';
  return `${prefix}${safeValue.toFixed(1)}%`;
};

const formatHours = (value: number) => `${(Number.isFinite(value) ? value : 0).toFixed(0)} h`;

const formatDelayDuration = (value: number) => {
  const safeValue = Math.max(0, Number.isFinite(value) ? value : 0);
  const totalHours = Math.round(safeValue);
  const days = Math.floor(totalHours / 8);
  const hours = totalHours % 8;

  if (days <= 0) {
    return `${hours} h`;
  }

  if (hours === 0) {
    return `${days} d`;
  }

  return `${days} d ${hours} h`;
};

const totalDelayLabel = computed(() => (
  formatDelayDuration(viewModel.value.totalDelayHours)
));

const operationalPairs = computed(() => {
  const filled = operationalCauses.value.slice(0, 2);
  while (filled.length < 2) {
    filled.push({
      cause: '-----',
      hours: 0,
      equipments: ['-----'],
    });
  }

  return filled;
});

const personalCauseRows = computed(() => {
  const causes = personalCauses.value.slice(0, 4);

  if (causes.length <= 1) return [causes];
  if (causes.length === 2) return [causes];
  if (causes.length === 3) return [[causes[0]], [causes[1], causes[2]]];
  return [causes.slice(0, 2), causes.slice(2, 4)];
});

const summaryItemClass = (index: number) => {
  if (index === 1) return 'text-[#ff2d20]';
  return 'text-main';
};

const summaryHaloClass = (index: number) => {
  if (index === 1) return 'bg-[#fff1f0] text-[#ff2d20]';
  return 'bg-[#edf6e8] text-main';
};

const weeklyToneClass = (index: number) => {
  if (index === 1) return 'border-[#3654ff] text-[#3654ff]';
  return 'border-[#2c8e36] text-main';
};
</script>

<template>
  <article class="flex min-h-full w-full rounded-[18px] bg-[#fbfaf7] px-2 py-2 text-[#101010]">
    <div class="grid w-full grid-cols-12 grid-rows-[auto_auto_auto_1fr] gap-2">
      <header class="col-span-12 flex items-start justify-between gap-4 px-1 pt-1">
        <div class="min-w-0">
          <h1 class="font-display text-[2.7rem] leading-[0.95] tracking-[-0.03em] text-main">
            Productividad semanal por equipo
          </h1>
        </div>

        <div class="grid shrink-0 grid-cols-3 gap-2">
          <div class="flex min-w-[170px] items-center gap-2 rounded-[16px] border border-[#ece9e1] bg-white px-3 py-2 shadow-[0_8px_24px_rgba(20,20,20,0.05)]">
            <CalendarDays class="h-4 w-4 text-main" />
            <div>
              <p class="text-xs font-semibold text-gray-500">Semana</p>
              <p class="text-base font-semibold text-gray-900">{{ viewModel.weekLabel }}</p>
            </div>
          </div>

          <div class="flex min-w-[195px] items-center gap-2 rounded-[16px] border border-[#ece9e1] bg-white px-3 py-2 shadow-[0_8px_24px_rgba(20,20,20,0.05)]">
            <UserRound class="h-4 w-4 text-main" />
            <div class="min-w-0">
              <p class="text-xs font-semibold text-gray-500">Supervisor:</p>
              <p class="line-clamp-1 text-base font-semibold text-gray-900">{{ viewModel.supervisorName }}</p>
            </div>
          </div>

          <div class="flex min-w-[180px] items-center gap-2 rounded-[16px] border border-[#ece9e1] bg-white px-3 py-2 shadow-[0_8px_24px_rgba(20,20,20,0.05)]">
            <MapPin class="h-4 w-4 text-main" />
            <div class="min-w-0">
              <p class="text-xs font-semibold text-gray-500">Area:</p>
              <p class="line-clamp-1 text-base font-semibold text-gray-900">{{ viewModel.areaName }}</p>
            </div>
          </div>
        </div>
      </header>

      <section class="col-span-12 grid grid-cols-[1.15fr_1fr_1fr] gap-2">
        <article class="rounded-[18px] border border-[#ece9e1] bg-white px-4 py-3 shadow-[0_10px_28px_rgba(20,20,20,0.04)]">
          <h2 class="text-center text-[0.95rem] font-semibold text-[#1d1d1d]">Avance ideal vs real</h2>
          <div class="mt-2 grid grid-cols-2 items-center gap-3">
            <div class="flex flex-col items-center">
              <div class="flex h-[98px] w-[98px] items-center justify-center rounded-full border-[3px] border-[#102018] text-main">
                <span class="text-[1rem] font-bold">{{ formatPercent(idealMetric?.primaryValue ?? 0) }}</span>
              </div>
              <p class="mt-1 text-[0.95rem] font-medium text-[#242424]">{{ idealMetric?.primaryLabel }}</p>
            </div>

            <div class="flex flex-col items-center">
              <div class="flex h-[98px] w-[98px] items-center justify-center rounded-full border-[3px] border-[#198a27] text-[#198a27]">
                <span class="text-[1rem] font-bold">{{ formatPercent(idealMetric?.secondaryValue ?? 0) }}</span>
              </div>
              <p class="mt-1 text-[0.95rem] font-medium text-[#242424]">{{ idealMetric?.secondaryLabel }}</p>
            </div>
          </div>
          <p class="mt-1 text-center text-[1rem] font-semibold text-[#ff2d20]">{{ idealMetric?.helper }}</p>
        </article>

        <article class="rounded-[18px] border border-[#ece9e1] bg-white px-4 py-3 shadow-[0_10px_28px_rgba(20,20,20,0.04)]">
          <h2 class="text-center text-[0.95rem] font-semibold text-[#1d1d1d]">Avance sin retraso</h2>
          <div class="mt-2 grid grid-cols-2 items-center gap-3">
            <div class="flex flex-col items-center">
              <div class="flex h-[98px] w-[98px] flex-col items-center justify-center rounded-full border-[3px] border-[#ff2d20] px-2 text-[#ff2d20]">
                <span class="text-[1rem] font-bold">{{ formatPercent(delayFreeMetric?.secondaryValue ?? 0) }}</span>
                <span class="mt-1 text-center text-[0.78rem] leading-3 text-[#202020]">Pérdida de avance</span>
              </div>
              <p class="mt-1 text-[0.82rem] font-medium text-[#242424]">{{ delayFreeMetric?.helper?.replace('Operativo ', 'op. ').replace('Personal ', 'per. ') }}</p>
            </div>

            <div class="flex flex-col items-center">
              <div class="flex h-[98px] w-[98px] items-center justify-center rounded-full border-[3px] border-[#102018] text-main">
                <span class="text-[1rem] font-bold">{{ formatPercent(delayFreeMetric?.primaryValue ?? 0) }}</span>
              </div>
              <p class="mt-1 text-[0.95rem] font-medium text-[#242424]">{{ delayFreeMetric?.primaryLabel }}</p>
            </div>
          </div>
        </article>

        <article class="rounded-[18px] border border-[#ece9e1] bg-white px-4 py-3 shadow-[0_10px_28px_rgba(20,20,20,0.04)]">
          <h2 class="text-center text-[0.95rem] font-semibold text-[#1d1d1d]">Avance equivalente</h2>
          <div class="mt-2 flex flex-col items-center">
            <div class="flex h-[104px] w-[104px] flex-col items-center justify-center rounded-full border-[3px] border-[#198a27] text-[#198a27]">
              <span class="text-[1rem] font-bold">{{ formatPercent(equivalentMetric?.primaryValue ?? 0, true) }}</span>
              <span class="text-[0.9rem] font-medium text-[#202020]">Equivalente</span>
            </div>
            <p class="mt-2 text-[0.9rem] font-medium text-[#1a1a1a]">
              2026:
              <span class="ml-1 text-[#198a27]">{{ formatPercent(equivalentMetric?.secondaryValue ?? 0) }}</span>
              <span class="mx-2">•</span>
              2025:
              <span class="ml-1 text-[#3654ff]">{{ equivalentMetric?.helper?.split('2025: ')[1] }}</span>
            </p>
          </div>
        </article>
      </section>

      <section class="col-span-12 grid grid-cols-[1fr_0.98fr] gap-2">
        <article class="rounded-[18px] border border-[#ece9e1] bg-white px-4 py-3 shadow-[0_10px_28px_rgba(20,20,20,0.04)]">
          <h2 class="text-[1rem] font-semibold text-[#1d1d1d]">Productividad semanal</h2>
          <div class="mt-2 grid grid-cols-4 gap-2">
            <div
              v-for="(item, index) in viewModel.summaryItems"
              :key="item.label"
              class="flex min-h-[118px] flex-col items-center justify-start px-2 text-center"
              :class="index < viewModel.summaryItems.length - 1 ? 'border-r border-[#ece8df]' : ''"
            >
              <div class="flex h-14 w-14 items-center justify-center rounded-full" :class="summaryHaloClass(index)">
                <component :is="summaryIcons[index]" class="h-6 w-6" />
              </div>
              <p class="mt-3 text-[1rem] font-bold" :class="summaryItemClass(index)">
                {{ item.label === 'Retrasos' ? formatDelayDuration(viewModel.totalDelayHours) : item.value }}
              </p>
              <p class="mt-1 text-[0.9rem] leading-5 text-[#252525]">{{ item.label }}</p>
            </div>
          </div>
        </article>

        <article class="rounded-[18px] border border-[#ece9e1] bg-white px-4 py-3 shadow-[0_10px_28px_rgba(20,20,20,0.04)]">
          <h2 class="text-[1rem] font-semibold text-[#1d1d1d]">Equipos con mas horas trabajadas</h2>
          <div v-if="topTeams.length > 0" class="mt-2 divide-y divide-[#efebe2]">
            <div
              v-for="(team, index) in topTeams"
              :key="`${team.team}-${team.rank}`"
              class="grid grid-cols-[3.3rem_1fr_4.5rem] items-center gap-3 py-2.5"
            >
              <div class="flex h-[46px] w-[46px] items-center justify-center rounded-full text-[0.95rem] font-bold" :class="rankClasses[index] || rankClasses[2]">
                #{{ team.rank }}
              </div>
              <div class="min-w-0">
                <p class="font-mono text-[0.95rem] font-bold text-main">{{ team.team }}</p>
                <p class="line-clamp-2 text-[0.82rem] leading-4 text-[#242424]">{{ team.description }}</p>
              </div>
              <p class="text-right text-[1rem] font-bold text-[#101010]">{{ formatHours(team.hours) }}</p>
            </div>
          </div>
          <div
            v-else
            class="mt-3 flex min-h-[118px] items-center justify-center rounded-[14px] border border-dashed border-[#d8d5cd] bg-[#faf8f3] px-4 text-center"
          >
            <p class="text-[0.92rem] font-medium text-gray-500">
              No se trabajó ningún equipo.
            </p>
          </div>
        </article>
      </section>

      <section class="col-span-12 rounded-[18px] border border-[#ece9e1] bg-white px-4 py-2 shadow-[0_10px_28px_rgba(20,20,20,0.04)]">
        <h2 class="text-center text-[0.95rem] font-semibold text-[#1d1d1d]">Resumen semanal</h2>
        <div class="mt-1 grid grid-cols-3 items-center">
          <div
            v-for="(value, index) in [viewModel.weeklyProgress.currentWeek, viewModel.weeklyProgress.previousWeek, viewModel.weeklyProgress.currentTotal]"
            :key="index"
            class="flex flex-col items-center py-1.5"
            :class="index < 2 ? 'border-r border-[#ece8df]' : ''"
          >
            <div class="flex h-[58px] w-[58px] items-center justify-center rounded-full border-[3px] text-[0.9rem] font-semibold" :class="weeklyToneClass(index)">
              {{ formatPercent(value) }}
            </div>
            <p class="mt-1 text-[0.84rem] text-[#202020]">
              {{ index === 0 ? 'Esta semana' : index === 1 ? 'Semana anterior' : 'Avance actual' }}
            </p>
          </div>
        </div>
      </section>

      <section class="col-span-12 grid grid-cols-[1fr_11rem] gap-2">
        <article class="rounded-[18px] border border-[#ece9e1] bg-white px-4 py-2 shadow-[0_10px_28px_rgba(20,20,20,0.04)]">
          <h2 class="text-[1rem] font-semibold text-[#1d1d1d]">Retrasos</h2>

          <div class=" divide-y divide-[#ece8df]">
            <div class=" pb-1 grid grid-cols-[12rem_6rem_8rem_8rem_1fr] items-center gap-3 ">
              <div class="flex items-center gap-3 border-r border-[#ece8df] pr-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,#fff2f1_0%,#fde9e7_100%)] text-[#ff453d]">
                  <UsersRound class="h-6 w-6" />
                </div>
                <div>
                  <p class="text-[0.95rem] leading-5 text-[#202020]">Retraso<br>Personal</p>
                </div>
              </div>

              <div class="text-center">
                <p class="text-[0.84rem] text-[#202020]">Tiempo</p>
                <p class="mt-1 text-[1rem] font-bold text-[#ff2d20]">{{ formatDelayDuration(viewModel.personalDelay.hours) }}</p>
              </div>

              <div class="text-center">
                <p class="text-[0.84rem] text-[#202020]">Personal faltante</p>
                <p class="mt-1 text-[1rem] font-bold text-[#ff2d20]">{{ viewModel.personalDelay.missingPeople ?? 0 }}</p>
              </div>

              <div class="text-center">
                <p class="text-[0.84rem] text-[#202020]">Personal activo</p>
                <p class="mt-1 text-[1rem] font-bold text-main">{{ viewModel.personalDelay.activePeople ?? 0 }}</p>
              </div>

              <div class="text-center">
                <p class="mb-1 text-[0.84rem] text-[#202020]">Causas principales</p>
                <div
                  v-if="personalCauseRows.some((row) => row.length > 0)"
                  class="flex flex-col gap-2"
                >
                  <div
                    v-for="(row, rowIndex) in personalCauseRows"
                    :key="`personal-row-${rowIndex}`"
                    class="flex w-full items-center justify-center gap-2"
                  >
                    <div
                      v-for="cause in row"
                      :key="cause.label"
                      class="min-w-[150px] rounded-[10px] border border-[#ffb3ad] bg-[#fffafb] px-2 py-1.5 text-center text-[0.8rem] font-medium text-[#2d2d2d]"
                    >
                      {{ cause.label }}
                    </div>
                  </div>
                </div>
                <div
                  v-else
                  class="flex items-center justify-center rounded-[10px] border border-dashed border-[#d8d5cd] bg-white px-2 py-1.5 text-center text-[0.8rem] text-gray-400"
                >
                  -----
                </div>
              </div>
            </div>

            <div class="grid grid-cols-[12rem_6rem_1fr] items-center gap-3 py-2.5">
              <div class="flex items-center gap-3 border-r border-[#ece8df] pr-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,#fff4ec_0%,#feecdf_100%)] text-[#ff6b00]">
                  <Settings2 class="h-6 w-6" />
                </div>
                <div>
                  <p class="text-[0.95rem] leading-5 text-[#202020]">Retraso<br>Operativo</p>
                </div>
              </div>

              <div class="text-center">
                <p class="text-[0.84rem] text-[#202020]">Tiempo</p>
                <p class="mt-1 text-[1rem] font-bold text-[#ff6b00]">{{ formatDelayDuration(viewModel.operationalDelay.hours) }}</p>
              </div>

              <div>
                <p class="mb-1 text-[0.84rem] text-[#202020]">Causas y equipos asociados</p>
                <div class="grid grid-cols-2 gap-2">
                  <div
                    v-for="cause in operationalPairs"
                    :key="cause.cause"
                    class="space-y-1.5 rounded-[12px] border border-[#ffc7a2] bg-[#fffaf5] px-2 py-2"
                  >
                    <div class="rounded-[10px] px-2 py-1 text-center text-[0.82rem] font-semibold text-[#ff6b00]">
                      {{ cause.cause }}
                    </div>
                    <div class="flex flex-wrap items-center justify-center gap-1.5">
                      <span
                        v-for="equipment in cause.equipments.slice(0, 3)"
                        :key="`${cause.cause}-${equipment}`"
                        class="rounded-[8px] bg-[#f7e7dc] px-2 py-1 text-[0.78rem] font-medium text-[#3a3a3a]"
                      >
                        {{ equipment }}
                      </span>
                      <span
                        v-if="cause.equipments.length === 0 || cause.equipments[0] === '-----'"
                        class="rounded-[8px] border border-dashed border-[#d8d5cd] px-2 py-1 text-[0.78rem] text-gray-400"
                      >
                        -----
                      </span>
                      <span
                        v-if="cause.equipments.length > 3"
                        class="rounded-[8px] bg-[#f7e7dc] px-2 py-1 text-[0.78rem] font-medium text-[#3a3a3a]"
                      >
                        +{{ cause.equipments.length - 3 }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        <aside class="flex flex-col items-center justify-center rounded-[16px] border border-[#ffd8d4] bg-[linear-gradient(180deg,#fff4f3_0%,#ffe9e6_100%)] px-3 py-4 text-center text-[#ff2d20] shadow-[0_10px_28px_rgba(255,45,32,0.08)]">
          <Hourglass class="h-9 w-9" />
          <p class="mt-4 text-[2.8rem] font-bold leading-none">{{ totalDelayLabel }}</p>
          <p class="mt-1 text-[0.84rem] leading-5">tiempo<br>retrasado</p>
        </aside>
      </section>
    </div>
  </article>
</template>
