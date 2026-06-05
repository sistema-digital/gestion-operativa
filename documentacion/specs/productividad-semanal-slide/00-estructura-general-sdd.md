# SDD 00 — Estructura general del Slide de Productividad Semanal V2

## 1. Propósito

Este documento define la estructura general para reemplazar visualmente el slide actual de productividad semanal por una versión V2 más clara, compacta y orientada a presentación 4:3.

El objetivo principal es mantener la lógica y los datos existentes, pero reorganizar la interfaz en una nueva composición visual basada en la imagen de referencia aprobada por el usuario.

Este spec no implementa el detalle interno de cada sección. Solo define la arquitectura general, archivos, flujo de datos, responsabilidades, reglas visuales globales y criterios de aceptación base.

Los detalles específicos se definirán en specs separados:

```txt
01-avance-general-sdd.md
02-resumen-semanal-sdd.md
03-top-3-equipos-sdd.md
04-avance-semanal-sdd.md
05-causas-retraso-sdd.md
06-captura-png-sdd.md
```

---

## 2. Contexto actual

Actualmente existe un componente contenedor:

```txt
src/components/dashboard/SlideProductividadSemanal.vue
```

Este componente:

- Carga la productividad semanal al montar.
- Usa `horasTrabajoStore.fetchProductividadSemanalPorEquipo(currentWeek, 3)`.
- Carga datos auxiliares con `maintenanceStore.fetchAllOrders()` y `horasTrabajoStore.fetchData()`.
- Calcula el slide activo.
- Permite navegación entre áreas con hover/click.
- Renderiza el componente visual actual `ProductividadSemanalAreaSlide.vue`.

También existe un componente visual actual:

```txt
src/components/dashboard/ProductividadSemanalAreaSlide.vue
```

Este componente actualmente muestra:

- Encabezado.
- Métricas de productividad.
- Ranking de equipos.
- Bloque de “Resto de horas”.

La versión V2 reemplazará completamente la presentación visual, pero conservará la separación de responsabilidades:

```txt
SlideProductividadSemanal.vue = carga/orquestación
ProductividadSemanalAreaSlideV2.vue = presentación visual
useSlideProductividadViewModel.ts = mapeo/formato de datos
```

---

## 3. Decisión principal de arquitectura

Se usará la opción B: crear un nuevo componente visual V2, sin sobrescribir inicialmente el componente anterior.

Archivo nuevo principal:

```txt
src/components/dashboard/ProductividadSemanalAreaSlideV2.vue
```

El componente actual `ProductividadSemanalAreaSlide.vue` queda disponible como respaldo hasta validar completamente la V2.

En `SlideProductividadSemanal.vue` se reemplazará la importación visual actual:

```ts
import ProductividadSemanalAreaSlide from '@/components/dashboard/ProductividadSemanalAreaSlide.vue';
```

por:

```ts
import ProductividadSemanalAreaSlide from '@/components/dashboard/ProductividadSemanalAreaSlideV2.vue';
```

---

## 4. Fuente de datos

La V2 usará dos fuentes principales de datos.

### 4.1 Productividad semanal por área

Proviene de:

```txt
horasTrabajoStore.productividadSemanal
```

Y se obtiene mediante:

```ts
horasTrabajoStore.fetchProductividadSemanalPorEquipo(currentWeek, 3)
```

Estructura base usada por cada área:

```ts
interface ProductividadSemanalArea {
  area: string;
  supervisor: ProductividadSemanalSupervisor;
  totales: ProductividadSemanalTotales;
  causas_retraso: ProductividadSemanalCausaRetraso[];
  top_equipos: ProductividadSemanalEquipo[];
  resto: ProductividadSemanalResto | null;
}
```

Datos usados en la V2:

```txt
area.area
area.supervisor.nombre
area.totales.horas_trabajadas
area.totales.retraso
area.totales.equipos_atendidos
area.totales.equipo_con_mas_horas
area.top_equipos
area.causas_retraso
```

