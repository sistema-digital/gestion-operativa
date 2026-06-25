# Feature: Imágenes de Repuestos con Storage Privado

> Módulo: Catálogo / Repuestos  
> Stack: Vue 3 + TypeScript + Pinia + Supabase JS + Supabase Storage + Tailwind  
> Fecha: 2026-06-25  
> Estado: Propuesta de implementación

## Objetivo

Rediseñar el manejo de imágenes del catálogo de repuestos para dejar de guardar `base64` en la tabla principal y pasar a un flujo con `Supabase Storage` privado, soportando hasta 4 imágenes por repuesto:

- `frente` obligatoria
- `lado` obligatoria
- `puesta` obligatoria
- `extra` opcional

La imagen `frente` debe generar además una miniatura cuadrada de `200x200`, que será la imagen principal de vista rápida.

## Contexto actual

Hoy el módulo guarda imágenes directamente como texto en los campos:

- `imagen_1`
- `imagen_2`

Situación actual detectada:

- Los componentes de create/update usan `input type="file"`.
- El archivo seleccionado se convierte con `FileReader` a `base64`.
- El valor resultante se envía como texto a la tabla `catalogo_repuestos_captura`.
- El detalle del repuesto asume solo 2 imágenes simples.

Archivos actuales relevantes:

```txt
src/components/catalogo/create/RepuestoCreatePanel.vue
src/components/catalogo/update/RepuestoUpdatePanel.vue
src/components/catalogo/create/CatalogImageUpload.vue
src/components/catalogo/update/UpdateImageUpload.vue
src/components/catalogo/RepuestoDetailPanel.vue
src/stores/dbequipos/repuestos/repuestos.types.ts
src/stores/dbequipos/repuestos/repuestos.store.ts
src/stores/dbequipos/repuestos/repuestos.service.ts
```

## Problema a resolver

El modelo actual no escala bien porque:

- guardar `base64` en la tabla aumenta demasiado el peso del registro;
- no existe estructura clara para múltiples imágenes;
- no hay miniatura optimizada;
- no hay separación entre almacenamiento físico y datos de negocio;
- no hay control real de acceso privado a imágenes.

## Alcance

- Reemplazar el flujo de `base64` por subida de archivos a `Supabase Storage`.
- Soportar 4 imágenes por repuesto.
- Generar miniatura `200x200` desde la imagen `frente`.
- Mantener compatibilidad con el esquema actual de la tabla usando `imagen_1` e `imagen_2`.
- Restringir acceso a imágenes a usuarios autenticados.
- Permitir captura desde cámara en móvil.

## Fuera de alcance

- Crear una tabla hija nueva para imágenes en esta fase.
- Cambiar el esquema SQL de `catalogo_repuestos_captura` en esta fase.
- Implementar edición avanzada con recorte manual visual.
- Implementar streaming de cámara con overlay cuadrado usando `getUserMedia` en esta fase.

## Decisión funcional

### Cantidad y tipos de imágenes

Se manejarán hasta 4 imágenes:

1. `frente` obligatoria
2. `lado` obligatoria
3. `puesta` obligatoria
4. `extra` opcional

### Miniatura

- La imagen `frente` es la fuente de la miniatura.
- La miniatura será cuadrada de `200x200`.
- Debe guardarse como archivo independiente en `Storage`.

### Persistencia en la tabla actual

Para no romper el esquema actual:

- `imagen_1`: guardará el `storage path` o URL firmable de la miniatura `200x200`
- `imagen_2`: guardará la lista de `storage paths` de las imágenes originales separadas por `;`

Orden estricto de `imagen_2`:

```txt
frente;lado;puesta;extra
```

Si `extra` no existe:

```txt
frente;lado;puesta
```

## Decisión técnica recomendada

### Guardar `storage path`, no `publicUrl`

Se recomienda guardar en base de datos el `path` del objeto dentro del bucket, no la URL pública.

Ejemplo:

```txt
imagen_1 = repuestos/{user_id}/{repuesto_id}/thumb-200x200.jpg
imagen_2 = repuestos/{user_id}/{repuesto_id}/frente.jpg;repuestos/{user_id}/{repuesto_id}/lado.jpg;repuestos/{user_id}/{repuesto_id}/puesta.jpg;repuestos/{user_id}/{repuesto_id}/extra.jpg
```

Ventajas:

- funciona con bucket privado;
- permite regenerar URLs firmadas cuando sea necesario;
- evita acoplar la tabla a un dominio o forma de entrega;
- facilita mover la estrategia de serving después.

## Bucket de Storage

Bucket sugerido:

```txt
catalogo-repuestos
```

