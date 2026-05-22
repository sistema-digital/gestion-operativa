import { supabase } from '@/lib/supabase';
import { useUserStore } from './userStore';
import {
  getTodayLocalTimestampRange,
  isTestWorkOrderArea,
  mapWorkOrderTodayRow,
  toWorkOrderUpdateDbPayload,
} from './horasTrabajo.helpers';
import type {
  ProductividadSemanalPorEquipoResponse,
  ProductividadSemanalResponse,
  ProductividadSemanalServiciosGeneralesResponse,
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

const normalizeArea = (area: string | null | undefined): string => (
  area || ''
).trim().toLowerCase();

export const horasTrabajoService = {
  async fetchProductividadSemanalPorEquipo(
    semana: string,
    topLimit = 3
  ): Promise<ProductividadSemanalPorEquipoResponse> {
    const { data, error } = await supabase.rpc(
      'rpc_productividad_semanal_por_equipo',
      {
        p_semana: semana,
        p_top_limit: topLimit,
      }
    );

    if (error) {
      throw new Error(error.message || 'No se pudo cargar la productividad semanal por equipo');
    }

    const response = data as ProductividadSemanalPorEquipoResponse | null;

    if (!response?.success) {
      throw new Error('No se pudo cargar la productividad semanal por equipo');
    }

    return response;
  },

  async fetchProductividadSemanalServiciosGenerales(
    semana: string,
    topLimit = 3
  ): Promise<ProductividadSemanalServiciosGeneralesResponse> {
    const { data, error } = await supabase.rpc(
      'rpc_productividad_semanal_servicios_generales',
      {
        p_semana: semana,
        p_top_limit: topLimit,
      }
    );

    if (error) {
      throw new Error(error.message || 'No se pudo cargar la productividad semanal de Servicios Generales');
    }

    const response = data as ProductividadSemanalServiciosGeneralesResponse | null;

    if (!response?.success) {
      throw new Error(response?.message || 'No se pudo cargar la productividad semanal de Servicios Generales');
    }

    return response;
  },

  async fetchProductividadSemanal(
    semana: string,
    topLimit = 3
  ): Promise<ProductividadSemanalResponse> {
    const userStore = useUserStore();
    const profile = await userStore.fetchCurrentUserProfile();
    const area = normalizeArea(profile?.area || userStore.getArea());

    if (!area) {
      throw new Error('No se pudo identificar el área del usuario autenticado');
    }

    if (area === 'all') {
      const [productividadGeneral, productividadServiciosGenerales] = await Promise.all([
        this.fetchProductividadSemanalPorEquipo(semana, topLimit),
        this.fetchProductividadSemanalServiciosGenerales(semana, topLimit),
      ]);

      return {
        ...productividadGeneral,
        areas: [
          ...productividadGeneral.areas,
          ...productividadServiciosGenerales.areas,
        ],
      };
    }

    if (area === 'servicios generales') {
      return this.fetchProductividadSemanalServiciosGenerales(semana, topLimit);
    }

    return this.fetchProductividadSemanalPorEquipo(semana, topLimit);
  },

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
