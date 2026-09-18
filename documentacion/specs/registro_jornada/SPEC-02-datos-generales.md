# SPEC-02 — Datos generales y carga inicial

## Objetivo

Documentar los datos generales de la pantalla de registro de jornada y el estado disponible para su carga inicial: fecha, operador, equipo, área, operadores y catálogos.

## Alcance

- Modelo frontend de los datos generales y de los catálogos asociados.
- Presentación y enlace de los campos Fecha, Operador, Equipo y Área.
- Estado inicial declarado por `RegistroJornadaPage.vue`.
- Puntos de integración expuestos para cargar operadores y catálogos.
- Estados de carga, validación y error que están —o no están— implementados en las fuentes revisadas.

## Fuera de alcance

- Creación, guardado, finalización o consulta de una jornada.
- Filas de detalle, resolución de códigos, implementos, observaciones y continuidad.
- Definir la fuente, consulta o contrato del catálogo de equipos.
- Definir contratos RPC no verificados en Supabase.
- Cambiar componentes, servicios, tipos o cualquier otro archivo.

## Fuentes

Lectura realizada en el orden indicado por `documentacion/formulario_captura_padas/INDEX_SPECS.md`:

1. `documentacion/formulario_captura_padas/registro_jornada_integracion_completa.html`
2. `documentacion/formulario_captura_padas/registroJornada.types.ts`
3. `documentacion/formulario_captura_padas/RegistroJornadaPage.vue`
4. `documentacion/formulario_captura_padas/components/JornadaDatosGenerales.vue`
5. `documentacion/formulario_captura_padas/services/registroJornada.service.ts`

No se verificó una firma real de Supabase accesible.

## Clasificación de evidencia

- **Confirmado:** comportamiento, dato o tipo declarado en las fuentes de implementación revisadas.
- **Decisión de UI:** presentación o interacción mostrada en el componente Vue o en la referencia HTML; no constituye por sí sola una regla de persistencia.
- **Ejemplo visual:** valor ilustrativo de la referencia HTML; no se convierte en valor por defecto ni regla.
- **Pendiente:** información indispensable que no aparece confirmada en las fuentes permitidas y necesita validación.

## Datos generales

El modelo `JornadaDatosGeneralesModel` contiene los siguientes campos:

| Campo          | Tipo             | Presentación / uso confirmado                                                                                                       |
| -------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `fecha`        | `string \| null` | Campo Fecha enlazado con `v-model`; el componente lo representa como control de fecha.                                              |
| `operadorId`   | `string \| null` | Selector Operador enlazado con `v-model`; sus opciones usan `OperadorOption.id` como valor y `OperadorOption.nombre` como etiqueta. |
| `equipoNumero` | `string \| null` | Selector Equipo enlazado con `v-model`; sus opciones usan `EquipoOption.numero` como valor y `EquipoOption.etiqueta` como etiqueta. |
| `area`         | `string \| null` | Campo Área de solo lectura; muestra `model.area                                                                                     |     | ''`. |

**Decisión de UI:** los selectores de Operador y Equipo incluyen una opción inicial con valor `null` y los textos “Seleccionar operador…” y “Seleccionar equipo…”, respectivamente.

**Decisión de UI:** la Fecha y el Equipo usan tipografía monoespaciada en el componente actual. La presentación debe apoyarse en los tokens existentes del tema principal.

**Ejemplo visual:** la referencia HTML muestra la fecha `2026-09-12`, cuatro nombres de operador, cuatro equipos y el área “Campo”. Esos valores no demuestran catálogo, disponibilidad ni regla de selección.

## Carga inicial

**Confirmado:** `RegistroJornadaPage.vue` declara inicialmente:

| Estado                      | Valor inicial declarado |
| --------------------------- | ----------------------- |
| `jornada.fecha`             | `'2026-09-12'`          |
| `jornada.operadorId`        | `null`                  |
| `jornada.equipoNumero`      | `null`                  |
| `jornada.area`              | `'Campo'`               |
| `operadores`                | `[]`                    |
| `equipos`                   | `[]`                    |
| `catalogos.labores`         | `[]`                    |
| `catalogos.tiposParada`     | `[]`                    |
| `catalogos.implementos`     | `[]`                    |
| `catalogos.implementoTipos` | `[]`                    |

**Confirmado:** el servicio expone `listarOperadores()`, que invoca `supabase.rpc('rpc_admin_listar_operadores')`, y `cargarCatalogos()`, que invoca `supabase.rpc('rpc_obtener_catalogos_offline')`.

**Confirmado:** en los archivos Vue revisados no existe una invocación a esas funciones ni un ciclo de vida que cargue operadores, equipos o catálogos. Por tanto, no está confirmado cuándo ni cómo se poblarán los arreglos inicialmente vacíos.

