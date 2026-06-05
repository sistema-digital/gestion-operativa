# SDD 01 — Área de avance general del Slide de Productividad Semanal V2

## 1. Propósito

Este documento define el diseño técnico y visual de la sección superior **Área de avance general** del nuevo slide `ProductividadSemanalAreaSlideV2.vue`.

La sección debe mostrar, en una sola fila compacta, los indicadores principales de avance del área activa. Su objetivo es que el usuario entienda rápidamente:

```txt
- cuánto debería llevar el área según el avance ideal,
- cuánto lleva realmente,
- cuánto avance tendría sin retrasos,
- cuánto avance se perdió,
- cómo compara contra 2025,
- y cuál es el avance actual acumulado.
```

Este spec complementa el documento general:

```txt
documentacion/specs/productividad-semanal-slide/00-estructura-general-sdd.md
```

No implementa todavía el componente completo del slide. Solo define la sección de avance general.

---

## 2. Referencia visual obligatoria

La implementación debe tomar como referencia visual principal la imagen aprobada por el usuario.

Para esta sección, la referencia visual corresponde a la primera fila de cards ubicada debajo del header:

```txt
Avance ideal vs real | Avance sin retraso | Avance equivalente | Avance semanal
```

La descripción textual de este documento sirve como apoyo para datos, jerarquía, nombres y reglas. La validación visual debe hacerse contra la imagen.

---

## 3. Tecnologías y estilo

La implementación debe usar:

```txt
Vue 3
<script setup>
TypeScript
Tailwind CSS
lucide-vue-next
```

Reglas de estilo:

```txt
- Usar Tailwind CSS para layout, espaciado, bordes, color y tipografía.
- Evitar CSS scoped extenso.
- Usar CSS scoped solo si Tailwind no resuelve un detalle puntual.
- No usar tablas.
- No usar barras de progreso.
- No generar scroll.
- Usar círculos, textos cortos y líneas secundarias.
```

---

## 4. Ubicación dentro del layout general

La sección `Área de avance general` se renderiza inmediatamente debajo del header del slide.

Orden visual dentro de `ProductividadSemanalAreaSlideV2.vue`:

```txt
1. Header
2. Área de avance general   <- este spec
3. Productividad semanal + Top 3 equipos
4. Avance semanal
5. Retrasos
```

La sección debe ocupar una fila completa del grid principal.

---

## 5. Nombre visible de la sección

Esta sección no necesita un título global visible.

Cada card debe mostrar su propio título:

```txt
Avance ideal vs real
Avance sin retraso
Avance equivalente
Avance semanal
```

Los títulos deben aparecer dentro de cada card, centrados o alineados de forma consistente con la imagen de referencia.

---

## 6. Componentes involucrados

Archivos recomendados:

```txt
src/components/dashboard/productividad-semanal-v2/AvanceGeneralGrid.vue
src/components/dashboard/productividad-semanal-v2/AvanceIdealRealCard.vue
src/components/dashboard/productividad-semanal-v2/AvanceSinRetrasoCard.vue
src/components/dashboard/productividad-semanal-v2/AvanceEquivalenteCard.vue
src/components/dashboard/productividad-semanal-v2/AvanceSemanalCard.vue
src/components/dashboard/productividad-semanal-v2/shared/MetricCircle.vue
src/components/dashboard/productividad-semanal-v2/shared/SectionCard.vue
src/components/dashboard/productividad-semanal-v2/shared/EmptyValue.vue
```

### 6.1 `AvanceGeneralGrid.vue`

Responsabilidad:

```txt
- Recibir el objeto avanceGeneral ya mapeado.
- Distribuir las 4 cards en una fila.
- No buscar datos directamente en stores.
- No hacer cálculos de negocio.
```

### 6.2 Cards específicas

Cada card debe ser responsable solo de pintar su contenido:

```txt
AvanceIdealRealCard.vue
AvanceSinRetrasoCard.vue
AvanceEquivalenteCard.vue
AvanceSemanalCard.vue
```

No deben recibir el objeto completo del área. Deben recibir únicamente los datos que necesitan.

### 6.3 `MetricCircle.vue`

