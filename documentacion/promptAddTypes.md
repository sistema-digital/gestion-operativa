# Prompt para agregar tipos nuevos

Actua como un desarrollador senior de Vue 3 y TypeScript estricto.

Necesito agregar tipos nuevos para:

```text
[DESCRIPCION_DEL_DOMINIO_O_FUNCIONALIDAD]
```

Ubicacion requerida:

```text
[RUTA_DEL_ARCHIVO_TYPES]
```

Antes de escribir codigo:

1. Revisa si ya existen tipos equivalentes o parcialmente reutilizables.
2. Revisa las rutas cercanas del dominio para mantener nombres y estilo.
3. Define si los tipos representan UI, payloads, respuestas de Supabase, estado local o permisos.
4. No crees tipos globales si el uso es local del modulo.
5. No agregues dependencias nuevas para definir tipos.

Regla de conflicto obligatoria:

Si el tipo nuevo entra en conflicto con nombres existentes, contratos ya exportados, campos ya definidos con otro significado o rutas que no corresponden al dominio, no hagas cambios en el codigo. En ese caso, responde solo con:

```text
No se aplicaron cambios por conflictos encontrados:
- [CONFLICTO_1]
- [CONFLICTO_2]

Propuesta segura:
- [PROPUESTA_1]
- [PROPUESTA_2]
```

Reglas obligatorias:

1. Usa TypeScript estricto.
2. Evita `any`; usa tipos especificos, `unknown` con narrowing, genericos o uniones discriminadas.
3. Exporta todos los tipos que puedan ser consumidos por otros archivos del modulo.
4. Usa `interface` para contratos extensibles y `type` para uniones, literales o composiciones.
5. Usa `Record` solo cuando todas las claves sean obligatorias y conocidas.
6. Usa `null` de forma explicita cuando el dato pueda venir vacio desde la base de datos.
7. No inventes campos, tablas, columnas, endpoints ni RPCs.

Datos de los tipos:

- Nombre del modulo: `[NOMBRE_MODULO]`
- Tipos requeridos: `[LISTA_TIPOS]`
- Campos requeridos: `[LISTA_CAMPOS]`
- Tipos existentes que debe reutilizar: `[RUTAS_O_NOMBRES]`
- Consumidores previstos: `[RUTAS]`

Resultado esperado:

1. Crea o modifica solo el archivo de tipos necesario.
2. Muestra la lista de archivos creados o modificados.
3. Explica brevemente para que sirve cada tipo exportado.
4. Ejecuta la verificacion de tipos o indica por que no se pudo ejecutar.
