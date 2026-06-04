import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useHorasPerdidasAreaMotivoStore } from '@/stores/db_mantenimiento/horas_perdidas_area_motivo/horasPerdidasAreaMotivo.store';
import { formatWorkDaysFromHours } from '@/utils/dashboardFormatters';
import type {
  HorasPerdidasAreaResumenTableRow,
  HorasPerdidasAreaMotivoTableRow,
  HorasPerdidasMotivoPorAreaItem,
  HorasPerdidasPorAreaItem,
  HorasPerdidasPersonalResumenItem,
} from '@/stores/db_mantenimiento/horas_perdidas_area_motivo/horasPerdidasAreaMotivo.types';

export interface UseHorasPerdidasTableOptions {
  areaShortNames: Record<string, string>;
  hoursPerOrderByArea: Record<string, number>;
  currentOrderTotalsByArea: Record<string, number>;
  currentOrderTotalsGeneral: number;
}

const normalizeAreaKey = (area: string): string => String(area || '')
  .trim()
  .toUpperCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const formatAreaName = (
  area: string,
  areaShortNames: Record<string, string>
): string => (
  areaShortNames[normalizeAreaKey(area)] || area
);

const roundToTwoDecimals = (value: number): number => (
  Number(value.toFixed(2))
);

const roundToOneDecimal = (value: number): number => (
  Number(value.toFixed(1))
);

const formatNumberLabel = (value: number): string => (
  Number.isInteger(value) ? String(value) : Number(value.toFixed(2)).toString()
);

const buildLostProgressLabel = (
  percentage: number,
  hours: number,
  hideValue = false
): string => {
  if (hideValue) return '-';

  return `${percentage.toFixed(1)}%|${formatWorkDaysFromHours(hours)}`;
};

const groupRowsByArea = (
  rows: HorasPerdidasMotivoPorAreaItem[]
): HorasPerdidasMotivoPorAreaItem[][] => {
  const groups = new Map<string, HorasPerdidasMotivoPorAreaItem[]>();
  const orderedKeys: string[] = [];

  rows.forEach((row) => {
    const areaKey = normalizeAreaKey(row.area);

    if (!groups.has(areaKey)) {
      groups.set(areaKey, []);
      orderedKeys.push(areaKey);
    }

    groups.get(areaKey)?.push(row);
  });

  return orderedKeys.map((key) => groups.get(key) || []);
};