**Pendiente:** la fuente del catálogo de equipos no está definida. La referencia HTML indica reutilizar el catálogo/fuente actual del ERP y no crear un RPC administrativo nuevo para esta vista, pero no identifica esa fuente ni su contrato.

## Estado / modelo de datos

```ts
interface JornadaDatosGeneralesModel {
  fecha: string | null;
  operadorId: string | null;
  equipoNumero: string | null;
  area: string | null;
}

interface OperadorOption {
  id: string;
  nombre: string;
}

interface EquipoOption {
  numero: string;
  etiqueta: string;
  area?: string | null;
}
```

**Confirmado:** `JornadaState` extiende `JornadaDatosGeneralesModel`; por ello los datos generales se conservan dentro del estado reactivo `jornada` que posee la página.

**Pendiente:** aunque `EquipoOption` puede incluir `area`, ninguna fuente revisada confirma que al seleccionar un equipo se derive, actualice o valide `jornada.area`.

## Flujo

1. **Confirmado:** `RegistroJornadaPage.vue` crea y posee el objeto reactivo `jornada`, los arreglos `operadores` y `equipos`, y el objeto reactivo `catalogos`.
2. **Confirmado:** la página entrega `jornada` mediante `v-model` a `JornadaDatosGenerales` y entrega los arreglos `operadores` y `equipos` como props.
3. **Confirmado:** `JornadaDatosGenerales` enlaza Fecha, Operador y Equipo directamente al modelo; Área solo lee el valor del modelo.
4. **Pendiente:** no está documentado en las fuentes revisadas el disparador, orden, transformación de respuesta ni asignación que cargarían operadores, equipos y catálogos.

## Contrato entre componentes

| Participante                                        | Contrato confirmado                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `RegistroJornadaPage.vue` → `JornadaDatosGenerales` | `v-model="jornada"`                                                                        |
| `RegistroJornadaPage.vue` → `JornadaDatosGenerales` | Prop `operadores: OperadorOption[]`                                                        |
| `RegistroJornadaPage.vue` → `JornadaDatosGenerales` | Prop `equipos: EquipoOption[]`                                                             |
| `JornadaDatosGenerales` → padre                     | Actualiza el modelo mediante `defineModel<JornadaDatosGeneralesModel>({ required: true })` |

**Confirmado:** el componente de datos generales no llama RPC ni crea la jornada.

## RPC involucrados

| RPC                             | Evidencia disponible                         | Contrato documentable                                                                                    |
| ------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `rpc_admin_listar_operadores`   | El servicio lo invoca sin segundo argumento. | **Pendiente:** no se verificó su firma real; no se documentan parámetros, respuesta, tablas ni columnas. |
| `rpc_obtener_catalogos_offline` | El servicio lo invoca sin segundo argumento. | **Pendiente:** no se verificó su firma real; no se documentan parámetros, respuesta, tablas ni columnas. |

## Validaciones

**Confirmado:** los cuatro campos del modelo admiten `null` según sus tipos.

**Confirmado:** `JornadaDatosGenerales.vue` no declara atributos `required`, reglas de validación ni mensajes de validación para Fecha, Operador, Equipo o Área.

**Pendiente:** no se puede establecer qué campos son obligatorios, qué formato se exige para `fecha`, ni las reglas de coherencia entre operador, equipo y área sin una fuente adicional verificable.

## Estados de error

**Confirmado:** los archivos revisados no exponen estado de carga, estado de error, reintento ni representación visual de fallos para la carga de operadores, equipos o catálogos.

**Pendiente:** deben definirse el tratamiento y la presentación de errores de las cargas solo después de verificar los contratos y el flujo de inicialización correspondiente.

## Responsive

**Decisión de UI:** el componente Vue actual usa una cuadrícula de una columna en su base, dos columnas desde el breakpoint `sm` y cuatro columnas desde `xl`; conserva separación, borde, fondo y sombra mediante las utilidades y tokens existentes del tema principal.

**Ejemplo visual:** la referencia HTML muestra dos columnas a anchos de hasta 767 px y una a anchos de hasta 479 px. Esa referencia no confirma la configuración de breakpoints de la implementación Vue.

## Criterios de aceptación

1. La pantalla mantiene Fecha, Operador, Equipo y Área en un modelo compatible con `JornadaDatosGeneralesModel`.
2. Al editar Fecha, Operador o Equipo, el valor correspondiente se actualiza en el modelo enlazado mediante `v-model`.
3. Operador renderiza cada opción recibida con `id` como valor y `nombre` como texto visible.
4. Equipo renderiza cada opción recibida con `numero` como valor y `etiqueta` como texto visible.
5. Área se muestra como campo de solo lectura y presenta una cadena vacía cuando el valor del modelo es `null`.
6. Con los valores iniciales declarados, operadores, equipos y cada arreglo de `catalogos` están vacíos.
7. La documentación no atribuye parámetros, respuestas, tablas, columnas o reglas a `rpc_admin_listar_operadores` ni a `rpc_obtener_catalogos_offline` sin verificar su firma real.

