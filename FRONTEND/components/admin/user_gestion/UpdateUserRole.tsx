/*Author : Matthieu BIVILLE*/

import { useAppContext } from "@/context/AppContext";
import { useEffect, useState } from "react";
import styles from "./UpdateUserRole.module.css"
import router from "next/router";
import { TextField, Typography } from "@mui/material";
import CustomSnackBar from "../../SnackBar";
import { Check, ChevronDown, ChevronUp, X} from "lucide-react";
import { Role } from "@/types/Role";

export default function UpdateUserRole ({
    user,
    setUpdateUser
} : {
    user: any,
    setUpdateUser : Function
}) {
    const [roleList, setRoleList] = useState<Role[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

    const [openDropDown, setOpenDropDown] = useState<boolean>(true);

    const [openAlert, setOpenAlert] = useState<boolean>(false);
    const [alertSeverity, setAlertSeverity] = useState<"success" | "error" | "warning" | "info">("success");
    const [alertMessage, setAlertMessage] = useState<string>("");

    const [email, setEmail] = useState<string>("")
    const [password, setPassword] = useState<string>("")
    const [firstname, setFirstname] = useState<string>("")
    const [lastname, setLastname] = useState<string>("")
    const [phone, setPhone] = useState<string>("")
    const [job, setJob] = useState<string>("")
    const [desc, setDesc] = useState<string>("")

    const nomDInstance = "Update User Role"
    const verbose = false
    const { controleur, canal, currentUser, setCurrentUser } = useAppContext()
    const listeMessageEmis = [
        "roles_list_request",
        "update_user_roles_request"
    ]
    const listeMessageRecus = [
        "roles_list_response",
        "update_user_roles_response"
    ]

    const handler = {
            nomDInstance,
            traitementMessage: (msg: {
                roles_list_response?: any,
                update_user_roles_response?: any
            }) => {
                if (verbose || controleur?.verboseall)
                    console.log(`INFO: (${nomDInstance}) - traitementMessage - `,msg)
                if (msg.roles_list_response) {
                    setRoleList(msg.roles_list_response)
                }
                if (msg.update_user_roles_response) {
                    setUpdateUser(false);
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
    }, [])

    useEffect(() => {
        if(user){
            console.log("USER =>", user);
            setFirstname(user.firstname);
            setLastname(user.lastname);
            setEmail(user.email);
            setPassword("");
            setPhone(user.phone);
            setJob(user.job);
            setDesc(user.desc);
            setSelectedRoles(user.roles);
        }
    }, [user])

    const handleUpdateUser = () => {
        controleur.envoie(handler, {
            "update_user_roles_request" : {
                user_id : user.id,
                firstname : firstname,
                lastname : lastname,
                email : email,
                job : job,
                phone : phone,
                password : password,
                desc : desc,
                roles: selectedRoles
            }
        })
    }

    const handleCheckboxChange = (role : Role) => {
        setSelectedRoles((prevRoles) => {
            const isSelected = prevRoles?.some(roleId => roleId === role._id);

            if (isSelected) {
                return prevRoles?.filter(roleId => roleId !== role._id);
            } else {
                return [...prevRoles, role._id];
            }
        });
    };
      

    return (
        <div className={styles.container}>
            <div style={{display: "flex", justifyContent: "left"}}>
                <div style={{display : "flex", alignItems : "center", columnGap: "20px"}}>
                    <img src="/icons/User_Friend.svg" alt="" className={styles.icon}/>
                    <Typography variant="subtitle1" className={styles.title} style={{fontSize: "32px", fontWeight: 700}}>
                        Modifier les rôles d'un utilisateur
                    </Typography>
                </div>
            </div>
            <div className={styles.signupForm}>
                <div className={styles.formGroupRow}>
                    <div className={styles.formGroup}>
                        <label htmlFor="firstname">Prénom :</label>
                        <input
                            type="text"
                            id="firstname"
                            value={firstname}
                            onChange={(e) => setFirstname(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="lastname">Nom :</label>
                        <input
                            type="text"
                            id="lastname"
                            value={lastname}
                            onChange={(e) => setLastname(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <div className={styles.formGroupRow}>
                    <div className={styles.formGroup}>
                        <label htmlFor="email">Email :</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="password">Mot de passe :</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <div className={styles.formGroupRow}>
                    <div className={styles.formGroup}>
                        <label htmlFor="phone">N° Tel :</label>
                        <input
                            type="text"
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="job">Job :</label>
                        <input
                            type="text"
                            id="job"
                            value={job}
                            onChange={(e) => setJob(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="desc">Description :</label>
                    <input
                        type="text"
                        id="desc"
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        required
                        style={{width : "85%"}}
                    />
                </div>
            </div>
            <div className={styles.perms}>
                <div className={styles.dropDown}>
                    <p className={styles.addPerm} onClick={() => setOpenDropDown(!openDropDown)}>
                        Ajouter des rôles
                        {openDropDown ? 
                            <ChevronUp size={30} color="#223A6A"/> : 
                            <ChevronDown size={30} color="#223A6A"/>
                        }
                    </p>
                    {openDropDown && <div style={{overflowY: "auto", scrollbarWidth: "thin", height: "calc(100% - 58px)"}}>
                        {
                            roleList?.map((role, index) => {
                                return (
                                    <p 
                                        style={{backgroundColor: index%2 ? "#EAEAEA" : "white"}}
                                        className={styles.option}
                                        key={role._id}
                                    >
                                        {role.role_label}
                                        <input 
                                            type="checkbox" 
                                            name="" 
                                            id="" 
                                            style={{width: "25px", height:"25px"}}
                                            onChange={() => handleCheckboxChange(role)}
                                            checked={selectedRoles?.includes(role._id)}
                                        />
                                    </p>
                                )
                            })
                        }
                    </div>}
                </div>
                <div className={styles.dropDown}>
                    <p className={styles.addPerm}>
                        Rôles sélectionnés 
                        <Check size={30} color="#223A6A"/>
                    </p>
                    <div style={{overflowY: "auto", scrollbarWidth: "thin", height: "calc(100% - 58px)"}}>
                    {
                            roleList?.map((role, index) => {
                                if(selectedRoles?.includes(role._id)){
                                    return (
                                        <p 
                                            key={role._id}
                                            style={{backgroundColor: index%2 ? "#EAEAEA" : "white"}}
                                            className={styles.option}
                                        >
                                            {role.role_label}
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
                    onClick={() => setUpdateUser(false)}
                    className={styles.button}
                    style={{background : "red"}}
                ><X size={26} color="white"/> Annuler</button>
                <button 
                    onClick={handleUpdateUser}
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