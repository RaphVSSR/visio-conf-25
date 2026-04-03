/*Author : Matthieu BIVILLE*/

import { useAppContext } from "@/context/AppContext";
import { useEffect, useState } from "react";
import styles from "./UserDisplay.module.css"
import router from "next/router";
import { Pencil, Trash2, Power } from "lucide-react";
import CustomSnackBar from "../../SnackBar";
import UserListDisplay from "./UserListDisplay";
import { User } from "@/types/User";
import UpdateUserRole from "./UpdateUserRole";

export default function HomeUserGestion ({userPerms} : {userPerms : string[]}) {
    const [regex, setRegex] = useState<string>("");
    const [userList, setUserList] = useState<User[]>();
    const [selectedUser, setSelectedUser] = useState<any>();
    const [rows, setRows] = useState<any>();

    const [openChangeStatus, setOpenChangeStatus] = useState<boolean>(false);
    const [openAlert, setOpenAlert] = useState<boolean>(false);
    const [updateUser, setUpdateUser] = useState<boolean>(false);
    const [alertSeverity, setAlertSeverity] = useState<"success" | "error" | "warning" | "info">("success");
    const [alertMessage, setAlertMessage] = useState<string>("");
    const [action, setAction] = useState<string>("");

    const nomDInstance = "Home User Gestion"
    const verbose = false
    const { controleur, canal, currentUser, setCurrentUser } = useAppContext()
    const listeMessageEmis = [
        "users_list_request", 
        "update_user_status_request",
        "update_user_roles_request"
    ]
    const listeMessageRecus = [
        "users_list_response", 
        "update_user_status_response",
        "update_user_roles_response"
    ]

    const handler = {
            nomDInstance,
            traitementMessage: (msg: {
                users_list_response?: any,
                update_user_status_response? : any,
                update_user_roles_response? : any
            }) => {
                if (verbose || controleur?.verboseall)
                    console.log(`INFO: (${nomDInstance}) - traitementMessage - `,msg)
                if (msg.users_list_response) {
                    setUserList(msg.users_list_response.users)
                }
                if (msg.update_user_status_response) {
                    const usedAction = msg.update_user_status_response.action;
                    setOpenChangeStatus(false);
                    setAlertMessage(`Utilisateur 
                        ${usedAction === "activate" ? " activé " : (usedAction === "deactivate" ? " désactivé " : " banni ")} 
                    avec succès !`);
                    setAlertSeverity("success");
                    setOpenAlert(true);
                }
                if (msg.update_user_roles_response) {
                    setAlertMessage(`Rôle de l'utilisateur mis à jour avec succès !`);
                    setAlertSeverity("success");
                    setOpenAlert(true);
                }
            },
        }

    useEffect(() => {
        if (controleur && canal) {
            controleur.inscription(handler, listeMessageEmis, listeMessageRecus)
        }
        return () => {
            if (controleur) {
                controleur.desincription(handler,listeMessageEmis,listeMessageRecus)
            }
        }
    }, [router, controleur, canal])

    useEffect(() => {
        controleur.envoie(handler, {
            "users_list_request" : 1
        })
    }, [openChangeStatus, updateUser])

    useEffect(() => {
        setRows([]);
        const newRows : any = [];
        userList?.map((user, index) => {
            if(
                ((user.firstname + " " + user.lastname).toLowerCase()).includes(regex)
                && user.status !== "banned"
            ){
                newRows.push({
                    id : user.id,
                    firstname : user.firstname,
                    lastname : user.lastname,
                    email: user.email,
                    phone : user.phone,
                    job : user.job,
                    desc : user.desc,
                    status: user.status === "active" ? "Actif" :
                    (user.status === "waiting" ? "En attente" : "Désactivé"),
                    roles : user.roles
                })
            }
        })
        setRows(newRows);
    }, [userList, regex])

    const columns = [
        { 
            field: 'firstname', 
            headerName: 'Prénom', 
            flex: 1,
            renderCell: (params : any) => (
                <div className={styles.rowLabel}>
                    {params.value}
                </div>
            )
        },
        { 
            field: 'lastname', 
            headerName: "Nom", 
            flex: 1,
            renderCell: (params : any) => (
                <div className={styles.rowLabel}>
                    {params.value}
                </div>
            )
        },
        { 
            field: 'email', 
            headerName: "Email", 
            flex: 2,
            renderCell: (params : any) => (
                <div className={styles.rowLabel}>
                    {params.value}
                </div>
            )
        },
        { 
            field: 'status', 
            headerName: "Status", 
            flex: 1,
            renderCell: (params : any) => (
                <div className={styles.rowLabel}>
                    {params.value}
                </div>
            )
        },
        { 
            field: 'action', 
            headerName: 'Actions', 
            flex: 1,
            renderCell: (params : any) => (
                <div className={styles.rowIcons}>
                    <div 
                        style={{backgroundColor: userPerms.includes("admin_modifier_utilisateur") ? "#223A6A" : "gray"}} 
                        className={styles.iconContainer}
                        onClick={() => {
                            if(userPerms.includes("admin_modifier_utilisateur")){
                                setSelectedUser(params.row); 
                                setUpdateUser(true);
                            }
                        }}
                    >
                        <Pencil size={22} color="white" />
                    </div>
                    <div 
                        style={{backgroundColor: userPerms.includes("admin_desactiver_utilisateur") ? (
                            params.row.status === "Actif" ? "#e07b00" : "#00bd13"
                        ) : "gray"}} 
                        className={styles.iconContainer}
                        onClick={() => {
                            if(userPerms.includes("admin_desactiver_utilisateur")){
                                setAction(params.row.status === "Actif" ? "deactivate" : "activate");
                                setSelectedUser(params.row); 
                                setOpenChangeStatus(true)
                            }
                        }}
                    >
                        <Power size={22} color="white" />
                    </div>
                    <div 
                        style={{backgroundColor: userPerms.includes("admin_supprimer_utilisateur") ? "#CB0000" : "gray"}} 
                        className={styles.iconContainer}
                        onClick={() => {
                            if(userPerms.includes("admin_supprimer_utilisateur")){
                                setAction("ban");
                                setSelectedUser(params.row); 
                                setOpenChangeStatus(true)
                            }
                        }}
                    >
                        <Trash2 size={22} color="white" />
                    </div>
                </div>
            )
        },
    ];

    const handleChangeStatus = () => {
        controleur.envoie(handler, {
            "update_user_status_request" : {
                user_id : selectedUser.id,
                action : action
            }
        })
    }
      
    if(!updateUser){
        return (
            <>
            {userPerms.includes("admin_demande_liste_utilisateurs") ? (
                    <UserListDisplay 
                        regex={regex}
                        setRegex={setRegex}
                        rows={rows}
                        columns={columns}
                        openChangeStatus={openChangeStatus}
                        setOpenChangeStatus={setOpenChangeStatus}
                        selectedUser={selectedUser}
                        handleChangeStatus={handleChangeStatus}
                        openAlert={openAlert}
                        setOpenAlert={setOpenAlert}
                        action={action}
                    />
                ) : (
                    <></> //FAIRE CE QU'ON AFFICHE SI PAS LE DROIT 
                )
            }
                <CustomSnackBar
                    open={openAlert}
                    setOpen={setOpenAlert}
                    msg={alertMessage}
                    severity={alertSeverity}
                />
            </>
        )
    }
    else{
        return (
            <UpdateUserRole
                user={selectedUser}
                setUpdateUser={setUpdateUser}
            />
        )
    }
}