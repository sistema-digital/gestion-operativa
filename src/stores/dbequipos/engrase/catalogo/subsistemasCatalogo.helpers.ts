import type {
  CatalogoSortDirection,
  CatalogoSubsistemaItem,
  CatalogoSubsistemasQuery,
  CatalogoSubsistemasResumen,
  CatalogoSubsistemaSortKey,
} from "./subsistemasCatalogo.types";

export function normalizarBusquedaSubsistema(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase("es");
}

export function filtrarCatalogoSubsistemas(
  items: readonly CatalogoSubsistemaItem[],
  filters: CatalogoSubsistemasQuery,
): CatalogoSubsistemaItem[] {
  const search = normalizarBusquedaSubsistema(filters.busqueda);
  return items.filter(
    (item) =>
      (!search || normalizarBusquedaSubsistema(item.nombre).includes(search)) &&
      (filters.estado === "todos" ||
        item.activo === (filters.estado === "activos")) &&
      (filters.uso === "todos" ||
        (filters.uso === "en-uso"
          ? item.impacto.totalEquipos > 0
          : item.impacto.totalEquipos === 0)),
  );
}

export function ordenarCatalogoSubsistemas(
  items: readonly CatalogoSubsistemaItem[],
  key: CatalogoSubsistemaSortKey,
  direction: CatalogoSortDirection,
): CatalogoSubsistemaItem[] {
  const factor = direction === "asc" ? 1 : -1;
  return [...items].sort((left, right) => {
    const result =
      key === "estado"
        ? Number(left.activo) - Number(right.activo)
        : key === "equipos"
          ? left.impacto.totalEquipos - right.impacto.totalEquipos
          : key === "asignaciones"
            ? left.impacto.totalAsignaciones - right.impacto.totalAsignaciones
            : left.nombre.localeCompare(right.nombre, "es", {
                sensitivity: "base",
              });
    return result * factor;
  });
}

export function resumirCatalogoSubsistemas(
  items: readonly CatalogoSubsistemaItem[],
): CatalogoSubsistemasResumen {
  const activos = items.filter((item) => item.activo).length;
  return { total: items.length, activos, desactivados: items.length - activos };
}
