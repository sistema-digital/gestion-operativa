export interface OrdenMantenimiento {
  "ID_Orden mantenimiento": string;
  Área: string;
  "ID_#EQUIPO": string;
  "ITEM": string;
  "Sistema": string;
  "Descripcion": string;
  "Tipo de Proceso": string;
  "Estatus": string;
  "Fecha inicio": string;
  "Fecha conclusion": string;
  "Tiene solicitud de compra?": boolean;
  "N° solicitud": string;
  "N° Orden de compra": string;
  "Fecha Entrega": string;
  "Observaciones": string;
  "Semana": string;
  "Etapa": string;
  "IS_SG": boolean;
  semana_conclusion: number | null;
  "total_ots"?: number | null;
  "ots_concluidas"?: number | null;
  "ots_pendientes"?: number | null;
}

export type MaintenanceAreaTotalsMap = Record<string, number>;
