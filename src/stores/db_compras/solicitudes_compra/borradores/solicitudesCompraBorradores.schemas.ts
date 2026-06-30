import { z } from 'zod';

import { OBSERVACION_MAX_LENGTH } from '../crear_solicitud/solicitudesCompraCrear.types';

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
  source: z.enum(['equipo', 'contexto']),
  codEquipo: z.string().min(1),
  label: z.string().min(1),
  modelo: z.string().nullable(),
  marca: z.string().nullable(),
  tipo: z.string().nullable(),
});

const productoExistenteSchema = z.object({
  localId: z.string().min(1),
  tipo: z.literal('existente'),
  productoId: z.string().min(1),
  codProducto: z.string().min(1),
  descripcion: z.string().min(1),
  unidadCodigo: z.string().min(1),
  unidadLabel: z.string().min(1),
});

const productoTemporalSchema = z.object({
  localId: z.string().min(1),
  tipo: z.literal('temporal'),
  temporal: z.literal(true),
  descripcion: z.string().trim().min(1),
  unidadCodigo: z.string().trim().min(1),
  unidadLabel: z.string().min(1),
});

const productoSolicitudSchema = z.union([
  productoExistenteSchema,
  productoTemporalSchema,
]);

const servicioSolicitudSchema = z.object({
  localId: z.string().min(1),
  cantidad: z.number()
    .finite('La cantidad del servicio debe ser un numero valido.')
    .refine((value) => value >= 0, 'La cantidad del servicio no puede ser negativa.'),
  descripcion: z.string().trim().min(1, 'La descripcion del servicio es obligatoria.'),
  unidadCodigo: z.string().trim().min(1, 'La unidad del servicio es obligatoria.'),
  unidadLabel: z.string().min(1),
});

const currentStepSchema = z.union([
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

const equiposArraySchema = z.array(equipoSchema)
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
  });

export const solicitudCompraBorradorSchema = z.object({
  currentStep: currentStepSchema,
  tipoSolicitud: tipoSolicitudSchema,
  fechaEntrega: fechaEntregaSchema,
  equipos: equiposArraySchema,
  productos: z.array(productoSolicitudSchema),
  servicios: z.array(servicioSolicitudSchema),
  observacion: z.string()
    .trim()
    .min(1, 'La observación es obligatoria.')
    .max(OBSERVACION_MAX_LENGTH, `La observación no puede superar los ${OBSERVACION_MAX_LENGTH} caracteres.`),
  solicitarUrgente: z.boolean(),
  motivoUrgencia: z.string(),
}).superRefine((value, ctx) => {
  if (value.equipos.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['equipos'],
      message: value.tipoSolicitud === 'servicio'
        ? 'Debe seleccionar al menos un contexto de servicio.'
        : 'Debe seleccionar al menos un equipo.',
    });
  }

  if (value.solicitarUrgente && value.motivoUrgencia.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['motivoUrgencia'],
      message: 'Debe indicar el motivo de urgencia para guardar el borrador.',
    });
  }
});
