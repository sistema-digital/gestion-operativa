import { supabaseEquipos } from "@/lib/supabase";
import { z } from "zod";
import { mapCatalogo, mapEquipo } from "./filtrosEngrase.mappers";
import type {
  EquipoEngraseListItem,
  EquipoAceiteDetalle,
  EquipoDetalleFull,
  EquipoFiltroDetalle,
  EtapaEngrase,
  FiltroCodigoSugerencia,
  FiltroEquivalenciaRow,
} from "./filtrosEngrase.types";
const schema = () => supabaseEquipos.schema("engrase");
const raise = (error: { message?: string } | null, fallback: string) => {
  if (error) throw new Error(error.message || fallback);
};
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const aceiteEquipoRutaSchema = z.array(
  z.object({
    sistema: z.string().trim().min(1),
    subsistema: z.string().trim().min(1).nullable(),
    ruta: z.string().trim().min(1),
    aceite: z.string().trim().min(1),
  }),
);
const equipoFiltrosSchema = z.array(
  z.object({
    id: z.number().int(),
    equipo_id: z.number().int(),
    tipo_filtro_id: z.number().int(),
    filtro_id: z.number().int(),
    cantidad: z.number().finite(),
    tipo_filtro: z.object({
      id: z.number().int(),
      nombre: z.string().trim().min(1),
    }),
    filtro: z.object({
      id: z.number().int(),
      codigo: z.string().trim().min(1),
      esta_en_lista_compras: z.boolean(),
    }),
  }),
);
const equipoDetalleFullSchema = z
  .object({
    numero_equipo: z.string().trim().min(1),
    tipo: z.string().trim().min(1).nullable(),
    marca: z.string().trim().nullable(),
    modelo: z.string().trim().nullable(),
    tenencia: z.string().trim().min(1).nullable(),
    combustible: z.string().trim().min(1).nullable(),
    fecha_llegada: z.string().trim().min(1).nullable(),
    potencia_cv: z.number().finite().nullable(),
    consumo_base_gal_h: z.number().finite().nullable(),
    etapas: z.array(z.string().trim().min(1)),
  })
  .nullable();
