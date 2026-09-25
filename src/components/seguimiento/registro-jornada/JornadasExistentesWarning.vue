<script setup lang="ts">
import { ClipboardList, TriangleAlert, X } from "lucide-vue-next";
import { onBeforeUnmount, onMounted } from "vue";
import { formatCompactPanamaDateTime } from "@/utils/formatCompactPanamaDate";
import type { JornadaExistenteEquipoFecha } from "./registroJornada.types";

defineProps<{
  jornadas: JornadaExistenteEquipoFecha[];
}>();

const emit = defineEmits<{
  confirmar: [];
}>();

function confirmar(): void {
  emit("confirmar");
}

function manejarTecla(evento: KeyboardEvent): void {
  if (evento.key !== "Escape" && evento.key !== "Enter") return;
  if (evento.key === "Enter" && evento.repeat) return;

  evento.preventDefault();
  confirmar();
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
      aria-label="Jornadas existentes para el equipo y fecha seleccionados"
      @click.self="confirmar"
    >
      <div
        class="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#d89a30]/35 bg-white shadow-[0_24px_70px_rgba(22,33,27,0.28)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="jornadas-existentes-title"
      >
        <div class="h-1 bg-[#d89a30]" />
        <header class="flex items-start gap-3 px-4 py-4 sm:px-5">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#fff4df] text-[#bd7115] ring-4 ring-[#fff4df]/80"
          >
            <TriangleAlert class="size-5" aria-hidden="true" />
          </div>
          <div class="min-w-0 flex-1">
            <p
              class="text-[10px] font-black uppercase tracking-[0.12em] text-[#bd7115]"
            >
              Advertencia
            </p>
            <h2
              id="jornadas-existentes-title"
              class="mt-0.5 text-sm font-bold text-main-dark"
            >
              Ya existen jornadas registradas para este equipo y fecha
            </h2>
            <p class="mt-1 text-xs leading-5 text-gray-600">
              Revisa los registros reales encontrados antes de continuar con la
              captura administrativa.
            </p>
          </div>
          <button
            type="button"
            class="flex size-7 cursor-pointer items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-black/5 hover:text-main-dark"
            aria-label="Cerrar advertencia"
            @click="confirmar"
          >
            <X class="size-4" aria-hidden="true" />
          </button>
        </header>

        <div class="border-y border-[#ece7dd] bg-[#fcfbf9] px-4 py-3 sm:px-5">
          <div
            class="mb-2 flex items-center gap-2 text-xs font-semibold text-main-dark"
          >
            <ClipboardList class="size-4 text-[#bd7115]" aria-hidden="true" />
            <span>{{ jornadas.length }} registros encontrados</span>
          </div>
          <div
            class="overflow-x-auto rounded-lg border border-[#e5e2dc] bg-white"
          >
            <table class="min-w-full text-left text-xs">
              <thead
                class="bg-[#f4f0e8] text-[10px] font-black uppercase tracking-[0.08em] text-gray-600"
              >
                <tr>
                  <th class="px-3 py-2">Equipo</th>
                  <th class="px-3 py-2">Fecha</th>
                  <th class="px-3 py-2">Operador</th>
                  <th class="px-3 py-2">Registrada</th>
                  <th class="px-3 py-2">Jornada</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#eeeae2] text-gray-700">
                <tr v-for="jornada in jornadas" :key="jornada.jornadaId">
                  <td
                    class="whitespace-nowrap px-3 py-2 font-mono font-semibold"
                  >
                    {{ jornada.equipoNumero }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-2 font-mono">
                    {{ jornada.fechaOperativa }}
                  </td>
                  <td class="px-3 py-2">
                    {{ jornada.operador ?? "Sin operador asignado" }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-2">
                    {{ formatCompactPanamaDateTime(jornada.registradaEn) }}
                  </td>
                  <td
                    class="max-w-36 truncate px-3 py-2 font-mono text-[10px]"
                    :title="jornada.jornadaId"
                  >
                    {{ jornada.jornadaId }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <footer class="bg-white px-4 py-3 sm:px-5">
          <button
            type="button"
            class="flex h-10 w-full cursor-pointer items-center justify-center rounded-lg bg-[#bd7115] px-4 text-xs font-bold text-white transition-colors hover:bg-[#9b5c11]"
            @click="confirmar"
          >
            OK, continuar
          </button>
        </footer>
      </div>
    </section>
  </Teleport>
</template>
