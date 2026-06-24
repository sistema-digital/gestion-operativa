ESPECIFICACION COMPLEMENTARIA — PRODUCTO TEMPORAL CON UNIDADES DINAMICAS
MODULO: Compras / Solicitudes de compra
SUBFLUJO: Paso 2 / Productos / Creacion y edicion de producto temporal
FECHA DE CONTEXTO: 2026-06-24
PROYECTO: gestion operativa / solicitudes compras

=====================================================================
1. OBJETIVO
=====================================================================

Definir el ajuste funcional, tecnico y visual para la creacion manual de productos temporales dentro del paso 2 del wizard de solicitudes de compra.

Esta especificacion reemplaza el enfoque inicial de unidades hardcodeadas.

Nuevo enfoque obligatorio:

- Las unidades de medida deben cargarse desde la tabla `public.unidad_medida`.
- Debe crearse una carpeta `unidad` dentro del dominio `db_compras`.
- Debe crearse un service para consultar las unidades activas.
- Ese service debe ser consumido por un composable.
- El composable debe ser consumido por el formulario de producto temporal.
- El selector de unidad ya no sera libre ni local; sera un buscador basado en datos reales.

=====================================================================
2. ALCANCE
=====================================================================

Incluye:

- Apertura de formulario de producto temporal desde paso 2.
- Variante responsive:
  - `lg`: drawer lateral derecho.
  - `md` y `sm`: bottom sheet.
- Carga dinamica de unidades desde BD.
- Edicion solo para productos temporales.
- Integracion del formulario con el estado actual del wizard.
- Normalizacion visual de opciones de unidad usando descripcion como valor visible.

No incluye:

- Edicion de productos existentes.
- Cambio del flujo de productos existentes.
- Replanteamiento del store principal fuera de lo necesario para soportar producto temporal.
- Cambios al flujo de servicios.

=====================================================================
3. REGLAS FUNCIONALES DEL PRODUCTO TEMPORAL
=====================================================================

3.1 Apertura del formulario

El formulario de producto temporal puede abrirse de dos maneras:

1. Desde el boton manual:
- Debe abrir el formulario vacio.

2. Desde la fila manual en resultados de busqueda:
- Debe abrir el formulario con la descripcion precargada usando el texto actual del input de busqueda.

3.2 Edicion

- Solo los productos temporales pueden editarse.
- Los productos existentes solo pueden eliminarse.
- Al editar un temporal, el formulario debe abrirse con los datos actuales del item:
  - descripcion
  - unidad seleccionada
  - notas

3.3 Cierre del overlay

La unica accion permitida para cerrar el drawer o bottom sheet debe ser `Cancelar`.

No cerrar por:

- click fuera
- overlay click
- tecla escape
- gesto de swipe para dismiss en mobile
- boton de cerrar tipo `X`, salvo que esa accion sea equivalente explicita a `Cancelar`

3.4 Guardado

Acciones del formulario:

- `Cancelar`
- `Agregar` cuando es alta
- `Guardar cambios` cuando es edicion

No debe existir accion `Agregar y seguir creando` en esta primera implementacion.

Al guardar:

- si es alta, se agrega un nuevo producto temporal al listado del paso 2.
- si es edicion, se actualiza el item temporal existente.
- al completar la accion, el overlay se cierra.

=====================================================================
4. COMPORTAMIENTO RESPONSIVE DEL OVERLAY
=====================================================================

4.1 Desktop `lg`

- El formulario debe abrir en drawer lateral derecho.
- Debe mostrarse un overlay sobre el contenido del paso 2.
- El contenido de fondo debe verse borroso.
- El usuario debe seguir percibiendo que esta dentro del paso 2 del wizard.

4.2 Tablet y mobile `md` / `sm`

- El formulario debe abrir como bottom sheet.
- El bottom sheet debe crecer segun el contenido.
- Debe usar scroll interno solo si el contenido excede la altura disponible.
- Debe compartir las mismas reglas de cierre estricto que el drawer.

=====================================================================
5. ESTRUCTURA VISUAL DEL FORMULARIO
=====================================================================

El formulario de producto temporal debe tener layout vertical estricto.

