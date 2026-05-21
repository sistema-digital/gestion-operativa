````markdown
# Prompt para ubicar correctamente archivos nuevos en proyecto Vue 3

Actúa como un desarrollador senior de Vue 3, TypeScript estricto, Pinia y Supabase.

Necesito crear, modificar o mover archivos dentro de este proyecto. Antes de crear cualquier archivo, revisa la estructura existente y decide la ubicación correcta según la responsabilidad del archivo. No crees carpetas nuevas si ya existe una ubicación equivalente.

## Objetivo

Mantener el proyecto ordenado, escalable y consistente. Cada archivo debe vivir en la carpeta que corresponde a su responsabilidad.

## Estructura base del proyecto

```text
src/
├── components/
├── constants/
├── layouts/
├── lib/
├── router/
├── stores/
├── types/
├── utils/
├── views/
├── App.vue
├── main.ts
└── index.css
````

## Reglas generales de ubicación

### 1. Vistas principales

Usa `src/views/` para pantallas principales asociadas a rutas.

Ejemplos:

```text
src/views/DashboardView.vue
src/views/PanelAdminView.vue
src/views/SupervisorRatingsView.vue
```

Si la vista pertenece a un dominio específico y ya existe carpeta del dominio, colócala ahí:

```text
src/views/compras/NuevaSolicitudCompra.vue
src/views/compras/EditarSolicitudCompra.vue
```

Reglas:

* Una vista debe coordinar la pantalla.
* No debe contener toda la lógica interna si crece demasiado.
* Si hay secciones grandes, deben ir en `components`.
* Si hay lógica reutilizable, debe ir en composables o helpers.

---

### 2. Componentes reutilizables globales

Usa `src/components/` para componentes reutilizables o compartidos.

Si el componente es base y puede usarse en muchos módulos, ubícalo directamente en:

```text
src/components/BaseButton.vue
src/components/BaseInput.vue
src/components/BaseBadge.vue
src/components/BaseToggle.vue
```

Reglas:

* Los componentes base no deben depender de un dominio específico.
* Deben recibir datos por props.
* Deben emitir eventos.
* No deben llamar stores ni Supabase directamente, salvo que ya exista ese patrón y esté justificado.

---

### 3. Componentes por dominio

Si el componente pertenece a un módulo específico, ubícalo dentro de una carpeta del dominio en `components`.

Ejemplos:

```text
src/components/compras/form/
src/components/compras/list/
src/components/dashboard/
src/components/maintenance/
```

Reglas:

* Si es parte de compras, va en `components/compras/`.
* Si es parte de dashboard, va en `components/dashboard/`.
* Si es parte de mantenimiento, va en `components/maintenance/`.
* Si es una tabla, card, filtro, modal o sección interna de una vista, debe ir en `components/[dominio]/`.

Ejemplo recomendado:

```text
src/components/admin/users/AdminUserTable.vue
src/components/admin/users/AdminUserRow.vue
src/components/admin/users/AdminUserFilters.vue
src/components/admin/permissions/AdminFeatureAccessPanel.vue
```

---

### 4. Componentes de UI técnica

Usa `src/components/ui/` para wrappers técnicos o componentes visuales genéricos que no son de negocio.

Ejemplo:

```text
src/components/ui/EChart.vue
```

Reglas:

* Aquí van componentes técnicos reutilizables.
* No deben contener reglas de negocio.
* No deben estar ligados a una tabla o módulo específico.

---

### 5. Stores

Usa `src/stores/` para Pinia stores.

Si el store es antiguo o global y ya existe directo en `stores`, respeta el patrón existente:

```text
src/stores/userStore.ts
src/stores/ratingsStore.ts
src/stores/maintenanceStore.ts
```

Si el store pertenece a una base de datos, tabla, vista o RPC específica, usa estructura por dominio de BD:

```text
src/stores/[DOMINIO_BD]/[TABLA_O_MODULO]/
```

Ejemplo:

```text
src/stores/db_mantenimiento/app_feature_access/
├── featureAccess.service.ts
├── featureAccess.store.ts
└── featureAccess.types.ts
```

Reglas:

* `.store.ts` contiene Pinia, estado, getters y actions.
* `.service.ts` contiene llamadas a Supabase.
* `.types.ts` contiene interfaces, payloads, respuestas y state.
* `.helpers.ts` contiene normalizaciones o validaciones reutilizables.
* `.mappers.ts` contiene transformaciones entre Supabase y UI.
* No pongas `.from(...)` ni `.rpc(...)` fuera del service.
* No pongas types dentro del store.

---

### 6. Constants

Usa `src/constants/` para constantes globales o compartidas entre módulos.

Ejemplo:

```text
src/constants/solicitudCompraPermissions.ts
```

Reglas:

* Coloca aquí valores fijos compartidos.
* No coloques lógica compleja.
* No coloques datos que deberían venir de Supabase.
* Si la constante solo pertenece a un componente específico, déjala cerca del componente.

---

### 7. Lib

Usa `src/lib/` para clientes, configuración técnica o datos mock generales.

Ejemplos:

```text
src/lib/supabase.ts
src/lib/constants.ts
src/lib/mockMaintenanceData.ts
```

Reglas:

* El cliente de Supabase va aquí.
* Configuraciones técnicas compartidas van aquí.
* Datos mock temporales pueden vivir aquí si son generales.
* No colocar componentes, stores ni lógica de UI.

---

### 8. Utils

Usa `src/utils/` para funciones puras, reutilizables y sin dependencia fuerte de UI.

Ejemplo:

```text
src/utils/dateUtils.ts
```

Reglas:

* Funciones de fecha.
* Formateadores.
* Normalizadores generales.
* Helpers sin dependencia directa de Vue, Pinia o Supabase.
* Si la función solo sirve para un módulo, colócala dentro del módulo como helper.

---

### 9. Types globales

Usa `src/types/` solo para tipos realmente compartidos por varios módulos.

Ejemplo:

```text
src/types/index.ts
```

Reglas:

* No pongas aquí tipos específicos de una sola tabla si ya existe un `.types.ts` en el store.
* No dupliques interfaces.
* Si el tipo pertenece a un store, debe vivir en el `.types.ts` del store.
* Si el tipo pertenece a un componente, evalúa si debe ser local o compartido.

---

### 10. Router

Usa `src/router/` solo para configuración de rutas.

Ejemplo:

```text
src/router/index.ts
```

Reglas:

* Agrega nuevas vistas aquí solo si son rutas reales.
* No pongas lógica de permisos compleja directamente en componentes si puede centralizarse.
* Si se agregan rutas administrativas, valida permisos antes de permitir acceso.

---

### 11. Layouts

Usa `src/layouts/` para estructuras generales de pantalla.

Ejemplo:

```text
src/layouts/DefaultLayout.vue
```

Reglas:

* Sidebar, topbar, estructura base.
* No pongas lógica específica de módulos dentro del layout.
* El layout puede mostrar navegación según permisos, pero la lógica debe venir de store/composable.

---

### 12. Documentación

Usa `documentacion/` para prompts, reglas internas y guías del proyecto.

Ejemplos:

```text
documentacion/promptStore.md
documentacion/promptUseStore.md
documentacion/commit-rules.md
```

Reglas:

* Si se crea un prompt o regla para IA, debe ir aquí.
* No mezclar documentación con código fuente.
* Usa nombres claros y consistentes.

---

## Criterios para decidir ubicación

Antes de crear un archivo, responde internamente:

```text
1. ¿Es una pantalla completa con ruta?
   Sí → src/views/