export const filtrosEngraseService = {
  async obtenerEquipos(): Promise<EquipoEngraseListItem[]> {
    const { data, error } = await schema().rpc("rpc_obtener_equipos_lista");
    raise(error, "No se pudieron obtener los equipos");
    const rows: unknown[] = Array.isArray(data) ? data : [];
    return rows.filter(isRecord).map((row) => ({
      ...mapEquipo(row),
      etapas: Array.isArray(row.etapas)
        ? row.etapas
            .filter(isRecord)
            .map((etapa) => mapCatalogo<EtapaEngrase>(etapa))
        : [],
    }));
  },
  async obtenerEtapas() {
    const { data, error } = await schema()
      .from("etapa")
      .select("id,nombre")
      .order("nombre");
    raise(error, "No se pudieron obtener las etapas");
    return (data ?? []).map((x) => mapCatalogo<EtapaEngrase>(x));
  },
  async obtenerFiltrosDeEquipo(
    equipoId: number,
  ): Promise<EquipoFiltroDetalle[]> {
    const { data, error } = await schema().rpc("rpc_obtener_filtros_equipo", {
      p_equipo_id: equipoId,
    });
    raise(error, "No se pudieron obtener los filtros");
    const result = equipoFiltrosSchema.safeParse(data);
    if (!result.success)
      throw new Error(
        "La respuesta de filtros del equipo no tiene el formato esperado",
      );
    return result.data.map(({ tipo_filtro, filtro, ...item }) => ({
      ...item,
      tipoFiltro: tipo_filtro,
      filtro,
    }));
  },
  async obtenerAceitesDeEquipo(
    equipoId: number,
  ): Promise<EquipoAceiteDetalle[]> {
    const { data, error } = await schema().rpc("rpc_obtener_aceites_equipo", {
      p_equipo_id: equipoId,
    });
    raise(error, "No se pudieron obtener los aceites del equipo");
    const result = aceiteEquipoRutaSchema.safeParse(data);
    if (!result.success)
      throw new Error(
        "La respuesta de aceites del equipo no tiene el formato esperado",
      );
    return result.data;
  },
  async obtenerDatosGeneralesEquipo(
    numeroEquipo: string,
  ): Promise<EquipoDetalleFull | null> {
    const { data, error } = await supabaseEquipos.rpc(
      "rpc_equipo_detalle_full",
      { p_numero_equipo: numeroEquipo },
    );
    raise(error, "No se pudieron obtener los datos generales del equipo");
    const result = equipoDetalleFullSchema.safeParse(data);
    if (!result.success)
      throw new Error(
        "La respuesta de datos generales del equipo no tiene el formato esperado",
      );
    return result.data;
  },
  async cambiarEstadoEquipo(
    codigo: string,
    estado: "activo" | "descartado",
  ): Promise<"activo" | "descartado"> {
    const { data, error } = await schema().rpc("rpc_cambiar_estado_equipo", {
      p_codigo_equipo: codigo,
      p_estado: estado,
    });
    raise(error, "No se pudo cambiar el estado del equipo");
    if (!isRecord(data) || data.ok !== true)
      throw new Error("La RPC no confirmó el cambio de estado del equipo");
    if (data.estado !== "activo" && data.estado !== "descartado")
      throw new Error("La RPC devolvió un estado de equipo inválido");
    return data.estado;
  },
  async obtenerEquivalenciasActivas(
    ids: number[],
  ): Promise<FiltroEquivalenciaRow[]> {
    if (!ids.length) return [];
    const { data, error } = await schema()
      .from("filtro_equivalencia")
      .select(
        "id,filtro_original_id,filtro_equivalente_id,activo,equivalente:filtro_equivalente_id(codigo)",
      )
      .in("filtro_original_id", ids)
      .eq("activo", true);
    raise(error, "No se pudieron obtener las equivalencias");
    return (data ?? []).map((x: any) => ({
      ...x,
      codigo_equivalente: x.equivalente?.codigo,
    }));
  },
  async buscarSugerenciasCodigo(
    texto: string,
    limite = 10,
  ): Promise<FiltroCodigoSugerencia[]> {
    if (texto.trim().length < 2) return [];
    const { data, error } = await schema()
      .from("filtro")
      .select("id,codigo")
      .ilike("codigo", `%${texto.trim()}%`)
      .limit(limite);
    raise(error, "No se pudieron buscar códigos");
    const originals = new Set<number>();
    const { data: assigned } = await schema()
      .from("equipo_filtro")
      .select("filtro_id")
      .in(
        "filtro_id",
        (data ?? []).map((x) => x.id),
      );
    (assigned ?? []).forEach((x) => originals.add(x.filtro_id));
    const { data: eqs } = await schema()
      .from("filtro_equivalencia")
      .select("filtro_equivalente_id")
      .eq("activo", true)
      .in(
        "filtro_equivalente_id",
        (data ?? []).map((x) => x.id),
      );
    const equivalents = new Set(
      (eqs ?? []).map((x) => x.filtro_equivalente_id),
    );
    return (data ?? []).map((x) => ({
      codigo: x.codigo,
      esOriginal: originals.has(x.id),
      esEquivalente: equivalents.has(x.id),
    }));
  },
  async resolverEquiposPorCodigoExacto(codigo: string): Promise<number[]> {
    const { data: filtros, error } = await schema()
      .from("filtro")
      .select("id,codigo")
      .eq("codigo", codigo);
    raise(error, "No se pudo resolver el código");
    const exact = (filtros ?? []).filter((f) => f.codigo === codigo);
    if (!exact.length) return [];
    const ids = exact.map((x) => x.id);
    const { data: eqs, error: ee } = await schema()
      .from("filtro_equivalencia")
      .select("filtro_original_id")
      .eq("activo", true)
      .in("filtro_equivalente_id", ids);
    raise(ee, "No se pudieron resolver equivalencias");
    const originals = [...ids, ...(eqs ?? []).map((x) => x.filtro_original_id)];
    const { data, error: ae } = await schema()
      .from("equipo_filtro")
      .select("equipo_id")
      .in("filtro_id", originals);
    raise(ae, "No se pudieron resolver equipos");
    return [...new Set((data ?? []).map((x) => x.equipo_id))];
  },
  async crearUrlFirmadaImagen(path: string) {
    const { data, error } = await supabaseEquipos.storage
      .from("imagenes-equipos")
      .createSignedUrl(path, 600);
    raise(error, "No se pudo preparar la imagen");
    return data?.signedUrl ?? null;
  },
};
