import type {
  AuxiliaresEstructuraLubricacion,
  CatalogoActivo,
  NodoEstructuraLubricacion,
} from "./estructuraLubricacion.types";
import {
  type ActualizarNodoEstructuraInput,
  type ActualizarCatalogoNodoInput,
  type AgregarHijoEstructuraInput,
  type AgregarRaizEstructuraInput,
  type EliminarNodoEstructuraResultado,
  type MoverNodoEstructuraInput,
  type NodoEstructuraBorrador,
  type ResultadoMutacionEstructura,
  type CatalogoEstructura,
} from "./estructuraLubricacion.draft.types";
import { validarBorradorEstructura } from "./estructuraLubricacion.validation";

let secuencia = 0;
const siguienteId = (prefijo: "local" | "estructura"): string =>
  `${prefijo}_estructura_${++secuencia}`;
const clonarCatalogo = (
  catalogo: CatalogoEstructura | null,
): CatalogoEstructura | null => (catalogo ? { ...catalogo } : null);
const clonarNodo = (nodo: NodoEstructuraBorrador): NodoEstructuraBorrador => ({
  ...nodo,
  sistema: clonarCatalogo(nodo.sistema),
  subsistema: clonarCatalogo(nodo.subsistema),
  aceite: clonarCatalogo(nodo.aceite),
});
const activos = (
  nodos: readonly NodoEstructuraBorrador[],
): NodoEstructuraBorrador[] =>
  nodos.filter((nodo) => nodo.estadoLocal !== "pendiente_eliminacion");
const error = (
  nodos: readonly NodoEstructuraBorrador[],
  codigo: string,
  mensaje: string,
): ResultadoMutacionEstructura => ({
  ok: false,
  codigo,
  mensaje,
  nodos: clonarBorradorEstructura(nodos),
});
const perteneceAAuxiliar = (
  catalogo: CatalogoEstructura | null,
  auxiliares: readonly CatalogoActivo[],
): boolean =>
  catalogo === null ||
  catalogo.id === null ||
  auxiliares.some((auxiliar) => auxiliar.id === catalogo.id);

export function crearBorradorEstructura(
  nodos: readonly NodoEstructuraLubricacion[],
): NodoEstructuraBorrador[] {
  return nodos.map((nodo) => ({
    localId: siguienteId("local"),
    estadoLocal: "existente",
    id: nodo.id,
    tempId: null,
    parentId: nodo.parentId,
    parentTempId: null,
    sistemaId: nodo.sistema?.id ?? null,
    subsistemaId: nodo.subsistema?.id ?? null,
    aceiteId: nodo.aceite?.id ?? null,
    sistema: clonarCatalogo(nodo.sistema),
    subsistema: clonarCatalogo(nodo.subsistema),
    aceite: clonarCatalogo(nodo.aceite),
  }));
}

export function clonarBorradorEstructura(
  nodos: readonly NodoEstructuraBorrador[],
): NodoEstructuraBorrador[] {
  return nodos.map(clonarNodo);
}

const validarResultado = (
  nodos: NodoEstructuraBorrador[],
  localId: string,
): ResultadoMutacionEstructura => {
  const validacion = validarBorradorEstructura(nodos);
  return validacion.valido
    ? { ok: true, nodos, localId }
    : error(
        nodos,
        validacion.errores[0]?.codigo ?? "ESTRUCTURA_INVALIDA",
        validacion.errores[0]?.mensaje ?? "La estructura no es válida.",
      );
};

export function agregarRaizEstructura(
  nodos: readonly NodoEstructuraBorrador[],
  input: AgregarRaizEstructuraInput,
  auxiliares: AuxiliaresEstructuraLubricacion,
): ResultadoMutacionEstructura {
  if (
    !perteneceAAuxiliar(input.sistema, auxiliares.sistemas) ||
    !perteneceAAuxiliar(input.aceite, auxiliares.aceites)
  )
    return error(
      nodos,
      "ESTRUCTURA_CATALOGO_INACTIVO",
      "Solo puede asignar catálogos incluidos en los auxiliares activos.",
    );
  const localId = siguienteId("local");
  const copia = clonarBorradorEstructura(nodos);
  copia.push({
    localId,
    estadoLocal: "nuevo",
    id: null,
    tempId: siguienteId("estructura"),
    parentId: null,
    parentTempId: null,
    sistemaId: input.sistema.id,
    subsistemaId: null,
    aceiteId: input.aceite?.id ?? null,
    sistema: clonarCatalogo(input.sistema),
    subsistema: null,
    aceite: clonarCatalogo(input.aceite),
  });
  return validarResultado(copia, localId);
}