## Casos límite

- `fecha`, `operadorId`, `equipoNumero` y `area` pueden ser `null` en el modelo declarado.
- Un operador o equipo puede no estar seleccionado mientras sus catálogos estén vacíos o aunque hayan sido cargados; no hay una regla de bloqueo confirmada.
- `EquipoOption.area` es opcional y nullable; no se confirma cómo afecta al Área visual.
- Área presenta texto vacío cuando `model.area` es `null`.

## Pendientes / preguntas abiertas

1. Falta verificar la firma real de Supabase de `rpc_admin_listar_operadores`: parámetros, tipo y estructura de respuesta, y posibles condiciones de error. Esta información es necesaria para documentar el contrato de carga de operadores sin inventar payloads, respuestas, tablas o columnas. Debe verificarse en la firma publicada de ese RPC en Supabase.
2. Falta verificar la firma real de Supabase de `rpc_obtener_catalogos_offline`: parámetros, tipo y estructura de respuesta, y posibles condiciones de error. Esta información es necesaria para documentar el contrato de carga de catálogos sin inventar payloads, respuestas, tablas o columnas. Debe verificarse en la firma publicada de ese RPC en Supabase.
3. Falta identificar la fuente real del catálogo de equipos del ERP y su contrato. Es necesaria para saber cómo se pobla `EquipoOption[]` y si existe relación confirmada con `area`. Debe verificarse la implementación o servicio vigente del catálogo de equipos del ERP.
4. Falta confirmar el flujo que ejecuta las cargas iniciales y asigna sus resultados al estado de la página. Debe verificarse el composable u orquestación efectiva que se use para esta pantalla.
5. Falta confirmar reglas de obligatoriedad, formato y coherencia de Fecha, Operador, Equipo y Área. Debe verificarse la lógica de validación o el contrato de persistencia correspondiente.

## Tabla de trazabilidad

| Regla o dato                                                                       | Clasificación  | Fuente exacta                                                                                                                                |
| ---------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Campos `fecha`, `operadorId`, `equipoNumero` y `area` y sus tipos nullable         | Confirmado     | `documentacion/formulario_captura_padas/registroJornada.types.ts` — `JornadaDatosGeneralesModel`                                             |
| Estructuras de opción de operador y equipo                                         | Confirmado     | `documentacion/formulario_captura_padas/registroJornada.types.ts` — `OperadorOption`, `EquipoOption`                                         |
| La página posee `jornada`, `operadores`, `equipos` y `catalogos`                   | Confirmado     | `documentacion/formulario_captura_padas/RegistroJornadaPage.vue` — declaraciones de estado                                                   |
| Valores iniciales actuales                                                         | Confirmado     | `documentacion/formulario_captura_padas/RegistroJornadaPage.vue` — inicializadores de `jornada`, `operadores`, `equipos` y `catalogos`       |
| Enlace `v-model` y props hacia datos generales                                     | Confirmado     | `documentacion/formulario_captura_padas/RegistroJornadaPage.vue` — uso de `JornadaDatosGenerales`                                            |
| Renderizado, valores de opción y Área de solo lectura                              | Confirmado     | `documentacion/formulario_captura_padas/components/JornadaDatosGenerales.vue` — template                                                     |
| El componente no crea jornada ni llama RPC                                         | Confirmado     | `documentacion/formulario_captura_padas/components/JornadaDatosGenerales.vue` — comentario y script                                          |
| Funciones de servicio para operadores y catálogos                                  | Confirmado     | `documentacion/formulario_captura_padas/services/registroJornada.service.ts` — `listarOperadores`, `cargarCatalogos`                         |
| Fuente existente del ERP para equipos, sin crear RPC administrativo nuevo          | Decisión de UI | `documentacion/formulario_captura_padas/registro_jornada_integracion_completa.html` — bloque de documentación de `JornadaDatosGenerales.vue` |
| Campos, orden y ejemplo de valores visibles                                        | Ejemplo visual | `documentacion/formulario_captura_padas/registro_jornada_integracion_completa.html` — sección `journey-head`                                 |
| Distribución de una, dos y cuatro columnas en la implementación actual             | Decisión de UI | `documentacion/formulario_captura_padas/components/JornadaDatosGenerales.vue` — clases de la sección                                         |
| Contratos de los dos RPC, fuente de equipos, flujo de carga y reglas de validación | Pendiente      | No verificable en las fuentes revisadas ni mediante firma real de Supabase accesible                                                         |
