import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import { crearTempId } from "../shared/equipoEngraseDraft.tempIds";
import type { EquipoEngraseListItem } from "../filtrosEngrase.types";
import {
  crearClaveNombreCreacion,
  crearEquipoDraftInicial,
  normalizarCodigoCreacion,
  normalizarTextoCreacion,
} from "./equipoEngraseCreacion.draft";
import { equipoEngraseCreacionService } from "./equipoEngraseCreacion.service";
import { useFiltrosEngraseStore } from "../filtrosEngrase.store";
import { construirPayloadCrearEquipo } from "./equipoEngraseCreacion.payload";
import { mapearErrorRpcCreacionEquipo } from "./equipoEngraseCreacion.errors";
import {
  ErrorCreacionEquipo,
  extraerCodigoErrorCreacionEquipo,
} from "./equipoEngraseCreacion.remote-errors";
import {
  puedeSolicitarValidacionCodigo,
  validacionCorrespondeAlCodigoActual,
  crearClaveTipoFiltroCreacion,
  validarCreacionEquipoCompleta,
  validarPasoEstructuraLubricacion,
  validarPasoDatosEquipo,
  validarPasoFiltrosEquipo,
} from "./equipoEngraseCreacion.validation";
import {
  agregarHijoEstructura,
  agregarRaizEstructura,
  actualizarAceiteNodo,
  marcarNodoParaEliminar,
  obtenerSubarbolActivo,
} from "../shared/estructuraLubricacion.draft";
import type { CatalogoActivo } from "../shared/estructuraLubricacion.types";
import {
  agregarFiltroExistenteLocal,
  agregarFiltroLocal,
  actualizarFiltroLocal,
  buscarReferenciaFiltroTemporalPorCodigo,
  combinarSugerenciasFiltroCreacion,
  combinarTiposFiltroBusquedaCreacion,
  crearFiltroTemporal as crearFiltroTemporalLocal,
  crearOpcionesTipoFiltroCreacion,
  crearTipoFiltroTemporal as crearTipoFiltroTemporalLocal,
  estaTipoFiltroOcupado,
  obtenerEstadoCodigoFiltro,
} from "./equipoEngraseCreacion.filtros";
import type {
  AgregarFiltroExistenteCreacionInput,
  AgregarFiltroTemporalCreacionInput,
  AuxiliaresEquipoEngrase,
  CrearEquipoFiltroEditorState,
  CrearEquipoError,
  CrearEquipoFinalizacionState,
  CrearEquipoOverlayState,
  CrearEquipoPaso,
  CrearEquipoSubmitState,
  ResultadoCrearEquipoSubmit,
  CrearEquipoValidationIssue,
  CrearEquipoValidationResult,
  EquipoEstado,
  ImagenEquipoCreadoResultado,
  ResultadoFinalizarCreacion,
  EditarFiltroCreacionInput,
  FiltroNuevoCreacionReference,
  ResultadoMutacionFiltroCreacion,
  TipoEquipoCreacionReference,
  TipoFiltroCreacionReference,
} from "./equipoEngraseCreacion.types";

const copiarAuxiliares = (
  auxiliares: AuxiliaresEquipoEngrase,
): AuxiliaresEquipoEngrase => ({
  tiposEquipo: auxiliares.tiposEquipo.map((tipo) => ({
    ...tipo,
    subtiposSugeridos: [...tipo.subtiposSugeridos],
  })),
  etapas: auxiliares.etapas.map((etapa) => ({ ...etapa })),
  tiposFiltro: auxiliares.tiposFiltro.map((tipo) => ({
    ...tipo,
    tiposEquipoQueLoUsan: [...tipo.tiposEquipoQueLoUsan],
  })),
  sistemas: auxiliares.sistemas.map((sistema) => ({ ...sistema })),
  subsistemas: auxiliares.subsistemas.map((subsistema) => ({ ...subsistema })),
  aceites: auxiliares.aceites.map((aceite) => ({ ...aceite })),
});

const copiarEquipoLista = (
  equipo: EquipoEngraseListItem,
): EquipoEngraseListItem => ({
  ...equipo,
  etapas: equipo.etapas.map((etapa) => ({ ...etapa })),
});

const normalizarError = (error: Error): CrearEquipoError => ({
  codigo:
    error instanceof ErrorCreacionEquipo
      ? error.codigo
      : "ERROR_CARGA_AUXILIARES",
  mensaje: error.message || "No se pudieron cargar los auxiliares.",
});

