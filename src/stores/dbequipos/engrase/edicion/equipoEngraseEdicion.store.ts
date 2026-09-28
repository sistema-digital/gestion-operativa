import { computed, ref, shallowRef, toRaw } from "vue";
import { defineStore } from "pinia";
import { useFiltrosEngraseStore } from "../filtrosEngrase.store";
import { sistemasCatalogoService } from "../catalogo/sistemasCatalogo.service";
import { subsistemasCatalogoService } from "../catalogo/subsistemasCatalogo.service";
import { extraerCodigoErrorEdicionEquipo } from "./equipoEngraseEdicion.errors";
import { equipoEngraseEdicionService } from "./equipoEngraseEdicion.service";
import { crearTempId } from "./equipoEngraseEdicion.tempIds";
import { crearMotivoCambioFiltro } from "./equipoEngraseFiltroMotivo";
import {
  construirCambiosEquipo,
  hayCambiosEquipo,
} from "./equipoEngraseEdicion.payload";
import {
  mapearErrorRpcEquipo,
  validarEquipoEngrase,
} from "./equipoEngraseEdicion.validation";
import {
  agregarHijoEstructura,
  agregarRaizEstructura,
  actualizarAceiteNodo as actualizarAceiteNodoEstructura,
  crearBorradorEstructura,
  deshacerEliminacionNodo as deshacerEliminacionNodoEstructura,
  marcarNodoParaEliminar,
  moverNodoEstructura,
  obtenerSubarbolActivo,
} from "../shared/estructuraLubricacion.draft";
import type {
  AgregarHijoEstructuraInput,
  AgregarRaizEstructuraInput,
  ActualizarNodoEstructuraInput,
  MoverNodoEstructuraInput,
  ResultadoMutacionEstructura,
} from "../shared/estructuraLubricacion.draft.types";
import type { CatalogoActivo } from "../shared/estructuraLubricacion.types";
import type { ImagenSyncState } from "./equipoEngraseImagen.types";
import type {
  AuxiliaresEdicionEquipo,
  EquipoEdicionDraft,
  EquipoEdicionError,
  EquipoEdicionOverlay,
  EquipoEdicionSnapshot,
  EquipoImagenPersistida,
  EquipoEstado,
  AgregarFiltroExistenteDraft,
  AgregarFiltroTemporalDraft,
  EditarAsignacionFiltroDraft,
  FiltroDraftReference,
  ResultadoBusquedaFiltroOriginal,
  TipoEquipoDraftReference,
  TipoFiltroDraftReference,
  EquipoEdicionValidationIssue,
  ActualizarEquipoCompletoRespuesta,
} from "./equipoEngraseEdicion.types";

export type ResultadoGuardadoEquipo =
  | { kind: "success"; respuesta: ActualizarEquipoCompletoRespuesta }
  | { kind: "partial"; respuesta: ActualizarEquipoCompletoRespuesta }
  | { kind: "invalid" | "empty" | "busy" | "error" };
export type MoverImagenEquipo = (
  sourcePath: string,
  destinationPath: string,
) => Promise<void>;

const crearError = (error: Error): EquipoEdicionError => ({
  codigo: extraerCodigoErrorEdicionEquipo(error.message),
  mensaje: error.message,
});
const normalizarTexto = (valor: string): string =>
  valor.trim().replace(/\s+/g, " ");
const claveTexto = (valor: string): string =>
  normalizarTexto(valor)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase();
const clonarTipoEquipoReferencia = (
  referencia: TipoEquipoDraftReference,
): TipoEquipoDraftReference =>
  referencia.estado === "nuevo"
    ? { ...referencia, subtiposSugeridos: [...referencia.subtiposSugeridos] }
    : { ...referencia };
