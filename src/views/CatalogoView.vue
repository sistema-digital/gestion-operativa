<script setup lang="ts">
// Vista principal para el módulo de Catálogo
</script>

<template>
  <div class="p-6 md:p-8 h-full flex flex-col">
    <!-- Header de la vista -->
    <header class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Catálogo de Elementos</h1>
        <p class="text-sm text-gray-500 mt-1">Gestión y visualización del catálogo maestro del sistema.</p>
      </div>
    </header>

    <!-- Contenedor principal -->
    <div class="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center p-8">
      <div class="text-center">
        <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
          <svg class="w-8 h-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-700">Módulo en construcción</h3>
        <p class="text-sm text-gray-500 mt-2 max-w-sm mx-auto">Esta sección estará disponible próximamente con todo el contenido del catálogo.</p>
      </div>
    </div>
  </div>
</template>