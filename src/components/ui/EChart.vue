<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, shallowRef } from 'vue';
import * as echarts from 'echarts/core';
import {
  BarChart,
  LineChart
} from 'echarts/charts';
import {
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomInsideComponent,
  DataZoomSliderComponent
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';

echarts.use([
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  BarChart,
  LineChart,
  SVGRenderer
]);

const props = defineProps<{
  option: any;
  dimensionKey?: string;
  theme?: string | object;
}>();

const emit = defineEmits<{
  (e: 'click', params: any): void;
  (e: 'zrClick', params: any): void;
  (e: 'legendselectchanged', params: any): void;
}>();

const chartRef = ref<HTMLElement | null>(null);
const chartInstance = shallowRef<echarts.ECharts | null>(null);

const initChart = () => {
  if (!chartRef.value) return;
  // Initialize with svg renderer
  chartInstance.value = echarts.init(chartRef.value, props.theme || null, { renderer: 'svg' });
  
  if (props.option) {
    chartInstance.value.setOption(props.option, true);
  }

  chartInstance.value.on('click', (params) => {
    emit('click', params);
  });
  
  chartInstance.value.getZr().on('click', (params) => {
    emit('zrClick', params);
  });

  chartInstance.value.on('legendselectchanged', (params) => {
    emit('legendselectchanged', params);
  });
};

let resizeTimeout: any;
const handleWindowResize = () => {
  if (resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    chartInstance.value?.resize();
  }, 100);
};

onMounted(() => {
  initChart();
  window.addEventListener('resize', handleWindowResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize);
  chartInstance.value?.dispose();
});

watch(() => props.option, (newOption) => {
  if (chartInstance.value) {
    chartInstance.value.setOption(newOption, true);
  }
}, { deep: true });

defineExpose({
  chart: chartInstance
});
</script>

<template>
  <div ref="chartRef" class="w-full h-full"></div>
</template>
