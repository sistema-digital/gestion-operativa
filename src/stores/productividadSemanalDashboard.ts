import { getWeekNumber } from '@/utils/dateUtils';
import type {
  ProductividadDashboardInput,
  ProductividadDashboardTableItem,
  ProductividadDashboardMeta,
  AvanceIdealVsRealRow,
  AvanceConcluidoSemanalRow,
  AvanceEquivalenteRow,
  AvanceRealVsAproximadoRow,
  AvancePerdidoPersonalRow,
} from './productividadSemanalDashboard.types';
import type { OrdenMantenimiento } from './maintenanceStore';
import type {
  HorasPerdidasPersonalRow,
  PersonalDisponibilidadSemanalRow,
} from './horasTrabajo.types';

const DEFAULT_ETAPA = 'ZAFRA';
const PROGRESS_2025_START_WEEK = 15;
const PROGRESS_2025_COMPARISON_BASE_WEEK = 20;
const HORAS_PER_ORDER_BY_AREA: Record<string, number> = {
  'COSECHA AGRICOLA': 2,
  'COSECHA MECANIZADA': 4,
  'ENGRASE': 8,
  'EQUIPO PESADO': 5,
};

const WEEKLY_AREA_KEYS = new Set([
  ...Object.keys(HORAS_PER_ORDER_BY_AREA),
  'MECANICA DE TRANSPORTE',
]);

const WEEKLY_AREA_SHORT_NAMES: Record<string, string> = {
  'EQUIPO PESADO': 'E. Pesado',
  'COSECHA MECANIZADA': 'C. Mecanizada',
  'COSECHA AGRICOLA': 'C. Agrícola',
  'MECANICA DE TRANSPORTE': 'M. Transporte',
  'ENGRASE': 'Engrase',
};

const PROGRESS_2025_GENERAL: Record<string, number> = {
  '20': 0.20, '21': 1.20, '22': 1.10, '23': 0.60, '24': 1.10,
  '25': 0.80, '26': 1.60, '27': 1.10, '28': 1.20, '29': 1.10,
  '30': 0.70, '31': 0.90, '32': 1.80, '33': 2.20, '34': 2.00,
  '35': 1.90, '36': 2.40, '37': 2.10, '38': 2.50, '39': 2.40,
  '40': 2.20, '41': 2.30, '42': 3.30, '43': 3.10, '44': 2.70,
  '45': 0.60, '46': 2.40, '47': 2.50, '48': 1.70, '49': 2.50,
  '50': 2.10, '51': 3.80, '52': 0.70,
};

const PROGRESS_2025_BY_AREA: Record<string, Record<string, number>> = {
  'COSECHA AGRICOLA': {
    '20': 0.00, '21': 0.00, '22': 0.10, '23': 0.20, '24': 0.20,
    '25': 0.60, '26': 0.50, '27': 0.30, '28': 0.30, '29': 0.20,
    '30': 0.30, '31': 0.10, '32': 0.10, '33': 0.40, '34': 0.20,
    '35': 0.40, '36': 0.50, '37': 0.30, '38': 0.40, '39': 0.40,
    '40': 0.60, '41': 0.50, '42': 0.80, '43': 0.70, '44': 0.70,
    '45': 0.20, '46': 0.40, '47': 0.30, '48': 0.40, '49': 0.40,
  },
  'MECANICA DE TRANSPORTE': {
    '21': 0.60, '22': 0.20, '24': 0.30, '26': 0.10, '32': 0.10,
    '33': 0.30, '36': 0.20, '37': 0.20, '38': 0.40, '39': 0.10,
    '40': 0.10, '41': 0.40, '42': 0.20, '43': 0.10, '44': 0.20,
    '46': 0.10,
  },
  'ENGRASE': {
    '24': 0.10, '25': 0.10, '26': 0.10, '27': 0.10, '28': 0.00,
    '29': 0.00, '30': 0.10, '31': 0.10, '32': 0.10, '33': 0.30,
    '34': 0.10, '35': 0.20, '36': 0.20, '37': 0.10, '38': 0.00,
    '39': 0.10, '40': 0.10, '41': 0.10, '42': 0.00, '43': 0.00,
    '44': 0.00,
  },
  'COSECHA MECANIZADA': {
    '20': 0.20, '21': 0.50, '22': 0.40, '23': 0.10, '24': 0.30,
    '25': 0.10, '26': 0.30, '27': 0.50, '28': 0.30, '29': 0.40,
    '30': 0.40, '31': 0.20, '32': 0.50, '33': 0.80, '34': 1.10,
    '35': 0.70, '36': 0.80, '37': 1.00, '38': 0.90, '39': 0.80,
    '40': 0.90, '41': 0.90, '42': 0.90, '43': 1.00, '44': 1.20,
    '45': 0.30, '46': 0.90, '47': 0.80, '48': 0.40, '49': 1.00,
  },
  'EQUIPO PESADO': {
    '21': 0.60, '22': 0.20, '24': 0.30, '26': 0.10, '32': 0.10,
    '33': 0.30, '36': 0.20, '37': 0.20, '38': 0.40, '39': 0.10,
    '40': 0.10, '41': 0.40, '42': 0.20, '43': 0.10, '44': 0.20,
    '46': 0.10,
  },
};

