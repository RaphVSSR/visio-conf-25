export default class Controleur {
	listeEmission: Record<string, Record<string, any>>
	listeAbonnement: Record<string, Record<string, any>>
	verbose: boolean
	verboseall: boolean
	inscription(emetteur: any, listeEmission: string[], listeAbonnement: string[]): void
	envoie(emetteur: any, message: any): void
}
