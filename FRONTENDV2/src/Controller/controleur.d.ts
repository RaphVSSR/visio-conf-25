export default class Controleur {
	listeEmission: Record<string, Record<string, any>>
	listeAbonnement: Record<string, Record<string, any>>
	verbose: boolean
	verboseall: boolean
	inscription(emetteur: any, liste_emission: string[], liste_abonnement: string[]): void
	desincription(emetteur: any, liste_emission: string[], liste_abonnement: string[]): void
	envoie(emetteur: any, t: Record<string, unknown>): void
}
