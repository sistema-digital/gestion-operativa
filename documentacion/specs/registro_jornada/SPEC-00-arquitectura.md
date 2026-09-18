# SPEC-00 — Base del módulo, navegación, arquitectura y permisos

> Módulo: Seguimiento / Registro administrativo de jornadas  
> Estado: borrador para validación funcional y técnica

## Objetivo

Definir la entrada de navegación, el acceso por permisos y el alcance arquitectónico de la vista que permite transcribir una jornada registrada en papel al flujo administrativo de jornadas, conservando la separación entre interfaz, orquestación, reglas de negocio, integración y Supabase.

## Alcance

- Documentar la composición de la pantalla de registro de jornada.
- Ubicar la vista en el módulo Seguimiento, junto a Tareas y Reportes.
- Definir la ruta canónica y la protección de acceso de la vista.
- Definir las capacidades de frontend que controlan visibilidad, edición, finalización, descarte, deshacer y creación de implementos.
- Establecer las responsabilidades confirmadas de la página, los componentes visuales, el composable y el servicio.
- Establecer la frontera de integración: los componentes visuales no deciden ni ejecutan RPC de Supabase directamente.
- Documentar el flujo arquitectónico confirmado entre las capas.
- Registrar los elementos que requieren una verificación posterior antes de documentar contratos o persistencia.

## Fuera de alcance

- Definir el modelo de datos detallado, tipos, nulabilidad o campos calculados. Corresponde a SPEC-01.
- Especificar payloads, respuestas, tablas, columnas o firmas de RPC.
- Definir las transiciones de filas a eventos administrativos. Corresponde a SPEC-06.
- Definir validaciones funcionales exhaustivas, borradores, recuperación, responsive detallado o pruebas de aceptación por escenario.
- Implementar código, rutas, componentes, servicios, migraciones, registros de permisos o RPC.

## Fuentes

| Fuente                                                                              | Uso en esta SPEC                                                                            |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `documentacion/formulario_captura_padas/registro_jornada_integracion_completa.html` | Referencia visual, composición de pantalla y propuesta de responsabilidades de componentes. |
| `documentacion/formulario_captura_padas/RegistroJornadaPage.vue`                    | Orquestación implementada de la pantalla y comunicación entre sus componentes.              |
| `documentacion/formulario_captura_padas/README.md`                                  | Resumen de la separación por componentes y del flujo de integración.                        |
| `documentacion/formulario_captura_padas/INDEX_SPECS.md`                             | Jerarquía de fuentes, alcance recomendado de SPEC-00 y regla de no inventar contratos.      |
| `src/router/index.ts`                                                               | Convención de rutas, metadatos de acceso y guardas actuales de Seguimiento.                 |
| `src/layouts/DefaultLayout.vue`                                                     | Grupo de navegación Seguimiento en escritorio y móvil.                                      |
| `src/seguimiento/shared/seguimiento.permissions.ts`                                 | Convención de constantes de permisos de Seguimiento.                                        |
| Decisión proporcionada por usuario: permisos de jornadas administrativas            | Capacidades autorizadas para la nueva vista.                                                |

## Clasificación de evidencia

### Confirmado

- El módulo documenta una pantalla administrativa para transcribir jornadas registradas en papel.
- La arquitectura de integración prevista es: interfaz visual → `RegistroJornadaPage.vue` → `useJornadaAdmin.ts` → `registroJornada.service.ts` → Supabase RPC.
- Los componentes visuales no deben llamar directamente a Supabase ni decidir qué RPC se ejecuta.
- `RegistroJornadaPage.vue` es el orquestador de la pantalla y mantiene el estado de la jornada, los catálogos y el estado del panel de creación de implemento.
- La página compone `JornadaDatosGenerales`, `JornadaDetalle`, `JornadaResumen`, `JornadaAcciones` e `ImplementoCrearPanel`.
- La página delega en `useJornadaAdmin.ts` la validación de continuidad, el registro de implementos y la finalización desde filas.
- `registroJornada.service.ts` es la frontera prevista para las llamadas `supabase.rpc(...)`.
- La vista pertenece al módulo existente Seguimiento y debe aparecer en su mismo grupo de navegación, junto a Tareas y Reportes.
- La ruta canónica definida para la vista es `/seguimiento/registro-jornadas`.
- El acceso a la ruta requiere `module_seguimiento` y `jornadas_admin_ver`.
- La entrada de navegación “Registro de jornadas” se muestra solo cuando el usuario posee `module_seguimiento` y `jornadas_admin_ver`.