Tipo de acceso:

```txt
private
```

Estructura de carpetas sugerida:

```txt
repuestos/{user_id}/{repuesto_id}/thumb-200x200.jpg
repuestos/{user_id}/{repuesto_id}/frente.jpg
repuestos/{user_id}/{repuesto_id}/lado.jpg
repuestos/{user_id}/{repuesto_id}/puesta.jpg
repuestos/{user_id}/{repuesto_id}/extra.jpg
```

## Seguridad del bucket

El bucket debe permanecer privado y usar políticas RLS sobre `storage.objects`.

### Reglas objetivo

- solo usuarios autenticados pueden subir;
- solo usuarios autenticados pueden leer;
- opcionalmente cada usuario solo puede escribir dentro de su propia carpeta;
- no usar `getPublicUrl` para servir imágenes privadas.

### Política base mínima

```sql
create policy "catalogo repuestos insert auth"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'catalogo-repuestos'
);

create policy "catalogo repuestos select auth"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'catalogo-repuestos'
);

create policy "catalogo repuestos update auth"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'catalogo-repuestos'
)
with check (
  bucket_id = 'catalogo-repuestos'
);

create policy "catalogo repuestos delete auth"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'catalogo-repuestos'
);
```

### Política recomendada por carpeta propia

Si se quiere endurecer el acceso:

```sql
create policy "catalogo repuestos insert own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'catalogo-repuestos'
  and (storage.foldername(name))[1] = 'repuestos'
  and (storage.foldername(name))[2] = (select auth.jwt()->>'sub')
);
```

La lectura podría seguir el mismo principio si el producto lo requiere.

## Serving de imágenes

Como el bucket es privado:

- no se debe usar `getPublicUrl()`;
- se debe usar `createSignedUrl()` para imágenes individuales;
- o `download()` si se quiere resolver el archivo autenticado directamente.

### Recomendación de serving

Para UI:

- usar `createSignedUrl(path, ttl)` al abrir paneles o listas;
- TTL sugerido: `3600` segundos;
- no persistir signed URLs en la base de datos.

## Flujo de creación

### Paso 1

El usuario llena el formulario base del repuesto.

### Paso 2

El usuario agrega:

- frente
- lado
- puesta
- extra opcional

### Paso 3

Frontend valida:

- máximo 4 imágenes;
- tipos permitidos `image/jpeg,image/png,image/webp` si se habilita;
- tamaños máximos por archivo;
- obligatoriedad de `frente`, `lado`, `puesta`.

### Paso 4

Se crea o persiste el repuesto para obtener `repuesto_id`.

### Paso 5

Se genera miniatura `200x200` desde `frente`.

### Paso 6

Se suben archivos a Storage:

- `thumb-200x200`
- `frente`
- `lado`
- `puesta`
- `extra` si aplica

### Paso 7

Se actualiza el repuesto con:

- `imagen_1 = path miniatura`
- `imagen_2 = paths originales separados por ;`

## Flujo de actualización

- Si el usuario no cambia imágenes, no se toca Storage.
- Si reemplaza una o más imágenes:
  - se vuelve a subir solo lo modificado;
  - si cambia `frente`, se regenera la miniatura;
  - se actualiza `imagen_1` e `imagen_2` con los nuevos paths.
- Opcional fase futura:
  - borrar versiones viejas para evitar basura en Storage.

## Comportamiento de cámara

### Fase 1 recomendada

Usar `input type="file"` con:

```html
accept="image/*"
capture="environment"
```

Esto permite en muchos móviles:

- abrir cámara trasera;
- o mostrar selector cámara/galería según navegador.

### Limitación conocida

`capture="environment"` no garantiza:

- preview real 1:1;
- recorte visual cuadrado;
- comportamiento uniforme en todos los navegadores.

### Fase 2 opcional

Si se requiere experiencia controlada:

- usar `navigator.mediaDevices.getUserMedia()`;
- mostrar preview en vivo;
- superponer marco `1:1`;
- capturar el cuadrado usando `canvas`.

Esto queda fuera de esta fase.

## Transformación de imagen

La miniatura puede generarse en frontend con `canvas`.

### Reglas sugeridas

- tomar la imagen `frente`;
- calcular recorte centrado cuadrado;
- exportar a `JPEG` o `WEBP`;
- tamaño final `200x200`;
- calidad sugerida `0.82` a `0.9`.

## Cambios requeridos por archivo

### `src/stores/dbequipos/repuestos/repuestos.types.ts`

- Mantener `imagen_1` e `imagen_2` como `string | null`.
- Agregar tipos auxiliares para imágenes locales si hace falta.

