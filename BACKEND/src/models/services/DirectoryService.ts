/**
 * DirectoryService — DISABLED.
 *
 * Author: Thomas-simon (PR #27 "Feature/directory files integration", 2026-05-04).
 *
 * This file was authored against an older base where `Controller/Controller.service.ts`
 * and `Controller/Controller.types.ts` provided the abstract `ControllerService`
 * base class. Those files were removed by PR #24 ("tozza re-adaptation",
 * merged the same day, before #27) which switched every service to a flat
 * per-service pattern (`registerHandler` / `register` / `traitementMessage`
 * — see AuthService / RoleService / TeamService).
 *
 * The result: this file has been uncompilable on `origin/main` since #27
 * landed (verified by running `tsc --noEmit` against `becc7c8`). It is also
 * never instantiated in `BACKEND/src/index.ts`, so disabling it changes no
 * runtime behaviour — the `/annuaire` page already receives nothing.
 *
 * Re-enable by rewriting against the current per-service pattern, then
 * registering the instance in `registerServices()` in `BACKEND/src/index.ts`.
 * Original implementation preserved below for reference.
 */

// import { ControllerService } from "../../Controller/Controller.service.ts";
// import { Controller, ControllerMessage } from "../../Controller/Controller.types.ts";
// import User from "../User.ts";
//
// export default class DirectoryService extends ControllerService {
//     io: any;
//
//     constructor(controleur: Controller, io: any, nom?: string) {
//         super(
//             controleur,
//             nom || 'DirectoryService',
//             ['directory'],
//             ['get_directory']
//         );
//         this.io = io;
//         console.log(`[${this.nomDInstance}] Service enregistré`);
//     }
//
//     async traitementMessage(mesg: ControllerMessage) {
//         const socketId = mesg.id;
//
//         if (mesg.get_directory) {
//             await this.handleGetDirectory(socketId!);
//         }
//     }
//
//     async handleGetDirectory(socketId: string) {
//         try {
//             const users = await User.model.find({}, 'firstname lastname email is_online disturb_status roles phone')
//                 .populate('roles');
//
//             this.controleur.envoie(this, {
//                 directory: {
//                     success: true,
//                     users: users
//                 },
//                 id: [socketId]
//             });
//         } catch (e) {
//             console.error('Erreur Get Directory:', e);
//             this.controleur.envoie(this, {
//                 directory: {
//                     success: false,
//                     error: 'Erreur lors de la récupération de l\'annuaire'
//                 },
//                 id: [socketId]
//             });
//         }
//     }
// }

export default class DirectoryService {}
