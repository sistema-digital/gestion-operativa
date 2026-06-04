# Reglas de Negocio

- **Fuente de la Verdad:** Todos los cálculos numéricos (horas, porcentajes, redondeos) vienen directamente del backend mediante la función `get_horas_perdidas_personal_resumen`. El frontend NO debe recalcular estos valores.
- **Nodo de datos:** La tabla se alimentará específicamente del arreglo dentro del nodo `motivos_por_area`.
- **Formateo de nombres de Área:** Para mejorar la lectura y el espacio en la tabla, las áreas deben mapearse usando la siguiente estructura:
  ```typescript
  const weeklyAreaShortNames: Record<string, string> = {
    'EQUIPO PESADO': 'E. Pesado',
    'COSECHA MECANIZADA': 'C. Mecanizada',
    'COSECHA AGRICOLA': 'C. Agrícola',
    'MECANICA DE TRANSPORTE': 'M. Transporte',
    'ENGRASE': 'Engrase',
  };
Cantidad de Personal: La columna que indique la cantidad de personas mapeará directamente el valor mecanicos_necesarios_redondeado que provee el JSON.

Porcentaje de Área: La columna correspondiente mapeará el valor porcentaje_area, indicando el peso del motivo sobre el total de esa misma área.