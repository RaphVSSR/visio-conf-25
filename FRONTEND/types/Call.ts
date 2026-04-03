import { User } from "./User";

export interface Call {
  _id?: string;
  call_uuid: string;
  call_date_create: string;
  call_date_end: string;
  call_type: "missed" | "completed" | "rejected";
  call_sender: User;
  call_recipient: User;
}
