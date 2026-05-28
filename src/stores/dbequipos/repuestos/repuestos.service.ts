import { supabaseEquipos } from '@/lib/supabase';
import type { CatalogItem, CatalogTableName, RepuestoCaptura } from './repuestos.types';

export const repuestosService = {
  // ... (mantén los métodos anteriores fetchActiveCatalog, insertCatalogItem, fetchRepuestosCaptura, insertRepuestoCaptura)

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

  /**
   * Actualiza un repuesto existente
   */
  async updateRepuestoCaptura(id: string, repuesto: Partial<RepuestoCaptura>): Promise<RepuestoCaptura> {
    // Evitamos enviar campos inmutables
    const updateData = { ...repuesto, updated_at: new Date().toISOString() };
    delete updateData.id;
    delete updateData.created_at;

    const { data, error } = await supabaseEquipos
      .from('catalogo_repuestos_captura')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating repuesto captura:', error);
      throw error;
    }

    return data as RepuestoCaptura;
  },

  /**
   * Elimina un repuesto permanentemente
   */
  async deleteRepuestoCaptura(id: string): Promise<void> {
    const { error } = await supabaseEquipos
      .from('catalogo_repuestos_captura')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting repuesto captura:', error);
      throw error;
    }
  }
};