2. ¿Es una parte visual de una pantalla?
   Sí → src/components/[dominio]/

3. ¿Es un componente base reutilizable?
   Sí → src/components/

4. ¿Es un componente técnico genérico?
   Sí → src/components/ui/

5. ¿Maneja estado global o datos compartidos?
   Sí → src/stores/

6. ¿Consulta Supabase?
   Sí → service dentro del store correspondiente.

7. ¿Define tipos de una tabla, RPC o store?
   Sí → .types.ts del módulo correspondiente.

8. ¿Es una función pura reutilizable?
   Sí → src/utils/

9. ¿Es una constante compartida?
   Sí → src/constants/

10. ¿Es configuración técnica?
   Sí → src/lib/

11. ¿Es documentación o prompt?
   Sí → documentacion/
```

## Reglas para no duplicar

1. Antes de crear un archivo, busca si ya existe uno similar.
2. No crees otro store si ya existe un store para la misma tabla, vista o RPC.
3. No crees otro componente si ya existe uno reutilizable.
4. No dupliques tipos.
5. No dupliques helpers.
6. No pongas lógica del mismo dominio en carpetas diferentes sin justificación.
7. Si hay que reutilizar algo, importa el archivo existente.

## Convención de nombres

### Vistas

```text
[NOMBRE]View.vue
```

Ejemplos:

```text
PanelAdminView.vue
SupervisorRatingsView.vue
MaintenancePlanView.vue
```

### Componentes

```text
PascalCase.vue
```

Ejemplos:

```text
AdminUserTable.vue
AdminUserFilters.vue
FeatureAccessPanel.vue
```

### Stores modulares

```text
[nombreModulo].store.ts
[nombreModulo].service.ts
[nombreModulo].types.ts
[nombreModulo].helpers.ts
[nombreModulo].mappers.ts
```

Ejemplo:

```text
featureAccess.store.ts
featureAccess.service.ts
featureAccess.types.ts
```

### Composables

Si se crean composables, deben iniciar con `use`.

```text
useBusquedaOms.ts
useFeatureAccess.ts
useAdminUsers.ts
```

Ubicación recomendada si no existe carpeta de composables:

```text
src/components/[dominio]/[subdominio]/useNombre.ts
```

o, si será compartido por varias vistas:

```text
src/composables/[dominio]/useNombre.ts
```

No crees `src/composables/` si no es necesario o si el proyecto aún no lo usa.

---

## Reglas de responsabilidad

### View

La vista debe:

```text
- coordinar la pantalla
- cargar datos iniciales
- consumir stores
- pasar props
- escuchar emits
- manejar estados simples de UI
```

No debe:

```text
- llamar Supabase directamente
- tener lógica extensa
- contener tablas enormes completas
- declarar tipos del dominio
- duplicar lógica del store
```

### Component

El componente debe:

```text
- mostrar una sección visual
- recibir props
- emitir eventos
- mantener lógica local simple
```

No debe:

```text
- consultar Supabase directamente
- conocer detalles internos de la base de datos
- duplicar datos globales
```

### Store

El store debe:

```text
- manejar estado local del dominio
- llamar services
- exponer actions
- exponer getters si hacen falta
```

No debe:

```text
- contener consultas Supabase directas si existe service
- declarar interfaces
- hacer transformaciones largas
```

### Service

El service debe:

```text
- contener .from(...)
- contener .rpc(...)
- manejar consultas externas
- devolver datos tipados
```

### Types

El archivo types debe:

```text
- declarar interfaces
- declarar payloads
- declarar respuestas
- declarar tipos de state
```

### Helpers

Los helpers deben:

```text
- normalizar valores
- validar datos simples
- reutilizar reglas pequeñas
```

### Mappers

Los mappers deben:

```text
- convertir datos de Supabase al modelo de UI
- convertir payloads de UI al formato esperado por Supabase
```

---

## Resultado esperado

Cuando se cree o modifique cualquier archivo:

1. Primero indica dónde debe ubicarse y por qué.
2. Muestra la estructura final de carpetas afectadas.
3. Crea solo los archivos necesarios.
4. No crees carpetas nuevas si ya existe una ubicación equivalente.
5. No dupliques lógica, tipos ni componentes.
6. Mantén los patrones existentes del proyecto.
7. Si detectas que un archivo estaría mal ubicado, propón moverlo.
8. Si no hay información suficiente para decidir, elige la opción más consistente con la estructura actual y explica la razón.
9. El código debe estar listo para copiar y pegar.
10. No uses pseudocódigo.

```
```
