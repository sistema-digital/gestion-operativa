# Índice e instrucciones para crear SPECS
## Módulo: Registro administrativo de jornadas

Este archivo sirve como **índice de lectura**, **guía para convertir los archivos actuales en especificaciones funcionales/técnicas** y **lista de SPECS recomendadas** para implementar el módulo en Vue 3 + TypeScript + Tailwind + Supabase.

---

## 1. Objetivo del paquete

El paquete documenta una pantalla administrativa para transcribir jornadas registradas en papel y convertirlas al mismo modelo de eventos utilizado por la captura normal.

La UI está dividida en componentes Vue y la persistencia se separa en:

```text
Componentes visuales
        ↓
RegistroJornadaPage.vue
        ↓
useJornadaAdmin.ts
        ↓
registroJornada.service.ts
        ↓
Supabase RPC
```

Principio principal:

> Los componentes visuales no deben decidir qué RPC ejecutar ni llamar Supabase directamente.

---

# 2. Índice de archivos

## 2.1 Documento visual completo

### `registro_jornada_integracion_completa.html`

**Leer primero.**

Es la referencia visual del módulo completo y muestra:

- layout general;
- cabecera de jornada;
- tabla / tarjetas móviles;
- código de labor o causa;
- implemento;
- drawer de nuevo implemento en escritorio;
- bottom sheet en móvil;
- resumen;
- acciones finales.

### Uso al crear SPECS

Úsalo como fuente para:

- distribución visual;
- jerarquía de información;
- comportamiento responsive;
- orden de los campos;
- interacción general.

### No usarlo como fuente exclusiva para

- contratos exactos de RPC;
- tipos TypeScript definitivos;
- reglas complejas de persistencia.

---

# 3. Orden recomendado de lectura

Para generar una SPEC correctamente, leer los archivos en este orden:

```text
1. registro_jornada_integracion_completa.html
        ↓
2. registroJornada.types.ts
        ↓
3. RegistroJornadaPage.vue
        ↓
4. components/JornadaDatosGenerales.vue
        ↓
5. components/JornadaDetalle.vue
        ↓
6. components/JornadaFila.vue
        ↓
7. components/ImplementoSelect.vue
        ↓
8. components/ImplementoCrearPanel.vue
        ↓
9. components/JornadaResumen.vue
        ↓
10. components/JornadaAcciones.vue
        ↓
11. composables/useJornadaAdmin.ts
        ↓
12. services/registroJornada.service.ts
```

Después de eso, revisar `README.md` como resumen.

---

# 4. Qué aporta cada archivo a las SPECS

## `registroJornada.types.ts`

Fuente principal para definir:

- shape del estado;
- contratos entre componentes;
- modelos de filas;
- catálogos;
- tipos de actividad;
- implementos.

Usarlo para crear la sección:

```md
## Modelo de datos frontend
```

---

## `RegistroJornadaPage.vue`

Fuente principal para definir:

- qué componente posee el estado;
- cómo se conectan los hijos;
- qué eventos suben;
- qué estado es global a la pantalla;
- cuándo se abre el panel de implemento;
- cómo se asigna un implemento recién creado.

Usarlo para:

```md
## Orquestación de la pantalla
## Flujo entre componentes
## Estado compartido
```

---

## `JornadaDatosGenerales.vue`

Define:

- fecha;
- operador;
- equipo;
- área.

Usarlo para:

```md
## Datos generales
## Campos requeridos
## Catálogos requeridos
```

RPC relacionado:

```text
rpc_admin_listar_operadores
```

La fuente de equipos debe reutilizar el catálogo actual del ERP.

---

## `JornadaDetalle.vue`

Define:

- colección de filas;
- agregar fila;
- eliminar fila;
- propagación de eventos.

Usarlo para:

```md
## Gestión de filas
## Reglas de colección
```

RPC directo:

```text
ninguno
```

---

## `JornadaFila.vue`

Es uno de los archivos más importantes.

Define:

- hora inicio;
- hora fin;
- código;
- resolución automática de actividad;
- implemento;
- duración;
- eliminación.

La UI **no debe pedir el tipo**.

El código determina automáticamente si corresponde a:

```text
labor
o
parada
```

Usarlo para:

```md
## Regla de resolución por código
## Comportamiento de una fila
## Validaciones por fila
```

RPC directo:

```text
ninguno
```

---

## `ImplementoSelect.vue`

Define tres posibilidades:

```text
Sin implemento
Implemento existente
Registrar nuevo implemento
```

