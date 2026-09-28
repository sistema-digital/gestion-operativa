import type { NodoEstructuraLubricacion } from "./estructuraLubricacion.types";
import {
  ErrorEstructuraLubricacion,
  type EstructuraSistemasCambiosPayload,
  type NodoEstructuraBorrador,
} from "./estructuraLubricacion.draft.types";
import { validarBorradorEstructura } from "./estructuraLubricacion.validation";

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
        sistema_id: nodo.sistemaId,
        subsistema_id: nodo.subsistemaId,
        aceite_id: nodo.aceiteId,
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
      aceite_id?: number | null;
    } = { id: nodo.id };
    if (nodo.parentTempId !== null) {
      cambio.parent_temp_id = nodo.parentTempId;
    } else if (nodo.parentId !== originalNodo.parentId) {
      cambio.parent_id = nodo.parentId;
    }
    if (nodo.aceiteId !== (originalNodo.aceite?.id ?? null))
      cambio.aceite_id = nodo.aceiteId;
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
