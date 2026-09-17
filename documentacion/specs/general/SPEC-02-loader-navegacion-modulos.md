# SPEC-02 — Loader de navegación entre módulos

## Objetivo

Informar al usuario mientras Vue Router resuelve guards y descarga de forma lazy el JavaScript de un módulo al cambiar de ruta.

## Alcance

- Activar un overlay global en toda navegación hacia un módulo distinto de Login.
- Mostrar el texto `Cargando módulo` mientras la navegación esté pendiente.
- Ocultar el overlay al completar la navegación.
- Si falla la carga de un componente lazy o un error no controlado impide la navegación, ocultar el overlay y mostrar un toast de error.

## Flujo

1. El guard `beforeEach` detecta una navegación a una ruta diferente de Login y activa el estado global de carga.
2. Vue Router resuelve autenticación, permisos y el componente lazy de la ruta solicitada.
3. Si la navegación se confirma, `afterEach` desactiva el estado global de carga.
4. Si Vue Router informa un error, el handler `onError` desactiva el loader e incrementa el evento global de error.
5. `App.vue` observa ese evento y muestra un toast: `Error de carga` / `No se pudo cargar el módulo. Intenta nuevamente.`

## Reglas de negocio

- El error de descarga no redirige al usuario; debe permanecer en la ruta que ya estaba visible cuando sea posible.
- El toast no expone detalles técnicos del error.
- Login no muestra el loader de navegación de módulos.
- El overlay debe bloquear interacciones mientras está visible.
- El estado del loader debe centralizarse en un store de Pinia para que router y la interfaz consuman la misma fuente de verdad.

## Criterios de aceptación

- En la primera entrada a un módulo lazy, se muestra `Cargando módulo` hasta que su vista está lista.
- En cambios posteriores al mismo módulo ya descargado, el loader puede mostrarse brevemente mientras los guards resuelven, sin dejar una pantalla vacía.
- Si el chunk del módulo no puede descargarse, el loader se oculta y se muestra el toast de error.
- Ante ese error, no se redirige automáticamente a otra ruta.
