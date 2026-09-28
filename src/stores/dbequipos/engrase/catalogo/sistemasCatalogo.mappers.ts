import { z } from "zod";
import { CatalogoSistemasError } from "./sistemasCatalogo.errors";
import type {
  CatalogoAceiteRelacionado,
  CatalogoSistemaGuardarResultado,
  CatalogoSistemaItem,
  CatalogoSistemasResumen,
  CatalogoTipoEquipoImpacto,
} from "./sistemasCatalogo.types";

const id = z.number().int().positive();
const count = z.number().finite().nonnegative();
const name = z.string().trim().min(1);
const relatedSchema = z.object({ id, nombre: name, cantidad_equipos: count });
const impactSchema = z.object({
  total_equipos: count,
  total_asignaciones: count,
  tipos_equipo: z.array(relatedSchema),
});
const itemSchema = z.object({
  id,
  nombre: name,
  activo: z.boolean(),
  creado_en: z.string().datetime({ offset: true }).nullable(),
  actualizado_en: z.string().datetime({ offset: true }).nullable(),
  aceites: z.array(relatedSchema),
  impacto: impactSchema,
});
const listSchema = z.object({
  ok: z.literal(true),
  items: z.array(itemSchema),
  resumen: z.object({ total: count, activos: count, desactivados: count }),
});
const saveSchema = z.object({
  ok: z.literal(true),
  operacion: z.enum(["creado", "actualizado"]),
  codigo: z.enum(["SISTEMA_CREADO", "SISTEMA_ACTUALIZADO"]),
  mensaje: name,
  afecta_equipos: count,
  item: itemSchema,
});

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new CatalogoSistemasError(
      "RESPUESTA_INVALIDA",
      "La respuesta del catálogo es inválida.",
    );
  return result.data;
}
function mapRelated(
  value: z.infer<typeof relatedSchema>,
): CatalogoAceiteRelacionado {
  return {
    id: value.id,
    nombre: value.nombre,
    cantidadEquipos: value.cantidad_equipos,
  };
}
function mapEquipment(
  value: z.infer<typeof relatedSchema>,
): CatalogoTipoEquipoImpacto {
  return mapRelated(value);
}
function mapItem(value: z.infer<typeof itemSchema>): CatalogoSistemaItem {
  return {
    id: value.id,
    nombre: value.nombre,
    activo: value.activo,
    creadoEn: value.creado_en,
    actualizadoEn: value.actualizado_en,
    aceites: value.aceites.map(mapRelated),
    impacto: {
      totalEquipos: value.impacto.total_equipos,
      totalAsignaciones: value.impacto.total_asignaciones,
      tiposEquipo: value.impacto.tipos_equipo.map(mapEquipment),
    },
  };
}
export function mapCatalogoSistemaItem(value: unknown): CatalogoSistemaItem {
  return mapItem(parse(itemSchema, value));
}
export function mapCatalogoSistemasListarResponse(value: unknown): {
  items: CatalogoSistemaItem[];
  resumen: CatalogoSistemasResumen;
} {
  const response = parse(listSchema, value);
  return { items: response.items.map(mapItem), resumen: response.resumen };
}
export function mapCatalogoSistemaGuardarResponse(
  value: unknown,
): CatalogoSistemaGuardarResultado {
  const response = parse(saveSchema, value);
  return {
    operacion: response.operacion,
    codigo: response.codigo,
    mensaje: response.mensaje,
    afectaEquipos: response.afecta_equipos,
    item: mapItem(response.item),
  };
}
