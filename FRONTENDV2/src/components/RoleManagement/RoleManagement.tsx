import { FC, useCallback, useEffect, useRef, useState } from "react"
import { Eye, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react"
import { useAuth } from "hooks/useAuth"
import { useToast } from "contexts/ToastContext"
import { PermissionSync } from "services/permissions/PermissionSync"
import {
	initialPermissionState,
	type PermissionNotice,
	type PermissionState,
	type RoleData,
} from "services/permissions/PermissionSync.types"
import "./RoleManagement.scss"

export type RoleManagementProps = {
	activeAction?: string | null
}

export const RoleManagement: FC<RoleManagementProps> = ({ activeAction }) => {

	const { socket } = useAuth()
	const { showToast } = useToast()
	const [state, setState] = useState<PermissionState>(initialPermissionState)
	const [editingRole, setEditingRole] = useState<RoleData | null>(null)
	const [newRoleName, setNewRoleName] = useState("")
	const [newRolePermissionIds, setNewRolePermissionIds] = useState<string[]>([])
	const [editRoleName, setEditRoleName] = useState("")
	const [editRolePermissionIds, setEditRolePermissionIds] = useState<string[]>([])
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
	const syncRef = useRef<PermissionSync | null>(null)

	const showPermissionNotice = useCallback((notice: PermissionNotice) => {
		showToast({
			name: notice.name,
			message: notice.message,
			subtitle: notice.subtitle,
			variant: notice.variant,
		})

		if (notice.name === "role-created") {
			setNewRoleName("")
			setNewRolePermissionIds([])
		}

		if (notice.name === "role-updated") {
			setEditingRole(null)
			setEditRolePermissionIds([])
		}

		if (notice.name === "role-deleted") {
			setConfirmDelete(null)
		}
	}, [showToast])

	useEffect(() => {
		if (!socket) return

		const sync = new PermissionSync(socket, setState, showPermissionNotice)
		syncRef.current = sync

		return () => {
			sync.destroy()
			syncRef.current = null
		}
	}, [socket, showPermissionNotice])

	const handleRefresh = () => {
		syncRef.current?.loadRoles()
		syncRef.current?.loadPermissions()
	}

	const handleGetRole = (role: RoleData) => {
		syncRef.current?.selectRole(role)
	}

	const handleCreateRole = () => {
		const name = newRoleName.trim()
		if (!name) return
		syncRef.current?.createRole(name, newRolePermissionIds)
	}

	const handleUpdateRole = () => {
		const name = editRoleName.trim()
		if (!editingRole || !name) return
		syncRef.current?.updateRole(editingRole._id, name, editRolePermissionIds)
	}

	const handleDeleteRole = (roleId: string) => {
		syncRef.current?.deleteRole(roleId)
	}

	const startEdit = (role: RoleData) => {
		setEditingRole(role)
		setEditRoleName(role.label)
		setEditRolePermissionIds(role.permissions?.map(permission => permission._id) || [])
	}

	const togglePermission = (
		permissionId: string,
		selectedIds: string[],
		setSelectedIds: (nextIds: string[]) => void,
	) => {
		setSelectedIds(
			selectedIds.includes(permissionId)
				? selectedIds.filter(selectedId => selectedId !== permissionId)
				: [...selectedIds, permissionId],
		)
	}

	const renderPermissionSelector = (
		selectedIds: string[],
		setSelectedIds: (nextIds: string[]) => void,
	) => (
		<div className="rm-permissionSelector">
			<div className="rm-permissionSelector__header">
				<h4>Permissions du rôle</h4>
				<span>{selectedIds.length} sélectionnée(s)</span>
			</div>

			{state.isLoadingPermissions ? (
				<p className="rm-empty">Chargement des permissions...</p>
			) : state.availablePermissions.length === 0 ? (
				<p className="rm-empty">Aucune permission disponible.</p>
			) : (
				<div className="rm-permissionSelector__grid">
					{state.availablePermissions.map(permission => {
						const isChecked = selectedIds.includes(permission._id)

						return (
							<label
								key={permission._id}
								className={`rm-permissionChoice ${isChecked ? "rm-permissionChoice--checked" : ""}`}
							>
								<input
									type="checkbox"
									checked={isChecked}
									onChange={() => togglePermission(permission._id, selectedIds, setSelectedIds)}
								/>
								<span>
									<strong>{permission.label}</strong>
									<small>{permission.uuid}</small>
								</span>
							</label>
						)
					})}
				</div>
			)}
		</div>
	)

	const renderList = () => (
		<div className="rm-section">
			<div className="rm-section__header">
				<h3>Liste des rôles</h3>
				<button className="rm-btn rm-btn--icon" onClick={handleRefresh} title="Rafraîchir">
					<RefreshCw size={16} />
				</button>
			</div>

			{state.isLoadingRoles ? (
				<p className="rm-empty">Chargement des rôles...</p>
			) : state.roles.length === 0 ? (
				<p className="rm-empty">Aucun rôle trouvé.</p>
			) : (
				<table className="rm-table">
					<thead>
						<tr>
							<th>Nom</th>
							<th>Identifiant</th>
							<th>Permissions</th>
							<th>Par défaut</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{state.roles.map(role => (
							<tr
								key={role._id}
								className={state.selectedRole?._id === role._id ? "rm-table__row--active" : ""}
							>
								<td className="rm-table__label">{role.label}</td>
								<td className="rm-table__uuid">{role.uuid}</td>
								<td>{role.permissions?.length || 0}</td>
								<td>{role.default ? "Oui" : "Non"}</td>
								<td className="rm-table__actions">
									<button
										className="rm-btn rm-btn--small rm-btn--info"
										onClick={() => handleGetRole(role)}
										title="Voir"
									>
										<Eye size={14} />
									</button>
									<button
										className="rm-btn rm-btn--small rm-btn--warning"
										onClick={() => startEdit(role)}
										title="Modifier"
									>
										<Pencil size={14} />
									</button>
									<button
										className="rm-btn rm-btn--small rm-btn--danger"
										onClick={() => setConfirmDelete(role._id)}
										title="Supprimer"
									>
										<Trash2 size={14} />
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	)

	const renderCreate = () => (
		<div className="rm-section">
			<h3>Créer un rôle</h3>
			<div className="rm-form">
				<label className="rm-form__label">
					Nom du rôle
					<input
						type="text"
						className="rm-form__input"
						value={newRoleName}
						onChange={event => setNewRoleName(event.target.value)}
						placeholder="Ex: Modérateur"
					/>
				</label>

				{renderPermissionSelector(newRolePermissionIds, setNewRolePermissionIds)}

				<button
					className="rm-btn rm-btn--primary"
					onClick={handleCreateRole}
					disabled={!newRoleName.trim()}
				>
					<Plus size={16} />
					Créer
				</button>
			</div>
		</div>
	)

	const renderEdit = () => {
		if (!editingRole) {
			return (
				<div className="rm-section">
					<h3>Modifier un rôle</h3>
					<p className="rm-empty">
						Sélectionnez un rôle dans la liste puis cliquez sur l'icône de modification.
					</p>
					{renderList()}
				</div>
			)
		}

		return (
			<div className="rm-section">
				<h3>Modifier : {editingRole.label}</h3>
				<div className="rm-form rm-form--wide">
					<label className="rm-form__label">
						Nom du rôle
						<input
							type="text"
							className="rm-form__input"
							value={editRoleName}
							onChange={event => setEditRoleName(event.target.value)}
						/>
					</label>

					{renderPermissionSelector(editRolePermissionIds, setEditRolePermissionIds)}

					<div className="rm-form__buttons">
						<button className="rm-btn rm-btn--primary" onClick={handleUpdateRole} disabled={!editRoleName.trim()}>
							Enregistrer
						</button>
						<button className="rm-btn rm-btn--secondary" onClick={() => setEditingRole(null)}>
							Annuler
						</button>
					</div>
				</div>
			</div>
		)
	}

	const renderDelete = () => (
		<div className="rm-section">
			<h3>Supprimer un rôle</h3>
			<p className="rm-empty">
				Sélectionnez un rôle dans la liste puis cliquez sur l'icône de suppression.
			</p>
			{renderList()}
		</div>
	)

	const renderDetail = () => {
		if (!state.selectedRole) {
			return (
				<div className="rm-section">
					<h3>Détails d'un rôle</h3>
					<p className="rm-empty">Sélectionnez un rôle dans la liste pour voir ses détails.</p>
					{renderList()}
				</div>
			)
		}

		return (
			<div className="rm-section">
				<h3>Détails du rôle</h3>
				<div className="rm-detail">
					<div className="rm-detail__field">
						<span className="rm-detail__key">Nom</span>
						<span className="rm-detail__value">{state.selectedRole.label}</span>
					</div>
					<div className="rm-detail__field">
						<span className="rm-detail__key">Identifiant</span>
						<span className="rm-detail__value">{state.selectedRole.uuid}</span>
					</div>
					<div className="rm-detail__field">
						<span className="rm-detail__key">Par défaut</span>
						<span className="rm-detail__value">{state.selectedRole.default ? "Oui" : "Non"}</span>
					</div>
					{state.selectedRole.permissions && state.selectedRole.permissions.length > 0 && (
						<div className="rm-detail__field rm-detail__field--col">
							<span className="rm-detail__key">
								Permissions ({state.selectedRole.permissions.length})
							</span>
							<ul className="rm-detail__permlist">
								{state.selectedRole.permissions.map(permission => (
									<li key={permission._id}>{permission.label}</li>
								))}
							</ul>
						</div>
					)}
				</div>
				<button className="rm-btn rm-btn--secondary" onClick={() => syncRef.current?.clearSelectedRole()}>
					Fermer
				</button>
			</div>
		)
	}

	const renderContent = () => {
		if (editingRole) return renderEdit()

		switch (activeAction) {
			case "Lister":
				return renderList()
			case "Créer":
			case "Creer":
				return renderCreate()
			case "Modifier":
				return renderEdit()
			case "Supprimer":
				return renderDelete()
			case "Dupliquer":
				return renderList()
			default:
				return renderList()
		}
	}

	return (
		<div id="roleManagement">
			{renderContent()}

			{state.selectedRole && activeAction !== "Modifier" && (
				<div className="rm-modal-overlay" onClick={() => syncRef.current?.clearSelectedRole()}>
					<div className="rm-modal" onClick={event => event.stopPropagation()}>
						{renderDetail()}
					</div>
				</div>
			)}

			{confirmDelete && (
				<div className="rm-modal-overlay" onClick={() => setConfirmDelete(null)}>
					<div className="rm-modal rm-modal--small" onClick={event => event.stopPropagation()}>
						<h3>Confirmer la suppression</h3>
						<p>Voulez-vous vraiment supprimer ce rôle ? Cette action est irréversible.</p>
						<div className="rm-modal__actions">
							<button className="rm-btn rm-btn--danger" onClick={() => handleDeleteRole(confirmDelete)}>
								Supprimer
							</button>
							<button className="rm-btn rm-btn--secondary" onClick={() => setConfirmDelete(null)}>
								Annuler
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
