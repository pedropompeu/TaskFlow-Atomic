export interface CardAssignedPayload {
  type: 'card_assigned';
  cardTitle: string;
  boardTitle: string;
  assigneeName: string;
  assigneeEmail: string;
}

export interface StatusChangedPayload {
  type: 'status_changed';
  cardTitle: string;
  fromStatus: string;
  toStatus: string;
  assigneeName: string;
  assigneeEmail: string;
}

export interface DeadlineReminderPayload {
  type: 'deadline_reminder';
  cardTitle: string;
  dueDate: string;
  assigneeName: string;
  assigneeEmail: string;
}

export type EmailJobPayload =
  | CardAssignedPayload
  | StatusChangedPayload
  | DeadlineReminderPayload;
