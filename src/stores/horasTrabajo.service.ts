import { supabase } from '@/lib/supabase';
import {
  getTodayLocalTimestampRange,
  isTestWorkOrderArea,
  mapWorkOrderTodayRow,
  toWorkOrderUpdateDbPayload,
} from './horasTrabajo.helpers';
import type {
  WorkOrderTodayDbRow,
  WorkOrderTodayRow,
  WorkOrderUpdatePayload,
} from './horasTrabajo.types';

const todayWorkOrdersSelect = `
  ID_OT,
  id_om,
  id_sg,
  Fecha,
  ID_Mecanico,
  "Duración (horas)",
  Estatus,
  "Retraso (horas)",
  Causa,
  Comentario,
  Semana,
  Observaciones,
  created,
  MECANICOS!ORDEN_TRABAJO_ID_Mecanico_fkey (
    id,
    NOMBRE,
    AREA,
    "EQUIPO DE TRABAJO"
  )
`;

export const horasTrabajoService = {
  async fetchTodayWorkOrders(): Promise<WorkOrderTodayRow[]> {
    const { start, end } = getTodayLocalTimestampRange();
    const { data, error } = await supabase
      .from('ORDEN_TRABAJO')
      .select(todayWorkOrdersSelect)
      .gte('Fecha', start)
      .lt('Fecha', end)
      .order('Fecha', { ascending: false });

    if (error) {
      throw new Error(error.message || 'No se pudieron cargar las órdenes de hoy');
    }

    return ((data || []) as unknown as WorkOrderTodayDbRow[])
      .map(mapWorkOrderTodayRow)
      .filter((row) => !isTestWorkOrderArea(row));
  },

  async updateWorkOrder(
    id: string,
    payload: WorkOrderUpdatePayload
  ): Promise<WorkOrderTodayRow> {
    const { data, error } = await supabase
      .from('ORDEN_TRABAJO')
      .update(toWorkOrderUpdateDbPayload(payload))
      .eq('ID_OT', id)
      .select(todayWorkOrdersSelect)
      .single();

    if (error) {
      throw new Error(error.message || 'No se pudo actualizar la orden de trabajo');
    }

    return mapWorkOrderTodayRow(data as unknown as WorkOrderTodayDbRow);
  },

  async deleteWorkOrder(id: string): Promise<void> {
    const { error } = await supabase
      .from('ORDEN_TRABAJO')
      .delete()
      .eq('ID_OT', id);

    if (error) {
      throw new Error(error.message || 'No se pudo eliminar la orden de trabajo');
    }
  },
};
