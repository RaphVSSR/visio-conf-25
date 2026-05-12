import assert from "node:assert/strict"
import test from "node:test"
import type { NextFunction, Request, Response } from "express"
import { requireAdmin, requirePermissionCsrfGuard, sendPermissionCsrfToken } from "../middleware/requireAdmin.ts"
import User from "../models/User.ts"
import SessionManager from "../models/services/authentication/SessionManager.ts"

type MockResponse = Response & {
	body?: unknown
	statusCodeValue?: number
}

function createResponse() {
	const response = {
		status(code: number) {
			this.statusCodeValue = code
			return this
		},
		json(body: unknown) {
			this.body = body
			return this
		},
	} as MockResponse

	return response
}

function createRequest(session: Partial<Request["session"]> = {}, headers: Record<string, string> = {}) {
	return {
		session,
		method: "POST",
		get(name: string) {
			return headers[name]
		},
	} as Request
}

function mockFindById(roles: string[] | null) {
	const originalFindById = User.model.findById

	User.model.findById = (() => ({
		select: () => ({
			lean: async () => roles === null ? null : { roles },
		}),
	})) as unknown as typeof User.model.findById

	return () => {
		User.model.findById = originalFindById
	}
}

test("requireAdmin rejette une requÃªte sans session utilisateur", async () => {
	const request = createRequest()
	const response = createResponse()
	let nextCalled = false

	await requireAdmin(request, response, (() => {
		nextCalled = true
	}) as NextFunction)

	assert.equal(response.statusCodeValue, 401)
	assert.deepEqual(response.body, { message: "Authentification requise." })
	assert.equal(nextCalled, false)
})

test("requireAdmin rejette un utilisateur non-admin", async () => {
	const restoreFindById = mockFindById(["user"])
	const request = createRequest({ userId: "user-id" })
	const response = createResponse()
	let nextCalled = false

	try {
		await requireAdmin(request, response, (() => {
			nextCalled = true
		}) as NextFunction)
	} finally {
		restoreFindById()
	}

	assert.equal(response.statusCodeValue, 403)
	assert.deepEqual(response.body, { message: "Accès administrateur requis." })
	assert.equal(nextCalled, false)
})

test("requireAdmin accepte un utilisateur admin", async () => {
	const restoreFindById = mockFindById(["admin", "user"])
	const request = createRequest({ userId: "admin-id" })
	const response = createResponse()
	let nextCalled = false

	try {
		await requireAdmin(request, response, (() => {
			nextCalled = true
		}) as NextFunction)
	} finally {
		restoreFindById()
	}

	assert.equal(response.statusCodeValue, undefined)
	assert.equal(nextCalled, true)
})

test("le token CSRF Permissions est liÃ© Ã  la session et requis sur mutation", () => {
	const session: Partial<Request["session"]> = {}
	const tokenResponse = createResponse()

	sendPermissionCsrfToken(createRequest(session), tokenResponse)

	const csrfToken = (tokenResponse.body as { csrfToken: string }).csrfToken
	assert.match(csrfToken, /^[a-f0-9]{64}$/)
	assert.equal(session.csrfToken, csrfToken)

	const rejectedResponse = createResponse()
	let rejectedNextCalled = false
	requirePermissionCsrfGuard(createRequest(session, { "X-CSRF-Token": "invalid" }), rejectedResponse, (() => {
		rejectedNextCalled = true
	}) as NextFunction)

	assert.equal(rejectedResponse.statusCodeValue, 403)
	assert.deepEqual(rejectedResponse.body, { message: "CSRF invalide." })
	assert.equal(rejectedNextCalled, false)

	const acceptedResponse = createResponse()
	let acceptedNextCalled = false
	requirePermissionCsrfGuard(createRequest(session, { "X-CSRF-Token": csrfToken }), acceptedResponse, (() => {
		acceptedNextCalled = true
	}) as NextFunction)

	assert.equal(acceptedResponse.statusCodeValue, undefined)
	assert.equal(acceptedNextCalled, true)
})

test("SessionManager Ã©crit userId dans la session socket partagÃ©e", () => {
	const session = {
		userId: undefined as string | undefined,
		saveCalls: 0,
		save() {
			this.saveCalls += 1
		},
	}
	const socket = {
		request: { session },
		joinRoom: "",
		leftRoom: "",
		join(userId: string) {
			this.joinRoom = userId
		},
		leave(userId: string) {
			this.leftRoom = userId
		},
	}
	const io = {
		sockets: {
			sockets: new Map([["socket-id", socket]]),
			adapter: { rooms: new Map() },
		},
	}

	SessionManager.bindToServer(io as never)
	SessionManager.bind("socket-id", "user-id")

	assert.equal(session.userId, "user-id")
	assert.equal(socket.joinRoom, "user-id")
	assert.equal(session.saveCalls, 1)
	assert.equal(SessionManager.getUserId("socket-id"), "user-id")

	SessionManager.unbind("socket-id")

	assert.equal(session.userId, undefined)
	assert.equal(socket.leftRoom, "user-id")
	assert.equal(session.saveCalls, 2)
})

test("getControllerMessagePermission mappe les actions mÃƒÂ©tier vers les permissions", async () => {
	const { getControllerMessagePermission } = await import("../models/services/permissions/PermissionAccess.ts")

	assert.equal(getControllerMessagePermission({ "contacts:list": {}, id: "socket-id" }), "demande_annuaire")	
	assert.equal(getControllerMessagePermission({ channel_post: { type: "publish" }, id: "socket-id" }), "envoie_message")
	assert.equal(getControllerMessagePermission({ get_permissions: {}, id: "socket-id" }), "admin_demande_liste_roles")
	assert.equal(getControllerMessagePermission({ "call:initiate": {}, id: "socket-id" }), "new_call")
	assert.equal(getControllerMessagePermission({ login: {}, id: "socket-id" }), undefined)
})

test("userHasPermission accepte uniquement les permissions prÃƒÂ©sentes dans les rÃƒÂ´les utilisateur", async () => {
	const { userHasPermission } = await import("../models/services/permissions/PermissionAccess.ts")
	const Permission = (await import("../models/Permission.ts")).default
	const Role = (await import("../models/Role.ts")).default

	const originalUserFindById = User.model.findById
	const originalPermissionFindOne = Permission.model.findOne
	const originalRoleExists = Role.model.exists

	User.model.findById = (() => ({
		select: () => ({ lean: async () => ({ roles: ["user"] }) }),
	})) as unknown as typeof User.model.findById

	Permission.model.findOne = (() => ({
		select: () => ({ lean: async () => ({ _id: "permission-id" }) }),
	})) as unknown as typeof Permission.model.findOne

	Role.model.exists = (async (query: any) => {
		return query.uuid?.$in?.includes("user") && query.permissions === "permission-id"
	}) as typeof Role.model.exists

	try {
		assert.equal(await userHasPermission("user-id", "envoie_message"), true)
	} finally {
		User.model.findById = originalUserFindById
		Permission.model.findOne = originalPermissionFindOne
		Role.model.exists = originalRoleExists
	}
})


