/*Author : Matthieu BIVILLE*/

"use client" 

import { Typography } from "@mui/material"
import styles from "./HomeAdmin.module.css"
import { Drama, ListChecks, MessagesSquare, PhoneCall, UserRound, UsersRound, OctagonX } from "lucide-react"
import { useEffect, useState } from "react"
import AdminMenu from "@/components/admin/AdminMenu";
import HomeRoleGestion from "@/components/admin/role_gestion/HomeRoleGestion"
import HomeUserGestion from "@/components/admin/user_gestion/HomeUserGestion"
import { useAppContext } from "@/context/AppContext"
import router from "next/router"
import HomePermGestion from "./perm_gestion/HomePermGestion"
import HomeTeamGestion from "./team_gestion/HomeTeamGestion"

export default function HomeAdmin({user} : {user : any}) {
    const [selectedTab, setSelectedTab] = useState<string>("");
    const [userPerms, setUserPerms] = useState<string[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<number>(0);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    
    const tabs = [
        {name : "Utilisateurs", icon : <UsersRound size={60} color="#0272DA"/>, color : "#0272DA", click : () => setSelectedTab("Utilisateurs")},
        {name : "Rôles", icon : <Drama size={60} color="#63B367"/>, color : "#63B367", click : () => setSelectedTab("Rôles")},
        {name : "Permissions", icon : <ListChecks size={60} color="#DA1F63"/>, color : "#DA1F63", click : () => setSelectedTab("Permissions")},
        {name : "Equipes", icon : <MessagesSquare size={60} color="#444447"/>, color : "#444447", click : () => setSelectedTab("Equipes")},
    ]

    const nomDInstance = "Home Admin"
    const verbose = false
    const { controleur, canal } = useAppContext()
    const listeMessageEmis = [
        "users_list_request", 
        "user_perms_request"
    ]
    const listeMessageRecus = [
        "users_list_response",
        "user_perms_response",
        "update_user_roles_response",
        "updated_role"
    ]

    const handler = {
            nomDInstance,
            traitementMessage: (msg: {
                user_perms_response?: any,
                update_user_roles_response? : any,
                updated_role? : any,
                users_list_response? : any
            }) => {
                if (verbose || controleur?.verboseall)
                    console.log(`INFO: (${nomDInstance}) - traitementMessage - `,msg)
                if (msg.user_perms_response) {
                    const perms = msg.user_perms_response.perms;
                    setUserPerms(perms);
                }
                if (msg.update_user_roles_response || msg.updated_role) {
                    controleur.envoie(handler, {
                        "user_perms_request" : {userId : user?.id}
                    })
                }
                if(msg.users_list_response){
                    const nbOnlineUsers = msg.users_list_response.users.reduce((acc : number, user : any) => {
                        return acc + (user.online ? 1 : 0);
                    }, 0);
                    setOnlineUsers(nbOnlineUsers);
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
            "user_perms_request" : {userId : user?.id}
        })
    }, [user])

    useEffect(() => {
        setIsAdmin(userPerms.some((perm: string) => perm.includes("admin")));
    }, [userPerms]);

    useEffect(() => {
        controleur.envoie(handler, {
            "users_list_request" : 1
        })
    }, [])

    return (
        isAdmin  ? (
            !selectedTab ? (
                <div className={styles.container}>
                    <Typography className={styles.title} style={{fontSize: "40px", fontWeight: 800}}>Administration</Typography>
                    <div className={styles.infosContainer}>
                        <div style={{backgroundColor: "#DCFCE7", borderColor: "#47DA60"}} className={styles.infos}>
                            <div style={{backgroundColor: "#47DA60"}} className={styles.icons}>
                                <UserRound size={30} color="white" />
                            </div>
                            <p className={styles.emphasis}>{onlineUsers}</p>
                            <p>utilisateur(s) connecté(s)</p>
                        </div>
                        <div style={{backgroundColor: "#F4E8FF", borderColor: "#BF82FE"}} className={styles.infos}>
                            <div style={{backgroundColor: "#BF82FE"}} className={styles.icons}>
                                <PhoneCall size={30} color="white" />
                            </div>
                            <p className={styles.emphasis}>6</p>
                            <p>appel(s) en cours</p>
                        </div>
                    </div>
                    <div className={styles.tabsContainer}>
                        {
                            tabs.map((tab, index) => {
                                return(
                                    <div 
                                        key={index} 
                                        className={styles.tab} 
                                        style={{borderColor: tab.color}}
                                        onClick={tab.click}
                                    >
                                        {tab.name}
                                        {tab.icon}
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>
            ) : (
                <div style={{display: "flex"}}>
                    <AdminMenu selectedTab={selectedTab} setSelectedTab={setSelectedTab} userPerms={userPerms}/>
                    {selectedTab === "Utilisateurs" && <HomeUserGestion userPerms={userPerms}/>}
                    {selectedTab === "Rôles" && <HomeRoleGestion  userPerms={userPerms}/>}
                    {selectedTab === "Permissions" && <HomePermGestion userPerms={userPerms}/>}
                    {selectedTab === "Equipes" && <HomeTeamGestion userPerms={userPerms}/>}
                </div>
            )
        ) : (
            <div className={styles.forbiddenAccess}>
                <OctagonX size={100} color="#ff0000" />
                <Typography style={{fontSize: "40px", fontWeight: 800, color: "#ff0000"}}>Vous n'êtes pas autorisé à accéder à cette page !</Typography>
                <p style={{fontSize: "20px", fontWeight: 500, color: "#223A6A"}}>S'il s'agit d'une erreur, veuillez contacter un administrateur de l'application.</p>
            </div>
        )
    )
}