export const useEquipoEngraseCreacionStore = defineStore(
  "dbequipos_engrase_creacion",
  () => {
    const draft = ref(crearEquipoDraftInicial());
    const auxiliares = ref<AuxiliaresEquipoEngrase | null>(null);
    const pasoActual = shallowRef<CrearEquipoPaso>(1);
    const mayorPasoCompletado = shallowRef<0 | 1 | 2 | 3 | 4>(0);
    const loadingInicial = shallowRef(false);
    const errorInicial = shallowRef<CrearEquipoError | null>(null);
    const validationErrors = ref<CrearEquipoValidationIssue[]>([]);
    const submitState = shallowRef<CrearEquipoSubmitState>({ kind: "idle" });
    const finalizacionState = shallowRef<CrearEquipoFinalizacionState>({
      kind: "pending",
    });
    const activeOverlay = shallowRef<CrearEquipoOverlayState | null>(null);
    const filtroEditor = shallowRef<CrearEquipoFiltroEditorState>({
      kind: "closed",
    });
    const cierreEditorFiltroPendiente = shallowRef(false);
    const salidaSolicitada = shallowRef(false);
    let solicitudCarga = 0;
    let solicitudValidacion = 0;
    let solicitudBusquedaFiltro = 0;
    let cargaPendiente: Promise<void> | null = null;

    const isReady = computed(
      () => auxiliares.value !== null && !loadingInicial.value,
    );
    const isCreated = computed(() => draft.value.equipoCreado !== null);
    const isCreating = computed(() => submitState.value.kind === "creating");
    const hasCreateError = computed(() => submitState.value.kind === "error");
    const createError = computed(() =>
      submitState.value.kind === "error"
        ? {
            codigo: submitState.value.codigo,
            mensaje: submitState.value.mensaje,
          }
        : null,
    );
    const creationSummary = computed(() =>
      submitState.value.kind === "success" ||
      submitState.value.kind === "success_with_local_warning"
        ? submitState.value.resumen
        : null,
    );
    const isInteractionLocked = computed(
      () => isCreating.value || isCreated.value,
    );
    const isDraftPhase = computed(
      () => !isCreated.value && pasoActual.value <= 4,
    );
    const isImagePhase = computed(
      () => isCreated.value && pasoActual.value === 5,
    );
    const hasActiveOverlay = computed(() => activeOverlay.value !== null);
    const hasDraftContent = computed(() => {
      const datos = draft.value.datos;
      return (
        Boolean(datos.codigo.trim()) ||
        datos.tipoEquipo !== null ||
        Boolean(datos.subtipo.trim()) ||
        datos.etapas.length > 0 ||
        datos.estado !== "activo" ||
        draft.value.filtros.length > 0 ||
        draft.value.estructuraSistemas.length > 0
      );
    });
    const canValidateCode = computed(
      () =>
        isReady.value &&
        !isInteractionLocked.value &&
        !isValidatingCode.value &&
        puedeSolicitarValidacionCodigo(draft.value.datos.codigo),
    );
    const isValidatingCode = computed(
      () => draft.value.validacionCodigo.estado === "loading",
    );
    const isCurrentCodeValidated = computed(() =>
      validacionCorrespondeAlCodigoActual(draft.value),
    );
    const canGoBack = computed(
      () =>
        isDraftPhase.value &&
        pasoActual.value > 1 &&
        !loadingInicial.value &&
        !hasActiveOverlay.value &&
        !isCreating.value,
    );
    const canGoNext = computed(() => {
      if (
        !isReady.value ||
        hasActiveOverlay.value ||
        !isDraftPhase.value ||
        pasoActual.value === 4 ||
        isCreating.value
      )
        return false;
      return validarPaso(pasoActual.value).valido;
    });
    const completedSteps = computed(
      () =>
        [1, 2, 3, 4].filter(
          (paso) => paso <= mayorPasoCompletado.value,
        ) as Array<1 | 2 | 3 | 4>,
    );
    const stagesCount = computed(() => draft.value.datos.etapas.length);
    const filtersCount = computed(() => draft.value.filtros.length);
    const usedFilterCodes = computed(
      () =>
        new Set(
          draft.value.filtros.map((filtro) =>
            normalizarCodigoCreacion(filtro.filtro.codigo),
          ),
        ),
    );
    const usedFilterIds = computed(
      () =>
        new Set(
          draft.value.filtros.flatMap((filtro) =>
            filtro.filtro.estado === "existente" ? [filtro.filtro.id] : [],
          ),
        ),
    );
    const occupiedFilterTypeKeys = computed(
      () =>
        new Set(
          draft.value.filtros.map((filtro) =>
            crearClaveTipoFiltroCreacion(filtro.tipoFiltro),
          ),
        ),
    );
    const occupiedExistingFilterTypeIds = computed(
      () =>
        new Set(
          draft.value.filtros.flatMap((filtro) =>
            filtro.tipoFiltro.estado === "existente"
              ? [filtro.tipoFiltro.id]
              : [],
          ),
        ),
    );
    const occupiedNewFilterTypeNames = computed(
      () =>
        new Set(
          draft.value.filtros.flatMap((filtro) =>
            filtro.tipoFiltro.estado === "nuevo"
              ? [crearClaveNombreCreacion(filtro.tipoFiltro.nombre)]
              : [],
          ),
        ),
    );
    const canOpenStep = computed(
      () =>
        (paso: CrearEquipoPaso): boolean =>
          puedeAbrirPaso(paso),
    );
    const canSubmitCreation = computed(
      () =>
        isReady.value &&
        pasoActual.value === 4 &&
        !isCreated.value &&
        !isCreating.value &&
        !hasActiveOverlay.value &&
        validarCreacionEquipoCompleta(draft.value).valido,
    );

    function puedeMutarBorrador(): boolean {
      return !isCreated.value && !isCreating.value;
    }

    function establecerErrores(errores: CrearEquipoValidationIssue[]): void {
      validationErrors.value = errores.map((error) => ({ ...error }));
    }

    function limpiarErrores(): void {
      validationErrors.value = [];
    }

    function limpiarErroresDeCampo(fieldId: string): void {
      validationErrors.value = validationErrors.value.filter(
        (error) => error.fieldId !== fieldId,
      );
    }

    function actualizarErroresPasoFiltros(): void {
      validationErrors.value = validationErrors.value.filter(
        (error) => error.paso !== 2,
      );
      const validacion = validarPasoFiltrosEquipo(draft.value);
      if (!validacion.valido)
        validationErrors.value.push(...validacion.errores);
    }

    function actualizarErroresPasoEstructura(): void {
      validationErrors.value = validationErrors.value.filter(
        (error) => error.paso !== 3,
      );
      const validacion = validarPasoEstructuraLubricacion(draft.value);
      if (!validacion.valido)
        validationErrors.value.push(...validacion.errores);
    }

    function registrarErrorMutacionEstructura(
      codigo: string,
      mensaje: string,
      fieldId?: string,
    ): void {
      validationErrors.value = validationErrors.value.filter(
        (error) => error.paso !== 3,
      );
      validationErrors.value.push({
        codigo,
        mensaje,
        paso: 3,
        seccion: "estructura",
        ...(fieldId ? { fieldId } : {}),
      });
    }

    async function cargarInicial(force = false): Promise<void> {
      if (cargaPendiente) return cargaPendiente;
      if (auxiliares.value !== null && !force) return;
      const solicitud = ++solicitudCarga;
      cargaPendiente = (async () => {
        loadingInicial.value = true;
        errorInicial.value = null;
        try {
          const respuesta =
            await equipoEngraseCreacionService.obtenerAuxiliaresEquipo();
          if (solicitud !== solicitudCarga) return;
          auxiliares.value = copiarAuxiliares(respuesta);
        } catch (error) {
          if (solicitud !== solicitudCarga) return;
          const fallo =
            error instanceof Error
              ? error
              : new Error("No se pudieron cargar los auxiliares.");
          errorInicial.value = normalizarError(fallo);
          if (auxiliares.value === null) auxiliares.value = null;
        } finally {
          if (solicitud === solicitudCarga) loadingInicial.value = false;
          if (solicitud === solicitudCarga) cargaPendiente = null;
        }
      })();
      return cargaPendiente;
    }

    const reintentarCargaInicial = (): Promise<void> => cargarInicial(true);

    function actualizarCodigo(codigo: string): void {
      if (!puedeMutarBorrador()) return;
      const anterior = normalizarCodigoCreacion(draft.value.datos.codigo);
      draft.value.datos.codigo = codigo;
      if (anterior !== normalizarCodigoCreacion(codigo)) {
        solicitudValidacion += 1;
        draft.value.validacionCodigo = { estado: "idle" };
      }
      limpiarErroresDeCampo("equipo-creacion-codigo");
    }

    function seleccionarTipoEquipo(tipo: TipoEquipoCreacionReference): void {
      if (!puedeMutarBorrador()) return;
      draft.value.datos.tipoEquipo = {
        ...tipo,
        subtiposSugeridos: [...tipo.subtiposSugeridos],
      };
      limpiarErroresDeCampo("equipo-creacion-tipo");
    }

    function limpiarTipoEquipo(): void {
      if (!puedeMutarBorrador()) return;
      draft.value.datos.tipoEquipo = null;
      limpiarErroresDeCampo("equipo-creacion-tipo");
    }

    function actualizarSubtipo(subtipo: string): void {
      if (!puedeMutarBorrador()) return;
      draft.value.datos.subtipo = subtipo;
      limpiarErroresDeCampo("equipo-creacion-subtipo");
    }

    function actualizarEstado(estado: EquipoEstado): void {
      if (!puedeMutarBorrador()) return;
      draft.value.datos.estado = estado;
      limpiarErroresDeCampo("equipo-creacion-estado");
    }

    function agregarEtapa(etapaId: number): void {
      if (
        !puedeMutarBorrador() ||
        draft.value.datos.etapas.some((etapa) => etapa.id === etapaId)
      )
        return;
      const etapa = auxiliares.value?.etapas.find(
        (item) => item.id === etapaId,
      );
      if (etapa) draft.value.datos.etapas.push({ ...etapa });
      limpiarErroresDeCampo("equipo-creacion-etapas");
    }

    function quitarEtapa(etapaId: number): void {
      if (!puedeMutarBorrador()) return;
      draft.value.datos.etapas = draft.value.datos.etapas.filter(
        (etapa) => etapa.id !== etapaId,
      );
      limpiarErroresDeCampo("equipo-creacion-etapas");
    }

    function esTipoEquipoDuplicado(nombre: string): boolean {
      const clave = crearClaveNombreCreacion(nombre);
      return (
        Boolean(clave) &&
        (auxiliares.value?.tiposEquipo.some(
          (tipo) => crearClaveNombreCreacion(tipo.nombre) === clave,
        ) ??
          false)
      );
    }

    function crearYSeleccionarTipoEquipo(nombre: string): boolean {
      const nombreNormalizado = normalizarTextoCreacion(nombre);
      if (
        !puedeMutarBorrador() ||
        !nombreNormalizado ||
        esTipoEquipoDuplicado(nombreNormalizado)
      )
        return false;
      seleccionarTipoEquipo({
        estado: "nuevo",
        id: null,
        tempId: crearTempId("tipo_equipo"),
        nombre: nombreNormalizado,
        subtiposSugeridos: [],
      });
      return true;
    }

    async function validarCodigoActual(): Promise<void> {
      if (!canValidateCode.value) return;
      const codigo = normalizarCodigoCreacion(draft.value.datos.codigo);
      const solicitud = ++solicitudValidacion;
      draft.value.validacionCodigo = { estado: "loading", codigo };
      try {
        const respuesta =
          await equipoEngraseCreacionService.validarCodigoEquipoParaCreacion(
            codigo,
          );
        if (
          solicitud !== solicitudValidacion ||
          codigo !== normalizarCodigoCreacion(draft.value.datos.codigo)
        )
          return;
        draft.value.validacionCodigo = respuesta.puedeCrearse
          ? { estado: "valido", codigo }
          : {
              estado: "invalido",
              codigo,
              modeloExistente: respuesta.modeloExistente,
              activoExistente: respuesta.activoExistente,
            };
      } catch (error) {
        if (
          solicitud !== solicitudValidacion ||
          codigo !== normalizarCodigoCreacion(draft.value.datos.codigo)
        )
          return;
        const mensaje =
          error instanceof Error
            ? error.message || "No se pudo validar el código."
            : "No se pudo validar el código.";
        draft.value.validacionCodigo = { estado: "error", codigo, mensaje };
      }
    }

    function validarPaso(paso: CrearEquipoPaso): CrearEquipoValidationResult {
      if (paso === 1) return validarPasoDatosEquipo(draft.value);
      if (paso === 2) return validarPasoFiltrosEquipo(draft.value);
      if (paso === 3) return validarPasoEstructuraLubricacion(draft.value);
      if (paso === 4) return validarCreacionEquipoCompleta(draft.value);
      return { valido: isCreated.value, errores: [] };
    }

    function avanzar(): boolean {
      if (!canGoNext.value || pasoActual.value === 4) return false;
      const validacion = validarPaso(pasoActual.value);
      establecerErrores(validacion.errores);
      if (!validacion.valido) return false;
      mayorPasoCompletado.value = Math.max(
        mayorPasoCompletado.value,
        pasoActual.value,
      ) as 1 | 2 | 3 | 4;
      pasoActual.value = (pasoActual.value + 1) as CrearEquipoPaso;
      limpiarErrores();
      return true;
    }

    function retroceder(): boolean {
      if (!canGoBack.value) return false;
      pasoActual.value = (pasoActual.value - 1) as CrearEquipoPaso;
      return true;
    }

    function puedeAbrirPaso(paso: CrearEquipoPaso): boolean {
      if (loadingInicial.value || hasActiveOverlay.value || isCreating.value)
        return false;
      if (isCreated.value) return paso === 5;
      if (paso === 5) return false;
      return paso <= Math.min(mayorPasoCompletado.value + 1, 4);
    }

    function irAPaso(paso: CrearEquipoPaso): boolean {
      if (!puedeAbrirPaso(paso)) return false;
      pasoActual.value = paso;
      return true;
    }

    function abrirOverlay(overlay: CrearEquipoOverlayState): boolean {
      if (isInteractionLocked.value || activeOverlay.value !== null)
        return false;
      if (overlay.kind === "agregar_filtro") {
        filtroEditor.value = {
          kind: "search",
          query: "",
          result: null,
          loading: false,
          error: null,
          dirty: false,
        };
        cierreEditorFiltroPendiente.value = false;
      }
      if (overlay.kind === "editar_filtro") {
        if (
          !draft.value.filtros.some(
            (filtro) => filtro.draftId === overlay.draftId,
          )
        )
          return false;
        filtroEditor.value = {
          kind: "edit",
          draftId: overlay.draftId,
          dirty: false,
        };
        cierreEditorFiltroPendiente.value = false;
      }
      activeOverlay.value = { ...overlay };
      return true;
    }

    function cerrarOverlay(): void {
      activeOverlay.value = null;
      if (filtroEditor.value.kind !== "closed") descartarEditorFiltro();
    }

    function abrirAgregarFiltro(): boolean {
      return pasoActual.value === 2 && abrirOverlay({ kind: "agregar_filtro" });
    }

    async function buscarFiltroOriginal(codigo: string): Promise<void> {
      if (filtroEditor.value.kind !== "search" || !puedeMutarBorrador()) return;
      const query = normalizarCodigoCreacion(codigo);
      if (
        !query ||
        (filtroEditor.value.loading && filtroEditor.value.query === query)
      )
        return;
      const solicitud = ++solicitudBusquedaFiltro;
      filtroEditor.value = {
        kind: "search",
        query,
        result: null,
        loading: true,
        error: null,
        dirty: true,
      };
      try {
        const result =
          await equipoEngraseCreacionService.buscarFiltroOriginalParaCreacion(
            query,
          );
        if (
          solicitud !== solicitudBusquedaFiltro ||
          filtroEditor.value.kind !== "search"
        )
          return;
        filtroEditor.value = { ...filtroEditor.value, loading: false, result };
      } catch (error) {
        if (
          solicitud !== solicitudBusquedaFiltro ||
          filtroEditor.value.kind !== "search"
        )
          return;
        const mensaje =
          error instanceof Error
            ? error.message || "No se pudo buscar el filtro."
            : "No se pudo buscar el filtro.";
        filtroEditor.value = {
          ...filtroEditor.value,
          loading: false,
          error: mensaje,
        };
      }
    }

    function abrirEditarFiltro(draftId: string): boolean {
      return abrirOverlay({ kind: "editar_filtro", draftId });
    }

    function cerrarEditorFiltroTrasExito(): void {
      solicitudBusquedaFiltro += 1;
      filtroEditor.value = { kind: "closed" };
      activeOverlay.value = null;
      cierreEditorFiltroPendiente.value = false;
    }

    function agregarFiltroExistente(
      input: AgregarFiltroExistenteCreacionInput,
    ): ResultadoMutacionFiltroCreacion {
      if (!puedeMutarBorrador())
        return {
          ok: false,
          codigo: "EQUIPO_YA_CREADO",
          mensaje: "El equipo ya fue creado.",
        };
      const cambio = agregarFiltroExistenteLocal(input, draft.value.filtros);
      if (cambio.resultado.ok) {
        draft.value.filtros = cambio.filtros;
        actualizarErroresPasoFiltros();
        cerrarEditorFiltroTrasExito();
      }
      return cambio.resultado;
    }

    function agregarFiltroTemporal(
      input: AgregarFiltroTemporalCreacionInput,
    ): ResultadoMutacionFiltroCreacion {
      if (!puedeMutarBorrador())
        return {
          ok: false,
          codigo: "EQUIPO_YA_CREADO",
          mensaje: "El equipo ya fue creado.",
        };
      const cambio = agregarFiltroLocal(input, draft.value.filtros);
      if (cambio.resultado.ok) {
        draft.value.filtros = cambio.filtros;
        actualizarErroresPasoFiltros();
        cerrarEditorFiltroTrasExito();
      }
      return cambio.resultado;
    }

    function actualizarFiltro(
      input: EditarFiltroCreacionInput,
    ): ResultadoMutacionFiltroCreacion {
      if (!puedeMutarBorrador())
        return {
          ok: false,
          codigo: "EQUIPO_YA_CREADO",
          mensaje: "El equipo ya fue creado.",
        };
      const cambio = actualizarFiltroLocal(input, draft.value.filtros);
      if (cambio.resultado.ok) {
        draft.value.filtros = cambio.filtros;
        actualizarErroresPasoFiltros();
        cerrarEditorFiltroTrasExito();
      }
      return cambio.resultado;
    }

    function quitarFiltro(draftId: string): ResultadoMutacionFiltroCreacion {
      if (!puedeMutarBorrador())
        return {
          ok: false,
          codigo: "EQUIPO_YA_CREADO",
          mensaje: "El equipo ya fue creado.",
        };
      if (draft.value.filtros.length <= 1)
        return {
          ok: false,
          codigo: "FILTRO_MINIMO_REQUERIDO",
          mensaje: "Debe existir al menos un filtro.",
        };
      if (!draft.value.filtros.some((filtro) => filtro.draftId === draftId))
        return {
          ok: false,
          codigo: "FILTRO_NO_ENCONTRADO",
          mensaje: "No se encontró el filtro a eliminar.",
        };
      draft.value.filtros = draft.value.filtros.filter(
        (filtro) => filtro.draftId !== draftId,
      );
      actualizarErroresPasoFiltros();
      return { ok: true, draftId };
    }

    function crearTipoFiltroTemporal(
      nombre: string,
    ): TipoFiltroCreacionReference | null {
      const catalogo =
        auxiliares.value?.tiposFiltro.map((tipo) => ({
          estado: "existente" as const,
          id: tipo.id,
          tempId: null,
          nombre: tipo.nombre,
        })) ?? [];
      return crearTipoFiltroTemporalLocal(
        nombre,
        catalogo,
        draft.value.filtros,
      );
    }

    function crearFiltroTemporal(
      codigo: string,
      estaEnListaCompras: boolean,
    ): FiltroNuevoCreacionReference | null {
      return crearFiltroTemporalLocal(
        codigo,
        estaEnListaCompras,
        draft.value.filtros,
      );
    }

    function obtenerOpcionesTipoFiltro(excludeDraftId?: string) {
      const catalogo =
        auxiliares.value?.tiposFiltro.map((tipo) => ({
          estado: "existente" as const,
          id: tipo.id,
          tempId: null,
          nombre: tipo.nombre,
        })) ?? [];
      return crearOpcionesTipoFiltroCreacion(
        catalogo,
        draft.value.filtros,
        excludeDraftId,
      );
    }

    function solicitarCerrarEditorFiltro(): boolean {
      if (filtroEditor.value.kind === "closed") return true;
      if (!filtroEditor.value.dirty) {
        descartarEditorFiltro();
        return true;
      }
      cierreEditorFiltroPendiente.value = true;
      return false;
    }

    function continuarEditandoFiltro(): void {
      cierreEditorFiltroPendiente.value = false;
    }

    function descartarEditorFiltro(): void {
      solicitudBusquedaFiltro += 1;
      filtroEditor.value = { kind: "closed" };
      activeOverlay.value = null;
      cierreEditorFiltroPendiente.value = false;
    }

    function agregarSistemaRaiz(
      sistema: CatalogoActivo,
      aceite: CatalogoActivo | null,
    ): boolean {
      if (!puedeMutarBorrador() || !auxiliares.value) return false;
      const resultado = agregarRaizEstructura(
        draft.value.estructuraSistemas,
        {
          sistema,
          aceite,
        },
        auxiliares.value,
      );
      if (!resultado.ok) {
        registrarErrorMutacionEstructura(resultado.codigo, resultado.mensaje);
        return false;
      }
      draft.value.estructuraSistemas = resultado.nodos;
      actualizarErroresPasoEstructura();
      return true;
    }

    function agregarSubsistema(
      parentLocalId: string,
      subsistema: CatalogoActivo,
      aceite: CatalogoActivo | null,
    ): boolean {
      if (!puedeMutarBorrador() || !auxiliares.value) return false;
      const resultado = agregarHijoEstructura(
        draft.value.estructuraSistemas,
        {
          parentLocalId,
          subsistema,
          aceite,
        },
        auxiliares.value,
      );
      if (!resultado.ok) {
        registrarErrorMutacionEstructura(
          resultado.codigo,
          resultado.mensaje,
          parentLocalId,
        );
        return false;
      }
      draft.value.estructuraSistemas = resultado.nodos;
      actualizarErroresPasoEstructura();
      return true;
    }

    function asignarAceiteNodo(
      localId: string,
      aceite: CatalogoActivo | null,
    ): boolean {
      if (!puedeMutarBorrador() || !auxiliares.value) return false;
      const resultado = actualizarAceiteNodo(
        draft.value.estructuraSistemas,
        {
          localId,
          aceite,
        },
        auxiliares.value,
      );
      if (!resultado.ok) {
        registrarErrorMutacionEstructura(
          resultado.codigo,
          resultado.mensaje,
          localId,
        );
        return false;
      }
      draft.value.estructuraSistemas = resultado.nodos;
      actualizarErroresPasoEstructura();
      return true;
    }

    function subarbolNodo(localId: string) {
      return obtenerSubarbolActivo(draft.value.estructuraSistemas, localId);
    }

    function eliminarNodo(localId: string): void {
      if (!puedeMutarBorrador()) return;
      draft.value.estructuraSistemas = marcarNodoParaEliminar(
        draft.value.estructuraSistemas,
        localId,
      ).nodos;
      actualizarErroresPasoEstructura();
    }

    function registrarEquipoCreado(equipo: EquipoEngraseListItem): void {
      if (isCreated.value) return;
      draft.value.equipoCreado = copiarEquipoLista(equipo);
      mayorPasoCompletado.value = 4;
      pasoActual.value = 5;
      validationErrors.value = [];
      activeOverlay.value = null;
      salidaSolicitada.value = false;
      solicitudValidacion += 1;
      solicitudBusquedaFiltro += 1;
      filtroEditor.value = { kind: "closed" };
      finalizacionState.value = { kind: "pending" };
    }

    function actualizarImagenEquipoCreado(
      imagen: ImagenEquipoCreadoResultado,
    ): boolean {
      const equipo = draft.value.equipoCreado;
      if (!equipo || pasoActual.value !== 5) return false;
      draft.value.equipoCreado = {
        ...equipo,
        main_storage_path: imagen.mainStoragePath,
        tiene_imagen_main: imagen.tieneImagenMain,
        imagen_actualizada_en: imagen.imagenActualizadaEn,
        etapas: equipo.etapas.map((etapa) => ({ ...etapa })),
      };
      finalizacionState.value = { kind: "image_saved" };
      return true;
    }

    function finalizarCreacion(): ResultadoFinalizarCreacion {
      const equipo = draft.value.equipoCreado;
      if (!equipo || pasoActual.value !== 5) {
        return {
          ok: false,
          codigo: "FINALIZACION_NO_DISPONIBLE",
          mensaje: "El equipo aún no está listo para finalizar.",
        };
      }
      if (
        finalizacionState.value.kind !== "image_saved" &&
        finalizacionState.value.kind !== "image_skipped"
      ) {
        return {
          ok: false,
          codigo: "DECISION_IMAGEN_PENDIENTE",
          mensaje: "Guarda u omite la imagen antes de finalizar.",
        };
      }
      finalizacionState.value = { kind: "finished" };
      return { ok: true, equipo: copiarEquipoLista(equipo) };
    }

    function omitirImagen(): ResultadoFinalizarCreacion {
      if (!draft.value.equipoCreado || pasoActual.value !== 5) {
        return {
          ok: false,
          codigo: "IMAGEN_NO_DISPONIBLE",
          mensaje: "La imagen sólo puede omitirse después de crear el equipo.",
        };
      }
      finalizacionState.value = { kind: "image_skipped" };
      return finalizarCreacion();
    }

    async function crearEquipo(): Promise<ResultadoCrearEquipoSubmit> {
      if (isCreating.value) return { kind: "busy" };
      if (isCreated.value) return { kind: "already_created" };
      if (pasoActual.value !== 4 || !isReady.value || hasActiveOverlay.value) {
        const errores: CrearEquipoValidationIssue[] = [
          {
            codigo: "CREACION_NO_DISPONIBLE",
            mensaje: "Revisa el borrador antes de crear el equipo.",
            paso: 4,
            seccion: "general",
          },
        ];
        establecerErrores(errores);
        return { kind: "invalid", errores };
      }

      submitState.value = { kind: "creating" };
      limpiarErrores();
      const validacion = validarCreacionEquipoCompleta(draft.value);
      if (!validacion.valido) {
        establecerErrores(validacion.errores);
        submitState.value = { kind: "idle" };
        return { kind: "invalid", errores: validacion.errores };
      }

      const payload = construirPayloadCrearEquipo(draft.value);
      if (!payload.ok) {
        establecerErrores(payload.errores);
        submitState.value = { kind: "idle" };
        return { kind: "invalid", errores: payload.errores };
      }

      try {
        const respuesta =
          await equipoEngraseCreacionService.crearEquipoCompleto(
            payload.argumento,
          );
        if (isCreated.value) return { kind: "already_created" };
        let warning: string | null = null;
        try {
          const integracion = useFiltrosEngraseStore().aplicarEquipoCreado(
            respuesta.equipoLista,
          );
          warning =
            integracion.kind === "code_conflict" ? integracion.mensaje : null;
        } catch {
          warning =
            "El equipo fue creado, pero la lista local necesita sincronizarse.";
        }
        registrarEquipoCreado(respuesta.equipoLista);
        submitState.value =
          warning !== null
            ? {
                kind: "success_with_local_warning",
                mensaje: respuesta.mensaje,
                warning,
                resumen: respuesta.resumenOperaciones,
              }
            : {
                kind: "success",
                mensaje: respuesta.mensaje,
                resumen: respuesta.resumenOperaciones,
              };
        limpiarErrores();
        return { kind: "success", respuesta };
      } catch (error) {
        const codigo =
          error instanceof ErrorCreacionEquipo
            ? error.codigo
            : error instanceof Error
              ? extraerCodigoErrorCreacionEquipo(error.message)
              : "ERROR_CREACION_EQUIPO";
        const issue = mapearErrorRpcCreacionEquipo(codigo);
        if (codigo === "EQUIPO_YA_EXISTE_EN_ENGRASE") {
          draft.value.validacionCodigo = {
            estado: "invalido",
            codigo: normalizarCodigoCreacion(draft.value.datos.codigo),
            modeloExistente: null,
            activoExistente: null,
          };
        }
        establecerErrores([issue]);
        const errorCreacion: CrearEquipoError = {
          codigo,
          mensaje: issue.mensaje,
        };
        submitState.value = { kind: "error", ...errorCreacion };
        return { kind: "error", error: errorCreacion };
      }
    }

    function reiniciarBorrador(): void {
      if (
        isCreating.value ||
        (isCreated.value && finalizacionState.value.kind !== "finished")
      )
        return;
      solicitudValidacion += 1;
      draft.value = crearEquipoDraftInicial();
      pasoActual.value = 1;
      mayorPasoCompletado.value = 0;
      validationErrors.value = [];
      submitState.value = { kind: "idle" };
      finalizacionState.value = { kind: "pending" };
      activeOverlay.value = null;
      salidaSolicitada.value = false;
      solicitudBusquedaFiltro += 1;
      filtroEditor.value = { kind: "closed" };
      cierreEditorFiltroPendiente.value = false;
    }

    function solicitarSalida(): boolean {
      if (isCreating.value) return false;
      if (isCreated.value || !hasDraftContent.value) return true;
      if (hasActiveOverlay.value) return false;
      activeOverlay.value = { kind: "confirmar_salida" };
      salidaSolicitada.value = true;
      return false;
    }

    function continuarCreando(): void {
      activeOverlay.value = null;
      salidaSolicitada.value = false;
    }

    function confirmarDescarte(): void {
      reiniciarBorrador();
    }

    function resetCompleto(): void {
      if (
        isCreating.value ||
        (isCreated.value && finalizacionState.value.kind !== "finished")
      )
        return;
      reiniciarBorrador();
      solicitudCarga += 1;
      cargaPendiente = null;
      auxiliares.value = null;
      loadingInicial.value = false;
      errorInicial.value = null;
    }

    return {
      draft,
      auxiliares,
      pasoActual,
      mayorPasoCompletado,
      loadingInicial,
      errorInicial,
      validationErrors,
      submitState,
      finalizacionState,
      activeOverlay,
      filtroEditor,
      cierreEditorFiltroPendiente,
      salidaSolicitada,
      isReady,
      isCreated,
      isCreating,
      hasCreateError,
      createError,
      creationSummary,
      canSubmitCreation,
      isInteractionLocked,
      isDraftPhase,
      isImagePhase,
      hasActiveOverlay,
      hasDraftContent,
      canValidateCode,
      isValidatingCode,
      isCurrentCodeValidated,
      canGoBack,
      canGoNext,
      canOpenStep,
      completedSteps,
      stagesCount,
      filtersCount,
      usedFilterCodes,
      usedFilterIds,
      occupiedFilterTypeKeys,
      occupiedExistingFilterTypeIds,
      occupiedNewFilterTypeNames,
      cargarInicial,
      reintentarCargaInicial,
      actualizarCodigo,
      seleccionarTipoEquipo,
      limpiarTipoEquipo,
      actualizarSubtipo,
      actualizarEstado,
      agregarEtapa,
      quitarEtapa,
      crearYSeleccionarTipoEquipo,
      esTipoEquipoDuplicado,
      validarCodigoActual,
      validarPaso,
      avanzar,
      retroceder,
      puedeAbrirPaso,
      irAPaso,
      abrirOverlay,
      cerrarOverlay,
      abrirAgregarFiltro,
      buscarFiltroOriginal,
      abrirEditarFiltro,
      agregarFiltroExistente,
      agregarFiltroTemporal,
      actualizarFiltro,
      quitarFiltro,
      crearTipoFiltroTemporal,
      crearFiltroTemporal,
      buscarReferenciaFiltroTemporalPorCodigo: (codigo: string) =>
        buscarReferenciaFiltroTemporalPorCodigo(codigo, draft.value.filtros),
      combinarSugerenciasFiltro: (
        remotas: Parameters<typeof combinarSugerenciasFiltroCreacion>[0],
        query: string,
      ) =>
        combinarSugerenciasFiltroCreacion(remotas, draft.value.filtros, query),
      obtenerOpcionesTipoFiltro,
      estaTipoFiltroOcupado: (
        tipo: TipoFiltroCreacionReference,
        excludeDraftId?: string,
      ) => estaTipoFiltroOcupado(tipo, draft.value.filtros, excludeDraftId),
      obtenerEstadoCodigoFiltro: (codigo: string, excludeDraftId?: string) =>
        obtenerEstadoCodigoFiltro(codigo, draft.value.filtros, excludeDraftId),
      combinarTiposFiltroBusqueda: (
        tiposPosibles: Parameters<
          typeof combinarTiposFiltroBusquedaCreacion
        >[1],
        excludeDraftId?: string,
      ) =>
        combinarTiposFiltroBusquedaCreacion(
          auxiliares.value?.tiposFiltro.map((tipo) => ({
            estado: "existente" as const,
            id: tipo.id,
            tempId: null,
            nombre: tipo.nombre,
          })) ?? [],
          tiposPosibles,
          draft.value.filtros,
          excludeDraftId,
        ),
      solicitarCerrarEditorFiltro,
      continuarEditandoFiltro,
      descartarEditorFiltro,
      agregarSistemaRaiz,
      agregarSubsistema,
      asignarAceiteNodo,
      subarbolNodo,
      eliminarNodo,
      registrarEquipoCreado,
      crearEquipo,
      actualizarImagenEquipoCreado,
      omitirImagen,
      finalizarCreacion,
      limpiarErrores,
      limpiarErroresDeCampo,
      establecerErrores,
      solicitarSalida,
      continuarCreando,
      confirmarDescarte,
      reiniciarBorrador,
      resetCompleto,
    };
  },
);

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(useEquipoEngraseCreacionStore, import.meta.hot),
  );
}
