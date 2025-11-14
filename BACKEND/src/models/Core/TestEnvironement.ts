
import { v4 as uuidv4 } from "uuid"
import path from "path";
import { fileURLToPath } from 'url';
import User, { type UserType } from "../User.ts"
import FileSystem, { File, Folder, type FileType, type FolderType } from "../services/FileSystem.ts";
import TracedError from "./TracedError.ts";


export default class TestEnvironement {

	static testUsersToInject: UserType[] = [
		{

			firstname: "John",
			lastname: "Doe",
			email: "john.doe@example.com",
			phone: "06.12.34.56.78",
			job: "Responsable RH",
			desc: "Chef de département MMI à l'université de Toulon. Également professeur de développement web.",
			status: "active",
			password:
				"f4f263e439cf40925e6a412387a9472a6773c2580212a4fb50d224d3a817de17", // Mot de passe : 'mdp'
		},
		{

			firstname: "Janny",
			lastname: "Doey",
			email: "janny.doey@example.com",
			phone: "06.23.45.67.89",
			job: "Professeur",
			desc: "Professeur de design graphique à l'université de Toulon.",
			status: "active",
			password:
				"f4f263e439cf40925e6a412387a9472a6773c2580212a4fb50d224d3a817de17", // Mot de passe : 'mdp'
		},
		{

			firstname: "Jean",
			lastname: "Deau",
			email: "jean.deau@example.com",
			phone: "06.34.56.78.90",
			job: "Responsable Technique",
			desc: "Responsable technique du département informatique. Expert en réseaux et systèmes.",
			status: "active",
			password:
				"f4f263e439cf40925e6a412387a9472a6773c2580212a4fb50d224d3a817de17", // Mot de passe : 'mdp'
		},
		{

			firstname: "Hélios",
			lastname: "Martin",
			email: "heliosmartin.hm@gmail.com",
			phone: "06.45.67.89.01",
			job: "Étudiant",
			desc: "Étudiant en Master 2 à l'université de Toulon. Développeur web full-stack.",
			password:
				"f4f263e439cf40925e6a412387a9472a6773c2580212a4fb50d224d3a817de17", // Mot de passe : 'mdp'
			status: "active",
		},
		{

			firstname: "Sophie",
			lastname: "Durand",
			email: "sophie.durand@example.com",
			phone: "06.56.78.90.12",
			job: "Professeur",
			desc: "Professeur de communication à l'université de Toulon.",
			password:
				"f4f263e439cf40925e6a412387a9472a6773c2580212a4fb50d224d3a817de17", // Mot de passe : 'mdp'
			status: "active",
		},
		{

			firstname: "Thomas",
			lastname: "Petit",
			email: "thomas.petit@example.com",
			phone: "06.67.89.01.23",
			job: "Étudiant",
			desc: "Étudiant en Licence 3 à l'université de Toulon. Spécialité développement mobile.",
			password:
				"f4f263e439cf40925e6a412387a9472a6773c2580212a4fb50d224d3a817de17", // Mot de passe : 'mdp'
			status: "active",
		},
		{

			firstname: "Marie",
			lastname: "Leroy",
			email: "marie.leroy@example.com",
			phone: "06.78.90.12.34",
			job: "Assistante Administrative",
			desc: "Assistante administrative du département MMI. Gestion des plannings et des inscriptions.",
			password:
				"f4f263e439cf40925e6a412387a9472a6773c2580212a4fb50d224d3a817de17", // Mot de passe : 'mdp'
			status: "active",
		},
		{

			firstname: "Lucas",
			lastname: "Moreau",
			email: "lucas.moreau@example.com",
			phone: "06.89.01.23.45",
			job: "Technicien",
			desc: "Technicien audiovisuel à l'université de Toulon. Responsable du matériel de tournage.",
			password:
				"f4f263e439cf40925e6a412387a9472a6773c2580212a4fb50d224d3a817de17", // Mot de passe : 'mdp'
			status: "active",
		},
	]

	//static async injectTestUsers(){


	//	if (process.env.VERBOSE === "true") {
		
	//		console.group("⚙️ Developpement environnement detected..");
	//		console.group("💉 Injecting test users..");

	//	}
		
	//	for (const userObj of this.testUsersToInject) {
			
	//		for (const user of this.testUsersToInject) user.roles = (await Role.model.findOne({uuid: "user"})) || [];

	//		const user = new User(userObj);
	//		await user.save();

	//		await this.defTestUsersRootFiles(user);
		
	//	};

	//	if (process.env.VERBOSE === "true") {
			
	//		console.log("✅ Utilisateurs créés : ", await User.model.countDocuments({}));
	//		console.log("✅ Dossiers créés : ", await Folder.model.countDocuments({type: "folder"}));
	//		console.log("✅ Fichiers créés : ", await File.model.countDocuments({type: "file"}));

	//		console.groupEnd();
	//		console.groupEnd();
	//		console.log("");
	//	}
	//}

	//private static async defTestUsersRootFiles(user: User){

	//	const __filename = fileURLToPath(import.meta.url);
	//	const __dirname = path.dirname(__filename);
		
	//	for (const folder of user.testRootFolders) {

	//		if (folder.files) for(const file of folder.files) {
				
	//			await FileSystem.copyTestFiles(

	//				file.name, path.join(__dirname, "..", "..", "uploads", file.path)

	//			);

	//			file.size = FileSystem.getFileSize(path.join(__dirname, "..", "..", "uploads", file.path));

	//		};

	//		const mongoRootFolder = new Folder(folder);
	//		await mongoRootFolder.save();

	//		if (folder.subFolders){

	//			for (const subFolder of folder.subFolders) {
	
	//				if (subFolder.files) for(const file of subFolder.files) {
				
	//					await FileSystem.copyTestFiles(

	//						file.name, path.join(__dirname, "..", "..", "uploads", file.path)

	//					);

	//					file.size = FileSystem.getFileSize(path.join(__dirname, "..", "..", "uploads", file.path));
	//				};

	//				const mongoSubFolder = new Folder(subFolder);
	//				await mongoSubFolder.save();
	
	//			};
	//		}
	//	};
	//}
} 