export function agregarHijoEstructura(
  nodos: readonly NodoEstructuraBorrador[],
  input: AgregarHijoEstructuraInput,
  auxiliares: AuxiliaresEstructuraLubricacion,
): ResultadoMutacionEstructura {
  const padre = activos(nodos).find(
    (nodo) => nodo.localId === input.parentLocalId,
  );
  if (!padre)
    return error(
      nodos,
      "ESTRUCTURA_PADRE_NO_EXISTE",
      "El padre seleccionado no existe o está eliminado.",
    );
  if (
    !perteneceAAuxiliar(input.subsistema, auxiliares.subsistemas) ||
    !perteneceAAuxiliar(input.aceite, auxiliares.aceites)
  )
    return error(
      nodos,
      "ESTRUCTURA_CATALOGO_INACTIVO",
      "Solo puede asignar catálogos incluidos en los auxiliares activos.",
    );
  const localId = siguienteId("local");
  const copia = clonarBorradorEstructura(nodos);
  copia.push({
    localId,
    estadoLocal: "nuevo",
    id: null,
    tempId: siguienteId("estructura"),
    parentId: padre.id,
    parentTempId: padre.tempId,
    sistemaId: null,
    subsistemaId: input.subsistema.id,
    aceiteId: input.aceite?.id ?? null,
    sistema: null,
    subsistema: clonarCatalogo(input.subsistema),
    aceite: clonarCatalogo(input.aceite),
  });
  return validarResultado(copia, localId);
}

export function actualizarAceiteNodo(
  nodos: readonly NodoEstructuraBorrador[],
  input: ActualizarNodoEstructuraInput,
  auxiliares: AuxiliaresEstructuraLubricacion,
): ResultadoMutacionEstructura {
  const copia = clonarBorradorEstructura(nodos);
  const nodo = copia.find(
    (item) =>
      item.localId === input.localId &&
      item.estadoLocal !== "pendiente_eliminacion",
  );
  if (!nodo)
    return error(
      nodos,
      "ESTRUCTURA_NODO_NO_ENCONTRADO",
      "El nodo a actualizar no existe.",
    );
  if (!perteneceAAuxiliar(input.aceite, auxiliares.aceites))
    return error(
      nodos,
      "ACEITE_NO_DISPONIBLE_PARA_ASIGNAR",
      "Solo puede asignar un aceite incluido en los auxiliares activos.",
    );
  nodo.aceiteId = input.aceite?.id ?? null;
  nodo.aceite = clonarCatalogo(input.aceite);
  return validarResultado(copia, nodo.localId);
}

export function actualizarCatalogoNodo(
  nodos: readonly NodoEstructuraBorrador[],
  input: ActualizarCatalogoNodoInput,
  auxiliares: AuxiliaresEstructuraLubricacion,
): ResultadoMutacionEstructura {
  const copia = clonarBorradorEstructura(nodos);
  const nodo = copia.find(
    (item) =>
      item.localId === input.localId &&
      item.estadoLocal !== "pendiente_eliminacion",
  );
  if (!nodo)
    return error(
      nodos,
      "ESTRUCTURA_NODO_NO_ENCONTRADO",
      "El nodo a actualizar no existe.",
    );
  const esRaiz = nodo.parentId === null && nodo.parentTempId === null;
  const auxiliaresCatalogo = esRaiz
    ? auxiliares.sistemas
    : auxiliares.subsistemas;
  if (!perteneceAAuxiliar(input.catalogo, auxiliaresCatalogo))
    return error(
      nodos,
      "ESTRUCTURA_CATALOGO_INACTIVO",
      "Solo puede asignar catálogos incluidos en los auxiliares activos.",
    );
  if (!perteneceAAuxiliar(input.aceite, auxiliares.aceites))
    return error(
      nodos,
      "ACEITE_NO_DISPONIBLE_PARA_ASIGNAR",
      "Solo puede asignar un aceite incluido en los auxiliares activos.",
    );
  if (esRaiz) {
    nodo.sistemaId = input.catalogo.id;
    nodo.sistema = clonarCatalogo(input.catalogo);
  } else {
    nodo.subsistemaId = input.catalogo.id;
    nodo.subsistema = clonarCatalogo(input.catalogo);
  }
  nodo.aceiteId = input.aceite?.id ?? null;
  nodo.aceite = clonarCatalogo(input.aceite);
  return validarResultado(copia, nodo.localId);
}

export function obtenerSubarbolActivo(
  nodos: readonly NodoEstructuraBorrador[],
  localId: string,
): NodoEstructuraBorrador[] {
  const porId = new Map(activos(nodos).map((nodo) => [nodo.localId, nodo]));
  const raiz = porId.get(localId);
  if (!raiz) return [];
  const resultado: NodoEstructuraBorrador[] = [];
  const visitar = (nodo: NodoEstructuraBorrador): void => {
    resultado.push(clonarNodo(nodo));
    [...porId.values()]
      .filter(
        (hijo) =>
          (nodo.id !== null && hijo.parentId === nodo.id) ||
          (nodo.tempId !== null && hijo.parentTempId === nodo.tempId),
      )
      .forEach(visitar);
  };
  visitar(raiz);
  return resultado;
}

