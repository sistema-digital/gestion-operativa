# Prompt generico para crear un store escalable

Actua como un desarrollador senior de Vue 3, Pinia, TypeScript estricto y Supabase.

Necesito crear un nuevo modulo de store escalable para la entidad: `[NOMBRE_ENTIDAD]`.

Ubicacion requerida:

```text
src/stores/[DOMINIO]/[NOMBRE_MODULO]/
```

Archivos requeridos:

```text
[nombreModulo].types.ts
[nombreModulo].service.ts
[nombreModulo].store.ts
```

Si hace falta por transformaciones o reglas repetidas, agrega tambien:

```text
[nombreModulo].helpers.ts
[nombreModulo].mappers.ts
```

Reglas obligatorias:

1. El archivo `.store.ts` debe contener solo:
   - state
   - getters si son necesarios
   - actions que llamen a los services
   - actualizacion del estado local
2. El archivo `.service.ts` debe contener:
   - todas las llamadas a Supabase
   - consultas `.from(...)`
   - llamadas `.rpc(...)`
   - manejo basico de errores
   - retorno de datos ya tipados
3. El archivo `.types.ts` debe contener:
   - interfaces
   - types
   - respuestas de RPC
   - payloads para crear, actualizar o consultar datos
   - tipos del state del store
4. No pongas interfaces ni types dentro del store.
5. No pongas llamadas directas a Supabase dentro del store.
6. No pongas logica larga de transformacion dentro del store.
7. Usa nombres claros, consistentes y en espanol si el modulo existente los usa.
8. Usa TypeScript estricto y evita `any`.
9. Si parece necesario usar `any`, reemplazalo por un tipo seguro o explica por que no se puede evitar.
10. No inventes tablas, columnas ni RPCs que no fueron indicadas.

Datos del modulo:

- Cliente Supabase: `[CLIENTE_SUPABASE]` importado desde `@/lib/supabase`
- Tabla principal: `[TABLA]`
- Columnas: `[COLUMNAS]`
- RPCs disponibles: `[RPCS]`
- Funciones que debe soportar:
  - `[FUNCION_1]`
  - `[FUNCION_2]`
  - `[FUNCION_3]`

Resultado esperado:

1. Crea o modifica los archivos necesarios.
2. Devuelve primero la estructura de carpetas.
3. Luego muestra cada archivo completo en bloques de codigo separados.
4. No uses pseudocodigo.
5. El codigo debe quedar listo para copiar y pegar.
