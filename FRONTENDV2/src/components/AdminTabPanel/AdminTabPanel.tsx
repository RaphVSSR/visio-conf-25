import React, { Dispatch, FC, SetStateAction } from 'react'
import "./AdminTabPanel.scss";
import { Drama, ListChecks, LucideIcon, MessagesSquare, UsersRound, X } from 'lucide-react';

export type AdminTabType = {

	name : string, 
	icon : LucideIcon, 
	subOption : {

		label: string,
		condition: boolean

	}[],
};

export type AdminTabProps = {

	tabSelected: string,
	setTabSelected: Dispatch<SetStateAction<string | null>>,
};

export const AdminTabPanel: FC<AdminTabProps> = ({

	tabSelected,
	setTabSelected

}) => {

	const tabsData = [
        {
            name : "Utilisateurs", 
            icon : <UsersRound size={40} />, 
            subOption : [
                { 
					label: "Lister",
					//condition: userPerms.includes("admin_demande_liste_utilisateurs")
				},
                { 
					label: "Modifier",
					//condition: userPerms.includes("admin_modifier_utilisateur")
				},
                { 
					label: "Valider",
					//condition: userPerms.includes("admin_ajouter_utilisateur")
				},
                { 
					label: "Désactiver",
					//condition: userPerms.includes("admin_desactiver_utilisateur")
				},
                { 
					label: "Bannir",
					//condition: userPerms.includes("admin_supprimer_utilisateur")
				},
            ],
        },
        {
            name : "Rôles", 
            icon : <Drama size={40} />, 
            subOption :[
                { 
					label: "Lister",
					//condition: userPerms.includes("admin_demande_liste_roles")
				},
                { 
					label: "Créer",
					//condition: userPerms.includes("admin_ajouter_role")
				},
                { 
					label: "Dupliquer",
					//condition: userPerms.includes("admin_dupliquer_role")
				},
                { 
					label: "Modifier",
					//condition: userPerms.includes("admin_modifier_role")
				},
                { 
					label: "Supprimer",
					//condition: userPerms.includes("admin_supprimer_role")
				},
            ],
        },
        {
            name : "Permissions", 
            icon : <ListChecks size={40} />, 
            subOption : [
                { 
					label: "Lister",
					//condition: userPerms.includes("admin_demande_liste_permissions")
				},
                { 
					label: "Créer",
					//condition: userPerms.includes("admin_ajouter_permission")
				},
                { 
					label: "Modifier",
					//condition: userPerms.includes("admin_modifier_permission")
				},
            ],
        },
        {
            name : "Equipes", 
            icon : <MessagesSquare size={40} />, 
            subOption : [
                { 
					label: "Lister",
					//condition: userPerms.includes("admin_demande_liste_equipes")
				},
                { 
					label: "Créer",
					//condition: userPerms.includes("admin_ajouter_equipe")
				},
                { 
					label: "Modifier",
					//condition: userPerms.includes("admin_modifier_equipe")
				},
                { 
					label: "Supprimer",
					//condition: userPerms.includes("admin_supprimer_equipe")
				},
            ],
        },
	];

	const tabDataSelected = tabsData.find(tab => tab.name === tabSelected)!;

  return (

	<section 
		id="adminTab"
		//onClick={setTabSelected(tab)}
	>
		<section id="tabHeader">

			<div id="row1">

				<div className="col1">

					{tabDataSelected.icon}
					<p id='tabTitle'>{tabDataSelected.name}</p>

				</div>
				<div className="col2">

					<X id='backIco' size={48} onClick={() => setTabSelected(null)}/>

				</div>

			</div>
			<ul id="tabOptions">
				{tabDataSelected.subOption.map((option, index) => 

					<li key={index} className='option'>
						<p className="optionLabel">{option.label}</p>
					</li>
				)}
			</ul>


		</section>                           
	</section>
  )
}
