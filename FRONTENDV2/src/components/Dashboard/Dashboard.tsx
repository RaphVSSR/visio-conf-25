import { FC, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, FileUp, MessageSquare, PhoneCall, UserPlus, Users, Video, Zap } from 'lucide-react'
import "./Dashboard.scss"
import { Card } from 'design-system/components'
import { ContactPickerModal } from 'components/call'

export const Dashboard: FC = () => {

  const [contactPickerOpen, setContactPickerOpen] = useState(false)

  return (

	<motion.section
		id="homeDash"
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.5 }}
	>
		<h1 className="sectionTitle">
			<Zap size={22} /> Tableau de bord
		</h1>
		<section id='summaryCards'>

			<Card borderColor="#1E3664">
				<div className="cardIconBox" style={{ backgroundColor: 'rgba(30, 54, 100, 0.1)' }}>
					<MessageSquare size={20} />
				</div>
				<h3>Messages non lus</h3>
				<p className="cardValue">0</p>
			</Card>

			<Card borderColor="#F59E0B">
				<div className="cardIconBox" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
					<PhoneCall size={20} />
				</div>
				<h3>Appels manqués</h3>
				<p className="cardValue">0</p>
			</Card>

			<Card borderColor="#10B981">
				<div className="cardIconBox" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
					<Users size={20} />
				</div>
				<h3>Contacts actifs</h3>
				<p className="cardValue">0</p>
			</Card>

		</section>

		<nav id='dashQuickActions'>
			<button className="quickAction">
				<MessageSquare size={16} />
				<span>Nouvelle discussion</span>
			</button>
			<button className="quickAction" onClick={() => setContactPickerOpen(true)}>
				<Video size={16} />
				<span>Démarrer un appel</span>
			</button>
			<a href="/files" className="quickAction">
				<FileUp size={16} />
				<span>Partager un fichier</span>
			</a>
			<a href="/equipes" className="quickAction">
				<UserPlus size={16} />
				<span>Créer une équipe</span>
			</a>
		</nav>

		<motion.section
			id="recentActivity"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.3 }}
		>
			<h2 className="sectionTitle">
				<Activity size={20} /> Activités récentes
			</h2>

			<ul id="activitiesList">
				<li className="emptyActivities">
					<Activity size={40} />
					<p>Aucune activité récente</p>
				</li>
			</ul>
		</motion.section>

		{/* <ContactPickerModal isOpen={contactPickerOpen} onClose={() => setContactPickerOpen(false)} /> */}

	</motion.section>
  )
}
