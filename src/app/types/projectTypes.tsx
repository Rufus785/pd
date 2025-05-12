export interface Project {
  id: number;
  name: string;
  status: ProjectStatus;
  payment_status: PaymentStatus;
  subscription_end?: string | null;
  wireframe_link?: string | null;
}

export interface Task {
  id: number;
  project_id: number;
  user_id: number;
  title: string;
  description?: string | null;
  priority: Priority;
  status: TaskStatus;
}

export interface Meeting {
  id: number;
  project_id: number;
  meeting_date: string;
  description?: string | null;
}

export interface User {
  id: number;
  nickname: string;
  role?: string;
}

export type ProjectStatus = "Active" | "Archived" | "Closed";
export type PaymentStatus = "Paid" | "Unpaid";
export type Priority = "Low" | "Medium" | "High";
export type TaskStatus =
  | "ToDo"
  | "InProgress"
  | "CodeReview"
  | "Deprecated"
  | "Done";
export type TeamRole = "PM" | "Designer" | "Developer";
