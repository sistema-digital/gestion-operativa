import { z } from 'zod';

import type {
  SolicitudCompraSubmitMode,
  SolicitudCompraTipoSolicitud,
} from './solicitudesCompraCrear.types';

const todayAtMidnight = (): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const tipoSolicitudSchema = z.enum(['zafra', 'cultivo', 'otros', 'servicio']);

const fechaEntregaSchema = z.string()
  .min(1, 'La fecha de entrega es obligatoria.')
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00`).getTime()), {
    message: 'La fecha de entrega no es válida.',
  })
  .refine((value) => {
    const selectedDate = new Date(`${value}T00:00:00`);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate >= todayAtMidnight();
  }, {
    message: 'La fecha de entrega no puede ser menor a la fecha actual.',
  });

const equipoSchema = z.object({
  id: z.number(),
  codEquipo: z.string().min(1),
  label: z.string().min(1),
  modelo: z.string().nullable(),
  marca: z.string().nullable(),
  tipo: z.string().nullable(),
});

const productoExistenteSchema = z.object({
  localId: z.string().min(1),
  tipo: z.literal('existente'),
  codProducto: z.string().min(1, 'El código del producto es obligatorio.'),
  descripcion: z.string().min(1),
  unidadCodigo: z.string().min(1),
  unidadLabel: z.string().min(1),
});

const productoTemporalSchema = z.object({
  localId: z.string().min(1),
  tipo: z.literal('temporal'),
  temporal: z.literal(true),
  descripcion: z.string().trim().min(1, 'La descripción del producto temporal es obligatoria.'),
  unidadCodigo: z.string().trim().min(1, 'La unidad del producto temporal es obligatoria.'),
  unidadLabel: z.string().min(1),
});

export const productoSolicitudSchema = z.union([
  productoExistenteSchema,
  productoTemporalSchema,
]);

export const servicioSolicitudSchema = z.object({
  localId: z.string().min(1),
  descripcion: z.string().trim().min(1, 'La descripción del servicio es obligatoria.'),
  unidadCodigo: z.string().trim().min(1, 'La unidad del servicio es obligatoria.'),
  unidadLabel: z.string().min(1),
  notas: z.string(),
});

export const stepDatosBaseSchema = z.object({
  tipoSolicitud: tipoSolicitudSchema,
  fechaEntrega: fechaEntregaSchema,
  equipos: z.array(equipoSchema)
    .min(1, 'Debe seleccionar al menos un equipo.')
    .superRefine((items, ctx) => {
      const seen = new Set<string>();

      items.forEach((item, index) => {
        if (seen.has(item.codEquipo)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [index, 'codEquipo'],
            message: 'No se permiten equipos duplicados.',
          });
          return;
        }

        seen.add(item.codEquipo);
      });
    }),
});

export const stepProductosSchema = z.object({
  tipoSolicitud: tipoSolicitudSchema,
  productos: z.array(productoSolicitudSchema),
  servicios: z.array(servicioSolicitudSchema),
});

export const stepObservacionesSchema = z.object({
  observacion: z.string().trim().min(1, 'La observación es obligatoria.'),
  solicitarUrgente: z.boolean(),
  motivoUrgencia: z.string(),
});

const baseCreateSchema = stepDatosBaseSchema
  .merge(stepProductosSchema)
  .merge(stepObservacionesSchema);

export const createSolicitudDraftSchema = baseCreateSchema.transform((value) => ({
  ...value,
  solicitarUrgente: false,
  motivoUrgencia: '',
}));

export const createSolicitudSendSchema = baseCreateSchema.superRefine((value, ctx) => {
  if (value.tipoSolicitud === 'servicio') {
    if (value.servicios.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['servicios'],
        message: 'Debe agregar al menos un servicio para enviar la solicitud.',
      });
    }
  } else if (value.productos.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['productos'],
      message: 'Debe agregar al menos un producto para enviar la solicitud.',
    });
  }

  if (value.solicitarUrgente && value.motivoUrgencia.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['motivoUrgencia'],
      message: 'Debe indicar el motivo de urgencia al enviar la solicitud.',
    });
  }
});

export const getCreateSolicitudSchemaByMode = (
  mode: Exclude<SolicitudCompraSubmitMode, null>
) => mode === 'draft'
  ? createSolicitudDraftSchema
  : createSolicitudSendSchema;