Valor especial de UI:

```text
__nuevo__
```

Este valor nunca debe persistirse en la base de datos.

Usarlo para:

```md
## Selección de implementos
## Flujo de implemento faltante
```

---

## `ImplementoCrearPanel.vue`

Define:

```text
desktop → drawer derecho
sm/xs   → bottom sheet
```

Campos:

```text
Número              requerido
Tipo                requerido
Nombre/descripción  opcional
```

RPC asociado:

```text
rpc_admin_registrar_implemento
```

Payload conceptual:

```ts
{
  p_numero,
  p_tipo_implemento_id,
  p_nombre
}
```

Al completar:

```text
crear implemento
      ↓
obtener UUID
      ↓
agregarlo al catálogo local
      ↓
seleccionarlo automáticamente en la fila que abrió el panel
```

---

## `JornadaResumen.vue`

Define:

- observaciones;
- inicio total;
- fin total;
- duración total.

RPC:

```text
ninguno
```

Usarlo para:

```md
## Resumen calculado
```

---

## `JornadaAcciones.vue`

Define:

- validación visible;
- guardar borrador;
- finalizar y registrar.

No debe llamar Supabase directamente.

Usarlo para:

```md
## Acciones
## Estados de carga
## Habilitación/deshabilitación de botones
```

---

## `useJornadaAdmin.ts`

Es la principal fuente para la **SPEC de negocio**.

Debe contener:

- validaciones;
- continuidad;
- resolución de códigos;
- traducción de filas a eventos;
- secuencia de persistencia.

Flujo conceptual:

```text
Fila inicial
   ↓
iniciar jornada

labor → labor
   ↓
cambiar labor

labor → parada
   ↓
registrar parada

parada → labor
   ↓
reanudar

parada → parada
   ↓
cambiar causa

cambio de implemento
   ↓
confirmar cambio de implemento

última hora
   ↓
finalizar jornada
```

RPC involucrados:

```text
rpc_admin_iniciar_jornada
rpc_admin_cambiar_labor
rpc_admin_registrar_parada
rpc_admin_cambiar_tipo_parada
rpc_admin_reanudar_trabajo
rpc_admin_confirmar_cambio_implemento
rpc_admin_finalizar_jornada
```

---

## `registroJornada.service.ts`

Fuente principal para la **SPEC de integración Supabase**.

Debe ser el único lugar que conozca:

```ts
supabase.rpc(...)
```

RPC listados actualmente:

```text
rpc_admin_listar_operadores
rpc_obtener_catalogos_offline
rpc_admin_obtener_jornada
rpc_admin_iniciar_jornada
rpc_admin_cambiar_labor
rpc_admin_registrar_parada
rpc_admin_cambiar_tipo_parada
rpc_admin_reanudar_trabajo
rpc_admin_confirmar_cambio_implemento
rpc_admin_finalizar_jornada
rpc_admin_deshacer_ultimo_evento
rpc_admin_registrar_implemento
```

---

# 5. Cómo crear una SPEC a partir de estos archivos

Cada SPEC debe construirse con esta estructura mínima:

```md
# SPEC-XX — Nombre

## Objetivo

## Alcance

## Fuera de alcance

## Fuentes
- archivo A
- archivo B

## Reglas funcionales

## Estado / modelo de datos

## Flujo

## Contrato entre componentes

## RPC involucrados

## Validaciones

## Estados de error

## Responsive

## Criterios de aceptación

## Casos límite

## Pendientes / preguntas abiertas
```

---

# 6. Regla de fuentes

Al escribir una SPEC usar esta prioridad:

```text
1. Backend/RPC real
2. tipos TypeScript
3. composable
4. page
5. componentes
6. HTML visual
```

Esto evita que un dato decorativo del mockup se convierta accidentalmente en una regla de negocio.

Ejemplo:

Si el HTML muestra:

```text
439008
```

eso es un ejemplo visual.

No significa que la SPEC deba fijar ese implemento.

---

# 7. No inventar contratos

Algunos archivos contienen placeholders como:

```ts
Record<string, unknown>
```

Eso significa:

> El contrato exacto del RPC todavía no está documentado en ese archivo.

Antes de escribir una SPEC contractual de ese RPC se debe revisar su firma real en Supabase.

No asumir nombres de parámetros solo por cómo se ve la UI.

---

# 8. SPECS recomendadas

Recomiendo separar el módulo en **10 SPECS**.

---

## SPEC-00 — Alcance y arquitectura

### Objetivo

