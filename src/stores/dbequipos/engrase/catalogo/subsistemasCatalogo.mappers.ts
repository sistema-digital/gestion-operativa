import { z } from "zod";
import { CatalogoSubsistemasError } from "./subsistemasCatalogo.errors";
import type {
  CatalogoRelacionado,
  CatalogoSubsistemaGuardarResultado,
  CatalogoSubsistemaItem,
  CatalogoSubsistemasResumen,
} from "./subsistemasCatalogo.types";

const positiveId = z.number().int().positive();
const nonNegative = z.number().finite().nonnegative();
const name = z.string().trim().min(1);
const timestamp = z.string().datetime({ offset: true }).nullable();
const relatedSchema = z.object({
  id: positiveId,
  nombre: name,
  cantidad_equipos: nonNegative,
});
const impactSchema = z.object({
  total_equipos: nonNegative,
  total_asignaciones: nonNegative,
  tipos_equipo: z.array(relatedSchema),
});
const itemSchema = z.object({
  id: positiveId,
  nombre: name,
  activo: z.boolean(),
  creado_en: timestamp,
  actualizado_en: timestamp,
  sistemas: z.array(relatedSchema),
  aceites: z.array(relatedSchema),
  impacto: impactSchema,
});
const listSchema = z.object({
  ok: z.literal(true),
  items: z.array(itemSchema),
  resumen: z.object({
    total: nonNegative,
    activos: nonNegative,
    desactivados: nonNegative,
  }),
});
const saveSchema = z.object({
  ok: z.literal(true),
  operacion: z.enum(["creado", "actualizado"]),
  codigo: z.enum(["SUBSISTEMA_CREADO", "SUBSISTEMA_ACTUALIZADO"]),
  mensaje: name,
  afecta_equipos: nonNegative,
  item: itemSchema,
});

function invalid(message: string): never {
  throw new CatalogoSubsistemasError("RESPUESTA_INVALIDA", message);
}

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) invalid("La respuesta del catálogo es inválida.");
  return result.data;
}

function mapRelated(value: z.infer<typeof relatedSchema>): CatalogoRelacionado {
  return {
    id: value.id,
    nombre: value.nombre,
    cantidadEquipos: value.cantidad_equipos,
  };
}

function mapItem(value: z.infer<typeof itemSchema>): CatalogoSubsistemaItem {
  return {
    id: value.id,
    nombre: value.nombre,
    activo: value.activo,
    creadoEn: value.creado_en,
    actualizadoEn: value.actualizado_en,
    sistemas: value.sistemas.map(mapRelated),
    aceites: value.aceites.map(mapRelated),
    impacto: {
      totalEquipos: value.impacto.total_equipos,
      totalAsignaciones: value.impacto.total_asignaciones,
      tiposEquipo: value.impacto.tipos_equipo.map(mapRelated),
    },
  };
}

export function mapCatalogoSubsistemasListarResponse(value: unknown): {
  items: CatalogoSubsistemaItem[];
  resumen: CatalogoSubsistemasResumen;
} {
  const response = parse(listSchema, value);
  return {
    items: response.items.map(mapItem),
    resumen: response.resumen,
  };
}

export function mapCatalogoSubsistemaGuardarResponse(
  value: unknown,
): CatalogoSubsistemaGuardarResultado {
  const response = parse(saveSchema, value);
  return {
    operacion: response.operacion,
    codigo: response.codigo,
    mensaje: response.mensaje,
    afectaEquipos: response.afecta_equipos,
    item: mapItem(response.item),
  };
}