Regla obligatoria:

- Cada grupo visual debe ocupar una fila completa.
- La estructura debe ser `label` arriba y `input` abajo.
- No usar dos campos lado a lado en la misma fila en esta primera version.

Campos:

1. Descripcion
2. Unidad de medida
3. Notas opcionales

Orden obligatorio:

1. Descripcion
2. Unidad de medida
3. Notas opcionales
4. Acciones

=====================================================================
6. FUENTE DE DATOS DE UNIDADES
=====================================================================

6.1 Tabla origen

La fuente oficial debe ser:

- `public.unidad_medida`

Schema de referencia:

```sql
create table public.unidad_medida (
  id bigint generated always as identity not null,
  codigo text not null,
  abreviatura text not null,
  descripcion text null,
  activo boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint unidad_medida_pkey primary key (id),
  constraint unidad_medida_abreviatura_key unique (abreviatura),
  constraint unidad_medida_codigo_key unique (codigo),
  constraint unidad_medida_abreviatura_not_blank check (
    (
      length(
        TRIM(
          both
          from
            abreviatura
        )
      ) > 0
    )
  ),
  constraint unidad_medida_codigo_not_blank check (
    (
      length(
        TRIM(
          both
          from
            codigo
        )
      ) > 0
    )
  )
) TABLESPACE pg_default;
```

6.2 Filtro minimo

La consulta debe considerar:

- solo unidades activas
- solo registros con descripcion util para UI final

6.3 Distinct requerido

La carga debe hacer `distinct` por `descripcion`.

Objetivo:

- evitar mostrar duplicados funcionales al usuario final
- presentar una sola opcion visible por descripcion

6.4 Normalizacion de descripcion

Como la tabla puede traer descripciones repetidas, nulas o inconsistentes, la capa de datos debe normalizar la salida para UI.

Reglas:

- la opcion visible debe mostrar la `descripcion`
- la descripcion visible debe ser el valor principal de render
- si la BD trae varias filas equivalentes por la misma descripcion, la UI debe mostrar una sola opcion
- el registro elegido debe conservar los datos necesarios para guardar luego el valor correcto

=====================================================================
7. DATOS QUE DEBEN CONSERVARSE POR OPCION
=====================================================================

Aunque la UI muestre solo la descripcion, cada opcion de unidad debe conservar internamente al menos:

- `id`
- `codigo`
- `abreviatura`
- `descripcion`

Motivo:

- el formulario necesita mostrar solo descripcion
- pero el submit debe retener el dato correcto para persistir en el payload

Regla de persistencia:

- el flujo actual de solicitudes trabaja con `unidadCodigo`
- por lo tanto la opcion elegida debe poder mapearse de forma confiable a `unidadCodigo` para crear o enviar

=====================================================================
8. DISEÑO DEL SERVICE
=====================================================================

8.1 Ubicacion obligatoria

Crear carpeta:

- `src/services/db_compras/unidad/`

8.2 Responsabilidad unica

El service debe encargarse solo de:

- consultar unidades en Supabase
- filtrar activas
- normalizar salida minima
- resolver distinct por descripcion

No debe:

- contener estado de UI
- manejar apertura/cierre del drawer o sheet
- acoplarse al formulario

8.3 Salida esperada del service

El service debe devolver una coleccion lista para consumo del composable, con estructura pensada para selector de unidad.

Ejemplo conceptual:

```ts
type UnidadMedidaOption = {
  id: number;
  codigo: string;
  abreviatura: string;
  descripcion: string;
};
```

Si la implementacion necesita campos auxiliares para busqueda, pueden agregarse a nivel de composable o mapper.

=====================================================================
9. DISEÑO DEL COMPOSABLE
=====================================================================

9.1 Responsabilidad

El composable debe actuar como capa intermedia entre:

- el service de unidades
- el formulario de producto temporal

Debe resolver:

- carga inicial
- estado de loading
- estado de error
- busqueda local por:
  - descripcion
  - codigo
  - abreviatura
  - id
- opcion seleccionada
- lista filtrada para UI

9.2 Resultado visible

Aunque el filtro busque por varios campos, las opciones deben renderizar solo la descripcion.

