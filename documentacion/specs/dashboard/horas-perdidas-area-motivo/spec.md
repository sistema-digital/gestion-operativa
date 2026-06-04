# Feature: Tabla de Horas Perdidas por Área y Motivo

## Objetivo
Visualizar un resumen de las horas laborales perdidas del personal de mantenimiento, desglosadas por área y motivo (Vacaciones, Incapacidad, Inactivo, Plaza no cubierta), permitiendo al supervisor entender rápida y visualmente dónde se está perdiendo capacidad operativa.

## Contexto
El dashboard de Mantenimiento necesita consumir la función SQL `get_horas_perdidas_personal_resumen` para mostrar estos datos de forma clara. La tabla será de naturaleza analítica, optimizada para facilitar la toma de capturas de pantalla para reportes.

## Alcance
- Creación de los tipos TypeScript (`types.ts`) basados en la respuesta JSON de la DB.
- Creación de un **Store de Pinia** que almacene de manera estricta y sin alteraciones la respuesta que devuelve Supabase.
- Creación de un **Composable** que consuma el Store y transforme la data del nodo `motivos_por_area` agregando la lógica necesaria para renderizar la tabla con `rowspan`.
- Creación del componente UI independiente (`TablaHorasPerdidasMotivo.vue` o similar).
- Integración en el `SlideMantenimiento`.

## Fuera de alcance
- Modificación de la función SQL.
- Inserción o edición de registros de asistencia desde esta vista (es una tabla de solo lectura).
- Cálculos matemáticos en el frontend de horas o porcentajes (todo proviene de la base de datos).