Definir:

- qué resuelve el módulo;
- responsabilidades de frontend/backend;
- arquitectura de componentes;
- principio UI → composable → service → RPC.

### Archivos fuente

```text
registro_jornada_integracion_completa.html
RegistroJornadaPage.vue
README.md
```

---

## SPEC-01 — Modelo de datos frontend

### Objetivo

Definir exactamente:

- `JornadaState`;
- `JornadaFilaModel`;
- catálogos;
- IDs;
- nullability;
- campos calculados.

### Archivo principal

```text
registroJornada.types.ts
```

---

## SPEC-02 — Datos generales y carga inicial

### Objetivo

Definir:

- fecha;
- operador;
- equipo;
- área;
- carga de operadores;
- carga de catálogos;
- estado inicial.

### Archivos

```text
JornadaDatosGenerales.vue
RegistroJornadaPage.vue
registroJornada.service.ts
```

### RPC

```text
rpc_admin_listar_operadores
rpc_obtener_catalogos_offline
```

---

## SPEC-03 — Captura y edición de filas

### Objetivo

Definir:

- agregar fila;
- eliminar fila;
- copia de hora anterior;
- cálculo de duración;
- continuidad;
- edición;
- orden cronológico.

### Archivos

```text
JornadaDetalle.vue
JornadaFila.vue
useJornadaAdmin.ts
```

---

## SPEC-04 — Resolución automática de código

### Objetivo

Documentar una sola regla oficial:

```text
Código ingresado
      ↓
buscar labor.orden
      ↓
si no existe
buscar tipo_parada.orden
      ↓
resolver:
id
nombre
tipo interno
```

La UI no muestra selector de tipo.

### Archivos

```text
JornadaFila.vue
useJornadaAdmin.ts
registroJornada.types.ts
```

### Punto que debe verificarse antes de implementar

Confirmar en backend que tanto `labor` como `tipo_parada` poseen el campo/código utilizado para esta resolución.

---

## SPEC-05 — Gestión de implementos

### Objetivo

Definir:

- seleccionar implemento;
- sin implemento;
- implemento inexistente en catálogo;
- creación;
- selección automática posterior.

### Archivos

```text
ImplementoSelect.vue
ImplementoCrearPanel.vue
RegistroJornadaPage.vue
registroJornada.service.ts
```

### RPC

```text
rpc_admin_registrar_implemento
```

---

## SPEC-06 — Traducción de filas a eventos administrativos

### Objetivo

Esta debe ser la SPEC central de persistencia.

Debe especificar la máquina de transición:

```text
labor → labor
labor → parada
parada → labor
parada → parada
implemento A → implemento B
inicio
final
```

y qué RPC corresponde a cada transición.

### Archivos

```text
useJornadaAdmin.ts
registroJornada.service.ts
```

### RPC

```text
rpc_admin_iniciar_jornada
rpc_admin_cambiar_labor
rpc_admin_registrar_parada
rpc_admin_cambiar_tipo_parada
rpc_admin_reanudar_trabajo
rpc_admin_confirmar_cambio_implemento
rpc_admin_finalizar_jornada
```

### Prioridad

**Alta.**

No conviene comenzar la integración real sin cerrar esta SPEC.

---

## SPEC-07 — Borradores, recuperación y correcciones

### Objetivo

Definir:

- cuándo existe un borrador;
- cómo se recupera;
- edición;
- qué pasa si el usuario sale;
- deshacer último evento;
- reintentos;
- idempotencia.

### RPC

```text
rpc_admin_obtener_jornada
rpc_admin_deshacer_ultimo_evento
```

También debe documentar qué RPC o mecanismo se utilizará para listar borradores existentes.

---

## SPEC-08 — Validaciones y errores

### Objetivo

Definir todos los bloqueos antes de enviar:

```text
fecha requerida
operador requerido
equipo requerido
al menos una fila
inicio requerido
fin requerido
fin > inicio
sin espacios
sin solapamientos
código válido
implemento válido
```

Y separar:

```text
error frontend
error de catálogo
error RPC
error de sincronización
```

### Archivos

```text
useJornadaAdmin.ts
JornadaFila.vue
JornadaAcciones.vue
```

---

## SPEC-09 — Responsive y UX

### Objetivo

Congelar el comportamiento visual.

### Desktop

```text
tabla
drawer lateral
```

### sm/xs

```text
filas como tarjetas
bottom sheet
acciones adaptadas
inputs táctiles
```

### Archivo fuente principal

