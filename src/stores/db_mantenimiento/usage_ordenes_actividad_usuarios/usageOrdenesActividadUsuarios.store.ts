import { defineStore } from 'pinia';
import { usageOrdenesActividadUsuariosService } from './usageOrdenesActividadUsuarios.service';
import type {
  ObtenerUsageOrdenesActividadUsuariosResponse,
  UsageOrdenesActividadUsuarioRow,
  UsageOrdenesActividadUsuariosState,
} from './usageOrdenesActividadUsuarios.types';

const normalizeAreaKey = (value: string | null | undefined): string => (
  value || ''
).trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const useUsageOrdenesActividadUsuariosStore = defineStore('usageOrdenesActividadUsuarios', {
  state: (): UsageOrdenesActividadUsuariosState => ({
    registros: [],
    isLoading: false,
    isLoaded: false,
    error: null,
  }),

  getters: {
    obtenerPorArea: (state) => (area: string): UsageOrdenesActividadUsuarioRow[] => {
      const areaKey = normalizeAreaKey(area);
      return state.registros.filter((registro) => normalizeAreaKey(registro.area) === areaKey);
    },
  },

  actions: {
    async cargarActividad(force = false): Promise<ObtenerUsageOrdenesActividadUsuariosResponse> {
      if (this.isLoaded && !force) {
        return this.registros;
      }

      this.isLoading = true;
      this.error = null;

      try {
        const registros = await usageOrdenesActividadUsuariosService.obtenerActividad();
        this.registros = registros;
        this.isLoaded = true;
        return registros;
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : 'No se pudo cargar la actividad de ordenes por usuario';

        this.error = message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    reset(): void {
      this.registros = [];
      this.isLoading = false;
      this.isLoaded = false;
      this.error = null;
    },
  },
});
