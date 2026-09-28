import {
  auxiliaresEstructuraLubricacionSchema,
  nodoEstructuraLubricacionSchema,
} from "./estructuraLubricacion.schemas";
import type {
  AuxiliaresEstructuraLubricacion,
  CatalogoActivo,
  NodoEstructuraLubricacion,
} from "./estructuraLubricacion.types";

type CrearErrorContrato = (mensaje: string) => Error;

const mensajeZod = (
  prefijo: string,
  error: { issues: Array<{ message: string }> },
): string =>
  `${prefijo} ${error.issues[0]?.message ?? "La forma recibida no es válida."}`;

const mapCatalogoAuxiliarActivo = (item: {
  id: number;
  nombre: string;
}): CatalogoActivo => ({
  id: item.id,
  nombre: item.nombre.trim(),
  activo: true,
});

export const mapAuxiliaresEstructuraLubricacion = (
  dto: {
    ok: boolean;
    sistemas?: Array<{ id: number; nombre: string }>;
    subsistemas?: Array<{ id: number; nombre: string }>;
    aceites?: Array<{ id: number; nombre: string }>;
  },
  crearError: CrearErrorContrato,
): AuxiliaresEstructuraLubricacion => {
  if ("sistemas_aceite" in dto) {
    throw crearError(
      "Auxiliares de estructura inválidos. El contrato sistemas_aceite ya no es compatible.",
    );
  }

  const resultado = auxiliaresEstructuraLubricacionSchema.safeParse({
    ok: dto.ok,
    sistemas: dto.sistemas,
    subsistemas: dto.subsistemas,
    aceites: dto.aceites,
  });
  if (!resultado.success) {
    throw crearError(
      mensajeZod("Auxiliares de estructura inválidos.", resultado.error),
    );
  }

  return {
    sistemas: resultado.data.sistemas.map(mapCatalogoAuxiliarActivo),
    subsistemas: resultado.data.subsistemas.map(mapCatalogoAuxiliarActivo),
    aceites: resultado.data.aceites.map(mapCatalogoAuxiliarActivo),
  };
};

export const mapNodoEstructuraLubricacion = (
  dto: {
    id: number;
    parent_id: number | null;
    sistema: { id: number; nombre: string; activo: boolean } | null;
    subsistema: { id: number; nombre: string; activo: boolean } | null;
    aceite: { id: number; nombre: string; activo: boolean } | null;
  },
  crearError: CrearErrorContrato,
): NodoEstructuraLubricacion => {
  const resultado = nodoEstructuraLubricacionSchema.safeParse(dto);
  if (!resultado.success) {
    throw crearError(
      mensajeZod("Nodo de estructura inválido.", resultado.error),
    );
  }

  return {
    id: resultado.data.id,
    parentId: resultado.data.parent_id,
    sistema: resultado.data.sistema,
    subsistema: resultado.data.subsistema,
    aceite: resultado.data.aceite,
  };
};