Datos que no se mostrarán en la V2:

```txt
area.resto
```

La sección “Resto de horas” queda eliminada visualmente.

### 4.2 Tablas de avance del dashboard

Provienen de:

```txt
horasTrabajoStore.productividadSemanalDashboardTablas
```

Estas tablas se construyen desde:

```txt
src/stores/productividadSemanalDashboard.ts
```

El sistema genera varias tablas de avance, entre ellas:

```txt
avance_ideal_vs_real
avance_concluido_semanal
avance_equivalente
avance_real_vs_avance_aproximado_sin_retrasos
avance_perdido_por_falta_de_personal
```

La V2 debe mapear estas tablas a una estructura visual simple para el slide.

---

## 5. Nueva estructura visual general

La V2 debe seguir la imagen de referencia aprobada por el usuario como guía visual principal.

La descripción textual de este spec sirve como apoyo para nombres, estructura, reglas de datos y comportamiento, pero la imagen de referencia es la fuente principal para validar la apariencia general.

La estructura final del slide será:

```txt
ProductividadSemanalAreaSlideV2.vue
│
├─ Header
│  ├─ Título: Productividad semanal por equipo
│  ├─ Semana
│  ├─ Supervisor
│  └─ Área
│
├─ Área de avance general
│  ├─ Avance ideal vs real
│  ├─ Avance sin retraso
│  ├─ Avance equivalente
│  └─ Avance semanal
│
├─ Segunda fila
│  ├─ Resumen semanal
│  └─ Top 3 equipos por horas trabajadas
│
├─ Avance semanal
│  ├─ Semana 22
│  ├─ Esta semana
│  └─ Avance total
│
└─ Causas de retraso
   ├─ Retraso Falta Personal
   ├─ Retraso Operativo
   └─ Total de horas retrasadas
```

---

## 6. Nombres finales de secciones

Los nombres visibles deben ser exactamente estos:

```txt
Avance ideal vs real
Avance sin retraso
Avance equivalente
Avance semanal
Resumen semanal
Top 3 equipos por horas trabajadas
Causas de retraso
Retraso Falta Personal
Retraso Operativo
```

Cambios de nombre confirmados:

```txt
Resumen general        -> Resumen semanal
Resumen semanal previo -> Avance semanal
Horas de retraso       -> Causas de retraso
```

---

## 7. Reglas visuales globales

La V2 debe cumplir estas reglas:

```txt
- Formato visual 4:3.
- Sin scroll interno.
- Sin tablas visuales.
- Sin sidebar.
- Sin tab bar.
- Sin barras de progreso en el Top 3.
- Sin sección “Resto de horas”.
- Sin bloque “Insight clave”.
- Sin card separada de brecha.
- Sin espacios vacíos grandes.
- Usar cards, círculos, chips, íconos, filas compactas y bloques de datos.
```

Los textos largos deben truncarse con `line-clamp` para evitar que el slide genere scroll o rompa el alto disponible.

---

## 8. Layout principal recomendado

El layout principal debe usar CSS Grid para controlar la distribución general.

Flex se usará dentro de cada card para alinear contenido interno.

Estructura sugerida:

```css
.productividad-slide-v2 {
  aspect-ratio: 4 / 3;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows:
    auto
    1fr
    1.1fr
    0.75fr
    1.35fr;
  gap: 0.75rem;
  overflow: hidden;
}
```

Distribución conceptual:

```txt
Fila 0: Header
Fila 1: Avance general
Fila 2: Resumen semanal + Top 3 equipos
Fila 3: Avance semanal
Fila 4: Causas de retraso
```

---

## 9. Archivos nuevos propuestos

Se creará una carpeta para aislar los componentes internos de la V2.

