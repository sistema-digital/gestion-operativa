<script setup lang="ts">
import { computed, reactive, shallowRef } from "vue";
import { CircleAlert, Info, LoaderCircle, X } from "lucide-vue-next";
import Multiselect from "vue-multiselect";
import { z } from "zod";
import type {
  ImplementoCrearPayload,
  ImplementoTipoOption,
} from "./registroJornada.types";

const implementoCrearSchema = z.object({
  numero: z.string().trim().min(1, "Indica el número del implemento."),
  tipoImplementoId: z.string().min(1, "Selecciona un tipo de implemento."),
  nombre: z.string(),
});

const open = defineModel<boolean>("open", { required: true });

const props = defineProps<{
  filaNumero: number | null;
  tiposImplemento: ImplementoTipoOption[];
  guardando: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  crear: [payload: ImplementoCrearPayload];
}>();

const form = reactive({
  numero: "",
  tipoImplementoId: "",
  nombre: "",
});
const intentoEnviar = shallowRef(false);

const tipoSeleccionado = computed<ImplementoTipoOption | null>({
  get: () =>
    props.tiposImplemento.find((tipo) => tipo.id === form.tipoImplementoId) ??
    null,
  set: (tipo) => {
    form.tipoImplementoId = tipo?.id ?? "";
  },
});

const validacion = computed(() => implementoCrearSchema.safeParse(form));
const errores = computed(() => {
  if (!intentoEnviar.value || validacion.value.success) {
    return { numero: "", tipoImplementoId: "" };
  }

  return {
    numero:
      validacion.value.error.issues.find((error) => error.path[0] === "numero")
        ?.message ?? "",
    tipoImplementoId:
      validacion.value.error.issues.find(
        (error) => error.path[0] === "tipoImplementoId",
      )?.message ?? "",
  };
});

function cerrar(): void {
  open.value = false;
}

function submit(): void {
  intentoEnviar.value = true;
  if (!validacion.value.success) return;

  emit("crear", {
    numero: validacion.value.data.numero.toUpperCase(),
    tipoImplementoId: validacion.value.data.tipoImplementoId,
    nombre: validacion.value.data.nombre.trim() || null,
  });
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[1px]"
      @click.self="cerrar"
    >
      <aside
        class="fixed bottom-0 left-0 right-0 z-[90] flex max-h-[86dvh] flex-col overflow-hidden rounded-t-[18px] border-t border-gray-200 bg-white shadow-xl md:bottom-auto md:left-auto md:top-0 md:h-dvh md:max-h-none md:w-[408px] md:rounded-none md:border-l md:border-t-0"
        aria-labelledby="crear-implemento-title"
        role="dialog"
        aria-modal="true"
      >
        <div class="mx-auto mt-2 h-1 w-10 rounded-full bg-gray-300 md:hidden" />

        <header
          class="flex min-h-14 items-center gap-2 border-b border-gray-200 px-3 py-2"
        >
          <div class="min-w-0 flex-1">
            <h2
              id="crear-implemento-title"
              class="text-sm font-bold text-main-dark"
            >
              Registrar implemento
            </h2>
            <p class="text-[10px] text-gray-500">
              {{
                filaNumero
                  ? `Se registrará y usará en la fila ${filaNumero}.`
                  : "Se usará en la fila seleccionada."
              }}
            </p>
          </div>
          <button
            type="button"
            class="grid size-8 cursor-pointer place-items-center rounded-md text-gray-500 hover:bg-gray-100"
            aria-label="Cerrar panel"
            :disabled="guardando"
            @click="cerrar"
          >
            <X class="size-4" aria-hidden="true" />
          </button>
        </header>

        <form class="grid gap-3 overflow-y-auto p-3" @submit.prevent="submit">
          <p
            v-if="error"
            class="flex items-start gap-2 rounded-md border border-danger/30 bg-danger-bg px-2 py-2 text-[11px] text-danger"
            role="alert"
          >
            <CircleAlert class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {{ error }}
          </p>
          <div
            class="flex gap-2 rounded-md border border-info/30 bg-info-bg p-2 text-[11px] text-gray-700"
          >
            <Info
              class="mt-0.5 size-3.5 shrink-0 text-info"
              aria-hidden="true"
            />
            <p>
              Úsalo cuando el implemento existe físicamente, pero todavía no
              aparece en el catálogo.
            </p>
          </div>

          <label>
            <span
              class="mb-1 block text-[9px] font-bold uppercase text-gray-600"
              >Número *</span
            >
            <input
              v-model="form.numero"
              class="h-10 w-full rounded-md border bg-white px-3 font-mono text-sm outline-none focus:border-main md:h-8 md:text-xs"
              :class="errores.numero ? 'border-danger' : 'border-gray-300'"
              placeholder="Ej. 439020"
              aria-required="true"
              :aria-invalid="Boolean(errores.numero)"
            />
            <span
              v-if="errores.numero"
              class="mt-1 block text-[10px] text-danger"
            >
              {{ errores.numero }}
            </span>
          </label>

          <label>
            <span
              class="mb-1 block text-[9px] font-bold uppercase text-gray-600"
              >Tipo *</span
            >
            <Multiselect
              v-model="tipoSeleccionado"
              :options="tiposImplemento"
              label="nombre"
              track-by="id"
              :allow-empty="true"
              :show-labels="false"
              placeholder="Seleccionar tipo…"
              class="jornada-multiselect [&_.multiselect]:min-h-10 [&_.multiselect__input]:mb-0 [&_.multiselect__input]:cursor-text [&_.multiselect__input]:text-sm [&_.multiselect__select]:h-10 [&_.multiselect__select]:cursor-pointer [&_.multiselect__single]:mb-0 [&_.multiselect__single]:pt-2.5 [&_.multiselect__single]:text-sm [&_.multiselect__tags]:min-h-10 [&_.multiselect__tags]:border-gray-300 [&_.multiselect__tags]:px-3 [&_.multiselect__tags]:py-0 md:[&_.multiselect]:min-h-8 md:[&_.multiselect__input]:text-xs md:[&_.multiselect__select]:h-8 md:[&_.multiselect__single]:pt-2 md:[&_.multiselect__single]:text-xs md:[&_.multiselect__tags]:min-h-8"
              :class="
                errores.tipoImplementoId
                  ? '[&_.multiselect__tags]:!border-danger'
                  : ''
              "
              aria-required="true"
              :aria-invalid="Boolean(errores.tipoImplementoId)"
            />
            <span
              v-if="errores.tipoImplementoId"
              class="mt-1 block text-[10px] text-danger"
            >
              {{ errores.tipoImplementoId }}
            </span>
          </label>

          <label>
            <span
              class="mb-1 block text-[9px] font-bold uppercase text-gray-600"
              >Nombre / descripción</span
            >
            <input
              v-model="form.nombre"
              class="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-main md:h-8 md:text-xs"
              placeholder="Ej. Rastra pesada"
            />
          </label>

          <footer
            class="sticky bottom-0 grid grid-cols-[1fr_1.25fr] gap-2 border-t border-gray-200 bg-gray-50 pt-3"
          >
            <button
              type="button"
              class="h-9 cursor-pointer rounded-md border border-gray-200 bg-white text-xs font-semibold hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="guardando"
              @click="cerrar"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-main px-3 text-xs font-semibold text-white hover:bg-main-dark disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="guardando"
            >
              <LoaderCircle
                v-if="guardando"
                class="size-3.5 animate-spin"
                aria-hidden="true"
              />
              {{ guardando ? "Registrando…" : "Registrar y usar" }}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  </Teleport>
</template>
