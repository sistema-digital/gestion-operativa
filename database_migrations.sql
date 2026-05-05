-- ====================================================
-- MIGRACIONES SQL NECESARIAS: COMPRAS Y MANTENIMIENTO
-- ====================================================

-- ----------------------------------------------------
-- 1. BASE DE DATOS: bdcompras
-- Ejecutar en: https://nnwtjjngneoeqbvifinn.supabase.co
-- ----------------------------------------------------

-- A) Agregar campo solicitud_id e indexarlo para no depender de folio_sol
ALTER TABLE public.detalle_solicitud
ADD COLUMN solicitud_id UUID NULL;

ALTER TABLE public.detalle_solicitud
ADD CONSTRAINT detalle_solicitud_solicitud_id_fkey
FOREIGN KEY (solicitud_id)
REFERENCES public.solicitud_compra(id);

CREATE INDEX IF NOT EXISTS idx_detalle_solicitud_solicitud_id
ON public.detalle_solicitud USING btree (solicitud_id);

-- B) Agregar campo descripcion_manual para ítems que no vienen del catálogo de productos
ALTER TABLE public.detalle_solicitud
ADD COLUMN descripcion_manual VARCHAR(255) NULL;

-- C) Eliminar foreign key de cod_producto para permitir códigos temporales (ej: TMP-PROD-XXXX)
ALTER TABLE public.detalle_solicitud
DROP CONSTRAINT IF EXISTS detalle_solicitud_cod_producto_fkey;


-- ----------------------------------------------------
-- 2. BASE DE DATOS: mantenimiento/equipos
-- Ejecutar en: https://zirlaiyndcroxlvulsve.supabase.co
-- ----------------------------------------------------

-- A) Agregar campo solicitud_id para ligar lógicamente con bdcompras (SIN FOREIGN KEY)
ALTER TABLE public.equipo_solicitudes
ADD COLUMN solicitud_id UUID NULL;

CREATE INDEX IF NOT EXISTS idx_equipo_solicitudes_solicitud_id
ON public.equipo_solicitudes USING btree (solicitud_id);
