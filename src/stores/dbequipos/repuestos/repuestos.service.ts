import { supabaseEquipos } from '@/lib/supabase';
import type {
  CatalogItem,
  CatalogTableName,
  RepuestoCaptura,
  RepuestoImageFileMap,
  RepuestoImageSlot
} from './repuestos.types';
import {
  buildOriginalImagesValue,
  createEmptyRepuestoImageFileMap,
  parseRepuestoImagenes,
  REPUESTO_IMAGE_SLOTS
} from './repuestos.images';

const REPUESTOS_BUCKET = 'catalogo-repuestos';
const SIGNED_URL_TTL_SECONDS = 3600;

const IMAGE_EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

const getImageExtension = (file: File) => {
  return IMAGE_EXTENSION_BY_TYPE[file.type] ?? 'jpg';
};

const buildOriginalImagePath = (
  userId: string,
  repuestoId: string,
  slot: RepuestoImageSlot,
  file: File
) => {
  const extension = getImageExtension(file);
  return `repuestos/${userId}/${repuestoId}/${slot}.${extension}`;
};

const buildThumbnailPath = (userId: string, repuestoId: string) => {
  return `repuestos/${userId}/${repuestoId}/thumb-200x200.jpg`;
};

export const repuestosService = {
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

  async insertRepuestoCaptura(
    repuesto: Omit<RepuestoCaptura, 'id' | 'created_at' | 'updated_at'>
  ): Promise<RepuestoCaptura> {
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

  async updateRepuestoCaptura(id: string, repuesto: Partial<RepuestoCaptura>): Promise<RepuestoCaptura> {
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

  async deleteRepuestoCaptura(id: string): Promise<void> {
    const { error } = await supabaseEquipos
      .from('catalogo_repuestos_captura')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting repuesto captura:', error);
      throw error;
    }
  },

  async getAuthenticatedUserId(): Promise<string> {
    const { data: { user }, error } = await supabaseEquipos.auth.getUser();

    if (error) {
      console.error('Error obteniendo usuario autenticado de Equipos:', error);
      throw error;
    }

    if (!user?.id) {
      throw new Error('No hay un usuario autenticado para subir imágenes.');
    }

    return user.id;
  },

  async createSquareThumbnail(file: File): Promise<File> {
    const objectUrl = URL.createObjectURL(file);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('No se pudo procesar la imagen frente.'));
        img.src = objectUrl;
      });

      const size = Math.min(image.width, image.height);
      const sourceX = (image.width - size) / 2;
      const sourceY = (image.height - size) / 2;
      const canvas = document.createElement('canvas');

      canvas.width = 200;
      canvas.height = 200;

      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('No se pudo inicializar el canvas para la miniatura.');
      }

      context.drawImage(image, sourceX, sourceY, size, size, 0, 0, 200, 200);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (!result) {
            reject(new Error('No se pudo exportar la miniatura del repuesto.'));
            return;
          }

          resolve(result);
        }, 'image/jpeg', 0.86);
      });

      return new File([blob], 'thumb-200x200.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  },

  async uploadRepuestoImage(
    path: string,
    file: File
  ): Promise<string> {
    const { error } = await supabaseEquipos.storage
      .from(REPUESTOS_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.error(`Error subiendo imagen ${path}:`, error);
      throw error;
    }

    return path;
  },

  async uploadRepuestoImages(params: {
    repuestoId: string;
    files: RepuestoImageFileMap;
    existingImagen1?: string | null;
    existingImagen2?: string | null;
  }) {
    const { repuestoId, existingImagen1, existingImagen2 } = params;
    const files = {
      ...createEmptyRepuestoImageFileMap(),
      ...params.files
    };
    const userId = await this.getAuthenticatedUserId();
    const existingPaths = parseRepuestoImagenes({
      imagen_1: existingImagen1,
      imagen_2: existingImagen2
    });

    const nextOriginalPaths: Partial<Record<RepuestoImageSlot, string | null>> = {
      frente: existingPaths.frentePath,
      lado: existingPaths.ladoPath,
      puesta: existingPaths.puestaPath,
      extra: existingPaths.extraPath
    };

    for (const slot of REPUESTO_IMAGE_SLOTS) {
      const file = files[slot];

      if (!file) continue;

      const path = buildOriginalImagePath(userId, repuestoId, slot, file);
      nextOriginalPaths[slot] = await this.uploadRepuestoImage(path, file);
    }

    let thumbnailPath = existingPaths.miniaturaPath;

    if (files.frente) {
      const thumbnailFile = await this.createSquareThumbnail(files.frente);
      const path = buildThumbnailPath(userId, repuestoId);
      thumbnailPath = await this.uploadRepuestoImage(path, thumbnailFile);
    }

    return {
      imagen_1: thumbnailPath,
      imagen_2: buildOriginalImagesValue(nextOriginalPaths)
    };
  },

  async createSignedImageUrl(path: string | null | undefined, ttl = SIGNED_URL_TTL_SECONDS) {
    const cleanPath = path?.trim();

    if (!cleanPath) return null;

    const { data, error } = await supabaseEquipos.storage
      .from(REPUESTOS_BUCKET)
      .createSignedUrl(cleanPath, ttl);

    if (error) {
      console.error(`Error firmando URL para ${cleanPath}:`, error);
      return null;
    }

    return data.signedUrl;
  },

  async createSignedImageUrls(paths: Array<string | null | undefined>, ttl = SIGNED_URL_TTL_SECONDS) {
    const results = await Promise.all(
      paths.map(async (path) => this.createSignedImageUrl(path, ttl))
    );

    return results;
  }
};
