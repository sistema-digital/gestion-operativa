<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, computed, watch } from "vue";
import { useOmSgStore, type OMSGWithOm } from "@/stores/omSgStore";
import { storeToRefs } from "pinia";
import EChart from "@/components/ui/EChart.vue";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import {
  RefreshCw,
  Loader2,
  ClipboardList,
  Building2,
  Wrench,
  Clock,
  Calendar,
  ChevronDown,
  Check,
  Eye,
  EyeOff,
} from "lucide-vue-next";

const omSgStore = useOmSgStore();
const { allSGOrders, isLoadingSG } = storeToRefs(omSgStore);
const { fetchSGOrders } = omSgStore;

const isRefreshing = ref(false);
const selectedFilter = ref("Historico"); // Esta Semana, 2 ultimas semanas, Este Mes, Historico
const tableFilterStatus = ref<"Concluidas" | "Abiertas">("Abiertas");
const tableFilterTiming = ref<"Retrasadas" | "A tiempo">("Retrasadas");
const isMobile = ref(false);
const userArea = ref("");
const isLoadingWeeklyDeliveries = shallowRef(false);
const weeklyDeliveriesError = shallowRef<string | null>(null);
const showDelayedOrderCount = shallowRef(true);

const weeklyDeliverySchema = z.object({
  anio: z.coerce.number().int(),
  semana: z.coerce.number().int(),
  semana_label: z.string(),
  area: z.string(),
  total_evaluadas: z.coerce.number().int().nonnegative(),
  total_atrasadas: z.coerce.number().int().nonnegative(),
  porcentaje_entregas_atrasadas: z.coerce.number().nonnegative(),
  promedio_dias_atraso: z.coerce.number().nonnegative(),
});

type WeeklyDelivery = z.infer<typeof weeklyDeliverySchema>;

interface WeeklyDeliveryParams {
  p_anio: number;
  p_semana_desde: number;
  p_semana_hasta: number;
}

interface AffectedAreaSummary {
  area: string;
  totalAtrasadas: number;
  porcentajeEntregasAtrasadas: number;
  promedioDiasAtraso: number;
}

const weeklyDeliveries = ref<WeeklyDelivery[]>([]);

const formatDateDDMMYYYY = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  const dateOnly = dateStr.split("T")[0].split(" ")[0];
  const parts = dateOnly.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const handleResize = () => {
  isMobile.value = window.innerWidth < 768;
};

const getIsoWeekInfo = (date: Date) => {
  const isoDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayOfWeek = isoDate.getUTCDay() || 7;
  isoDate.setUTCDate(isoDate.getUTCDate() + 4 - dayOfWeek);

  const isoYear = isoDate.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstThursdayDay = firstThursday.getUTCDay() || 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() + 4 - firstThursdayDay);

  return {
    year: isoYear,
    week:
      1 + Math.round((isoDate.getTime() - firstThursday.getTime()) / 604800000),
  };
};

const getPanamaCurrentDate = () => {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Panama",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = new Map(dateParts.map(({ type, value }) => [type, value]));

  return new Date(
    Date.UTC(
      Number(values.get("year")),
      Number(values.get("month")) - 1,
      Number(values.get("day")),
    ),
  );
};

const getWeeklyDeliveryParams = (): WeeklyDeliveryParams[] => {
  const today = getPanamaCurrentDate();
  const currentIsoWeek = getIsoWeekInfo(today);

  if (selectedFilter.value === "Historico") {
    return [
      { p_anio: currentIsoWeek.year, p_semana_desde: 1, p_semana_hasta: 53 },
    ];
  }

  const weeksToLoad =
    selectedFilter.value === "Esta Semana"
      ? 1
      : selectedFilter.value === "2 ultimas semanas"
        ? 2
        : 4;
  const weeksByYear = new Map<number, number[]>();

  for (let offset = 0; offset < weeksToLoad; offset += 1) {
    const weekDate = new Date(today);
    weekDate.setUTCDate(today.getUTCDate() - offset * 7);
    const isoWeek = getIsoWeekInfo(weekDate);
    const yearWeeks = weeksByYear.get(isoWeek.year) ?? [];
    yearWeeks.push(isoWeek.week);
    weeksByYear.set(isoWeek.year, yearWeeks);
  }

  return Array.from(weeksByYear.entries()).map(([year, weeks]) => ({
    p_anio: year,
    p_semana_desde: Math.min(...weeks),
    p_semana_hasta: Math.max(...weeks),
  }));
};

