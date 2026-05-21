# Prompt básico para crear componentes Vue 3 mantenibles

Actúa como un desarrollador senior de Vue 3, Composition API, `<script setup>` y TypeScript estricto.

Necesito crear o refactorizar un componente Vue 3 manteniendo una estructura limpia, escalable y fácil de mantener. El objetivo principal es controlar el tamaño del componente, separar responsabilidades y usar nombres claros. No te enfoques en estilos visuales.

## Datos del componente

- Componente principal: `[NOMBRE_COMPONENTE]`
- Ubicación: `src/views`
componentes secundarios: `src/components/[carpeta]/`
- Función principal: `[QUE_HACE_EL_COMPONENTE]`
- Datos que recibe: `[PROPS]`
- Eventos que emite: `[EMITS]`
- Acciones principales del usuario: `[ACCIONES]`
- Store o composable que debe consumir: `[STORE_O_COMPOSABLE]`

## Reglas de tamaño

1. El componente principal no debe superar aproximadamente 200 líneas.
2. Si supera 200 líneas, divide en subcomponentes.
3. Un subcomponente no debe superar aproximadamente 120 líneas.
4. Un composable no debe superar aproximadamente 150 líneas.
5. Una función no debe superar aproximadamente 30 líneas.
6. Si una función crece demasiado, divídela en funciones pequeñas con nombres claros.
7. No concentres toda la lógica en el componente principal.
8. El componente principal debe coordinar, no contener toda la implementación.

## Cuándo dividir en subcomponentes

Divide el componente cuando exista:

1. Una sección visual independiente.
2. Un bloque repetido.
3. Un formulario interno.
4. Una lista o tabla.
5. Un modal.
6. Un panel de resumen.
7. Una tarjeta reutilizable.
8. Una sección con props y eventos propios.

Ejemplo de división:

```text
PlanificacionJornada.vue
PlanificacionHeader.vue
PlanificacionStepper.vue
PlanificacionBusqueda.vue
PlanificacionResultados.vue
PlanificacionMecanicoPanel.vue
PlanificacionResumen.vue