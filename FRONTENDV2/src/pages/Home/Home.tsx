
import { FC } from 'react';
import { motion } from 'framer-motion'
import { Users } from 'lucide-react';
import "./Home.scss";
import { Dashboard } from 'components';
import { SearchBar } from 'design-system/components';
import { useAuth } from 'hooks/useAuth';

export const Home: FC = () => {

    const { user } = useAuth();

    return (
        <div id='homePage'>

            <motion.header
                id="homeGreeting"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h1 id="greetingText">
                    {user?.firstname && `Bonjour, ${user.firstname}`}
                </h1>
            </motion.header>

            <div id="homeContent">

                <div id="mainColumn">
                    <Dashboard/>
                </div>

                <motion.aside
                    id="contactsSidebar"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <header id="contactsHeader">
                        <h2 className='sectionTitle'><Users size={20} /> Contacts</h2>
                        <SearchBar dDownNeeded="false" id="contactsSearch" placeholder='Rechercher un contact...'/>
                    </header>

                    <section id="noContacts">
                        <Users size={40} />
                        <h3>Aucun contact</h3>
                        <p>
                            Vous n'avez pas encore de contacts.
                            Créez une discussion pour commencer à
                            voir vos contacts ici.
                        </p>
                        <button className="resetButton">
                            Nouvelle discussion
                        </button>
                    </section>
                </motion.aside>

            </div>
        </div>
    );
}
