import { supabaseEquipos } from "@/lib/supabase";
import {
  mapCatalogoSubsistemaGuardarResponse,
  mapCatalogoSubsistemasListarResponse,
} from "./subsistemasCatalogo.mappers";
import {
  CatalogoSubsistemasError,
  normalizarCatalogoSubsistemasError,
} from "./subsistemasCatalogo.errors";
import type {
  CatalogoSubsistemaGuardarInput,
  CatalogoSubsistemaGuardarResultado,
  CatalogoSubsistemaItem,
  CatalogoSubsistemasResumen,
} from "./subsistemasCatalogo.types";

const schema = () => supabaseEquipos.schema("engrase");

export const subsistemasCatalogoService = {
  async listar(): Promise<{
    items: CatalogoSubsistemaItem[];
    resumen: CatalogoSubsistemasResumen;
  }> {
    const { data, error } = await schema().rpc(
      "rpc_catalogo_subsistemas_listar",
    );
    if (error) throw normalizarCatalogoSubsistemasError(error, "TRANSPORTE");
    try {
      return mapCatalogoSubsistemasListarResponse(data);
    } catch (cause) {
      throw normalizarCatalogoSubsistemasError(cause, "RESPUESTA_INVALIDA");
    }
  },

  async guardar(
    input: CatalogoSubsistemaGuardarInput,
  ): Promise<CatalogoSubsistemaGuardarResultado> {
    const pData = {
      id: input.id,
      nombre: input.nombre.trim(),
      activo: input.activo,
    };
    const { data, error } = await schema().rpc(
      "rpc_catalogo_subsistema_guardar",
      {
        p_data: pData,
      },
    );
    if (error) throw normalizarCatalogoSubsistemasError(error, "TRANSPORTE");
    if (
      typeof data === "object" &&
      data !== null &&
      "ok" in data &&
      data.ok === false
    )
      throw normalizarCatalogoSubsistemasError(data);
    try {
      return mapCatalogoSubsistemaGuardarResponse(data);
    } catch (cause) {
      if (cause instanceof CatalogoSubsistemasError) throw cause;
      throw normalizarCatalogoSubsistemasError(cause, "RESPUESTA_INVALIDA");
    }
  },
};
