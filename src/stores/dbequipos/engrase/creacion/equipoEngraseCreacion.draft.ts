import {
  crearTempId,
  type TempIdTipo,
} from "../shared/equipoEngraseDraft.tempIds";
import type {
  CatalogoDraftReference,
  CrearEquipoDraft,
  CrearEquipoFiltroDraft,
  FiltroCreacionReference,
  TipoEquipoCreacionReference,
  ValidacionCodigoEquipoCreacion,
} from "./equipoEngraseCreacion.types";
import { clonarBorradorEstructura } from "../shared/estructuraLubricacion.draft";

export {
  crearTempId,
  type TempIdTipo,
} from "../shared/equipoEngraseDraft.tempIds";

export function normalizarTextoCreacion(valor: string): string {
  return valor.trim().replace(/\s+/gu, " ");
}

export function normalizarCodigoCreacion(valor: string): string {
  return normalizarTextoCreacion(valor).toLocaleUpperCase("es");
}

export function crearClaveNombreCreacion(valor: string): string {
  return normalizarTextoCreacion(valor)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es");
}

export function crearEquipoDraftInicial(): CrearEquipoDraft {
  return {
    datos: {
      codigo: "",
      tipoEquipo: null,
      subtipo: "",
      etapas: [],
      estado: "activo",
    },
    filtros: [],
    estructuraSistemas: [],
    validacionCodigo: { estado: "idle" },
    equipoCreado: null,
  };
}

function clonarReferenciaCatalogo(
  referencia: CatalogoDraftReference,
): CatalogoDraftReference {
  return { ...referencia };
}

function clonarTipoEquipo(
  tipoEquipo: TipoEquipoCreacionReference | null,
): TipoEquipoCreacionReference | null {
  return tipoEquipo === null
    ? null
    : { ...tipoEquipo, subtiposSugeridos: [...tipoEquipo.subtiposSugeridos] };
}

function clonarFiltro(
  filtro: FiltroCreacionReference,
): FiltroCreacionReference {
  return { ...filtro };
}

function clonarFiltros(
  filtros: CrearEquipoFiltroDraft[],
): CrearEquipoFiltroDraft[] {
  return filtros.map((filtro) => ({
    ...filtro,
    tipoFiltro: clonarReferenciaCatalogo(filtro.tipoFiltro),
    filtro: clonarFiltro(filtro.filtro),
  }));
}

function clonarValidacionCodigo(
  validacion: ValidacionCodigoEquipoCreacion,
): ValidacionCodigoEquipoCreacion {
  return { ...validacion };
}

export function clonarCrearEquipoDraft(
  draft: CrearEquipoDraft,
): CrearEquipoDraft {
  return {
    datos: {
      ...draft.datos,
      tipoEquipo: clonarTipoEquipo(draft.datos.tipoEquipo),
      etapas: draft.datos.etapas.map((etapa) => ({ ...etapa })),
    },
    filtros: clonarFiltros(draft.filtros),
    estructuraSistemas: clonarBorradorEstructura(draft.estructuraSistemas),
    validacionCodigo: clonarValidacionCodigo(draft.validacionCodigo),
    equipoCreado:
      draft.equipoCreado === null
        ? null
        : {
            ...draft.equipoCreado,
            etapas: draft.equipoCreado.etapas.map((etapa) => ({ ...etapa })),
          },
  };
}
