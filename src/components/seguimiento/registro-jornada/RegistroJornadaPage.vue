<script setup lang="ts">
import { computed, onMounted, reactive, shallowRef } from "vue";
import {
  ArrowLeft,
  CircleAlert,
  CheckCircle2,
  PencilLine,
} from "lucide-vue-next";
import { z } from "zod";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import { SEGUIMIENTO_FEATURES } from "@/seguimiento/shared/seguimiento.permissions";
import { useRegistroJornadaCatalogosStore } from "@/stores/seguimiento/registro-jornada/registroJornadaCatalogos.store";
import JornadaDatosGenerales from "./JornadaDatosGenerales.vue";
import JornadaDetalle from "./JornadaDetalle.vue";
import JornadaAcciones from "./JornadaAcciones.vue";
import JornadaResumen from "./JornadaResumen.vue";
import ImplementoCrearPanel from "./ImplementoCrearPanel.vue";
import RegistroJornadaFeedback from "./RegistroJornadaFeedback.vue";
import {
  RegistroEventosLoteFallidoError,
  mapearFilasDeJornadaAdministrativa,
  useJornadaAdmin,
} from "./composables/useJornadaAdmin";
import { registroJornadaService } from "./services/registroJornada.service";
import type {
  CatalogosJornada,
  ImplementoCrearPayload,
  ImplementoOption,
  JornadaDatosGeneralesModel,
  RegistroEventosLoteResponse,
  RegistroJornadaFeedback as RegistroJornadaFeedbackModel,
  JornadaState,
} from "./registroJornada.types";

const props = defineProps<{
  jornadaId?: string;
}>();

const implementoResponseSchema = z.object({
  implemento: z.object({
    id: z.string().min(1),
    numero: z.string(),
    nombre: z.string().nullable(),
    tipo_implemento_id: z.string().min(1),
    activo: z.boolean(),
  }),
});

const featureAccessStore = useFeatureAccessStore();
const catalogosStore = useRegistroJornadaCatalogosStore();
const router = useRouter();
const route = useRoute();
const {
  implementos,
  equipos,
  implementoTipos,
  labores,
  operadores,
  tiposParada,
  error: errorCatalogos,
} = storeToRefs(catalogosStore);

const jornada = reactive<JornadaState>({
  fecha: null,
  operadorId: null,
  equipoNumero: null,
  area: "Campo",
  observaciones: "",
  filas: [],
});

const catalogos = computed<CatalogosJornada>(() => ({
  labores: labores.value,
  tiposParada: tiposParada.value,
  implementos: implementos.value,
  implementoTipos: implementoTipos.value,
}));

const {
  finalizarDesdeFilas,
  guardarBorradorDesdeFilas,
  guardando,
  registrarImplemento,
  validarContinuidad,
  error,
  establecerJornadaPendiente,
} = useJornadaAdmin();
const validacionFilas = computed(() => validarContinuidad(jornada.filas));
const mostrarErroresFilas = shallowRef(false);
const filaImplementoActiva = shallowRef<number | null>(null);
const numeroImplementoInicial = shallowRef<string | null>(null);
const implementoPanelOpen = shallowRef(false);
const guardandoImplemento = shallowRef(false);
const errorImplemento = shallowRef<string | null>(null);
const resultadoRegistro = shallowRef<RegistroJornadaFeedbackModel | null>(null);
const cargandoBorrador = shallowRef(false);
const errorBorrador = shallowRef<string | null>(null);
const estadoInicial = shallowRef("");
const esEdicion = computed(() => Boolean(props.jornadaId));

function actualizarDatosGenerales(datos: JornadaDatosGeneralesModel): void {
  Object.assign(jornada, datos);
}

function solicitarCrearImplemento(index: number, numero: string): void {
  errorImplemento.value = null;
  filaImplementoActiva.value = index;
  numeroImplementoInicial.value = numero;
  implementoPanelOpen.value = true;
}

function limpiarDetalle(): void {
  jornada.filas.splice(0);
  mostrarErroresFilas.value = false;
  errorImplemento.value = null;
}

