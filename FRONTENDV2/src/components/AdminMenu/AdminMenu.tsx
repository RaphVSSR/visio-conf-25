//import { Drama, ListChecks, MessagesSquare, UsersRound } from "lucide-react";
//import { FC } from "react"


////TODO: Faire plutôt un "AdminTabPanel" (composant) dans la page "AdminPanel" avec un hook "useAdminTab".

//export type AdminMenuProps = {

//	selectedTab: string,
//    setSelectedTab: any,
//    userPerms: any

//};

//export const AdminMenu: FC<AdminMenuProps> = ({

//    selectedTab,
//    setSelectedTab,
//    userPerms

//} : {
//    selectedTab: string,
//    setSelectedTab : Function,
//    userPerms : string[]

//}) => {
//    const tabs = [
//        {
//            name : "Utilisateurs", 
//            icon : <UsersRound size={40} />, 
//            subOption : [
//                { label: "Lister", condition: userPerms.includes("admin_demande_liste_utilisateurs")},
//                { label: "Modifier", condition: userPerms.includes("admin_modifier_utilisateur")},
//                { label: "Valider", condition: userPerms.includes("admin_ajouter_utilisateur")},
//                { label: "Désactiver", condition: userPerms.includes("admin_desactiver_utilisateur")},
//                { label: "Bannir", condition: userPerms.includes("admin_supprimer_utilisateur")},
//            ], 
//            click : () => setSelectedTab("Utilisateurs")
//        },
//        {
//            name : "Rôles", 
//            icon : <Drama size={40} />, 
//            subOption :[
//                { label: "Lister", condition: userPerms.includes("admin_demande_liste_roles")},
//                { label: "Créer", condition: userPerms.includes("admin_ajouter_role")},
//                { label: "Dupliquer", condition: userPerms.includes("admin_dupliquer_role")},
//                { label: "Modifier", condition: userPerms.includes("admin_modifier_role")},
//                { label: "Supprimer", condition: userPerms.includes("admin_supprimer_role")},
//            ],
//            click : () => setSelectedTab("Rôles")
//        },
//        {
//            name : "Permissions", 
//            icon : <ListChecks size={40} />, 
//            subOption : [
//                { label: "Lister", condition: userPerms.includes("admin_demande_liste_permissions") },
//                { label: "Créer", condition: userPerms.includes("admin_ajouter_permission") },
//                { label: "Modifier", condition: userPerms.includes("admin_modifier_permission")},
//            ],
//            click : () => setSelectedTab("Permissions")
//        },
//        {
//            name : "Equipes", 
//            icon : <MessagesSquare size={40} />, 
//            subOption : [
//                { label: "Lister", condition: userPerms.includes("admin_demande_liste_equipes") },
//                { label: "Créer", condition: userPerms.includes("admin_ajouter_equipe") },
//                { label: "Modifier", condition: userPerms.includes("admin_modifier_equipe") },
//                { label: "Supprimer", condition: userPerms.includes("admin_supprimer_equipe") },
//            ],
//            click : () => setSelectedTab("Equipes")
//        },
//    ]

//    return(

//		<>
//            {
//                tabs.map((tab, index) => {
//                    return(
//                        <div 
//                            key={index} 
//                            className={styles.tab}
//                            style={{
//                                backgroundColor: selectedTab === tab.name ? "#80A7E1" : "#EDEDED",
//                                color : selectedTab === tab.name ? "white" : "#223A6A"
//                            }}
//                            onClick={tab.click}
//                        >
//                            <div key={index} className={styles.tabText}>
//                                <p style={{fontSize: "24px", fontWeight: 700, marginBottom: "15px"}}>{tab.name}</p>
//                                <div className={styles.tabOption}>
//                                    {tab.subOption.map((option, index) => {
//                                        return (
//                                            <div key={index} style={{position: "relative", width: "30%"}}>
//                                                <p key={index} className={styles.option}>{option.label}</p>
//                                                {!option.condition && <X size={48} style={{
//                                                    position : "absolute",
//                                                    top: "50%",
//                                                    left: "50%",
//                                                    transform: "translate(-50%, -50%)"
//                                                }}/>}
//                                            </div>
//                                        )
//                                    })}
//                                </div>
//                            </div>                            
//                            {tab.icon}
//                        </div>
//                    )
//                })
//            }
//        </>
//    )
//}