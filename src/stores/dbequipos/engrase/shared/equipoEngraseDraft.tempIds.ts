export type TempIdTipo =
  | "equipo_filtro"
  | "tipo_filtro"
  | "filtro"
  | "tipo_equipo"
  | "catalogo_estructura";

let secuencia = 0;

export const crearTempId = (tipo: TempIdTipo): string => {
  secuencia += 1;
  return `tmp_${tipo}_${secuencia}`;
};
