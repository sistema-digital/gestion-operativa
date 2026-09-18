/**
 * useJornadaAdmin.ts
 *
 * Composable de orquestación.
 *
 * Responsabilidad:
 * - validar continuidad;
 * - resolver código -> labor/parada;
 * - traducir filas del formulario a eventos administrativos;
 * - llamar al service en el orden correcto;
 * - mantener estado de guardando/error.
 *
 * Los componentes visuales NO deben decidir qué RPC corresponde.
 */

import { computed, ref } from 'vue';
import { registroJornadaService } from '../services/registroJornada.service';
import type {
  CatalogosJornada,
  JornadaFilaModel,
  JornadaState,
} from '../registroJornada.types';

export function useJornadaAdmin() {
  const guardando = ref(false);
  const error = ref<string | null>(null);

  function validarContinuidad(filas: JornadaFilaModel[]) {
    if (!filas.length) return { ok: false, mensaje: 'Agrega al menos un registro.' };

    for (let i = 0; i < filas.length; i += 1) {
      const fila = filas[i];
      if (!fila.inicio || !fila.fin || !fila.codigo || !fila.actividadId) {
        return { ok: false, mensaje: `Completa la fila ${i + 1}.` };
      }
      if (fila.fin <= fila.inicio) {
        return { ok: false, mensaje: `La hora fin de la fila ${i + 1} debe ser posterior al inicio.` };
      }
      if (i > 0 && filas[i - 1].fin !== fila.inicio) {
        return { ok: false, mensaje: `Existe un espacio o solapamiento entre las filas ${i} y ${i + 1}.` };
      }
    }

    return { ok: true, mensaje: 'La secuencia de horas es continua.' };
  }

  function resolverCodigo(
    codigo: number | null,
    catalogos: CatalogosJornada,
  ): Pick<JornadaFilaModel, 'tipoActividad' | 'actividadId' | 'actividadNombre'> {
    if (codigo == null) {
      return { tipoActividad: null, actividadId: null, actividadNombre: '' };
    }

    const labor = catalogos.labores.find((item) => item.orden === codigo && item.activo);
    if (labor) {
      return {
        tipoActividad: 'labor',
        actividadId: labor.id,
        actividadNombre: labor.nombre,
      };
    }

    const parada = catalogos.tiposParada.find((item) => item.orden === codigo && item.activo);
    if (parada) {
      return {
        tipoActividad: 'parada',
        actividadId: parada.id,
        actividadNombre: parada.nombre,
      };
    }

    return { tipoActividad: null, actividadId: null, actividadNombre: 'Código no reconocido' };
  }

  async function registrarImplemento(payload: {
    numero: string;
    tipoImplementoId: string;
    nombre?: string | null;
  }) {
    const { data, error: rpcError } = await registroJornadaService.registrarImplemento(payload);
    if (rpcError) throw rpcError;
    return data;
  }

  /**
   * Punto de integración.
   *
   * Aquí se debe implementar la traducción completa:
   * - primera fila -> rpc_admin_iniciar_jornada
   * - labor -> labor -> rpc_admin_cambiar_labor
   * - labor -> parada -> rpc_admin_registrar_parada
   * - parada -> labor -> rpc_admin_reanudar_trabajo
   * - parada -> parada -> rpc_admin_cambiar_tipo_parada
   * - cambio de implemento -> rpc_admin_confirmar_cambio_implemento
   * - fin -> rpc_admin_finalizar_jornada
   *
   * Se deja explícitamente aquí y NO distribuida entre componentes.
   */
  async function finalizarDesdeFilas(jornada: JornadaState) {
    const validacion = validarContinuidad(jornada.filas);
    if (!validacion.ok) throw new Error(validacion.mensaje);

    guardando.value = true;
    error.value = null;

    try {
      // Implementar secuencia exacta contra los RPC administrativos.
      // Este archivo documenta el punto correcto de integración.
      throw new Error(
        'Pendiente conectar la secuencia de filas a los RPC administrativos en este composable.',
      );
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error desconocido';
      throw e;
    } finally {
      guardando.value = false;
    }
  }

  return {
    guardando,
    error,
    validarContinuidad,
    resolverCodigo,
    registrarImplemento,
    finalizarDesdeFilas,
  };
}
