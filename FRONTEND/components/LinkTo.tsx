import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
interface LinkToProps {
    to: string;
    children: React.ReactNode;
    className?: string;
}
interface Controller {
    inscription: (current: any, emis: string[], recus: string[]) => void;
    desincription: (current: any, emis: string[], recus: string[]) => void;
    envoie: (current: any, message: { naviguer_vers: string }) => void;
}
const listeMessagesEmis = ["naviguer_vers"];
const listeMessagesRecus: string[] = [];
const LinkTo: React.FC<LinkToProps> = ({ to, children, className = "" }) => {
    const router = useRouter();
    const instanceName = `LinkTo-${to}`;
    const [controleur] = useState<Controller | null>(null);
    const { current } = useRef({
        nomDInstance: instanceName,
        traitementMessage: () => {
            // Handle incoming messages if needed
        }
    });
    useEffect(() => {
        if (controleur) {
            controleur.inscription(current, listeMessagesEmis, listeMessagesRecus);
            return () => {
                controleur.desincription(
                    current,
                    listeMessagesEmis,
                    listeMessagesRecus
                );
            };
        }
    }, [controleur, current]);
    const handleClick = () => {
        if (controleur) {
            controleur.envoie(current, {
                naviguer_vers: to
            });
        }
        router.push(to);
    };
    return (
        <Link href={to} className={className} onClick={handleClick}>
            {children}
        </Link>
    );
};
export default LinkTo;