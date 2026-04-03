/*Author : Matthieu BIVILLE*/

import { useAppContext } from "@/context/AppContext";
import { useEffect, useState } from "react";
import styles from "./AddTeam.module.css"
import router from "next/router";
import { TextField, Typography } from "@mui/material";
import CustomSnackBar from "../../SnackBar";
import { Check, ChevronDown, ChevronUp, X} from "lucide-react";
import { User } from "@/types/User";
import { Team } from "@/types/Team";

export default function AddUpdateTeam ({
    teamId,
    setAddUpdateTeam
} : {
    teamId? : string,
    setAddUpdateTeam : Function
}) {
    const [teamName, setTeamName] = useState<string | undefined>("");
    const [userList, setUserList] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [team, setTeam] = useState<Team>();

    const [openDropDown, setOpenDropDown] = useState<boolean>(teamId ? true : false);

    const [openAlert, setOpenAlert] = useState<boolean>(false);
    const [alertSeverity, setAlertSeverity] = useState<"success" | "error" | "warning" | "info">("success");
    const [alertMessage, setAlertMessage] = useState<string>("");

    const nomDInstance = "Add Update Team"
    const verbose = false
    const { controleur, canal, currentUser, setCurrentUser } = useAppContext()
    const listeMessageEmis = [
        "users_list_request",
        "team_create_request", 
        "team_update_request"
    ]
    const listeMessageRecus = [
        "users_list_response",
        "team_create_response", 
        "team_update_team"
    ]

    const handler = {
            nomDInstance,
            traitementMessage: (msg: {
                team_create_response? : any,
                team_update_team? : any,
                users_list_response? : any
            }) => {
                if (verbose || controleur?.verboseall)
                    console.log(`INFO: (${nomDInstance}) - traitementMessage - `,msg)
                if (msg.team_create_response) {
                    setTeamName("");
                    setSelectedUsers([]);
                    setAddUpdateTeam(false);
                }
                if (msg.team_update_team) {
                    setAddUpdateTeam(false);
                }
                if(msg.users_list_response){
                    setUserList(msg.users_list_response.users);
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
        if(teamId){
            controleur.envoie(handler, {
                "one_role_request" : {
                    role_id : teamId
                }
            })
        }
    }, [])

    useEffect(() => {
        if(team){
            setTeamName(team.name);
            // setSelectedUsers(role.role_permissions);
        }
    }, [team])

    const handleAddUpdateRole = () => {
        if(teamName){
            if(!team){
                controleur.envoie(handler, {
                    "team_create_request": {
                        name: teamName,
                        description : "",
                        members: selectedUsers,
                    },
                })
            }
            else{
                controleur.envoie(handler, {
                    "update_team_request" : {
                        team_id : teamId,
                        name : teamName,
                        members: selectedUsers
                    }
                })
            }
        }
        else{
            setAlertMessage("Vous ne pouvez créer ou modifier une équipe sans mettre un nom !");
            setAlertSeverity("error");
            setOpenAlert(true);
        }
    }

    const handleCheckboxChange = (user : User) => {
        setSelectedUsers((prevUsers) => {
            const isSelected = prevUsers?.some(userId => userId === user.id);

            if (isSelected) {
                return prevUsers?.filter(userId => userId !== user.id);
            } else {
                return [...prevUsers, user.id];
            }
        });
    };
      

    return (
        <div className={styles.container}>
            <div style={{display: "flex", justifyContent: "left"}}>
                <div style={{display : "flex", alignItems : "center", columnGap: "20px"}}>
                    <img src="/icons/User_Friend.svg" alt="" className={styles.icon}/>
                    <Typography variant="subtitle1" className={styles.title} style={{fontSize: "32px", fontWeight: 700}}>
                        {teamId ? "Modifer" : "Créer"} une équipe
                    </Typography>
                </div>
            </div>
            <div style={{display: "flex", justifyContent: "center"}}>
                <TextField 
                    id="name"
                    type="text"
                    name="name"
                    label="Nom de l'équipe"
                    value={teamName}
                    required
                    onChange={(e) => setTeamName(e.target.value)}
                    className={styles.name}
                />
            </div>
            <div className={styles.perms}>
                <div className={styles.dropDown}>
                    <p className={styles.addPerm} onClick={() => setOpenDropDown(!openDropDown)}>
                        Ajouter des membres
                        {openDropDown ? 
                            <ChevronUp size={30} color="#223A6A"/> : 
                            <ChevronDown size={30} color="#223A6A"/>
                        }
                    </p>
                    {openDropDown && <div style={{overflowY: "auto", scrollbarWidth: "thin", height: "calc(100% - 58px)"}}>
                        {
                            userList?.map((user, index) => {
                                if(user.status !== "banned"){
                                    return (
                                        <p 
                                            style={{backgroundColor: index%2 ? "#EAEAEA" : "white"}}
                                            className={styles.option}
                                            key={user.id}
                                        >
                                            {user.firstname + " " + user.lastname}
                                            <input 
                                                type="checkbox" 
                                                name="" 
                                                id="" 
                                                style={{width: "25px", height:"25px"}}
                                                onChange={() => handleCheckboxChange(user)}
                                                checked={selectedUsers.includes(user.id)}
                                            />

                                        </p>
                                    )
                                }
                            })
                        }
                    </div>}
                </div>
                <div className={styles.dropDown}>
                    <p className={styles.addPerm}>
                        Membres sélectionnés 
                        <Check size={30} color="#223A6A"/>
                    </p>
                    <div style={{overflowY: "auto", scrollbarWidth: "thin", height: "calc(100% - 58px)"}}>
                    {
                            userList?.map((user, index) => {
                                if(selectedUsers.includes(user.id)){
                                    return (
                                        <p 
                                            key={user._id}
                                            style={{backgroundColor: index%2 ? "#EAEAEA" : "white"}}
                                            className={styles.option}
                                        >
                                            {user.firstname + " " + user.lastname}
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
                    onClick={() => setAddUpdateTeam(false)}
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