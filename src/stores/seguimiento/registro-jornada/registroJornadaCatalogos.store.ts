import { shallowRef } from "vue";
import { acceptHMRUpdate, defineStore } from "pinia";
import { registroJornadaService } from "@/components/seguimiento/registro-jornada/services/registroJornada.service";
import type {
  ImplementoOption,
  LaborCatalogo,
  TipoParadaCatalogo,
} from "@/components/seguimiento/registro-jornada/registroJornada.types";

export const useRegistroJornadaCatalogosStore = defineStore(
  "seguimiento_registro_jornada_catalogos",
  () => {
    const implementos = shallowRef<ImplementoOption[]>([]);
    const labores = shallowRef<LaborCatalogo[]>([]);
    const tiposParada = shallowRef<TipoParadaCatalogo[]>([]);
    const cargado = shallowRef(false);
    const cargando = shallowRef(false);
    const error = shallowRef<string | null>(null);
    let solicitudPendiente: Promise<void> | null = null;

    async function cargarCatalogos(force = false): Promise<void> {
      if (solicitudPendiente) return solicitudPendiente;
      if (cargado.value && !force) return;

      solicitudPendiente = (async () => {
        cargando.value = true;
        error.value = null;

        try {
          const [resultadoImplementos, resultadoLabores, resultadoParadas] =
            await Promise.allSettled([
              registroJornadaService.listarImplementos(),
              registroJornadaService.listarLabores(),
              registroJornadaService.listarParadas(),
            ]);

          const catalogosConError: string[] = [];

          if (resultadoImplementos.status === "fulfilled") {
            implementos.value = resultadoImplementos.value;
          } else {
            catalogosConError.push(
              `implementos (${resultadoImplementos.reason instanceof Error ? resultadoImplementos.reason.message : "error de carga"})`,
            );
          }

          if (resultadoLabores.status === "fulfilled") {
            labores.value = resultadoLabores.value;
          } else {
            catalogosConError.push(
              `labores (${resultadoLabores.reason instanceof Error ? resultadoLabores.reason.message : "error de carga"})`,
            );
          }

          if (resultadoParadas.status === "fulfilled") {
            tiposParada.value = resultadoParadas.value;
          } else {
            catalogosConError.push(
              `paradas (${resultadoParadas.reason instanceof Error ? resultadoParadas.reason.message : "error de carga"})`,
            );
          }

          cargado.value = catalogosConError.length === 0;
          if (catalogosConError.length > 0) {
            error.value = `No se pudieron cargar: ${catalogosConError.join(", ")}.`;
          }
        } finally {
          cargando.value = false;
          solicitudPendiente = null;
        }
      })();

      return solicitudPendiente;
    }

    function agregarImplemento(implemento: ImplementoOption): void {
      const existe = implementos.value.some(
        (item) => item.id === implemento.id,
      );
      implementos.value = existe
        ? implementos.value.map((item) =>
            item.id === implemento.id ? implemento : item,
          )
        : [...implementos.value, implemento];
    }

    return {
      implementos,
      labores,
      tiposParada,
      cargado,
      cargando,
      error,
      cargarCatalogos,
      agregarImplemento,
    };
  },
);

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(useRegistroJornadaCatalogosStore, import.meta.hot),
  );
}
