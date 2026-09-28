import {
  ErrorEstructuraLubricacion,
  type NodoEstructuraArbol,
  type NodoEstructuraBorrador,
} from "./estructuraLubricacion.draft.types";
import { validarBorradorEstructura } from "./estructuraLubricacion.validation";

const nombreNodo = (nodo: NodoEstructuraBorrador): string =>
  nodo.sistema?.nombre ?? nodo.subsistema?.nombre ?? "Nodo sin nombre";

export function construirArbolEstructura(
  nodos: readonly NodoEstructuraBorrador[],
): NodoEstructuraArbol[] {
  const validacion = validarBorradorEstructura(nodos);
  if (!validacion.valido)
    throw new ErrorEstructuraLubricacion(
      validacion.errores[0]?.codigo ?? "ESTRUCTURA_INVALIDA",
      validacion.errores[0]?.mensaje ?? "La estructura no es válida.",
    );
  const activos = nodos.filter(
    (nodo) => nodo.estadoLocal !== "pendiente_eliminacion",
  );
  const construir = (
    nodo: NodoEstructuraBorrador,
    profundidad: number,
    rutaAnterior: string,
  ): NodoEstructuraArbol => {
    const nombre = nombreNodo(nodo);
    const ruta = rutaAnterior ? `${rutaAnterior} > ${nombre}` : nombre;
    const hijos = activos
      .filter(
        (hijo) =>
          (nodo.id !== null && hijo.parentId === nodo.id) ||
          (nodo.tempId !== null && hijo.parentTempId === nodo.tempId),
      )
      .map((hijo) => construir(hijo, profundidad + 1, ruta));
    return {
      ...nodo,
      sistema: nodo.sistema ? { ...nodo.sistema } : null,
      subsistema: nodo.subsistema ? { ...nodo.subsistema } : null,
      aceite: nodo.aceite ? { ...nodo.aceite } : null,
      hijos,
      profundidad,
      ruta,
    };
  };
  return activos
    .filter((nodo) => nodo.parentId === null && nodo.parentTempId === null)
    .map((nodo) => construir(nodo, 0, ""));
}