function volver(): void {
  const tieneCambios =
    esEdicion.value &&
    estadoInicial.value !== "" &&
    estadoInicial.value !== JSON.stringify(jornada);
  if (
    tieneCambios &&
    !window.confirm(
      "Tienes cambios sin guardar. ¿Quieres salir de todos modos?",
    )
  ) {
    return;
  }

  router.back();
}

async function cargarBorrador(jornadaId: string): Promise<void> {
  cargandoBorrador.value = true;
  errorBorrador.value = null;

  try {
    const detalle =
      await registroJornadaService.obtenerJornadaAdministrativa(jornadaId);
    if (detalle.estadoCaptura !== "en_edicion") {
      throw new Error(
        "La jornada seleccionada ya no está disponible para edición.",
      );
    }

    const equipoInicial =
      detalle.filas[0]?.equipoNumero ?? detalle.equipoNumero;
    Object.assign(jornada, {
      fecha: detalle.fechaOperativa,
      operadorId: detalle.operadorId,
      equipoNumero: equipoInicial,
      filas: mapearFilasDeJornadaAdministrativa(detalle.filas),
    });
    establecerJornadaPendiente(detalle.id);
    estadoInicial.value = JSON.stringify(jornada);
  } catch (capturado) {
    errorBorrador.value =
      capturado instanceof Error
        ? capturado.message
        : "No se pudo cargar el borrador.";
  } finally {
    cargandoBorrador.value = false;
  }
}

async function registrarYAsignarImplemento(
  payload: ImplementoCrearPayload,
): Promise<void> {
  guardandoImplemento.value = true;
  errorImplemento.value = null;

  try {
    const response = await registrarImplemento(payload);
    const resultado = implementoResponseSchema.safeParse(response);
    const filaActiva = filaImplementoActiva.value;

    if (
      !resultado.success ||
      filaActiva === null ||
      !jornada.filas[filaActiva]
    ) {
      errorImplemento.value =
        "No se recibió un implemento válido para asignar a la fila.";
      return;
    }

    const implemento: ImplementoOption = resultado.data.implemento;
    catalogosStore.agregarImplemento(implemento);

    jornada.filas[filaActiva].implementoId = implemento.id;
    implementoPanelOpen.value = false;
    filaImplementoActiva.value = null;
    numeroImplementoInicial.value = null;
  } catch (capturado) {
    errorImplemento.value =
      capturado instanceof Error
        ? capturado.message
        : "No se pudo registrar el implemento. Inténtalo nuevamente.";
  } finally {
    guardandoImplemento.value = false;
  }
}

async function finalizarJornada(): Promise<void> {
  mostrarErroresFilas.value = true;
  resultadoRegistro.value = null;
  try {
    const resultado = await finalizarDesdeFilas(jornada);
    resultadoRegistro.value = crearResultadoExitoso(resultado, "finalizada");
  } catch (capturado) {
    resultadoRegistro.value =
      capturado instanceof RegistroEventosLoteFallidoError
        ? crearResultadoErrorDeLote(capturado, "finalizada")
        : crearResultadoErrorGeneral(
            error.value ?? "No se pudo completar el registro.",
            "finalizada",
          );
  }
}

async function guardarBorrador(): Promise<void> {
  mostrarErroresFilas.value = true;
  resultadoRegistro.value = null;
  try {
    const resultado = await guardarBorradorDesdeFilas(jornada);
    resultadoRegistro.value = crearResultadoExitoso(resultado, "borrador");
  } catch (capturado) {
    resultadoRegistro.value =
      capturado instanceof RegistroEventosLoteFallidoError
        ? crearResultadoErrorDeLote(capturado, "borrador")
        : crearResultadoErrorGeneral(
            error.value ?? "No se pudo completar el registro.",
            "borrador",
          );
  }
}

function crearResultadoExitoso(
  resultado: RegistroEventosLoteResponse,
  modo: RegistroJornadaFeedbackModel["modo"],
): RegistroJornadaFeedbackModel {
  const borradorReemplazado = resultado.borrador_reemplazado ?? false;
  return {
    estado: "exito",
    modo,
    procesados: resultado.procesados,
    borradorReemplazado,
    mensaje:
      modo === "borrador"
        ? borradorReemplazado
          ? "El borrador fue actualizado correctamente."
          : "El borrador quedó guardado correctamente."
        : "La jornada quedó registrada y finalizada correctamente.",
  };
}

