import { Drama, ListChecks, MessagesSquare, PhoneCall, UserRound, UsersRound } from "lucide-react";
import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminPanel.scss"
import { AdminTabPanel } from "components";

export const AdminPanel: FC = () => {

    const [tabSelected, setTabSelected] = useState<string | null>(null);
    const navigate = useNavigate();

    const tabs = [
        {
			name : "Utilisateurs",
			icon : <UsersRound size={60}/>,
			modifier : "users",
			click : () => navigate("/users")
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

    return (
            !tabSelected ? (
                <main id="adminPanel">
                    <h1>Administration</h1>
                    <section id="infosWrapper">
                        <article className="info info--users">
                            <div className="icon icon--users">
                                <UserRound size={30} color="white" />
                            </div>
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
            )
    )
}
