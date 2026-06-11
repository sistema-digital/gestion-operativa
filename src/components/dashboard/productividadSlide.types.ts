export type ProductividadSlideTone =
  | 'neutral'
  | 'success'
  | 'danger'
  | 'info'
  | 'warning';

export interface ProductividadSlideSummaryItem {
  label: string;
  value: string;
}

export interface ProductividadSlideHeroMetric {
  title: string;
  primaryLabel: string;
  primaryValue: number;
  primaryTone?: ProductividadSlideTone;
  secondaryLabel?: string;
  secondaryValue?: number;
  helper?: string;
  helperTone?: ProductividadSlideTone;
  tone: ProductividadSlideTone;
}

export interface ProductividadSlideTopTeam {
  rank: number;
  team: string;
  hours: number;
  description: string;
}

export interface ProductividadSlideWeeklyProgress {
  currentWeek: number;
  previousWeek: number;
  currentTotal: number;
}

export interface ProductividadSlideWeeklyDelayProgress {
  lost: number;
  operational: number;
  personal: number;
  real: number;
  approximated: number;
}

export interface ProductividadSlidePersonalCause {
  label: string;
  hours: number;
}

export interface ProductividadSlideOperationalCause {
  cause: string;
  hours: number;
  equipments: string[];
}

export interface ProductividadSlideDelayBlock {
  hours: number;
  activePeople?: number;
  missingPeople?: number;
  causes: ProductividadSlidePersonalCause[] | ProductividadSlideOperationalCause[];
}

export interface ProductividadSlideViewModel {
  areaName: string;
  supervisorName: string;
  weekLabel: string;
  heroMetrics: ProductividadSlideHeroMetric[];
  summaryItems: ProductividadSlideSummaryItem[];
  topTeams: ProductividadSlideTopTeam[];
  weeklyProgress: ProductividadSlideWeeklyProgress;
  weeklyDelayProgress: ProductividadSlideWeeklyDelayProgress;
  personalDelay: ProductividadSlideDelayBlock;
  operationalDelay: ProductividadSlideDelayBlock;
  totalDelayHours: number;
}
