import { FC } from 'react';
import { motion } from 'framer-motion'
import { Users } from 'lucide-react';
import "./Home.scss";
import { Dashboard } from 'components';
import { SearchBar } from 'design-system/components';
import { useAuth } from 'hooks/useAuthMessages';
import { Navigate } from 'react-router-dom';

export const Home: FC = () => {

    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) return <Navigate to={"/login"} replace/>;

    return (
        <main id='homePage'>

            <Dashboard/>

            {/* Colonne des contacts */}
            <motion.section
                id="friendsSection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >

            <div id="friendsHeader">

                <h2 className='sectionTitle'><Users size={20} /> Contacts</h2>
                <SearchBar dDownNeeded="false" id="friendsSearch" placeholder='Rechercher un contact...'/>

            </div>

                    <div id="noFriends">
                            <>
                                <Users size={40} />
                                <h3>Aucun contact</h3>
                                <p>
                                    Vous n'avez pas encore de contacts.
                                    Créez une discussion pour commencer à
                                    voir vos contacts ici.
                                </p>
                                <button
                                    className="resetButton"
                                >
                                    Nouvelle discussion
                                </button>
                            </>
                    </div>
            </motion.section>
        </main>
    );
}
