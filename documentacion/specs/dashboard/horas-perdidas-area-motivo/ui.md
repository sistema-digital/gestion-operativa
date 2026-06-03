# Interfaz de Usuario (UI)

## Ubicación y Selectores
- El componente se ubicará en el `SlideMantenimiento`.
- **Filtro de Fecha:** Habrá un selector de fecha cuyo valor por defecto será `2026-04-06`. 
- **Importante:** Este selector de fecha debe estar **fuera** del contenedor visual/tarjeta de la tabla. El objetivo es que al tomar una captura de pantalla de la tabla, el input de la fecha no aparezca y la imagen quede limpia.

## Diseño de la Tabla
- **Estilo Visual:** Se clonará el estilo gráfico de la tabla "AVANCE REAL VS AVANCE APROXIMADO SIN RETRASOS" (cabeceras oscuras, diseño limpio, bordes divisorios).
- **Agrupación (Rowspan):** Para evitar la repetición del nombre del área, se utilizará el atributo HTML `rowspan`. Si "Cosecha Mecanizada" tiene 3 motivos, la celda del área ocupará 3 filas, y a su derecha se desglosarán los motivos.
- **Columnas Esperadas:**
  1. Área (Agrupada)
  2. Motivo
  3. Horas Perdidas
  4. Cantidad de Personal
  5. % del Área

## Estados de la Interfaz
- **Carga (Loading):** Al cambiar la fecha, en lugar de desaparecer la tabla, se mostrará un skeleton/overlay semi-transparente o un spinner sobre la tabla actual para evitar saltos bruscos de diseño.
- **Vacío (Empty State):** Si no hay registros devueltos, mostrar un mensaje centrado: "No hay horas perdidas registradas en el periodo seleccionado."