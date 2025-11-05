import React, { FC } from 'react'
import { motion } from 'framer-motion'
import { Activity, FileText, MessageSquare, PhoneCall, Users, Zap } from 'lucide-react'
import "./Dashboard.scss"
import { Button, Card } from 'design-system/components'

export const Dashboard: FC = () => {
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

			<Card icon='MessageSquare' iconPosition='left' iconSize={20} style={{borderColor: "#1E3664"}}>

				<h3>Messages non lus</h3>
				{/*<p>{getUnreadReceivedMessagesCount()}</p>*/}

			</Card>

			<Card icon='PhoneCall' iconPosition='left' iconSize={20} style={{borderColor: "#F59E0B"}}>

				<h3>Appels manqués</h3>
				{/*<p>{getMissedCallsCount()}</p>*/}

			</Card>

			<Card icon='Users' iconPosition='left' iconSize={20} style={{borderColor: "#10B981"}}>

				<h3>Contacts actifs</h3>
				{/*<p>{getActiveContactsCount()}</p>*/}

			</Card>

		</section>

		<aside id='dashQuickActions'>
			<Button text='Nouvelle Discussion' icon='MessageSquare' iconPosition='left' iconSize={16}/>

			{/*handleStartCall()*/}
			<Button text='Démarrer un appel' icon='Video' iconPosition='left' iconSize={16}/>
			{/*<a href="/files" className="dashQuickAction">
				<FileUp size={16} />
				<span>Partager un fichier</span>
			</a>
			<a href="/equipes" className="dashQuickAction">
				<UserPlus size={16} />
				<span>Créer une équipe</span>
			</a>*/}
		</aside>

		<motion.section
			id="recentActivity"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.3 }}
		>
			<h2 className="sectionTitle">
				<Activity size={20} /> Activités récentes
			</h2>

			<div id="activitiesList">
				{/*{recentActivities.length > 0 ? (
					recentActivities.map((activity, index) =>
						activity ? (
							<div
								key={index}
								className="activityItem"
							>
								<div
									className="activityAvatar"
								>
									<img
										src={
											activity.user
												.picture
												? `https://visioconfbucket.s3.eu-north-1.amazonaws.com/${activity.user.picture}`
												: "/images/default_profile_picture.png"
										}
										alt={`${activity.user.firstname} ${activity.user.lastname}`}
									/>
								</div>
								<div
									className="activityContent"
								>
									<div
										className="activityHeader"
									>
										<span
											className="activityUser"
										>
											{
												activity.user
													.firstname
											}{" "}
											{
												activity.user
													.lastname
											}
										</span>
										<span
											className="activityTime"
										>
											{activity.time}
										</span>
									</div>
									<p
										className="activityText"
									>
										{activity.content}
									</p>
								</div>
								<div
									className="activityIcon"
								>
									{activity.type ===
										"message" && (
										<MessageSquare size={16}/>
									)}
									{activity.type ===
										"call" && (
										<PhoneCall size={16} />
									)}
									{activity.type ===
										"file" && (
										<FileText size={16} />
									)}
									{activity.type ===
										"team" && (
										<Users size={16} />
									)}
								</div>
							</div>
						) : null
					)
				) : (*/}
					<div className="emptyActivities">
						<Activity size={40} />
						<p>Aucune activité récente</p>
					</div>
				{/*)}*/}
			</div>
		</motion.section>

	</motion.section>
  )
}