interface PersonalLossBreakdown {
  totalHours: number;
  totalEquivalent: number;
  vacaciones: number;
  incapacidad: number;
  inactivo: number;
  plazaNoCubierta: number;
}

interface WeeklyAreaSummaryInternalRow {
  area: string;
  area_corta: string;
  denominador: number;
  concluidas: number;
  personal_activo: number;
  personal_faltante: number;
  avance_real: number;
  avance_perdido: number;
  avance_perdido_operativo: number;
  avance_perdido_personal: number;
  avance_sin_retrasos: number;
  horas_perdidas_totales: number;
  horas_perdidas_operativas: number;
  horas_perdidas_personal: number;
  horas_vacaciones: number;
  horas_incapacidad: number;
  horas_inactivo: number;
  horas_plaza_no_cubierta: number;
}

const normalizeAreaKey = (area: string) => String(area || '')
  .trim()
  .toUpperCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const getWeeklyAreaShortName = (area: string) => (
  WEEKLY_AREA_SHORT_NAMES[normalizeAreaKey(area)] || area
);

const getRawStatus = (order: OrdenMantenimiento): string => String(order.Estatus || '').trim();

const hasConclusionDate = (order: OrdenMantenimiento): boolean => (
  String(order['Fecha conclusion'] || '').trim() !== ''
);

const isNrOrder = (order: OrdenMantenimiento): boolean => (
  getRawStatus(order).toUpperCase() === 'NR'
);

const isConcludedOrder = (order: OrdenMantenimiento): boolean => {
  const status = getRawStatus(order).toLowerCase();
  return hasConclusionDate(order) || status.includes('concluida') || isNrOrder(order);
};

const getMaintenanceWeek = (order: OrdenMantenimiento): string => {
  if (order.semana_conclusion !== null && order.semana_conclusion !== undefined) {
    return String(order.semana_conclusion);
  }

  return String(order.Semana || '');
};

const getConcludedBreakdown = (orders: OrdenMantenimiento[]) => (
  orders.reduce((acc, order) => {
    if (!isConcludedOrder(order)) return acc;

    acc.total += 1;
    if (isNrOrder(order)) {
      acc.nr += 1;
    } else {
      acc.concluida += 1;
    }

    return acc;
  }, { total: 0, concluida: 0, nr: 0 })
);

const getWeeksFromStart = (currentWeek: number) => {
  const weeks: string[] = [];

  for (let week = PROGRESS_2025_START_WEEK; week <= currentWeek; week += 1) {
    weeks.push(String(week));
  }

  return weeks;
};

const getProgress2025AreaWeights = (
  totalsByArea: Record<string, number>,
  totalGeneral: number
) => Object.entries(totalsByArea).reduce<Record<string, number>>((acc, [areaKey, total]) => {
  acc[areaKey] = totalGeneral > 0 ? total / totalGeneral : 0;
  return acc;
}, {});

const getProgress2025AreaGeneralContributionValue = (
  areaKey: string,
  week: string | number,
  comparisonMode: 'normalized' | 'actual'
) => {
  const dataset = PROGRESS_2025_BY_AREA[areaKey];

  if (!dataset) return 0;
  if (comparisonMode === 'actual') {
    return Number(dataset[String(week)] || 0);
  }

  const sourceWeek = PROGRESS_2025_COMPARISON_BASE_WEEK + (Number(week) - PROGRESS_2025_START_WEEK);
  return Number(dataset[String(sourceWeek)] || 0);
};

const getProgress2025AreaRelativeValue = (
  areaKey: string,
  week: string | number,
  comparisonMode: 'normalized' | 'actual',
  areaWeights: Record<string, number>
) => {
  const areaWeight = areaWeights[areaKey] || 0;
  const contribution = getProgress2025AreaGeneralContributionValue(areaKey, week, comparisonMode);

  return areaWeight > 0 ? contribution / areaWeight : 0;
};

const getProgress2025TableNormalizedValue = (week: string | number) => {
  const sourceWeek = PROGRESS_2025_COMPARISON_BASE_WEEK + (Number(week) - PROGRESS_2025_START_WEEK);
  return Number(PROGRESS_2025_GENERAL[String(sourceWeek)] || 0);
};

const getWorkingDays = (start: Date, end: Date) => {
  if (start > end) return 0;

  const holidays = new Set([
    '2026-05-01',
    '2026-11-03',
    '2026-11-04',
    '2026-11-05',
    '2026-11-10',
    '2026-11-28',
  ]);

  const current = new Date(start);
  const endDate = new Date(end);
  let count = 0;

  current.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const stamp = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;

    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.has(stamp)) {
      count += 1;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
};

