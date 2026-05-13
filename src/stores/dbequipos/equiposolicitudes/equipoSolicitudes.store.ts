import { defineStore } from 'pinia';
import { equipoSolicitudesService } from './equipoSolicitudes.service';
import type { EquipoSolicitud, EquipoSolicitudesState } from './equipoSolicitudes.types';

export const useEquipoSolicitudesStore = defineStore('equipoSolicitudes', {
  state: (): EquipoSolicitudesState => ({
    equiposPorSolicitud: {},
    isLoading: false,
    error: null
  }),

  getters: {
    obtenerEquiposPorSolicitud: (state) => (solicitudId: string): EquipoSolicitud[] => {
      return state.equiposPorSolicitud[solicitudId] || [];
    }
  },

  actions: {
    async obtenerEquiposSolicitud(solicitudId: string): Promise<EquipoSolicitud[]> {
      this.isLoading = true;
      this.error = null;

      try {
        const equipos = await equipoSolicitudesService.obtenerEquiposSolicitud(solicitudId);
        this.equiposPorSolicitud[solicitudId] = equipos;
        return equipos;
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : 'No se pudieron obtener los equipos de la solicitud';

        this.error = message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    }
  }
});
