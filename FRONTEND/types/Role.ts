import { Permission } from "./Permission"

export interface Role {
    _id: string
    role_uuid: string
    role_label: string
    role_permissions: string[]
}