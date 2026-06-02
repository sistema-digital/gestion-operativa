# Decisiones

## 2026-06-02
Se decidió prorratear las órdenes perdidas por falta de personal utilizando números enteros redondeados (`Math.round`) al filtrar por equipo, ya que reportar fracciones de órdenes resulta confuso para la interpretación gerencial.

## 2026-06-02
Se decidió ocultar los rubros de ausencia con valor 0 (ej. "Vacaciones: 0h") en los tooltips de las gráficas para mantener la interfaz limpia y evitar sobrecarga visual con datos irrelevantes en la semana consultada.

## 2026-06-02
Se decidió abreviar los nombres de las áreas en las tablas (ej. de "Cosecha Mecanizada" a "Mecanizada") como estándar de UI para evitar el desbordamiento y el scroll horizontal en dispositivos móviles y tablets al utilizar la vista detallada.

## 2026-06-02
Se decidió agrupar las métricas de "Pérdida Operativa" y "Pérdida Personal" bajo un mismo control en la leyenda de la gráfica, permitiendo diferenciarlas por tonalidad de rojo, pero asegurando que el usuario las muestre u oculte con un solo clic.