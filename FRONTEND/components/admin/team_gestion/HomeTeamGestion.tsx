/*Author : Matthieu BIVILLE*/

import { useAppContext } from "@/context/AppContext";
import { useEffect, useState } from "react";
import styles from "./TeamDisplay.module.css"
import router from "next/router";
import { Pencil, Trash2, Copy } from "lucide-react";
import TeamListDisplay from "./TeamListDisplay";
import CustomSnackBar from "../../SnackBar";
import { AllTeam } from "@/types/Team";
import AddUpdateTeam from "./AddUpdateTeam";

export default function HomeTeamGestion ({userPerms} : {userPerms : string[]}) {
    const [regex, setRegex] = useState<string>("");
    const [teamList, setTeamList] = useState<AllTeam[]>();
    const [selectedTeam, setSelectedTeam] = useState<any>();
    const [rows, setRows] = useState<any>();

    const [openDelete, setOpenDelete] = useState<boolean>(false);
    const [openDuplicate, setOpenDuplicate] = useState<boolean>(false);
    const [openAlert, setOpenAlert] = useState<boolean>(false);
    const [addUpdateTeam, setAddUpdateTeam] = useState<boolean>(false);
    const [alertSeverity, setAlertSeverity] = useState<"success" | "error" | "warning" | "info">("success");
    const [alertMessage, setAlertMessage] = useState<string>("");

    const nomDInstance = "Home Team Gestion"
    const verbose = false
    const { controleur, canal, currentUser, setCurrentUser } = useAppContext()
    const listeMessageEmis = [
        "all_teams_request", 
    ]
    const listeMessageRecus = [
        "all_teams_response",
    ]

    const handler = {
            nomDInstance,
            traitementMessage: (msg: {
                all_teams_response?: any,
            }) => {
                if (verbose || controleur?.verboseall)
                    console.log(`INFO: (${nomDInstance}) - traitementMessage - `,msg)
                if (msg.all_teams_response) {
                    setTeamList(msg.all_teams_response.teams)
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
            "all_teams_request" : 1
        })
    }, [openDelete, openDuplicate, addUpdateTeam])

    useEffect(() => {
        setRows([]);
        const newRows : any = [];
        teamList?.map((team, index) => {
            newRows.push({
                id: team._id,
                name: team.name,
                nbMembers: team.numberOfParticipants
            })
        })
        setRows(newRows);
    }, [teamList, regex])

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
            field: 'nbMembers', 
            headerName: "Nombre de participants", 
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
                        style={{backgroundColor: userPerms.includes("admin_modifier_role") ? "#223A6A" : "gray"}} 
                        className={styles.iconContainer}
                        onClick={() => {
                            if(userPerms.includes("admin_modifier_equipe")){
                                setSelectedTeam(params.row); 
                                setAddUpdateTeam(true);
                            }
                        }}
                    >
                        <Pencil size={22} color="white" />
                    </div>
                    <div 
                        style={{backgroundColor: userPerms.includes("admin_supprimer_role") ? "#CB0000" : "gray"}} 
                        className={styles.iconContainer}
                        onClick={() => {
                            if(userPerms.includes("admin_supprimer_equipe")){
                                setSelectedTeam(params.row); 
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
        
    }

    const handleDuplicateRole = () => {
        
    }
      
    if(!addUpdateTeam){
        return (
            <>
            {userPerms.includes("admin_demande_liste_equipes") ? (
                    <TeamListDisplay 
                        setAddUpdateTeam={setAddUpdateTeam}
                        regex={regex}
                        setRegex={setRegex}
                        rows={rows}
                        columns={columns}
                        openDelete={openDelete}
                        setOpenDelete={setOpenDelete}
                        selectedTeam={selectedTeam}
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
            <AddUpdateTeam
                teamId={selectedTeam?.id}
                setAddUpdateTeam={setAddUpdateTeam}
            />
        )
    }
}