import { computed, shallowRef } from "vue";
import { registroJornadaService } from "../services/registroJornada.service";
import type {
  JornadaAdministrativaDetalle,
  JornadaAdministrativaFiltros,
  JornadaAdministrativaListaItem,
} from "../registroJornada.types";

export function useJornadasAdministrativas() {
  const items = shallowRef<JornadaAdministrativaListaItem[]>([]);
  const detalle = shallowRef<JornadaAdministrativaDetalle | null>(null);
  const cargando = shallowRef(false);
  const cargandoDetalle = shallowRef(false);
  const error = shallowRef<string | null>(null);
  const errorDetalle = shallowRef<string | null>(null);
  const total = computed(() => items.value.length);

  async function cargar(filtros: JornadaAdministrativaFiltros): Promise<void> {
    cargando.value = true;
    error.value = null;

    try {
      items.value =
        await registroJornadaService.listarJornadasAdministrativas(filtros);
    } catch (capturado) {
      error.value =
        capturado instanceof Error
          ? capturado.message
          : "No se pudieron cargar las jornadas.";
    } finally {
      cargando.value = false;
    }
  }

  async function consultarDetalle(jornadaId: string): Promise<void> {
    cargandoDetalle.value = true;
    errorDetalle.value = null;
    detalle.value = null;

    try {
      detalle.value =
        await registroJornadaService.obtenerJornadaAdministrativa(jornadaId);
    } catch (capturado) {
      errorDetalle.value =
        capturado instanceof Error
          ? capturado.message
          : "No se pudo cargar el detalle de la jornada.";
    } finally {
      cargandoDetalle.value = false;
    }
  }

  function cerrarDetalle(): void {
    detalle.value = null;
    errorDetalle.value = null;
  }

  return {
    items,
    detalle,
    cargando,
    cargandoDetalle,
    error,
    errorDetalle,
    total,
    cargar,
    consultarDetalle,
    cerrarDetalle,
  };
}