const clonarFiltroReferencia = (
  referencia: FiltroDraftReference,
): FiltroDraftReference => ({ ...referencia });
const clonarTipoFiltroReferencia = (
  referencia: TipoFiltroDraftReference,
): TipoFiltroDraftReference => ({ ...referencia });
const clonarBorrador = (borrador: EquipoEdicionDraft): EquipoEdicionDraft => ({
  equipo: { ...borrador.equipo },
  etapas: borrador.etapas.map((etapa) => ({ ...etapa })),
  filtros: borrador.filtros.map((filtro) => ({
    ...filtro,
    tipoFiltro: { ...filtro.tipoFiltro },
    filtro: { ...filtro.filtro },
    filtroReferencia: clonarFiltroReferencia(filtro.filtroReferencia),
    tipoFiltroReferencia: clonarTipoFiltroReferencia(
      filtro.tipoFiltroReferencia,
    ),
  })),
  estructuraSistemas: structuredClone(toRaw(borrador.estructuraSistemas)),
  imagen: { ...borrador.imagen },
  tipoEquipoReferencia: clonarTipoEquipoReferencia(
    borrador.tipoEquipoReferencia,
  ),
  operaciones: { ...borrador.operaciones },
});
const clonarSnapshot = (
  snapshot: EquipoEdicionSnapshot,
): EquipoEdicionSnapshot => ({
  equipo: { ...snapshot.equipo },
  etapas: snapshot.etapas.map((etapa) => ({ ...etapa })),
  filtros: snapshot.filtros.map((filtro) => ({
    ...filtro,
    tipoFiltro: { ...filtro.tipoFiltro },
    filtro: { ...filtro.filtro },
    draftId: `equipo_filtro_${filtro.id}`,
    estadoOperacion: "existente",
    estadoAntesDeEliminar: null,
    filtroReferencia: {
      estado: "existente",
      id: filtro.filtro.id,
      tempId: null,
      codigo: filtro.filtro.codigo,
      estaEnListaCompras: filtro.filtro.estaEnListaCompras,
    },
    tipoFiltroReferencia: {
      estado: "existente",
      id: filtro.tipoFiltro.id,
      tempId: null,
      nombre: filtro.tipoFiltro.nombre,
    },
  })),
  estructuraSistemas: snapshot.estructuraSistemas.map((nodo) => ({
    ...nodo,
    sistema: nodo.sistema ? { ...nodo.sistema } : null,
    subsistema: nodo.subsistema ? { ...nodo.subsistema } : null,
    aceite: nodo.aceite ? { ...nodo.aceite } : null,
  })),
  imagen: { ...snapshot.imagen },
});
const crearBorrador = (
  snapshot: EquipoEdicionSnapshot,
): EquipoEdicionDraft => ({
  ...clonarSnapshot(snapshot),
  filtros: snapshot.filtros.map((filtro) => ({
    ...filtro,
    tipoFiltro: { ...filtro.tipoFiltro },
    filtro: { ...filtro.filtro },
    draftId: `equipo_filtro_${filtro.id}`,
    estadoOperacion: "existente",
    estadoAntesDeEliminar: null,
    filtroReferencia: {
      estado: "existente",
      id: filtro.filtro.id,
      tempId: null,
      codigo: filtro.filtro.codigo,
      estaEnListaCompras: filtro.filtro.estaEnListaCompras,
    },
    tipoFiltroReferencia: {
      estado: "existente",
      id: filtro.tipoFiltro.id,
      tempId: null,
      nombre: filtro.tipoFiltro.nombre,
    },
  })),
  estructuraSistemas: crearBorradorEstructura(snapshot.estructuraSistemas),
  tipoEquipoReferencia: {
    estado: "existente",
    id: snapshot.equipo.tipoEquipoId,
    nombre: snapshot.equipo.tipoEquipo,
    tempId: null,
  },
  operaciones: {
    datos: "existente",
    etapas: "existente",
    filtros: "existente",
    estructuraSistemas: "existente",
  },
});
const crearSnapshotPersistido = (
  borrador: EquipoEdicionDraft,
  respuesta: ActualizarEquipoCompletoRespuesta,
): EquipoEdicionSnapshot => ({
  equipo: {
    id: respuesta.equipoLista.id,
    codigo: respuesta.equipoLista.codigo,
    tipoEquipoId: respuesta.equipoLista.tipo_equipo_id,
    tipoEquipo: respuesta.equipoLista.tipo_equipo,
    subtipo: respuesta.equipoLista.subtipo ?? "",
    estado: respuesta.equipoLista.estado,
  },
  etapas: respuesta.equipoLista.etapas.map((etapa) => ({ ...etapa })),
  filtros: borrador.filtros
    .filter((filtro) => filtro.estadoOperacion !== "pendiente_eliminacion")
    .map((filtro) => ({
      id: filtro.id,
      equipoId: respuesta.equipoLista.id,
      tipoFiltro: { ...filtro.tipoFiltro },
      filtro: { ...filtro.filtro },
      cantidad: filtro.cantidad,
      cantidadEquivalencias: filtro.cantidadEquivalencias,
    })),
  estructuraSistemas: borrador.estructuraSistemas
    .filter((nodo) => nodo.estadoLocal !== "pendiente_eliminacion")
    .flatMap((nodo) => {
      const id =
        nodo.id ??
        (nodo.tempId ? respuesta.estructuraTempIds?.[nodo.tempId] : undefined);
      if (!id) return [];
      return [
        {
          id,
          parentId:
            nodo.parentId ??
            (nodo.parentTempId
              ? (respuesta.estructuraTempIds?.[nodo.parentTempId] ?? null)
              : null),
          sistema: nodo.sistema ? { ...nodo.sistema } : null,
          subsistema: nodo.subsistema ? { ...nodo.subsistema } : null,
          aceite: nodo.aceite ? { ...nodo.aceite } : null,
        },
      ];
    }),
  imagen: {
    mainStoragePath: respuesta.equipoLista.main_storage_path,
    tieneImagenMain: respuesta.equipoLista.tiene_imagen_main,
    imagenActualizadaEn: respuesta.equipoLista.imagen_actualizada_en,
  },
});