const sumRoundedProgress = (realProgress: number, lostProgress: number) => {
  const roundedRealProgress = Number(realProgress.toFixed(1));
  const roundedLostProgress = Number(lostProgress.toFixed(1));
  return Number((roundedRealProgress + roundedLostProgress).toFixed(1));
};

const filterOrdersByEtapa = (orders: OrdenMantenimiento[], etapa: string) => {
  const etapaKey = normalizeAreaKey(etapa || DEFAULT_ETAPA);
  return orders.filter((order) => normalizeAreaKey(String(order.Etapa || '')) === etapaKey);
};

const getDistinctWorkedEquipmentCount = (
  orders: OrdenMantenimiento[],
  areaKey: string,
  week: string
) => {
  const equipmentIds = orders
    .filter((order) => (
      normalizeAreaKey(order.Área || '') === areaKey &&
      String(getMaintenanceWeek(order)) === String(week)
    ))
    .map((order) => String(order['ID_#EQUIPO'] || '').trim())
    .filter(Boolean);

  return new Set(equipmentIds).size;
};

const getPersonalEquivalentHours = (
  hours: number,
  areaKey: string,
  week: string,
  ordersForProration: OrdenMantenimiento[],
  shouldProrate: boolean
) => {
  const hoursPerOrder = HORAS_PER_ORDER_BY_AREA[areaKey] || 0;

  if (hoursPerOrder <= 0 || hours <= 0) return 0;
  if (!shouldProrate) return hours / hoursPerOrder;

  const workedEquipments = getDistinctWorkedEquipmentCount(ordersForProration, areaKey, week);
  return workedEquipments > 0 ? Math.round(hours / (workedEquipments * hoursPerOrder)) : 0;
};

const buildPersonalLossBreakdown = (
  personalRows: HorasPerdidasPersonalRow[],
  areaKey: string,
  ordersForProration: OrdenMantenimiento[],
  shouldProrate: boolean
): PersonalLossBreakdown => (
  personalRows.reduce<PersonalLossBreakdown>((acc, row) => {
    const totalHours = Number(row.horas_perdidas_totales || 0);
    const equivalent = getPersonalEquivalentHours(
      totalHours,
      areaKey,
      row.semana,
      ordersForProration,
      shouldProrate
    );

    acc.totalHours += totalHours;
    acc.totalEquivalent += equivalent;
    acc.vacaciones += Number(row.horas_vacaciones || 0);
    acc.incapacidad += Number(row.horas_incapacidad || 0);
    acc.inactivo += Number(row.horas_inactivo || 0);
    acc.plazaNoCubierta += Number(row.horas_plaza_no_cubierta || 0);
    return acc;
  }, {
    totalHours: 0,
    totalEquivalent: 0,
    vacaciones: 0,
    incapacidad: 0,
    inactivo: 0,
    plazaNoCubierta: 0,
  })
);

const hasWeeklyAreaProgress = (row: WeeklyAreaSummaryInternalRow) => (
  row.concluidas > 0 ||
  row.horas_perdidas_operativas > 0 ||
  row.horas_perdidas_personal > 0
);

const buildPersonalDisponibilidadMap = (
  rows: PersonalDisponibilidadSemanalRow[]
) => new Map(
  rows.map((row) => [normalizeAreaKey(row.area), row] as const)
);

