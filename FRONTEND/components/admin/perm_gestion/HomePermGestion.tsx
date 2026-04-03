/*Author : Matthieu BIVILLE*/

import { useAppContext } from "@/context/AppContext";
import { useEffect, useState } from "react";
import router from "next/router";
import styles from "./PermDisplay.module.css"
import { Pencil, Trash2, Copy } from "lucide-react";
import CustomSnackBar from "../../SnackBar";
import { Permission } from "@/types/Permission";
import PermListDisplay from "./PermListDisplay";
import AddUpdatePerm from "@/components/modals/AddUpdatePerm";

export default function HomePermGestion ({userPerms} : {userPerms : string[]}) {
    const [regex, setRegex] = useState<string>("");
    const [permList, setPermList] = useState<Permission[]>();
    const [selectedPerm, setSelectedPerm] = useState<any>();
    const [rows, setRows] = useState<any>();

    const [label, setLabel] = useState<string>("");
    const [uuid, setUuid] = useState<string>("");

    useEffect(() => {
        setLabel(selectedPerm ? selectedPerm.name : "");
    }, [selectedPerm])

    const [openAlert, setOpenAlert] = useState<boolean>(false);
    const [addUpdatePerm, setAddUpdatePerm] = useState<boolean>(false);
    const [alertSeverity, setAlertSeverity] = useState<"success" | "error" | "warning" | "info">("success");
    const [alertMessage, setAlertMessage] = useState<string>("");

    const nomDInstance = "Home Perm Gestion"
    const verbose = false
    const { controleur, canal, currentUser, setCurrentUser } = useAppContext()
    const listeMessageEmis = [
        "perms_list_request", 
        "update_perm_request",
        "add_perm_request"
    ]
    const listeMessageRecus = [
        "perms_list_response", 
        "update_perm_response",
        "add_perm_response"
    ]

    const handler = {
            nomDInstance,
            traitementMessage: (msg: {
                perms_list_response?: any,
                update_perm_response? : any,
                add_perm_response? : any,
            }) => {
                if (verbose || controleur?.verboseall)
                    console.log(`INFO: (${nomDInstance}) - traitementMessage - `,msg)
                if (msg.perms_list_response) {
                    setPermList(msg.perms_list_response)
                }
                if (msg.update_perm_response) {
                    setAddUpdatePerm(false);
                    setSelectedPerm({});
                    setLabel("");
                    setAlertSeverity("success");
                    setAlertMessage("Libellé de permission mis à jour avec succès !");
                    setOpenAlert(true);
                }
                if (msg.add_perm_response) {
                    if(msg.add_perm_response.message === "already exists"){
                        setAlertMessage("Une permission avec cet uuid existe déjà !");
                        setAlertSeverity("error");
                    }
                    else{
                        setAlertMessage("Permission ajoutée avec succès !");
                        setAlertSeverity("success");
                    }
                    setAddUpdatePerm(false);
                    setLabel("");
                    setUuid("");
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
            "perms_list_request" : 1
        })
    }, [addUpdatePerm])

    useEffect(() => {
        setRows([]);
        const newRows : any = [];
        permList?.map((perm, index) => {
            if((perm.permission_label.toLowerCase()).includes(regex)){
                newRows.push({
                    id : perm._id,
                    name : perm.permission_label,
                    uuid : perm.permission_uuid,
                })
            }
        })
        setRows(newRows);
    }, [permList, regex])

    const handleAddUpdatePerm= () => {
        if (label && !uuid){
            console.log("UPDATE PERM")
            controleur.envoie(handler, {
                "update_perm_request" : {
                    perm_id : selectedPerm.id,
                    newLabel : label
                }
            })

        }
        else if (label && uuid){
            console.log("ADD PERM")
            controleur.envoie(handler, {
                "add_perm_request" : {
                    newLabel : label,
                    newUuid : uuid
                }
            })
        }
        
    }

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
            field: 'uuid', 
            headerName: "Uuid", 
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
                        style={{backgroundColor: userPerms.includes("admin_modifier_permission") ? "#223A6A" : "gray"}} 
                        className={styles.iconContainer}
                        onClick={() => {
                            if(userPerms.includes("admin_modifier_permission")){
                                setSelectedPerm(params.row); 
                                setAddUpdatePerm(true);
                            }
                        }}
                    >
                        <Pencil size={22} color="white" />
                    </div>
                </div>
            )
        },
    ];
      
    return (
        <>
            {userPerms.includes("admin_demande_liste_permissions") ? (
                    <PermListDisplay 
                        setAddUpdatePerm={setAddUpdatePerm}
                        regex={regex}
                        setRegex={setRegex}
                        rows={rows}
                        columns={columns}
                        openAlert={openAlert}
                        setOpenAlert={setOpenAlert}
                        userPerms={userPerms}
                    />
                ) : (
                    <></>
                )
            }
            <AddUpdatePerm 
                label={label}
                setLabel={setLabel}
                uuid={uuid}
                setUuid={setUuid}
                selectedPerm={selectedPerm}
                setSelectedPerm={setSelectedPerm}
                openChangeLabel={addUpdatePerm}
                setOpenChangeLabel={setAddUpdatePerm}
                handleChangeLabel={handleAddUpdatePerm}
            />
            <CustomSnackBar
                open={openAlert}
                setOpen={setOpenAlert}
                msg={alertMessage}
                severity={alertSeverity}
            />
        </>
    )
}