const buildMotivoTableRows = (
  resumen: HorasPerdidasPersonalResumenItem | null,
  areaShortNames: Record<string, string>,
  hoursPerOrderByArea: Record<string, number>,
  currentOrderTotalsByArea: Record<string, number>,
  currentOrderTotalsGeneral: number
): HorasPerdidasAreaMotivoTableRow[] => {
  const scopedAreaKeys = [
    ...Object.keys(currentOrderTotalsByArea),
    ...((resumen?.motivos_por_area || []).map((row) => normalizeAreaKey(row.area))),
  ];
  const fallbackAreaKeys = [
    ...Object.keys(areaShortNames),
    ...Object.keys(hoursPerOrderByArea),
  ];
  const areaKeys = Array.from(new Set(
    (scopedAreaKeys.length > 0 ? scopedAreaKeys : fallbackAreaKeys).filter(Boolean)
  ));

  if (!areaKeys.length) {
    return [];
  }

  const detailSourceRows = resumen?.motivos_por_area || [];
  const groupedRows = groupRowsByArea(detailSourceRows);
  const groupedByAreaKey = new Map(
    groupedRows.map((group) => [
      normalizeAreaKey(group[0]?.area || ''),
      [...group].sort((a, b) => Number(b.horas_perdidas || 0) - Number(a.horas_perdidas || 0))
    ])
  );
  const personalActivoByAreaKey = new Map(
    (resumen?.por_area || []).map((row) => [normalizeAreaKey(row.area), Number(row.personal_activo_actual || 0)])
  );
  const areaLossTotals = new Map<string, number>();

  areaKeys.forEach((areaKey) => {
    const group = groupedByAreaKey.get(areaKey) || [];
    const totalLoss = group.reduce((sum, row) => {
      const hoursPerOrder = hoursPerOrderByArea[areaKey] || 0;
      const orderTotal = currentOrderTotalsByArea[areaKey] || 0;

      if (hoursPerOrder <= 0 || orderTotal <= 0) return sum;

      return sum + (((Number(row.horas_perdidas || 0) / hoursPerOrder) / orderTotal) * 100);
    }, 0);

    areaLossTotals.set(areaKey, roundToOneDecimal(totalLoss));
  });

  const sortedAreaKeys = [...areaKeys].sort((a, b) => {
    const difference = (areaLossTotals.get(b) || 0) - (areaLossTotals.get(a) || 0);

    if (difference !== 0) return difference;

    return formatAreaName(a, areaShortNames).localeCompare(formatAreaName(b, areaShortNames), 'es');
  });

  const detailRows = sortedAreaKeys.flatMap((areaKey) => {
    const group = groupedByAreaKey.get(areaKey);
    const personalActivo = personalActivoByAreaKey.get(areaKey) || 0;

    if (!group?.length) {
      return [{
        id: `${areaKey}-sin-datos`,
        area: areaKey,
        areaCorta: formatAreaName(areaKey, areaShortNames),
        motivo: '-',
        horasPerdidas: 0,
        tiempoPerdido: '-',
        cantidadPersonal: 0,
        personalActivo,
        porcentajeArea: 0,
        porcentajePerdidaAvance: 0,
        motivoLabel: '-',
        porcentajePerdidaAvanceLabel: '-',
        personalFaltanteLabel: '-',
        personalActivoLabel: '-',
        rowspan: 1,
        mostrarArea: true,
        esFilaTotal: false,
        sinDatos: true,
      }];
    }

    return group.map((row, index) => {
      const normalizedAreaKey = normalizeAreaKey(row.area);
      const hoursPerOrder = hoursPerOrderByArea[normalizedAreaKey] || 0;
      const orderTotal = currentOrderTotalsByArea[normalizedAreaKey] || 0;
      const horasPerdidasRaw = Number(row.horas_perdidas || 0);
      const porcentajePerdidaAvance = hoursPerOrder > 0 && orderTotal > 0
        ? roundToOneDecimal(((horasPerdidasRaw / hoursPerOrder) / orderTotal) * 100)
        : 0;

      return {
        id: `${normalizedAreaKey}-${row.motivo}-${index}`,
        area: row.area,
        areaCorta: formatAreaName(row.area, areaShortNames),
        motivo: row.motivo,
        horasPerdidas: roundToTwoDecimals(horasPerdidasRaw),
        tiempoPerdido: formatWorkDaysFromHours(horasPerdidasRaw, false),
        cantidadPersonal: roundToTwoDecimals(Number(row.mecanicos_necesarios_redondeado || 0)),
        personalActivo: roundToTwoDecimals(Number(row.personal_activo_actual || personalActivo || 0)),
        porcentajeArea: roundToTwoDecimals(Number(row.porcentaje_area || 0)),
        porcentajePerdidaAvance,
        motivoLabel: row.motivo,
        porcentajePerdidaAvanceLabel: buildLostProgressLabel(porcentajePerdidaAvance, horasPerdidasRaw),
        personalFaltanteLabel: formatNumberLabel(roundToTwoDecimals(Number(row.mecanicos_necesarios_redondeado || 0))),
        personalActivoLabel: formatNumberLabel(roundToTwoDecimals(Number(row.personal_activo_actual || personalActivo || 0))),
        rowspan: index === 0 ? group.length : 0,
        mostrarArea: index === 0,
        esFilaTotal: false,
        sinDatos: false,
      };
    });
  });

  const totalHorasPerdidas = detailRows.reduce((sum, row) => sum + row.horasPerdidas, 0);
  const totalCantidadPersonal = detailRows.reduce((sum, row) => sum + row.cantidadPersonal, 0);
  const totalPersonalActivo = Number(resumen?.personal_activo_actual_total || 0);
  const totalEquivalent = detailRows.reduce((sum, row) => {
    const areaKey = normalizeAreaKey(row.area);
    const hoursPerOrder = hoursPerOrderByArea[areaKey] || 0;
    return hoursPerOrder > 0 ? sum + (row.horasPerdidas / hoursPerOrder) : sum;
  }, 0);
  const totalPorcentajePerdidaAvance = currentOrderTotalsGeneral > 0
    ? roundToOneDecimal((totalEquivalent / currentOrderTotalsGeneral) * 100)
    : 0;

  const totalRow: HorasPerdidasAreaMotivoTableRow = {
    id: 'total-general',
    area: 'TOTAL',
    areaCorta: 'TOTAL',
    motivo: '',
    horasPerdidas: roundToTwoDecimals(totalHorasPerdidas),
    tiempoPerdido: formatWorkDaysFromHours(totalHorasPerdidas, false),
    cantidadPersonal: roundToTwoDecimals(totalCantidadPersonal),
    personalActivo: totalPersonalActivo,
    porcentajeArea: 100,
    porcentajePerdidaAvance: totalPorcentajePerdidaAvance,
    motivoLabel: 'Total general',
    porcentajePerdidaAvanceLabel: buildLostProgressLabel(
      totalPorcentajePerdidaAvance,
      totalHorasPerdidas
    ),
    personalFaltanteLabel: formatNumberLabel(roundToTwoDecimals(totalCantidadPersonal)),
    personalActivoLabel: formatNumberLabel(totalPersonalActivo),
    rowspan: 1,
    mostrarArea: true,
    esFilaTotal: true,
    sinDatos: false,
  };

  return [...detailRows, totalRow];
};

