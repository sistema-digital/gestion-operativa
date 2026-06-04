import { defineStore } from 'pinia';
import { horasPerdidasAreaMotivoService } from './horasPerdidasAreaMotivo.service';
import type {
  HorasPerdidasAreaMotivoState,
  ObtenerHorasPerdidasPersonalResumenResponse,
} from './horasPerdidasAreaMotivo.types';

export const useHorasPerdidasAreaMotivoStore = defineStore('horasPerdidasAreaMotivo', {
  state: (): HorasPerdidasAreaMotivoState => ({
    resumen: null,
    fechaConsultada: null,
    isLoading: false,
    isLoaded: false,
    error: null,
  }),

  actions: {
    async cargarResumen(
      fechaDesde: string,
      force = false
    ): Promise<ObtenerHorasPerdidasPersonalResumenResponse> {
      if (
        this.isLoaded &&
        this.resumen &&
        this.fechaConsultada === fechaDesde &&
        !force
      ) {
        return this.resumen;
      }

      this.isLoading = true;
      this.error = null;

      try {
        const resumen = await horasPerdidasAreaMotivoService.obtenerResumen({
          p_fecha_desde: fechaDesde,
        });

        this.resumen = resumen;
        this.fechaConsultada = fechaDesde;
        this.isLoaded = true;

        return resumen;
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : 'No se pudo cargar el resumen de horas perdidas por area y motivo';

        this.error = message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    reset(): void {
      this.resumen = null;
      this.fechaConsultada = null;
      this.isLoading = false;
      this.isLoaded = false;
      this.error = null;
    },
  },
});
