import { defineStore } from 'pinia';

import { equiposService } from './equipos.service';
import type {
  EquipoOption,
  EquipoRow,
  EquiposState,
} from './equipos.types';

const mapEquipoRowToOption = (row: EquipoRow): EquipoOption => {
  const parts = [row.cod_equipo];
  const trailing = [row.tipo, row.marca, row.modelo]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' · ');

  if (trailing) {
    parts.push(trailing);
  }

  return {
    id: row.id,
    codEquipo: row.cod_equipo,
    modelo: row.modelo,
    marca: row.marca,
    tipo: row.tipo,
    label: parts.join(' · '),
  };
};

const createInitialState = (): EquiposState => ({
  searchResults: [],
  selectedItems: [],
  isSearching: false,
  error: null,
  lastQuery: '',
});

const matchesEquipoQuery = (item: EquipoOption, query: string): boolean => {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length < 3) {
    return false;
  }

  return [
    item.codEquipo,
    item.modelo,
    item.marca,
    item.tipo,
    item.label,
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .some((value) => value.toLowerCase().includes(normalizedQuery));
};

export const useEquiposStore = defineStore('dbequipos_equipos', {
  state: (): EquiposState => createInitialState(),

  actions: {
    async buscarEquipos(query: string): Promise<EquipoOption[]> {
      const normalizedQuery = query.trim();
      this.lastQuery = normalizedQuery;
      this.error = null;

      if (normalizedQuery.length < 3) {
        this.isSearching = false;
        this.searchResults = [];
        return [];
      }

      this.isSearching = true;

      try {
        const rows = await equiposService.buscarEquipos({ query: normalizedQuery });
        const selectedCodes = new Set(this.selectedItems.map((item) => item.codEquipo));

        this.searchResults = rows
          .map(mapEquipoRowToOption)
          .filter((item) => !selectedCodes.has(item.codEquipo));

        return this.searchResults;
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : 'No se pudieron obtener los equipos';

        this.error = message;
        this.searchResults = [];
        throw error;
      } finally {
        this.isSearching = false;
      }
    },

    agregarEquipo(item: EquipoOption): void {
      if (this.selectedItems.some((equipo) => equipo.codEquipo === item.codEquipo)) {
        return;
      }

      this.selectedItems = [...this.selectedItems, item];
      this.searchResults = this.searchResults.filter(
        (equipo) => equipo.codEquipo !== item.codEquipo
      );
    },

    removerEquipo(codEquipo: string): void {
      const removedItem = this.selectedItems.find((item) => item.codEquipo === codEquipo);

      this.selectedItems = this.selectedItems.filter(
        (item) => item.codEquipo !== codEquipo
      );

      if (
        removedItem
        && matchesEquipoQuery(removedItem, this.lastQuery)
        && !this.searchResults.some((item) => item.codEquipo === codEquipo)
      ) {
        this.searchResults = [...this.searchResults, removedItem]
          .sort((left, right) => left.codEquipo.localeCompare(right.codEquipo));
      }
    },

    limpiarResultados(): void {
      this.searchResults = [];
      this.lastQuery = '';
      this.error = null;
    },

    reset(): void {
      Object.assign(this, createInitialState());
    },
  },
});