const buildAreaTableRows = (
  resumen: HorasPerdidasPersonalResumenItem | null,
  areaShortNames: Record<string, string>,
  hoursPerOrderByArea: Record<string, number>,
  currentOrderTotalsByArea: Record<string, number>,
  currentOrderTotalsGeneral: number
): HorasPerdidasAreaResumenTableRow[] => {
  const sourceRows = resumen?.por_area || [];
  const scopedAreaKeys = [
    ...Object.keys(currentOrderTotalsByArea),
    ...sourceRows.map((row) => normalizeAreaKey(row.area)),
  ];
  const fallbackAreaKeys = [
    ...Object.keys(areaShortNames),
    ...Object.keys(hoursPerOrderByArea),
  ];
  const areaKeys = Array.from(new Set(
    (scopedAreaKeys.length > 0 ? scopedAreaKeys : fallbackAreaKeys).filter(Boolean)
  ));

  if (!areaKeys.length) {
    return [];
  }

  const rowsByAreaKey = new Map<string, HorasPerdidasPorAreaItem>(
    sourceRows.map((row) => [normalizeAreaKey(row.area), row])
  );

  const detailRows = areaKeys.map((areaKey) => {
    const row = rowsByAreaKey.get(areaKey);
    const horasPerdidas = roundToTwoDecimals(Number(row?.horas_perdidas || 0));
    const personalFaltante = roundToTwoDecimals(Number(row?.mecanicos_necesarios_redondeado || 0));
    const personalActivo = roundToTwoDecimals(Number(row?.personal_activo_actual || 0));
    const hoursPerOrder = hoursPerOrderByArea[areaKey] || 0;
    const orderTotal = currentOrderTotalsByArea[areaKey] || 0;
    const porcentajePerdidaAvance = hoursPerOrder > 0 && orderTotal > 0
      ? roundToOneDecimal(((horasPerdidas / hoursPerOrder) / orderTotal) * 100)
      : 0;

    return {
      id: `${areaKey}-resumen`,
      area: row?.area || areaKey,
      areaCorta: formatAreaName(row?.area || areaKey, areaShortNames),
      horasPerdidas,
      personalFaltante,
      personalActivo,
      porcentajePerdidaAvance,
      horasPerdidasLabel: formatWorkDaysFromHours(horasPerdidas),
      porcentajePerdidaAvanceLabel: row
        ? buildLostProgressLabel(porcentajePerdidaAvance, horasPerdidas)
        : '-',
      personalFaltanteLabel: row ? formatNumberLabel(personalFaltante) : '-',
      personalActivoLabel: row ? formatNumberLabel(personalActivo) : '-',
      esFilaTotal: false,
      sinDatos: !row,
    };
  }).sort((a, b) => {
    const difference = b.porcentajePerdidaAvance - a.porcentajePerdidaAvance;

    if (difference !== 0) return difference;

    return a.areaCorta.localeCompare(b.areaCorta, 'es');
  });

  const totalHorasPerdidas = detailRows.reduce((sum, row) => sum + row.horasPerdidas, 0);
  const totalPersonalFaltante = detailRows.reduce((sum, row) => sum + row.personalFaltante, 0);
  const totalPersonalActivo = Number(resumen?.personal_activo_actual_total || 0);
  const totalEquivalent = detailRows.reduce((sum, row) => {
    const hoursPerOrder = hoursPerOrderByArea[normalizeAreaKey(row.area)] || 0;
    return hoursPerOrder > 0 ? sum + (row.horasPerdidas / hoursPerOrder) : sum;
  }, 0);
  const totalPorcentajePerdidaAvance = currentOrderTotalsGeneral > 0
    ? roundToOneDecimal((totalEquivalent / currentOrderTotalsGeneral) * 100)
    : 0;

  const totalRow: HorasPerdidasAreaResumenTableRow = {
    id: 'total-general-area',
    area: 'TOTAL',
    areaCorta: 'TOTAL',
    horasPerdidas: roundToTwoDecimals(totalHorasPerdidas),
    personalFaltante: roundToTwoDecimals(totalPersonalFaltante),
    personalActivo: totalPersonalActivo,
    porcentajePerdidaAvance: totalPorcentajePerdidaAvance,
    horasPerdidasLabel: formatWorkDaysFromHours(totalHorasPerdidas),
    porcentajePerdidaAvanceLabel: buildLostProgressLabel(
      totalPorcentajePerdidaAvance,
      totalHorasPerdidas
    ),
    personalFaltanteLabel: formatNumberLabel(roundToTwoDecimals(totalPersonalFaltante)),
    personalActivoLabel: formatNumberLabel(totalPersonalActivo),
    esFilaTotal: true,
    sinDatos: false,
  };

  return [...detailRows, totalRow];
};