const buildWeeklyAreaSummaryRows = (
  orderList: OrdenMantenimiento[],
  horasTrabajo: ProductividadDashboardInput['horasTrabajo'],
  horasPerdidasPersonal: ProductividadDashboardInput['horasPerdidasPersonal'],
  personalDisponibilidadSemanal: ProductividadDashboardInput['personalDisponibilidadSemanal'],
  weeks: Set<string>
): WeeklyAreaSummaryInternalRow[] => {
  const disponibilidadPorArea = buildPersonalDisponibilidadMap(personalDisponibilidadSemanal);

  const areaKeys = Array.from(new Set(
    orderList
      .map((order) => normalizeAreaKey(order.Área || ''))
      .filter((areaKey) => areaKey && WEEKLY_AREA_KEYS.has(areaKey))
  ));

  return areaKeys.map((areaKey) => {
    const areaOrders = orderList.filter((order) => normalizeAreaKey(order.Área || '') === areaKey);
    const concluded = areaOrders.filter((order) => (
      weeks.has(getMaintenanceWeek(order)) && isConcludedOrder(order)
    )).length;

    const operationalRows = horasTrabajo.filter((row) => {
      const rowAreaKey = normalizeAreaKey(row.area);
      const status = String(row.estatus || '').trim().toLowerCase();

      return rowAreaKey === areaKey
        && weeks.has(String(row.semana_inicio))
        && (status === 'retrasada' || status === 'ausencia');
    });

    const operationalLostEquivalent = operationalRows.reduce((sum, row) => {
      const hoursPerOrder = HORAS_PER_ORDER_BY_AREA[normalizeAreaKey(row.area)] || 0;
      return hoursPerOrder > 0 ? sum + (Number(row.horas_calculadas || 0) / hoursPerOrder) : sum;
    }, 0);

    const operationalLostHours = operationalRows.reduce((sum, row) => (
      sum + Number(row.horas_calculadas || 0)
    ), 0);

    const personalRows = horasPerdidasPersonal.filter((row) => (
      normalizeAreaKey(row.area) === areaKey &&
      weeks.has(String(row.semana))
    ));

    const personalBreakdown = buildPersonalLossBreakdown(
      personalRows,
      areaKey,
      orderList,
      false
    );

    const denominator = areaOrders.length;
    const disponibilidadArea = disponibilidadPorArea.get(areaKey);
    const realProgress = denominator > 0 ? Number(((concluded / denominator) * 100).toFixed(2)) : 0;
    const operationalLostProgress = denominator > 0
      ? Number(((operationalLostEquivalent / denominator) * 100).toFixed(2))
      : 0;
    const personalLostProgress = denominator > 0
      ? Number(((personalBreakdown.totalEquivalent / denominator) * 100).toFixed(2))
      : 0;
    const lostProgress = Number((operationalLostProgress + personalLostProgress).toFixed(2));
    const areaName = areaOrders[0]?.Área || areaKey;

    return {
      area: areaName,
      area_corta: getWeeklyAreaShortName(areaName),
      denominador: denominator,
      concluidas: concluded,
      personal_activo: Number(Number(disponibilidadArea?.personal_activo || 0).toFixed(2)),
      personal_faltante: Number(Number(disponibilidadArea?.personal_faltante || 0).toFixed(2)),
      avance_real: realProgress,
      avance_perdido: lostProgress,
      avance_perdido_operativo: operationalLostProgress,
      avance_perdido_personal: personalLostProgress,
      avance_sin_retrasos: sumRoundedProgress(realProgress, lostProgress),
      horas_perdidas_totales: Number((operationalLostHours + personalBreakdown.totalHours).toFixed(2)),
      horas_perdidas_operativas: Number(operationalLostHours.toFixed(2)),
      horas_perdidas_personal: Number(personalBreakdown.totalHours.toFixed(2)),
      horas_vacaciones: Number(personalBreakdown.vacaciones.toFixed(2)),
      horas_incapacidad: Number(personalBreakdown.incapacidad.toFixed(2)),
      horas_inactivo: Number(personalBreakdown.inactivo.toFixed(2)),
      horas_plaza_no_cubierta: Number(personalBreakdown.plazaNoCubierta.toFixed(2)),
    };
  }).sort((left, right) => right.avance_perdido - left.avance_perdido);
};

