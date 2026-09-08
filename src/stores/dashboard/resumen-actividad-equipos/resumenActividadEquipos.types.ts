export type ActivityTeamsSummaryTab = "general" | "desglose";

export interface ActivityTeamsFilters {
  startDate: string;
  endDate: string;
}

export interface ActivityTeamsRange {
  startDate: string;
  endDate: string;
  timezone: string;
}

export interface ActivityTeamsTotals {
  equipment: number;
  journeys: number;
  totalSeconds: number;
  totalTime: string;
  engineOnSeconds: number;
  engineOnTime: string;
  engineOnPercentage: number;
  engineOffSeconds: number;
  engineOffTime: string;
  engineOffPercentage: number;
  engineUndefinedSeconds: number;
  engineUndefinedTime: string;
  engineUndefinedPercentage: number;
}

export interface ActivityTeamsDay {
  date: string;
  weekday: string;
  engineOnPercentage: number;
  engineOffPercentage: number;
  engineUndefinedPercentage: number;
  engineOnTime: string;
  engineOffTime: string;
  engineUndefinedTime: string;
  equipment: number;
  journeys: number;
}

export interface ActivityTeamsRankingItem {
  label: string;
  value: string;
  percentage: number;
  secondary: string | null;
  supportingMetric?: string | null;
}

export interface ActivityTeamsEquipmentPerformance {
  code: string;
  type: string | null;
  engineOnSeconds: number;
  engineOffSeconds: number;
  engineUndefinedSeconds: number;
  totalSeconds: number;
}

export interface ActivityTeamsEquipmentType {
  code: string;
  type: string | null;
}

export interface ActivityTeamsTypePerformance {
  label: string;
  value: string;
  percentage: number;
  secondary: string | null;
}

export interface ActivityTeamsReport {
  range: ActivityTeamsRange;
  totals: ActivityTeamsTotals;
  bestDay: ActivityTeamsDay | null;
  worstDay: ActivityTeamsDay | null;
  topJobs: ActivityTeamsRankingItem[];
  topStopReasons: ActivityTeamsRankingItem[];
  equipmentPerformance: ActivityTeamsEquipmentPerformance[];
  dailyActivity: ActivityTeamsDay[];
  bestEquipment: ActivityTeamsRankingItem[];
  worstEquipment: ActivityTeamsRankingItem[];
  topOperators: ActivityTeamsRankingItem[];
}

export type ActivityTeamsLoadState =
  "idle" | "loading" | "ready" | "empty" | "error";
