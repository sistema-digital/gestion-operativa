<script setup lang="ts">
interface TagItem {
  cod_equipo: string;
}

interface Props {
  items?: TagItem[];
  emptyLabel?: string;
}

withDefaults(defineProps<Props>(), {
  emptyLabel: 'Sin equipo',
});
</script>

<template>
  <div class="flex flex-wrap gap-1 content-start">
    <span v-for="item in items" :key="item.cod_equipo" class="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
      {{ item.cod_equipo }}
    </span>
    <span v-if="!items?.length" class="text-xs text-gray-400">{{ emptyLabel }}</span>
  </div>
</template>
