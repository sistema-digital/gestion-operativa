import { z } from "zod";

const idPositivo = z.number().int().positive();
const nombre = z.string().trim().min(1);

export const catalogoActivoSchema = z
  .object({
    id: idPositivo,
    nombre,
    activo: z.boolean(),
  })
  .strict();

export const catalogoAuxiliarSchema = z
  .object({
    id: idPositivo,
    nombre,
  })
  .strict();

export const nodoEstructuraLubricacionSchema = z
  .object({
    id: idPositivo,
    parent_id: idPositivo.nullable(),
    sistema: catalogoActivoSchema.nullable(),
    subsistema: catalogoActivoSchema.nullable(),
    aceite: catalogoActivoSchema.nullable(),
  })
  .strict()
  .superRefine((nodo, contexto) => {
    const esRaiz = nodo.parent_id === null;
    const tipoEsValido = esRaiz
      ? nodo.sistema !== null && nodo.subsistema === null
      : nodo.sistema === null && nodo.subsistema !== null;

    if (!tipoEsValido) {
      contexto.addIssue({
        code: "custom",
        message: esRaiz
          ? "Un nodo raíz requiere sistema y no admite subsistema."
          : "Un nodo hijo requiere subsistema y no admite sistema.",
      });
    }
  });

export const auxiliaresEstructuraLubricacionSchema = z
  .object({
    ok: z.literal(true),
    sistemas: z.array(catalogoAuxiliarSchema),
    subsistemas: z.array(catalogoAuxiliarSchema),
    aceites: z.array(catalogoAuxiliarSchema),
  })
  .passthrough();
