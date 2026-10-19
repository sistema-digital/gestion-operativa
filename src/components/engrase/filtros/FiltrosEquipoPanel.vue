<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";
import { storeToRefs } from "pinia";
import {
  Sprout,
  Wheat,
  SquarePen,
  ImageOff,
  LoaderCircle,
  Maximize2,
} from "lucide-vue-next";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import { obtenerIconoTipoFiltro } from "@/utils/filtrosEngraseIconos";
import ImageZoomViewer from "@/components/common/ImageZoomViewer.vue";
import FiltrosEquipoAceitesPanel from "./FiltrosEquipoAceitesPanel.vue";
import FiltrosEquipoDatosGeneralesPanel from "./FiltrosEquipoDatosGeneralesPanel.vue";
import EquipoEstadoConfirmDialog from "./EquipoEstadoConfirmDialog.vue";
import type {
  EquipoEngraseListItem,
  EquipoAceiteDetalle,
  EquipoDetalleFull,
  EquipoFiltroDetalle,
  FiltroEquivalenciaRow,
  FiltrosEngraseEstadoEquipo,
  FiltrosEngrasePestanaEquipo,
} from "@/stores/dbequipos/engrase/filtrosEngrase.types";

const props = defineProps<{
  equipo: EquipoEngraseListItem | null;
  filtros: EquipoFiltroDetalle[];
  aceites: EquipoAceiteDetalle[];
  datosGenerales: EquipoDetalleFull | null;
  equivalencias: Record<number, FiltroEquivalenciaRow[]>;
  codigoBuscado: string | null;
  selectedFiltroId: number | null;
  loading: boolean;
  loadingAceites: boolean;
  loadingDatosGenerales: boolean;
  error: string | null;
  errorAceites: string | null;
  errorDatosGenerales: string | null;
  loadingCambioEstado: boolean;
  errorCambioEstado: string | null;
}>();
const emit = defineEmits<{
  selectFiltro: [number | null];
  tabVisible: [tab: FiltrosEngrasePestanaEquipo, force?: boolean];
  backToEquipos: [];
  editarEquipo: [string];
  cambiarEstado: [codigo: string, estado: "activo" | "descartado"];
}>();
const featureAccessStore = useFeatureAccessStore();
const { isLoaded: isFeatureAccessLoaded } = storeToRefs(featureAccessStore);
const canEditFiltrosEngrase = computed(
  () =>
    isFeatureAccessLoaded.value &&
    featureAccessStore.tieneFuncionalidad("editar_filtros_engrase"),
);
const canViewDatosGenerales = computed(
  () =>
    isFeatureAccessLoaded.value &&
    featureAccessStore.tieneFuncionalidad("equipo_datos_generales"),
);
const canViewFiltros = computed(
  () =>
    isFeatureAccessLoaded.value &&
    featureAccessStore.tieneFuncionalidad("equipo_filtros"),
);
const canViewSistemasAceites = computed(
  () =>
    isFeatureAccessLoaded.value &&
    featureAccessStore.tieneFuncionalidad("equipos_sistemas_aceites"),
);
const pestanasDisponibles = computed<FiltrosEngrasePestanaEquipo[]>(() => [
  ...(canViewDatosGenerales.value ? (["general"] as const) : []),
  ...(canViewFiltros.value ? (["filtros"] as const) : []),
  ...(canViewSistemasAceites.value ? (["aceites"] as const) : []),
]);
function coincideConBusqueda(filtro: EquipoFiltroDetalle) {
  const codigo = props.codigoBuscado;
  return Boolean(
    codigo &&
    (filtro.filtro.codigo === codigo ||
      (props.equivalencias[filtro.filtro_id] ?? []).some(
        (x) => x.codigo_equivalente === codigo,
      )),
  );
}
const filtrosOrdenados = computed(() =>
  !props.codigoBuscado
    ? props.filtros
    : [...props.filtros].sort(
        (a, b) =>
          Number(coincideConBusqueda(b)) - Number(coincideConBusqueda(a)),
      ),
);
const grupoSeleccionado = shallowRef<string | null>(null);
const soloConEquivalencias = shallowRef(false);
const soloEnCompras = shallowRef(false);
const opcionesDeListadoAbiertas = shallowRef(false);
const imagenPrincipalFallida = shallowRef(false);
const visorImagenAbierto = shallowRef(false);
const pestanaActiva = shallowRef<FiltrosEngrasePestanaEquipo | null>(null);
const estadoPendiente = shallowRef<FiltrosEngraseEstadoEquipo | null>(null);
const confirmacionEstadoEnviada = shallowRef(false);
watch(
  () => [props.equipo?.id, props.equipo?.imageUrl] as const,
  () => {
    imagenPrincipalFallida.value = false;
    visorImagenAbierto.value = false;
  },
);
watch(
  pestanasDisponibles,
  (pestanas) => {
    if (!pestanaActiva.value || !pestanas.includes(pestanaActiva.value))
      seleccionarPestana(pestanas[0] ?? null);
  },
  { immediate: true },
);
watch(
  () => props.equipo?.id,
  (equipoId, equipoAnteriorId) => {
    if (
      equipoId !== undefined &&
      equipoId !== equipoAnteriorId &&
      pestanaActiva.value
    )
      emit("tabVisible", pestanaActiva.value);
  },
);
watch(canViewFiltros, (canView) => {
  if (
    !isFeatureAccessLoaded.value ||
    canView ||
    props.selectedFiltroId === null
  )
    return;
  emit("selectFiltro", null);
});
const puedeAmpliarImagen = computed(
  () => Boolean(props.equipo?.imageUrl) && !imagenPrincipalFallida.value,
);
const cantidadFiltrosDeListadoActivos = computed(
  () =>
    Number(grupoSeleccionado.value !== null) +
    Number(soloConEquivalencias.value) +
    Number(soloEnCompras.value),
);
const hayFiltrosDeListadoActivos = computed(
  () => cantidadFiltrosDeListadoActivos.value > 0,
);
function esCultivo(nombre: string) {
  return nombre.trim().toLocaleLowerCase() === "cultivo";
}
function esZafra(nombre: string) {
  return nombre.trim().toLocaleLowerCase() === "zafra";
}
const gruposDeFiltros = computed(() => {
  const grupos = new Map<
    string,
    ReturnType<typeof obtenerIconoTipoFiltro> & { cantidad: number }
  >();

  props.filtros.forEach((filtro) => {
    const clasificacion = obtenerIconoTipoFiltro(filtro.tipoFiltro.nombre);
    const grupoExistente = grupos.get(clasificacion.grupo);

    grupos.set(clasificacion.grupo, {
      ...clasificacion,
      cantidad: (grupoExistente?.cantidad ?? 0) + 1,
    });
  });

  return [...grupos.values()];
});
const filtrosVisibles = computed(() =>
  filtrosOrdenados.value.filter(
    (filtro) =>
      (!grupoSeleccionado.value ||
        obtenerIconoTipoFiltro(filtro.tipoFiltro.nombre).grupo ===
          grupoSeleccionado.value) &&
      (!soloConEquivalencias.value ||
        (props.equivalencias[filtro.filtro_id] ?? []).length > 0) &&
      (!soloEnCompras.value || filtro.filtro.esta_en_lista_compras),
  ),
);
function alternarGrupo(grupo: string) {
  grupoSeleccionado.value = grupoSeleccionado.value === grupo ? null : grupo;
}
function seleccionarPestana(pestana: FiltrosEngrasePestanaEquipo | null): void {
  if (pestana === null || pestanaActiva.value === pestana) return;
  pestanaActiva.value = pestana;
  emit("tabVisible", pestana);
}
function reintentarPestanaActiva(): void {
  if (pestanaActiva.value) emit("tabVisible", pestanaActiva.value, true);
}
function abrirVisorImagen(): void {
  if (!puedeAmpliarImagen.value) return;
  visorImagenAbierto.value = true;
}
function solicitarCambioEstado(): void {
  if (!props.equipo || props.loadingCambioEstado) return;
  estadoPendiente.value =
    props.equipo.estado === "activo" ? "descartado" : "activo";
}
function cancelarCambioEstado(): void {
  if (props.loadingCambioEstado) return;
  estadoPendiente.value = null;
  confirmacionEstadoEnviada.value = false;
}
function confirmarCambioEstado(): void {
  if (
    !props.equipo ||
    !estadoPendiente.value ||
    props.loadingCambioEstado ||
    confirmacionEstadoEnviada.value
  )
    return;
  confirmacionEstadoEnviada.value = true;
  emit("cambiarEstado", props.equipo.codigo, estadoPendiente.value);
}
watch(
  () => props.loadingCambioEstado,
  (loading, estabaCargando) => {
    if (
      !loading &&
      estabaCargando &&
      confirmacionEstadoEnviada.value &&
      !props.errorCambioEstado
    )
      cancelarCambioEstado();
    if (!loading && props.errorCambioEstado)
      confirmacionEstadoEnviada.value = false;
  },
);
</script>
<template>
  <section
    class="min-h-0 overflow-auto rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
  >
    <button
      type="button"
      class="mb-2 cursor-pointer text-xs font-semibold text-main md:hidden"
      @click="$emit('backToEquipos')"
    >
      ← Equipos
    </button>
    <template v-if="equipo">
      <header class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-start gap-3">
          <button
            v-if="puedeAmpliarImagen"
            type="button"
            class="group relative grid aspect-square w-20 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-md bg-second-dark text-gray-400 outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 sm:w-24"
            :aria-label="`Ampliar imagen del equipo ${equipo.codigo}`"
            @click="abrirVisorImagen"
          >
            <img
              class="h-full w-full object-cover transition duration-200 group-hover:scale-105"
              :src="equipo.imageUrl!"
              :alt="`Imagen del equipo ${equipo.codigo}`"
              @error="imagenPrincipalFallida = true"
            />
            <span
              class="pointer-events-none absolute inset-0 grid place-items-center bg-main-dark/0 text-white opacity-0 transition group-hover:bg-main-dark/40 group-hover:opacity-100 group-focus-visible:bg-main-dark/40 group-focus-visible:opacity-100"
              aria-hidden="true"
            >
              <Maximize2 class="h-4 w-4" />
            </span>
          </button>
          <div
            v-else
            class="grid aspect-square w-20 shrink-0 place-items-center overflow-hidden rounded-md bg-second-dark text-gray-400 sm:w-24"
          >
            <ImageOff
              class="h-5 w-5"
              :aria-label="`Sin imagen: ${equipo.codigo}`"
            />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-main">
              {{ equipo.tipo_equipo }}
            </p>
            <h2 class="font-mono text-lg font-semibold text-main">
              {{ equipo.codigo }}
            </h2>
            <p
              class="flex flex-wrap items-center gap-x-1 text-xs text-gray-500"
            >
              Modelo: {{ equipo.subtipo || "Sin modelo" }} ·
              <template v-if="equipo.etapas.length"
                ><span
                  v-for="etapa in equipo.etapas"
                  :key="etapa.id"
                  class="inline-flex items-center gap-0.5"
                  ><Sprout
                    v-if="esCultivo(etapa.nombre)"
                    class="h-3 w-3 text-main"
                  /><Wheat
                    v-else-if="esZafra(etapa.nombre)"
                    class="h-3 w-3 text-accent"
                  />{{ etapa.nombre }}</span
                ></template
              ><template v-else>Sin etapa</template>
            </p>
          </div>
        </div>
        <div
          v-if="canEditFiltrosEngrase"
          class="flex shrink-0 flex-col items-end gap-1"
        >
          <span
            class="text-[10px] font-bold uppercase"
            :class="equipo.estado === 'activo' ? 'text-main' : 'text-danger'"
          >
            {{ equipo.estado }}
          </span>
          <button
            type="button"
            role="switch"
            class="relative h-5 w-10 cursor-pointer rounded-full p-0.5 shadow-inner transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main disabled:cursor-wait disabled:opacity-70"
            :class="equipo.estado === 'activo' ? 'bg-main' : 'bg-danger'"
            :aria-checked="equipo.estado === 'activo'"
            :aria-label="`Cambiar estado del equipo; actualmente ${equipo.estado}`"
            :disabled="loadingCambioEstado"
            @click="solicitarCambioEstado"
          >
            <span
              class="grid h-4 w-4 place-items-center rounded-full bg-white shadow-md transition-transform duration-200"
              :class="
                equipo.estado === 'activo' ? 'translate-x-5' : 'translate-x-0'
              "
              aria-hidden="true"
            >
              <LoaderCircle
                v-if="loadingCambioEstado"
                class="h-2.5 w-2.5 animate-spin text-gray-500"
              />
            </span>
          </button>
        </div>
        <b
          v-else
          class="rounded px-1.5 py-1 text-[10px] font-semibold uppercase"
          :class="
            equipo.estado === 'activo'
              ? 'bg-main/10 text-main'
              : 'bg-danger-bg text-danger'
          "
          >{{ equipo.estado }}</b
        >
      </header>
      <p v-if="errorCambioEstado" class="mt-3 text-xs text-danger" role="alert">
        {{ errorCambioEstado }}
      </p>
      <div
        v-if="pestanasDisponibles.length"
        class="mt-3 flex border-b border-gray-200"
        role="tablist"
        aria-label="Información del equipo"
      >
        <button
          v-if="canViewDatosGenerales"
          type="button"
          id="tab-datos-generales-equipo"
          role="tab"
          class="cursor-pointer border-b-2 px-3 py-2 text-xs font-semibold transition"
          :class="
            pestanaActiva === 'general'
              ? 'border-main text-main'
              : 'border-transparent text-gray-500 hover:border-main/30 hover:text-main'
          "
          :aria-selected="pestanaActiva === 'general'"
          aria-controls="panel-datos-generales-equipo"
          @click="seleccionarPestana('general')"
        >
          Datos generales
        </button>
        <button
          v-if="canViewFiltros"
          type="button"
          id="tab-filtros-equipo"
          role="tab"
          class="cursor-pointer border-b-2 px-3 py-2 text-xs font-semibold transition"
          :class="
            pestanaActiva === 'filtros'
              ? 'border-main text-main'
              : 'border-transparent text-gray-500 hover:border-main/30 hover:text-main'
          "
          :aria-selected="pestanaActiva === 'filtros'"
          aria-controls="panel-filtros-equipo"
          @click="seleccionarPestana('filtros')"
        >
          Filtros <span class="ml-1 text-gray-500">{{ filtros.length }}</span>
        </button>
        <button
          v-if="canViewSistemasAceites"
          type="button"
          id="tab-aceites-equipo"
          role="tab"
          class="cursor-pointer border-b-2 px-3 py-2 text-xs font-semibold transition"
          :class="
            pestanaActiva === 'aceites'
              ? 'border-main text-main'
              : 'border-transparent text-gray-500 hover:border-main/30 hover:text-main'
          "
          :aria-selected="pestanaActiva === 'aceites'"
          aria-controls="panel-aceites-equipo"
          @click="seleccionarPestana('aceites')"
        >
          Aceites <span class="ml-1 text-gray-500">{{ aceites.length }}</span>
        </button>
      </div>
      <FiltrosEquipoDatosGeneralesPanel
        v-if="pestanaActiva === 'general'"
        :detalle="datosGenerales"
        :loading="loadingDatosGenerales"
        :error="errorDatosGenerales"
        @retry="reintentarPestanaActiva"
      />
      <section
        v-else-if="pestanaActiva === 'filtros'"
        id="panel-filtros-equipo"
        class="pt-3"
        role="tabpanel"
        aria-labelledby="tab-filtros-equipo"
      >
        <div class="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <p class="whitespace-nowrap text-gray-500">
            Total filtros: <b class="text-main">{{ filtros.length }}</b>
          </p>
          <button
            type="button"
            class="cursor-pointer inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-medium transition"
            :class="
              hayFiltrosDeListadoActivos
                ? 'border-second-deep bg-second text-main hover:bg-second-dark'
                : 'border-gray-200 text-gray-600 hover:border-main/40 hover:text-main'
            "
            :aria-expanded="opcionesDeListadoAbiertas"
            aria-controls="opciones-de-listado"
            :title="
              hayFiltrosDeListadoActivos
                ? `${cantidadFiltrosDeListadoActivos} filtro(s) aplicado(s)`
                : 'Mostrar filtros de listado'
            "
            @click="opcionesDeListadoAbiertas = !opcionesDeListadoAbiertas"
          >
            Mostrar por
            <span
              v-if="hayFiltrosDeListadoActivos && !opcionesDeListadoAbiertas"
              class="h-1.5 w-1.5 rounded-full bg-second-deep"
              aria-hidden="true"
            />
            <span
              v-if="hayFiltrosDeListadoActivos && !opcionesDeListadoAbiertas"
              class="sr-only"
            >
              {{ cantidadFiltrosDeListadoActivos }} filtro(s) aplicado(s)
            </span>
          </button>
          <button
            v-if="canEditFiltrosEngrase"
            type="button"
            class="cursor-pointer rounded-md border border-gray-200 p-1 text-main transition hover:border-main/40 hover:bg-main/10"
            aria-label="Editar equipo y estructura de lubricación"
            title="Editar estructura de lubricación"
            @click="emit('editarEquipo', equipo.codigo)"
          >
            <SquarePen class="h-4 w-4" />
          </button>
        </div>
        <div
          id="opciones-de-listado"
          v-show="opcionesDeListadoAbiertas"
          class="mb-3"
        >
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              class="cursor-pointer flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-1 transition"
              :class="
                soloConEquivalencias
                  ? 'border-main bg-main/10 text-main'
                  : 'border-gray-200 text-gray-600 hover:border-main/40'
              "
              :aria-pressed="soloConEquivalencias"
              @click="soloConEquivalencias = !soloConEquivalencias"
            >
              Con equivalencias
              <span class="font-semibold">{{
                filtros.filter((x) => (equivalencias[x.filtro_id] ?? []).length)
                  .length
              }}</span>
            </button>
            <button
              type="button"
              class="cursor-pointer flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-1 transition"
              :class="
                soloEnCompras
                  ? 'border-main bg-main/10 text-main'
                  : 'border-gray-200 text-gray-600 hover:border-main/40'
              "
              :aria-pressed="soloEnCompras"
              @click="soloEnCompras = !soloEnCompras"
            >
              En compras
              <span class="font-semibold">{{
                filtros.filter((x) => x.filtro.esta_en_lista_compras).length
              }}</span>
            </button>
          </div>
          <div aria-hidden="true" class="my-3 border-t border-gray-200" />
          <div
            v-if="gruposDeFiltros.length"
            class="flex flex-wrap gap-2"
            aria-label="Filtrar filtros por grupo"
          >
            <button
              v-for="grupo in gruposDeFiltros"
              :key="grupo.grupo"
              type="button"
              class="cursor-pointer flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 text-xs transition"
              :class="
                grupoSeleccionado === grupo.grupo
                  ? 'border-main bg-main/10 text-main'
                  : 'border-gray-200 text-gray-600 hover:border-main/40'
              "
              :aria-pressed="grupoSeleccionado === grupo.grupo"
              @click="alternarGrupo(grupo.grupo)"
            >
              <component
                :is="grupo.icono"
                class="h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>{{ grupo.nombreGrupo }}</span>
              <span class="font-semibold">{{ grupo.cantidad }}</span>
            </button>
          </div>
        </div>
        <p v-if="loading" class="p-4 text-center text-xs text-gray-500">
          Cargando filtros…
        </p>
        <p v-else-if="error" class="p-4 text-center text-xs text-danger">
          {{ error }}
          <button
            class="cursor-pointer font-semibold underline"
            @click="reintentarPestanaActiva"
          >
            Reintentar
          </button>
        </p>
        <p
          v-else-if="!filtros.length"
          class="p-4 text-center text-xs text-gray-500"
        >
          Este equipo no tiene filtros asignados.
        </p>
        <div v-else class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <button
            v-for="filtro in filtrosVisibles"
            :key="filtro.id"
            class="cursor-pointer rounded-md border p-2 text-left text-xs transition hover:border-main/40"
            :class="
              selectedFiltroId === filtro.id
                ? 'border-main bg-main/5'
                : 'border-gray-200'
            "
            :aria-selected="selectedFiltroId === filtro.id"
            @click="$emit('selectFiltro', filtro.id)"
          >
            <strong class="flex items-center gap-1.5 text-sm text-main">
              <component
                :is="obtenerIconoTipoFiltro(filtro.tipoFiltro.nombre).icono"
                class="h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              {{ filtro.tipoFiltro.nombre }}
            </strong>
            <dl class="mt-2 grid grid-cols-2 gap-y-1 text-gray-500">
              <dt>Código original</dt>
              <dd class="text-right font-mono">
                <span
                  class="inline-block rounded px-1 font-bold text-main"
                  :class="{ 'codigo-buscado': coincideConBusqueda(filtro) }"
                  >{{ filtro.filtro.codigo }}</span
                >
              </dd>
              <dt>Cantidad</dt>
              <dd class="text-right">x{{ filtro.cantidad }}</dd>
              <dt>Equivalencias</dt>
              <dd class="text-right">
                {{ (equivalencias[filtro.filtro_id] ?? []).length }}
              </dd>
              <dt>En compras</dt>
              <dd class="text-right">
                {{ filtro.filtro.esta_en_lista_compras ? "Sí" : "No" }}
              </dd>
            </dl>
          </button>
        </div>
      </section>
      <FiltrosEquipoAceitesPanel
        v-else-if="pestanaActiva === 'aceites'"
        id="panel-aceites-equipo"
        :aceites="aceites"
        :can-edit="canEditFiltrosEngrase"
        :loading="loadingAceites"
        :error="errorAceites"
        role="tabpanel"
        aria-labelledby="tab-aceites-equipo"
        @edit="emit('editarEquipo', equipo.codigo)"
        @retry="reintentarPestanaActiva"
      />
      <p
        v-else-if="isFeatureAccessLoaded"
        class="mt-3 rounded-md bg-gray-50 p-3 text-xs text-gray-500"
      >
        No tienes permisos para ver información adicional de este equipo.
      </p>
      <EquipoEstadoConfirmDialog
        v-if="estadoPendiente"
        :codigo-equipo="equipo.codigo"
        :estado-destino="estadoPendiente"
        :saving="loadingCambioEstado"
        @cancel="cancelarCambioEstado"
        @confirm="confirmarCambioEstado"
      />
      <ImageZoomViewer
        v-if="visorImagenAbierto && equipo.imageUrl"
        :image-url="equipo.imageUrl"
        :image-alt="`Imagen ampliada del equipo ${equipo.codigo}`"
        @close="visorImagenAbierto = false"
      />
    </template>
    <p v-else class="p-4 text-center text-xs text-gray-500">
      Seleccione un equipo para ver sus filtros.
    </p>
  </section>
</template>

<style scoped>
@keyframes codigo-buscado-parpadeo {
  0%,
  100% {
    box-shadow: 0 0 0 transparent;
  }
  50% {
    box-shadow: 0 0 8px var(--color-main);
  }
}

.codigo-buscado {
  animation: codigo-buscado-parpadeo 1.8s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .codigo-buscado {
    animation: none;
  }
}
</style>
