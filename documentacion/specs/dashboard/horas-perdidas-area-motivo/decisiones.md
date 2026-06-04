# Decisiones Técnicas

## 2026-06-03 - Arquitectura de Estado Híbrida (Store + Composable)
Se decidió dividir la responsabilidad de los datos:
1. **Store de Pinia:** Mantiene la respuesta HTTP exacta (raw data) del RPC de Supabase. Esto permite que otras partes de la app consuman la data pura si fuera necesario en el futuro.
2. **Composable local (`useHorasPerdidasTable`):** Toma la data del Store, inyecta los cálculos estructurales (`rowspan` y conteos de filas repetidas) y formatea los nombres de áreas usando el diccionario definido. Así se mantiene la lógica de UI estrictamente separada de la lógica de red/estado global.

## 2026-06-03 - Capturas de pantalla limpias
Se acordó mover el input del filtro de fecha fuera de la tarjeta o contenedor de la tabla para garantizar que las capturas de pantalla de la tabla, usadas para enviar por WhatsApp o correo en reportes, salgan completamente enfocadas en los datos, sin elementos de control de la UI.