### Decisiones de UI

- El documento visual presenta datos generales, detalle de filas, resumen, acciones finales y un panel para registrar implementos.
- El documento visual propone tabla en escritorio, tarjetas para filas en pantallas `sm/xs`, drawer lateral de implemento en escritorio y bottom sheet en `sm/xs`.
- La paleta visual del prototipo utiliza variables de tema como `--color-main`, `--color-second`, `--color-accent` y escalas de grises; una futura implementación debe reutilizar las variables o tokens vigentes del tema principal del proyecto, sin fijar valores hexadecimales en esta SPEC.

### Ejemplos visuales — no son reglas

- Fechas, nombres de operadores, números de equipo, códigos, implementos, duraciones y textos de ejemplo mostrados en el HTML.
- El estado visual “Borrador” mostrado en el encabezado.
- Cualquier identificador o firma de RPC que aparezca solo dentro del prototipo HTML y no esté verificado contra Supabase.

### Pendiente

- Los contratos exactos de Supabase, incluidos parámetros, payloads y respuestas.
- La fuente real de los equipos.
- La semántica operativa de guardar borrador, recuperar una jornada y corregir eventos.
- El alta de los nuevos features en `app_feature` y la autorización equivalente en backend para cada operación sensible.

## Navegación y acceso

### Ubicación

La nueva vista se integra en el grupo existente **Seguimiento** del `DefaultLayout`, como una tercera opción junto a **Tareas** y **Reportes**.

| Elemento                 | Definición                                                    |
| ------------------------ | ------------------------------------------------------------- |
| Etiqueta de navegación   | Registro de jornadas                                          |
| Ruta canónica            | `/seguimiento/registro-jornadas`                              |
| Nombre de ruta propuesto | `RegistroJornadaAdministrativa`                               |
| Vista prevista           | `src/views/seguimiento/RegistroJornadaAdministrativaView.vue` |
| Componente de contenido  | `RegistroJornadaPage.vue`                                     |
| Grupo de navegación      | Seguimiento                                                   |

El nombre de ruta y el archivo de vista son convenciones de implementación derivadas de las rutas existentes de Seguimiento. Deben aplicarse juntos al implementar la navegación; no representan un contrato de backend.

### Protección de ruta y visibilidad

- La ruta debe declarar ambos features en `meta.requiredFeatures`: `module_seguimiento` y `jornadas_admin_ver`.
- El guard global actual evalúa todos los valores de `meta.requiredFeatures`; por ello, ambos features son obligatorios para abrir la ruta directamente.
- La entrada “Registro de jornadas” no debe renderizarse hasta que `useFeatureAccessStore` haya terminado de cargar los permisos.
- Si falta alguno de los dos features requeridos, la ruta debe seguir el fallback ya establecido por el guard global hacia el primer módulo permitido o Perfil.
- La ocultación de la entrada de menú no sustituye la protección de la ruta.
- El grupo Seguimiento debe seguir mostrando las opciones a las que el usuario sí tenga acceso. La nueva vista no debe impedir que Tareas o Reportes se muestren según sus permisos actuales.

### Capacidades

Los siguientes feature keys fueron definidos para esta funcionalidad. `jornadas_admin_ver` es la capacidad base de acceso; las demás habilitan acciones específicas una vez dentro de la vista.

