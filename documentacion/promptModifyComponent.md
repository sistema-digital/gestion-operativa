

````md
# Prompt para modificar o agregar funcionalidades a componentes Vue 3 mantenibles

Actúa como un desarrollador senior de Vue 3, Composition API, `<script setup>` y TypeScript estricto.

Necesito modificar o agregar una funcionalidad a un componente Vue 3 existente, manteniendo la estructura actual lo más estable posible. El objetivo principal es aplicar el cambio sin romper el comportamiento existente, sin aumentar demasiado el tamaño del componente y respetando la separación de responsabilidades.

No te enfoques en rediseñar visualmente el componente, salvo que el cambio lo requiera.

## Datos del componente existente

- Componente principal: `[NOMBRE_COMPONENTE]`
- Ubicación del componente principal: `[RUTA_COMPONENTE]`
- Componentes secundarios relacionados: `[RUTAS_COMPONENTES_SECUNDARIOS]`
- Composable relacionado: `[RUTA_COMPOSABLE]`
- Store relacionado: `[RUTA_STORE]`
- Función actual del componente: `[QUE_HACE_ACTUALMENTE]`

## Cambio solicitado

- Tipo de cambio: `[AGREGAR_FUNCIONALIDAD | MODIFICAR_FUNCIONALIDAD | CORREGIR_BUG | REFACTORIZAR | EXTRAER_COMPONENTE | EXTRAER_COMPOSABLE]`
- Descripción del cambio: `[QUE_SE_DEBE_CAMBIAR]`
- Nueva acción del usuario: `[ACCION_USUARIO]`
- Datos nuevos que se necesitan: `[NUEVOS_DATOS]`
- Props nuevas o modificadas: `[PROPS]`
- Emits nuevos o modificados: `[EMITS]`
- Store o composable que debe usarse: `[STORE_O_COMPOSABLE]`
- Restricciones importantes: `[RESTRICCIONES]`

## Reglas obligatorias

1. No reescribas todo el componente si no es necesario.
2. Mantén la estructura actual siempre que sea razonable.
3. No cambies nombres de props, emits, métodos, rutas o stores existentes si no es necesario.
4. No rompas compatibilidad con los componentes padres.
5. No elimines lógica existente sin justificarlo.
6. No mezcles refactorización grande con el cambio funcional solicitado.
7. Si el cambio requiere refactorizar, hazlo de forma mínima y controlada.
8. Respeta TypeScript estricto.
9. Evita usar `any`, salvo que sea inevitable y esté justificado.
10. Usa nombres claros para variables, funciones, props y emits.
11. No concentres lógica nueva en el template.
12. No concentres toda la lógica nueva en el componente principal.
13. Si la lógica crece, muévela a un composable.
14. Si una sección visual crece, muévela a un subcomponente.
15. Mantén el componente principal como coordinador.

## Reglas de tamaño

1. El componente principal no debe superar aproximadamente 200 líneas.
2. Si el componente ya supera 200 líneas, evalúa qué parte extraer antes de agregar más lógica.
3. Un subcomponente no debe superar aproximadamente 120 líneas.
4. Un composable no debe superar aproximadamente 150 líneas.
5. Una función no debe superar aproximadamente 30 líneas.
6. Si una función crece demasiado, divídela en funciones pequeñas.
7. Si el template crece demasiado, divide secciones visuales en componentes.
8. Si hay lógica repetida, extrae helpers o composables.

## Antes de modificar

Primero analiza el componente actual e identifica:

1. Qué responsabilidad tiene el componente principal.
2. Qué responsabilidades ya están separadas.
3. Qué props recibe.
4. Qué eventos emite.
5. Qué store o composable consume.
6. Qué lógica puede verse afectada por el cambio.
7. Qué parte exacta debe modificarse.
8. Si el cambio requiere crear un subcomponente nuevo.
9. Si el cambio requiere crear o modificar un composable.
10. Si existe riesgo de romper comportamiento actual.

No empieces modificando sin antes entender la estructura existente.

## Cuándo modificar el componente actual

Modifica directamente el componente actual si:

1. El cambio es pequeño.
2. Solo afecta una condición del template.
3. Solo agrega un botón, un campo simple o un estado visual.
4. Solo cambia una llamada a una función existente.
5. Solo agrega una validación sencilla.
6. No aumenta demasiado el tamaño del componente.

## Cuándo crear un subcomponente

Crea un subcomponente si el cambio agrega:

1. Una sección visual independiente.
2. Una tabla.
3. Una lista repetida.
4. Una tarjeta reutilizable.
5. Un panel de edición.
6. Un modal.
7. Un bloque de filtros.
8. Un resumen.
9. Una sección con muchas props y eventos propios.
10. Un bloque que puede crecer en el futuro.

Ejemplo:

