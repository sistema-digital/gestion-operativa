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

  const repuestosCaptura = ref<RepuestoCaptura[]>([]); // Nuevo estado para la tabla principal

  const isLoading = ref(false);
  const isLoaded = ref(false);
  const error = ref<string | null>(null);

  // ==========================================
  // GETTERS (Para alimentar listas/autocompletes UI)
  // ==========================================
  const opcionesSistemas = computed(() => sistemas.value.map(i => i.name));
  const opcionesCategorias = computed(() => categorias.value.map(i => i.name));
  const opcionesCriticidades = computed(() => criticidades.value.map(i => i.name));
  const opcionesEstados = computed(() => estados.value.map(i => i.name));
  const opcionesUnidades = computed(() => unidades.value.map(i => i.name));
  const opcionesProveedores = computed(() => proveedores.value.map(i => i.name));
  const opcionesTiposCodigo = computed(() => tiposCodigoProveedor.value.map(i => i.name));

  // ==========================================
  // MÉTODOS PRIVADOS (Helpers)
  // ==========================================
  
  /**
   * Limpia el string para comparaciones: trim, sin dobles espacios y en minúsculas.
   * Evita duplicados en frontend antes de enviarlos a la DB.
   */
  const normalizeText = (text: string | null | undefined): string => {
    if (!text) return '';
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
  };

  /**
   * Devuelve la referencia al arreglo correspondiente según el nombre de la tabla.
   */
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

  /**
   * Carga la lista completa de repuestos capturados
   */
  const cargarRepuestosCaptura = async (force = false) => {
    // Si ya tenemos datos y no forzamos, no recargamos
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

  /**
   * Guarda un nuevo repuesto principal
   */
  const guardarRepuestoCaptura = async (repuestoForm: Omit<RepuestoCaptura, 'id' | 'created_at' | 'updated_at'>) => {
    isLoading.value = true;
    error.value = null;
    try {
      const newRepuesto = await repuestosService.insertRepuestoCaptura(repuestoForm);
      // Actualizar lista local colocándolo al inicio (más reciente)
      repuestosCaptura.value.unshift(newRepuesto);
      return newRepuesto;
    } catch (err: any) {
      error.value = err.message || 'Error al guardar el repuesto.';
      console.error('Error guardando repuesto:', err);
      throw err; // Relanzamos el error para atraparlo en el componente UI
    } finally {
      isLoading.value = false;
    }
  };

  // ==========================================
  // ACCIONES (Catálogos Auxiliares)
  // ==========================================

  /**
   * Carga todos los catálogos auxiliares en paralelo.
   */
  const cargarCatalogos = async (force = false) => {
    if (isLoaded.value && !force) return;

    isLoading.value = true;
    error.value = null;

    try {
      const [
        resSistemas,
        resCategorias,
        resCriticidades,
        resEstados,
        resUnidades,
        resProveedores,
        resTiposCodigo
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
      error.value = err.message || 'Error al cargar los catálogos de repuestos.';
      console.error('Error cargando catálogos de repuestos:', err);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Verifica si un valor existe en el catálogo local. 
   * Si no existe, lo inserta en Supabase y actualiza la lista local automáticamente.
   * Retorna el texto final que debe guardarse en el formulario principal (el 'name').
   */
  const asegurarValorCatalogo = async (tableName: CatalogTableName, name: string): Promise<string> => {
    if (!name || name.trim() === '') return '';

    const normalizedInput = normalizeText(name);
    const targetArray = getTargetArrayRef(tableName);

    // 1. Buscar si ya existe localmente
    const itemExistente = targetArray.value.find(item => normalizeText(item.name) === normalizedInput);
    
    if (itemExistente) {
      // Devolvemos el nombre exactamente como está en la DB para mantener consistencia
      return itemExistente.name; 
    }

    // 2. Si no existe, lo insertamos en Supabase
    try {
      const newItem = await repuestosService.insertCatalogItem(tableName, name);
      
      // 3. Actualizamos la lista local para que aparezca sin recargar la página
      targetArray.value.push(newItem);
      
      // Opcional: Reordenar alfabéticamente tras insertar
      targetArray.value.sort((a, b) => a.name.localeCompare(b.name));

      return newItem.name;
    } catch (err) {
      console.error(`Error asegurando valor en ${tableName}:`, err);
      // Fallback: Si falla la inserción (ej. restricción UNIQUE que se nos pasó, 
      // o fallo de red), retornamos el texto ingresado para no bloquear al usuario.
      return name.trim();
    }
  };

  /**
   * Resetea el estado del store
   */
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
    // State
    sistemas,
    categorias,
    criticidades,
    estados,
    unidades,
    proveedores,
    tiposCodigoProveedor,
    repuestosCaptura,
    isLoading,
    isLoaded,
    error,
    
    // Getters
    opcionesSistemas,
    opcionesCategorias,
    opcionesCriticidades,
    opcionesEstados,
    opcionesUnidades,
    opcionesProveedores,
    opcionesTiposCodigo,

    // Actions
    cargarRepuestosCaptura,
    guardarRepuestoCaptura,
    cargarCatalogos,
    asegurarValorCatalogo,
    resetStore
  };
});