| Feature key                       | Capacidad                                         | Efecto esperado en frontend                                                              |
| --------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `jornadas_admin_ver`              | Ver captura administrativa de jornadas.           | Muestra la entrada de navegación y permite abrir la ruta junto con `module_seguimiento`. |
| `jornadas_admin_crear`            | Crear o editar una jornada administrativa.        | Habilita datos generales, edición de filas, selección de implementos y guardar borrador. |
| `jornadas_admin_finalizar`        | Finalizar una jornada administrativa.             | Habilita “Finalizar y registrar”.                                                        |
| `jornadas_admin_descartar`        | Descartar una jornada administrativa en borrador. | Habilita la acción de descarte cuando esta exista en la interfaz.                        |
| `jornadas_admin_deshacer`         | Deshacer el último evento administrativo.         | Habilita la acción de corrección cuando esta exista en la interfaz.                      |
| `jornadas_admin_crear_implemento` | Registrar implementos desde la jornada.           | Muestra “Registrar nuevo implemento…” y habilita su flujo.                               |

No se debe mostrar como disponible una acción cuyo feature específico no esté concedido. La ruta de lectura no debe exigir `jornadas_admin_crear`, `jornadas_admin_finalizar`, `jornadas_admin_descartar`, `jornadas_admin_deshacer` ni `jornadas_admin_crear_implemento`.

### Seguridad de backend

Los features de frontend controlan descubrimiento y disponibilidad de interfaz. La autorización efectiva de cada operación sensible debe ser comprobada también por Supabase o por el backend antes de ejecutar la operación.

La correspondencia definitiva entre cada feature y una función de backend queda pendiente hasta verificar las firmas y las políticas reales. No se asume que los RPC actuales ya validen estos feature keys.

## Arquitectura

```text
Componentes visuales
        ↓ eventos y enlaces de modelo
RegistroJornadaPage.vue
        ↓ coordinación de acciones
useJornadaAdmin.ts
        ↓ frontera de integración
registroJornada.service.ts
        ↓
Supabase RPC
```

La dirección anterior es la arquitectura objetivo confirmada por las fuentes. Cada capa debe conservar su responsabilidad: los componentes presentan y emiten; la página coordina el estado compartido; el composable concentra reglas y traducciones; el servicio encapsula la integración.

## Orquestación de la pantalla

`RegistroJornadaPage.vue` es la superficie de composición de la pantalla. Según el archivo fuente, realiza las siguientes coordinaciones:

- Mantiene el estado reactivo de la jornada.
- Mantiene colecciones locales de operadores, equipos y catálogos.
- Entrega el modelo de jornada a los componentes de datos generales, detalle y resumen mediante enlaces de modelo.
- Pasa filas y catálogos al detalle de jornada.
- Recibe la solicitud de crear implemento desde el detalle, identifica la fila activa y abre el panel correspondiente.
- Tras recibir un implemento creado desde el panel, lo incorpora al catálogo local si aún no existe y lo asigna a la fila activa.
- Obtiene el estado visible de continuidad mediante el composable y lo entrega al componente de acciones.
- Delega la finalización de la jornada al composable.

## Responsabilidades por capa

| Capa o elemento              | Responsabilidad confirmada                                                                                     | No debe asumir                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Componentes visuales         | Mostrar campos, filas, resumen, acciones o el panel de implementos; emitir cambios y acciones hacia la página. | Decidir la secuencia de RPC o llamar `supabase.rpc(...)`.                  |
| `RegistroJornadaPage.vue`    | Poseer y conectar el estado compartido; coordinar componentes y acciones de alto nivel.                        | Convertir esta SPEC en un contrato de RPC.                                 |
| `useJornadaAdmin.ts`         | Albergar reglas y la traducción de filas a eventos; exponer acciones usadas por la página.                     | Exponer como hechos parámetros o respuestas que no hayan sido verificados. |
| `registroJornada.service.ts` | Encapsular las llamadas `supabase.rpc(...)`.                                                                   | Mezclar decisiones visuales o de presentación.                             |
| Supabase RPC                 | Persistir operaciones administrativas a través de contratos reales.                                            | Ser descrito con una firma inferida desde la interfaz o el mockup.         |