Componente reutilizable para mostrar porcentajes dentro de círculos.

Debe soportar:

```txt
- value
- label
- tone: positive | danger | neutral | info
- size: sm | md | lg
```

### 6.4 `SectionCard.vue`

Componente visual opcional para estandarizar:

```txt
- borde
- fondo
- radio
- padding
- sombra sutil
- alto completo
```

---

## 7. Fuente de datos

La sección usa datos provenientes de:

```txt
ProductividadDashboardTableItem[]
```

Este arreglo llega al componente visual desde:

```txt
SlideProductividadSemanal.vue
  -> ProductividadSemanalAreaSlideV2.vue
    -> useSlideProductividadViewModel.ts
      -> productividadSlide.mapper.ts
```

El mapper debe transformar las tablas del dashboard en un objeto `avanceGeneral` listo para UI.

---

## 8. Tablas usadas

### 8.1 `avance_ideal_vs_real`

Se usa para la card:

```txt
Avance ideal vs real
```

Campos:

```txt
avance_ideal -> Ideal
avance_real  -> Real
diferencia   -> Dif.
```

### 8.2 `avance_real_vs_avance_aproximado_sin_retrasos`

Se usa para la card:

```txt
Avance sin retraso
```

Campos:

```txt
avance_sin_retrasos       -> Sin retrasos
avance_perdido            -> Pérdida de avance
avance_perdido_operativo  -> op.
avance_perdido_personal   -> per.
```

La división `op.` y `per.` debe mostrarse como línea secundaria compacta solo si existen datos válidos.

### 8.3 `avance_equivalente`

Se usa para la card:

```txt
Avance equivalente
```

Campos:

```txt
diferencia  -> Equivalente
avance_2026 -> 2026
avance_2025 -> 2025
```

### 8.4 `avance_concluido_semanal`

Se usa para la card:

```txt
Avance semanal
```

Campo principal:

```txt
avance_acumulado -> Actual
```

---

## 9. Búsqueda por área

El mapper debe buscar la fila correspondiente al área activa usando comparación normalizada.

Regla:

```ts
const normalizeAreaKey = (area: string) => String(area || '')
  .trim()
  .toUpperCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');
```

Ejemplos equivalentes:

```txt
Cosecha Agricola
Cosecha Agrícola
COSECHA AGRICOLA
```

No se debe usar la fila `TOTAL` como fallback para una slide de área.

Si no se encuentra la fila del área, se debe mostrar:

```txt
—
```

---

## 10. Contrato del ViewModel para esta sección

El view model debe exponer la sección así:

```ts
interface AvanceGeneralViewModel {
  idealVsReal: {
    avanceIdeal: number | null;
    avanceReal: number | null;
    diferencia: number | null;
  };

  sinRetraso: {
    avanceSinRetrasos: number | null;
    avancePerdido: number | null;
    avancePerdidoOperativo: number | null;
    avancePerdidoPersonal: number | null;
  };

  equivalente: {
    diferencia: number | null;
    avance2026: number | null;
    avance2025: number | null;
  };

  semanal: {
    actual: number | null;
  };
}
```

Este contrato debe vivir en:

```txt
src/components/dashboard/productividad-semanal-v2/productividadSlide.types.ts
```

---

## 11. Mapeo esperado

El archivo:

```txt
src/components/dashboard/productividad-semanal-v2/productividadSlide.mapper.ts
```

debe exponer una función para construir esta sección.

Nombre sugerido:

```ts
buildAvanceGeneralViewModel(params)
```

Parámetros sugeridos:

```ts
interface BuildAvanceGeneralParams {
  area: string;
  dashboardTables?: ProductividadDashboardTableItem[];
}
```

Retorno:

```ts
AvanceGeneralViewModel
```

Responsabilidades:

```txt
1. Buscar la tabla avance_ideal_vs_real con scope general.
2. Buscar la tabla avance_real_vs_avance_aproximado_sin_retrasos con scope general.
3. Buscar la tabla avance_equivalente con scope general.
4. Buscar la tabla avance_concluido_semanal con scope semana_actual.
5. Encontrar la fila del área usando normalización.
6. Devolver null cuando un dato no exista.
```

