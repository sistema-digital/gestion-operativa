<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from "vue";
import { CircleAlert, LoaderCircle, X } from "lucide-vue-next";
import { z } from "zod";
import type { OperadorCrearPayload } from "./registroJornada.types";

const nombreSchema = z
  .string()
  .trim()
  .regex(/^[\p{L}]+(?:\s+[\p{L}]+)*$/u, "Solo se permiten letras y espacios.");
const open = defineModel<boolean>("open", { required: true });
const props = defineProps<{
  guardando: boolean;
  error: string | null;
  nombreInicial: string;
  apellidoInicial: string;
}>();
const emit = defineEmits<{ crear: [payload: OperadorCrearPayload] }>();
const form = reactive({ nombre: "", apellido: "" });
const intentoEnviar = shallowRef(false);
function normalizarMayusculas(valor: string): string {
  return valor.toLocaleUpperCase("es-PA");
}
const nombre = computed({
  get: () => form.nombre,
  set: (valor: string) => {
    form.nombre = normalizarMayusculas(valor);
  },
});
const apellido = computed({
  get: () => form.apellido,
  set: (valor: string) => {
    form.apellido = normalizarMayusculas(valor);
  },
});
const validacion = computed(() =>
  z.object({ nombre: nombreSchema, apellido: nombreSchema }).safeParse(form),
);
const errorNombre = computed(() =>
  !intentoEnviar.value || validacion.value.success
    ? ""
    : (validacion.value.error.issues[0]?.message ?? ""),
);
watch(
  () => [open.value, props.nombreInicial, props.apellidoInicial] as const,
  ([abierto, nombre, apellido]) => {
    if (abierto) {
      form.nombre = normalizarMayusculas(nombre);
      form.apellido = normalizarMayusculas(apellido);
      intentoEnviar.value = false;
    }
  },
);
function cerrar(): void {
  if (!props.guardando) open.value = false;
}
function submit(): void {
  intentoEnviar.value = true;
  if (!validacion.value.success) return;
  emit("crear", {
    nombre: `${validacion.value.data.nombre} ${validacion.value.data.apellido}`,
  });
}
</script>

<template>
  <Teleport to="body"
    ><div
      v-if="open"
      class="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[1px]"
      @click.self="cerrar"
    >
      <aside
        class="fixed bottom-0 left-0 right-0 z-[90] flex max-h-[86dvh] flex-col overflow-hidden rounded-t-[18px] border-t border-gray-200 bg-white shadow-xl md:bottom-auto md:left-auto md:top-0 md:h-dvh md:max-h-none md:w-[408px] md:rounded-none md:border-l md:border-t-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crear-operador-title"
      >
        <header
          class="flex min-h-14 items-center gap-2 border-b border-gray-200 px-3 py-2"
        >
          <h2
            id="crear-operador-title"
            class="flex-1 text-sm font-bold text-main-dark"
          >
            Registrar operador
          </h2>
          <button
            type="button"
            class="grid size-8 cursor-pointer place-items-center rounded-md text-gray-500 hover:bg-gray-100"
            @click="cerrar"
          >
            <X class="size-4" />
          </button>
        </header>
        <form
          class="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto p-3"
          @submit.prevent="submit"
        >
          <p
            v-if="error"
            class="flex items-start gap-2 rounded-md border border-danger/30 bg-danger-bg px-2 py-2 text-[11px] text-danger"
          >
            <CircleAlert class="mt-0.5 size-3.5 shrink-0" />{{ error }}
          </p>
          <label
            ><span
              class="mb-1 block text-[9px] font-bold uppercase text-gray-600"
              >Nombre *</span
            ><input
              v-model="nombre"
              class="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:border-main md:h-8 md:text-xs"
              :class="errorNombre ? 'border-danger' : 'border-gray-300'"
              placeholder="Ej. Juan"
            /><span
              v-if="errorNombre"
              class="mt-1 block text-[10px] text-danger"
              >{{ errorNombre }}</span
            ></label
          ><label
            ><span
              class="mb-1 block text-[9px] font-bold uppercase text-gray-600"
              >Apellido *</span
            ><input
              v-model="apellido"
              class="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:border-main md:h-8 md:text-xs"
              :class="errorNombre ? 'border-danger' : 'border-gray-300'"
              placeholder="Ej. Pérez"
          /></label>
          <footer
            class="sticky bottom-0 grid grid-cols-[1fr_1.25fr] gap-2 border-t border-gray-200 bg-gray-50 pt-3"
          >
            <button
              type="button"
              class="h-9 cursor-pointer rounded-md border border-gray-200 bg-white text-xs font-semibold"
              :disabled="guardando"
              @click="cerrar"
            >
              Cancelar</button
            ><button
              type="submit"
              class="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-main px-3 text-xs font-semibold text-white"
              :disabled="guardando"
            >
              <LoaderCircle v-if="guardando" class="size-3.5 animate-spin" />{{
                guardando ? "Registrando…" : "Registrar y usar"
              }}
            </button>
          </footer>
        </form>
      </aside>
    </div></Teleport
  >
</template>