### `src/stores/dbequipos/repuestos/repuestos.service.ts`

Agregar helpers:

- `uploadRepuestoImage(...)`
- `uploadRepuestoImages(...)`
- `createSquareThumbnail(...)`
- `createSignedImageUrl(...)`
- `createSignedImageUrls(...)`

No mezclar llamadas directas de Storage dentro del componente.

### `src/stores/dbequipos/repuestos/repuestos.store.ts`

Agregar acciones para:

- subir imágenes en create;
- subir/reemplazar imágenes en update;
- resolver signed URLs si se centraliza en store.

### `src/components/catalogo/create/CatalogImageUpload.vue`

Refactor a uploader múltiple orientado a slots fijos:

- frente
- lado
- puesta
- extra

Debe soportar:

- selección de archivo;
- captura por cámara;
- preview local;
- validación por campo;
- reemplazo individual.

### `src/components/catalogo/update/UpdateImageUpload.vue`

Mantener el mismo contrato visual y funcional que create.

### `src/components/catalogo/create/RepuestoCreatePanel.vue`

- dejar de guardar `base64`;
- trabajar con `File` en memoria hasta subir;
- separar datos del formulario y archivos locales.

### `src/components/catalogo/update/RepuestoUpdatePanel.vue`

- mostrar imágenes existentes;
- permitir reemplazo parcial;
- regenerar miniatura cuando cambia `frente`.

### `src/components/catalogo/RepuestoDetailPanel.vue`

Cambiar lectura:

- `imagen_1` pasa a ser miniatura;
- `imagen_2` debe parsearse por `;`;
- el detalle debe mostrar galería de hasta 4 originales.

## Contrato temporal de parsing

### Helper sugerido

```ts
type RepuestoImagenesParseadas = {
  miniaturaPath: string | null;
  originales: string[];
  frentePath: string | null;
  ladoPath: string | null;
  puestaPath: string | null;
  extraPath: string | null;
};
```

Regla:

- `imagen_1` se interpreta como miniatura;
- `imagen_2` se divide por `;`, se limpian vacíos y se asigna por orden.

## Validaciones funcionales

- `frente`, `lado` y `puesta` son obligatorias.
- `extra` es opcional.
- máximo 4 imágenes.
- solo formatos permitidos.
- tamaño máximo por archivo configurable.
- si falla la subida de una imagen, no se debe guardar un estado incompleto silencioso.

## Estrategia de errores

- Si falla la creación del repuesto antes de subir imágenes, no subir nada.
- Si falla una subida de imagen:
  - mostrar error claro;
  - no cerrar el panel;
  - permitir reintentar.
- Si el repuesto ya se creó pero falla una imagen:
  - registrar error visible;
  - decidir si se deja el repuesto sin imágenes o si se hace rollback manual.

### Recomendación

Para esta fase, crear primero el repuesto y luego subir imágenes.  
Si la subida falla, mostrar mensaje de “repuesto creado pero imágenes pendientes” solo si negocio acepta ese estado.  
Si negocio no lo acepta, entonces conviene hacer flujo transaccional asistido por backend en una fase posterior.

## Riesgos conocidos

- Guardar múltiples paths en `imagen_2` separados por `;` es una solución transitoria.
- El detalle, listado y edición deben respetar siempre el orden.
- Las signed URLs expiran y no deben persistirse como verdad de negocio.
- La cámara vía `capture` depende del navegador y del dispositivo.

## Evolución futura recomendada

Fase posterior ideal:

- crear tabla hija `catalogo_repuestos_imagenes`;
- un registro por imagen;
- campos por tipo: `frente`, `lado`, `puesta`, `extra`, `thumb`;
- metadatos: orden, mime, size, width, height, created_by;
- relación por `repuesto_id`.

Esto eliminaría la necesidad de usar `;` y dejaría una arquitectura mucho más mantenible.

## Criterios de aceptación

- El sistema deja de guardar `base64` en `imagen_1` e `imagen_2`.
- El bucket de imágenes es privado.
- Solo usuarios autenticados pueden acceder según políticas configuradas.
- El usuario puede cargar `frente`, `lado`, `puesta` y `extra` opcional.
- La imagen `frente` genera miniatura `200x200`.
- `imagen_1` guarda la miniatura.
- `imagen_2` guarda los paths de originales separados por `;`.
- Create y update soportan el nuevo flujo.
- El detalle del repuesto puede mostrar la miniatura y la galería original.

## Referencias

- Supabase Storage fundamentals: https://supabase.com/docs/guides/storage/buckets/fundamentals
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- Supabase Storage serving and downloads: https://supabase.com/docs/guides/storage/serving/downloads
