# Design QA — Registro de jornada

## Comparación

- Fuente visual: referencia adjunta por el usuario en la conversación (sin ruta local disponible).
- Implementación: `src/components/seguimiento/registro-jornada/RegistroJornadaPage.vue` y componentes relacionados.
- Viewport de referencia: 1640 × 975 px.
- Estado de referencia: escritorio, jornada con filas continuas y acciones visibles.

## Evidencia disponible

No fue posible producir una captura renderizada de la implementación: el navegador integrado no logró inicializar el runtime (`failed to write kernel assets`). Por esa razón no se realizó una comparación visual píxel a píxel ni se declara fidelidad visual aprobada.

## Cambios aplicados

- Se eliminó el contenedor estrecho de la página y se ajustó el área de trabajo a un máximo de 1680 px.
- La cabecera, el bloque de datos generales y el detalle se reestructuraron según la referencia.
- Se incrementaron alturas, radios, separación y columnas de los campos y filas de escritorio.
- Se integraron observaciones, resumen de horas y acciones al pie de la tarjeta de detalle.

## Verificaciones no visuales

- `pnpm exec vue-tsc --noEmit`
- `pnpm exec vitest run src/components/seguimiento/registro-jornada/composables/useJornadaAdmin.test.ts` — 10 pruebas aprobadas.

## Resultado

final result: blocked

Bloqueador: falta una captura del navegador de la implementación para comparar con la referencia en el mismo viewport y estado.