```txt
src/components/dashboard/productividad-semanal-v2/
├─ ProductividadSlideHeader.vue
├─ AvanceGeneralGrid.vue
├─ AvanceIdealRealCard.vue
├─ AvanceSinRetrasoCard.vue
├─ AvanceEquivalenteCard.vue
├─ AvanceSemanalCard.vue
├─ ResumenSemanalCard.vue
├─ TopEquiposCard.vue
├─ AvanceSemanalResumenCard.vue
├─ CausasRetrasoCard.vue
├─ RetrasoFaltaPersonalRow.vue
├─ RetrasoOperativoRow.vue
├─ TotalHorasRetrasoBox.vue
└─ shared/
   ├─ MetricCircle.vue
   ├─ StatItem.vue
   ├─ CauseChip.vue
   ├─ EmptyValue.vue
   └─ SectionCard.vue
```

Archivo visual principal:

```txt
src/components/dashboard/ProductividadSemanalAreaSlideV2.vue
```

Composables y mappers:

```txt
src/components/dashboard/productividad-semanal-v2/useSlideProductividadViewModel.ts
src/components/dashboard/productividad-semanal-v2/productividadSlide.mapper.ts
src/components/dashboard/productividad-semanal-v2/productividadSlide.types.ts
```

---

## 10. Responsabilidad de cada archivo

### `ProductividadSemanalAreaSlideV2.vue`

Responsabilidad:

- Recibir `area`, `semana` y `dashboardTables` como props.
- Llamar al view model.
- Renderizar la estructura general del slide.
- No contener lógica pesada de transformación.
- No hacer fetch directo.

Props esperadas:

```ts
const props = defineProps<{
  area: ProductividadSemanalArea;
  semana: string;
  dashboardTables?: ProductividadDashboardTableItem[];
}>();
```

### `useSlideProductividadViewModel.ts`

Responsabilidad:

- Recibir `area`, `semana` y `dashboardTables`.
- Normalizar nombres de área.
- Buscar filas correspondientes en tablas de avance.
- Convertir datos técnicos en datos listos para UI.
- Devolver valores ya formateados o preparados para formatear.

### `productividadSlide.mapper.ts`

Responsabilidad:

- Contener funciones puras de mapeo.
- Extraer filas por tipo de tabla y área.
- Agrupar causas de retraso operativo.
- Construir motivos de retraso por falta de personal.
- Calcular total de horas retrasadas combinando personal + operativo.

### `productividadSlide.types.ts`

Responsabilidad:

- Definir contratos internos de la V2.
- Evitar que los componentes dependan directamente de todas las estructuras del store.

---

## 11. Contrato interno sugerido del ViewModel

El view model debe devolver una estructura similar a esta:

```ts
interface ProductividadSlideViewModel {
  header: {
    title: string;
    semana: string;
    supervisor: string;
    area: string;
  };

  avanceGeneral: {
    idealVsReal: {
      avanceIdeal: number | null;
      avanceReal: number | null;
      diferencia: number | null;
    };
    sinRetraso: {
      avanceSinRetrasos: number | null;
      avancePerdido: number | null;
    };
    equivalente: {
      diferencia: number | null;
      avance2026: number | null;
      avance2025: number | null;
    };
    semanal: {
      actual: number | null;
    };
  };

  resumenSemanal: {
    horasTrabajadas: number;
    horasRetrasadas: number;
    equiposConActividad: number;
    equipoConMasHoras: string | null;
  };

  topEquipos: Array<{
    posicion: number;
    equipo: string;
    horasTrabajadas: number;
    descripcion: string;
  }>;

  avanceSemanal: {
    semanaAnterior: number | null;
    estaSemana: number | null;
    avanceTotal: number | null;
  };

  causasRetraso: {
    faltaPersonal: {
      personalActivo: number | null;
      personalFaltante: number | null;
      horas: number;
      motivos: Array<{
        motivo: string;
        horas: number;
      }>;
    };
    operativo: {
      horas: number;
      causas: Array<{
        causa: string;
        horas: number;
        equipos: Array<{
          equipo: string;
          horas: number;
          descripcion: string;
        }>;
      }>;
    };
    totalHorasRetraso: number;
  };
}
```

---

## 12. Normalización de áreas

