import { reactive, readonly, ref } from 'vue';

export type DashboardHeaderSlide = {
  id: string;
  label: string;
};

type DashboardHeaderNavPayload = {
  currentSlideIndex: number;
  onSelectSlide: (index: number) => void;
  slides: DashboardHeaderSlide[];
};

const dashboardHeaderNavState = reactive({
  currentSlideIndex: 0,
  isVisible: false,
  slides: [] as DashboardHeaderSlide[],
});

const selectSlideHandler = ref<((index: number) => void) | null>(null);

const resetDashboardHeaderNav = () => {
  dashboardHeaderNavState.currentSlideIndex = 0;
  dashboardHeaderNavState.isVisible = false;
  dashboardHeaderNavState.slides = [];
  selectSlideHandler.value = null;
};

export const useDashboardHeaderNav = () => {
  const syncDashboardHeaderNav = ({ currentSlideIndex, onSelectSlide, slides }: DashboardHeaderNavPayload) => {
    dashboardHeaderNavState.currentSlideIndex = currentSlideIndex;
    dashboardHeaderNavState.isVisible = slides.length > 1;
    dashboardHeaderNavState.slides = slides;
    selectSlideHandler.value = onSelectSlide;
  };

  const selectDashboardHeaderSlide = (index: number) => {
    selectSlideHandler.value?.(index);
  };

  return {
    clearDashboardHeaderNav: resetDashboardHeaderNav,
    dashboardHeaderNavState: readonly(dashboardHeaderNavState),
    selectDashboardHeaderSlide,
    syncDashboardHeaderNav,
  };
};
