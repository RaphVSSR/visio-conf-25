import { FC, useContext, useEffect } from 'react';
import { motion } from 'framer-motion'
import { Search, Users } from 'lucide-react';
import "./Home.scss";
import { Dashboard } from 'components';
import { SearchBar } from 'design-system/components';
import { SessionContext } from 'contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { useSession } from 'core/AuthClient';
import { Socket } from 'socket.io-client';
import Controller from 'core/Controller';

export const Home: FC = () => {

    const session = useContext(SessionContext);
    
    if (!session.currentUser) return <Navigate to={"/login"} replace/>;

    useEffect(() => {

        Controller.socketInit();
        
    }, []);

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

                {/*{filteredUsers.length > 0 ? (
                    //<UserListAmis users={filteredUsers} currentUserEmail={currentUser.email}/>
                ) : (*/}
                    <div id="noFriends">
                        {/*{searchQuery ? (
                            <>
                                <Search size={40} />
                                <h3>Aucun ami trouvé</h3>
                                <p>
                                    Aucun de vos amis ne correspond à votre
                                    recherche "{searchQuery}"
                                </p>
                                <button
                                    onClick={clearSearch}
                                    className="resetButton"
                                >
                                    Réinitialiser la recherche
                                </button>
                            </>
                        ) : (*/}
                            <>
                                <Users size={40} />
                                <h3>Aucun contact</h3>
                                <p>
                                    Vous n'avez pas encore de contacts.
                                    Créez une discussion pour commencer à
                                    voir vos contacts ici.
                                </p>
                                <button
                                    //onClick={handleNewDiscussion}
                                    className="resetButton"
                                >
                                    Nouvelle discussion
                                </button>
                            </>
                        {/*)}*/}
                    </div>
                {/*)}*/}
            </motion.section>
        </main>
    );
}
