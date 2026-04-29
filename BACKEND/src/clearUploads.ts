import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

// Configuration ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Chemins des dossiers d'uploads
const uploadsDir = path.join(__dirname, "uploads")
const filesDir = path.join(uploadsDir, "files")
const profilePicturesDir = path.join(uploadsDir, "profile-pictures")
const teamPicturesDir = path.join(uploadsDir, "team-pictures")

// Fichiers à préserver
const preservedFiles = new Set([
    "README.md",
    ".gitkeep",
    "default_profile_picture.png",
    ".gitignore",
])

/**
 * Supprime récursivement tous les fichiers d'un dossier sauf ceux préservés
 * @param {string} dirPath - Chemin du dossier
 * @param {boolean} removeEmptyDirs - Supprimer les dossiers vides
 */
async function clearDirectory(dirPath, removeEmptyDirs = true) {
    try {
        const items = await fs.readdir(dirPath, { withFileTypes: true })
        let filesRemoved = 0
        let dirsRemoved = 0

        for (const item of items) {
            const itemPath = path.join(dirPath, item.name)

            if (item.isDirectory()) {
                // Recursion pour les sous-dossiers
                const { filesRemoved: subFiles, dirsRemoved: subDirs } =
                    await clearDirectory(itemPath, removeEmptyDirs)
                filesRemoved += subFiles
                dirsRemoved += subDirs

                // Supprimer le dossier s'il est vide et si on doit supprimer les dossiers vides
                if (removeEmptyDirs) {
                    try {
                        const remainingItems = await fs.readdir(itemPath)
                        if (remainingItems.length === 0) {
                            await fs.rmdir(itemPath)
                            dirsRemoved++
                            console.log(`🗂️  Dossier supprimé: ${itemPath}`)
                        }
                    } catch (error) {
                        // Le dossier n'est probablement pas vide, on continue
                    }
                }
            } else if (item.isFile()) {
                // Vérifier si le fichier doit être préservé
                if (!preservedFiles.has(item.name)) {
                    await fs.unlink(itemPath)
                    filesRemoved++
                    console.log(`📄 Fichier supprimé: ${itemPath}`)
                } else {
                    console.log(`✅ Fichier préservé: ${itemPath}`)
                }
            }
        }

        return { filesRemoved, dirsRemoved }
    } catch (error) {
        if (error.code === "ENOENT") {
            console.log(`⚠️  Dossier inexistant: ${dirPath}`)
            return { filesRemoved: 0, dirsRemoved: 0 }
        }
        throw error
    }
}

/**
 * Crée les dossiers de base s'ils n'existent pas
 */
async function ensureDirectories() {
    const dirs = [uploadsDir, filesDir, profilePicturesDir, teamPicturesDir]

    for (const dir of dirs) {
        try {
            await fs.access(dir)
            console.log(`✅ Dossier existant: ${dir}`)
        } catch (error) {
            if (error.code === "ENOENT") {
                await fs.mkdir(dir, { recursive: true })
                console.log(`📁 Dossier créé: ${dir}`)
            } else {
                throw error
            }
        }
    }
}

/**
 * Crée les fichiers .gitkeep si nécessaire
 */
async function ensureGitkeepFiles() {
    const gitkeepDirs = [filesDir, profilePicturesDir, teamPicturesDir]

    for (const dir of gitkeepDirs) {
        const gitkeepPath = path.join(dir, ".gitkeep")
        try {
            await fs.access(gitkeepPath)
            console.log(`✅ .gitkeep existant: ${gitkeepPath}`)
        } catch (error) {
            if (error.code === "ENOENT") {
                await fs.writeFile(
                    gitkeepPath,
                    "# Ce fichier préserve la structure du dossier pour git\n"
                )
                console.log(`📝 .gitkeep créé: ${gitkeepPath}`)
            } else {
                throw error
            }
        }
    }
}

/**
 * Fonction principale de nettoyage
 */
async function clearUploads() {
    console.log("🧹 Début du nettoyage des fichiers uploadés...\n")

    let totalFilesRemoved = 0
    let totalDirsRemoved = 0

    try {
        // S'assurer que les dossiers de base existent
        await ensureDirectories()
        console.log()

        // Nettoyer le dossier files (fichiers utilisateurs)
        console.log("📂 Nettoyage du dossier files/")
        const filesResult = await clearDirectory(filesDir, true)
        totalFilesRemoved += filesResult.filesRemoved
        totalDirsRemoved += filesResult.dirsRemoved
        console.log()

        // Nettoyer le dossier profile-pictures (sauf default_profile_picture.png)
        console.log("🖼️  Nettoyage du dossier profile-pictures/")
        const profileResult = await clearDirectory(profilePicturesDir, false)
        totalFilesRemoved += profileResult.filesRemoved
        totalDirsRemoved += profileResult.dirsRemoved
        console.log()

        // Nettoyer le dossier team-pictures
        console.log("👥 Nettoyage du dossier team-pictures/")
        const teamResult = await clearDirectory(teamPicturesDir, false)
        totalFilesRemoved += teamResult.filesRemoved
        totalDirsRemoved += teamResult.dirsRemoved
        console.log()

        // Recréer les fichiers .gitkeep si nécessaire
        await ensureGitkeepFiles()
        console.log() // Résumé
        console.log("✨ Nettoyage terminé !")
        console.log(`📊 Résumé:`)
        console.log(`   - Fichiers supprimés: ${totalFilesRemoved}`)
        console.log(`   - Dossiers supprimés: ${totalDirsRemoved}`)
        console.log(`   - Structure préservée avec les fichiers .gitkeep`)
        console.log(`   - Image de profil par défaut préservée`)
        console.log()
        console.log("💡 RECOMMANDATION:")
        console.log("   Si des fichiers étaient référencés en base de données,")
        console.log("   pensez à exécuter 'node initDb.js' pour réinitialiser")
        console.log(
            "   la base de données et éviter les références orphelines."
        )
    } catch (error) {
        console.error("❌ Erreur lors du nettoyage:", error)
        process.exit(1)
    }
}

// Point d'entrée principal
async function main() {
    console.log("🧹 NETTOYAGE DES FICHIERS UPLOADÉS")
    console.log("==================================\n")

    console.log(
        "⚠️  Cette action va supprimer TOUS les fichiers uploadés par les utilisateurs."
    )
    console.log("   - Fichiers utilisateurs (dossier files/)")
    console.log(
        "   - Photos de profil personnalisées (dossier profile-pictures/)"
    )
    console.log("   - Photos d'équipe (dossier team-pictures/)")
    console.log()
    console.log("   Les fichiers suivants seront préservés:")
    console.log("   - README.md, .gitkeep, default_profile_picture.png")
    console.log()
    console.log("🔥 Lancement du nettoyage...")
    console.log()

    await clearUploads()
}

// Exécuter si ce fichier est appelé directement
if (process.argv[1] && process.argv[1].endsWith("clearUploads.js")) {
    main().catch(console.error)
}

// Exporter pour utilisation dans d'autres modules
export { clearUploads, clearDirectory }
