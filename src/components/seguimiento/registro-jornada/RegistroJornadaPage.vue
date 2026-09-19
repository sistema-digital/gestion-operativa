<script setup lang="ts">
import { computed, reactive, shallowRef } from "vue";
import {
  CircleAlert,
  ClipboardPenLine,
  LockKeyhole,
  ShieldCheck,
} from "lucide-vue-next";
import { z } from "zod";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import { SEGUIMIENTO_FEATURES } from "@/seguimiento/shared/seguimiento.permissions";
import JornadaDatosGenerales from "./JornadaDatosGenerales.vue";
import JornadaDetalle from "./JornadaDetalle.vue";
import JornadaAcciones from "./JornadaAcciones.vue";
import ImplementoCrearPanel from "./ImplementoCrearPanel.vue";
import { useJornadaAdmin } from "./composables/useJornadaAdmin";
import type {
  CatalogosJornada,
  EquipoOption,
  ImplementoCrearPayload,
  ImplementoOption,
  JornadaState,
  OperadorOption,
} from "./registroJornada.types";

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

const jornada = reactive<JornadaState>({
  fecha: "2026-09-12",
  operadorId: null,
  equipoNumero: null,
  area: "Campo",
  observaciones: "",
  filas: [],
});

const operadores = reactive<OperadorOption[]>([]);
const equipos = reactive<EquipoOption[]>([]);
const catalogos = reactive<CatalogosJornada>({
  labores: [],
  tiposParada: [],
  implementos: [],
  implementoTipos: [],
});

const {
  finalizarDesdeFilas,
  guardando,
  registrarImplemento,
  validarContinuidad,
  error,
} = useJornadaAdmin();
const validacionFilas = computed(() => validarContinuidad(jornada.filas));
const filaImplementoActiva = shallowRef<number | null>(null);
const implementoPanelOpen = shallowRef(false);
const guardandoImplemento = shallowRef(false);
const errorImplemento = shallowRef<string | null>(null);

function solicitarCrearImplemento(index: number): void {
  errorImplemento.value = null;
  filaImplementoActiva.value = index;
  implementoPanelOpen.value = true;
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
    if (!catalogos.implementos.some((item) => item.id === implemento.id)) {
      catalogos.implementos.push(implemento);
    }

    jornada.filas[filaActiva].implementoId = implemento.id;
    implementoPanelOpen.value = false;
    filaImplementoActiva.value = null;
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
  try {
    await finalizarDesdeFilas(jornada);
  } catch {
    // El composable conserva el error para presentarlo en esta pantalla.
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
const canCreateImplement = computed(() =>
  featureAccessStore.tieneFuncionalidad(
    SEGUIMIENTO_FEATURES.createAdministrativeJornadaImplement,
  ),
);
</script>

<template>
  <main
    class="mx-auto min-h-full max-w-5xl bg-second px-3 py-4 sm:px-5 sm:py-6"
  >
    <section
      class="rounded-xl border border-main/10 bg-white p-4 shadow-sm sm:p-6"
    >
      <div class="flex items-start gap-3">
        <div
          class="grid size-10 shrink-0 place-items-center rounded-lg bg-main text-accent"
        >
          <ClipboardPenLine class="size-5" aria-hidden="true" />
        </div>
        <div class="min-w-0">
          <p
            class="text-[10px] font-bold uppercase tracking-[0.16em] text-main"
          >
            Seguimiento / captura manual
          </p>
          <h1 class="mt-1 text-base font-bold text-main-dark sm:text-lg">
            Registro de jornadas
          </h1>
          <p class="mt-1 text-xs leading-5 text-gray-500">
            Transcribe jornadas registradas en papel al flujo administrativo.
          </p>
        </div>
      </div>

      <div
        class="mt-5 rounded-lg border border-main/10 bg-second/60 p-3 text-xs leading-5 text-gray-600"
      >
        <div class="flex items-center gap-2 font-semibold text-main-dark">
          <ShieldCheck class="size-4 shrink-0" aria-hidden="true" />
          Base del módulo habilitada
        </div>
        <p class="mt-1">
          La captura, los catálogos, las validaciones y la persistencia se
          incorporarán con sus especificaciones funcionales; esta pantalla no
          infiere contratos ni ejecuta RPC directamente.
        </p>
      </div>

      <div class="mt-5 grid gap-2 sm:grid-cols-3">
        <div class="rounded-lg border border-gray-200 p-3">
          <p
            class="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500"
          >
            Edición y borrador
          </p>
          <p class="mt-1 text-xs font-semibold text-main-dark">
            {{ canCreate ? "Autorizada" : "Solo lectura" }}
          </p>
        </div>
        <div class="rounded-lg border border-gray-200 p-3">
          <p
            class="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500"
          >
            Finalización
          </p>
          <p class="mt-1 text-xs font-semibold text-main-dark">
            {{ canFinalize ? "Autorizada" : "No autorizada" }}
          </p>
        </div>
        <div class="rounded-lg border border-gray-200 p-3">
          <p
            class="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500"
          >
            Nuevo implemento
          </p>
          <p class="mt-1 text-xs font-semibold text-main-dark">
            {{ canCreateImplement ? "Autorizado" : "No autorizado" }}
          </p>
        </div>
      </div>

      <div
        v-if="!canCreate"
        class="mt-5 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-gray-600"
      >
        <LockKeyhole
          class="mt-0.5 size-4 shrink-0 text-warning"
          aria-hidden="true"
        />
        <p>
          Tu acceso actual permite consultar esta vista. La edición requiere el
          permiso de creación de jornadas administrativas.
        </p>
      </div>

      <JornadaDatosGenerales
        v-model="jornada"
        :operadores="operadores"
        :equipos="equipos"
      />

      <JornadaDetalle
        v-model:filas="jornada.filas"
        :catalogos="catalogos"
        @crear-implemento="solicitarCrearImplemento"
      />

      <ImplementoCrearPanel
        v-model:open="implementoPanelOpen"
        :fila-numero="
          filaImplementoActiva === null ? null : filaImplementoActiva + 1
        "
        :tipos-implemento="catalogos.implementoTipos"
        :guardando="guardandoImplemento"
        :error="errorImplemento"
        @crear="registrarYAsignarImplemento"
      />

      <p
        v-if="error"
        class="mt-3 flex items-start gap-2 rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-xs text-danger"
        role="alert"
      >
        <CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {{ error }}
      </p>

      <p
        class="mt-3 rounded-md border px-3 py-2 text-xs"
        :class="
          validacionFilas.ok
            ? 'border-success/30 bg-success/10 text-success'
            : 'border-warning/30 bg-warning/10 text-gray-600'
        "
        role="status"
      >
        {{ validacionFilas.mensaje }}
      </p>

      <JornadaAcciones
        :valido="validacionFilas.ok"
        :guardando="guardando"
        @guardar="() => {}"
        @finalizar="finalizarJornada"
      />
    </section>
  </main>
</template>
