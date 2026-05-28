import { supabaseEquipos } from '@/lib/supabase';
import type { CatalogItem, CatalogTableName, RepuestoCaptura } from './repuestos.types';

export const repuestosService = {
  /**
   * Obtiene todos los registros activos de una tabla de catálogo específica.
   */
  async fetchActiveCatalog(tableName: CatalogTableName): Promise<CatalogItem[]> {
    const { data, error } = await supabaseEquipos
      .from(tableName)
      .select('id, name, activo')
      .eq('activo', true)
      .order('name');

    if (error) {
      console.error(`Error fetching catalog ${tableName}:`, error);
      throw error;
    }

    return data as CatalogItem[];
  },

  /**
   * Inserta un nuevo valor en una tabla de catálogo.
   * Supabase devolverá el registro insertado (incluyendo el ID generado).
   */
  async insertCatalogItem(tableName: CatalogTableName, name: string): Promise<CatalogItem> {
    const { data, error } = await supabaseEquipos
      .from(tableName)
      .insert([{ name: name.trim() }])
      .select('id, name, activo')
      .single();

    if (error) {
      console.error(`Error inserting into ${tableName}:`, error);
      throw error;
    }

    return data as CatalogItem;
  },

  /**
   * Obtiene la lista principal de repuestos capturados
   */
  async fetchRepuestosCaptura(): Promise<RepuestoCaptura[]> {
    const { data, error } = await supabaseEquipos
      .from('catalogo_repuestos_captura')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching repuestos captura:', error);
      throw error;
    }

    return data as RepuestoCaptura[];
  },

  /**
   * Inserta un nuevo repuesto en la tabla principal de captura
   */
  async insertRepuestoCaptura(repuesto: Omit<RepuestoCaptura, 'id' | 'created_at' | 'updated_at'>): Promise<RepuestoCaptura> {
    const { data, error } = await supabaseEquipos
      .from('catalogo_repuestos_captura')
      .insert([repuesto])
      .select('*')
      .single();

    if (error) {
      console.error('Error inserting repuesto captura:', error);
      throw error;
    }

    return data as RepuestoCaptura;
  },
};