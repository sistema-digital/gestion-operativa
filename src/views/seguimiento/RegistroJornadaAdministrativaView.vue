<script setup lang="ts">
import { computed, onMounted, shallowRef, watch } from "vue";
import { CircleAlert, ListFilter, Plus } from "lucide-vue-next";
import { useRoute, useRouter } from "vue-router";
import JornadaAdministrativaDetallePanel from "@/components/seguimiento/registro-jornada/JornadaAdministrativaDetallePanel.vue";
import JornadaEliminarDialog from "@/components/seguimiento/registro-jornada/JornadaEliminarDialog.vue";
import JornadasAdministrativasFiltros from "@/components/seguimiento/registro-jornada/JornadasAdministrativasFiltros.vue";
import JornadasAdministrativasTabla from "@/components/seguimiento/registro-jornada/JornadasAdministrativasTabla.vue";
import { useJornadasAdministrativas } from "@/components/seguimiento/registro-jornada/composables/useJornadasAdministrativas";
import type {
  EquipoOption,
  JornadaAdministrativaFiltros,
  JornadaAdministrativaListaItem,
  JornadaEstadoCaptura,
} from "@/components/seguimiento/registro-jornada/registroJornada.types";

const router = useRouter();
const route = useRoute();

function formatearFechaLocal(fecha: Date): string {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const hoy = new Date();
const haceUnaSemana = new Date(hoy);
haceUnaSemana.setDate(hoy.getDate() - 7);
const filtrosIniciales: JornadaAdministrativaFiltros = {
  desde: formatearFechaLocal(haceUnaSemana),
  hasta: formatearFechaLocal(hoy),
  estado: null,
  equipoNumero: null,
};

function obtenerValorDeQuery(
  valor: string | null | (string | null)[] | undefined,
): string | null {
  if (Array.isArray(valor)) return valor[0] ?? null;
  return valor ?? null;
}

function esEstadoDeCaptura(
  valor: string | null,
): valor is JornadaEstadoCaptura {
  return (
    valor === "en_edicion" || valor === "finalizada" || valor === "descartada"
  );
}

function obtenerFiltrosDesdeUrl(): JornadaAdministrativaFiltros {
  const estado = obtenerValorDeQuery(route.query.estado);

  return {
    desde: obtenerValorDeQuery(route.query.desde) ?? filtrosIniciales.desde,
    hasta: obtenerValorDeQuery(route.query.hasta) ?? filtrosIniciales.hasta,
    estado: esEstadoDeCaptura(estado) ? estado : null,
    equipoNumero: obtenerValorDeQuery(route.query.equipo),
  };
}

function obtenerBusquedaDesdeUrl(): string {
  return obtenerValorDeQuery(route.query.busqueda) ?? "";
}

const filtros = shallowRef<JornadaAdministrativaFiltros>({
  ...obtenerFiltrosDesdeUrl(),
});
const busqueda = shallowRef(obtenerBusquedaDesdeUrl());
const panelDetalleAbierto = shallowRef(false);
const jornadaParaEliminar = shallowRef<JornadaAdministrativaListaItem | null>(
  null,
);
const {
  items,
  detalle,
  cargando,
  cargandoDetalle,
  eliminandoJornadaId,
  error,
  errorDetalle,
  cargar,
  consultarDetalle,
  cerrarDetalle,
  eliminarJornada,
} = useJornadasAdministrativas();

const ordenEstados: JornadaEstadoCaptura[] = [
  "en_edicion",
  "finalizada",
  "descartada",
];

const estadosDisponibles = computed(() => {
  const estadosCargados = new Set(
    items.value.map((jornada) => jornada.estadoCaptura),
  );

  return ordenEstados.filter((estado) => estadosCargados.has(estado));
});

const equiposDisponibles = computed<EquipoOption[]>(() =>
  [...new Set(items.value.map((jornada) => jornada.equipoNumero))]
    .sort((primerEquipo, segundoEquipo) =>
      primerEquipo.localeCompare(segundoEquipo, "es-PA", { numeric: true }),
    )
    .map((numero) => ({ numero, etiqueta: numero })),
);

const jornadasVisibles = computed(() => {
  const termino = busqueda.value.trim().toLocaleLowerCase("es-PA");

  return items.value.filter(
    (jornada) =>
      (termino === "" ||
        jornada.operador.toLocaleLowerCase("es-PA").includes(termino)) &&
      (filtros.value.estado === null ||
        jornada.estadoCaptura === filtros.value.estado) &&
      (filtros.value.equipoNumero === null ||
        jornada.equipoNumero === filtros.value.equipoNumero),
  );
});

async function aplicarFiltros(): Promise<void> {
  await cargar({ ...filtros.value });
  sincronizarFiltrosConCarga();
}

function sincronizarFiltrosConCarga(): void {
  const estadoEsDisponible =
    filtros.value.estado === null ||
    estadosDisponibles.value.includes(filtros.value.estado);
  const equipoEsDisponible =
    filtros.value.equipoNumero === null ||
    equiposDisponibles.value.some(
      (equipo) => equipo.numero === filtros.value.equipoNumero,
    );

  if (estadoEsDisponible && equipoEsDisponible) return;

  filtros.value = {
    ...filtros.value,
    estado: estadoEsDisponible ? filtros.value.estado : null,
    equipoNumero: equipoEsDisponible ? filtros.value.equipoNumero : null,
  };
}

async function limpiarFiltros(): Promise<void> {
  filtros.value = { ...filtrosIniciales };
  busqueda.value = "";
  await aplicarFiltros();
}

async function verDetalle(jornadaId: string): Promise<void> {
  panelDetalleAbierto.value = true;
  await consultarDetalle(jornadaId);
}

function cerrarPanelDetalle(): void {
  panelDetalleAbierto.value = false;
  cerrarDetalle();
}

function solicitarEliminarJornada(
  jornada: JornadaAdministrativaListaItem,
): void {
  jornadaParaEliminar.value = jornada;
}

function cancelarEliminarJornada(): void {
  if (eliminandoJornadaId.value) return;

  jornadaParaEliminar.value = null;
}

async function confirmarEliminarJornada(): Promise<void> {
  const jornada = jornadaParaEliminar.value;
  if (!jornada) return;

  const eliminada = await eliminarJornada(jornada.jornadaId);
  if (eliminada) jornadaParaEliminar.value = null;
}

function irANuevaJornada(): void {
  void router.push({ name: "RegistroJornadaAdministrativaCrear" });
}

function obtenerQueryDeFiltros(): Record<string, string | undefined> {
  return {
    desde: filtros.value.desde ?? undefined,
    hasta: filtros.value.hasta ?? undefined,
    estado: filtros.value.estado ?? undefined,
    equipo: filtros.value.equipoNumero ?? undefined,
    busqueda: busqueda.value.trim() || undefined,
  };
}

function editarJornada(jornadaId: string): void {
  void router.push({
    name: "RegistroJornadaAdministrativaEditar",
    params: { jornadaId },
    query: obtenerQueryDeFiltros(),
  });
}

watch(
  [filtros, busqueda],
  () => {
    void router.replace({
      query: obtenerQueryDeFiltros(),
    });
  },
  { deep: true },
);

onMounted(() => {
  void aplicarFiltros();
});
</script>

<template>
  <main class="min-h-full bg-second px-2 py-2.5 sm:px-4 sm:py-3">
    <div class="mx-auto w-full max-w-[1540px]">
      <JornadaAdministrativaDetallePanel
        v-if="panelDetalleAbierto"
        :cargando="cargandoDetalle"
        :error="errorDetalle"
        :jornada="detalle"
        @cerrar="cerrarPanelDetalle"
      />
      <template v-else>
        <header class="mb-2 flex items-start justify-between gap-3 sm:mb-3">
          <div class="min-w-0">
            <h1
              class="mt-0.5 font-display text-[26px] leading-none text-main-dark sm:text-[30px]"
            >
              Jornadas registradas
            </h1>
          </div>
          <button
            class="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-main bg-main px-3 text-xs font-bold text-white shadow-sm transition hover:bg-main-light sm:px-3.5"
            type="button"
            @click="irANuevaJornada"
          >
            <Plus class="size-4" aria-hidden="true" /><span
              class="hidden sm:inline"
              >Nueva jornada</span
            ><span class="sm:hidden">Nueva</span>
          </button>
        </header>

        <JornadasAdministrativasFiltros
          v-model="filtros"
          v-model:busqueda="busqueda"
          :equipos="equiposDisponibles"
          :estados="estadosDisponibles"
          @rango-actualizado="aplicarFiltros"
          @limpiar="limpiarFiltros"
        />

        <p
          v-if="error"
          class="mt-2 flex items-start gap-2 rounded-lg border border-danger/25 bg-danger-bg px-3 py-2 text-xs text-danger"
          role="alert"
        >
          <CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />{{
            error
          }}
        </p>

        <section
          class="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:mt-3"
        >
          <header
            class="flex items-center justify-between gap-3 border-b border-gray-200 px-3 py-2.5 sm:px-4"
          >
            <div class="flex min-w-0 items-center gap-2">
              <span
                class="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-info-bg text-info"
                ><ListFilter class="size-3.5" aria-hidden="true"
              /></span>
              <div class="min-w-0">
                <h2 class="text-xs font-bold text-gray-800">
                  Capturas administrativas
                </h2>
              </div>
            </div>
            <span
              class="shrink-0 rounded-full border border-info/20 bg-info-bg px-2 py-0.5 text-[10px] font-bold text-info"
              >{{ jornadasVisibles.length }}
              {{ jornadasVisibles.length === 1 ? "jornada" : "jornadas" }}</span
            >
          </header>
          <JornadasAdministrativasTabla
            :cargando="cargando"
            :jornadas="jornadasVisibles"
            @ver="verDetalle"
            @editar="editarJornada"
            @eliminar="solicitarEliminarJornada"
          />
          <footer
            class="border-t border-gray-200 px-3 py-2 text-[10px] text-gray-500 sm:px-4"
          >
            Mostrando hasta 100 jornadas administrativas recientes.
          </footer>
        </section>
      </template>

      <JornadaEliminarDialog
        v-if="jornadaParaEliminar"
        :jornada="jornadaParaEliminar"
        :eliminando="eliminandoJornadaId === jornadaParaEliminar.jornadaId"
        @cancelar="cancelarEliminarJornada"
        @confirmar="confirmarEliminarJornada"
      />
    </div>
  </main>
</template>
