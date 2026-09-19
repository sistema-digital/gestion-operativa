<script setup lang="ts">
import { computed } from "vue";
import type { JornadaFilaModel } from "./registroJornada.types";

const props = defineProps<{
  filas: JornadaFilaModel[];
}>();

function minutosDesdeHora(hora: string): number | null {
  const [horas, minutos] = hora.split(":").map(Number);
  if (!Number.isInteger(horas) || !Number.isInteger(minutos)) return null;
  return horas * 60 + minutos;
}

function duracionEntre(inicio: string, fin: string): string {
  const minutosInicio = minutosDesdeHora(inicio);
  const minutosFin = minutosDesdeHora(fin);
  if (
    minutosInicio === null ||
    minutosFin === null ||
    minutosFin < minutosInicio
  ) {
    return "--:--";
  }

  const total = minutosFin - minutosInicio;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(
    total % 60,
  ).padStart(2, "0")}`;
}

const resumen = computed(() => {
  const primeraFila = props.filas.at(0);
  const ultimaFila = props.filas.at(-1);
  const inicio = primeraFila?.inicio || "--:--";
  const fin = ultimaFila?.fin || "--:--";

  return {
    inicio,
    fin,
    total: duracionEntre(inicio, fin),
  };
});
</script>

<template>
  <div class="grid grid-cols-3 gap-2">
    <div
      v-for="item in [
        { etiqueta: 'Inicio', valor: resumen.inicio },
        { etiqueta: 'Fin', valor: resumen.fin },
        { etiqueta: 'Total', valor: resumen.total },
      ]"
      :key="item.etiqueta"
      class="rounded-xl border border-[#ddd8d0] bg-[#faf9f7] px-3 py-2.5"
    >
      <p
        class="text-[9px] font-medium uppercase tracking-[0.08em] text-gray-500"
      >
        {{ item.etiqueta }}
      </p>
      <p class="mt-1 font-mono text-base font-bold leading-none text-main-dark">
        {{ item.valor }}
      </p>
    </div>
  </div>
</template>
