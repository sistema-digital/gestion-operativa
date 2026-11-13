<script setup lang="ts">
import {
  Check,
  MessageSquarePlus,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-vue-next";
import { computed, ref, shallowRef, watch } from "vue";

import { observacionLineaSolicitudSchema } from "@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.schemas";
import type { SolicitudCompraObservacionLineaItem } from "@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types";

interface DetalleObservacionOption {
  localId: string;
  codigo: string;
  descripcion: string;
  detalle: string;
}

const props = withDefaults(
  defineProps<{
    detalles: DetalleObservacionOption[];
    observaciones: SolicitudCompraObservacionLineaItem[];
    titulo: string;
    descripcion: string;
    error?: string;
    showLista?: boolean;
    inline?: boolean;
    selectedDetalleLocalIds?: string[];
  }>(),
  {
    showLista: true,
    inline: false,
  },
);

const emit = defineEmits<{
  (
    event: "update:observaciones",
    value: SolicitudCompraObservacionLineaItem[],
  ): void;
  (event: "change-selection"): void;
  (event: "update:selected-detalle-local-ids", value: string[]): void;
}>();

const MAX_TEXTO_LENGTH = 500;
const isModalOpen = shallowRef(false);
const editingObservacionId = shallowRef<string | null>(null);
const texto = shallowRef("");
const detalleLocalIds = ref<string[]>([]);
const formError = shallowRef<string | null>(null);
const hasExternalSelection = computed(
  () => props.selectedDetalleLocalIds !== undefined,
);

const observacionesPorDetalle = computed(() => {
  const result = new Map<string, SolicitudCompraObservacionLineaItem[]>();

  props.observaciones.forEach((observacion) => {
    observacion.detalleLocalIds.forEach((localId) => {
      const observaciones = result.get(localId) ?? [];
      observaciones.push(observacion);
      result.set(localId, observaciones);
    });
  });

  return result;
});

const detallesSeleccionados = computed(() => {
  const selectedIds = new Set(detalleLocalIds.value);
  return props.detalles.filter((detalle) => selectedIds.has(detalle.localId));
});

const contadorTexto = computed(
  () => `${texto.value.length}/${MAX_TEXTO_LENGTH}`,
);
const isSaveDisabled = computed(
  () => !texto.value.trim() || detalleLocalIds.value.length === 0,
);
const modalDescription = computed(() => {
  if (props.showLista) {
    return "Selecciona una o varias líneas que compartirán esta indicación.";
  }

  const total = detallesSeleccionados.value.length;
  return `Se asociará a ${total} ${total === 1 ? "producto seleccionado" : "productos seleccionados"}.`;
});
const modalContainerClasses = computed(() =>
  props.inline
    ? "sticky bottom-0 z-30 mt-auto flex w-full justify-center bg-gradient-to-t from-white via-white to-transparent px-2 pb-2 pt-6 md:justify-start md:pl-[14rem]"
    : "fixed inset-0 z-[95] flex items-start justify-center bg-stone-950/35 px-3 pt-3 sm:px-4 sm:pt-4",
);
const modalClasses = computed(() =>
  props.inline
    ? "w-full max-w-[28.5rem] rounded-xl border border-stone-200 bg-white shadow-xl md:max-w-[20rem]"
    : "w-full max-w-[28.5rem] rounded-xl border border-stone-200 bg-white shadow-xl",
);

const getObservacionesDetalle = (
  localId: string,
): SolicitudCompraObservacionLineaItem[] =>
  observacionesPorDetalle.value.get(localId) ?? [];

const setDetalleLocalIds = (localIds: string[]): void => {
  detalleLocalIds.value = localIds;

  if (hasExternalSelection.value) {
    emit("update:selected-detalle-local-ids", localIds);
  }
};

watch(
  () => props.selectedDetalleLocalIds,
  (localIds) => {
    if (!localIds) {
      return;
    }

    detalleLocalIds.value = [...localIds];
  },
  { deep: true },
);

const closeModal = (): void => {
  isModalOpen.value = false;
  editingObservacionId.value = null;
  texto.value = "";
  detalleLocalIds.value = [];
  formError.value = null;
};

const openCreateModal = (localIds: string[]): void => {
  const validIds = new Set(props.detalles.map((detalle) => detalle.localId));

  editingObservacionId.value = null;
  texto.value = "";
  setDetalleLocalIds(localIds.filter((localId) => validIds.has(localId)));
  formError.value = null;
  isModalOpen.value = true;
};

const openEditModal = (
  observacion: SolicitudCompraObservacionLineaItem,
): void => {
  editingObservacionId.value = observacion.localId;
  texto.value = observacion.texto;
  setDetalleLocalIds([...observacion.detalleLocalIds]);
  formError.value = null;
  isModalOpen.value = true;
};

const resumeCreateModal = (localIds: string[]): void => {
  const validIds = new Set(props.detalles.map((detalle) => detalle.localId));

  setDetalleLocalIds(localIds.filter((localId) => validIds.has(localId)));
  formError.value = null;
  isModalOpen.value = true;
};

const requestSelectionChange = (): void => {
  isModalOpen.value = false;
  formError.value = null;
  emit("change-selection");
};

const toggleDetalle = (localId: string): void => {
  if (detalleLocalIds.value.includes(localId)) {
    setDetalleLocalIds(
      detalleLocalIds.value.filter((selectedId) => selectedId !== localId),
    );
    return;
  }

  setDetalleLocalIds([...detalleLocalIds.value, localId]);
};

const removeDetalleSeleccionado = (localId: string): void => {
  setDetalleLocalIds(
    detalleLocalIds.value.filter((selectedId) => selectedId !== localId),
  );
};

const saveObservacion = (): void => {
  const parsed = observacionLineaSolicitudSchema.safeParse({
    localId: editingObservacionId.value ?? crypto.randomUUID(),
    texto: texto.value,
    detalleLocalIds: detalleLocalIds.value,
  });

  if (!parsed.success) {
    formError.value =
      parsed.error.issues[0]?.message ?? "Revise la observación.";
    return;
  }

  const nextObservacion = parsed.data;
  const nextObservaciones = editingObservacionId.value
    ? props.observaciones.map((observacion) =>
        observacion.localId === editingObservacionId.value
          ? nextObservacion
          : observacion,
      )
    : [...props.observaciones, nextObservacion];

  emit("update:observaciones", nextObservaciones);
  closeModal();
};

const removeObservacion = (localId: string): void => {
  emit(
    "update:observaciones",
    props.observaciones.filter(
      (observacion) => observacion.localId !== localId,
    ),
  );
};

defineExpose({
  openCreateModal,
  openEditModal,
  resumeCreateModal,
  removeObservacion,
});
</script>

<template>
  <section
    v-if="showLista"
    class="mt-4 rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-3 sm:px-4"
  >
    <div
      class="flex items-start justify-between gap-3 border-b border-stone-200 pb-3"
    >
      <div class="flex min-w-0 items-start gap-2">
        <span
          class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-main/10 text-main"
        >
          <MessageSquarePlus class="h-4 w-4" />
        </span>
        <div>
          <h3 class="text-sm font-semibold text-stone-900">
            {{ titulo }}
          </h3>
          <p class="mt-0.5 text-xs leading-5 text-stone-600">
            {{ descripcion }}
          </p>
        </div>
      </div>
      <span
        class="shrink-0 rounded-full bg-main/10 px-2 py-1 text-xs font-semibold text-main"
      >
        {{ observaciones.length }}
      </span>
    </div>

    <div v-if="detalles.length > 0" class="mt-3 space-y-2">
      <article
        v-for="detalle in detalles"
        :key="detalle.localId"
        class="overflow-hidden rounded-lg border border-stone-200 bg-white"
      >
        <div class="flex items-start justify-between gap-3 px-3 py-3">
          <div class="min-w-0">
            <p class="break-words text-sm font-semibold text-stone-900">
              {{ detalle.codigo }}
            </p>
            <p class="mt-0.5 break-words text-xs text-stone-500">
              {{ detalle.detalle }}
            </p>
            <p class="mt-1 break-words text-xs text-stone-700">
              {{ detalle.descripcion }}
            </p>
          </div>
          <button
            type="button"
            class="cursor-pointer inline-flex shrink-0 items-center gap-1 rounded-lg border border-main/25 px-2 py-1.5 text-xs font-semibold text-main transition hover:bg-main/5 focus:outline-none focus:ring-2 focus:ring-main/25"
            @click="openCreateModal([detalle.localId])"
          >
            <Plus class="h-3.5 w-3.5" />
            Agregar
          </button>
        </div>

        <div
          v-if="getObservacionesDetalle(detalle.localId).length > 0"
          class="border-t border-stone-100 bg-main/[0.025] px-3 py-2"
        >
          <div
            v-for="observacion in getObservacionesDetalle(detalle.localId)"
            :key="observacion.localId"
            class="flex items-start gap-2 border-b border-stone-100 py-2 last:border-b-0"
          >
            <MessageSquarePlus
              class="mt-0.5 h-3.5 w-3.5 shrink-0 text-main-light"
            />
            <button
              type="button"
              class="cursor-pointer min-w-0 flex-1 text-left text-xs leading-5 text-stone-700 transition hover:text-main focus:outline-none focus:ring-2 focus:ring-main/25"
              @click="openEditModal(observacion)"
            >
              <span class="font-semibold text-main">Obs:</span>
              {{ observacion.texto }}
            </button>
            <button
              type="button"
              class="cursor-pointer inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-stone-400 transition hover:bg-danger-bg hover:text-danger focus:outline-none focus:ring-2 focus:ring-danger/25"
              :aria-label="`Eliminar observación de ${detalle.codigo}`"
              @click="removeObservacion(observacion.localId)"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </article>
    </div>

    <p
      v-else
      class="mt-3 rounded-lg bg-stone-100 px-3 py-4 text-center text-xs text-stone-500"
    >
      Agrega al menos una línea para registrar observaciones específicas.
    </p>

    <p v-if="error" class="mt-3 text-xs font-medium text-danger">
      {{ error }}
    </p>
  </section>

  <Teleport to="body" :disabled="inline">
    <div
      v-if="isModalOpen"
      :class="modalContainerClasses"
      @click.self="!inline && closeModal()"
    >
      <section
        :class="modalClasses"
        role="dialog"
        :aria-modal="inline ? undefined : 'true'"
        aria-labelledby="observacion-linea-modal-title"
      >
        <header
          class="flex items-start justify-between gap-4 border-b border-stone-100 px-4 py-4 sm:px-5"
        >
          <div class="flex min-w-0 gap-3">
            <span
              class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-main/10 text-main"
            >
              <Pencil class="h-5 w-5" />
            </span>
            <div>
              <h2
                id="observacion-linea-modal-title"
                class="text-base font-semibold text-stone-900"
              >
                {{
                  editingObservacionId
                    ? "Editar observación"
                    : "Agregar observación"
                }}
              </h2>
              <p class="mt-1 text-xs leading-5 text-stone-600">
                {{ modalDescription }}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="cursor-pointer inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-700 focus:outline-none focus:ring-2 focus:ring-main/25"
            aria-label="Cerrar modal"
            @click="closeModal"
          >
            <X class="h-4 w-4" />
          </button>
        </header>

        <div class="space-y-3 px-4 py-3 sm:px-5">
          <div>
            <p class="text-xs font-semibold text-stone-800">Líneas asociadas</p>
            <div class="mt-2 flex flex-wrap gap-1.5">
              <span
                v-for="detalle in detallesSeleccionados"
                :key="detalle.localId"
                class="inline-flex items-center gap-1 rounded-md bg-main/10 px-2 py-1 text-xs font-semibold text-main"
              >
                {{ detalle.codigo }}
                <button
                  type="button"
                  class="cursor-pointer inline-flex h-4 w-4 items-center justify-center rounded-sm transition hover:bg-main/15 focus:outline-none focus:ring-1 focus:ring-main"
                  :aria-label="`Quitar ${detalle.codigo}`"
                  @click="removeDetalleSeleccionado(detalle.localId)"
                >
                  <X class="h-3 w-3" />
                </button>
              </span>
              <span
                v-if="detallesSeleccionados.length === 0"
                class="text-xs text-stone-500"
              >
                Selecciona al menos una línea.
              </span>
            </div>
          </div>

          <fieldset v-if="showLista">
            <legend class="text-xs font-semibold text-stone-800">
              Seleccionar líneas
            </legend>
            <div
              class="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-stone-200 p-1"
            >
              <label
                v-for="detalle in detalles"
                :key="detalle.localId"
                class="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-xs transition hover:bg-stone-50"
              >
                <input
                  type="checkbox"
                  class="mt-0.5 h-4 w-4 cursor-pointer rounded border-stone-300 text-main focus:ring-main"
                  :checked="detalleLocalIds.includes(detalle.localId)"
                  @change="toggleDetalle(detalle.localId)"
                />
                <span class="min-w-0">
                  <span class="font-semibold text-stone-800">{{
                    detalle.codigo
                  }}</span>
                  <span class="block break-words text-stone-500">{{
                    detalle.descripcion
                  }}</span>
                </span>
                <Check
                  v-if="detalleLocalIds.includes(detalle.localId)"
                  class="ml-auto mt-0.5 h-3.5 w-3.5 shrink-0 text-main"
                />
              </label>
            </div>
          </fieldset>

          <div>
            <label
              for="observacion-linea-texto"
              class="text-xs font-semibold text-stone-800"
            >
              Observación del supervisor <span class="text-danger">*</span>
            </label>
            <div class="relative mt-2">
              <textarea
                id="observacion-linea-texto"
                v-model="texto"
                :maxlength="MAX_TEXTO_LENGTH"
                rows="3"
                class="w-full resize-y rounded-lg border border-main px-3 py-2 pb-6 text-sm text-stone-900 outline-none ring-2 ring-main/15 transition placeholder:text-stone-400 focus:ring-main/25"
                placeholder="Escribe la observación para las líneas seleccionadas"
                @input="formError = null"
              />
              <span
                class="pointer-events-none absolute bottom-2 right-3 text-xs text-stone-400"
              >
                {{ contadorTexto }}
              </span>
            </div>
            <p v-if="formError" class="mt-2 text-xs font-medium text-danger">
              {{ formError }}
            </p>
          </div>
        </div>

        <footer
          class="flex items-center gap-2 border-t border-stone-100 px-4 py-3 sm:px-5"
        >
          <button
            v-if="!showLista && !inline"
            type="button"
            class="cursor-pointer mr-auto text-xs font-medium text-main underline underline-offset-2 transition hover:text-main-dark focus:outline-none focus:ring-2 focus:ring-main/25"
            @click="requestSelectionChange"
          >
            Cambiar selección
          </button>
          <button
            type="button"
            class="cursor-pointer inline-flex min-h-9 items-center justify-center rounded-lg border border-main px-3 text-xs font-semibold text-main transition hover:bg-main/5 focus:outline-none focus:ring-2 focus:ring-main/25"
            @click="closeModal"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="cursor-pointer inline-flex min-h-9 items-center justify-center gap-1 rounded-lg bg-main px-3 text-xs font-semibold text-white transition hover:bg-main-dark focus:outline-none focus:ring-2 focus:ring-main/25 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isSaveDisabled"
            @click="saveObservacion"
          >
            <Check class="h-3.5 w-3.5" />
            Guardar observación
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>
