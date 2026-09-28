<script setup lang="ts">
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  Network,
} from "lucide-vue-next";
import type {
  CatalogoSortDirection,
  CatalogoSubsistemaItem,
  CatalogoSubsistemaSortKey,
} from "@/stores/dbequipos/engrase/catalogo/subsistemasCatalogo.types";

const props = defineProps<{
  items: readonly CatalogoSubsistemaItem[];
  sortKey: CatalogoSubsistemaSortKey;
  sortDirection: CatalogoSortDirection;
}>();
const emit = defineEmits<{
  select: [CatalogoSubsistemaItem, HTMLElement];
  sort: [CatalogoSubsistemaSortKey];
}>();
function icon(key: CatalogoSubsistemaSortKey) {
  return props.sortKey !== key
    ? ArrowUpDown
    : props.sortDirection === "asc"
      ? ArrowUp
      : ArrowDown;
}
</script>

<template>
  <div
    class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
  >
    <table class="hidden w-full table-fixed text-left text-xs lg:table">
      <thead class="h-9 bg-gray-50 text-gray-600">
        <tr>
          <th class="w-11" />
          <th class="w-[20%] px-3">
            <button
              type="button"
              class="inline-flex cursor-pointer items-center gap-1 font-semibold"
              @click="emit('sort', 'nombre')"
            >
              Nombre<component :is="icon('nombre')" class="h-3.5 w-3.5" />
            </button>
          </th>
          <th class="w-[23%] px-3 font-semibold">
            Sistemas raíz donde se utiliza
          </th>
          <th class="w-[20%] px-3 font-semibold">Aceites relacionados</th>
          <th class="w-[12%] px-3">
            <button
              type="button"
              class="inline-flex cursor-pointer items-center gap-1 font-semibold"
              @click="emit('sort', 'estado')"
            >
              Estado<component :is="icon('estado')" class="h-3.5 w-3.5" />
            </button>
          </th>
          <th class="px-3">
            <button
              type="button"
              class="inline-flex cursor-pointer items-center gap-1 font-semibold"
              @click="emit('sort', 'equipos')"
            >
              Uso<component :is="icon('equipos')" class="h-3.5 w-3.5" />
            </button>
          </th>
          <th class="w-10" />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in items"
          :key="item.id"
          tabindex="0"
          class="h-16 cursor-pointer border-t border-gray-100 hover:bg-main/5 focus-visible:outline-2 focus-visible:outline-main"
          @click="emit('select', item, $event.currentTarget as HTMLElement)"
          @keydown.enter.prevent="
            emit('select', item, $event.currentTarget as HTMLElement)
          "
          @keydown.space.prevent="
            emit('select', item, $event.currentTarget as HTMLElement)
          "
        >
          <td class="px-3"><Network class="h-4 w-4 text-main" /></td>
          <td class="px-3 font-semibold text-main">{{ item.nombre }}</td>
          <td class="px-3">
            <span v-if="item.sistemas.length" class="text-gray-700"
              >{{
                item.sistemas
                  .slice(0, 2)
                  .map((related) => related.nombre)
                  .join(", ")
              }}<span v-if="item.sistemas.length > 2">
                +{{ item.sistemas.length - 2 }}</span
              ></span
            ><span v-else class="text-gray-500">Sin uso</span>
          </td>
          <td class="px-3">
            <span v-if="item.aceites.length" class="text-gray-700"
              >{{
                item.aceites
                  .slice(0, 2)
                  .map((related) => related.nombre)
                  .join(", ")
              }}<span v-if="item.aceites.length > 2">
                +{{ item.aceites.length - 2 }}</span
              ></span
            ><span v-else class="text-gray-500">Sin aceites</span>
          </td>
          <td class="px-3">
            <span
              class="rounded-md px-2 py-1 text-xs font-semibold"
              :class="
                item.activo
                  ? 'bg-success-bg text-success'
                  : 'bg-gray-100 text-gray-600'
              "
              >{{ item.activo ? "Activo" : "Desactivado" }}</span
            >
          </td>
          <td class="px-3 tabular-nums text-gray-600">
            Equipos {{ item.impacto.totalEquipos }} · Asignaciones
            {{ item.impacto.totalAsignaciones }}
          </td>
          <td><ChevronRight class="h-4 w-4 text-main" /></td>
        </tr>
      </tbody>
    </table>
    <div class="space-y-2 p-2 lg:hidden">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="flex min-h-24 w-full cursor-pointer items-center gap-3 rounded-md border border-gray-200 p-3 text-left hover:bg-main/5"
        @click="emit('select', item, $event.currentTarget as HTMLElement)"
      >
        <Network class="h-4 w-4 shrink-0 text-main" /><span
          class="min-w-0 flex-1"
          ><strong class="block text-sm text-main">{{ item.nombre }}</strong
          ><span class="mt-1 block text-xs text-gray-600">{{
            item.sistemas
              .slice(0, 2)
              .map((related) => related.nombre)
              .join(", ") || "Sin sistemas raíz asociados"
          }}</span
          ><span class="mt-1 block text-xs tabular-nums text-gray-500"
            >Equipos {{ item.impacto.totalEquipos }} · Asignaciones
            {{ item.impacto.totalAsignaciones }}</span
          ></span
        ><span
          class="text-xs font-semibold"
          :class="item.activo ? 'text-success' : 'text-gray-500'"
          >{{ item.activo ? "Activo" : "Desactivado" }}</span
        >
      </button>
    </div>
  </div>
</template>