Todas las búsquedas por área deben comparar nombres normalizados.

Regla:

```ts
const normalizeAreaKey = (area: string) => String(area || '')
  .trim()
  .toUpperCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');
```

Esto permite comparar correctamente:

```txt
Cosecha Agricola
Cosecha Agrícola
COSECHA AGRICOLA
```

Si no se encuentra una fila para el área en alguna tabla, se debe mostrar `—`.

No se debe usar la fila `TOTAL` como fallback para una slide de área, porque podría confundir al usuario.

---

## 13. Reglas de mapeo general

### 13.1 Avance ideal vs real

Fuente:

```txt
avance_ideal_vs_real
```

Campo visual:

```txt
avance_ideal -> Ideal
avance_real -> Real
diferencia -> Diferencia
```

Debe mostrar la diferencia debajo de la card, pero no como brecha ni como card separada.

### 13.2 Avance sin retraso

Fuente:

```txt
avance_real_vs_avance_aproximado_sin_retrasos
scope: general
```

Campos visuales:

```txt
avance_sin_retrasos -> Sin retrasos
avance_perdido -> Pérdida de avance
```

### 13.3 Avance equivalente

Fuente:

```txt
avance_equivalente
```

Campos visuales:

```txt
diferencia -> Equivalente
avance_2026 -> 2026
avance_2025 -> 2025
```

### 13.4 Avance semanal

Fuente:

```txt
avance_concluido_semanal
```

Campos visuales:

```txt
avance_acumulado -> Actual
avance_semana_anterior -> Semana 22 o semana anterior
avance_semana_actual -> Esta semana
avance_acumulado -> Avance total
```

### 13.5 Causas de retraso

La card `Causas de retraso` une visualmente dos fuentes:

```txt
Retraso Falta Personal -> avance_perdido_por_falta_de_personal
Retraso Operativo -> area.causas_retraso
```

Estas fuentes se muestran juntas en una sola card, pero se mantienen separadas internamente por filas.

---

## 14. Reglas para retraso por falta de personal

Fuente:

```txt
ProductividadDashboardTable<AvancePerdidoPersonalRow>
tabla: avance_perdido_por_falta_de_personal
scope: general
```

Campos disponibles:

```ts
interface AvancePerdidoPersonalRow {
  area: string;
  area_corta: string;
  denominador: number;
  personal_activo: number;
  personal_faltante: number;
  avance_perdido_personal: number;
  horas_perdidas_personal: number;
  horas_vacaciones: number;
  horas_incapacidad: number;
  horas_inactivo: number;
  horas_plaza_no_cubierta: number;
}
```

Debe mostrar:

```txt
Personal faltante
Personal activo
Motivos con horas > 0
Total de horas por falta de personal
```

Los motivos se construyen así:

```txt
horas_vacaciones > 0          -> Vacaciones
horas_incapacidad > 0         -> Incapacidad
horas_inactivo > 0            -> Inactivo
horas_plaza_no_cubierta > 0   -> Plaza no cubierta
```

No debe mostrar equipos afectados en retraso por falta de personal.

---

## 15. Reglas para retraso operativo

Fuente:

```txt
area.causas_retraso
```

Estructura:

```ts
interface ProductividadSemanalCausaRetraso {
  causa: string;
  horas_retraso: number;
  equipos: ProductividadSemanalEquipoCausaRetraso[];
}
```

Debe mostrar:

```txt
Causa
Horas de retraso por causa
Equipos afectados por causa
```

Los equipos afectados se muestran como chips dentro de cada causa.

---

## 16. Total de retraso

El total de retraso mostrado en la card `Causas de retraso` debe calcularse como:

```txt
totalHorasRetraso = horasRetrasoPersonal + horasRetrasoOperativo
```

Donde:

```txt
horasRetrasoPersonal = AvancePerdidoPersonalRow.horas_perdidas_personal
horasRetrasoOperativo = suma de area.causas_retraso[].horas_retraso
```

