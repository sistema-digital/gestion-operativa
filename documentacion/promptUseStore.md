# Prompt para consumir un store existente desde una vista o componente

Actúa como un desarrollador senior de Vue 3, Pinia, TypeScript estricto y Supabase.

Necesito consumir un store existente desde una vista o componente.

El dominio del store corresponde a la base de datos, tabla, vista o RPC desde donde se carga la información. Por eso, antes de usar el store, identifica qué módulo corresponde según el origen de datos.

## Datos del consumo

- Vista o componente donde se usará: `[RUTA_COMPONENTE_O_VISTA]`
- Dominio de datos: `[DOMINIO_BD]`
- Tabla, vista o RPC relacionada: `[TABLA_VISTA_O_RPC]`
- Store esperado: `src/stores/[DOMINIO]/[NOMBRE_MODULO]/`
- Información que necesito cargar: `[DESCRIPCION_DATOS]`
- Acción esperada del usuario: `[ACCION_USUARIO]`
- Estado que debe mostrarse en pantalla: `[ESTADO_UI]`

## Antes de escribir código

1. Busca el store existente relacionado con la tabla, vista o RPC indicada.
2. Revisa estos archivos del módulo si existen:

```text
[nombreModulo].types.ts
[nombreModulo].service.ts
[nombreModulo].store.ts
[nombreModulo].helpers.ts
[nombreModulo].mappers.ts
Identifica qué actions ya existen en el store.
Identifica qué estado local expone el store.
Identifica qué getters existen, si los hay.
Identifica qué tipos ya están disponibles en .types.ts.
No crees un nuevo store si ya existe uno que cubre el mismo dominio de datos.
No dupliques lógica que ya exista en el store, helper o mapper.
Reglas obligatorias
La vista o componente debe consumir el store de Pinia.
No llames directamente a Supabase desde la vista o componente.
No uses .from(...) ni .rpc(...) dentro de la vista o componente.
No importes el service directamente desde la vista o componente, salvo que sea estrictamente necesario y lo justifiques.
Usa las actions del store para cargar, crear, actualizar o eliminar datos.
Usa storeToRefs para leer estado reactivo del store cuando sea necesario.
Usa los tipos existentes desde .types.ts.
No declares interfaces dentro del componente si ya existen en el módulo.
No uses any.
No transformes datos complejos dentro del componente si ya existe mapper.
No repitas filtros o normalizaciones si ya existen helpers.
Si el store no tiene la action necesaria, agrega o modifica la action en el store siguiendo la arquitectura existente.
Si agregas una action nueva, la consulta a Supabase debe quedar en .service.ts.
El componente solo debe encargarse de la interacción visual, eventos de usuario y renderizado.
El store debe encargarse de cargar datos, actualizar estado local y exponer actions reutilizables.
Forma correcta de consumo

El flujo debe respetar esta estructura:

Vista o componente
        ↓
Store de Pinia
        ↓
Service
        ↓
Supabase
        ↓
Service devuelve datos tipados
        ↓
Store actualiza estado
        ↓
Vista renderiza el estado
Lo que debe hacer la implementación
Importar el store correcto.
Crear la instancia del store.
Usar storeToRefs para leer estado, loading y error si existen.
Llamar la action necesaria en onMounted, evento de usuario o watcher, según el caso.
Mostrar estados de carga, error, vacío y datos cargados.
Mantener el tipado estricto.
Evitar lógica de consulta dentro del componente.
Evitar duplicar datos locales si el store ya los maneja.
Si se necesita una selección local de UI, mantenerla en el componente solo si no pertenece al estado global.
Verificar que el componente no rompa el contrato de datos esperado por el store.
Ejemplo de estilo esperado

Usa una estructura similar a esta, adaptada al store real encontrado:

import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { useNombreModuloStore } from '@/stores/[DOMINIO]/[NOMBRE_MODULO]/[nombreModulo].store';

const nombreModuloStore = useNombreModuloStore();

const {
  registros,
  loading,
  error,
} = storeToRefs(nombreModuloStore);

onMounted(async () => {
  await nombreModuloStore.cargarRegistros();
});
Si el usuario realiza una acción

Si el usuario debe buscar, filtrar, seleccionar, guardar, actualizar o eliminar, usa actions del store:

await nombreModuloStore.buscarRegistros(filtros);
await nombreModuloStore.crearRegistro(payload);
await nombreModuloStore.actualizarRegistro(id, payload);
await nombreModuloStore.eliminarRegistro(id);

No hagas esto dentro del componente:

await supabase.from('tabla').select('*');
await supabase.rpc('nombre_rpc');
Manejo de estados visuales

El componente debe contemplar:

- estado inicial
- cargando
- error
- sin resultados
- datos cargados
- acción exitosa

Si el store ya expone loading, error o estados equivalentes, úsalos.
Si no existen y son necesarios, agrégalos al store respetando los tipos en .types.ts.

Resultado esperado
Indica qué store se encontró y por qué corresponde al dominio de datos indicado.
Explica qué action se usará para cargar o modificar la información.
Modifica solo la vista o componente necesario, salvo que falte una action en el store.
Si falta una action, modifica también el store, service y types siguiendo la arquitectura existente.
Muestra los archivos modificados completos.
No uses pseudocódigo.
No inventes tablas, columnas, RPCs ni actions que no existan.
Si falta información para consumir correctamente el store, indícalo claramente.
Ejecuta verificación de tipos si es posible o indica por qué no se pudo ejecutar.

Ese prompt está orientado a **cuando ya vas a usar un store desde una vista/componente**, no a crearlo ni documentarlo.