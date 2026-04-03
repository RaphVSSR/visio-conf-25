/*Author : Matthieu BIVILLE*/

import { useAppContext } from "@/context/AppContext";
import { useEffect, useState } from "react";
import styles from "./AddRole.module.css"
import router from "next/router";
import { TextField, Typography } from "@mui/material";
import CustomSnackBar from "../../SnackBar";
import { Check, ChevronDown, ChevronUp, X} from "lucide-react";
import { Permission } from "@/types/Permission";
import { Role } from "@/types/Role";

export default function AddUpdateRole ({
    roleId,
    setAddUpdateRole
} : {
    roleId? : string,
    setAddUpdateRole : Function
}) {
    const [roleName, setRoleName] = useState<string | undefined>("");
    const [permList, setPermList] = useState<Permission[]>([]);
    const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
    const [role, setRole] = useState<Role>();

    const [openDropDown, setOpenDropDown] = useState<boolean>(roleId ? true : false);

    const [openAlert, setOpenAlert] = useState<boolean>(false);
    const [alertSeverity, setAlertSeverity] = useState<"success" | "error" | "warning" | "info">("success");
    const [alertMessage, setAlertMessage] = useState<string>("");

    const nomDInstance = "Add Update Role"
    const verbose = false
    const { controleur, canal, currentUser, setCurrentUser } = useAppContext()
    const listeMessageEmis = [
        "perms_list_request", 
        "create_role_request", 
        "one_role_request",
        "update_role_request"
    ]
    const listeMessageRecus = [
        "perms_list_response", 
        "created_role", 
        "role_already_exists", 
        "one_role_response",
        "updated_role"
    ]

    const handler = {
            nomDInstance,
            traitementMessage: (msg: {
                perms_list_response?: any,
                role_already_exists? : any,
                created_role? : any,
                updated_role? : any,
                one_role_response? : any
            }) => {
                if (verbose || controleur?.verboseall)
                    console.log(`INFO: (${nomDInstance}) - traitementMessage - `,msg)
                if (msg.perms_list_response) {
                    setPermList(msg.perms_list_response)
                }
                if (msg.role_already_exists) {
                    setAlertMessage("Un rôle avec ce nom existe déjà !");
                    setAlertSeverity("error");
                    setOpenAlert(true);
                }
                if (msg.created_role) {
                    setRoleName("");
                    setSelectedPerms([]);
                    setAddUpdateRole(false);
                }
                if (msg.updated_role) {
                    setAddUpdateRole(false);
                }
                if (msg.one_role_response){
                    setRole(msg.one_role_response.role);
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
        if(roleId){
            controleur.envoie(handler, {
                "one_role_request" : {
                    role_id : roleId
                }
            })
        }
    }, [])

    useEffect(() => {
        if(role){
            setRoleName(role.role_label);
            setSelectedPerms(role.role_permissions);
        }
    }, [role])

    const handleAddUpdateRole = () => {
        if(roleName){
            if(!role){
                controleur.envoie(handler, {
                    "create_role_request" : {
                        name : roleName,
                        perms: selectedPerms,
                        action : "create"
                    }
                })
            }
            else{
                controleur.envoie(handler, {
                    "update_role_request" : {
                        role_id : roleId,
                        name : roleName,
                        perms: selectedPerms
                    }
                })
            }
        }
        else{
            setAlertMessage("Vous ne pouvez créer ou modifier un rôle sans mettre un nom !");
            setAlertSeverity("error");
            setOpenAlert(true);
        }
    }

    const handleCheckboxChange = (perm : Permission) => {
        setSelectedPerms((prevPermissions) => {
            const isSelected = prevPermissions?.some(permissionId => permissionId === perm._id);

            if (isSelected) {
                return prevPermissions?.filter(permissionId => permissionId !== perm._id);
            } else {
                return [...prevPermissions, perm._id];
            }
        });
    };
      

    return (
        <div className={styles.container}>
            <div style={{display: "flex", justifyContent: "left"}}>
                <div style={{display : "flex", alignItems : "center", columnGap: "20px"}}>
                    <img src="/icons/User_Friend.svg" alt="" className={styles.icon}/>
                    <Typography variant="subtitle1" className={styles.title} style={{fontSize: "32px", fontWeight: 700}}>
                        {roleId ? "Modifer" : "Créer"} un rôle
                    </Typography>
                </div>
            </div>
            <div style={{display: "flex", justifyContent: "center"}}>
                <TextField 
                    id="name"
                    type="text"
                    name="name"
                    label="Nom du rôle"
                    value={roleName}
                    required
                    onChange={(e) => setRoleName(e.target.value)}
                    className={styles.name}
                />
            </div>
            <div className={styles.perms}>
                <div className={styles.dropDown}>
                    <p className={styles.addPerm} onClick={() => setOpenDropDown(!openDropDown)}>
                        Ajouter des permissions
                        {openDropDown ? 
                            <ChevronUp size={30} color="#223A6A"/> : 
                            <ChevronDown size={30} color="#223A6A"/>
                        }
                    </p>
                    {openDropDown && <div style={{overflowY: "auto", scrollbarWidth: "thin", height: "calc(100% - 58px)"}}>
                        {
                            permList?.map((perm, index) => {
                                return (
                                    <p 
                                        style={{backgroundColor: index%2 ? "#EAEAEA" : "white"}}
                                        className={styles.option}
                                        key={perm._id}
                                    >
                                        {(perm.permission_uuid.includes("admin") ? "(Admin) " : "") + perm.permission_label}
                                        <input 
                                            type="checkbox" 
                                            name="" 
                                            id="" 
                                            style={{width: "25px", height:"25px"}}
                                            onChange={() => handleCheckboxChange(perm)}
                                            checked={selectedPerms.includes(perm._id)}
                                        />
                                    </p>
                                )
                            })
                        }
                    </div>}
                </div>
                <div className={styles.dropDown}>
                    <p className={styles.addPerm}>
                        Permissions sélectionnées 
                        <Check size={30} color="#223A6A"/>
                    </p>
                    <div style={{overflowY: "auto", scrollbarWidth: "thin", height: "calc(100% - 58px)"}}>
                    {
                            permList?.map((perm, index) => {
                                if(selectedPerms.includes(perm._id)){
                                    return (
                                        <p 
                                            key={perm._id}
                                            style={{backgroundColor: index%2 ? "#EAEAEA" : "white"}}
                                            className={styles.option}
                                        >
                                            {(perm.permission_uuid.includes("admin") ? "(Admin) " : "") + perm.permission_label}
                                        </p>
                                    )
                                }
                            })
                        }
                    </div>
                </div>
            </div>
            <div style={{display: "flex", justifyContent: "space-between"}}>
                <button 
                    onClick={() => setAddUpdateRole(false)}
                    className={styles.button}
                    style={{background : "red"}}
                ><X size={26} color="white"/> Annuler</button>
                <button 
                    onClick={handleAddUpdateRole}
                    className={styles.button}
                    style={{background : "#223A6A"}}
                ><Check size={26} color="white"/> Valider</button>
            </div>
            <CustomSnackBar
                open={openAlert}
                setOpen={setOpenAlert}
                msg={alertMessage}
                severity={alertSeverity}
            />
        </div>
    )
}