import type { NodoEstructuraLubricacion } from "./estructuraLubricacion.types";
import {
  ErrorEstructuraLubricacion,
  type EstructuraSistemasCambiosPayload,
  type NodoEstructuraBorrador,
} from "./estructuraLubricacion.draft.types";
import { validarBorradorEstructura } from "./estructuraLubricacion.validation";

const catalogoNuevoPayload = (catalogo: NodoEstructuraBorrador["sistema"]) =>
  catalogo?.id === null
    ? { temp_id: catalogo.tempId, nombre: catalogo.nombre }
    : undefined;
const referenciaCatalogoPayload = (
  propiedad: "sistema_id" | "subsistema_id" | "aceite_id",
  catalogo: NodoEstructuraBorrador["sistema"],
  id: number | null,
): Record<string, number | null> =>
  catalogo?.id === null && id === null ? {} : { [propiedad]: id };

export function construirCambiosEstructura(
  original: readonly NodoEstructuraLubricacion[],
  borrador: readonly NodoEstructuraBorrador[],
): EstructuraSistemasCambiosPayload {
  const validacion = validarBorradorEstructura(borrador);
  if (!validacion.valido)
    throw new ErrorEstructuraLubricacion(
      validacion.errores[0]?.codigo ?? "ESTRUCTURA_INVALIDA",
      validacion.errores[0]?.mensaje ?? "La estructura no es válida.",
    );
  const originales = new Map(original.map((nodo) => [nodo.id, nodo]));
  const nuevos = borrador
    .filter((nodo) => nodo.estadoLocal === "nuevo")
    .map((nodo) => {
      if (!nodo.tempId)
        throw new ErrorEstructuraLubricacion(
          "ESTRUCTURA_TEMP_ID_REQUERIDO",
          "Un nodo nuevo requiere tempId.",
        );
      return {
        temp_id: nodo.tempId,
        parent_id: nodo.parentId,
        parent_temp_id: nodo.parentTempId,
        ...referenciaCatalogoPayload(
          "sistema_id",
          nodo.sistema,
          nodo.sistemaId,
        ),
        ...referenciaCatalogoPayload(
          "subsistema_id",
          nodo.subsistema,
          nodo.subsistemaId,
        ),
        ...referenciaCatalogoPayload("aceite_id", nodo.aceite, nodo.aceiteId),
        ...(catalogoNuevoPayload(nodo.sistema)
          ? { sistema_nuevo: catalogoNuevoPayload(nodo.sistema) }
          : {}),
        ...(catalogoNuevoPayload(nodo.subsistema)
          ? { subsistema_nuevo: catalogoNuevoPayload(nodo.subsistema) }
          : {}),
        ...(catalogoNuevoPayload(nodo.aceite)
          ? { aceite_nuevo: catalogoNuevoPayload(nodo.aceite) }
          : {}),
      };
    });
  const actualizados = borrador.flatMap((nodo) => {
    if (nodo.estadoLocal !== "existente" || nodo.id === null) return [];
    const originalNodo = originales.get(nodo.id);
    if (!originalNodo)
      throw new ErrorEstructuraLubricacion(
        "ESTRUCTURA_NODO_ORIGINAL_NO_ENCONTRADO",
        "El nodo persistido no existe en el snapshot original.",
      );
    const cambio: {
      id: number;
      parent_id?: number | null;
      parent_temp_id?: string | null;
      sistema_id?: number;
      sistema_nuevo?: { temp_id: string; nombre: string };
      subsistema_id?: number;
      subsistema_nuevo?: { temp_id: string; nombre: string };
      aceite_id?: number | null;
      aceite_nuevo?: { temp_id: string; nombre: string };
    } = { id: nodo.id };
    if (nodo.parentTempId !== null) {
      cambio.parent_temp_id = nodo.parentTempId;
    } else if (nodo.parentId !== originalNodo.parentId) {
      cambio.parent_id = nodo.parentId;
    }
    if (nodo.sistema !== null && nodo.sistemaId !== originalNodo.sistema?.id) {
      const sistemaNuevo = catalogoNuevoPayload(nodo.sistema);
      if (sistemaNuevo) cambio.sistema_nuevo = sistemaNuevo;
      else if (nodo.sistemaId !== null) cambio.sistema_id = nodo.sistemaId;
    }
    if (
      nodo.subsistema !== null &&
      nodo.subsistemaId !== originalNodo.subsistema?.id
    ) {
      const subsistemaNuevo = catalogoNuevoPayload(nodo.subsistema);
      if (subsistemaNuevo) cambio.subsistema_nuevo = subsistemaNuevo;
      else if (nodo.subsistemaId !== null)
        cambio.subsistema_id = nodo.subsistemaId;
    }
    if (nodo.aceiteId !== (originalNodo.aceite?.id ?? null)) {
      const aceiteNuevo = catalogoNuevoPayload(nodo.aceite);
      if (aceiteNuevo) cambio.aceite_nuevo = aceiteNuevo;
      else cambio.aceite_id = nodo.aceiteId;
    }
    return Object.keys(cambio).length > 1 ? [cambio] : [];
  });
  const eliminados = borrador
    .filter(
      (nodo) =>
        nodo.estadoLocal === "pendiente_eliminacion" && nodo.id !== null,
    )
    .filter(
      (nodo) =>
        nodo.parentId === null ||
        borrador.find((padre) => padre.id === nodo.parentId)?.estadoLocal !==
          "pendiente_eliminacion",
    )
    .map((nodo) => ({ id: nodo.id as number }));
  return { nuevos, actualizados, eliminados };
}
