<script setup lang="ts">
import {
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Hash,
  RotateCcw,
  X,
} from "lucide-vue-next";
import { onBeforeUnmount, onMounted } from "vue";
import type { RegistroJornadaFeedback } from "./registroJornada.types";

defineProps<{
  resultado: RegistroJornadaFeedback;
}>();

const emit = defineEmits<{
  cerrar: [];
  confirmar: [];
}>();

function cerrar(): void {
  emit("cerrar");
}

function confirmar(): void {
  emit("confirmar");
}

function manejarTecla(evento: KeyboardEvent): void {
  if (evento.key === "Escape") cerrar();
  if (evento.key === "Enter" && !evento.repeat) {
    evento.preventDefault();
    confirmar();
  }
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
      aria-label="Resultado del registro de jornada"
      @click.self="cerrar"
    >
      <div
        class="w-full max-w-md overflow-hidden rounded-2xl border bg-white shadow-[0_24px_70px_rgba(22,33,27,0.28)]"
        :class="
          resultado.estado === 'exito'
            ? 'border-success/30'
            : 'border-danger/30'
        "
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`resultado-registro-${resultado.estado}`"
      >
        <div
          class="h-1"
          :class="resultado.estado === 'exito' ? 'bg-success' : 'bg-danger'"
        />
        <div class="flex items-start gap-3 px-4 py-4 sm:px-5">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-full"
            :class="
              resultado.estado === 'exito'
                ? 'bg-success/15 text-success ring-4 ring-success/5'
                : 'bg-danger/10 text-danger ring-4 ring-danger/5'
            "
          >
            <CheckCircle2
              v-if="resultado.estado === 'exito'"
              class="size-5"
              aria-hidden="true"
            />
            <CircleAlert v-else class="size-5" aria-hidden="true" />
          </div>

          <div class="min-w-0 flex-1">
            <p
              class="text-[10px] font-black uppercase tracking-[0.12em]"
              :class="
                resultado.estado === 'exito' ? 'text-success' : 'text-danger'
              "
            >
              {{
                resultado.estado === "exito"
                  ? "Registro confirmado"
                  : "No se pudo registrar"
              }}
            </p>
            <h2
              :id="`resultado-registro-${resultado.estado}`"
              class="mt-0.5 text-sm font-bold text-main-dark"
            >
              {{ resultado.mensaje }}
            </h2>

            <div
              v-if="resultado.estado === 'exito'"
              class="mt-2 grid gap-2 text-xs sm:grid-cols-3"
            >
              <div class="flex items-center gap-1.5 text-gray-700">
                <ClipboardCheck
                  class="size-3.5 text-success"
                  aria-hidden="true"
                />
                <span
                  ><strong>{{ resultado.procesados }}</strong> eventos
                  procesados</span
                >
              </div>
              <div class="flex items-center gap-1.5 text-gray-700">
                <RotateCcw class="size-3.5 text-success" aria-hidden="true" />
                <span>{{
                  resultado.modo === "borrador"
                    ? "Borrador guardado"
                    : "Jornada finalizada"
                }}</span>
              </div>
              <div
                v-if="resultado.borradorReemplazado"
                class="flex items-center gap-1.5 text-gray-700"
              >
                <RotateCcw class="size-3.5 text-success" aria-hidden="true" />
                <span>Snapshot anterior reemplazado</span>
              </div>
            </div>

            <div v-else class="mt-2 space-y-1.5 text-xs text-danger">
              <p v-if="resultado.codigo" class="flex items-center gap-1.5">
                <Hash class="size-3.5 shrink-0" aria-hidden="true" />
                Código:
                <span class="font-mono font-semibold">{{
                  resultado.codigo
                }}</span>
              </p>
              <p v-if="resultado.eventoFallido">
                Revisa el evento {{ resultado.eventoFallido.secuencia }}:
                {{ resultado.eventoFallido.tipo_evento }}.
              </p>
              <p v-if="resultado.borradorPrevioConservado">
                El borrador anterior se conservó sin cambios.
              </p>
            </div>
          </div>

          <button
            type="button"
            class="flex size-7 cursor-pointer items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-black/5 hover:text-main-dark"
            aria-label="Cerrar mensaje de registro"
            @click="cerrar"
          >
            <X class="size-4" aria-hidden="true" />
          </button>
        </div>
        <div class="border-t border-[#e5e2dc] bg-[#fcfbf9] px-4 py-3 sm:px-5">
          <button
            type="button"
            class="flex h-10 w-full cursor-pointer items-center justify-center rounded-lg px-4 text-xs font-bold text-white transition-colors"
            :class="
              resultado.estado === 'exito'
                ? 'bg-success hover:bg-success/90'
                : 'bg-danger hover:bg-danger/90'
            "
            @click="confirmar"
          >
            Entendido
          </button>
        </div>
      </div>
    </section>
  </Teleport>
</template>
