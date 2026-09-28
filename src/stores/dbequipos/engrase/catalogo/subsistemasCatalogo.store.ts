import { computed, ref, shallowRef } from "vue";
import { acceptHMRUpdate, defineStore } from "pinia";
import {
  filtrarCatalogoSubsistemas,
  ordenarCatalogoSubsistemas,
  resumirCatalogoSubsistemas,
} from "./subsistemasCatalogo.helpers";
import { normalizarCatalogoSubsistemasError } from "./subsistemasCatalogo.errors";
import { subsistemasCatalogoService } from "./subsistemasCatalogo.service";
import type { CatalogoSubsistemasError } from "./subsistemasCatalogo.errors";
import type {
  CatalogoSortDirection,
  CatalogoSubsistemaEstado,
  CatalogoSubsistemaGuardarInput,
  CatalogoSubsistemaItem,
  CatalogoSubsistemasResumen,
  CatalogoSubsistemaSortKey,
  CatalogoSubsistemaUso,
} from "./subsistemasCatalogo.types";

export const useSubsistemasCatalogoStore = defineStore(
  "dbequipos_engrase_catalogo_subsistemas",
  () => {
    const items = ref<CatalogoSubsistemaItem[]>([]);
    const resumen = ref<CatalogoSubsistemasResumen>({
      total: 0,
      activos: 0,
      desactivados: 0,
    });
    const cargado = shallowRef(false);
    const loadingInicial = shallowRef(false);
    const guardando = shallowRef(false);
    const errorInicial = shallowRef<CatalogoSubsistemasError | null>(null);
    const errorGuardado = shallowRef<CatalogoSubsistemasError | null>(null);
    const seleccionadoId = shallowRef<number | null>(null);
    const busqueda = shallowRef("");
    const estado = shallowRef<CatalogoSubsistemaEstado>("activos");
    const uso = shallowRef<CatalogoSubsistemaUso>("todos");
    const sortKey = shallowRef<CatalogoSubsistemaSortKey>("nombre");
    const sortDirection = shallowRef<CatalogoSortDirection>("asc");
    let pendingRequest: Promise<void> | null = null;

    const itemsVisibles = computed(() =>
      ordenarCatalogoSubsistemas(
        filtrarCatalogoSubsistemas(items.value, {
          busqueda: busqueda.value,
          estado: estado.value,
          uso: uso.value,
        }),
        sortKey.value,
        sortDirection.value,
      ),
    );
    const cantidadVisible = computed(() => itemsVisibles.value.length);
    const hayFiltrosActivos = computed(
      () =>
        Boolean(busqueda.value.trim()) ||
        estado.value !== "activos" ||
        uso.value !== "todos" ||
        sortKey.value !== "nombre" ||
        sortDirection.value !== "asc",
    );
    const sinResultados = computed(
      () =>
        cargado.value &&
        items.value.length > 0 &&
        itemsVisibles.value.length === 0,
    );

    function cerrarSeleccionNoVisible(): void {
      if (
        seleccionadoId.value !== null &&
        !itemsVisibles.value.some((item) => item.id === seleccionadoId.value)
      )
        seleccionadoId.value = null;
    }

    async function inicializar(force = false): Promise<void> {
      if (pendingRequest) return pendingRequest;
      if (cargado.value && !force) return;
      pendingRequest = (async () => {
        loadingInicial.value = true;
        errorInicial.value = null;
        try {
          const response = await subsistemasCatalogoService.listar();
          items.value = response.items;
          resumen.value = response.resumen;
          cargado.value = true;
          cerrarSeleccionNoVisible();
        } catch (cause) {
          errorInicial.value = normalizarCatalogoSubsistemasError(
            cause,
            "TRANSPORTE",
          );
        } finally {
          loadingInicial.value = false;
          pendingRequest = null;
        }
      })();
      return pendingRequest;
    }

    function actualizarBusqueda(value: string): void {
      busqueda.value = value;
      cerrarSeleccionNoVisible();
    }
    function actualizarEstado(value: CatalogoSubsistemaEstado): void {
      estado.value = value;
      cerrarSeleccionNoVisible();
    }
    function actualizarUso(value: CatalogoSubsistemaUso): void {
      uso.value = value;
      cerrarSeleccionNoVisible();
    }
    function actualizarOrden(key: CatalogoSubsistemaSortKey): void {
      if (sortKey.value === key)
        sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
      else {
        sortKey.value = key;
        sortDirection.value = "asc";
      }
    }
    function limpiarFiltros(): void {
      busqueda.value = "";
      estado.value = "activos";
      uso.value = "todos";
      sortKey.value = "nombre";
      sortDirection.value = "asc";
      cerrarSeleccionNoVisible();
    }
    function limpiarErrorGuardado(): void {
      errorGuardado.value = null;
    }
    async function guardar(
      input: CatalogoSubsistemaGuardarInput,
    ): Promise<CatalogoSubsistemaItem> {
      if (guardando.value) throw new Error("Ya existe un guardado en curso.");
      guardando.value = true;
      errorGuardado.value = null;
      try {
        const response = await subsistemasCatalogoService.guardar(input);
        const exists = items.value.some((item) => item.id === response.item.id);
        items.value = exists
          ? items.value.map((item) =>
              item.id === response.item.id ? response.item : item,
            )
          : [...items.value, response.item];
        resumen.value = resumirCatalogoSubsistemas(items.value);
        return response.item;
      } catch (cause) {
        errorGuardado.value = normalizarCatalogoSubsistemasError(cause);
        throw errorGuardado.value;
      } finally {
        guardando.value = false;
      }
    }

    return {
      items,
      resumen,
      cargado,
      loadingInicial,
      guardando,
      errorInicial,
      errorGuardado,
      busqueda,
      estado,
      uso,
      sortKey,
      sortDirection,
      itemsVisibles,
      cantidadVisible,
      hayFiltrosActivos,
      sinResultados,
      inicializar,
      reintentar: () => inicializar(true),
      actualizarBusqueda,
      actualizarEstado,
      actualizarUso,
      actualizarOrden,
      limpiarFiltros,
      limpiarErrorGuardado,
      guardar,
    };
  },
);

if (import.meta.hot)
  import.meta.hot.accept(
    acceptHMRUpdate(useSubsistemasCatalogoStore, import.meta.hot),
  );
