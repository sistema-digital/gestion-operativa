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
  const eliminandoJornadaId = shallowRef<string | null>(null);
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

  async function eliminarJornada(jornadaId: string): Promise<boolean> {
    eliminandoJornadaId.value = jornadaId;
    error.value = null;

    try {
      const resultado = await registroJornadaService.eliminarJornada(jornadaId);
      if (!resultado.ok || !resultado.eliminada) {
        throw new Error("La jornada no pudo eliminarse.");
      }

      items.value = items.value.filter(
        (jornada) => jornada.jornadaId !== resultado.jornadaId,
      );
      if (detalle.value?.id === resultado.jornadaId) cerrarDetalle();
      return true;
    } catch (capturado) {
      error.value =
        capturado instanceof Error
          ? capturado.message
          : "No se pudo eliminar la jornada.";
      return false;
    } finally {
      eliminandoJornadaId.value = null;
    }
  }

  return {
    items,
    detalle,
    cargando,
    cargandoDetalle,
    eliminandoJornadaId,
    error,
    errorDetalle,
    total,
    cargar,
    consultarDetalle,
    cerrarDetalle,
    eliminarJornada,
  };
}
