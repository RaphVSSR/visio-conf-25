import React, { Dispatch, FC, SetStateAction } from "react"
import "./AdminTabPanel.scss"
import { TeamsPanel } from "./TeamsPanel"
import { RolesPanel } from "./RolesPanel/RolesPanel"

export type AdminTabProps = {
	tabSelected: string
	setTabSelected: Dispatch<SetStateAction<string | null>>
}

export const AdminTabPanel: FC<AdminTabProps> = ({
	tabSelected,
	setTabSelected,
}) => {

	const close = () => setTabSelected(null)

	const panels: Record<string, React.ReactNode> = {
		Equipes: <TeamsPanel onClose={close} />,
		"Rôles": <RolesPanel onClose={close} />,
	}

	const panel = panels[tabSelected]

	if (!panel) {
		return (
			<section id="adminTab">
				<header className="adminTabPlaceholder">
					<h2>{tabSelected}</h2>
					<button type="button" className="adminTabClose" onClick={close}>Retour</button>
				</header>
				<p className="adminTabPlaceholderHint">Section à venir.</p>
			</section>
		)
	}

	return panel as React.ReactElement
}
