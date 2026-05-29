import type {
  WorkOrderFormErrors,
  WorkOrderTodayDbRow,
  WorkOrderTodayRow,
  WorkOrderUpdateDbPayload,
  WorkOrderUpdatePayload,
} from './horasTrabajo.types';

export const WORK_ORDER_DELAYED_STATUSES = ['Retrasa', 'Retrasada'];

const padDatePart = (value: number): string => value.toString().padStart(2, '0');

const formatDateForDb = (date: Date): string => {
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  const hours = padDatePart(date.getHours());
  const minutes = padDatePart(date.getMinutes());
  const seconds = padDatePart(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const getLocalDateInputValue = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());

  return `${year}-${month}-${day}`;
};

export const getLocalTimestampRangeForDate = (
  dateInput: string
): { start: string; end: string } => {
  const [year, month, day] = dateInput.split('-').map(Number);
  const isValidDateInput = year && month && day;
  const baseDate = isValidDateInput
    ? new Date(year, month - 1, day)
    : new Date();

  const start = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
  );
  const end = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate() + 1,
  );

  return {
    start: formatDateForDb(start),
    end: formatDateForDb(end),
  };
};

export const getTodayLocalTimestampRange = (): { start: string; end: string } => {
  return getLocalTimestampRangeForDate(getLocalDateInputValue());
};

export const isDelayedStatus = (estatus: string | null | undefined): boolean => {
  return WORK_ORDER_DELAYED_STATUSES.includes(estatus || '');
};

export const getWorkOrderStatusSeverity = (estatus: string | null | undefined): string => {
  if (estatus === 'Concluida') return 'success';
  if (isDelayedStatus(estatus)) return 'warning';
  if (estatus === 'Ausencia') return 'danger';
  if (estatus === 'En proceso') return 'info';
  return 'secondary';
};

export const getWorkOrderReference = (row: WorkOrderTodayRow): string => {
  if (row.idOm) return `OM: ${row.idOm}`;
  if (row.idSg) return `SG: ${row.idSg.slice(0, 8)}`;
  return '—';
};

export const isTestWorkOrderArea = (row: WorkOrderTodayRow): boolean => {
  return row.area?.trim().toUpperCase() === 'TEST';
};

export const emptyText = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
};

export const formatWorkOrderDateTime = (value: string | null | undefined): string => {
  if (!value) return '—';

  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('es-PA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatWorkOrderDate = (value: string | null | undefined): string => {
  if (!value) return '—';

  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);

  const day = padDatePart(date.getDate());
  const month = padDatePart(date.getMonth() + 1);
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

const toNumber = (value: number | string | null | undefined): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toNullableNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getMecanico = (row: WorkOrderTodayDbRow) => {
  if (Array.isArray(row.MECANICOS)) {
    return row.MECANICOS[0] || null;
  }

  return row.MECANICOS || null;
};

export const mapWorkOrderTodayRow = (row: WorkOrderTodayDbRow): WorkOrderTodayRow => {
  const mecanico = getMecanico(row);

  return {
    idOt: row.ID_OT,
    idOm: row.id_om,
    idSg: row.id_sg,
    fecha: row.Fecha || '',
    mecanicoId: row.ID_Mecanico || 0,
    mecanicoNombre: mecanico?.NOMBRE || null,
    area: mecanico?.AREA || null,
    equipoTrabajo: mecanico?.['EQUIPO DE TRABAJO'] || null,
    duracionHoras: toNumber(row['Duración (horas)']),
    estatus: row.Estatus || '',
    retrasoHoras: toNullableNumber(row['Retraso (horas)']),
    causa: row.Causa,
    comentario: row.Comentario,
    semana: row.Semana ? String(row.Semana) : '',
    observaciones: row.Observaciones,
    created: row.created,
  };
};

export const toWorkOrderUpdateDbPayload = (
  payload: WorkOrderUpdatePayload
): WorkOrderUpdateDbPayload => ({
  'Duración (horas)': payload.duracionHoras,
  Estatus: payload.estatus,
  'Retraso (horas)': payload.retrasoHoras,
  Causa: payload.causa,
  Comentario: payload.comentario,
  Observaciones: payload.observaciones,
});

export const validateWorkOrderUpdate = (
  payload: WorkOrderUpdatePayload
): WorkOrderFormErrors => {
  const errors: WorkOrderFormErrors = {};

  if (!payload.duracionHoras || payload.duracionHoras <= 0) {
    errors.duracionHoras = 'La duración debe ser mayor que 0.';
  }

  if (!payload.estatus.trim()) {
    errors.estatus = 'El estatus es obligatorio.';
  }

  if (isDelayedStatus(payload.estatus)) {
    if (!payload.retrasoHoras || payload.retrasoHoras <= 0) {
      errors.retrasoHoras = 'El retraso debe ser mayor que 0.';
    }

    if (!payload.causa?.trim()) {
      errors.causa = 'La causa es obligatoria para órdenes retrasadas.';
    }
  }

  return errors;
};
