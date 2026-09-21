<script setup lang="ts">
import { computed } from "vue";
import type { JornadaFilaModel } from "./registroJornada.types";

const props = defineProps<{
  filas: JornadaFilaModel[];
}>();

function minutosDesdeHora(hora: string): number | null {
  const [horas, minutos] = hora.split(":").map(Number);
  if (
    !Number.isInteger(horas) ||
    !Number.isInteger(minutos) ||
    horas < 0 ||
    horas > 23 ||
    minutos < 0 ||
    minutos > 59
  )
    return null;
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

function formatearHora12(hora: string): string {
  const minutosTotales = minutosDesdeHora(hora);
  if (minutosTotales === null) return "--:--";

  const horas = Math.floor(minutosTotales / 60);
  const minutos = minutosTotales % 60;
  const periodo = horas < 12 ? "AM" : "PM";
  const hora12 = horas % 12 || 12;
  return `${hora12}:${String(minutos).padStart(2, "0")} ${periodo}`;
}

const resumen = computed(() => {
  const primeraFila = props.filas.at(0);
  const ultimaFila = props.filas.at(-1);
  const inicio = primeraFila?.inicio || "--:--";
  const fin = ultimaFila?.fin || "--:--";

  return {
    inicio: formatearHora12(inicio),
    fin: formatearHora12(fin),
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
      class="rounded-xl border border-[#ddd8d0] bg-[#faf9f7] px-3 py-5 text-center"
    >
      <p
        class="text-[10px] font-medium uppercase tracking-[0.08em] text-gray-500"
      >
        {{ item.etiqueta }}
      </p>
      <p class="mt-1 font-mono text-lg font-bold leading-none text-main-dark">
        {{ item.valor }}
      </p>
    </div>
  </div>
</template>