## Flujo entre componentes

```text
JornadaDatosGenerales ─┐
JornadaDetalle ────────┼── cambios de modelo / eventos ──→ RegistroJornadaPage.vue
JornadaResumen ────────┤                                      ↓
JornadaAcciones ───────┘                              useJornadaAdmin.ts
                                                               ↓
                                                    registroJornada.service.ts
                                                               ↓
                                                           Supabase RPC

JornadaDetalle ── evento de crear implemento ──→ RegistroJornadaPage.vue
                                                     ↓
                                            ImplementoCrearPanel
                                                     ↓
                         resultado emitido ──────────┘
                                                     ↓
                         catálogo local y fila activa de la página
```

El segundo flujo describe la coordinación visible en `RegistroJornadaPage.vue`: la página abre el panel a partir de una fila activa y procesa el resultado emitido por dicho panel. El contrato de persistencia de esa creación se documentará en SPEC-05 después de verificarlo.

## Estado / modelo de datos

Esta SPEC define únicamente la titularidad arquitectónica del estado:

- La página posee el estado compartido de la jornada.
- La página mantiene las colecciones usadas por los componentes: operadores, equipos y catálogos.
- La página mantiene qué fila solicitó crear un implemento y si el panel está abierto.

Los nombres definitivos de tipos, campos, identificadores, valores nulos y campos calculados no se establecen aquí. Deben documentarse en SPEC-01 usando `registroJornada.types.ts` como fuente principal.

## Reglas funcionales

- La pantalla se destina a la transcripción administrativa de jornadas registradas en papel.
- La vista se accede desde Seguimiento mediante `/seguimiento/registro-jornadas`.
- La lectura de la vista exige `module_seguimiento` y `jornadas_admin_ver`.
- La UI no debe elegir qué RPC ejecutar.
- La UI no debe llamar Supabase directamente.
- La página debe coordinar el panel de nuevo implemento con la fila que lo solicitó.
- La integración con Supabase debe pasar por `registroJornada.service.ts`.
- Cada acción sensible debe depender de su feature específico en frontend y de una autorización real en backend.

## Contrato entre componentes

Esta SPEC fija el contrato arquitectónico, no las firmas definitivas de props, emits ni tipos:

- Los componentes descendientes reciben datos desde `RegistroJornadaPage.vue` y notifican cambios o acciones hacia la página.
- `JornadaDetalle` puede solicitar a la página la creación de un implemento para una fila.
- `ImplementoCrearPanel` notifica a la página el resultado de su acción de creación.
- `JornadaAcciones` recibe el estado de validez y de guardado desde la página, y notifica acciones de guardar o finalizar.

Las firmas exactas deben verificarse en los archivos de tipos y componentes correspondientes antes de congelarlas en SPECS posteriores.

## RPC involucrados

La documentación del módulo nombra los siguientes RPC como parte de la integración administrativa:

- `rpc_admin_listar_operadores`
- `rpc_obtener_catalogos_offline`
- `rpc_admin_obtener_jornada`
- `rpc_admin_iniciar_jornada`
- `rpc_admin_cambiar_labor`
- `rpc_admin_registrar_parada`
- `rpc_admin_cambiar_tipo_parada`
- `rpc_admin_reanudar_trabajo`
- `rpc_admin_confirmar_cambio_implemento`
- `rpc_admin_finalizar_jornada`
- `rpc_admin_registrar_implemento`

Esta lista no constituye una definición contractual. No se documentan parámetros, payloads, respuestas, orden de invocación ni comportamiento ante error hasta consultar la firma real en Supabase y las fuentes de las SPECS específicas.

## Validaciones

La validación de continuidad es una responsabilidad expuesta por `useJornadaAdmin.ts` y consumida por la página para mostrar el estado de acciones.

Las reglas exactas de continuidad, las validaciones de campos, los bloqueos de envío y la presentación de errores quedan fuera de alcance de esta SPEC y deben definirse en SPEC-08.

