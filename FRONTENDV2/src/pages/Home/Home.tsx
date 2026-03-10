import { FC } from 'react';
import { motion } from 'framer-motion'
import { Users } from 'lucide-react';
import "./Home.scss";
import { Dashboard } from 'components';
import { Button, SearchBar } from 'design-system/components';
import { useAuth } from 'hooks/useAuth';
import { Navigate } from 'react-router-dom';

export const Home: FC = () => {

    const { isAuthenticated, user, logout } = useAuth();

    if (!isAuthenticated) return <Navigate to={"/login"} replace/>;

    return (
        <main id='homePage'>

            <motion.nav
                id="topBar"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                <span id="topBarGreeting">
                    {user?.firstname && `Bonjour, ${user.firstname}`}
                </span>
                <Button
                    id="disconnectBtn"
                    text="Déconnexion"
                    icon="LogOut"
                    iconPosition="left"
                    iconSize={16}
                    onClick={logout}
                />
            </motion.nav>

            <Dashboard/>

            {/* Colonne des contacts */}
            <motion.section
                id="friendsSection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >

            <header id="friendsHeader">

                <h2 className='sectionTitle'><Users size={20} /> Contacts</h2>
                <SearchBar dDownNeeded="false" id="friendsSearch" placeholder='Rechercher un contact...'/>

            </header>

                    <section id="noFriends">
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
                    </section>
            </motion.section>
        </main>
    );
}
