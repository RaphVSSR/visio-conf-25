import User from "../models/user.js";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import SocketIdentificationService from "./SocketIdentification.js";

class UsersService {
    controleur;
    verbose = false;
    listeDesMessagesEmis = new Array(
        "login_response",
        "signup_response",
        "users_list_response",
        "update_user_response",
        "update_user_status_response",
        "update_user_roles_response",
        "user_perms_response",
        "user_info_response"
    );
    listeDesMessagesRecus = new Array(
        "login_request",
        "signup_request",
        "users_list_request",
        "update_user_request",
        "update_user_status_request",
        "update_user_roles_request",
        "delete_role_request",
        "user_perms_request",
        "user_info_request"
    );

    constructor(c, nom) {
        this.controleur = c;
        this.nomDInstance = nom;
        if (this.controleur.verboseall || this.verbose)
            console.log(
                "INFO (" +
                    this.nomDInstance +
                    "):  s'enregistre aupres du controleur"
            );

        this.controleur.inscription(
            this,
            this.listeDesMessagesEmis,
            this.listeDesMessagesRecus
        );
    }
    createToken = (user) => {
        return jwt.sign(
            {
                userId: user._id, // Use MongoDB ObjectId for internal token identification
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
    };

    async traitementMessage(mesg) {
        if (this.controleur.verboseall || this.verbose) {
            console.log(
                "INFO (" +
                    this.nomDInstance +
                    "): reçoit le message suivant à traiter"
            );
            console.log(mesg);
        }

        if (mesg.login_request) {
            await this.handleLogin(mesg);
        }

        if (mesg.signup_request) {
            await this.handleSignup(mesg);
        }

        if (mesg.users_list_request) {
            await this.getUsersList(mesg);
        }

        if (mesg.user_info_request) {
            await this.getUserInfo(mesg);
        }
        if (mesg.update_user_roles_request) {
            const user = await User.findOneAndUpdate(
                { _id: mesg.update_user_roles_request.user_id },
                {
                    firstname: mesg.update_user_roles_request.firstname,
                    lastname: mesg.update_user_roles_request.lastname,
                    email: mesg.update_user_roles_request.email,
                    phone: mesg.update_user_roles_request.phone,
                    job: mesg.update_user_roles_request.job,
                    desc: mesg.update_user_roles_request.desc,
                    password: await this.sha256(
                        mesg.update_user_roles_request.lastname
                    ),
                    roles: mesg.update_user_roles_request.roles,
                },
                { new: true }
            );
            if (!user) throw new Error("User not found");

            // Utiliser SocketIdentificationService pour obtenir le socket id
            const socketId = SocketIdentificationService.getUserSocketId(
                user._id?.toString()
            );
            const message = {
                update_user_roles_response: {
                    userId: mesg.update_user_roles_request.user_id,
                },
                id: [mesg.id, socketId].filter(Boolean),
            };
            this.controleur.envoie(this, message);
        }
        if (mesg.user_perms_request) {
            const user = await User.findOne({
                uuid: mesg.user_perms_request.userId,
            }).populate({
                path: "roles",
                populate: { path: "role_permissions" },
            });

            if (!user) {
                const message = {
                    user_perms_response: {
                        perms: [],
                        error: "Utilisateur non trouvé",
                    },
                    id: [mesg.id],
                };
                this.controleur.envoie(this, message);
                return;
            }

            let perms = [];
            if (user.roles && Array.isArray(user.roles)) {
                user.roles.forEach((role) => {
                    if (role && role.role_permissions) {
                        role.role_permissions.forEach((perm) => {
                            if (
                                perm &&
                                perm.permission_uuid &&
                                !perms.includes(perm.permission_uuid)
                            ) {
                                perms.push(perm.permission_uuid);
                            }
                        });
                    }
                });
            }

            const message = {
                user_perms_response: {
                    perms: perms,
                },
                id: [mesg.id],
            };
            this.controleur.envoie(this, message);
        }
        if (mesg.delete_role_request) {
            await User.updateMany(
                {},
                { $pull: { roles: mesg.delete_role_request.role_id } }
            );
        }
        if (mesg.update_user_status_request) {
            const action = mesg.update_user_status_request.action;
            const newStatus =
                action === "activate"
                    ? "active"
                    : action === "deactivate"
                    ? "deleted"
                    : "banned";
            const user = await User.findOneAndUpdate(
                { _id: mesg.update_user_status_request.user_id },
                { status: newStatus },
                { new: true }
            );
            if (!user) throw new Error("User not found");

            const message = {
                update_user_status_response: {
                    etat: true,
                    action: action,
                },
                id: [mesg.id],
            };
            this.controleur.envoie(this, message);
        }

        if (mesg.update_user_request) {
            await this.updateUser(mesg);
        }
    }

    async handleLogin(mesg) {
        try {
            const { email, password } = mesg.login_request;
            const hashedPassword = await this.sha256(password);
            const user = await User.findOne({
                email,
                password: hashedPassword,
            });
            if (user) {
                const token = this.createToken(user); // Use simplified token creation
                const message = {
                    login_response: { etat: true, token },
                    id: [mesg.id],
                };
                this.controleur.envoie(this, message);
            } else {
                throw new Error("Invalid credentials");
            }
        } catch (error) {
            const message = {
                login_response: { etat: false, error: error.message },
                id: [mesg.id],
            };
            this.controleur.envoie(this, message);
        }
    }

    async handleSignup(mesg) {
        try {
            const { email, password, firstname, lastname, phone, job, desc } =
                mesg.signup_request;

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new Error("User already exists");
            }

            const hashedPassword = await this.sha256(password);

            const user = new User({
                uuid: uuidv4(),
                email,
                password: hashedPassword,
                firstname,
                lastname,
                phone,
                job,
                desc,
                picture: "default_profile_picture.png",
            });
            await user.save();
            const token = this.createToken(user); // Use simplified token creation
            const message = {
                signup_response: { etat: true, token },
                id: [mesg.id],
            };
            this.controleur.envoie(this, message);
        } catch (error) {
            const message = {
                signup_response: {
                    etat: false,
                    error: error.message,
                },
                id: [mesg.id],
            };
            this.controleur.envoie(this, message);
        }
    }
    async getUsersList(mesg) {
        try {
            const users = await User.find(
                {},
                "uuid firstname lastname email picture status roles is_online phone job desc disturb_status"
            ).populate("roles", "role_label");
            const formattedUsers = users.map((user) => ({
                id: user.uuid, // Use UUID as primary identifier
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                picture: user.picture,
                status: user.status,
                roles: user.roles
                    ? user.roles.map((role) => role.role_label)
                    : [],
                online: user.is_online,
                phone: user.phone,
                job: user.job,
                desc: user.desc,
                disturb_status: user.disturb_status,
            }));
            const message = {
                users_list_response: {
                    etat: true,
                    users: formattedUsers,
                },
                id: [mesg.id],
            };
            this.controleur.envoie(this, message);
        } catch (error) {
            const message = {
                users_list_response: {
                    etat: false,
                    error: error.message,
                },
                id: [mesg.id],
            };
            this.controleur.envoie(this, message);
        }
    }

    async updateUser(mesg) {
        try {
            const socketId = mesg.id;
            if (!socketId)
                throw new Error("Sender socket id not available for update");
            // Use all received fields as update (partial update)
            const fieldsToUpdate = mesg.update_user_request;
            // Retrieve user info based on socket id
            const userInfo =
                await SocketIdentificationService.getUserInfoBySocketId(
                    socketId
                );
            if (!userInfo) throw new Error("User not found based on socket id"); // Update only the received fields
            const user = await User.findOneAndUpdate(
                { _id: userInfo._id },
                fieldsToUpdate,
                { new: true }
            ).populate("roles", "role_label");
            if (!user) throw new Error("User not found");
            const newUserInfo = {
                id: user.uuid, // Use UUID as primary ID for frontend consistency
                uuid: user.uuid,
                _id: user._id.toString(),
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                picture: user.picture,
                phone: user.phone,
                job: user.job,
                desc: user.desc,
                disturb_status: user.disturb_status,
                roles: user.roles
                    ? user.roles.map((role) => role.role_label)
                    : [],
                date_create: user.date_create || user.createdAt || null,
                last_connection: user.last_connection || null,
            };
            const message = {
                update_user_response: {
                    etat: true,
                    newUserInfo,
                },
                id: [mesg.id],
            };
            this.controleur.envoie(this, message);
        } catch (error) {
            const message = {
                update_user_response: {
                    etat: false,
                    error: error.message,
                    newUserInfo: null,
                },
                id: [mesg.id],
            };
            this.controleur.envoie(this, message);
        }
    }
    async getUserInfo(mesg) {
        try {
            const { userId } = mesg.user_info_request;

            if (!userId) {
                throw new Error("User ID is required");
            }

            // Try to find user by ObjectId first (most common case), then by UUID
            let user = null; // Check if userId looks like MongoDB ObjectId (24 hex characters)
            if (
                userId &&
                userId.length === 24 &&
                /^[0-9a-fA-F]{24}$/.test(userId)
            ) {
                user = await User.findById(
                    userId,
                    "uuid firstname lastname email picture phone job desc roles disturb_status date_create last_connection"
                ).populate("roles", "role_label");
            }

            // If not found by ObjectId, try UUID
            if (!user) {
                user = await User.findOne(
                    { uuid: userId },
                    "uuid firstname lastname email picture phone job desc roles disturb_status date_create last_connection"
                ).populate("roles", "role_label");
            }
            if (user) {
                const userInfo = {
                    id: user.uuid, // Always return UUID as primary ID for frontend
                    uuid: user.uuid, // Keep for compatibility
                    _id: user._id.toString(), // Include ObjectId for internal use
                    firstname: user.firstname,
                    lastname: user.lastname,
                    email: user.email,
                    picture: user.picture,
                    phone: user.phone,
                    job: user.job,
                    desc: user.desc,
                    disturb_status: user.disturb_status,
                    roles: user.roles
                        ? user.roles.map((role) => role.role_label)
                        : [],
                    date_create: user.date_create || user.createdAt || null,
                    last_connection: user.last_connection || null,
                };
                const message = {
                    user_info_response: { etat: true, userInfo },
                    id: [mesg.id],
                };
                this.controleur.envoie(this, message);
            } else {
                throw new Error("User not found");
            }
        } catch (error) {
            console.warn(
                `getUserInfo failed for socket ${mesg.id}: ${error.message}`
            );
            const message = {
                user_info_response: {
                    etat: false,
                    error:
                        error.message === "User not found"
                            ? "AUTHENTICATION_REQUIRED"
                            : error.message,
                },
                id: [mesg.id],
            };
            this.controleur.envoie(this, message);
        }
    }
    sha256 = async (text) => {
        // Encode le texte en un Uint8Array
        const encoder = new TextEncoder();
        const data = encoder.encode(text);

        // Utilise l'API SubtleCrypto pour générer le hash
        const hashBuffer = crypto.createHash("sha256").update(data).digest();

        // Convertit le buffer en une chaîne hexadécimale
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    };
}

export default UsersService;