function crearResultadoErrorDeLote(
  capturado: RegistroEventosLoteFallidoError,
  modo: RegistroJornadaFeedbackModel["modo"],
): RegistroJornadaFeedbackModel {
  const resultado = capturado.resultado;
  const codigo = resultado.error?.mensaje ?? resultado.error?.codigo;
  return {
    estado: "error",
    modo,
    codigo,
    mensaje: describirErrorRegistro(codigo ?? capturado.message),
    eventoFallido: resultado.evento_fallido,
    borradorPrevioConservado: resultado.borrador_previo_conservado ?? false,
  };
}

function crearResultadoErrorGeneral(
  mensaje: string,
  modo: RegistroJornadaFeedbackModel["modo"],
): RegistroJornadaFeedbackModel {
  const codigo = extraerCodigoError(mensaje);
  return {
    estado: "error",
    modo,
    codigo,
    mensaje: describirErrorRegistro(codigo ?? mensaje),
  };
}

function extraerCodigoError(mensaje: string): string | undefined {
  return mensaje.match(/[A-Z][A-Z0-9_]+/)?.[0];
}

function describirErrorRegistro(codigo: string): string {
  if (codigo === "AUTH_REQUERIDA") return "Tu sesión no está disponible.";
  if (codigo === "ADMIN_CAPTURA_REQUERIDO")
    return "No tienes permiso para registrar jornadas administrativas.";
  if (codigo === "JORNADA_ID_YA_PUBLICADA")
    return "Esta jornada ya fue publicada y no puede modificarse.";
  if (codigo === "JORNADA_ADMIN_NO_EDITABLE")
    return "Este borrador ya no está disponible para edición.";
  if (codigo === "BORRADOR_NO_PUEDE_INCLUIR_FINALIZAR_JORNADA")
    return "El borrador contiene un evento de finalización no permitido.";
  if (codigo.includes("SECUENCIA"))
    return "Los eventos deben estar ordenados y ser consecutivos.";
  if (codigo.includes("FECHA") || codigo.includes("OCURRIO_EN"))
    return "Revisa la fecha y hora de los eventos registrados.";
  if (codigo.includes("LABOR")) return "Revisa la labor seleccionada.";
  if (codigo.includes("IMPLEMENTO"))
    return "Revisa el implemento seleccionado.";
  if (codigo.includes("PARADA") || codigo.includes("CAUSA"))
    return "Revisa la parada o causa seleccionada.";
  if (codigo.includes("FINALIZAR") || codigo.includes("FIN_"))
    return "Revisa el cierre y las horas finales de la jornada.";
  return "No se pudo registrar la jornada. Revisa los datos e inténtalo nuevamente.";
}

function cerrarResultadoRegistro(): void {
  resultadoRegistro.value = null;
  error.value = null;
}

function confirmarResultadoRegistro(): void {
  const registroExitoso = resultadoRegistro.value?.estado === "exito";
  cerrarResultadoRegistro();

  if (registroExitoso && esEdicion.value) {
    void router.replace({
      name: "RegistroJornadaAdministrativa",
      query: { ...route.query },
    });
  }
}

const canCreate = computed(() =>
  featureAccessStore.tieneFuncionalidad(
    SEGUIMIENTO_FEATURES.createAdministrativeJornadas,
  ),
);
const canFinalize = computed(() =>
  featureAccessStore.tieneFuncionalidad(
    SEGUIMIENTO_FEATURES.finalizeAdministrativeJornadas,
  ),
);

onMounted(() => {
  void (async () => {
    await catalogosStore.cargarCatalogos();
    if (props.jornadaId) await cargarBorrador(props.jornadaId);
  })();
});
</script>