El total debe mostrarse en una caja vertical destacada dentro de la card `Causas de retraso`.

---

## 17. Manejo de datos faltantes

Regla general:

```txt
Si falta un dato, mostrar —
```

Ejemplos:

```txt
avance_ideal null       -> —
personal_activo null    -> —
equipo_con_mas_horas    -> —
top_equipos vacío       -> mostrar estado “Sin datos”
causas_retraso vacío    -> mostrar estado “Sin datos” dentro de Retraso Operativo
motivos personal vacío  -> mostrar estado “Sin datos” dentro de Retraso Falta Personal
```

No se deben dejar cards vacías sin contenido.

---

## 18. Captura PNG

La captura PNG forma parte del alcance general de la V2.

La implementación específica se detallará en:

```txt
06-captura-png-sdd.md
```

Regla base:

```txt
La captura debe tomar solo el slide 4:3, no controles externos, header global, ni botones de navegación.
```

Librería sugerida:

```txt
html-to-image
```

Instalación si no existe:

```bash
pnpm add html-to-image
```

---

## 19. Estados globales del slide

El contenedor `SlideProductividadSemanal.vue` conserva los estados actuales:

```txt
loading
error
empty
activeSlide
```

La V2 debe respetar esos estados y no duplicar fetch dentro del componente visual.

Si `activeSlide` existe pero faltan datos parciales de avance, el componente visual debe renderizar con `—`, no bloquear toda la slide.

---

## 20. Actualización mínima en `SlideProductividadSemanal.vue`

El cambio mínimo requerido será reemplazar la importación del componente visual:

```ts
import ProductividadSemanalAreaSlide from '@/components/dashboard/ProductividadSemanalAreaSlideV2.vue';
```

El resto de la lógica de carga y navegación debe mantenerse igual en esta fase.

---

## 21. Fuera de alcance de este spec

Este spec no cubre todavía:

```txt
- Implementación detallada de cada card.
- Diseño exacto de círculos y chips.
- Reglas finas de truncado por sección.
- Componente exacto de captura PNG.
- Refactor del store.
- Cambios en la función SQL/RPC.
- Cambios en useDashboardHeaderNav.ts.
```

Esos puntos se detallarán en specs posteriores.

---

## 22. Criterios de aceptación generales

La implementación cumple este spec si:

```txt
1. Existe ProductividadSemanalAreaSlideV2.vue.
2. SlideProductividadSemanal.vue sigue funcionando como orquestador.
3. La V2 usa los datos actuales de productividad semanal.
4. La V2 usa las tablas de avance desde productividadSemanalDashboardTablas.
5. Las áreas se comparan usando normalización.
6. No se muestra Resto de horas.
7. No se muestran tablas visuales.
8. No se muestra sidebar.
9. No se muestra insight.
10. No se muestran barras en el Top 3.
11. La card Causas de retraso une Falta Personal y Operativo visualmente.
12. Los datos faltantes se muestran como —.
13. El slide no genera scroll interno.
14. El diseño sigue la imagen de referencia aprobada.
15. El componente queda preparado para captura PNG.
```

---

## 23. Orden sugerido de implementación

```txt
1. Crear productividadSlide.types.ts.
2. Crear productividadSlide.mapper.ts.
3. Crear useSlideProductividadViewModel.ts.
4. Crear componentes shared mínimos.
5. Crear ProductividadSemanalAreaSlideV2.vue con estructura base.
6. Conectar V2 temporalmente en SlideProductividadSemanal.vue.
7. Validar datos reales por área.
8. Ajustar estilos para 4:3 sin scroll.
9. Implementar specs por sección.
10. Implementar captura PNG.
```

---

## 24. Nota para implementación visual

La implementación debe usar como referencia principal la última imagen aprobada por el usuario. La estructura descrita en este documento sirve para asegurar que el código respete los nombres, datos, fuentes y responsabilidades.

No se debe convertir la imagen en un asset fijo. La UI debe construirse con componentes Vue, HTML y CSS reutilizable.