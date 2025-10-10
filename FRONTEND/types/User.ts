export interface User {
    _id: string
    id: string
    uuid: string
    firstname: string
    lastname: string
    email: string
    picture: string
    status: string
    socket_id?: string
    phone: string
    desc: string
    date_create: string
    roles: string[]
    job: string
    disturb_status: string
    last_connection: string
}
