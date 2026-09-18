<script setup lang="ts">
import { LockKeyhole } from "lucide-vue-next";

withDefaults(
  defineProps<{
    message?: string;
  }>(),
  {
    message:
      "Si desea ver algo más del módulo, comuníquese con los administradores.",
  },
);
</script>

<template>
  <section
    class="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center gap-3 px-4 text-center"
  >
    <div class="rounded-full bg-amber-50 p-3 text-amber-700">
      <LockKeyhole class="h-6 w-6" aria-hidden="true" />
    </div>
    <p class="max-w-md text-sm font-medium leading-6 text-gray-700">
      {{ message }}
    </p>
  </section>
</template>