export const useHorasPerdidasTable = (
  options: UseHorasPerdidasTableOptions
) => {
  const store = useHorasPerdidasAreaMotivoStore();
  const { resumen, fechaConsultada, isLoading, isLoaded, error } = storeToRefs(store);
  const {
    areaShortNames,
    hoursPerOrderByArea,
    currentOrderTotalsByArea,
    currentOrderTotalsGeneral,
  } = options;

  const resumenActual = computed<HorasPerdidasPersonalResumenItem | null>(() => (
    resumen.value
  ));

  const motivoTableRows = computed<HorasPerdidasAreaMotivoTableRow[]>(() => (
    buildMotivoTableRows(
      resumenActual.value,
      areaShortNames,
      hoursPerOrderByArea,
      currentOrderTotalsByArea,
      currentOrderTotalsGeneral
    )
  ));

  const areaTableRows = computed<HorasPerdidasAreaResumenTableRow[]>(() => (
    buildAreaTableRows(
      resumenActual.value,
      areaShortNames,
      hoursPerOrderByArea,
      currentOrderTotalsByArea,
      currentOrderTotalsGeneral
    )
  ));

  const hasRows = computed<boolean>(() => (
    motivoTableRows.value.length > 0 || areaTableRows.value.length > 0
  ));

  return {
    cargarResumen: store.cargarResumen,
    resumenActual,
    motivoTableRows,
    areaTableRows,
    hasRows,
    fechaConsultada,
    isLoading,
    isLoaded,
    error,
    formatAreaName: (area: string) => formatAreaName(area, areaShortNames),
  };
};
