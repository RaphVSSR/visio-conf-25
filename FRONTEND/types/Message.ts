import { User } from "./User"

export interface Message {
    _id?: string
    message_uuid: string
    message_content: string
    text?: string
    timestamp?: string
    message_sender: Partial<User>
    message_date_create: string
    message_status?: "sent" | "delivered" | "read"
}
