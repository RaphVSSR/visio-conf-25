import express, { Router } from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import { File } from "../models/services/FileSystem.ts"
import { v4 as uuidv4 } from "uuid"

import FileSystem from "../models/services/FileSystem.ts"
import { toNodeHandler } from "better-auth/node"
import Database from "../models/services/Database.ts"
import Auth from "../models/services/Auth.ts"

const router = express.Router();

router.all("/*", toNodeHandler(Auth.betterAuthClient));
router.use(express.json());

//router.post("/login", authenticateToken,

//    //Aller rechercher les données dans la DB
//    //Comparer ces données avec celles enregiestrées
//	//Changer le status de la personne si besoin
//    //Retourner une réponse en fonction de l'intégrité de ces données
//)

//router.post("/logout", authenticateToken,

//    //Aller rechercher les données dans la DB
//    //Changer le status de la personne
//    //Retourner une réponse
//)

export default router;
