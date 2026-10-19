<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from "vue";
import { Maximize2 } from "lucide-vue-next";
import EquipoEngraseThumbnail from "./EquipoEngraseThumbnail.vue";
import type { EquipoEngraseListItem } from "@/stores/dbequipos/engrase/filtrosEngrase.types";

const props = defineProps<{
  equipo: EquipoEngraseListItem;
  selected: boolean;
}>();
const emit = defineEmits<{
  select: [number];
  imageVisible: [number];
  viewImage: [number];
}>();
const card = useTemplateRef<HTMLElement>("card");
let observer: IntersectionObserver | null = null;

function necesitaImagen(): boolean {
  return Boolean(
    props.equipo.tiene_imagen_main &&
    props.equipo.main_storage_path &&
    !props.equipo.imageUrl,
  );
}

function observar(): void {
  if (!card.value || !necesitaImagen()) return;
  if (typeof IntersectionObserver === "undefined") {
    emit("imageVisible", props.equipo.id);
    return;
  }
  observer?.disconnect();
  observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      emit("imageVisible", props.equipo.id);
      observer?.disconnect();
      observer = null;
    },
    { threshold: 0.01 },
  );
  observer.observe(card.value);
}

onMounted(observar);
watch(
  () => [props.equipo.main_storage_path, props.equipo.imageUrl] as const,
  ([path, imageUrl], [previousPath, previousImageUrl]) => {
    if (
      path &&
      !imageUrl &&
      (path !== previousPath || imageUrl !== previousImageUrl)
    ) {
      observar();
    }
  },
);
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <article
    ref="card"
    class="flex w-full cursor-pointer items-center gap-2 rounded-md border bg-white p-2 text-left transition hover:border-main/40"
    :class="selected ? 'border-main bg-main/5' : 'border-gray-200'"
    @click="emit('select', equipo.id)"
  >
    <button
      v-if="equipo.imageUrl"
      type="button"
      class="group relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-md outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2"
      :aria-label="`Ampliar imagen del equipo ${equipo.codigo}`"
      @click.stop="emit('viewImage', equipo.id)"
    >
      <EquipoEngraseThumbnail :src="equipo.imageUrl" :alt="equipo.codigo" />
      <span
        class="pointer-events-none absolute inset-0 grid place-items-center bg-main-dark/0 text-white opacity-0 transition group-hover:bg-main-dark/40 group-hover:opacity-100 group-focus-visible:bg-main-dark/40 group-focus-visible:opacity-100"
        aria-hidden="true"
      >
        <Maximize2 class="h-3.5 w-3.5" />
      </span>
    </button>
    <EquipoEngraseThumbnail
      v-else
      :src="equipo.imageUrl"
      :alt="equipo.codigo"
    />
    <button
      type="button"
      class="min-w-0 flex-1 cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2"
      :aria-pressed="selected"
      :aria-label="`Seleccionar equipo ${equipo.codigo}`"
      @click.stop="emit('select', equipo.id)"
    >
      <strong class="block font-mono text-sm text-main">
        {{ equipo.codigo }}
      </strong>
      <span class="block truncate">{{ equipo.tipo_equipo }}</span>
      <small
        class="block break-words whitespace-normal text-xs leading-4 text-gray-500"
      >
        Modelo: {{ equipo.subtipo || "Sin modelo" }}
      </small>
    </button>
  </article>
</template>
