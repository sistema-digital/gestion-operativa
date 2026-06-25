export interface MeetingBatchItem {
  supervisorId: number;
  supervisorName: string;
  assignedMeetingWeekday: string;
  evaluatedDate: string | null;
  inspectionId: number | null;
  inspectorId: number | null;
  inspectorName: string;
  currentMeetingScore: number | null;
  supervisorObservation: string;
  managementObservation: string;
  originalObservation: string;
  hasExistingMeeting: boolean;
  hasBaseInspection: boolean;
}

export interface MeetingBatchDraftPayload {
  supervisorId: number;
  puntuacion: number;
  observacionGerencia: string;
}
