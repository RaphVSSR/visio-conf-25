/**
 * Liste des messages émis
 * @type {string[]}
 */
export const ListeMessagesEmis = [
    "client_deconnexion", // No data
    "login_request", // { login: string, password: string }
    "signup_request", // { login: string, password: string, firstname: string, lastname: string, phone: string, job: string, desc: string }
    "users_list_request", // No data
    "messages_get_request", // { userEmail: string | undefined, otherUserEmail: string }
    "message_send_request", // { userEmail: string, otherUserEmail: string, text: string }
    "upload_request", // { media: string }
    "update_user_status_request", // {user_id : ObjectId, action : string}
    "update_user_roles_request", // {user_id : ObjectId, roles : Role._id[]}
    "upload_request", // { media: string }
    "update_user_request", // { any field of User }
    "user_info_request", // { user_info_request: { userId: string } }
    //---- DISCUSS ----
    "messages_get_request", // { convId: uuid }
    "message_send_request", // { userEmail: string, otherUserEmail?: string[], convId?:uuid , text: string }
    "discuss_list_request", // { userId : uuid }
    "users_search_request", // { requestArgs : string }
    "discuss_remove_member_request", // { UserId : uuid, convId : uuid }
    "discuss_remove_message_request", // { messageId : uuid, convId : uuid }
    "message_status_request", // { convId: uuid }
    //---- ROLES ----
    "roles_list_request", // No data
    "one_role_request", // { role_id : ObjectId}=
    "create_role_request", // { name : string, perms : Permission._id[], action : string}=
    "update_role_request", // { role_id : ObjectId, perms : Permission._id[]}
    "delete_role_request", // {role_id : ObjectId}
    //---- PERMISSIONS ----
    "perms_list_request", // No data=
    "user_perms_request", //{ userId : ObjectId}
    "update_perm_request", // { perm_id : ObjectId, newLabel : string}
    "add_perm_request", // { newLabel : string, newUuid : string}=    //---- FILES ----
    "files_list_request", // { folderId?: string }
    "file_delete_request", // { fileId: string }
    "file_rename_request", // { fileId: string, newName: string }
    "file_move_request", // { fileId: string, newParentId: string }
    "file_share_to_team_request", // { fileId: string, teamId: string }
    "shared_files_list_request", // { teamId?: string }
    "folders_list_request", // { ownerId?: string }
    "folder_create_request", // { name: string, parentId?: string }
    //---- CHANNELS ----
    "channels_list_request", // { teamId?: string }
    "channel_create_request", // { name: string, teamId: string, isPublic: boolean, members?: string[] }
    "channel_update_request", // { id: string, name?: string, isPublic?: boolean }
    "channel_delete_request", // { channelId: string }
    "channel_leave_request", // { channelId: string }
    "channel_members_request", // { channelId: string }
    "channel_add_member_request", // { channelId: string, userId: string }
    "channel_remove_member_request", // { channelId: string, userId: string }
    "channel_posts_request", // { channelId: string }
    "channel_post_create_request", // { channelId: string, content: string }
    "channel_post_responses_request", // { postId: string }
    "channel_post_response_create_request", // { postId: string, content: string }
    //---- TEAMS ----
    "teams_list_request", // No data
    "team_create_request", // { name: string, description?: string, picture?: string, members?: string[] }
    "team_update_request", // { teamId: string, name?: string, description?: string, picture?: string }
    "team_delete_request", // { teamId: string }
    "team_leave_request", // { teamId: string }
    "team_members_request", // { teamId: string }
    "team_add_member_request", // { teamId: string, userId: string }
    "team_remove_member_request", // { teamId: string, userId: string }
    "all_teams_request", // No data
]

/**
 * Liste des messages reçus
 * @type {string[]}
 */
