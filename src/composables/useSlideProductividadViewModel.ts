import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type {
  ProductividadSemanalArea,
} from '@/stores/horasTrabajo.types';
import type {
  AvanceConcluidoSemanalRow,
  AvanceEquivalenteRow,
  AvanceIdealVsRealRow,
  AvancePerdidoPersonalRow,
  AvanceRealVsAproximadoRow,
  ProductividadDashboardScope,
  ProductividadDashboardTable,
  ProductividadDashboardTableItem,
} from '@/stores/productividadSemanalDashboard.types';
import type {
  ProductividadSlideHeroMetric,
  ProductividadSlideOperationalCause,
  ProductividadSlidePersonalCause,
  ProductividadSlideSummaryItem,
  ProductividadSlideTopTeam,
  ProductividadSlideViewModel,
} from '@/components/dashboard/productividadSlide.types';

type ViewModelOptions = {
  area: MaybeRefOrGetter<ProductividadSemanalArea>;
  dashboardTables?: MaybeRefOrGetter<ProductividadDashboardTableItem[] | undefined>;
  semana: MaybeRefOrGetter<string>;
};

const normalizeAreaKey = (area: string) => String(area || '')
  .trim()
  .toUpperCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const toNumber = (value: number | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const equipmentDescription = (description: string | null | undefined) => (
  description?.trim() || 'Sin descripcion'
);

const findTable = <TRow>(
  tables: ProductividadDashboardTableItem[] | undefined,
  tableName: ProductividadDashboardTableItem['tabla'],
  scope: ProductividadDashboardScope
) => tables?.find((table) => (
  table.tabla === tableName && table.scope === scope
)) as ProductividadDashboardTable<TRow> | undefined;

const findRowByArea = <TRow extends { area: string }>(
  table: ProductividadDashboardTable<TRow> | undefined,
  areaName: string
) => {
  const areaKey = normalizeAreaKey(areaName);
  return table?.filas.find((row) => normalizeAreaKey(row.area) === areaKey);
};

const buildHeroMetrics = ({
  idealRow,
  equivalentRow,
  progressRow,
  weeklyRow,
}: {
  idealRow?: AvanceIdealVsRealRow;
  equivalentRow?: AvanceEquivalenteRow;
  progressRow?: AvanceRealVsAproximadoRow;
  weeklyRow?: AvanceConcluidoSemanalRow;
}): ProductividadSlideHeroMetric[] => [
  {
    title: 'Avance ideal vs real',
    primaryLabel: 'Ideal',
    primaryValue: toNumber(idealRow?.avance_ideal),
    secondaryLabel: 'Real',
    secondaryValue: toNumber(idealRow?.avance_real),
    helper: `Dif.: ${toNumber(idealRow?.diferencia).toFixed(1)}%`,
    tone: 'success',
  },
  {
    title: 'Avance sin retraso',
    primaryLabel: 'Sin retrasos',
    primaryValue: toNumber(progressRow?.avance_sin_retrasos),
    secondaryLabel: 'Perdida',
    secondaryValue: toNumber(progressRow?.avance_perdido),
    helper: `Operativo ${toNumber(progressRow?.avance_perdido_operativo).toFixed(1)}% • Personal ${toNumber(progressRow?.avance_perdido_personal).toFixed(1)}%`,
    tone: 'danger',
  },
  {
    title: 'Avance equivalente',
    primaryLabel: 'Equivalente',
    primaryValue: toNumber(equivalentRow?.diferencia),
    secondaryLabel: '2026',
    secondaryValue: toNumber(equivalentRow?.avance_2026),
    helper: `2026: ${toNumber(equivalentRow?.avance_2026).toFixed(1)}% • 2025: ${toNumber(equivalentRow?.avance_2025).toFixed(1)}%`,
    tone: 'info',
  },
  {
    title: 'Avance semanal',
    primaryLabel: 'Actual',
    primaryValue: toNumber(weeklyRow?.avance_acumulado),
    tone: 'warning',
  },
];

const buildSummaryItems = (
  area: ProductividadSemanalArea,
  totalDelayHours: number
): ProductividadSlideSummaryItem[] => [
  {
    label: 'Horas trabajadas',
    value: `${toNumber(area.totales.horas_trabajadas).toFixed(0)} h`,
  },
  {
    label: 'Retrasos',
    value: `${toNumber(totalDelayHours).toFixed(0)} h`,
  },
  {
    label: 'Equipos con actividad',
    value: String(area.totales.equipos_atendidos || 0),
  },
  {
    label: 'Equipo con mas horas',
    value: area.totales.equipo_con_mas_horas || 'Sin equipo',
  },
];

const buildTopTeams = (area: ProductividadSemanalArea): ProductividadSlideTopTeam[] => (
  area.top_equipos
    .map((team, index) => ({
      rank: team.posicion || index + 1,
      team: team.equipo,
      hours: toNumber(team.horas_trabajadas),
      description: equipmentDescription(team.descripcion),
    }))
    .filter((team) => team.hours > 0)
);

const buildPersonalCauses = (
  personalRow?: AvancePerdidoPersonalRow
): ProductividadSlidePersonalCause[] => {
  const source = [
    { label: 'Vacaciones', hours: toNumber(personalRow?.horas_vacaciones) },
    { label: 'Incapacidad', hours: toNumber(personalRow?.horas_incapacidad) },
    { label: 'Inactivo', hours: toNumber(personalRow?.horas_inactivo) },
    { label: 'Plaza no cubierta', hours: toNumber(personalRow?.horas_plaza_no_cubierta) },
  ];

  return source.filter((item) => item.hours > 0);
};

const buildOperationalCauses = (
  area: ProductividadSemanalArea
): ProductividadSlideOperationalCause[] => (
  area.causas_retraso.map((cause) => ({
    cause: cause.causa,
    hours: toNumber(cause.horas_retraso),
    equipments: cause.equipos.map((equipment) => (
      equipment.equipo || 'Equipo sin detalle'
    )),
  }))
);

export const useSlideProductividadViewModel = ({
  area,
  dashboardTables,
  semana,
}: ViewModelOptions) => computed<ProductividadSlideViewModel>(() => {
  const areaValue = toValue(area);
  const tablesValue = toValue(dashboardTables);

  const idealTable = findTable<AvanceIdealVsRealRow>(
    tablesValue,
    'avance_ideal_vs_real',
    'general'
  );
  const weeklyTable = findTable<AvanceConcluidoSemanalRow>(
    tablesValue,
    'avance_concluido_semanal',
    'semana_actual'
  );
  const equivalentTable = findTable<AvanceEquivalenteRow>(
    tablesValue,
    'avance_equivalente',
    'general'
  );
  const progressTable = findTable<AvanceRealVsAproximadoRow>(
    tablesValue,
    'avance_real_vs_avance_aproximado_sin_retrasos',
    'general'
  );
  const currentWeekProgressTable = findTable<AvanceRealVsAproximadoRow>(
    tablesValue,
    'avance_real_vs_avance_aproximado_sin_retrasos',
    'semana_actual'
  );
  const personalTable = findTable<AvancePerdidoPersonalRow>(
    tablesValue,
    'avance_perdido_por_falta_de_personal',
    'general'
  );
  const currentWeekPersonalTable = findTable<AvancePerdidoPersonalRow>(
    tablesValue,
    'avance_perdido_por_falta_de_personal',
    'semana_actual'
  );

  const idealRow = findRowByArea(idealTable, areaValue.area);
  const weeklyRow = findRowByArea(weeklyTable, areaValue.area);
  const equivalentRow = findRowByArea(equivalentTable, areaValue.area);
  const progressRow = findRowByArea(progressTable, areaValue.area);
  const personalRow = findRowByArea(personalTable, areaValue.area);
  const currentWeekProgressRow = findRowByArea(currentWeekProgressTable, areaValue.area);
  const currentWeekPersonalRow = findRowByArea(currentWeekPersonalTable, areaValue.area);

  const operationalDelayHours = currentWeekProgressRow
    ? toNumber(currentWeekProgressRow.horas_perdidas_operativas)
    : areaValue.causas_retraso.reduce((sum, item) => (
      sum + toNumber(item.horas_retraso)
    ), 0);
  const personalDelayHours = currentWeekProgressRow
    ? toNumber(currentWeekProgressRow.horas_perdidas_personal)
    : toNumber(personalRow?.horas_perdidas_personal);
  const totalDelayHours = currentWeekProgressRow
    ? toNumber(currentWeekProgressRow.horas_perdidas_totales)
    : personalDelayHours + operationalDelayHours;

  return {
    areaName: areaValue.area,
    supervisorName: areaValue.supervisor.nombre,
    weekLabel: String(toValue(semana) || ''),
    heroMetrics: buildHeroMetrics({
      idealRow,
      equivalentRow,
      progressRow,
      weeklyRow,
    }),
    summaryItems: buildSummaryItems(areaValue, totalDelayHours),
    topTeams: buildTopTeams(areaValue),
    weeklyProgress: {
      currentWeek: toNumber(weeklyRow?.avance_semana_actual),
      previousWeek: toNumber(weeklyRow?.avance_semana_anterior),
      currentTotal: toNumber(weeklyRow?.avance_acumulado),
    },
    personalDelay: {
      hours: personalDelayHours,
      activePeople: currentWeekPersonalRow?.personal_activo ?? personalRow?.personal_activo,
      missingPeople: currentWeekPersonalRow?.personal_faltante ?? personalRow?.personal_faltante,
      causes: buildPersonalCauses(currentWeekPersonalRow ?? personalRow),
    },
    operationalDelay: {
      hours: operationalDelayHours,
      causes: buildOperationalCauses(areaValue),
    },
    totalDelayHours,
  };
});
