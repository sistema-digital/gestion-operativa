import { defineStore } from "pinia";

interface NavigationLoaderState {
  errorSequence: number;
  isLoading: boolean;
}

export const useNavigationLoaderStore = defineStore("navigationLoader", {
  state: (): NavigationLoaderState => ({
    errorSequence: 0,
    isLoading: false,
  }),
  actions: {
    finish(): void {
      this.isLoading = false;
    },
    reportLoadError(): void {
      this.isLoading = false;
      this.errorSequence += 1;
    },
    start(): void {
      this.isLoading = true;
    },
  },
});
