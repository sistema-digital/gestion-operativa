<script setup lang="ts">
/**
 * RegistroJornadaPage.vue
 *
 * ORQUESTADOR PRINCIPAL.
 *
 * Une todos los componentes de la pantalla sin cambiar la apariencia del mockup.
 *
 * RPC coordinados mediante service/composable:
 * - rpc_admin_listar_operadores
 * - rpc_obtener_catalogos_offline
 * - rpc_admin_obtener_jornada
 * - rpc_admin_iniciar_jornada
 * - rpc_admin_cambiar_labor
 * - rpc_admin_registrar_parada
 * - rpc_admin_cambiar_tipo_parada
 * - rpc_admin_reanudar_trabajo
 * - rpc_admin_confirmar_cambio_implemento
 * - rpc_admin_finalizar_jornada
 * - rpc_admin_registrar_implemento
 *
 * Este componente NO debería llamar `supabase.rpc()` directamente.
 */

import { computed, reactive, ref } from 'vue';

import JornadaDatosGenerales from './components/JornadaDatosGenerales.vue';
import JornadaDetalle from './components/JornadaDetalle.vue';
import JornadaResumen from './components/JornadaResumen.vue';
import JornadaAcciones from './components/JornadaAcciones.vue';
import ImplementoCrearPanel from './components/ImplementoCrearPanel.vue';

import { useJornadaAdmin } from './composables/useJornadaAdmin';
import type {
  CatalogosJornada,
  ImplementoOption,
  JornadaState,
  OperadorOption,
  EquipoOption,
} from './registroJornada.types';

const jornada = reactive<JornadaState>({
  fecha: '2026-09-12',
  operadorId: null,
  equipoNumero: null,
  area: 'Campo',
  observaciones: '',
  filas: [],
});

const operadores = ref<OperadorOption[]>([]);
const equipos = ref<EquipoOption[]>([]);
const catalogos = reactive<CatalogosJornada>({
  labores: [],
  tiposParada: [],
  implementos: [],
  implementoTipos: [],
});

const filaImplementoActiva = ref<number | null>(null);
const implementoPanelOpen = ref(false);

const {
  guardando,
  validarContinuidad,
  registrarImplemento,
  finalizarDesdeFilas,
} = useJornadaAdmin();

const validacion = computed(() => validarContinuidad(jornada.filas));

function abrirNuevoImplemento(index: number) {
  filaImplementoActiva.value = index;
  implementoPanelOpen.value = true;
}

async function onImplementoCreado(payload: {
  numero: string;
  tipoImplementoId: string;
  nombre?: string | null;
}) {
  const response = await registrarImplemento(payload);
  const implemento = response?.implemento as ImplementoOption | undefined;
  if (!implemento || filaImplementoActiva.value == null) return;

  const existente = catalogos.implementos.find((x) => x.id === implemento.id);
  if (!existente) catalogos.implementos.push(implemento);

  jornada.filas[filaImplementoActiva.value].implementoId = implemento.id;
  implementoPanelOpen.value = false;
  filaImplementoActiva.value = null;
}

async function finalizar() {
  await finalizarDesdeFilas(jornada);
}
</script>

<template>
  <main class="mx-auto max-w-[1540px] p-2 sm:p-3.5">
    <header class="mb-2 flex items-start justify-between gap-3">
      <div>
        <p class="text-[9px] font-bold uppercase tracking-[.13em] text-main">
          Seguimiento / Captura manual
        </p>
        <h1 class="font-display text-2xl text-main-dark sm:text-[28px]">
          Registro de jornada
        </h1>
        <p class="mt-0.5 text-[10px] text-gray-500 sm:text-[11px]">
          Transcribe el informe diario de horas máquina manteniendo el flujo de la jornada.
        </p>
      </div>
    </header>

    <JornadaDatosGenerales
      v-model="jornada"
      :operadores="operadores"
      :equipos="equipos"
    />

    <JornadaDetalle
      v-model:filas="jornada.filas"
      :catalogos="catalogos"
      @crear-implemento="abrirNuevoImplemento"
    />

    <JornadaResumen
      v-model:observaciones="jornada.observaciones"
      :filas="jornada.filas"
    />

    <JornadaAcciones
      :valido="validacion.ok"
      :mensaje-validacion="validacion.mensaje"
      :guardando="guardando"
      @guardar="() => {}"
      @finalizar="finalizar"
    />

    <ImplementoCrearPanel
      v-model:open="implementoPanelOpen"
      :fila-numero="filaImplementoActiva == null ? null : filaImplementoActiva + 1"
      :tipos-implemento="catalogos.implementoTipos"
      @crear="onImplementoCreado"
    />
  </main>
</template>
