import { FC, useEffect, useRef, useState } from "react"
import { X } from "lucide-react"
import { RoleManagement } from "components/RoleManagement"
import { Role, initialRoleState } from "services/role/Role"
import type { RoleState } from "services/role/Role.types"
import "./RolesPanel.scss"

export type RolesPanelProps = {
	onClose: () => void
}

export const RolesPanel: FC<RolesPanelProps> = ({ onClose }) => {
	const [roleState, setRoleState] = useState<RoleState>(initialRoleState)
	const roleRef = useRef<Role | null>(null)

	useEffect(() => {
		const role = new Role(setRoleState)
		roleRef.current = role
		role.loadRoles() // Load initial data
		return () => {
			role.destroy()
			roleRef.current = null
		}
	}, [])

	return (
		<section id="adminTab" className="rolesPanel">
			<header className="rolesPanelHeader">
				<div className="rolesPanelTitle">
					<h2>Administration · Rôles</h2>
					<p className="rolesPanelCount">{roleState.roles.length} rôle(s)</p>
				</div>
				<button type="button" className="rolesPanelClose" onClick={onClose} aria-label="Fermer">
					<X size={28} />
				</button>
			</header>

			<div className="rolesPanelContent">
				<RoleManagement
					state={roleState}
					onLoadRoles={() => roleRef.current?.loadRoles()}
					onLoadRole={(id) => roleRef.current?.loadRole(id)}
					onCreateRole={(name, perms) => roleRef.current?.createRole(name, perms)}
					onUpdateRole={(id, name, perms) => roleRef.current?.updateRole(id, name, perms)}
					onDeleteRole={(id) => roleRef.current?.deleteRole(id)}
					onSelectRole={(role) => roleRef.current?.selectRole(role)}
					onClearError={() => roleRef.current?.clearRoleError()}
				/>
			</div>
		</section>
	)
}
