import { Drama, ListChecks, MessagesSquare, PhoneCall, UserRound, UsersRound } from "lucide-react";
import { FC, useState } from "react";
import "./AdminPanel.scss"
import { AdminTabPanel } from "components";

export const AdminPanel: FC = ({
	
	//user

}) => {

    const [tabSelected, setTabSelected] = useState<string | null>(null);
    //const [userPerms, setUserPerms] = useState<string[]>([]);
    //const [onlineUsers, setOnlineUsers] = useState<number>(0);
    //const [isAdmin, setIsAdmin] = useState<boolean>(false);
    
    const tabs = [
        {
			name : "Utilisateurs",
			icon : <UsersRound size={60}/>,
			modifier : "users",
			click : () => setTabSelected("Utilisateurs")
		},
        {
			name : "Rôles",
			icon : <Drama size={60}/>,
			modifier : "roles",
			click : () => setTabSelected("Rôles")
		},
        {
			name : "Permissions",
			icon : <ListChecks size={60}/>,
			modifier : "permissions",
			click : () => setTabSelected("Permissions")
		},
        {
			name : "Equipes",
			icon : <MessagesSquare size={60}/>,
			modifier : "teams",
			click : () => setTabSelected("Equipes")
		},
    ]

    //const nomDInstance = "Home Admin"
    //const verbose = false
    //const { controleur, canal } = useAppContext()
    //const listeMessageEmis = [
    //    "users_list_request", 
    //    "user_perms_request"
    //]
    //const listeMessageRecus = [
    //    "users_list_response",
    //    "user_perms_response",
    //    "update_user_roles_response",
    //    "updated_role"
    //]

    //const handler = {
    //        nomDInstance,
    //        traitementMessage: (msg: {
    //            user_perms_response?: any,
    //            update_user_roles_response? : any,
    //            updated_role? : any,
    //            users_list_response? : any
    //        }) => {
    //            if (verbose || controleur?.verboseall)
    //                console.log(`INFO: (${nomDInstance}) - traitementMessage - `,msg)
    //            if (msg.user_perms_response) {
    //                const perms = msg.user_perms_response.perms;
    //                setUserPerms(perms);
    //            }
    //            if (msg.update_user_roles_response || msg.updated_role) {
    //                controleur.envoie(handler, {
    //                    "user_perms_request" : {userId : user?.id}
    //                })
    //            }
    //            if(msg.users_list_response){
    //                const nbOnlineUsers = msg.users_list_response.users.reduce((acc : number, user : any) => {
    //                    return acc + (user.online ? 1 : 0);
    //                }, 0);
    //                setOnlineUsers(nbOnlineUsers);
    //            }
    //        },
    //    }

    //useEffect(() => {
    //    if (controleur && canal) {
    //        controleur.inscription(handler, listeMessageEmis, listeMessageRecus)
    //    }
    //    return () => {
    //        if (controleur) {
    //            controleur.desincription(handler,listeMessageEmis,listeMessageRecus)
    //        }
    //    }
    //}, [router, controleur, canal])

    //useEffect(() => {
    //    controleur.envoie(handler, {
    //        "user_perms_request" : {userId : user?.id}
    //    })
    //}, [user])

    //useEffect(() => {
    //    setIsAdmin(userPerms.some((perm: string) => perm.includes("admin")));
    //}, [userPerms]);

    //useEffect(() => {
    //    controleur.envoie(handler, {
    //        "users_list_request" : 1
    //    })
    //}, [])

    return (
        //isAdmin  ? (
            !tabSelected ? (
                <main id="adminPanel">
                    {/*<Typography className={styles.title} style={{fontSize: "40px", fontWeight: 800}}>Administration</Typography>*/}
                    <h1>Administration</h1>
                    <section id="infosWrapper">
                        <article className="info info--users">
                            <div className="icon icon--users">
                                <UserRound size={30} color="white" />
                            </div>
                            {/*<p className={styles.emphasis}>{onlineUsers}</p>*/}
                            <p className="emphasis">4</p>
                            <p>utilisateur(s) connecté(s)</p>
                        </article>
                        <article className="info info--calls">
                            <div className="icon icon--calls">
                                <PhoneCall size={30} color="white" />
                            </div>
                            <p className="emphasis">6</p>
                            <p>appel(s) en cours</p>
                        </article>
                    </section>
                    <nav id="tabsWrapper">
                        {
                            tabs.map((tab, index) =>

                                <button
                                    key={index}
                                    className={`tab tab--${tab.modifier}`}
                                    onClick={tab.click}
                                >
                                    {tab.name}
                                    {tab.icon}

                                </button>
                            )
                        }
                    </nav>
                </main>
            ) : (
                    <AdminTabPanel tabSelected={tabSelected} setTabSelected={setTabSelected}/>
                    //{selectedTab === "Utilisateurs" && <HomeUserGestion userPerms={userPerms}/>}
                    //{selectedTab === "Rôles" && <HomeRoleGestion  userPerms={userPerms}/>}
                    //{selectedTab === "Permissions" && <HomePermGestion userPerms={userPerms}/>}
                    //{selectedTab === "Equipes" && <HomeTeamGestion userPerms={userPerms}/>}
            )
        //) : (
        //    <div className={styles.forbiddenAccess}>
        //        <OctagonX size={100} color="#ff0000" />
        //        <Typography style={{fontSize: "40px", fontWeight: 800, color: "#ff0000"}}>Vous n'êtes pas autorisé à accéder à cette page !</Typography>
        //        <p style={{fontSize: "20px", fontWeight: 500, color: "#223A6A"}}>S'il s'agit d'une erreur, veuillez contacter un administrateur de l'application.</p>
        //    </div>
    //    )
    )
}