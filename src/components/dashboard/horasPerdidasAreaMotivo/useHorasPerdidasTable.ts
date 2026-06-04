import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useHorasPerdidasAreaMotivoStore } from '@/stores/db_mantenimiento/horas_perdidas_area_motivo/horasPerdidasAreaMotivo.store';
import { formatWorkDaysFromHours } from '@/utils/dashboardFormatters';
import type {
  HorasPerdidasAreaMotivoTableRow,
  HorasPerdidasMotivoPorAreaItem,
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

  return `${formatNumberLabel(percentage)}%|${formatWorkDaysFromHours(hours)}`;
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

const buildTableRows = (
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

    areaLossTotals.set(areaKey, roundToTwoDecimals(totalLoss));
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
      const horasPerdidas = roundToTwoDecimals(Number(row.horas_perdidas || 0));
      const porcentajePerdidaAvance = hoursPerOrder > 0 && orderTotal > 0
        ? roundToTwoDecimals(((horasPerdidas / hoursPerOrder) / orderTotal) * 100)
        : 0;

      return {
        id: `${normalizedAreaKey}-${row.motivo}-${index}`,
        area: row.area,
        areaCorta: formatAreaName(row.area, areaShortNames),
        motivo: row.motivo,
        horasPerdidas,
        tiempoPerdido: formatWorkDaysFromHours(horasPerdidas, false),
        cantidadPersonal: roundToTwoDecimals(Number(row.mecanicos_necesarios_redondeado || 0)),
        personalActivo: roundToTwoDecimals(Number(row.personal_activo_actual || personalActivo || 0)),
        porcentajeArea: roundToTwoDecimals(Number(row.porcentaje_area || 0)),
        porcentajePerdidaAvance,
        motivoLabel: row.motivo,
        porcentajePerdidaAvanceLabel: buildLostProgressLabel(porcentajePerdidaAvance, horasPerdidas),
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

  const totalRow: HorasPerdidasAreaMotivoTableRow = {
    id: 'total-general',
    area: 'TOTAL',
    areaCorta: 'TOTAL',
    motivo: 'Total general',
    horasPerdidas: roundToTwoDecimals(totalHorasPerdidas),
    tiempoPerdido: formatWorkDaysFromHours(totalHorasPerdidas, false),
    cantidadPersonal: roundToTwoDecimals(totalCantidadPersonal),
    personalActivo: totalPersonalActivo,
    porcentajeArea: 100,
    porcentajePerdidaAvance: currentOrderTotalsGeneral > 0
      ? roundToTwoDecimals((totalEquivalent / currentOrderTotalsGeneral) * 100)
      : 0,
    motivoLabel: 'Total general',
    porcentajePerdidaAvanceLabel: buildLostProgressLabel(
      currentOrderTotalsGeneral > 0
        ? roundToTwoDecimals((totalEquivalent / currentOrderTotalsGeneral) * 100)
        : 0,
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

  const tableRows = computed<HorasPerdidasAreaMotivoTableRow[]>(() => (
    buildTableRows(
      resumenActual.value,
      areaShortNames,
      hoursPerOrderByArea,
      currentOrderTotalsByArea,
      currentOrderTotalsGeneral
    )
  ));

  const hasRows = computed<boolean>(() => tableRows.value.length > 0);

  return {
    cargarResumen: store.cargarResumen,
    resumenActual,
    tableRows,
    hasRows,
    fechaConsultada,
    isLoading,
    isLoaded,
    error,
    formatAreaName: (area: string) => formatAreaName(area, areaShortNames),
  };
};
