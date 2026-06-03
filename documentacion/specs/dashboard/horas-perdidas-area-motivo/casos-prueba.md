# Casos de Prueba

## Caso 1: Tabla renderizada con agrupaciones exitosas
- **Contexto:** "Cosecha Mecanizada" tiene reportes de Inactivo y Vacaciones. "Equipo Pesado" solo tiene Vacaciones.
- **Acción:** Montar el componente.
- **Resultado esperado:** "Cosecha Mecanizada" (mapeada como "C. Mecanizada") ocupa un `rowspan=2`. "Equipo Pesado" ("E. Pesado") ocupa un `rowspan=1`. Los datos numéricos corresponden exactamente al JSON.

## Caso 2: Cambio de fecha sin salto visual
- **Contexto:** El usuario tiene cargada la data del 06 de abril.
- **Acción:** El usuario cambia la fecha al 10 de abril en el selector externo.
- **Resultado esperado:** La tabla actual permanece visible pero con un indicador de carga (spinner u overlay) hasta que llega la nueva data, momento en el cual se actualizan las filas suavemente.

## Caso 3: Nombres de área no mapeados
- **Contexto:** La base de datos devuelve un área nueva, ej: 'SOLDADURA'.
- **Acción:** El Composable procesa la data.
- **Resultado esperado:** Como 'Soldadura' no está en `weeklyAreaShortNames`, la tabla debe mostrar 'SOLDADURA' (el valor original o con Title Case) sin romperse.