const fetchWeeklyDeliveries = async () => {
  isLoadingWeeklyDeliveries.value = true;
  weeklyDeliveriesError.value = null;

  try {
    const responses = await Promise.all(
      getWeeklyDeliveryParams().map(async (params) => {
        const { data, error } = await supabase.rpc(
          "rpc_omsg_entregas_semanal",
          params,
        );

        if (error) {
          throw new Error(error.message);
        }

        const parsedData = z.array(weeklyDeliverySchema).safeParse(data ?? []);
        if (!parsedData.success) {
          throw new Error(
            "La respuesta de entregas semanales tiene un formato inválido.",
          );
        }

        return parsedData.data;
      }),
    );

    weeklyDeliveries.value = responses.flat();
  } catch (error) {
    weeklyDeliveries.value = [];
    weeklyDeliveriesError.value =
      error instanceof Error
        ? error.message
        : "No fue posible cargar las entregas atrasadas.";
  } finally {
    isLoadingWeeklyDeliveries.value = false;
  }
};

const fetchData = async (forceRefresh = false) => {
  if (forceRefresh) isRefreshing.value = true;
  if (!userArea.value) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && user.email) {
      const { data: profile } = await supabase
        .from("PROFILE")
        .select("area")
        .eq("email", user.email)
        .maybeSingle();
      userArea.value = profile?.area ? profile.area.toUpperCase() : "ALL";
    } else {
      userArea.value = "ALL";
    }
  }
  await Promise.all([
    fetchSGOrders(userArea.value, 0, forceRefresh),
    fetchWeeklyDeliveries(),
  ]);
  isRefreshing.value = false;
};

