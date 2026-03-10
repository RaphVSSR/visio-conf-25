/**
 * Classe abstraite de base pour les modèles de collections MongoDB.
 * Chaque collection (Folder, File, etc.) hérite de cette classe
 * pour partager une interface commune (save, flushAll).
 */
export default abstract class Collection {

	/**
	 * Sauvegarde l'instance du modèle en base de données.
	 */
	abstract save(): Promise<void>;
}
