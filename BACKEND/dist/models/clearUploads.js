import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
const UPLOAD_SUBDIRS = ["files", "profile-pictures", "team-pictures"];
const PRESERVED_FILES = new Set(["README.md", ".gitkeep", "default_profile_picture.png", ".gitignore"]);
async function clearDirectory(dirPath, removeEmptyDirs = true) {
    try {
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        let filesRemoved = 0;
        let dirsRemoved = 0;
        for (const item of items) {
            const itemPath = path.join(dirPath, item.name);
            if (item.isDirectory()) {
                const sub = await clearDirectory(itemPath, removeEmptyDirs);
                filesRemoved += sub.filesRemoved;
                dirsRemoved += sub.dirsRemoved;
                if (removeEmptyDirs) {
                    const remaining = await fs.readdir(itemPath);
                    if (remaining.length === 0) {
                        await fs.rmdir(itemPath);
                        dirsRemoved++;
                    }
                }
            }
            else if (!PRESERVED_FILES.has(item.name)) {
                await fs.unlink(itemPath);
                filesRemoved++;
            }
        }
        return { filesRemoved, dirsRemoved };
    }
    catch (error) {
        if (error.code === "ENOENT")
            return { filesRemoved: 0, dirsRemoved: 0 };
        throw error;
    }
}
async function ensureDirectories() {
    for (const subdir of [UPLOADS_DIR, ...UPLOAD_SUBDIRS.map(s => path.join(UPLOADS_DIR, s))]) {
        await fs.mkdir(subdir, { recursive: true });
    }
}
async function ensureGitkeepFiles() {
    for (const subdir of UPLOAD_SUBDIRS) {
        const gitkeepPath = path.join(UPLOADS_DIR, subdir, ".gitkeep");
        try {
            await fs.access(gitkeepPath);
        }
        catch {
            await fs.writeFile(gitkeepPath, "");
        }
    }
}
export async function clearUploads() {
    await ensureDirectories();
    let totalFiles = 0;
    let totalDirs = 0;
    for (const subdir of UPLOAD_SUBDIRS) {
        const removeEmpty = subdir === "files";
        const result = await clearDirectory(path.join(UPLOADS_DIR, subdir), removeEmpty);
        totalFiles += result.filesRemoved;
        totalDirs += result.dirsRemoved;
    }
    await ensureGitkeepFiles();
    console.log(`Uploads cleared: ${totalFiles} files, ${totalDirs} directories removed`);
}
if (process.argv[1]?.endsWith("clearUploads")) {
    clearUploads().catch(console.error);
}
//# sourceMappingURL=clearUploads.js.map