onMounted(() => {
  handleResize();
  window.addEventListener("resize", handleResize);
  fetchData();
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

watch(selectedFilter, () => {
  void fetchWeeklyDeliveries();
});

const affectedAreas = computed<AffectedAreaSummary[]>(() => {
  const summaries = new Map<
    string,
    {
      totalEvaluadas: number;
      totalAtrasadas: number;
      weightedDelayDays: number;
    }
  >();

  weeklyDeliveries.value.forEach((delivery) => {
    const currentSummary = summaries.get(delivery.area) ?? {
      totalEvaluadas: 0,
      totalAtrasadas: 0,
      weightedDelayDays: 0,
    };

    currentSummary.totalEvaluadas += delivery.total_evaluadas;
    currentSummary.totalAtrasadas += delivery.total_atrasadas;
    currentSummary.weightedDelayDays +=
      delivery.promedio_dias_atraso * delivery.total_atrasadas;
    summaries.set(delivery.area, currentSummary);
  });

  return Array.from(summaries.entries())
    .filter(([, summary]) => summary.totalAtrasadas > 0)
    .map(([area, summary]) => ({
      area,
      totalAtrasadas: summary.totalAtrasadas,
      porcentajeEntregasAtrasadas:
        summary.totalEvaluadas > 0
          ? (summary.totalAtrasadas / summary.totalEvaluadas) * 100
          : 0,
      promedioDiasAtraso:
        summary.totalAtrasadas > 0
          ? summary.weightedDelayDays / summary.totalAtrasadas
          : 0,
    }))
    .sort(
      (firstArea, secondArea) =>
        secondArea.porcentajeEntregasAtrasadas -
          firstArea.porcentajeEntregasAtrasadas ||
        firstArea.area.localeCompare(secondArea.area),
    );
});

const formatPercentage = (value: number) => `${value.toFixed(2)}%`;
const formatAverageDelay = (value: number) => value.toFixed(2);

const parseDateSafe = (dateStr?: string | null) => {
  if (!dateStr) return new Date();
  if (dateStr.includes("T")) return new Date(dateStr);
  const parts = dateStr.split(" ")[0].split("-");
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  return new Date(dateStr);
};

const getISOWeek = (dateArg: Date) => {
  const date = new Date(dateArg.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    )
  );
};

const isBusinessDay = (date: Date) => {
  const day = date.getDay();
  return day !== 0 && day !== 6;
};

const calculateBusinessDaysDiff = (target: Date, reference: Date) => {
  const start = new Date(reference);
  const end = new Date(target);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (start.getTime() === end.getTime()) return 0;

  const direction = end.getTime() > start.getTime() ? 1 : -1;
  let days = 0;
  const current = new Date(start);

  while (current.getTime() !== end.getTime()) {
    current.setDate(current.getDate() + direction);
    if (isBusinessDay(current)) days += direction;
  }

  return days;
};

const calculateOrderDays = (o: OMSGWithOm) => {
  const targetDateStr =
    o.fecha_entrega_sg || o.fecha_entrega || (o as any)["Fecha Entrega"];
  const conclusionDateStr = o["Fecha conclusion"];

  if (!targetDateStr) return 0;

  const target = parseDateSafe(targetDateStr);
  const isConcluded = o.Estatus?.toLowerCase().includes("concluida");
  const reference =
    isConcluded && conclusionDateStr
      ? parseDateSafe(conclusionDateStr)
      : new Date();

  // dias = target - reference (Positive/Zero = On Time, Negative = Delayed)
  return calculateBusinessDaysDiff(target, reference);
};

const filteredOrders = computed(() => {
  if (!allSGOrders.value) return [];
  const now = new Date();

  const getStartOfWeek = (d: Date) => {
    const day = d.getDay() || 7;
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    date.setDate(d.getDate() - day + 1);
    return date;
  };

  const getEndOfWeek = (d: Date) => {
    const start = getStartOfWeek(d);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };

  return allSGOrders.value
    .filter((o) => o.ORDEN_MANTENIMIENTO?.["Área"] !== "TEST")
    .map((o) => ({
      ...o,
      effective_days: calculateOrderDays(o),
    }))
    .filter((o) => {
      const targetDateStr =
        o.fecha_entrega_sg || o.fecha_entrega || (o as any)["Fecha Entrega"];
      if (!targetDateStr) return selectedFilter.value === "Historico";

      const d = parseDateSafe(targetDateStr);

      if (selectedFilter.value === "Esta Semana") {
        const start = getStartOfWeek(now);
        const end = getEndOfWeek(now);
        return d >= start && d <= end;
      }
      if (selectedFilter.value === "2 ultimas semanas") {
        const start = getStartOfWeek(now);
        start.setDate(start.getDate() - 7);
        const end = getEndOfWeek(now);
        return d >= start && d <= end;
      }
      if (selectedFilter.value === "Este Mes") {
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }
      return true; // Historico
    });
});

const availableStatuses = computed(() => {
  const statuses = new Set<string>();
  filteredOrders.value.forEach((o) => {
    if (o.Estatus) statuses.add(o.Estatus);
  });
  return Array.from(statuses).sort();
});

const tableFilteredOrders = computed(() => {
  let orders = filteredOrders.value;

  if (tableFilterTiming.value === "A tiempo") {
    orders = orders.filter((o) => o.effective_days >= 0);
  } else if (tableFilterTiming.value === "Retrasadas") {
    orders = orders.filter((o) => o.effective_days < 0);
  }

  if (tableFilterStatus.value === "Concluidas") {
    orders = orders.filter((o) =>
      o.Estatus?.toLowerCase().includes("concluida"),
    );
  } else if (tableFilterStatus.value === "Abiertas") {
    orders = orders.filter(
      (o) => !o.Estatus?.toLowerCase().includes("concluida"),
    );
    // Grouping by status string
    orders = [...orders].sort((a, b) =>
      (a.Estatus || "").localeCompare(b.Estatus || ""),
    );
  }

  return orders;
});

const formatValue = (val: number) => {
  if (val === 0) return "0";
  return val % 1 !== 0 ? val.toFixed(1) : val.toString();
};

const kpiStats = computed(() => {
  const total = filteredOrders.value.length;

  const concluidas = filteredOrders.value.filter((o) =>
    o.Estatus?.toLowerCase().includes("concluida"),
  );
  const concluidasOnTime = concluidas.filter(
    (o) => o.effective_days >= 0,
  ).length;
  const concluidasDelayed = concluidas.length - concluidasOnTime;
  const concluidasPct = total > 0 ? (concluidas.length / total) * 100 : 0;

  const enProceso = filteredOrders.value.filter((o) =>
    o.Estatus?.toLowerCase().includes("proceso"),
  );
  const enProcesoOnTime = enProceso.filter((o) => o.effective_days >= 0).length;
  const enProcesoDelayed = enProceso.length - enProcesoOnTime;
  const enProcesoPct = total > 0 ? (enProceso.length / total) * 100 : 0;

  const programadas = filteredOrders.value.filter((o) =>
    o.Estatus?.toLowerCase().includes("programado"),
  );
  const programadasOnTime = programadas.filter(
    (o) => o.effective_days >= 0,
  ).length;
  const programadasDelayed = programadas.length - programadasOnTime;
  const programadasPct = total > 0 ? (programadas.length / total) * 100 : 0;

  return [
    {
      label: "Total Servicios",
      value: total,
      icon: ClipboardList,
      color: "text-main",
      bg: "bg-main/10",
      isTotal: true,
    },
    {
      label: "Concluidas",
      value: `${formatValue(concluidasPct)}%`,
      count: concluidas.length,
      icon: Building2,
      color: "text-success",
      bg: "bg-success/10",
      details: {
        onTime: concluidasOnTime,
        delayed: concluidasDelayed,
        onTimePct:
          concluidas.length > 0
            ? (concluidasOnTime / concluidas.length) * 100
            : 0,
        delayedPct:
          concluidas.length > 0
            ? (concluidasDelayed / concluidas.length) * 100
            : 0,
      },
    },
    {
      label: "En Proceso",
      value: `${formatValue(enProcesoPct)}%`,
      count: enProceso.length,
      icon: Wrench,
      color: "text-warning",
      bg: "bg-warning/10",
      details: {
        onTime: enProcesoOnTime,
        delayed: enProcesoDelayed,
        onTimePct:
          enProceso.length > 0 ? (enProcesoOnTime / enProceso.length) * 100 : 0,
        delayedPct:
          enProceso.length > 0
            ? (enProcesoDelayed / enProceso.length) * 100
            : 0,
      },
    },
    {
      label: "Programadas",
      value: `${formatValue(programadasPct)}%`,
      count: programadas.length,
      icon: Clock,
      color: "text-gray-500",
      bg: "bg-gray-100",
      details: {
        onTime: programadasOnTime,
        delayed: programadasDelayed,
        onTimePct:
          programadas.length > 0
            ? (programadasOnTime / programadas.length) * 100
            : 0,
        delayedPct:
          programadas.length > 0
            ? (programadasDelayed / programadas.length) * 100
            : 0,
      },
    },
  ];
});

const performanceChartOption = computed(() => {
  const weeklyData: Record<
    number,
    { aTiempo: number; retrasada: number; total: number }
  > = {};

  filteredOrders.value.forEach((o) => {
    if (o.Estatus?.toLowerCase().includes("concluida")) {
      const targetDateStr =
        o.fecha_entrega_sg || o.fecha_entrega || (o as any)["Fecha Entrega"];
      let week: number | undefined = undefined;

      if (targetDateStr) {
        const d = parseDateSafe(targetDateStr);
        week = getISOWeek(d);
      }

      if (week !== undefined) {
        if (!weeklyData[week]) {
          weeklyData[week] = { aTiempo: 0, retrasada: 0, total: 0 };
        }
        weeklyData[week].total += 1;
        if (o.effective_days >= 0) {
          weeklyData[week].aTiempo += 1;
        } else {
          weeklyData[week].retrasada += 1;
        }
      }
    }
  });

  let sortedWeeks = Object.keys(weeklyData)
    .map(Number)
    .sort((a, b) => a - b);

  const labels = sortedWeeks.map((w) => `Sem. ${w}`);

  const aTiempoSeries = sortedWeeks.map((w) => {
    const d = weeklyData[w];
    if (!d) return { value: 0, count: 0 };
    return {
      value: d.total > 0 ? Number(((d.aTiempo / d.total) * 100).toFixed(1)) : 0,
      count: d.aTiempo,
    };
  });
  const retrasadaSeries = sortedWeeks.map((w) => {
    const d = weeklyData[w];
    if (!d) return { value: 0, count: 0 };
    return {
      value:
        d.total > 0 ? Number(((d.retrasada / d.total) * 100).toFixed(1)) : 0,
      count: d.retrasada,
    };
  });

  const maxPanes = isMobile.value ? 2 : 4;
  return {
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      formatter: (params: any) => {
        let res = `<div class="font-bold mb-1">${params[0].axisValue}</div>`;
        params.forEach((p: any) => {
          res += `<div class="flex items-center justify-between gap-4">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full" style="background:${p.color}"></span>
              ${p.seriesName}
            </span>
            <span class="font-bold">${p.value}% (${p.data.count})</span>
          </div>`;
        });
        return res;
      },
    },
    dataZoom:
      sortedWeeks.length > maxPanes
        ? [
            {
              type: "slider",
              show: true,
              height: 10,
              bottom: 0,
              startValue: sortedWeeks.length - maxPanes,
              endValue: sortedWeeks.length - 1,
              handleSize: 0,
              fillerColor: "rgba(26, 106, 150, 0.1)",
              borderColor: "transparent",
              showDetail: false,
            },
            {
              type: "inside",
              zoomOnMouseWheel: false,
              moveOnMouseMove: true,
              moveOnMouseWheel: true,
            },
          ]
        : [],
    grid: {
      left: "3%",
      right: "4%",
      top: "15%",
      bottom: sortedWeeks.length > maxPanes ? "15%" : "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { fontSize: 10, fontWeight: "900", color: "#1e293b" },
      axisLine: { lineStyle: { color: "#f1f5f9" } },
    },
    yAxis: {
      type: "value",
      max: 100,
      axisLabel: { fontSize: 10, color: "#94a3b8", formatter: "{value}%" },
      splitLine: { lineStyle: { type: "dashed", color: "#f1f5f9" } },
    },
    series: [
      {
        name: "A Tiempo",
        type: "bar",
        barWidth: 20,
        barGap: "80%",
        data: aTiempoSeries,
        itemStyle: {
          color: "#EAF3DE",
          borderRadius: [4, 4, 0, 0],
          borderColor: "#d4e6b5",
          borderWidth: 1,
        },
        label: {
          show: true,
          position: "top",
          formatter: "{c}%",
          fontSize: 11,
          fontWeight: "bold",
          color: "#2D8A54",
        },
      },
      {
        name: "Retrasada",
        type: "bar",
        barWidth: 20,
        data: retrasadaSeries,
        itemStyle: {
          color: "#FCEBEB",
          borderRadius: [4, 4, 0, 0],
          borderColor: "#f8d7d7",
          borderWidth: 1,
        },
        label: {
          show: true,
          position: "top",
          formatter: "{c}%",
          fontSize: 11,
          fontWeight: "bold",
          color: "#ef4444",
        },
      },
    ],
  };
});

