import { z } from "zod";
import type {
  ErrorValidacionEstructura,
  NodoEstructuraBorrador,
  ResultadoValidacionEstructura,
} from "./estructuraLubricacion.draft.types";

const idPositivoSchema = z.number().int().positive();
const textoSchema = z.string().trim().min(1);
const catalogoSchema = z
  .object({ id: idPositivoSchema, nombre: textoSchema, activo: z.boolean() })
  .strict();

const activo = (nodo: NodoEstructuraBorrador): boolean =>
  nodo.estadoLocal !== "pendiente_eliminacion";

const agregar = (
  errores: ErrorValidacionEstructura[],
  codigo: string,
  mensaje: string,
  localId?: string,
): void => {
  errores.push({ codigo, mensaje, ...(localId ? { localId } : {}) });
};

const validarCatalogo = (
  errores: ErrorValidacionEstructura[],
  nodo: NodoEstructuraBorrador,
  etiqueta: "sistema" | "subsistema" | "aceite",
): void => {
  const id = nodo[`${etiqueta}Id`];
  const catalogo = nodo[etiqueta];
  if (id === null && catalogo === null) return;
  const resultado = catalogoSchema.safeParse(catalogo);
  if (!resultado.success || id !== resultado.data.id) {
    agregar(
      errores,
      "ESTRUCTURA_CATALOGO_INCOHERENTE",
      `La referencia de ${etiqueta} es inválida.`,
      nodo.localId,
    );
    return;
  }
};

export function validarBorradorEstructura(
  nodos: readonly NodoEstructuraBorrador[],
): ResultadoValidacionEstructura {
  const errores: ErrorValidacionEstructura[] = [];
  const activos = nodos.filter(activo);
  const localIds = new Set<string>();
  const ids = new Set<number>();
  const tempIds = new Set<string>();
  const porId = new Map<number, NodoEstructuraBorrador>();
  const porTempId = new Map<string, NodoEstructuraBorrador>();

  for (const nodo of nodos) {
    if (localIds.has(nodo.localId))
      agregar(
        errores,
        "ESTRUCTURA_LOCAL_ID_DUPLICADO",
        "Hay claves locales duplicadas.",
        nodo.localId,
      );
    localIds.add(nodo.localId);
    const esNuevo = nodo.estadoLocal === "nuevo";
    if (esNuevo) {
      if (nodo.id !== null || !nodo.tempId?.trim())
        agregar(
          errores,
          "ESTRUCTURA_IDENTIDAD_NUEVA_INVALIDA",
          "Un nodo nuevo requiere tempId y no admite ID persistido.",
          nodo.localId,
        );
      if (nodo.tempId && tempIds.has(nodo.tempId))
        agregar(
          errores,
          "ESTRUCTURA_TEMP_ID_DUPLICADO",
          "Hay tempId duplicados.",
          nodo.localId,
        );
      if (nodo.tempId) {
        tempIds.add(nodo.tempId);
        if (activo(nodo)) porTempId.set(nodo.tempId, nodo);
      }
    } else {
      if (nodo.tempId !== null || !idPositivoSchema.safeParse(nodo.id).success)
        agregar(
          errores,
          "ESTRUCTURA_IDENTIDAD_EXISTENTE_INVALIDA",
          "Un nodo existente requiere un ID positivo y no admite tempId.",
          nodo.localId,
        );
      if (nodo.id !== null && ids.has(nodo.id))
        agregar(
          errores,
          "ESTRUCTURA_ID_DUPLICADO",
          "Hay IDs persistidos duplicados.",
          nodo.localId,
        );
      if (nodo.id !== null) {
        ids.add(nodo.id);
        if (activo(nodo)) porId.set(nodo.id, nodo);
      }
    }
    if (nodo.parentId !== null && nodo.parentTempId !== null)
      agregar(
        errores,
        "ESTRUCTURA_PADRE_AMBIGUO",
        "Un nodo solo puede tener una referencia de padre.",
        nodo.localId,
      );
    validarCatalogo(errores, nodo, "sistema");
    validarCatalogo(errores, nodo, "subsistema");
    validarCatalogo(errores, nodo, "aceite");
  }

  const padreDe = (
    nodo: NodoEstructuraBorrador,
  ): NodoEstructuraBorrador | null => {
    if (nodo.parentId !== null) return porId.get(nodo.parentId) ?? null;
    if (nodo.parentTempId !== null)
      return porTempId.get(nodo.parentTempId) ?? null;
    return null;
  };

  for (const nodo of activos) {
    const esRaiz = nodo.parentId === null && nodo.parentTempId === null;
    if (esRaiz) {
      if (
        nodo.sistemaId === null ||
        nodo.sistema === null ||
        nodo.subsistemaId !== null ||
        nodo.subsistema !== null
      )
        agregar(
          errores,
          "ESTRUCTURA_RAIZ_INVALIDA",
          "Un nodo raíz requiere sistema y no admite subsistema.",
          nodo.localId,
        );
      continue;
    }
    if (
      nodo.sistemaId !== null ||
      nodo.sistema !== null ||
      nodo.subsistemaId === null ||
      nodo.subsistema === null
    )
      agregar(
        errores,
        "ESTRUCTURA_HIJO_INVALIDO",
        "Un nodo hijo requiere subsistema y no admite sistema.",
        nodo.localId,
      );
    const padre = padreDe(nodo);
    if (!padre)
      agregar(
        errores,
        "ESTRUCTURA_PADRE_NO_EXISTE",
        "El padre del nodo no existe o está eliminado.",
        nodo.localId,
      );
    else if (padre.localId === nodo.localId)
      agregar(
        errores,
        "ESTRUCTURA_PADRE_PROPIO",
        "Un nodo no puede ser su propio padre.",
        nodo.localId,
      );
  }

  const visitados = new Set<string>();
  const enRecorrido = new Set<string>();
  const recorrer = (nodo: NodoEstructuraBorrador): void => {
    if (enRecorrido.has(nodo.localId)) {
      agregar(
        errores,
        "ESTRUCTURA_CICLO",
        "La estructura contiene un ciclo.",
        nodo.localId,
      );
      return;
    }
    if (visitados.has(nodo.localId)) return;
    enRecorrido.add(nodo.localId);
    const padre = padreDe(nodo);
    if (padre) recorrer(padre);
    enRecorrido.delete(nodo.localId);
    visitados.add(nodo.localId);
  };
  activos.forEach(recorrer);

  const raices = activos.filter(
    (nodo) => nodo.parentId === null && nodo.parentTempId === null,
  );
  const alcanzables = new Set<string>();
  const marcarHijos = (padre: NodoEstructuraBorrador): void => {
    if (alcanzables.has(padre.localId)) return;
    alcanzables.add(padre.localId);
    activos
      .filter((nodo) => padreDe(nodo)?.localId === padre.localId)
      .forEach(marcarHijos);
  };
  raices.forEach(marcarHijos);
  activos
    .filter((nodo) => !alcanzables.has(nodo.localId))
    .forEach((nodo) =>
      agregar(
        errores,
        "ESTRUCTURA_NODO_HUERFANO",
        "El nodo no es alcanzable desde una raíz activa.",
        nodo.localId,
      ),
    );

  return { valido: errores.length === 0, errores };
}