## Estados de error

No hay contrato de errores documentado por las fuentes autorizadas para esta SPEC. La taxonomía de errores de frontend, catálogos, RPC y sincronización debe definirse en SPEC-08 tras revisar las fuentes aplicables y, cuando corresponda, Supabase.

## Responsive

Como decisión visual de referencia, el HTML propone:

- Escritorio: detalle en tabla y panel lateral para crear implementos.
- `sm/xs`: detalle en tarjetas y bottom sheet para crear implementos.

La especificación responsive completa, incluyendo medidas, interacciones táctiles y criterios de accesibilidad, se congela en SPEC-09. La implementación futura debe priorizar los tamaños base `xs` y `sm`, reutilizando los tokens de tema existentes.

## Criterios de aceptación

- La entrada “Registro de jornadas” se presenta dentro del grupo Seguimiento, junto a Tareas y Reportes.
- Un usuario con `module_seguimiento` y `jornadas_admin_ver` puede navegar a `/seguimiento/registro-jornadas`.
- Un usuario sin `jornadas_admin_ver` no ve la entrada ni puede abrir directamente la ruta.
- Un usuario con acceso de vista pero sin `jornadas_admin_crear` puede consultar la vista, pero no puede modificar datos ni guardar borrador.
- “Finalizar y registrar” solo está disponible con `jornadas_admin_finalizar`.
- La opción de registrar implemento solo está disponible con `jornadas_admin_crear_implemento`.
- Las acciones de descartar y deshacer, cuando se implementen, solo están disponibles con sus features específicos.
- La protección de ruta no depende únicamente de ocultar el menú.
- La documentación identifica a `RegistroJornadaPage.vue` como orquestador de la pantalla.
- La documentación muestra el flujo completo UI → página → composable → servicio → Supabase RPC.
- Ningún componente visual recibe la responsabilidad de ejecutar o decidir un RPC.
- La creación de implemento queda coordinada por la página con una fila activa y un panel de creación.
- Los contratos de RPC no incluyen parámetros, payloads, respuestas, tablas ni columnas inferidos.
- Las decisiones del mockup visual quedan diferenciadas de las reglas confirmadas.
- El documento remite los modelos detallados, la persistencia, validaciones, borradores, responsive detallado y pruebas a sus SPECS correspondientes.

## Casos límite

- Si el usuario pierde `jornadas_admin_ver` durante la sesión y se recalculan sus accesos, la navegación y la ruta deben aplicar el mismo mecanismo global de protección del proyecto; el momento de refresco de permisos debe verificarse antes de implementar.
- Si el usuario tiene `jornadas_admin_ver` pero no tiene `jornadas_admin_crear`, la interfaz debe conservar una presentación de solo lectura. Sus controles exactos se definen en SPEC-02, SPEC-03 y SPEC-08.
- Si el usuario puede crear jornadas pero no puede crear implementos, debe poder seleccionar las opciones permitidas sin visualizar la opción de registrar uno nuevo.
- Si una firma de RPC difiere de la referencia visual, prevalece la función real de Supabase y esta SPEC debe actualizarse para reflejar la frontera de integración sin inventar el contrato.
- Si una fuente de componentes contradice el mockup HTML, el mockup se trata como referencia visual y no como autoridad de reglas de negocio.
- Si la fila activa deja de estar disponible antes de recibir el resultado del panel de implemento, el comportamiento esperado no está definido por las fuentes autorizadas; debe resolverse en SPEC-05.
- Si se requiere cargar o recuperar una jornada existente, el mecanismo y su manejo de errores permanecen pendientes para SPEC-07.

## Pendientes / preguntas abiertas

