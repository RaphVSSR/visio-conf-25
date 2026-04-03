/*Author : Matthieu BIVILLE*/

import { useAppContext } from "@/context/AppContext";
import { useEffect, useState } from "react";
import styles from "./RoleDisplay.module.css"
import router from "next/router";
import { Pencil, Trash2, Copy } from "lucide-react";
import { Role } from "@/types/Role";
import RoleListDisplay from "./RoleListDisplay";
import AddUpdateRole from "./AddUpdateRole";
import CustomSnackBar from "../../SnackBar";

export default function HomeRoleGestion ({userPerms} : {userPerms : string[]}) {
    const [regex, setRegex] = useState<string>("");
    const [roleList, setRoleList] = useState<Role[]>();
    const [selectedRole, setSelectedRole] = useState<any>();
    const [rows, setRows] = useState<any>();

    const [openDelete, setOpenDelete] = useState<boolean>(false);
    const [openDuplicate, setOpenDuplicate] = useState<boolean>(false);
    const [openAlert, setOpenAlert] = useState<boolean>(false);
    const [addUpdateRole, setAddUpdateRole] = useState<boolean>(false);
    const [alertSeverity, setAlertSeverity] = useState<"success" | "error" | "warning" | "info">("success");
    const [alertMessage, setAlertMessage] = useState<string>("");

    const nomDInstance = "Home Role Gestion"
    const verbose = false
    const { controleur, canal, currentUser, setCurrentUser } = useAppContext()
    const listeMessageEmis = [
        "roles_list_request", 
        "delete_role_request",
        "create_role_request", 
    ]
    const listeMessageRecus = [
        "roles_list_response", 
        "deleted_role",
        "created_role",
        "updated_role"
    ]

    const handler = {
            nomDInstance,
            traitementMessage: (msg: {
                roles_list_response?: any,
                deleted_role? : any,
                created_role? : any,
                updated_role? : any,
            }) => {
                if (verbose || controleur?.verboseall)
                    console.log(`INFO: (${nomDInstance}) - traitementMessage - `,msg)
                if (msg.roles_list_response) {
                    setRoleList(msg.roles_list_response)
                }
                if (msg.deleted_role) {
                    setOpenDelete(false);
                    setAlertMessage("Rôle supprimé avec succès !");
                    setAlertSeverity("success");
                    setOpenAlert(true);
                }
                if (msg.created_role) {
                    setOpenDuplicate(false);
                    setAlertMessage(`
                        ${msg.created_role.action === "create" ? "Nouveau r" : "R"}ôle 
                        ${msg.created_role.action === "create" ? " créé " : " dupliqué "} avec succès !`
                    );
                    setAlertSeverity("success");
                    setOpenAlert(true);
                }
                if (msg.updated_role) {
                    setAlertMessage("Rôle mis à jour avec succès !");
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
            "roles_list_request" : 1
        })
    }, [openDelete, openDuplicate, addUpdateRole])

    useEffect(() => {
        setRows([]);
        const newRows : any = [];
        roleList?.map((role, index) => {
            if((role.role_label.toLowerCase()).includes(regex)){
                newRows.push({
                    id : role._id,
                    name : role.role_label,
                    perm : role.role_permissions,
                    nbPerm : role.role_permissions.length,
                    action : ""
                })
            }
        })
        setRows(newRows);
    }, [roleList, regex])

    const columns = [
        { 
            field: 'name', 
            headerName: 'Nom', 
            flex: 2,
            renderCell: (params : any) => (
                <div className={styles.rowLabel}>
                    {params.value}
                </div>
            )
        },
        { 
            field: 'nbPerm', 
            headerName: "Nombre de permissions", 
            flex: 2,
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
                        style={{backgroundColor: userPerms.includes("admin_dupliquer_role") ? "#223A6A" : "gray"}} 
                        className={styles.iconContainer}
                        onClick={() => {
                            if(userPerms.includes("admin_dupliquer_role")){
                                setSelectedRole(params.row); 
                                setOpenDuplicate(true);
                            }
                        }}
                    >
                        <Copy size={22} color="white" />
                    </div>
                    <div 
                        style={{backgroundColor: userPerms.includes("admin_modifier_role") ? "#223A6A" : "gray"}} 
                        className={styles.iconContainer}
                        onClick={() => {
                            if(userPerms.includes("admin_modifier_role")){
                                setSelectedRole(params.row); 
                                setAddUpdateRole(true);
                            }
                        }}
                    >
                        <Pencil size={22} color="white" />
                    </div>
                    <div 
                        style={{backgroundColor: userPerms.includes("admin_supprimer_role") ? "#CB0000" : "gray"}} 
                        className={styles.iconContainer}
                        onClick={() => {
                            if(userPerms.includes("admin_supprimer_role")){
                                setSelectedRole(params.row); 
                                setOpenDelete(true);
                            }
                        }}
                    >
                        <Trash2 size={22} color="white" />
                    </div>
                </div>
            )
        },
    ];

    const handleDeleteRole = () => {
        controleur.envoie(handler, {
            "delete_role_request" : {
                role_id : selectedRole.id
            }
        })
    }

    const handleDuplicateRole = () => {
        var i = 2;
        while(roleList?.find(role => role.role_label === selectedRole.name + ` (${i})`)){
            i++;
        }
        controleur.envoie(handler, {
            "create_role_request" : {
                name : selectedRole.name + ` (${i})`,
                perms: selectedRole.perm,
                action : "duplicate"
            }
        })
    }
      
    if(!addUpdateRole){
        return (
            <>
            {userPerms.includes("admin_demande_liste_roles") ? (
                    <RoleListDisplay 
                        setAddUpdateRole={setAddUpdateRole}
                        regex={regex}
                        setRegex={setRegex}
                        rows={rows}
                        columns={columns}
                        openDelete={openDelete}
                        setOpenDelete={setOpenDelete}
                        selectedRole={selectedRole}
                        handleDeleteRole={handleDeleteRole}
                        openAlert={openAlert}
                        setOpenAlert={setOpenAlert}
                        openDuplicate={openDuplicate}
                        setOpenDuplicate={setOpenDuplicate}
                        handleDuplicateRole={handleDuplicateRole}
                        userPerms={userPerms}
                    />
                ) : (
                    <></>
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
            <AddUpdateRole
                roleId={selectedRole?.id}
                setAddUpdateRole={setAddUpdateRole}
            />
        )
    }
}