---

## 12. Diseño visual de la sección

### 12.1 Contenedor principal

`AvanceGeneralGrid.vue` debe usar grid.

Distribución recomendada con Tailwind:

```txt
grid grid-cols-4 gap-3 min-h-0
```

Cada card debe tener alto completo dentro de la fila.

Ejemplo conceptual:

```txt
[ Avance ideal vs real ] [ Avance sin retraso ] [ Avance equivalente ] [ Avance semanal ]
```

### 12.2 Card base

Estilo visual recomendado:

```txt
rounded-2xl
border border-stone-200/80
bg-white/90
shadow-sm
px-4 py-3
min-h-0
overflow-hidden
```

La card debe verse ligera, limpia y coherente con la imagen.

---

## 13. Card: Avance ideal vs real

### 13.1 Contenido visible

Debe mostrar:

```txt
Título: Avance ideal vs real

25.9%  Ideal
24.2%  Real

Dif.: -1.7%
```

### 13.2 Reglas

```txt
- Mostrar dos círculos principales.
- Mostrar la diferencia debajo, como línea secundaria.
- No mostrar una card separada de brecha.
- No usar la palabra “Brecha”.
- No mostrar tabla.
```

### 13.3 Color

```txt
Ideal: verde oscuro / neutral positivo
Real: verde
Diferencia negativa: rojo
Diferencia positiva: verde
Diferencia cero: gris/neutral
```

### 13.4 Formato

```txt
avanceIdeal  -> 25.9%
avanceReal   -> 24.2%
diferencia   -> Dif.: -1.7%
```

Si falta un valor:

```txt
—
```

---

## 14. Card: Avance sin retraso

### 14.1 Contenido visible

Debe mostrar:

```txt
Título: Avance sin retraso

47.3%  Sin retrasos
23.1%  Pérdida de avance

op. 10% • per. 13%
```

La línea `op. / per.` es secundaria y debe mostrarse solo si existen los valores.

### 14.2 Reglas

```txt
- Mostrar dos círculos principales.
- El valor de pérdida debe ser rojo.
- La línea de operativo/personal debe ser pequeña y discreta.
- No mostrar barras.
- No mostrar tabla.
```

### 14.3 Campos

```txt
avanceSinRetrasos      -> círculo verde
avancePerdido          -> círculo rojo
avancePerdidoOperativo -> texto op.
avancePerdidoPersonal  -> texto per.
```

---

## 15. Card: Avance equivalente

### 15.1 Contenido visible

Debe mostrar:

```txt
Título: Avance equivalente

+15.4%
Equivalente

2026: 24.2% • 2025: 8.8%
```

### 15.2 Reglas

```txt
- Mostrar un círculo principal.
- La comparación 2026/2025 debe ir abajo como línea secundaria.
- 2026 debe usar verde.
- 2025 debe usar azul.
- No mostrar tabla.
```

### 15.3 Color

```txt
Diferencia positiva: verde
Diferencia negativa: rojo
2026: verde
2025: azul
```

---

## 16. Card: Avance semanal

### 16.1 Contenido visible

Debe mostrar:

```txt
Título: Avance semanal

24.2%
Actual
```

### 16.2 Reglas

```txt
- Mostrar un círculo principal.
- No mostrar semana anterior aquí.
- No mostrar “Esta semana” aquí.
- Esos valores pertenecen a la sección inferior `Avance semanal`, definida en otro spec.
```

---

## 17. Componente `MetricCircle.vue`

### 17.1 Propósito

Mostrar un valor dentro de un círculo visual reutilizable.

### 17.2 Props sugeridas

```ts
const props = defineProps<{
  value: string;
  label: string;
  tone?: 'positive' | 'danger' | 'neutral' | 'info';
  size?: 'sm' | 'md' | 'lg';
}>();
```

### 17.3 Reglas visuales

```txt
- Círculo con borde fino.
- Fondo blanco o muy suave.
- Valor centrado y fuerte.
- Label debajo o dentro del bloque, según la card.
- No usar canvas ni SVG complejo si no es necesario.
```

Se puede construir con Tailwind usando `rounded-full`, `border`, `aspect-square`, `flex`, `items-center`, `justify-center`.