export const ListeMessagesRecus = [
    "client_deconnexion", // No data
    "login_response", // { etat: boolean, token?: string }
    "signup_response", // { etat: boolean, token?: string }
    "users_list_response", // { etat: boolean, users?: User[], error?: string }=
    "messages_get_response", // { etat: boolean, messages?: Message[], error?: string }
    "message_send_response", // { etat: boolean, error?: string }
    "upload_response", // { etat: boolean, error?: string, url?: string }
    "update_user_response", // { etat: boolean, newUserInfo: User | null,  error?: string }
    "update_user_status_response", // {etat: boolean, action : string}
    "update_user_roles_response", // {userId : ObjectId}=
    "upload_response", // { etat: boolean, error?: string, fileName?: string }
    "update_user_response", // { etat: boolean, newUserInfo: User | null,  error?: string }=
    "user_info_response", // { user_info_response: { etat: boolean, userInfo?: User, error?: string } }
    //---- DISCUSS ----
    "messages_get_response", // { etat: boolean, messages?: Message[], error?: string }
    "message_send_response", // { etat: boolean, error?: string }
    "discuss_list_response", //{ etat: boolean, discussList? : Discussion[], error?: string }
    "users_search_response", // {  etat: boolean, users?: User[], error?: string }
    "discuss_remove_member_response", // { etat: boolean, error?: string }
    "discuss_remove_message_response", // { etat: boolean, error?: string }
    "message_status_response", // {etat: boolean, error?: string }
    //---- ROLES ----
    "roles_list_response", // {role_list : Role[]}
    "one_role_response", // {role : Role}
    "created_role", // { role_id : ObjectId }
    "role_already_exists", // { state : boolean }
    "updated_role", //{ state : boolean}
    "deleted_role", // {state : boolean}
    //---- PERMISSIONS ----=
    "perms_list_response", // { perms?: Permission[]}
    "user_perms_response", // { perms : Permission[]}
    "update_perm_response", // { state : boolean }
    "add_perm_response", // {message : string }=    //---- FILES ----
    "files_list_response", // { etat: boolean, files?: File[], error?: string }
    "file_delete_response", // { etat: boolean, fileId?: string, error?: string }
    "file_rename_response", // { etat: boolean, error?: string }
    "file_move_response", // { etat: boolean,  error?: string }
    "file_share_to_team_response", // { etat: boolean, fileId?: string, teamId?: string, error?: string }
    "shared_files_list_response", // { etat: boolean, files?: File[], teamId?: string, error?: string }
    "folders_list_response", // { etat: boolean, folders?: File[], error?: string }
    "folder_create_response", // { etat: boolean, error?: string }
    //---- CHANNELS ----
    "channels_list_response", // { etat: boolean, channels?: Channel[], error?: string }
    "channel_create_response", // { etat: boolean, channel?: Channel, error?: string }
    "channel_update_response", // { etat: boolean, channel?: Channel, error?: string }
    "channel_delete_response", // { etat: boolean, channelId?: string, error?: string }
    "channel_leave_response", // { etat: boolean, channelId?: string, error?: string }
    "channel_members_response", // { etat: boolean, channelId?: string, members?: ChannelMember[], error?: string }
    "channel_add_member_response", // { etat: boolean, channelId?: string, member?: ChannelMember, error?: string }
    "channel_remove_member_response", // { etat: boolean, channelId?: string, userId?: string, error?: string }
    "channel_posts_response", // { etat: boolean, channelId?: string, posts?: ChannelPost[], error?: string }
    "channel_post_create_response", // { etat: boolean, post?: ChannelPost, error?: string }
    "channel_post_responses_response", // { etat: boolean, postId?: string, responses?: ChannelPostResponse[], error?: string }
    "channel_post_response_create_response", // { etat: boolean, postId?: string, response?: ChannelPostResponse, error?: string }
    //---- TEAMS ----
    "teams_list_response", // { etat: boolean, teams?: Team[], error?: string }
    "team_create_response", // { etat: boolean, team?: Team, error?: string }
    "team_update_response", // { etat: boolean, team?: Team, error?: string }
    "team_delete_response", // { etat: boolean, teamId?: string, error?: string }
    "team_leave_response", // { etat: boolean, teamId?: string, error?: string }
    "team_members_response", // { etat: boolean, teamId?: string, members?: TeamMember[], error?: string }
    "team_add_member_response", // { etat: boolean, teamId?: string, member?: TeamMember, error?: string }
    "team_remove_member_response", // { etat: boolean, teamId?: string, userId?: string, error?: string }
    "all_teams_response", // No data
]
