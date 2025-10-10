import { Folder, Users } from "lucide-react"
import styles from "./page.module.css"
import TabbedFileExplorer from "./components/TabbedFileExplorer"

export default function FilesPage() {
    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.titleContainer}>
                    <Folder className={styles.icon} />
                    <h1 className={styles.title}>Gestionnaire de Fichiers</h1>
                </div>
                <p className={styles.subtitle}>
                    Gérez vos fichiers personnels et les fichiers partagés par
                    vos équipes
                </p>
            </div>
            <div className={styles.fileExplorerContainer}>
                <TabbedFileExplorer />
            </div>
        </div>
    )
}
