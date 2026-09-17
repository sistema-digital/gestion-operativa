# SPEC-01 — Loader de validación de sesión

## Objetivo

Evitar que el usuario vea una pantalla vacía o contenido sin autorización al abrir la aplicación en una nueva pestaña o al navegar a una ruta protegida. La aplicación debe mantener una pantalla de bloqueo hasta conocer el resultado de la validación de sesión con Supabase Auth.

## Alcance

- Sustituir el loader inicial basado en un tiempo fijo por un estado real de validación de autenticación.
- Validar la sesión mediante `supabase.auth.getSession()` antes de resolver una ruta protegida.
- Cargar las funcionalidades permitidas solo después de confirmar que la sesión es válida.
- Ofrecer reintento cuando la validación exceda el tiempo límite o falle por un error recuperable.
- Redirigir a Login cuando no exista una sesión válida.

## Estados

| Estado       | Condición                                                            | Interfaz                                                     | Acción disponible                 |
| ------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------- |
| `validando`  | Inicia la aplicación o una navegación protegida.                     | Loader a pantalla completa y texto `Validando credenciales`. | Ninguna.                          |
| `timeout`    | La validación no termina en 10 segundos.                             | Mensaje de demora y botón `Reintentar`.                      | Repetir la validación completa.   |
| `error`      | Ocurre un error recuperable al consultar Auth o las funcionalidades. | Mensaje de error y botón `Reintentar`.                       | Repetir la validación completa.   |
| `sin_sesion` | `getSession()` no devuelve una sesión válida.                        | No se muestra contenido protegido.                           | Redirección inmediata a `/login`. |
| `autorizado` | Existe sesión válida y se cargaron sus funcionalidades.              | Se oculta el loader y se resuelve la ruta.                   | Navegación normal.                |

## Flujo funcional

1. Al montar la aplicación o iniciar una navegación hacia una ruta protegida, activar el estado `validando` antes de llamar a Supabase.
2. Ejecutar `supabase.auth.getSession()` con un límite de 10 segundos.
3. Si no se obtiene una sesión válida, establecer `sin_sesion`, cancelar la navegación protegida y redirigir a `/login`.
4. Si existe sesión, obtener las funcionalidades permitidas del usuario.
5. Si las funcionalidades se cargan correctamente, establecer `autorizado` y aplicar los guards actuales de permisos y rutas.
6. Si la consulta excede 10 segundos, establecer `timeout`. El loader debe dejar de girar y presentar el botón `Reintentar`.
7. Si ocurre un error recuperable, establecer `error` y presentar el botón `Reintentar`.
8. Al pulsar `Reintentar`, reiniciar el flujo desde `getSession()`, limpiar el error anterior y volver a mostrar `Validando credenciales`.

## Reglas de negocio

- Nunca se debe mostrar una ruta protegida antes de completar la validación de sesión y permisos.
- No se deben ejecutar validaciones simultáneas: mientras una esté en curso, el botón de reintento debe estar deshabilitado.
- El timeout no invalida una sesión; solo indica que no se pudo comprobar dentro del límite y permite reintentar.
- Una respuesta sin sesión, una sesión expirada o una sesión que Supabase considere inválida se tratan como `sin_sesion` y redirigen a Login.
- El loader inicial actual no debe desaparecer por un temporizador; debe depender únicamente de este estado.
- La página de Login no debe quedar bloqueada por este loader.

## Criterios de aceptación

- Al abrir la aplicación en una pestaña nueva, se muestra `Validando credenciales` hasta que Auth responda.
- Si Auth responde con una sesión válida, el usuario llega a la primera ruta autorizada sin ver contenido intermedio vacío.
- Si Auth no devuelve sesión válida, el usuario termina en `/login` y no puede visualizar la ruta solicitada.
- Si Auth o la carga de funcionalidades tarda más de 10 segundos, se muestra `Reintentar`.
- Al seleccionar `Reintentar`, se ejecuta de nuevo la validación y el estado vuelve a `validando`.
- Si una navegación entre módulos requiere una nueva validación, se aplica el mismo bloqueo visual hasta resolverla.

## Consideraciones técnicas

- Centralizar el estado de validación para que `App.vue` y el guard del router consuman una única fuente de verdad.
- El guard debe esperar el resultado de la validación centralizada en lugar de gestionar un loader local por ruta.
- Mantener `featureAccessStore.cargarFuncionalidadesPermitidas()` como fuente de permisos, evitando solicitudes duplicadas mediante su promesa compartida actual.
- Probar el flujo con Auth exitoso, sin sesión, timeout y error recuperable.
