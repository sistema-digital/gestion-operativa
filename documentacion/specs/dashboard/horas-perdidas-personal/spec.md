# Feature: Integración de Horas Perdidas por Falta de Personal en Dashboard

## Objetivo
Visualizar el impacto específico que tiene la falta de personal en el cumplimiento de las órdenes de mantenimiento, separándolo de los retrasos operativos habituales.

## Contexto
Actualmente, el dashboard agrupa todos los retrasos y ausencias en una sola métrica de "Pérdida". La gerencia necesita saber qué porción de esa pérdida se debe estrictamente a falta de personal (vacaciones, incapacidad, inactividad, etc.) para tomar decisiones de contratación o rotación.

## Usuarios
Gerentes y Supervisores de Mantenimiento.

## Alcance
- Consumo del nuevo RPC `get_horas_perdidas_personal_semanal` desde Pinia (`horasTrabajoStore.ts`).
- Modificación de la gráfica ECharts (Avance Semanal) en `SlideMantenimiento.vue`.
- Modificación de la tabla (Avance Real vs Avance Aproximado) en `SlideMantenimiento.vue`.
- Creación de un toggle switch para alternar vistas en la tabla.

## Fuera de alcance
Modificar la vista SQL original o la recolección de datos de recursos humanos.

## Tablas involucradas
- Datos provenientes del RPC `get_horas_perdidas_personal_semanal` (campos: `semana`, `area`, `horas_perdidas_totales`, `horas_vacaciones`, `horas_incapacidad`, `horas_inactivo`, `horas_plaza_no_cubierta`).

## Reglas de negocio
1. Las horas de personal se reportan por "Área", no por equipo.
2. Los rubros de ausencia que tengan un valor de `0` horas no deben mostrarse en los tooltips de la gráfica.
3. Para evitar desbordamientos visuales (scroll horizontal) en la tabla, los nombres de las áreas deben abreviarse estrictamente así: 
   - 'Equipo Pesado' = 'Pesado'
   - 'Cosecha Mecanizada' = 'Mecanizada'
   - 'Cosecha Agricola' = 'Agrícola'
   - 'Mecanica de Transporte' = 'Transporte'
   - 'Engrase' = 'Engrase'

## Fórmulas
**Cálculo de prorrateo por equipo (cuando hay un filtro de equipo activo):**
- `Órdenes Perdidas por Personal = Math.round(Total de Horas Perdidas del Área / (Equipos distintos del área con mantenimiento esa semana * Horas estimadas por orden del área))`

## Camino feliz
El usuario ingresa al dashboard, visualiza la gráfica semanal donde la pérdida operativa y la pérdida por personal se apilan en colores distintos. Al pasar el mouse, el tooltip detalla exactamente por qué faltó el personal (ocultando los ceros). En la tabla, hace clic en el switch "Detallado" y ve las columnas separadas de pérdidas con los nombres de las áreas correctamente abreviados.

## Caminos no felices
- **Falta de datos:** Que la semana actual no tenga datos de personal registrados. La gráfica no debe fallar, simplemente asume 0 en falta de personal y muestra solo la pérdida operativa.
- **Filtro sin mantenimiento:** Que se filtre por un equipo en una semana donde ese equipo no tuvo mantenimiento. Se debe evitar errores de división por cero (`NaN`).

## Validaciones
- Proteger contra división por cero al calcular el equivalente de órdenes (`hoursPerOrder > 0` y `equiposTrabajados > 0`).

## Resultado esperado
- Store actualizado y consumiendo los datos correctamente.
- Gráfica ECharts actualizada con un nuevo bloque apilado.
- Tabla con dos estados de visualización integrados y funcionales.

## UI esperada
- **Gráfica:** Nuevo bloque de color `#E74C3C` (rojo claro) para Falta de Personal, apilado sobre el `#C0392B` (Pérdida Operativa). Ambos deben controlarse (mostrar/ocultar) por el mismo ítem de leyenda ("Pérdida").
- **Tabla Toggle:** Un control estilo píldora `[ General | Detallado ]` posicionado junto al filtro "Esta semana".
- **Vista General (Tabla):** `[ Área | Avance Real | Avance Perdido (Suma Op + Pers) | Avance Sin Retrasos ]`.
- **Vista Detallada (Tabla):** `[ Área | Avance Real | Pérdida Op. | Pérdida Pers. | Avance Sin Retrasos ]`.

## Permisos
Mismos permisos de lectura actuales del componente `SlideMantenimiento`.

## Casos de prueba
1. **Filtro global:** Seleccionar un equipo específico y verificar que el tooltip muestre un número entero (redondeado) para las órdenes equivalentes perdidas por personal.
2. **Ceros en Tooltip:** Si `horas_vacaciones` es 0, no debe decir "Vacaciones: 0" en el tooltip, debe omitirse la línea por completo.

## Criterios de aceptación
- La suma matemática de (Avance Real + Pérdida Operativa + Pérdida Personal) debe ser exactamente igual al Avance Sin Retrasos.
- La tabla no debe generar scroll horizontal en pantallas de tablet.
- El toggle switch no debe alterar ni perder la funcionalidad del filtro "Esta semana / Todo el año".