const statusDistributionOption = computed(() => {
  const counts: Record<string, number> = {};
  let totalOrderCount = 0;

  filteredOrders.value.forEach((o) => {
    const s = o.Estatus || "Sin Estatus";
    counts[s] = (counts[s] || 0) + 1;
    totalOrderCount++;
  });

  const sortedData = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  const colorMap: Record<string, any> = {
    Programado: { color: "#1A6A96" },
    Concluida: { color: "#EAF3DE", borderColor: "#d4e6b5", borderWidth: 1 },
    "En Proceso": {
      color: "rgba(212, 169, 77, 0.2)",
      borderColor: "#D4A94D",
      borderWidth: 1,
    },
  };

  return {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: {
      left: "10%",
      right: "15%",
      top: "4%",
      bottom: "4%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      splitLine: { show: false },
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "category",
      data: sortedData.map((d) => d[0]),
      axisLabel: { fontSize: 10, fontWeight: "900", color: "#475569" },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: "bar",
        data: sortedData.map((d) => ({
          value: d[1],
          itemStyle: {
            color: colorMap[d[0]]?.color || "#cbd5e1",
            borderColor: colorMap[d[0]]?.borderColor,
            borderWidth: colorMap[d[0]]?.borderWidth,
            borderRadius: [0, 4, 4, 0],
          },
        })),
        barWidth: 15,
        label: {
          show: true,
          position: "right",
          fontWeight: "900",
          fontSize: 13,
          color: "#1e293b",
          formatter: (p: any) =>
            totalOrderCount > 0
              ? `${((p.value / totalOrderCount) * 100).toFixed(1)}%`
              : "0%",
        },
      },
    ],
  };
});
</script>