Ejemplo:

- el usuario escribe `und`, `unidad`, `7` o `un`
- la lista puede encontrar coincidencias por codigo, abreviatura o id
- pero en pantalla solo debe verse algo como:
  - `Unidad`

9.3 Reglas del filtro

El buscador de unidad debe permitir coincidencia por:

- `descripcion`
- `codigo`
- `abreviatura`
- `id`

La lista de resultados debe mostrar:

- solo `descripcion`

=====================================================================
10. INTEGRACION CON EL FORMULARIO
=====================================================================

10.1 Campo unidad de medida

El campo no debe ser libre.

Debe ser:

- un input buscador
- con lista de opciones
- basado en unidades cargadas desde el composable

10.2 Comportamiento de seleccion

Al elegir una unidad:

- el campo debe reflejar la descripcion elegida
- el formulario debe guardar internamente el registro completo o al menos:
  - `unidadCodigo`
  - `unidadLabel`

Recomendacion:

- `unidadLabel` = descripcion visible
- `unidadCodigo` = codigo persistible para payload

10.3 Validacion

Para producto temporal:

- descripcion obligatoria
- unidad obligatoria
- notas opcionales

Mensajes sugeridos:

- `La descripcion del producto temporal es obligatoria.`
- `La unidad del producto temporal es obligatoria.`

=====================================================================
11. INTEGRACION CON EL LISTADO DEL PASO 2
=====================================================================

11.1 Productos existentes

Mostrar:

- eliminar

No mostrar:

- editar

11.2 Productos temporales

Mostrar:

- editar
- eliminar

11.3 Relacion entre listado y overlay

El overlay de producto temporal es una extension del paso 2 y depende del listado porque:

- desde el listado se inicia la edicion de temporales
- desde el formulario se actualiza el listado
- el badge `Temporal` define si existe accion `Editar`

=====================================================================
12. REQUERIMIENTOS DE IMPLEMENTACION
=====================================================================

12.1 Archivos esperados

Minimo esperado:

- service de unidades en `db_compras/unidad`
- composable de carga y busqueda de unidades
- componente o seccion de formulario para producto temporal
- conexion desde el paso 2 actual

12.2 Responsabilidades sugeridas

- service:
  lectura de Supabase y normalizacion base

- composable:
  estado, busqueda, filtro, seleccion y experiencia de selector

- formulario:
  captura visual, validacion local de UI y emision de guardar/cancelar

- contenedor del paso 2:
  apertura, cierre, modo crear/editar y sincronizacion con listado

=====================================================================
13. CRITERIOS DE ACEPTACION
=====================================================================

1. El usuario puede abrir producto temporal desde el boton manual con formulario vacio.

2. El usuario puede abrir producto temporal desde la fila manual con descripcion precargada desde el input actual.

3. En `lg` el formulario aparece como drawer derecho con overlay borroso.

4. En `md` y `sm` el formulario aparece como bottom sheet que crece segun contenido.

5. El overlay no se cierra por click fuera ni por escape; solo por `Cancelar` o por completar `Agregar` / `Guardar cambios`.

6. La unidad de medida se carga desde `public.unidad_medida`, no desde datos hardcodeados.

7. La consulta aplica distinct por descripcion para evitar duplicados visibles.

8. El buscador permite buscar por descripcion, codigo, abreviatura e id.

9. Las opciones muestran solo la descripcion.

10. El formulario conserva lo necesario para persistir correctamente `unidadCodigo` al crear o enviar la solicitud.

11. Solo los productos temporales muestran accion de editar.

12. El formulario usa layout vertical: label arriba, input abajo, un grupo por fila.

=====================================================================
14. DECISIONES CERRADAS
=====================================================================

- Edicion habilitada solo para temporales.
- CTA manual del boton abre vacio.
- Fila manual de resultados abre con descripcion precargada.
- Bottom sheet de `md/sm` crece segun contenido.
- Drawer de `lg` usa overlay borroso.
- Cierre restringido a cancelar o completar accion.
- Busqueda de unidad por multiples campos.
- Visualizacion de opciones mostrando solo descripcion.
- Fuente de unidades desde BD con service + composable.

