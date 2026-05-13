# Prompt para agregar o modificar funciones en un store existente

Actua como un desarrollador senior de Vue 3, Pinia, TypeScript estricto y Supabase.

Necesito agregar o modificar la funcion `[NOMBRE_FUNCION]` en el modulo de store:

```text
src/stores/[DOMINIO]/[NOMBRE_MODULO]/
```

Antes de escribir codigo:

1. Revisa los archivos existentes del modulo:
   - `[nombreModulo].types.ts`
   - `[nombreModulo].service.ts`
   - `[nombreModulo].store.ts`
   - `[nombreModulo].helpers.ts`, si existe
   - `[nombreModulo].mappers.ts`, si existe
2. Mantén el estilo, nombres y patrones existentes.
3. No dupliques tipos si ya existen.
4. No muevas responsabilidades entre capas sin necesidad.

Reglas obligatorias:

1. Si la funcion consulta Supabase, la llamada debe ir en `.service.ts`.
2. Si la funcion usa `.from(...)` o `.rpc(...)`, eso debe vivir en `.service.ts`.
3. Si hacen falta payloads, respuestas o modelos, deben ir en `.types.ts`.
4. Si hace falta transformar datos, usa `.mappers.ts` o una funcion pequena fuera del store.
5. Si hace falta validar o normalizar valores simples, usa `.helpers.ts` cuando la logica pueda reutilizarse.
6. El `.store.ts` solo debe llamar al service, actualizar el estado local y devolver el resultado.
7. No pongas interfaces ni types dentro del store.
8. No uses `any`; usa tipos especificos, `unknown` con narrowing, o tipos parciales seguros.
9. Si agregas estado local, define su tipo en `.types.ts`.
10. Si cambias un contrato que consume una vista o componente, actualiza ese consumo y verifica que no rompa el shape esperado.

Datos de la nueva funcion:

- Nombre de la funcion: `[NOMBRE_FUNCION]`
- Parametros: `[PARAMETROS]`
- Retorno esperado: `[TIPO_RETORNO]`
- Tabla o RPC: `[TABLA_O_RPC]`
- Columnas usadas: `[COLUMNAS]`
- Estado local que debe actualizar: `[ESTADO_LOCAL]`
- Componentes o vistas que reemplaza: `[RUTAS_ARCHIVOS]`

Resultado esperado:

1. Modifica solo los archivos necesarios.
2. Muestra la estructura final del modulo.
3. Muestra completos los archivos modificados o nuevos.
4. Explica brevemente que responsabilidad quedo en cada archivo.
5. Ejecuta la verificacion de tipos o indica por que no se pudo ejecutar.
