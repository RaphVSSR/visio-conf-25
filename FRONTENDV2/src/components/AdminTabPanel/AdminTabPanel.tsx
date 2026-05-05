import React, { Dispatch, FC, SetStateAction, useState } from 'react'
import "./AdminTabPanel.scss";
import { Drama, ListChecks, LucideIcon, MessagesSquare, UsersRound, X } from 'lucide-react';
import { RoleManagement } from 'components/RoleManagement/RoleManagement';
import { PermissionsManager } from "components/PermissionsManager/PermissionsManager";

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

	const [subOptionSelected, setSubOptionSelected] = useState<string | null>(null);

	const tabsData = [
        {
            name : "Utilisateurs",
            icon : <UsersRound size={40} />,
            subOption : [
                {
					label: "Lister",
				},
                {
					label: "Modifier",
				},
                {
					label: "Valider",
				},
                {
					label: "Désactiver",
				},
                {
					label: "Bannir",
				},
            ],
        },
        {
            name : "Rôles",
            icon : <Drama size={40} />,
            subOption :[
                {
					label: "Lister",
				},
                {
					label: "Créer",
				},
                {
					label: "Dupliquer",
				},
                {
					label: "Modifier",
				},
                {
					label: "Supprimer",
				},
            ],
        },
        {
            name : "Permissions",
            icon : <ListChecks size={40} />,
            subOption : [
                {
					label: "Lister",
				},
                {
					label: "Créer",
				},
                {
					label: "Modifier",
				},
            ],
        },
        {
            name : "Equipes",
            icon : <MessagesSquare size={40} />,
            subOption : [
                {
					label: "Lister",
				},
                {
					label: "Créer",
				},
                {
					label: "Modifier",
				},
                {
					label: "Supprimer",
				},
            ],
        },
	];

	const tabDataSelected = tabsData.find(tab => tab.name === tabSelected);

	if (!tabDataSelected) return null;

  return (

	<section
		id="adminTab"
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
			{tabSelected !== "Permissions" && (
				<ul id="tabOptions">
					{tabDataSelected.subOption.map((option, index) =>

						<li
							key={index}
							className={`option ${subOptionSelected === option.label ? "option--active" : ""}`}
							onClick={() => setSubOptionSelected(option.label)}
						>
							<p className="optionLabel">{option.label}</p>
						</li>
					)}
				</ul>
			)}


		</section>

		<section id="tabContent">
			{tabSelected === "Rôles" && (
				<RoleManagement activeAction={subOptionSelected} />
			)}
			{tabSelected === "Permissions" && (
				<PermissionsManager />
			)}
		</section>
	</section>
  )
}