```text
registro_jornada_integracion_completa.html
```

---

## SPEC-10 — Pruebas y criterios de aceptación

### Objetivo

Convertir las reglas anteriores en pruebas.

Casos mínimos recomendados:

```text
1. jornada solo con labores
2. labor → parada → labor
3. parada → parada con cambio de causa
4. cambio de labor
5. cambio de implemento
6. sin implemento
7. crear implemento faltante
8. código inexistente
9. hueco entre filas
10. solapamiento
11. fin anterior al inicio
12. doble click al finalizar
13. RPC falla a mitad de secuencia
14. recuperar borrador
15. móvil sm/xs
```

---

# 9. Orden recomendado para escribir las SPECS

No escribirlas en orden numérico solamente.

Orden de trabajo recomendado:

```text
SPEC-00 Arquitectura
        ↓
SPEC-01 Modelo frontend
        ↓
SPEC-04 Resolución de código
        ↓
SPEC-06 Filas → eventos
        ↓
SPEC-08 Validaciones
        ↓
SPEC-05 Implementos
        ↓
SPEC-02 Datos generales
        ↓
SPEC-07 Borradores
        ↓
SPEC-09 Responsive
        ↓
SPEC-10 Pruebas
```

La razón es que **SPEC-06** define la parte más sensible del módulo.

La UI puede verse correcta aunque la traducción a eventos sea incorrecta.

---

# 10. Qué SPECS recomiendo cerrar antes de programar

Antes de implementar completamente el módulo deberían estar cerradas:

```text
OBLIGATORIAS
├─ SPEC-00 Arquitectura
├─ SPEC-01 Modelo
├─ SPEC-04 Resolución de código
├─ SPEC-05 Implementos
├─ SPEC-06 Filas → eventos
└─ SPEC-08 Validaciones
```

Después pueden completarse:

```text
SPEC-02 Datos generales
SPEC-07 Borradores
SPEC-09 Responsive
SPEC-10 Pruebas
```

---

# 11. Criterio para considerar una SPEC lista

Una SPEC está lista para implementación cuando puede responder sin ambigüedad:

```text
¿Qué muestra la UI?
¿Qué dato modifica?
¿Quién posee ese estado?
¿Qué evento emite?
¿Qué validación aplica?
¿Qué RPC termina ejecutándose?
¿Qué payload utiliza?
¿Qué respuesta espera?
¿Qué ocurre si falla?
¿Qué pasa en móvil?
¿Cómo se prueba?
```

Si una de esas preguntas no puede responderse, la SPEC todavía tiene un hueco.

---

# 12. Recomendación de carpeta para las SPECS

```text
specs/
├── SPEC-00-arquitectura.md
├── SPEC-01-modelo-frontend.md
├── SPEC-02-datos-generales.md
├── SPEC-03-captura-filas.md
├── SPEC-04-resolucion-codigo.md
├── SPEC-05-implementos.md
├── SPEC-06-traduccion-eventos.md
├── SPEC-07-borradores.md
├── SPEC-08-validaciones-errores.md
├── SPEC-09-responsive-ux.md
└── SPEC-10-pruebas-aceptacion.md
```

---

# 13. Instrucción para un agente que vaya a generar las SPECS

Puedes darle esta instrucción:

```text
Lee primero INDEX_SPECS.md.

Después revisa los archivos en el orden indicado.

No inventes contratos RPC.
Cuando un payload no esté definido de forma exacta en los archivos,
consulta la firma real de la función en Supabase antes de documentarlo.

Distingue claramente:
- reglas confirmadas;
- decisiones de UI;
- datos de ejemplo;
- pendientes.

Usa registro_jornada_integracion_completa.html únicamente como referencia
visual y de interacción.

Usa registroJornada.types.ts como referencia principal del estado frontend.

Usa useJornadaAdmin.ts como ubicación prevista para reglas y traducción de
filas a eventos.

Usa registroJornada.service.ts como frontera de integración con Supabase.

Genera cada SPEC como un documento independiente y termina cada una con
criterios de aceptación verificables.
```

---

# 14. Fuente de verdad final

Cuando haya contradicción entre documentos, resolver en este orden:

```text
Backend real / RPC actual
        ↓
SPEC aprobada
        ↓
types
        ↓
composable
        ↓
componentes Vue
        ↓
HTML de referencia
```

Cuando las SPECS estén aprobadas, las SPECS pasan a ser la referencia funcional del frontend, mientras que los contratos de backend continúan gobernados por las funciones reales de Supabase.
