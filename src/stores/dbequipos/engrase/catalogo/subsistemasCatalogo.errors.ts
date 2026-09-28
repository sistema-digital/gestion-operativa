export type CatalogoSubsistemasErrorCode =
  | "AUTENTICACION_REQUERIDA"
  | "PAYLOAD_INVALIDO"
  | "REGISTRO_NO_ENCONTRADO"
  | "SUBSISTEMA_NOMBRE_REQUERIDO"
  | "SUBSISTEMA_NOMBRE_DUPLICADO"
  | "SUBSISTEMA_NO_ENCONTRADO"
  | "RESPUESTA_INVALIDA"
  | "TRANSPORTE"
  | "DESCONOCIDO";

const knownCodes: readonly CatalogoSubsistemasErrorCode[] = [
  "AUTENTICACION_REQUERIDA",
  "PAYLOAD_INVALIDO",
  "REGISTRO_NO_ENCONTRADO",
  "SUBSISTEMA_NOMBRE_REQUERIDO",
  "SUBSISTEMA_NOMBRE_DUPLICADO",
  "SUBSISTEMA_NO_ENCONTRADO",
];

const messages: Record<CatalogoSubsistemasErrorCode, string> = {
  AUTENTICACION_REQUERIDA:
    "Tu sesión ya no es válida. Inicia sesión nuevamente.",
  PAYLOAD_INVALIDO: "No se pudieron validar los datos enviados.",
  REGISTRO_NO_ENCONTRADO: "El registro ya no existe o fue modificado.",
  SUBSISTEMA_NOMBRE_REQUERIDO: "Ingresa un nombre para mostrar.",
  SUBSISTEMA_NOMBRE_DUPLICADO: "Ya existe un subsistema con ese nombre.",
  SUBSISTEMA_NO_ENCONTRADO:
    "El subsistema ya no está disponible. Actualiza el listado.",
  RESPUESTA_INVALIDA: "La respuesta del catálogo no tiene el formato esperado.",
  TRANSPORTE: "No fue posible comunicarse con el catálogo.",
  DESCONOCIDO: "No se pudo guardar el subsistema. Intenta nuevamente.",
};

export class CatalogoSubsistemasError extends Error {
  constructor(
    public readonly codigo: CatalogoSubsistemasErrorCode,
    message = messages[codigo],
  ) {
    super(message);
    this.name = "CatalogoSubsistemasError";
  }
}

function stringifyError(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    return [
      record.code,
      record.codigo,
      record.message,
      record.details,
      record.hint,
    ]
      .filter((value): value is string => typeof value === "string")
      .join(" ");
  }
  return "";
}

export function normalizarCatalogoSubsistemasError(
  error: unknown,
  fallback: CatalogoSubsistemasErrorCode = "DESCONOCIDO",
): CatalogoSubsistemasError {
  if (error instanceof CatalogoSubsistemasError) return error;
  const content = stringifyError(error);
  return new CatalogoSubsistemasError(
    knownCodes.find((code) => content.includes(code)) ?? fallback,
  );
}

export function mensajeCatalogoSubsistemasError(
  error: CatalogoSubsistemasError | null,
): string | null {
  return error?.message ?? null;
}