| Información faltante                                       | Por qué es necesaria                                                                   | Fuente que debe verificarse                                                              |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Firmas reales de los RPC administrativos y de catálogos    | Para documentar contratos, secuencias, payloads, respuestas y errores sin inferencias. | Supabase y `documentacion/formulario_captura_padas/services/registroJornada.service.ts`. |
| Tipos y forma definitiva del estado de jornada y catálogos | Para formalizar props, emits, titularidad de campos y nulabilidad.                     | `documentacion/formulario_captura_padas/registroJornada.types.ts`.                       |
| Reglas de transformación de filas en eventos               | Para definir qué operación se ejecuta en cada transición sin inventar comportamiento.  | `documentacion/formulario_captura_padas/composables/useJornadaAdmin.ts` y Supabase.      |
| Mecanismo de borrador, recuperación y correcciones         | Para saber cuándo se persiste, recupera o deshace una jornada.                         | `useJornadaAdmin.ts`, `registroJornada.service.ts` y Supabase.                           |
| Fuente existente del catálogo de equipos                   | Para integrar el selector sin crear ni asumir una fuente administrativa nueva.         | Catálogo de equipos vigente del ERP y `JornadaDatosGenerales.vue`.                       |
| Alta de los seis feature keys                              | Para que las capacidades documentadas puedan resolverse desde `app_feature_access`.    | Datos y administración de `app_feature` y `app_feature_access`.                          |
| Autorización backend por capacidad                         | Para impedir que un cliente omita los controles visuales y ejecute acciones sensibles. | Supabase, políticas y RPC administrativos reales.                                        |

## Tabla de trazabilidad

| Regla o decisión                                                                           | Clasificación  | Fuente exacta                                                                                   |
| ------------------------------------------------------------------------------------------ | -------------- | ----------------------------------------------------------------------------------------------- |
| El módulo transcribe jornadas registradas en papel al modelo de eventos de captura normal. | Confirmado     | `INDEX_SPECS.md`, sección 1.                                                                    |
| La integración sigue UI → página → composable → servicio → Supabase RPC.                   | Confirmado     | `README.md`, sección “Principio de integración”; `INDEX_SPECS.md`, sección 1.                   |
| Los componentes visuales no llaman Supabase directamente ni deciden RPC.                   | Confirmado     | `README.md`, sección “Principio de integración”; `INDEX_SPECS.md`, secciones 1 y 3.             |
| La página compone datos generales, detalle, resumen, acciones y panel de implemento.       | Confirmado     | `RegistroJornadaPage.vue`, bloque `<template>`.                                                 |
| La página controla estado compartido, fila activa y apertura del panel de implemento.      | Confirmado     | `RegistroJornadaPage.vue`, bloque `<script setup>`.                                             |
| La página usa el composable para continuidad, registro de implemento y finalización.       | Confirmado     | `RegistroJornadaPage.vue`, bloque `<script setup>`.                                             |
| El servicio es la única capa que conoce `supabase.rpc(...)`.                               | Confirmado     | `INDEX_SPECS.md`, apartado `registroJornada.service.ts`.                                        |
| Seguimiento ya agrupa Tareas y Reportes en sus rutas y navegación.                         | Confirmado     | `src/router/index.ts`; `src/layouts/DefaultLayout.vue`.                                         |
| La vista se mostrará junto a Tareas y Reportes.                                            | Confirmado     | Decisión proporcionada por usuario.                                                             |
| La ruta será `/seguimiento/registro-jornadas`.                                             | Confirmado     | Decisión arquitectónica incorporada a esta SPEC, siguiendo `src/router/index.ts`.               |
| Los seis feature keys de jornadas administrativas controlan capacidades separadas.         | Confirmado     | Decisión proporcionada por usuario: permisos de jornadas administrativas.                       |
| La ruta requiere todos los features declarados en `meta.requiredFeatures`.                 | Confirmado     | `src/router/index.ts`, guard global y función `getRequiredFeatures`.                            |
| Tabla en escritorio, tarjetas en móvil, drawer y bottom sheet.                             | Decisión de UI | `registro_jornada_integracion_completa.html`, secciones de responsive y `ImplementoCrearPanel`. |
| Valores concretos mostrados en el mockup.                                                  | Ejemplo visual | `registro_jornada_integracion_completa.html`, markup de la pantalla.                            |
