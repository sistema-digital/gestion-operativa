import {
  normalizarCodigoCreacion,
  normalizarTextoCreacion,
} from "./equipoEngraseCreacion.draft";
import { validarCreacionEquipoCompleta } from "./equipoEngraseCreacion.validation";
import type {
  CatalogoDraftReference,
  ConstruirPayloadCreacionResultado,
  CrearEquipoDraft,
  EntidadCreacionPayload,
  FiltroCreacionPayload,
  FiltroCreacionReference,
  TipoEquipoCreacionReference,
} from "./equipoEngraseCreacion.types";
import { construirCambiosEstructura } from "../shared/estructuraLubricacion.payload";

export function crearEntidadCreacionPayload(
  referencia: CatalogoDraftReference | TipoEquipoCreacionReference,
): EntidadCreacionPayload {
  return referencia.estado === "existente"
    ? {
        estado: "existente",
        id: referencia.id,
        nombre: normalizarTextoCreacion(referencia.nombre),
      }
    : {
        estado: "nuevo",
        id: null,
        temp_id: referencia.tempId,
        nombre: normalizarTextoCreacion(referencia.nombre),
      };
}

export function crearFiltroCreacionPayload(
  referencia: FiltroCreacionReference,
): FiltroCreacionPayload {
  return referencia.estado === "existente"
    ? {
        estado: "existente",
        id: referencia.id,
        codigo: normalizarCodigoCreacion(referencia.codigo),
        esta_en_lista_compras: referencia.estaEnListaCompras,
      }
    : {
        estado: "nuevo",
        id: null,
        temp_id: referencia.tempId,
        codigo: normalizarCodigoCreacion(referencia.codigo),
        esta_en_lista_compras: referencia.estaEnListaCompras,
      };
}

export function construirPayloadCrearEquipo(
  draft: CrearEquipoDraft,
): ConstruirPayloadCreacionResultado {
  const validacion = validarCreacionEquipoCompleta(draft);
  if (!validacion.valido) return { ok: false, errores: validacion.errores };

  const tipoEquipo = draft.datos.tipoEquipo;
  if (tipoEquipo === null) {
    return {
      ok: false,
      errores: [
        {
          codigo: "TIPO_EQUIPO_REQUERIDO",
          mensaje: "Selecciona o crea un tipo de equipo.",
          paso: 1,
          seccion: "datos",
          fieldId: "equipo-creacion-tipo",
        },
      ],
    };
  }

  return {
    ok: true,
    argumento: {
      datos: {
        datos_equipo: {
          codigo: normalizarCodigoCreacion(draft.datos.codigo),
          subtipo: normalizarTextoCreacion(draft.datos.subtipo),
          estado: draft.datos.estado,
          tipo_equipo: crearEntidadCreacionPayload(tipoEquipo),
        },
        etapas: {
          agregadas: draft.datos.etapas.map((etapa) => ({
            estado_operacion: "nuevo",
            etapa_id: etapa.id,
          })),
        },
        filtros: {
          nuevos: draft.filtros.map((filtro) => ({
            estado_operacion: "nuevo",
            temp_id: filtro.draftId,
            tipo_filtro: crearEntidadCreacionPayload(filtro.tipoFiltro),
            filtro: crearFiltroCreacionPayload(filtro.filtro),
            cantidad: filtro.cantidad,
          })),
        },
        estructura_sistemas: {
          nuevos: construirCambiosEstructura([], draft.estructuraSistemas)
            .nuevos,
        },
      },
    },
  };
}
