import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useHorasPerdidasAreaMotivoStore } from '@/stores/db_mantenimiento/horas_perdidas_area_motivo/horasPerdidasAreaMotivo.store';
import type {
  HorasPerdidasAreaMotivoTableRow,
  HorasPerdidasMotivoPorAreaItem,
  HorasPerdidasPersonalResumenItem,
} from '@/stores/db_mantenimiento/horas_perdidas_area_motivo/horasPerdidasAreaMotivo.types';

export interface UseHorasPerdidasTableOptions {
  areaShortNames: Record<string, string>;
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
  areaShortNames: Record<string, string>
): HorasPerdidasAreaMotivoTableRow[] => {
  if (!resumen?.motivos_por_area.length) {
    return [];
  }

  return groupRowsByArea(resumen.motivos_por_area).flatMap((group) => (
    group.map((row, index) => ({
      id: `${normalizeAreaKey(row.area)}-${row.motivo}-${index}`,
      area: row.area,
      areaCorta: formatAreaName(row.area, areaShortNames),
      motivo: row.motivo,
      horasPerdidas: row.horas_perdidas,
      cantidadPersonal: row.mecanicos_necesarios_redondeado,
      porcentajeArea: row.porcentaje_area,
      rowspan: index === 0 ? group.length : 0,
      mostrarArea: index === 0,
    }))
  ));
};

export const useHorasPerdidasTable = (
  options: UseHorasPerdidasTableOptions
) => {
  const store = useHorasPerdidasAreaMotivoStore();
  const { resumen, fechaConsultada, isLoading, isLoaded, error } = storeToRefs(store);
  const { areaShortNames } = options;

  const resumenActual = computed<HorasPerdidasPersonalResumenItem | null>(() => (
    resumen.value
  ));

  const tableRows = computed<HorasPerdidasAreaMotivoTableRow[]>(() => (
    buildTableRows(resumenActual.value, areaShortNames)
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
