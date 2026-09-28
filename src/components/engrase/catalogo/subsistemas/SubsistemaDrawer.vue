<script setup lang="ts">
import { computed } from "vue";
import { Network, X } from "lucide-vue-next";
import type {
  CatalogoSubsistemaFieldErrors,
  CatalogoSubsistemaGuardarInput,
  CatalogoSubsistemaItem,
} from "@/stores/dbequipos/engrase/catalogo/subsistemasCatalogo.types";

const props = defineProps<{
  open: boolean;
  item: CatalogoSubsistemaItem | null;
  draft: CatalogoSubsistemaGuardarInput | null;
  errors: CatalogoSubsistemaFieldErrors;
  saving: boolean;
  canSubmit: boolean;
}>();
const emit = defineEmits<{
  close: [];
  updateDraft: [CatalogoSubsistemaGuardarInput];
  blurName: [];
  submit: [];
}>();
const title = computed(() =>
  props.draft?.id === null ? "Nuevo subsistema" : "Detalles del subsistema",
);
function updateName(event: Event): void {
  if (!props.draft) return;
  emit("updateDraft", {
    ...props.draft,
    nombre: (event.target as HTMLInputElement).value,
  });
}
function updateState(activo: boolean): void {
  if (!props.draft) return;
  emit("updateDraft", { ...props.draft, activo });
}
</script>

<template>
  <Teleport to="body"
    ><div
      v-if="open"
      class="fixed inset-0 z-50 bg-main-dark/50"
      @click.self="!saving && emit('close')"
    >
      <aside
        class="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-xl bg-white shadow-xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[26rem] sm:rounded-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subsistema-drawer-title"
        :aria-busy="saving"
      >
        <header
          class="sticky top-0 flex min-h-14 items-center justify-between border-b border-gray-200 bg-white px-4"
        >
          <div class="flex items-center gap-2">
            <Network class="h-5 w-5 text-main" />
            <h2
              id="subsistema-drawer-title"
              class="text-base font-bold text-main"
            >
              {{ title }}
            </h2>
          </div>
          <button
            type="button"
            :disabled="saving"
            class="grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-md hover:bg-gray-100 disabled:cursor-not-allowed"
            aria-label="Cerrar detalles"
            @click="emit('close')"
          >
            <X class="h-4 w-4" />
          </button>
        </header>
        <form
          v-if="draft"
          class="space-y-6 p-4"
          @submit.prevent="emit('submit')"
        >
          <div>
            <label
              for="subsistema-name"
              class="mb-1.5 block text-xs font-semibold text-gray-800"
              >Nombre para mostrar <span class="text-danger">*</span></label
            ><input
              id="subsistema-name"
              :value="draft.nombre"
              :disabled="saving"
              :aria-invalid="Boolean(errors.nombre)"
              :aria-describedby="
                errors.nombre ? 'subsistema-name-error' : undefined
              "
              class="min-h-11 w-full rounded-md border px-3 text-base outline-none focus:ring-2 sm:min-h-9 sm:text-sm"
              :class="
                errors.nombre
                  ? 'border-danger focus:ring-danger/15'
                  : 'border-gray-300 focus:border-main focus:ring-main/15'
              "
              @input="updateName"
              @blur="emit('blurName')"
            />
            <p
              v-if="errors.nombre"
              id="subsistema-name-error"
              class="mt-1 text-xs text-danger"
              role="alert"
            >
              {{ errors.nombre }}
            </p>
          </div>
          <fieldset :disabled="saving">
            <legend class="mb-1.5 text-xs font-semibold text-gray-800">
              Estado
            </legend>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="option in [
                  { label: 'Activo', activo: true },
                  { label: 'Desactivado', activo: false },
                ]"
                :key="option.label"
                type="button"
                role="radio"
                :aria-checked="draft.activo === option.activo"
                class="min-h-11 rounded-md border px-3 text-sm font-semibold sm:min-h-9 sm:text-xs"
                :class="
                  draft.activo === option.activo
                    ? 'cursor-pointer border-main bg-main text-white'
                    : 'cursor-pointer border-gray-300 hover:bg-gray-50'
                "
                @click="updateState(option.activo)"
              >
                {{ option.label }}
              </button>
            </div>
          </fieldset>
          <template v-if="item"
            ><section>
              <h3 class="text-xs font-semibold text-gray-800">
                Sistemas raíz donde se utiliza
              </h3>
              <p class="mt-1 text-xs text-gray-600">
                {{
                  item.sistemas
                    .map(
                      (related) =>
                        `${related.nombre} (${related.cantidadEquipos})`,
                    )
                    .join(", ") || "Sin sistemas raíz asociados"
                }}
              </p>
            </section>
            <section>
              <h3 class="text-xs font-semibold text-gray-800">
                Aceites relacionados
              </h3>
              <p class="mt-1 text-xs text-gray-600">
                {{
                  item.aceites
                    .map(
                      (related) =>
                        `${related.nombre} (${related.cantidadEquipos})`,
                    )
                    .join(", ") || "Sin aceites relacionados"
                }}
              </p>
            </section>
            <section class="rounded-md bg-main/5 p-3 text-xs text-main">
              <strong>Resumen de uso</strong>
              <p class="mt-1">
                Equipos {{ item.impacto.totalEquipos }} · Total asignaciones
                {{ item.impacto.totalAsignaciones }}
              </p>
            </section></template
          >
          <p v-else class="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
            El subsistema se asigna posteriormente desde la Estructura de
            lubricación de un equipo.
          </p>
          <div class="grid grid-cols-2 gap-2 border-t border-gray-200 pt-4">
            <button
              type="button"
              class="min-h-11 cursor-pointer rounded-md border border-gray-300 text-sm font-semibold"
              @click="emit('close')"
            >
              Cancelar</button
            ><button
              type="submit"
              :disabled="!canSubmit || saving"
              class="min-h-11 rounded-md bg-main text-sm font-semibold text-white"
              :class="
                canSubmit && !saving
                  ? 'cursor-pointer hover:bg-main-light'
                  : 'cursor-not-allowed opacity-50'
              "
            >
              {{
                saving
                  ? "Guardando…"
                  : draft.id === null
                    ? "Crear subsistema"
                    : "Guardar cambios"
              }}
            </button>
          </div>
        </form>
      </aside>
    </div></Teleport
  >
</template>