<template>
  <main class="min-h-full bg-second px-3 py-3 sm:px-5 sm:py-4">
    <div class="mx-auto w-full max-w-[1680px]">
      <header class="flex flex-wrap items-start justify-between gap-4 py-1">
        <div class="min-w-0">
          <h1
            class="mt-1 text-[26px] font-black uppercase leading-none tracking-tight text-main-dark sm:text-[30px]"
          >
            {{ esEdicion ? "Editando jornada" : "Registro de jornada" }}
          </h1>
          <p v-if="esEdicion" class="mt-1 text-xs text-gray-500">
            Editando borrador.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span
            class="flex h-11 items-center gap-2 rounded-full bg-[#fff4df] px-4 text-xs font-semibold text-[#c77919]"
          >
            <PencilLine class="size-4" aria-hidden="true" /> Borrador
          </span>
          <button
            type="button"
            class="flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-[#d8d2c8] bg-white px-4 text-sm font-semibold text-main-dark shadow-sm transition-colors hover:bg-[#faf9f6]"
            @click="volver"
          >
            <ArrowLeft class="size-4" aria-hidden="true" /> Volver
          </button>
        </div>
      </header>

      <p
        v-if="cargandoBorrador"
        class="mt-3 rounded-md border border-info/20 bg-info-bg px-3 py-2 text-xs text-info"
      >
        Cargando borrador…
      </p>
      <p
        v-else-if="errorBorrador"
        class="mt-3 flex items-start gap-2 rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-xs text-danger"
        role="alert"
      >
        <CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {{ errorBorrador }}
      </p>

      <JornadaDatosGenerales
        v-if="!cargandoBorrador && !errorBorrador"
        :model-value="jornada"
        :operadores="operadores"
        :equipos="equipos"
        @update:model-value="actualizarDatosGenerales"
      />

      <p
        v-if="!cargandoBorrador && !errorBorrador && errorCatalogos"
        class="mt-3 flex items-start gap-2 rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-xs text-danger"
        role="alert"
      >
        <CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {{ errorCatalogos }}
      </p>

      <JornadaDetalle
        v-if="!cargandoBorrador && !errorBorrador"
        v-model:filas="jornada.filas"
        :catalogos="catalogos"
        :mostrar-errores="mostrarErroresFilas"
        @crear-implemento="solicitarCrearImplemento"
        @limpiar="limpiarDetalle"
      >
        <template #footer>
          <div
            class="grid gap-3 border-t border-[#ddd8d0] bg-white px-3.5 py-3 sm:px-4 lg:grid-cols-[minmax(0,1fr)_438px]"
          >
            <label class="min-w-0">
              <span
                class="mb-1 block text-[10px] font-bold uppercase tracking-[0.07em] text-gray-600"
                >Observaciones generales</span
              >
              <textarea
                v-model="jornada.observaciones"
                class="min-h-[72px] w-full resize-y rounded-xl border border-[#bdb5aa] bg-white px-3 py-2.5 text-xs text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-main"
                placeholder="Opcional. Ej.: Jornada transcrita desde informe físico..."
              />
            </label>
            <JornadaResumen :filas="jornada.filas" />
          </div>

          <div
            class="flex flex-col gap-3 border-t border-[#ddd8d0] bg-[#fcfbf9] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
          >
            <p
              class="flex items-center gap-2 text-xs font-medium"
              :class="validacionFilas.ok ? 'text-success' : 'text-gray-600'"
              role="status"
            >
              <CheckCircle2 class="size-4 shrink-0" aria-hidden="true" />
              {{ validacionFilas.mensaje }}
            </p>
            <JornadaAcciones
              :valido="validacionFilas.ok"
              :guardando="guardando"
              :guardar-disponible="canCreate"
              :finalizar-disponible="canFinalize"
              @guardar="guardarBorrador"
              @finalizar="finalizarJornada"
            />
          </div>
        </template>
      </JornadaDetalle>

      <ImplementoCrearPanel
        v-model:open="implementoPanelOpen"
        :fila-numero="
          filaImplementoActiva === null ? null : filaImplementoActiva + 1
        "
        :numero-inicial="numeroImplementoInicial"
        :tipos-implemento="catalogos.implementoTipos"
        :guardando="guardandoImplemento"
        :error="errorImplemento"
        @crear="registrarYAsignarImplemento"
      />

      <RegistroJornadaFeedback
        v-if="resultadoRegistro"
        :resultado="resultadoRegistro"
        @cerrar="cerrarResultadoRegistro"
        @confirmar="confirmarResultadoRegistro"
      />

      <p
        v-if="error && !resultadoRegistro"
        class="mt-3 flex items-start gap-2 rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-xs text-danger"
        role="alert"
      >
        <CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {{ error }}
      </p>
    </div>
  </main>
</template>