export const useEquipoEngraseEdicionStore = defineStore(
  "dbequipos_engrase_edicion",
  () => {
    const codigoOriginal = shallowRef<string | null>(null);
    const original = ref<EquipoEdicionSnapshot | null>(null);
    const draft = ref<EquipoEdicionDraft | null>(null);
    const auxiliares = ref<AuxiliaresEdicionEquipo | null>(null);
    const activeOverlay = shallowRef<EquipoEdicionOverlay | null>(null);
    const loading = shallowRef(false);
    const saving = shallowRef(false);
    const loadError = ref<EquipoEdicionError | null>(null);
    const saveError = ref<EquipoEdicionError | null>(null);
    const validationErrors = ref<EquipoEdicionValidationIssue[]>([]);
    const successMessage = shallowRef<string | null>(null);
    const imagenPersistidaActual = ref<EquipoImagenPersistida | null>(null);
    const imagenSyncState = shallowRef<ImagenSyncState>({ kind: "idle" });
    let solicitudActual = 0;

    const isReady = computed(
      () =>
        original.value !== null &&
        draft.value !== null &&
        auxiliares.value !== null &&
        !loading.value,
    );
    const cambiosPendientes = computed(() =>
      original.value && draft.value
        ? construirCambiosEquipo(original.value, draft.value)
        : {},
    );
    const erroresDeBorrador = computed(() =>
      draft.value ? validarEquipoEngrase(draft.value).errores : [],
    );
    const isDirty = computed(() => hayCambiosEquipo(cambiosPendientes.value));
    const hasDataChanges = computed(
      () =>
        Boolean(cambiosPendientes.value.datos_equipo) ||
        Boolean(cambiosPendientes.value.etapas),
    );
    const hasFilterChanges = computed(() =>
      Boolean(cambiosPendientes.value.filtros),
    );
    const hasStructureChanges = computed(() =>
      Boolean(cambiosPendientes.value.estructura_sistemas),
    );
    const hasDataErrors = computed(() =>
      [...erroresDeBorrador.value, ...validationErrors.value].some(
        (error) =>
          error.seccion === "datos" ||
          error.seccion === "etapas" ||
          error.seccion === "general",
      ),
    );
    const hasFilterErrors = computed(() =>
      [...erroresDeBorrador.value, ...validationErrors.value].some(
        (error) => error.seccion === "filtros",
      ),
    );
    const hasStructureErrors = computed(() =>
      [...erroresDeBorrador.value, ...validationErrors.value].some(
        (error) => error.seccion === "estructura-lubricacion",
      ),
    );
    const hasActiveOverlay = computed(() => activeOverlay.value !== null);
    const canSave = computed(
      () =>
        isReady.value &&
        hayCambiosEquipo(cambiosPendientes.value) &&
        !saving.value &&
        activeOverlay.value === null &&
        imagenSyncState.value.kind !== "move_pending",
    );
    const activeFiltersCount = computed(
      () =>
        draft.value?.filtros.filter(
          (filtro) => filtro.estadoOperacion !== "pendiente_eliminacion",
        ).length ?? 0,
    );
    const activeStagesCount = computed(() => draft.value?.etapas.length ?? 0);
    const activeStructureNodesCount = computed(
      () =>
        draft.value?.estructuraSistemas.filter(
          (nodo) => nodo.estadoLocal !== "pendiente_eliminacion",
        ).length ?? 0,
    );
    const assignedOilsCount = computed(
      () =>
        draft.value?.estructuraSistemas.filter(
          (nodo) =>
            nodo.estadoLocal !== "pendiente_eliminacion" &&
            nodo.aceiteId !== null,
        ).length ?? 0,
    );

    async function cargar(codigo: string): Promise<void> {
      const codigoNormalizado = codigo.trim();
      const solicitud = ++solicitudActual;
      if (!codigoNormalizado) {
        codigoOriginal.value = null;
        original.value = null;
        draft.value = null;
        loadError.value = {
          codigo: "CODIGO_EQUIPO_REQUERIDO",
          mensaje: "Debe indicar el código del equipo.",
        };
        return;
      }
      loading.value = true;
      loadError.value = null;
      saveError.value = null;
      validationErrors.value = [];
      successMessage.value = null;
      activeOverlay.value = null;
      try {
        const [equipo, catalogos] = await Promise.all([
          equipoEngraseEdicionService.obtenerEquipoParaEdicion(
            codigoNormalizado,
          ),
          equipoEngraseEdicionService.obtenerAuxiliaresEdicionEquipo(),
        ]);
        if (solicitud !== solicitudActual) return;
        const snapshot: EquipoEdicionSnapshot = equipo;
        codigoOriginal.value = codigoNormalizado;
        original.value = clonarSnapshot(snapshot);
        draft.value = crearBorrador(snapshot);
        imagenPersistidaActual.value = { ...snapshot.imagen };
        auxiliares.value = structuredClone(toRaw(catalogos));
      } catch (error) {
        if (solicitud !== solicitudActual) return;
        const fallo =
          error instanceof Error
            ? error
            : new Error("No se pudo cargar el editor.");
        loadError.value = crearError(fallo);
        original.value = null;
        draft.value = null;
        auxiliares.value = null;
      } finally {
        if (solicitud === solicitudActual) loading.value = false;
      }
    }
    function solicitarSalida(): boolean {
      if (saving.value) return false;
      if (!isDirty.value) return true;
      activeOverlay.value = "confirmar_salida";
      return false;
    }
    function continuarEditando(): void {
      activeOverlay.value = null;
    }
    function descartarCambios(): void {
      draft.value = original.value ? crearBorrador(original.value) : null;
      activeOverlay.value = null;
    }
    function actualizarCodigo(codigo: string): void {
      if (draft.value) draft.value.equipo.codigo = codigo.trim();
    }
    function seleccionarTipoEquipo(
      tipo: EquipoEdicionDraft["tipoEquipoReferencia"],
    ): void {
      if (!draft.value) return;
      draft.value.tipoEquipoReferencia = clonarTipoEquipoReferencia(tipo);
      draft.value.equipo.tipoEquipoId =
        tipo.estado === "existente" ? tipo.id : 0;
      draft.value.equipo.tipoEquipo = tipo.nombre;
    }
    function actualizarSubtipo(subtipo: string): void {
      if (draft.value)
        draft.value.equipo.subtipo =
          normalizarTexto(subtipo).toLocaleUpperCase("es");
    }
    function actualizarEstado(estado: EquipoEstado): void {
      if (draft.value) draft.value.equipo.estado = estado;
    }
    function agregarEtapa(etapaId: number): void {
      if (
        !draft.value ||
        draft.value.etapas.some((etapa) => etapa.id === etapaId)
      )
        return;
      const etapa = auxiliares.value?.etapas.find(
        (item) => item.id === etapaId,
      );
      if (etapa) draft.value.etapas.push({ ...etapa });
    }
    function quitarEtapa(etapaId: number): void {
      if (!draft.value || draft.value.etapas.length <= 1) return;
      draft.value.etapas = draft.value.etapas.filter(
        (etapa) => etapa.id !== etapaId,
      );
    }
    function esTipoEquipoDuplicado(nombre: string): boolean {
      const clave = claveTexto(nombre);
      return Boolean(
        clave &&
        (auxiliares.value?.tiposEquipo.some(
          (tipo) => claveTexto(tipo.nombre) === clave,
        ) ||
          (draft.value?.tipoEquipoReferencia.estado === "nuevo" &&
            claveTexto(draft.value.tipoEquipoReferencia.nombre) === clave)),
      );
    }
    function crearYSeleccionarTipoEquipo(nombre: string): boolean {
      const normalizado = normalizarTexto(nombre);
      if (!draft.value || !normalizado || esTipoEquipoDuplicado(normalizado))
        return false;
      seleccionarTipoEquipo({
        estado: "nuevo",
        id: null,
        tempId: crearTempId("tipo_equipo"),
        nombre: normalizado,
        subtiposSugeridos: [],
      });
      return true;
    }
    function abrirNuevoTipoEquipo(): void {
      activeOverlay.value = "nuevo_tipo_equipo";
    }
    async function buscarFiltroOriginalParaAsignar(
      codigo: string,
    ): Promise<ResultadoBusquedaFiltroOriginal> {
      return equipoEngraseEdicionService.buscarFiltroOriginalParaAsignar(
        normalizarTexto(codigo).toUpperCase(),
        codigoOriginal.value ?? undefined,
      );
    }
    function agregarFiltroExistente(
      entrada: AgregarFiltroExistenteDraft,
    ): boolean {
      if (!draft.value || entrada.cantidad < 1) return false;
      const asignacionPendiente = draft.value.filtros.find(
        (item) =>
          item.estadoOperacion === "pendiente_eliminacion" &&
          item.filtro.id === entrada.filtro.id &&
          item.tipoFiltro.id === entrada.tipoFiltro.id,
      );
      if (asignacionPendiente) {
        asignacionPendiente.estadoOperacion =
          asignacionPendiente.estadoAntesDeEliminar ?? "existente";
        asignacionPendiente.estadoAntesDeEliminar = null;
        return true;
      }
      if (
        draft.value.filtros.some(
          (item) =>
            item.estadoOperacion !== "pendiente_eliminacion" &&
            item.tipoFiltro.id === entrada.tipoFiltro.id,
        )
      )
        return false;
      draft.value.filtros.push({
        id: 0,
        equipoId: draft.value.equipo.id,
        tipoFiltro: { ...entrada.tipoFiltro },
        filtro: { ...entrada.filtro },
        cantidad: entrada.cantidad,
        cantidadEquivalencias: entrada.cantidadEquivalencias ?? 0,
        draftId: crearTempId("equipo_filtro"),
        estadoOperacion: "nuevo",
        estadoAntesDeEliminar: null,
        filtroReferencia: {
          estado: "existente",
          id: entrada.filtro.id,
          tempId: null,
          codigo: entrada.filtro.codigo,
          estaEnListaCompras: entrada.filtro.estaEnListaCompras,
        },
        tipoFiltroReferencia: {
          estado: "existente",
          id: entrada.tipoFiltro.id,
          tempId: null,
          nombre: entrada.tipoFiltro.nombre,
        },
      });
      return true;
    }
    function agregarFiltroTemporal(
      entrada: AgregarFiltroTemporalDraft,
    ): boolean {
      if (!draft.value || entrada.cantidad < 1) return false;
      const tipoRepetido = draft.value.filtros.some(
        (item) =>
          item.estadoOperacion !== "pendiente_eliminacion" &&
          claveTexto(item.tipoFiltroReferencia.nombre) ===
            claveTexto(entrada.tipoFiltro.nombre),
      );
      if (tipoRepetido) return false;
      draft.value.filtros.push({
        id: 0,
        equipoId: draft.value.equipo.id,
        tipoFiltro: {
          id:
            entrada.tipoFiltro.estado === "existente"
              ? entrada.tipoFiltro.id
              : 0,
          nombre: entrada.tipoFiltro.nombre,
        },
        filtro: {
          id: entrada.filtro.estado === "existente" ? entrada.filtro.id : 0,
          codigo: entrada.filtro.codigo,
          estaEnListaCompras: entrada.filtro.estaEnListaCompras,
        },
        cantidad: entrada.cantidad,
        cantidadEquivalencias: 0,
        draftId: crearTempId("equipo_filtro"),
        estadoOperacion: "nuevo",
        estadoAntesDeEliminar: null,
        filtroReferencia: clonarFiltroReferencia(entrada.filtro),
        tipoFiltroReferencia: clonarTipoFiltroReferencia(entrada.tipoFiltro),
      });
      return true;
    }
    function actualizarAsignacionFiltro(
      entrada: EditarAsignacionFiltroDraft,
    ): void {
      if (!draft.value || entrada.cantidad < 1) return;
      const item = draft.value.filtros.find(
        (filtro) =>
          filtro.draftId === entrada.draftId &&
          filtro.estadoOperacion !== "pendiente_eliminacion",
      );
      if (!item) return;
      if (entrada.tipoFiltroId === null) {
        if (item.tipoFiltroReferencia.estado !== "nuevo") return;
        item.cantidad = entrada.cantidad;
        return;
      }
      const tipo = auxiliares.value?.tiposFiltro.find(
        (filtro) => filtro.id === entrada.tipoFiltroId,
      );
      if (
        !tipo ||
        draft.value.filtros.some(
          (filtro) =>
            filtro.draftId !== item.draftId &&
            filtro.estadoOperacion !== "pendiente_eliminacion" &&
            filtro.tipoFiltro.id === tipo.id,
        )
      )
        return;
      item.tipoFiltro = { id: tipo.id, nombre: tipo.nombre };
      item.tipoFiltroReferencia = {
        estado: "existente",
        id: tipo.id,
        tempId: null,
        nombre: tipo.nombre,
      };
      item.cantidad = entrada.cantidad;
      if (item.estadoOperacion !== "nuevo") {
        const originalFiltro = original.value?.filtros.find(
          (filtro) => filtro.id === item.id,
        );
        item.estadoOperacion =
          originalFiltro && crearMotivoCambioFiltro(originalFiltro, item)
            ? "actualizado"
            : "existente";
      }
    }
    function marcarFiltroParaEliminar(draftId: string): void {
      if (!draft.value || activeFiltersCount.value <= 1) return;
      const item = draft.value.filtros.find(
        (filtro) => filtro.draftId === draftId,
      );
      if (!item || item.estadoOperacion === "pendiente_eliminacion") return;
      item.estadoAntesDeEliminar = item.estadoOperacion;
      item.estadoOperacion = "pendiente_eliminacion";
    }
    function deshacerEliminacionFiltro(draftId: string): void {
      const item = draft.value?.filtros.find(
        (filtro) => filtro.draftId === draftId,
      );
      if (!item || item.estadoOperacion !== "pendiente_eliminacion") return;
      item.estadoOperacion = item.estadoAntesDeEliminar ?? "existente";
      item.estadoAntesDeEliminar = null;
    }
    function aplicarEstructura(
      resultado: ResultadoMutacionEstructura,
    ): boolean {
      if (!draft.value || !resultado.ok) return false;
      draft.value.estructuraSistemas = resultado.nodos;
      validationErrors.value = [];
      return true;
    }
    function agregarSistemaRaiz(input: AgregarRaizEstructuraInput): boolean {
      return draft.value && auxiliares.value
        ? aplicarEstructura(
            agregarRaizEstructura(
              draft.value.estructuraSistemas,
              input,
              auxiliares.value,
            ),
          )
        : false;
    }
    async function crearSistemaYAgregarRaiz(input: {
      nombre: string;
      aceite: CatalogoActivo | null;
    }): Promise<boolean> {
      if (!auxiliares.value) return false;
      try {
        const resultado = await sistemasCatalogoService.guardar({
          id: null,
          nombre: normalizarTexto(input.nombre),
          activo: true,
        });
        const sistema: CatalogoActivo = {
          id: resultado.item.id,
          nombre: resultado.item.nombre,
          activo: resultado.item.activo,
        };
        auxiliares.value = {
          ...auxiliares.value,
          sistemas: [...auxiliares.value.sistemas, sistema],
        };
        return agregarSistemaRaiz({ sistema, aceite: input.aceite });
      } catch {
        validationErrors.value = [
          {
            codigo: "SISTEMA_NO_CREADO",
            mensaje:
              "No se pudo crear el sistema. Verifica el nombre e inténtalo nuevamente.",
            seccion: "estructura-lubricacion",
          },
        ];
        return false;
      }
    }
    async function crearSubsistemaYAgregarHijo(input: {
      parentLocalId: string;
      nombre: string;
      aceite: CatalogoActivo | null;
    }): Promise<boolean> {
      if (!auxiliares.value) return false;
      try {
        const resultado = await subsistemasCatalogoService.guardar({
          id: null,
          nombre: normalizarTexto(input.nombre),
          activo: true,
        });
        const subsistema: CatalogoActivo = {
          id: resultado.item.id,
          nombre: resultado.item.nombre,
          activo: resultado.item.activo,
        };
        auxiliares.value = {
          ...auxiliares.value,
          subsistemas: [...auxiliares.value.subsistemas, subsistema],
        };
        return agregarSubsistema({
          parentLocalId: input.parentLocalId,
          subsistema,
          aceite: input.aceite,
        });
      } catch {
        validationErrors.value = [
          {
            codigo: "SUBSISTEMA_NO_CREADO",
            mensaje:
              "No se pudo crear el subsistema. Verifica el nombre e inténtalo nuevamente.",
            seccion: "estructura-lubricacion",
          },
        ];
        return false;
      }
    }
    function agregarSubsistema(input: AgregarHijoEstructuraInput): boolean {
      return draft.value && auxiliares.value
        ? aplicarEstructura(
            agregarHijoEstructura(
              draft.value.estructuraSistemas,
              input,
              auxiliares.value,
            ),
          )
        : false;
    }
    function actualizarAceiteNodo(
      input: ActualizarNodoEstructuraInput,
    ): boolean {
      return draft.value && auxiliares.value
        ? aplicarEstructura(
            actualizarAceiteNodoEstructura(
              draft.value.estructuraSistemas,
              input,
              auxiliares.value,
            ),
          )
        : false;
    }
    function quitarAceiteNodo(localId: string): boolean {
      return actualizarAceiteNodo({ localId, aceite: null });
    }
    function moverNodo(input: MoverNodoEstructuraInput): boolean {
      return draft.value
        ? aplicarEstructura(
            moverNodoEstructura(draft.value.estructuraSistemas, input),
          )
        : false;
    }
    function obtenerSubarbolParaEliminar(localId: string) {
      return draft.value
        ? obtenerSubarbolActivo(draft.value.estructuraSistemas, localId)
        : [];
    }
    function confirmarEliminarNodo(localId: string): void {
      if (!draft.value) return;
      draft.value.estructuraSistemas = marcarNodoParaEliminar(
        draft.value.estructuraSistemas,
        localId,
      ).nodos;
    }
    function deshacerEliminacionNodo(localId: string): boolean {
      return draft.value
        ? aplicarEstructura(
            deshacerEliminacionNodoEstructura(
              draft.value.estructuraSistemas,
              localId,
            ),
          )
        : false;
    }
    function actualizarImagenPersistida(imagen: EquipoImagenPersistida): void {
      imagenPersistidaActual.value = { ...imagen };
      if (original.value) original.value.imagen = { ...imagen };
      if (draft.value) draft.value.imagen = { ...imagen };
      if (draft.value)
        useFiltrosEngraseStore().actualizarImagenEquipo(
          draft.value.equipo.id,
          imagen,
        );
    }
    function actualizarEstadoSyncImagen(estado: ImagenSyncState): void {
      const movimientoResuelto =
        imagenSyncState.value.kind === "move_pending" && estado.kind === "idle";
      imagenSyncState.value = estado;
      if (movimientoResuelto)
        successMessage.value =
          "Los cambios y la imagen quedaron sincronizados correctamente.";
    }
    async function guardar(
      moverImagen: MoverImagenEquipo,
    ): Promise<ResultadoGuardadoEquipo> {
      if (saving.value) return { kind: "busy" };
      if (!original.value || !draft.value || !codigoOriginal.value)
        return { kind: "invalid" };
      saveError.value = null;
      successMessage.value = null;
      const validacion = validarEquipoEngrase(draft.value);
      validationErrors.value = validacion.errores;
      if (!validacion.valido) return { kind: "invalid" };
      const cambios = construirCambiosEquipo(original.value, draft.value);
      if (!hayCambiosEquipo(cambios)) {
        saveError.value = {
          codigo: "SIN_CAMBIOS",
          mensaje: "No hay cambios pendientes.",
        };
        return { kind: "empty" };
      }
      const rutaFuente = imagenPersistidaActual.value?.mainStoragePath ?? null;
      saving.value = true;
      try {
        const borradorPersistido = clonarBorrador(draft.value);
        const respuesta =
          await equipoEngraseEdicionService.actualizarEquipoCompleto({
            codigoOriginal: codigoOriginal.value,
            cambios,
          });
        const listado = useFiltrosEngraseStore();
        listado.aplicarEquipoActualizado(respuesta.equipoLista);
        listado.invalidarDetalleEquipo(respuesta.equipoLista.id);
        const snapshot = crearSnapshotPersistido(borradorPersistido, respuesta);
        codigoOriginal.value = respuesta.equipoLista.codigo;
        original.value = clonarSnapshot(snapshot);
        draft.value = crearBorrador(snapshot);
        imagenPersistidaActual.value = { ...snapshot.imagen };
        validationErrors.value = [];
        const rutaDestino = respuesta.equipoLista.main_storage_path;
        if (rutaFuente && rutaDestino && rutaFuente !== rutaDestino) {
          try {
            await moverImagen(rutaFuente, rutaDestino);
          } catch {
            imagenSyncState.value = {
              kind: "move_pending",
              sourcePath: rutaFuente,
              destinationPath: rutaDestino,
            };
          }
        }
        if (imagenSyncState.value.kind === "move_pending") {
          successMessage.value =
            "Los cambios se guardaron, pero falta mover la imagen a la ruta del nuevo código.";
          return { kind: "partial", respuesta };
        }
        successMessage.value =
          respuesta.mensaje || "Los cambios se guardaron correctamente.";
        return { kind: "success", respuesta };
      } catch (error) {
        const codigo =
          error instanceof Error
            ? extraerCodigoErrorEdicionEquipo(error.message)
            : "ERROR_EDICION_EQUIPO";
        const mapped = mapearErrorRpcEquipo(codigo);
        validationErrors.value = [mapped];
        saveError.value = { codigo, mensaje: mapped.mensaje };
        return { kind: "error" };
      } finally {
        saving.value = false;
      }
    }
    function reset(): void {
      solicitudActual += 1;
      codigoOriginal.value = null;
      original.value = null;
      draft.value = null;
      auxiliares.value = null;
      activeOverlay.value = null;
      loading.value = false;
      saving.value = false;
      loadError.value = null;
      saveError.value = null;
      validationErrors.value = [];
      successMessage.value = null;
      imagenPersistidaActual.value = null;
      imagenSyncState.value = { kind: "idle" };
    }
    return {
      codigoOriginal,
      original,
      draft,
      auxiliares,
      activeOverlay,
      loading,
      saving,
      loadError,
      saveError,
      validationErrors,
      successMessage,
      imagenPersistidaActual,
      imagenSyncState,
      isReady,
      isDirty,
      hasDataChanges,
      hasFilterChanges,
      hasStructureChanges,
      hasDataErrors,
      hasFilterErrors,
      hasStructureErrors,
      hasActiveOverlay,
      canSave,
      activeFiltersCount,
      activeStagesCount,
      activeStructureNodesCount,
      assignedOilsCount,
      cargar,
      solicitarSalida,
      continuarEditando,
      descartarCambios,
      reset,
      actualizarCodigo,
      seleccionarTipoEquipo,
      actualizarSubtipo,
      actualizarEstado,
      agregarEtapa,
      quitarEtapa,
      crearYSeleccionarTipoEquipo,
      esTipoEquipoDuplicado,
      abrirNuevoTipoEquipo,
      buscarFiltroOriginalParaAsignar,
      agregarFiltroExistente,
      agregarFiltroTemporal,
      actualizarAsignacionFiltro,
      marcarFiltroParaEliminar,
      deshacerEliminacionFiltro,
      agregarSistemaRaiz,
      crearSistemaYAgregarRaiz,
      crearSubsistemaYAgregarHijo,
      agregarSubsistema,
      actualizarAceiteNodo,
      quitarAceiteNodo,
      moverNodo,
      obtenerSubarbolParaEliminar,
      confirmarEliminarNodo,
      deshacerEliminacionNodo,
      actualizarImagenPersistida,
      actualizarEstadoSyncImagen,
      guardar,
    };
  },
);