---

## 18. Formateo de porcentajes

Crear utilidades en el mapper o helper local:

```txt
formatPercent(value)
formatSignedPercent(value)
```

Reglas:

```txt
24.24 -> 24.2%
1.30  -> 1.3%
15.40 -> +15.4%
-1.70 -> -1.7%
null  -> —
```

La UI puede recibir número y formatear en el componente, o recibir string ya formateado desde el view model. Se recomienda que el view model entregue números y que los componentes usen helpers simples para formato visual.

---

## 19. Estados sin datos

Si una card no tiene datos suficientes:

```txt
- Mantener la card visible.
- Mostrar — en los círculos faltantes.
- No ocultar la card.
- No usar TOTAL como reemplazo.
- No mostrar textos largos de error dentro de la card.
```

Ejemplo:

```txt
Avance ideal vs real
— Ideal
— Real
Dif.: —
```

---

## 20. Reglas de accesibilidad

Cada card debe tener estructura semántica simple:

```txt
article
h2 o h3 para título
p/span para valores
```

Los valores no deben depender solo del color. Por ejemplo, la diferencia debe incluir signo:

```txt
Dif.: -1.7%
```

---

## 21. Reglas de no-scroll

Para evitar scroll o desbordes:

```txt
- Usar min-h-0 en contenedores grid.
- Usar overflow-hidden en cards.
- Usar text-sm / text-xs en líneas secundarias.
- No permitir que títulos secundarios crezcan más de dos líneas.
- Mantener círculos de tamaño fijo relativo a la card.
```

No se deben introducir tooltips obligatorios para entender la card.

---

## 22. Fuera de alcance de este spec

Este spec no define:

```txt
- Productividad semanal.
- Top 3 equipos.
- Avance semanal inferior.
- Causas de retraso.
- Captura PNG.
- Cambios en stores.
- Cambios en funciones SQL/RPC.
```

---

## 23. Criterios de aceptación

La sección cumple este spec si:

```txt
1. Existe `AvanceGeneralGrid.vue`.
2. La sección aparece debajo del header.
3. La sección contiene exactamente 4 cards.
4. El orden de las cards es:
   Avance ideal vs real -> Avance sin retraso -> Avance equivalente -> Avance semanal.
5. No usa tablas.
6. No usa barras.
7. No muestra card de brecha.
8. La diferencia ideal vs real aparece como línea secundaria dentro de la primera card.
9. Los datos se extraen desde `ProductividadDashboardTableItem[]`.
10. Las filas se buscan por área normalizada.
11. Si falta un dato, se muestra `—`.
12. No se usa `TOTAL` como fallback.
13. El diseño usa Tailwind CSS.
14. La sección no genera scroll.
15. La apariencia sigue la imagen de referencia aprobada por el usuario.
```

---

## 24. Plan de implementación sugerido

```txt
1. Agregar los tipos de AvanceGeneralViewModel en productividadSlide.types.ts.
2. Crear función buildAvanceGeneralViewModel en productividadSlide.mapper.ts.
3. Crear MetricCircle.vue.
4. Crear SectionCard.vue si se decide usar card base reusable.
5. Crear AvanceIdealRealCard.vue.
6. Crear AvanceSinRetrasoCard.vue.
7. Crear AvanceEquivalenteCard.vue.
8. Crear AvanceSemanalCard.vue.
9. Crear AvanceGeneralGrid.vue.
10. Integrar AvanceGeneralGrid.vue en ProductividadSemanalAreaSlideV2.vue.
11. Validar con datos reales de Cosecha Agrícola.
12. Comparar visualmente contra la imagen de referencia.
```

---

## 25. Nota final para el implementador

La sección debe sentirse como una franja ejecutiva de indicadores. No debe parecer una tabla reducida ni un conjunto de datos pegados sin jerarquía.

La prioridad visual es:

```txt
1. Valor principal dentro del círculo.
2. Label corto debajo.
3. Línea secundaria solo cuando aporte contexto.
4. Nada de texto largo.
```

La imagen aprobada manda sobre cualquier interpretación visual dudosa de este documento.