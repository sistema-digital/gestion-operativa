import { shallowRef } from "vue";
import { acceptHMRUpdate, defineStore } from "pinia";
import { registroJornadaService } from "@/components/seguimiento/registro-jornada/services/registroJornada.service";
import type {
  ImplementoOption,
  ImplementoTipoOption,
  EquipoOption,
  LaborCatalogo,
  OperadorOption,
  TipoParadaCatalogo,
} from "@/components/seguimiento/registro-jornada/registroJornada.types";

export const useRegistroJornadaCatalogosStore = defineStore(
  "seguimiento_registro_jornada_catalogos",
  () => {
    const implementos = shallowRef<ImplementoOption[]>([]);
    const implementoTipos = shallowRef<ImplementoTipoOption[]>([]);
    const labores = shallowRef<LaborCatalogo[]>([]);
    const operadores = shallowRef<OperadorOption[]>([]);
    const equipos = shallowRef<EquipoOption[]>([]);
    const tiposParada = shallowRef<TipoParadaCatalogo[]>([]);
    const cargado = shallowRef(false);
    const cargando = shallowRef(false);
    const error = shallowRef<string | null>(null);
    let solicitudPendiente: Promise<void> | null = null;
    let solicitudEquiposPendiente: Promise<void> | null = null;
    const equiposCargados = shallowRef(false);

    async function cargarEquipos(): Promise<void> {
      if (solicitudEquiposPendiente) return solicitudEquiposPendiente;
      if (equiposCargados.value) return;

      solicitudEquiposPendiente = (async () => {
        try {
          equipos.value =
            await registroJornadaService.listarEquiposRegistroJornada();
          equiposCargados.value = true;
        } finally {
          solicitudEquiposPendiente = null;
        }
      })();

      return solicitudEquiposPendiente;
    }

    async function cargarCatalogos(force = false): Promise<void> {
      if (solicitudPendiente) return solicitudPendiente;
      if (cargado.value && !force) return;

      solicitudPendiente = (async () => {
        cargando.value = true;
        error.value = null;

        try {
          const [
            resultadoImplementos,
            resultadoTiposImplemento,
            resultadoLabores,
            resultadoOperadores,
            resultadoEquipos,
            resultadoParadas,
          ] = await Promise.allSettled([
            registroJornadaService.listarImplementos(),
            registroJornadaService.listarTiposImplemento(),
            registroJornadaService.listarLabores(),
            registroJornadaService.listarOperadores(),
            cargarEquipos(),
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

          if (resultadoTiposImplemento.status === "fulfilled") {
            implementoTipos.value = resultadoTiposImplemento.value;
          } else {
            catalogosConError.push(
              `tipos de implemento (${resultadoTiposImplemento.reason instanceof Error ? resultadoTiposImplemento.reason.message : "error de carga"})`,
            );
          }

          if (resultadoLabores.status === "fulfilled") {
            labores.value = resultadoLabores.value;
          } else {
            catalogosConError.push(
              `labores (${resultadoLabores.reason instanceof Error ? resultadoLabores.reason.message : "error de carga"})`,
            );
          }

          if (resultadoOperadores.status === "fulfilled") {
            operadores.value = resultadoOperadores.value;
          } else {
            catalogosConError.push(
              `operadores (${resultadoOperadores.reason instanceof Error ? resultadoOperadores.reason.message : "error de carga"})`,
            );
          }

          if (resultadoEquipos.status === "rejected") {
            catalogosConError.push(
              `equipos (${resultadoEquipos.reason instanceof Error ? resultadoEquipos.reason.message : "error de carga"})`,
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

    function agregarOperador(operador: OperadorOption): void {
      const existe = operadores.value.some((item) => item.id === operador.id);
      operadores.value = existe
        ? operadores.value.map((item) =>
            item.id === operador.id ? operador : item,
          )
        : [...operadores.value, operador];
    }

    return {
      implementos,
      implementoTipos,
      labores,
      operadores,
      equipos,
      equiposCargados,
      tiposParada,
      cargado,
      cargando,
      error,
      cargarCatalogos,
      cargarEquipos,
      agregarImplemento,
      agregarOperador,
    };
  },
);

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(useRegistroJornadaCatalogosStore, import.meta.hot),
  );
}