<template>
  <div class="flex flex-col min-h-full bg-gray-50/50">
    <!-- Sticky Filters Section -->
    <div
      class="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 md:px-6 shadow-sm"
    >
      <div class="flex items-center justify-between gap-4">
        <div
          class="flex items-center gap-1 p-1 bg-slate-50/80 border border-slate-200/60 shadow-inner rounded-2xl overflow-x-auto no-scrollbar"
        >
          <button
            v-for="filter in [
              'Esta Semana',
              '2 ultimas semanas',
              'Este Mes',
              'Historico',
            ]"
            :key="filter"
            @click="selectedFilter = filter"
            class="cursor-pointer px-4 py-1.5 rounded-xl text-[11px] font-black transition-all duration-300 whitespace-nowrap uppercase tracking-tighter"
            :class="
              selectedFilter === filter
                ? 'bg-[#1A6A96] text-white shadow-md'
                : 'text-gray-400 hover:text-gray-600'
            "
          >
            {{ filter }}
          </button>
        </div>
        <button
          @click="fetchData(true)"
          class="cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          :disabled="isLoadingSG || isRefreshing"
        >
          <RefreshCw
            class="w-4 h-4 text-gray-400"
            :class="{ 'animate-spin': isLoadingSG || isRefreshing }"
          />
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 p-4 md:p-6 lg:p-8 flex flex-col gap-8">
      <!-- KPIs -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="kpi in kpiStats"
          :key="kpi.label"
          class="bg-white p-5 rounded-[2.5rem] border border-gray-200/50 shadow-sm transition-all hover:shadow-md h-full flex flex-col"
        >
          <div class="flex items-center gap-3 mb-4">
            <div :class="['p-2.5 rounded-2xl', kpi.bg]">
              <component :is="kpi.icon" :class="['w-5 h-5', kpi.color]" />
            </div>
            <span
              class="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]"
              >{{ kpi.label }}</span
            >
          </div>

          <div
            :class="[
              'flex items-center gap-3 mb-6',
              kpi.isTotal
                ? 'justify-center w-full flex-1'
                : 'justify-center w-full flex-1 mt-2',
            ]"
          >
            <div class="text-4xl font-black text-gray-900 tracking-tighter">
              {{ kpi.value }}
            </div>
            <div
              v-if="kpi.count !== undefined"
              class="text-lg font-black text-gray-400/50 tabular-nums"
            >
              ({{ kpi.count }})
            </div>
          </div>

          <!-- Split Details -->
          <div
            v-if="kpi.details"
            class="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between"
          >
            <div class="flex flex-col">
              <span
                class="text-[8px] font-black text-success uppercase tracking-widest opacity-70 mb-1"
                >A tiempo</span
              >
              <span class="text-lg font-black text-gray-800 leading-none">
                {{ kpi.details.onTime }}
                <span class="text-xs text-gray-400 opacity-60 ml-0.5"
                  >({{ formatValue(kpi.details.onTimePct || 0) }}%)</span
                >
              </span>
            </div>
            <div class="w-px h-6 bg-gray-100"></div>
            <div class="flex flex-col text-right">
              <span
                class="text-[8px] font-black text-[#ef4444] uppercase tracking-widest opacity-70 mb-1"
                >Atrasada</span
              >
              <span class="text-lg font-black text-gray-800 leading-none">
                {{ kpi.details.delayed }}
                <span class="text-xs text-gray-400 opacity-60 ml-0.5"
                  >({{ formatValue(kpi.details.delayedPct || 0) }}%)</span
                >
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Comparison Chart -->
      <div
        class="bg-white p-4 sm:p-6 lg:p-8 rounded-[2rem] sm:rounded-[3rem] border border-gray-200/50 shadow-sm relative overflow-hidden"
      >
        <div
          class="flex flex-col md:flex-row md:items-center justify-between mb-6 sm:mb-10 gap-4"
        >
          <h3
            class="text-xs font-black text-gray-400 flex items-center gap-2 uppercase tracking-[0.2em]"
          >
            <div class="w-2 h-2 rounded-full bg-main"></div>
            Desempeño de Cumplimiento (%)
          </h3>
        </div>
        <div class="h-80 w-full md:min-h-[300px]">
          <EChart :option="performanceChartOption" />
        </div>
      </div>

      <!-- Status and delayed-delivery areas -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Status Bar Chart -->
        <div
          class="bg-white p-4 sm:p-6 rounded-[2rem] sm:rounded-[3rem] border border-gray-200/50 shadow-sm flex flex-col"
        >
          <h3
            class="text-xs font-black text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-[0.2em]"
          >
            <div class="w-2 h-2 rounded-full bg-warning"></div>
            Estatus de Ordenes SG
          </h3>
          <div class="h-48 w-full lg:h-auto lg:flex-1">
            <EChart :option="statusDistributionOption" />
          </div>
        </div>

        <!-- Areas with delayed deliveries -->
        <section
          class="bg-white p-4 sm:p-6 lg:p-8 rounded-[2rem] sm:rounded-[3rem] border border-gray-200/50 shadow-sm flex flex-col"
          aria-labelledby="delayed-deliveries-title"
        >
          <div class="flex items-start justify-between gap-3 mb-6">
            <div>
              <h3
                id="delayed-deliveries-title"
                class="text-xs font-black text-gray-400 flex items-center gap-2 uppercase tracking-[0.15em]"
              >
                <div class="w-2 h-2 rounded-full bg-[#ef4444]"></div>
                Áreas afectadas
              </h3>
              <p class="mt-2 text-[10px] font-semibold text-gray-400">
                Entregas retrasadas · {{ selectedFilter }}
              </p>
            </div>
            <button
              type="button"
              class="cursor-pointer shrink-0 rounded-xl border border-gray-200 bg-gray-50 p-2 text-gray-500 transition-colors hover:border-main/30 hover:bg-main/5 hover:text-main"
              :aria-pressed="showDelayedOrderCount"
              :aria-label="
                showDelayedOrderCount
                  ? 'Ocultar cantidad de órdenes atrasadas'
                  : 'Mostrar cantidad de órdenes atrasadas'
              "
              :title="
                showDelayedOrderCount
                  ? 'Ocultar cantidad de órdenes atrasadas'
                  : 'Mostrar cantidad de órdenes atrasadas'
              "
              @click="showDelayedOrderCount = !showDelayedOrderCount"
            >
              <EyeOff
                v-if="showDelayedOrderCount"
                class="h-4 w-4"
                aria-hidden="true"
              />
              <Eye v-else class="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div
            v-if="isLoadingWeeklyDeliveries"
            class="flex flex-1 items-center justify-center py-10"
          >
            <Loader2 class="w-7 h-7 animate-spin text-main" />
          </div>

          <p
            v-else-if="weeklyDeliveriesError"
            class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-[10px] font-bold text-red-600"
          >
            {{ weeklyDeliveriesError }}
          </p>

          <div v-else-if="affectedAreas.length" class="overflow-x-auto">
            <table class="w-full min-w-[360px] table-fixed text-center">
              <thead>
                <tr
                  class="border-b border-gray-100 text-[9px] font-black uppercase tracking-wider text-gray-400"
                >
                  <th class="w-1/3 pb-3 px-2 text-left">Área</th>
                  <th class="w-1/3 pb-3 px-2">% Entregas retrasadas</th>
                  <th class="w-1/3 pb-3 px-2">Prom. días retraso</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr
                  v-for="area in affectedAreas"
                  :key="area.area"
                  class="text-[11px]"
                >
                  <td class="py-3 px-2 text-left font-bold text-gray-700">
                    {{ area.area }}
                  </td>
                  <td
                    class="py-3 px-2 font-black text-[#ef4444] tabular-nums whitespace-nowrap"
                  >
                    {{ formatPercentage(area.porcentajeEntregasAtrasadas) }}
                    <span v-if="showDelayedOrderCount" class="text-gray-400"
                      >({{ area.totalAtrasadas }})</span
                    >
                  </td>
                  <td class="py-3 px-2 font-black text-gray-700 tabular-nums">
                    {{ formatAverageDelay(area.promedioDiasAtraso) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-else
            class="flex flex-1 flex-col items-center justify-center py-10 text-center"
          >
            <Check class="mb-3 h-8 w-8 text-success" />
            <p
              class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400"
            >
              Sin áreas afectadas
            </p>
          </div>
        </section>
      </div>

      <!-- Recent Table Full Width -->
      <div
        class="bg-white p-8 rounded-[3rem] border border-gray-200/50 shadow-sm w-full overflow-hidden flex flex-col"
      >
        <div
          class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4"
        >
          <h3
            class="text-xs font-black text-gray-400 flex items-center gap-2 uppercase tracking-[0.2em]"
          >
            <Calendar class="w-5 h-5 text-main-light" />
            Servicios Recientes - {{ selectedFilter }}
          </h3>

          <!-- Table Filters -->
          <div
            id="table-filters-container"
            class="flex flex-wrap items-center gap-4 overflow-visible pb-1"
          >
            <!-- Level 1 Filter: Status Switch (Glassmorphism) -->
            <div
              class="flex items-center p-1 bg-slate-50/80 backdrop-blur-md border border-slate-200/60 shadow-inner rounded-full"
            >
              <button
                @click="tableFilterStatus = 'Abiertas'"
                class="cursor-pointer px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-black transition-all duration-300"
                :class="
                  tableFilterStatus === 'Abiertas'
                    ? 'bg-[#3b82f6] text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-600'
                "
              >
                Abiertas
              </button>
              <button
                @click="tableFilterStatus = 'Concluidas'"
                class="cursor-pointer px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-black transition-all duration-300"
                :class="
                  tableFilterStatus === 'Concluidas'
                    ? 'bg-[#22c55e] text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-600'
                "
              >
                Concluidas
              </button>
            </div>

            <!-- Level 2 Filter: Timing Switch (Glassmorphism) -->
            <div
              class="flex items-center p-1 bg-slate-50/80 backdrop-blur-md border border-slate-200/60 shadow-inner rounded-full"
            >
              <button
                @click="tableFilterTiming = 'Retrasadas'"
                class="cursor-pointer px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-black transition-all duration-300"
                :class="
                  tableFilterTiming === 'Retrasadas'
                    ? 'bg-[#ef4444] text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-600'
                "
              >
                Retrasadas
              </button>
              <button
                @click="tableFilterTiming = 'A tiempo'"
                class="cursor-pointer px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-black transition-all duration-300"
                :class="
                  tableFilterTiming === 'A tiempo'
                    ? 'bg-[#22c55e] text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-600'
                "
              >
                A tiempo
              </button>
            </div>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto max-h-[600px] no-scrollbar">
          <!-- Desktop Table View -->
          <table v-if="!isMobile" class="w-full text-left min-w-[800px]">
            <thead class="sticky top-0 bg-white z-10">
              <tr
                class="text-[10px] font-black text-gray-300 uppercase border-b border-gray-100"
              >
                <th class="pb-5 px-4">Trabajo a Realizar</th>
                <th class="pb-5">Área</th>
                <th class="pb-5">Entrega</th>
                <th class="pb-5">Entrega SG</th>
                <th class="pb-5 text-center">Días</th>
                <th class="pb-5 text-center">Estatus</th>
                <th class="pb-5 pr-4">Equipo</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr
                v-for="order in tableFilteredOrders"
                :key="order.id_sg"
                class="text-[11px] group transition-all"
              >
                <td class="py-4 px-4 font-bold max-w-[250px]">
                  <div class="flex flex-col gap-1">
                    <span
                      class="text-gray-900 group-hover:text-main transition-colors line-clamp-2"
                      >{{
                        order.trabajo_realizar ||
                        order.ORDEN_MANTENIMIENTO?.["Descripcion"] ||
                        "-"
                      }}</span
                    >
                    <span
                      class="text-[9px] text-gray-400 font-medium italic line-clamp-1"
                      >{{ order.Observaciones || "Sin observaciones" }}</span
                    >
                  </div>
                </td>
                <td class="py-4 font-bold text-gray-500 whitespace-nowrap">
                  {{ order.ORDEN_MANTENIMIENTO?.["Área"] || "-" }}
                </td>
                <td class="py-4 font-bold text-gray-600">
                  <span
                    v-if="order.fecha_entrega"
                    class="inline-block px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border"
                    :class="
                      order.fecha_entrega === order.fecha_entrega_sg
                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                    "
                  >
                    {{ formatDateDDMMYYYY(order.fecha_entrega) }}
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="py-4 font-bold text-gray-600">
                  <span
                    v-if="order.fecha_entrega_sg"
                    class="inline-block px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-blue-500/10 text-blue-600 border-blue-500/20"
                  >
                    {{ formatDateDDMMYYYY(order.fecha_entrega_sg) }}
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="py-4 text-center">
                  <span
                    class="font-black px-2 py-1 rounded-lg text-[10px]"
                    :class="
                      order.effective_days >= 0
                        ? 'text-green-600 bg-green-50'
                        : 'text-red-600 bg-red-50'
                    "
                  >
                    {{ order.effective_days >= 0 ? "+" : ""
                    }}{{ order.effective_days }}
                  </span>
                </td>
                <td class="py-4 text-center">
                  <div
                    class="inline-block px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all"
                    :class="{
                      'bg-success/5 text-success border-success/10':
                        order.Estatus?.toLowerCase().includes('concluida'),
                      'bg-warning/5 text-warning border-warning/10':
                        order.Estatus?.toLowerCase().includes('proceso'),
                      'bg-gray-50 text-gray-400 border-gray-200':
                        !order.Estatus?.toLowerCase().includes('concluida') &&
                        !order.Estatus?.toLowerCase().includes('proceso'),
                    }"
                  >
                    {{ order.Estatus }}
                  </div>
                </td>
                <td class="py-4 text-gray-600 font-bold pr-4 whitespace-nowrap">
                  {{ order.ORDEN_MANTENIMIENTO?.["ID_#EQUIPO"] || "-" }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Mobile Card View -->
          <div v-else class="flex flex-col gap-4">
            <div
              v-for="order in tableFilteredOrders"
              :key="order.id_sg"
              class="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 flex flex-col gap-3 shadow-sm"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1">
                  <h4 class="text-[11px] font-bold text-gray-900 leading-snug">
                    {{ order.trabajo_realizar || "-" }}
                  </h4>
                  <div class="flex flex-wrap items-center gap-2 mt-1">
                    <span
                      class="text-[8px] font-black text-main uppercase border border-main/20 bg-main/5 px-1.5 py-0.5 rounded-md tabular-nums"
                    >
                      {{ order.ORDEN_MANTENIMIENTO?.["Área"] || "S/A" }}
                    </span>
                    <p class="text-[9px] text-gray-400 font-medium italic">
                      {{ order.Observaciones || "Sin observaciones" }}
                    </p>
                  </div>
                </div>
                <div
                  class="shrink-0 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border"
                  :class="{
                    'bg-success/5 text-success border-success/10':
                      order.Estatus?.toLowerCase().includes('concluida'),
                    'bg-warning/5 text-warning border-warning/10':
                      order.Estatus?.toLowerCase().includes('proceso'),
                    'bg-white text-gray-400 border-gray-200':
                      !order.Estatus?.toLowerCase().includes('concluida') &&
                      !order.Estatus?.toLowerCase().includes('proceso'),
                  }"
                >
                  {{ order.Estatus }}
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div class="flex flex-col gap-0.5">
                  <span
                    class="text-[8px] font-bold text-gray-400 uppercase tracking-widest"
                    >Entrega SG</span
                  >
                  <span class="text-[10px] font-black text-blue-600">{{
                    formatDateDDMMYYYY(order.fecha_entrega_sg)
                  }}</span>
                </div>
                <div class="flex flex-col gap-0.5 text-right">
                  <span
                    class="text-[8px] font-bold text-gray-400 uppercase tracking-widest"
                    >Días vs Hoy</span
                  >
                  <span
                    class="text-[11px] font-black"
                    :class="
                      order.effective_days >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    "
                  >
                    {{ order.effective_days >= 0 ? "+" : ""
                    }}{{ order.effective_days }}
                  </span>
                </div>
              </div>

              <div class="flex items-center justify-between pt-2">
                <div class="flex items-center gap-1.5">
                  <div class="w-1.5 h-1.5 rounded-full bg-main"></div>
                  <span class="text-[10px] font-bold text-gray-600"
                    >Eq:
                    {{ order.ORDEN_MANTENIMIENTO?.["ID_#EQUIPO"] || "-" }}</span
                  >
                </div>
                <span
                  v-if="order.fecha_entrega"
                  class="text-[9px] font-medium text-gray-400"
                  >Orig: {{ formatDateDDMMYYYY(order.fecha_entrega) }}</span
                >
              </div>
            </div>
          </div>
          <div
            v-if="tableFilteredOrders.length === 0"
            class="flex flex-col items-center justify-center py-24 opacity-40"
          >
            <Loader2
              v-if="isLoadingSG"
              class="w-10 h-10 animate-spin text-main"
            />
            <p
              v-else
              class="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300"
            >
              Sin registros disponibles
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