export const buildProductividadSemanalDashboardTables = (
  input: ProductividadDashboardInput
): ProductividadDashboardTableItem[] => {
  const currentWeek = String(getWeekNumber(input.currentDate));
  const currentWeekNumber = Number(currentWeek);
  const etapa = input.etapa || DEFAULT_ETAPA;
  const filteredOrders = filterOrdersByEtapa(input.orders, etapa);
  const areaWeights = getProgress2025AreaWeights(
    input.zafraOrderTotalsByArea,
    input.zafraOrderTotalsGeneral
  );
  const metaBase: ProductividadDashboardMeta = {
    etapa,
    semanaActual: currentWeek,
    semanaReferencia: currentWeek,
  };

  const idealVsRealRows = (() => {
    const startDate = new Date(2026, 3, 6);
    const endDate = new Date(2026, 10, 30);
    const actualEndDate = input.currentDate > endDate ? endDate : input.currentDate;
    const totalWorkingDays = getWorkingDays(startDate, endDate);
    const elapsedWorkingDays = getWorkingDays(startDate, actualEndDate);
    const idealProgress = totalWorkingDays > 0
      ? (elapsedWorkingDays / totalWorkingDays) * 100
      : 0;
    const ignoredAreas = new Set(['TEST', 'SERVICIOS GENERALES']);
    const areas = Array.from(new Set(
      filteredOrders
        .filter((order) => order.Área && !ignoredAreas.has(normalizeAreaKey(order.Área)))
        .map((order) => String(order.Área))
    ));

    const rows = areas.map<AvanceIdealVsRealRow>((area) => {
      const areaOrders = filteredOrders.filter((order) => order.Área === area);
      const total = areaOrders.length;
      const concluded = areaOrders.filter(isConcludedOrder).length;
      const actualProgress = total > 0 ? (concluded / total) * 100 : 0;

      return {
        area,
        area_corta: getWeeklyAreaShortName(area),
        avance_ideal: Number(idealProgress.toFixed(2)),
        avance_real: Number(actualProgress.toFixed(2)),
        diferencia: Number((actualProgress - idealProgress).toFixed(2)),
        ordenes_ideales: Math.round(total * (idealProgress / 100)),
        ordenes_reales: concluded,
        ordenes_totales: total,
      };
    }).sort((left, right) => right.avance_real - left.avance_real);

    const totalOrders = filteredOrders.filter((order) => (
      order.Área && !ignoredAreas.has(normalizeAreaKey(order.Área))
    ));
    const concludedTotal = totalOrders.filter(isConcludedOrder).length;
    const totalCount = totalOrders.length;

    const totalRow: AvanceIdealVsRealRow | null = {
      area: 'TOTAL',
      area_corta: 'TOTAL',
      avance_ideal: Number(idealProgress.toFixed(2)),
      avance_real: totalCount > 0 ? Number(((concludedTotal / totalCount) * 100).toFixed(2)) : 0,
      diferencia: 0,
      ordenes_ideales: Math.round(totalCount * (idealProgress / 100)),
      ordenes_reales: concludedTotal,
      ordenes_totales: totalCount,
    };

    totalRow.diferencia = Number((totalRow.avance_real - totalRow.avance_ideal).toFixed(2));
    return { rows, totalRow };
  })();

  const weeklyConcluded = (() => {
    const previousWeek = currentWeekNumber - 1;
    const areaKeys = Array.from(new Set(
      filteredOrders.map((order) => normalizeAreaKey(order.Área || '')).filter(Boolean)
    ));

    const toPercent = (count: number, denominator: number) => (
      denominator > 0 ? Number(((count / denominator) * 100).toFixed(2)) : 0
    );

    const buildRow = (areaOrders: OrdenMantenimiento[], area: string): AvanceConcluidoSemanalRow => {
      const denominator = areaOrders.length;
      const concludedOrders = areaOrders.filter(isConcludedOrder);
      const previousConcluded = concludedOrders.filter((order) => {
        const week = Number(getMaintenanceWeek(order));
        return Number.isFinite(week) && week <= previousWeek;
      }).length;
      const currentConcluded = concludedOrders.length;
      const thisWeekConcluded = Math.max(currentConcluded - previousConcluded, 0);

      return {
        area,
        area_corta: getWeeklyAreaShortName(area),
        avance_semana_anterior: toPercent(previousConcluded, denominator),
        avance_semana_actual: toPercent(thisWeekConcluded, denominator),
        avance_acumulado: toPercent(currentConcluded, denominator),
        concluidas_semana_anterior: previousConcluded,
        concluidas_semana_actual: thisWeekConcluded,
        concluidas_acumuladas: currentConcluded,
      };
    };

    const rows = areaKeys.map((areaKey) => {
      const areaOrders = filteredOrders.filter((order) => normalizeAreaKey(order.Área || '') === areaKey);
      return buildRow(areaOrders, areaOrders[0]?.Área || areaKey);
    }).sort((left, right) => right.avance_acumulado - left.avance_acumulado);

    return {
      rows,
      totalRow: buildRow(filteredOrders, 'TOTAL'),
    };
  })();

  const equivalent = (() => {
    const weeks = getWeeksFromStart(currentWeekNumber);
    const areaKeys = Array.from(new Set(
      filteredOrders
        .map((order) => normalizeAreaKey(order.Área || ''))
        .filter((areaKey) => areaKey && PROGRESS_2025_BY_AREA[areaKey])
    ));
    const generalTotal = filteredOrders.length;

    const rows = areaKeys.map<AvanceEquivalenteRow>((areaKey) => {
      const areaOrders = filteredOrders.filter((order) => normalizeAreaKey(order.Área || '') === areaKey);
      const concluded = areaOrders.filter((order) => (
        weeks.includes(getMaintenanceWeek(order)) && isConcludedOrder(order)
      )).length;
      const total = areaOrders.length;
      const avance2026 = total > 0 ? Number(((concluded / total) * 100).toFixed(2)) : 0;
      const avance2025 = Math.min(weeks.reduce((sum, week) => (
        sum + getProgress2025AreaRelativeValue(areaKey, week, 'normalized', areaWeights)
      ), 0), 100);
      const areaName = areaOrders[0]?.Área || areaKey;

      return {
        area: areaName,
        area_corta: getWeeklyAreaShortName(areaName),
        avance_2026: avance2026,
        avance_2025: Number(avance2025.toFixed(2)),
        diferencia: Number((avance2026 - avance2025).toFixed(2)),
        concluidas: concluded,
        ordenes_totales: total,
      };
    }).sort((left, right) => right.avance_2026 - left.avance_2026);

    const totalConcluded = rows.reduce((sum, row) => sum + row.concluidas, 0);
    const total2025 = Math.min(weeks.reduce((sum, week) => (
      sum + getProgress2025TableNormalizedValue(week)
    ), 0), 100);

    return {
      rows,
      totalRow: {
        area: 'TOTAL',
        area_corta: 'TOTAL',
        avance_2026: generalTotal > 0 ? Number(((totalConcluded / generalTotal) * 100).toFixed(2)) : 0,
        avance_2025: Number(total2025.toFixed(2)),
        diferencia: Number((((generalTotal > 0 ? (totalConcluded / generalTotal) * 100 : 0) - total2025).toFixed(2))),
        concluidas: totalConcluded,
        ordenes_totales: generalTotal,
      } satisfies AvanceEquivalenteRow,
    };
  })();

  const allWeeksSet = new Set(getWeeksFromStart(currentWeekNumber));
  const weeklySummaryGeneralRows = buildWeeklyAreaSummaryRows(
    filteredOrders,
    input.horasTrabajo,
    input.horasPerdidasPersonal,
    input.personalDisponibilidadSemanal,
    allWeeksSet
  );
  const weeklySummaryCurrentWeekRows = buildWeeklyAreaSummaryRows(
    filteredOrders,
    input.horasTrabajo,
    input.horasPerdidasPersonal,
    input.personalDisponibilidadSemanal,
    new Set([currentWeek])
  );
  const referenceWeek = (() => {
    const currentWeekRows = buildWeeklyAreaSummaryRows(
      filteredOrders,
        input.horasTrabajo,
        input.horasPerdidasPersonal,
        input.personalDisponibilidadSemanal,
        new Set([currentWeek])
      );

    if (currentWeekRows.some(hasWeeklyAreaProgress)) {
      return currentWeek;
    }

    const weeks = getWeeksFromStart(currentWeekNumber).slice().reverse();
    const fallbackWeek = weeks.find((week) => (
      buildWeeklyAreaSummaryRows(
        filteredOrders,
        input.horasTrabajo,
        input.horasPerdidasPersonal,
        input.personalDisponibilidadSemanal,
        new Set([week])
      ).some(hasWeeklyAreaProgress)
    ));

    return fallbackWeek || currentWeek;
  })();

  const weeklySummaryReferenceRows = buildWeeklyAreaSummaryRows(
    filteredOrders,
    input.horasTrabajo,
    input.horasPerdidasPersonal,
    input.personalDisponibilidadSemanal,
    new Set([referenceWeek])
  );

  const metaGeneral: ProductividadDashboardMeta = {
    ...metaBase,
    semanaReferencia: referenceWeek,
  };

  const buildWeeklySummaryTotal = (rows: WeeklyAreaSummaryInternalRow[]): WeeklyAreaSummaryInternalRow | null => {
    if (rows.length === 0) return null;

    const denominador = rows.reduce((sum, row) => sum + row.denominador, 0);
    const concluidas = rows.reduce((sum, row) => sum + row.concluidas, 0);
    const personalActivo = rows.reduce((sum, row) => sum + row.personal_activo, 0);
    const personalFaltante = rows.reduce((sum, row) => sum + row.personal_faltante, 0);
    const horasOperativas = rows.reduce((sum, row) => sum + row.horas_perdidas_operativas, 0);
    const horasPersonal = rows.reduce((sum, row) => sum + row.horas_perdidas_personal, 0);
    const equivalentOperativas = rows.reduce((sum, row) => {
      const hoursPerOrder = HORAS_PER_ORDER_BY_AREA[normalizeAreaKey(row.area)] || 0;
      return hoursPerOrder > 0 ? sum + (row.horas_perdidas_operativas / hoursPerOrder) : sum;
    }, 0);
    const equivalentPersonal = rows.reduce((sum, row) => {
      const hoursPerOrder = HORAS_PER_ORDER_BY_AREA[normalizeAreaKey(row.area)] || 0;
      return hoursPerOrder > 0 ? sum + (row.horas_perdidas_personal / hoursPerOrder) : sum;
    }, 0);
    const avanceReal = denominador > 0 ? Number(((concluidas / denominador) * 100).toFixed(2)) : 0;
    const avanceOperativo = denominador > 0 ? Number(((equivalentOperativas / denominador) * 100).toFixed(2)) : 0;
    const avancePersonal = denominador > 0 ? Number(((equivalentPersonal / denominador) * 100).toFixed(2)) : 0;
    const avancePerdido = Number((avanceOperativo + avancePersonal).toFixed(2));

    return {
      area: 'TOTAL',
      area_corta: 'TOTAL',
      denominador,
      concluidas,
      personal_activo: Number(personalActivo.toFixed(2)),
      personal_faltante: Number(personalFaltante.toFixed(2)),
      avance_real: avanceReal,
      avance_perdido: avancePerdido,
      avance_perdido_operativo: avanceOperativo,
      avance_perdido_personal: avancePersonal,
      avance_sin_retrasos: sumRoundedProgress(avanceReal, avancePerdido),
      horas_perdidas_totales: Number((horasOperativas + horasPersonal).toFixed(2)),
      horas_perdidas_operativas: Number(horasOperativas.toFixed(2)),
      horas_perdidas_personal: Number(horasPersonal.toFixed(2)),
      horas_vacaciones: Number(rows.reduce((sum, row) => sum + row.horas_vacaciones, 0).toFixed(2)),
      horas_incapacidad: Number(rows.reduce((sum, row) => sum + row.horas_incapacidad, 0).toFixed(2)),
      horas_inactivo: Number(rows.reduce((sum, row) => sum + row.horas_inactivo, 0).toFixed(2)),
      horas_plaza_no_cubierta: Number(rows.reduce((sum, row) => sum + row.horas_plaza_no_cubierta, 0).toFixed(2)),
    };
  };

  const summaryToRealVsAproximadoRow = (
    row: WeeklyAreaSummaryInternalRow
  ): AvanceRealVsAproximadoRow => ({
    area: row.area,
    area_corta: row.area_corta,
    denominador: row.denominador,
    concluidas: row.concluidas,
    personal_activo: row.personal_activo,
    personal_faltante: row.personal_faltante,
    avance_real: row.avance_real,
    avance_perdido: row.avance_perdido,
    avance_perdido_operativo: row.avance_perdido_operativo,
    avance_perdido_personal: row.avance_perdido_personal,
    avance_sin_retrasos: row.avance_sin_retrasos,
    horas_perdidas_totales: row.horas_perdidas_totales,
    horas_perdidas_operativas: row.horas_perdidas_operativas,
    horas_perdidas_personal: row.horas_perdidas_personal,
  });

  const summaryToPersonalRow = (
    row: WeeklyAreaSummaryInternalRow
  ): AvancePerdidoPersonalRow => ({
    area: row.area,
    area_corta: row.area_corta,
    denominador: row.denominador,
    personal_activo: row.personal_activo,
    personal_faltante: row.personal_faltante,
    avance_perdido_personal: row.avance_perdido_personal,
    horas_perdidas_personal: row.horas_perdidas_personal,
    horas_vacaciones: row.horas_vacaciones,
    horas_incapacidad: row.horas_incapacidad,
    horas_inactivo: row.horas_inactivo,
    horas_plaza_no_cubierta: row.horas_plaza_no_cubierta,
  });

  const weeklyGeneralTotal = buildWeeklySummaryTotal(weeklySummaryGeneralRows);
  const weeklyCurrentWeekTotal = buildWeeklySummaryTotal(weeklySummaryCurrentWeekRows);
  const weeklyReferenceTotal = buildWeeklySummaryTotal(weeklySummaryReferenceRows);

  return [
    {
      tabla: 'avance_ideal_vs_real',
      scope: 'general',
      columnas: [
        { key: 'area', label: 'Area' },
        { key: 'avance_ideal', label: 'Avance ideal' },
        { key: 'avance_real', label: 'Avance real' },
        { key: 'diferencia', label: 'Diferencia' },
        { key: 'ordenes_ideales', label: 'Ordenes ideales' },
        { key: 'ordenes_reales', label: 'Ordenes reales' },
        { key: 'ordenes_totales', label: 'Ordenes totales' },
      ],
      filas: idealVsRealRows.rows,
      total: idealVsRealRows.totalRow,
      meta: metaGeneral,
    },
    {
      tabla: 'avance_concluido_semanal',
      scope: 'semana_actual',
      columnas: [
        { key: 'area', label: 'Area' },
        { key: 'avance_semana_anterior', label: 'Avance semana anterior' },
        { key: 'avance_semana_actual', label: 'Avance semana actual' },
        { key: 'avance_acumulado', label: 'Avance acumulado' },
      ],
      filas: weeklyConcluded.rows,
      total: weeklyConcluded.totalRow,
      meta: metaGeneral,
    },
    {
      tabla: 'avance_equivalente',
      scope: 'general',
      columnas: [
        { key: 'area', label: 'Area' },
        { key: 'avance_2026', label: 'Avance 2026' },
        { key: 'avance_2025', label: 'Avance 2025' },
        { key: 'diferencia', label: 'Diferencia' },
      ],
      filas: equivalent.rows,
      total: equivalent.totalRow,
      meta: metaGeneral,
    },
    {
      tabla: 'avance_real_vs_avance_aproximado_sin_retrasos',
      scope: 'semana_actual',
      columnas: [
        { key: 'area', label: 'Area' },
        { key: 'personal_activo', label: 'Personal activo' },
        { key: 'personal_faltante', label: 'Personal faltante' },
        { key: 'avance_real', label: 'Avance real' },
        { key: 'avance_perdido', label: 'Avance perdido' },
        { key: 'avance_perdido_operativo', label: 'Pérdida operativa' },
        { key: 'avance_perdido_personal', label: 'Falta de personal' },
        { key: 'avance_sin_retrasos', label: 'Avance sin retrasos' },
      ],
      filas: weeklySummaryCurrentWeekRows.map(summaryToRealVsAproximadoRow),
      total: weeklyCurrentWeekTotal ? summaryToRealVsAproximadoRow(weeklyCurrentWeekTotal) : null,
      meta: metaGeneral,
    },
    {
      tabla: 'avance_real_vs_avance_aproximado_sin_retrasos',
      scope: 'general',
      columnas: [
        { key: 'area', label: 'Area' },
        { key: 'personal_activo', label: 'Personal activo' },
        { key: 'personal_faltante', label: 'Personal faltante' },
        { key: 'avance_real', label: 'Avance real' },
        { key: 'avance_perdido', label: 'Avance perdido' },
        { key: 'avance_perdido_operativo', label: 'Pérdida operativa' },
        { key: 'avance_perdido_personal', label: 'Falta de personal' },
        { key: 'avance_sin_retrasos', label: 'Avance sin retrasos' },
      ],
      filas: weeklySummaryGeneralRows.map(summaryToRealVsAproximadoRow),
      total: weeklyGeneralTotal ? summaryToRealVsAproximadoRow(weeklyGeneralTotal) : null,
      meta: metaGeneral,
    },
    {
      tabla: 'avance_real_vs_avance_aproximado_sin_retrasos',
      scope: 'semana_referencia',
      columnas: [
        { key: 'area', label: 'Area' },
        { key: 'personal_activo', label: 'Personal activo' },
        { key: 'personal_faltante', label: 'Personal faltante' },
        { key: 'avance_real', label: 'Avance real' },
        { key: 'avance_perdido', label: 'Avance perdido' },
        { key: 'avance_perdido_operativo', label: 'Pérdida operativa' },
        { key: 'avance_perdido_personal', label: 'Falta de personal' },
        { key: 'avance_sin_retrasos', label: 'Avance sin retrasos' },
      ],
      filas: weeklySummaryReferenceRows.map(summaryToRealVsAproximadoRow),
      total: weeklyReferenceTotal ? summaryToRealVsAproximadoRow(weeklyReferenceTotal) : null,
      meta: metaGeneral,
    },
    {
      tabla: 'avance_perdido_por_falta_de_personal',
      scope: 'semana_actual',
      columnas: [
        { key: 'area', label: 'Area' },
        { key: 'personal_activo', label: 'Personal activo' },
        { key: 'personal_faltante', label: 'Personal faltante' },
        { key: 'avance_perdido_personal', label: 'Avance perdido personal' },
        { key: 'horas_perdidas_personal', label: 'Horas perdidas personal' },
        { key: 'horas_vacaciones', label: 'Vacaciones' },
        { key: 'horas_incapacidad', label: 'Incapacidad' },
        { key: 'horas_inactivo', label: 'Inactivo' },
        { key: 'horas_plaza_no_cubierta', label: 'Plaza no cubierta' },
      ],
      filas: weeklySummaryCurrentWeekRows.map(summaryToPersonalRow),
      total: weeklyCurrentWeekTotal ? summaryToPersonalRow(weeklyCurrentWeekTotal) : null,
      meta: metaGeneral,
    },
    {
      tabla: 'avance_perdido_por_falta_de_personal',
      scope: 'general',
      columnas: [
        { key: 'area', label: 'Area' },
        { key: 'personal_activo', label: 'Personal activo' },
        { key: 'personal_faltante', label: 'Personal faltante' },
        { key: 'avance_perdido_personal', label: 'Avance perdido personal' },
        { key: 'horas_perdidas_personal', label: 'Horas perdidas personal' },
        { key: 'horas_vacaciones', label: 'Vacaciones' },
        { key: 'horas_incapacidad', label: 'Incapacidad' },
        { key: 'horas_inactivo', label: 'Inactivo' },
        { key: 'horas_plaza_no_cubierta', label: 'Plaza no cubierta' },
      ],
      filas: weeklySummaryGeneralRows.map(summaryToPersonalRow),
      total: weeklyGeneralTotal ? summaryToPersonalRow(weeklyGeneralTotal) : null,
      meta: metaGeneral,
    },
    {
      tabla: 'avance_perdido_por_falta_de_personal',
      scope: 'semana_referencia',
      columnas: [
        { key: 'area', label: 'Area' },
        { key: 'personal_activo', label: 'Personal activo' },
        { key: 'personal_faltante', label: 'Personal faltante' },
        { key: 'avance_perdido_personal', label: 'Avance perdido personal' },
        { key: 'horas_perdidas_personal', label: 'Horas perdidas personal' },
        { key: 'horas_vacaciones', label: 'Vacaciones' },
        { key: 'horas_incapacidad', label: 'Incapacidad' },
        { key: 'horas_inactivo', label: 'Inactivo' },
        { key: 'horas_plaza_no_cubierta', label: 'Plaza no cubierta' },
      ],
      filas: weeklySummaryReferenceRows.map(summaryToPersonalRow),
      total: weeklyReferenceTotal ? summaryToPersonalRow(weeklyReferenceTotal) : null,
      meta: metaGeneral,
    },
  ];
};
