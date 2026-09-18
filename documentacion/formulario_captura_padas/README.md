# Registro de jornada — separación por componentes

Este paquete divide el mockup anterior en archivos independientes de Vue 3 + TypeScript y conserva un HTML completo de referencia visual.

## Archivos

- `RegistroJornadaPage.vue`: orquestador.
- `components/JornadaDatosGenerales.vue`: fecha, operador, equipo y área.
- `components/JornadaDetalle.vue`: colección de filas.
- `components/JornadaFila.vue`: una fila cronológica.
- `components/ImplementoSelect.vue`: selector de implemento.
- `components/ImplementoCrearPanel.vue`: drawer desktop / bottom sheet móvil.
- `components/JornadaResumen.vue`: observaciones e indicadores de tiempo.
- `components/JornadaAcciones.vue`: guardar/finalizar.
- `composables/useJornadaAdmin.ts`: reglas y traducción de filas a eventos.
- `services/registroJornada.service.ts`: llamadas `supabase.rpc`.
- `registroJornada.types.ts`: tipos compartidos.
- `registro_jornada_integracion_completa.html`: documento visual completo que muestra cómo se une todo.

## Principio de integración

UI -> `RegistroJornadaPage.vue` -> `useJornadaAdmin.ts` -> `registroJornada.service.ts` -> Supabase RPC.

Los componentes visuales no deben llamar Supabase directamente.
