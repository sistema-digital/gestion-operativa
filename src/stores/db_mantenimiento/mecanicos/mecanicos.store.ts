import { defineStore } from 'pinia';
import { mecanicosService } from './mecanicos.service';
import type { MecanicoMantenimiento, MecanicosState } from './mecanicos.types';

export const useMecanicosStore = defineStore('mecanicosMantenimiento', {
  state: (): MecanicosState => ({
    mecanicosPorArea: {},
    areasCargadas: [],
    isLoading: false,
    error: null,
  }),

  actions: {
    async cargarMecanicosActivosPorArea(
      area: string,
      force = false
    ): Promise<MecanicoMantenimiento[]> {
      if (!area) return [];

      if (this.areasCargadas.includes(area) && !force) {
        return this.mecanicosPorArea[area] || [];
      }

      this.isLoading = true;
      this.error = null;

      try {
        const mecanicos = await mecanicosService.obtenerMecanicosActivosPorArea(area);
        this.mecanicosPorArea = {
          ...this.mecanicosPorArea,
          [area]: mecanicos,
        };

        if (!this.areasCargadas.includes(area)) {
          this.areasCargadas = [...this.areasCargadas, area];
        }

        return mecanicos;
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : 'No se pudieron cargar los mecánicos activos';

        this.error = message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
