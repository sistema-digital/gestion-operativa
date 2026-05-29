import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { repuestosService } from './repuestos.service';
import type { CatalogItem, CatalogTableName, RepuestoCaptura } from './repuestos.types';

export const useRepuestosStore = defineStore('dbequipos_repuestos', () => {
  // ==========================================
  // ESTADO (State)
  // ==========================================
  const sistemas = ref<CatalogItem[]>([]);
  const categorias = ref<CatalogItem[]>([]);
  const criticidades = ref<CatalogItem[]>([]);
  const estados = ref<CatalogItem[]>([]);
  const unidades = ref<CatalogItem[]>([]);
  const proveedores = ref<CatalogItem[]>([]);
  const tiposCodigoProveedor = ref<CatalogItem[]>([]);

  const repuestosCaptura = ref<RepuestoCaptura[]>([]);

  const isLoading = ref(false);
  const isLoaded = ref(false);
  const error = ref<string | null>(null);

  // ==========================================
  // GETTERS
  // ==========================================
  const opcionesSistemas = computed(() => sistemas.value.map(i => i.name));
  const opcionesCategorias = computed(() => categorias.value.map(i => i.name));
  const opcionesCriticidades = computed(() => criticidades.value.map(i => i.name));
  const opcionesEstados = computed(() => estados.value.map(i => i.name));
  const opcionesUnidades = computed(() => unidades.value.map(i => i.name));
  const opcionesProveedores = computed(() => proveedores.value.map(i => i.name));
  const opcionesTiposCodigo = computed(() => tiposCodigoProveedor.value.map(i => i.name));

  // ==========================================
  // HELPERS PRIVADOS
  // ==========================================
  const normalizeText = (text: string | null | undefined): string => {
    if (!text) return '';
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
  };

  const getTargetArrayRef = (tableName: CatalogTableName) => {
    switch (tableName) {
      case 'repuesto_sistema': return sistemas;
      case 'repuesto_categoria': return categorias;
      case 'repuesto_criticidad': return criticidades;
      case 'repuesto_estado': return estados;
      case 'repuesto_unidad': return unidades;
      case 'repuesto_proveedor': return proveedores;
      case 'repuesto_tipo_codigo_proveedor': return tiposCodigoProveedor;
    }
  };

  // ==========================================
  // ACCIONES PRINCIPALES (Tabla Principal)
  // ==========================================

  const cargarRepuestosCaptura = async (force = false) => {
    if (repuestosCaptura.value.length > 0 && !force) return;

    isLoading.value = true;
    error.value = null;

    try {
      repuestosCaptura.value = await repuestosService.fetchRepuestosCaptura();
    } catch (err: any) {
      error.value = err.message || 'Error al cargar los repuestos.';
      console.error('Error cargando repuestos:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const guardarRepuestoCaptura = async (repuestoForm: Omit<RepuestoCaptura, 'id' | 'created_at' | 'updated_at'>) => {
    isLoading.value = true;
    error.value = null;
    try {
      const newRepuesto = await repuestosService.insertRepuestoCaptura(repuestoForm);
      repuestosCaptura.value.unshift(newRepuesto);
      return newRepuesto;
    } catch (err: any) {
      error.value = err.message || 'Error al guardar el repuesto.';
      console.error('Error guardando repuesto:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Actualiza un repuesto en la base de datos y en el estado local.
   */
  const actualizarRepuestoCaptura = async (id: string, repuestoForm: Partial<RepuestoCaptura>) => {
    isLoading.value = true;
    error.value = null;
    try {
      const updatedRepuesto = await repuestosService.updateRepuestoCaptura(id, repuestoForm);
      
      // Actualizamos el estado local
      const index = repuestosCaptura.value.findIndex(r => r.id === id);
      if (index !== -1) {
        repuestosCaptura.value[index] = updatedRepuesto;
      }
      
      return updatedRepuesto;
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar el repuesto.';
      console.error('Error actualizando repuesto:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Elimina un repuesto de la base de datos y del estado local.
   */
  const eliminarRepuestoCaptura = async (id: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      await repuestosService.deleteRepuestoCaptura(id);
      
      // Eliminamos del estado local
      repuestosCaptura.value = repuestosCaptura.value.filter(r => r.id !== id);
    } catch (err: any) {
      error.value = err.message || 'Error al eliminar el repuesto.';
      console.error('Error eliminando repuesto:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // ==========================================
  // ACCIONES (Catálogos Auxiliares)
  // ==========================================

  const cargarCatalogos = async (force = false) => {
    if (isLoaded.value && !force) return;

    isLoading.value = true;
    error.value = null;

    try {
      const [
        resSistemas, resCategorias, resCriticidades, resEstados, resUnidades, resProveedores, resTiposCodigo
      ] = await Promise.all([
        repuestosService.fetchActiveCatalog('repuesto_sistema'),
        repuestosService.fetchActiveCatalog('repuesto_categoria'),
        repuestosService.fetchActiveCatalog('repuesto_criticidad'),
        repuestosService.fetchActiveCatalog('repuesto_estado'),
        repuestosService.fetchActiveCatalog('repuesto_unidad'),
        repuestosService.fetchActiveCatalog('repuesto_proveedor'),
        repuestosService.fetchActiveCatalog('repuesto_tipo_codigo_proveedor'),
      ]);

      sistemas.value = resSistemas;
      categorias.value = resCategorias;
      criticidades.value = resCriticidades;
      estados.value = resEstados;
      unidades.value = resUnidades;
      proveedores.value = resProveedores;
      tiposCodigoProveedor.value = resTiposCodigo;

      isLoaded.value = true;
    } catch (err: any) {
      error.value = err.message || 'Error al cargar los catálogos auxiliares.';
      console.error('Error cargando catálogos auxiliares:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const asegurarValorCatalogo = async (tableName: CatalogTableName, name: string): Promise<string> => {
    if (!name || name.trim() === '') return '';

    const normalizedInput = normalizeText(name);
    const targetArray = getTargetArrayRef(tableName);

    const itemExistente = targetArray.value.find(item => normalizeText(item.name) === normalizedInput);
    if (itemExistente) return itemExistente.name;

    try {
      const newItem = await repuestosService.insertCatalogItem(tableName, name);
      targetArray.value.push(newItem);
      targetArray.value.sort((a, b) => a.name.localeCompare(b.name));
      return newItem.name;
    } catch (err) {
      console.error(`Error asegurando valor en ${tableName}:`, err);
      return name.trim();
    }
  };

  const resetStore = () => {
    sistemas.value = [];
    categorias.value = [];
    criticidades.value = [];
    estados.value = [];
    unidades.value = [];
    proveedores.value = [];
    tiposCodigoProveedor.value = [];
    repuestosCaptura.value = [];
    isLoaded.value = false;
    isLoading.value = false;
    error.value = null;
  };

  return {
    sistemas, categorias, criticidades, estados, unidades, proveedores, tiposCodigoProveedor, repuestosCaptura, isLoading, isLoaded, error,
    opcionesSistemas, opcionesCategorias, opcionesCriticidades, opcionesEstados, opcionesUnidades, opcionesProveedores, opcionesTiposCodigo,
    cargarRepuestosCaptura, guardarRepuestoCaptura, actualizarRepuestoCaptura, eliminarRepuestoCaptura, // <--- Acciones expuestas aquí
    cargarCatalogos, asegurarValorCatalogo, resetStore
  };
});