export function moverNodoEstructura(
  nodos: readonly NodoEstructuraBorrador[],
  input: MoverNodoEstructuraInput,
): ResultadoMutacionEstructura {
  const nodo = activos(nodos).find((item) => item.localId === input.localId);
  if (!nodo)
    return error(
      nodos,
      "ESTRUCTURA_NODO_NO_ENCONTRADO",
      "El nodo a mover no existe.",
    );
  if (nodo.sistemaId !== null)
    return error(
      nodos,
      "ESTRUCTURA_RAIZ_NO_MOVIBLE",
      "Una raíz no puede moverse bajo otro nodo.",
    );
  if (input.nuevoPadreLocalId === null)
    return error(
      nodos,
      "ESTRUCTURA_HIJO_REQUIERE_PADRE",
      "Un subsistema no puede convertirse en raíz.",
    );
  const destino = activos(nodos).find(
    (item) => item.localId === input.nuevoPadreLocalId,
  );
  if (!destino)
    return error(
      nodos,
      "ESTRUCTURA_PADRE_NO_EXISTE",
      "El nuevo padre no existe o está eliminado.",
    );
  if (
    destino.localId === nodo.localId ||
    obtenerSubarbolActivo(nodos, nodo.localId).some(
      (item) => item.localId === destino.localId,
    )
  )
    return error(
      nodos,
      "ESTRUCTURA_CICLO",
      "No puede mover un nodo dentro de su propio subárbol.",
    );
  const copia = clonarBorradorEstructura(nodos);
  const nodoCopia = copia.find((item) => item.localId === nodo.localId);
  if (!nodoCopia)
    return error(
      nodos,
      "ESTRUCTURA_NODO_NO_ENCONTRADO",
      "El nodo a mover no existe.",
    );
  nodoCopia.parentId = destino.id;
  nodoCopia.parentTempId = destino.tempId;
  return validarResultado(copia, nodo.localId);
}

export function marcarNodoParaEliminar(
  nodos: readonly NodoEstructuraBorrador[],
  localId: string,
): EliminarNodoEstructuraResultado {
  const subarbol = obtenerSubarbolActivo(nodos, localId);
  if (!subarbol.length)
    return { nodos: clonarBorradorEstructura(nodos), eliminados: [] };
  const eliminados = new Set(subarbol.map((nodo) => nodo.localId));
  const resultado = clonarBorradorEstructura(nodos).map((nodo) =>
    eliminados.has(nodo.localId)
      ? { ...nodo, estadoLocal: "pendiente_eliminacion" as const }
      : nodo,
  );
  return { nodos: resultado, eliminados: subarbol };
}

export function deshacerEliminacionNodo(
  nodos: readonly NodoEstructuraBorrador[],
  localId: string,
): ResultadoMutacionEstructura {
  const objetivo = nodos.find((nodo) => nodo.localId === localId);
  if (!objetivo || objetivo.estadoLocal !== "pendiente_eliminacion")
    return error(
      nodos,
      "ESTRUCTURA_ELIMINACION_NO_ENCONTRADA",
      "No hay una eliminación pendiente para deshacer.",
    );
  const copia = clonarBorradorEstructura(nodos);
  const obtenerPadre = (
    nodo: NodoEstructuraBorrador,
  ): NodoEstructuraBorrador | null => {
    if (nodo.parentId !== null)
      return copia.find((item) => item.id === nodo.parentId) ?? null;
    if (nodo.parentTempId !== null)
      return copia.find((item) => item.tempId === nodo.parentTempId) ?? null;
    return null;
  };
  let raizPendiente = objetivo;
  let padre = obtenerPadre(raizPendiente);
  while (padre?.estadoLocal === "pendiente_eliminacion") {
    raizPendiente = padre;
    padre = obtenerPadre(raizPendiente);
  }
  const restaurar = (nodo: NodoEstructuraBorrador): void => {
    nodo.estadoLocal = nodo.id === null ? "nuevo" : "existente";
    copia
      .filter(
        (hijo) =>
          ((nodo.id !== null && hijo.parentId === nodo.id) ||
            (nodo.tempId !== null && hijo.parentTempId === nodo.tempId)) &&
          hijo.estadoLocal === "pendiente_eliminacion",
      )
      .forEach(restaurar);
  };
  const copiaObjetivo = copia.find(
    (nodo) => nodo.localId === raizPendiente.localId,
  );
  if (!copiaObjetivo)
    return error(
      nodos,
      "ESTRUCTURA_ELIMINACION_NO_ENCONTRADA",
      "No hay una eliminación pendiente para deshacer.",
    );
  restaurar(copiaObjetivo);
  return validarResultado(copia, localId);
}
