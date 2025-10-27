import express, { Router } from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import { File } from "../models/services/FileSystem.ts"
import { v4 as uuidv4 } from "uuid"

import authenticateToken from "../models/utils/authenticateToken.ts"
import FileSystem from "../models/services/FileSystem.ts"

const router = express.Router();
//const { upload } = new FileUpload();

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
