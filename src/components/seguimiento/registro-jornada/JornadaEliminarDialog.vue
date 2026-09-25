<script setup lang="ts">
import { TriangleAlert, Trash2, X } from "lucide-vue-next";
import { onBeforeUnmount, onMounted } from "vue";
import type { JornadaAdministrativaListaItem } from "./registroJornada.types";

defineProps<{
  jornada: JornadaAdministrativaListaItem;
  eliminando: boolean;
}>();

const emit = defineEmits<{
  cancelar: [];
  confirmar: [];
}>();

function cancelar(): void {
  emit("cancelar");
}

function confirmar(): void {
  emit("confirmar");
}

function manejarTecla(evento: KeyboardEvent): void {
  if (evento.key !== "Escape" || evento.repeat) return;

  evento.preventDefault();
  cancelar();
}

onMounted(() => {
  document.addEventListener("keydown", manejarTecla);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", manejarTecla);
});
</script>

<template>
  <Teleport to="body">
    <section
      class="fixed inset-0 z-[100] flex items-center justify-center bg-[#15231d]/50 p-3 backdrop-blur-[2px] sm:p-5"
      aria-label="Confirmar eliminación de jornada"
      @click.self="cancelar"
    >
      <div
        class="w-full max-w-md overflow-hidden rounded-2xl border border-danger/30 bg-white shadow-[0_24px_70px_rgba(22,33,27,0.28)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="eliminar-jornada-title"
      >
        <div class="h-1 bg-danger" />
        <header class="flex items-start gap-3 px-4 py-4 sm:px-5">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger ring-4 ring-danger/5"
          >
            <TriangleAlert class="size-5" aria-hidden="true" />
          </div>
          <div class="min-w-0 flex-1">
            <p
              class="text-[10px] font-black uppercase tracking-[0.12em] text-danger"
            >
              Acción irreversible
            </p>
            <h2
              id="eliminar-jornada-title"
              class="mt-0.5 text-sm font-bold text-main-dark"
            >
              ¿Eliminar esta jornada publicada?
            </h2>
            <p class="mt-1 text-xs leading-5 text-gray-600">
              Se eliminará la jornada del equipo
              <strong class="font-mono text-main-dark">{{
                jornada.equipoNumero
              }}</strong>
              del {{ jornada.fechaOperativa }} ({{ jornada.operador }}).
            </p>
          </div>
          <button
            type="button"
            class="flex size-7 cursor-pointer items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-black/5 hover:text-main-dark disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Cerrar confirmación"
            :disabled="eliminando"
            @click="cancelar"
          >
            <X class="size-4" aria-hidden="true" />
          </button>
        </header>

        <footer
          class="grid grid-cols-2 gap-2 border-t border-[#e5e2dc] bg-[#fcfbf9] px-4 py-3 sm:px-5"
        >
          <button
            type="button"
            class="h-10 cursor-pointer rounded-lg border border-[#d8d2c8] bg-white px-4 text-xs font-bold text-main-dark transition-colors hover:bg-[#f5f3ef] disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="eliminando"
            @click="cancelar"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-danger px-4 text-xs font-bold text-white transition-colors hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="eliminando"
            @click="confirmar"
          >
            <Trash2 v-if="!eliminando" class="size-3.5" aria-hidden="true" />
            <span>{{ eliminando ? "Eliminando…" : "Eliminar" }}</span>
          </button>
        </footer>
      </div>
    </section>
  </Teleport>
</template>