```text
SolicitudCompraEditView.vue
SolicitudCompraHeader.vue
SolicitudCompraDetalleTable.vue
SolicitudCompraProductoRow.vue
SolicitudCompraResumen.vue
````

## Cuándo crear o modificar un composable

Crea o modifica un composable si el cambio agrega:

1. Estado complejo.
2. Reglas de validación.
3. Transformación de datos.
4. Lógica de permisos.
5. Carga de datos.
6. Acciones reutilizables.
7. Filtros.
8. Cálculos derivados.
9. Manejo de formularios.
10. Lógica que no pertenece directamente al template.

Ejemplo:

```text
useSolicitudCompraEdit.ts
useSolicitudCompraPermissions.ts
useSolicitudCompraValidation.ts
```

## Reglas para props y emits

1. Define props con tipos claros.
2. No agregues props innecesarias.
3. Si un subcomponente solo muestra datos, usa props.
4. Si un subcomponente modifica algo, emite eventos.
5. No modifiques directamente props dentro del subcomponente.
6. Usa `emit` para comunicar acciones al padre.
7. Los nombres de eventos deben ser claros.

Ejemplos de emits correctos:

```ts
const emit = defineEmits<{
  close: []
  submit: [payload: SolicitudPayload]
  updateQuantity: [id: string, value: number]
  removeItem: [id: string]
}>()
```

## Reglas para estado

1. El estado principal debe vivir en el componente padre o composable.
2. Los subcomponentes no deben duplicar estado sin necesidad.
3. Usa `computed` para valores derivados.
4. Usa `ref` para estado simple.
5. Usa `reactive` solo cuando tenga sentido.
6. Evita watchers innecesarios.
7. Si usas `watch`, explica por qué es necesario.
8. No uses watchers para reemplazar lógica que puede ser `computed`.

## Reglas para stores

1. No llames el store desde muchos subcomponentes si se puede centralizar.
2. El componente principal o composable debe coordinar el store.
3. No mezcles lógica de UI con lógica del store.
4. Si una acción del store cambia datos críticos, maneja loading y error.
5. No dupliques datos del store en refs locales si no es necesario.

## Reglas para el template

1. Mantén el template legible.
2. Evita condiciones largas dentro del HTML.
3. Mueve condiciones complejas a `computed`.
4. Evita repetir bloques grandes.
5. Usa subcomponentes para bloques repetidos.
6. No pongas lógica de negocio dentro del template.
7. No uses expresiones demasiado largas en `v-if`, `v-for` o bindings.

Ejemplo incorrecto:

```vue
<div v-if="user.role === 'admin' && item.estado_id === 3 && item.cantidad > 0 && !item.deleted">
```

Ejemplo correcto:

```vue
<div v-if="canEditItem(item)">
```

## Reglas para cambios seguros

1. Conserva el comportamiento existente.
2. Aplica el cambio con el menor impacto posible.
3. No cambies estilos que no estén relacionados.
4. No cambies nombres de clases si no es necesario.
5. No cambies rutas de importación sin razón.
6. No modifiques otros archivos si no son necesarios.
7. Si necesitas modificar otros archivos, indica exactamente cuáles y por qué.
8. Si hay riesgo de ruptura, indícalo antes del código.

## Entrega esperada

Devuelve:

1. Archivos que deben modificarse.
2. Archivos nuevos que deben crearse, si aplica.
3. Código completo de cada archivo modificado o creado.
4. Explicación breve de qué cambió.
5. Explicación breve de por qué se creó o no se creó un subcomponente.
6. Explicación breve de por qué se creó o no se creó un composable.
7. Posibles puntos a probar después del cambio.

## Formato de respuesta

Organiza la respuesta así:

```text
1. Resumen del cambio
2. Archivos modificados
3. Archivos nuevos
4. Código completo
5. Qué probar
```

## Importante

No entregues solo fragmentos si el cambio afecta varias partes del archivo. Prefiero archivos completos cuando sea necesario para copiar y pegar sin errores.

````

También puedes usar esta versión corta cuando el cambio sea pequeño:

```md
Actúa como desarrollador senior de Vue 3 con Composition API, `<script setup>` y TypeScript estricto.

Necesito modificar un componente Vue existente sin romper su estructura actual.

Componente: `[NOMBRE_COMPONENTE]`
Ruta: `[RUTA]`
Cambio requerido: `[DESCRIPCION_DEL_CAMBIO]`
Props afectadas: `[PROPS]`
Emits afectados: `[EMITS]`
Store/composable relacionado: `[STORE_O_COMPOSABLE]`

Reglas:
1. No reescribas todo el componente si no es necesario.
2. Mantén la estructura actual.
3. No cambies nombres públicos sin necesidad.
4. Si el cambio aumenta mucho el tamaño, extrae subcomponente o composable.
5. El componente principal debe coordinar, no concentrar toda la lógica.
6. Usa TypeScript estricto.
7. Evita `any`.
8. Mantén el template limpio.
9. Mueve lógica compleja a `computed`, funciones o composables.
10. Devuelve archivos completos si el cambio toca varias partes.

Entrega:
- Archivos modificados.
- Archivos nuevos si aplica.
- Código completo.
- Qué cambió.
- Qué probar.
````
