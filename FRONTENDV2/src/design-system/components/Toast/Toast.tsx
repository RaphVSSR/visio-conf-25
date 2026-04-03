import { FC, ReactNode } from "react"
import { motion } from "framer-motion"
import { X, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react"
import "./Toast.scss"

export type ToastVariant = "success" | "danger" | "warning" | "info"

export type ToastAction = {
	label: string
	onClick: () => void
	variant?: "primary" | "ghost"
}

export type ToastProps = {
	message: string
	variant?: ToastVariant
	onDismiss?: () => void
	actions?: ToastAction[]
	subtitle?: string
}

const ICONS: Record<ToastVariant, ReactNode> = {
	success: <CheckCircle size={18} />,
	danger: <XCircle size={18} />,
	warning: <AlertTriangle size={18} />,
	info: <Info size={18} />,
}

export const Toast: FC<ToastProps> = ({ message, variant = "info", onDismiss, actions, subtitle }) => {

	return (
		<motion.article
			className={`toast toast--${variant}`}
			initial={{ opacity: 0, x: 60, scale: 0.92 }}
			animate={{ opacity: 1, x: 0, scale: 1 }}
			exit={{ opacity: 0, x: 60, scale: 0.92 }}
			transition={{ type: "spring", stiffness: 500, damping: 35 }}
			layout
		>
			<span className="toast__icon">{ICONS[variant]}</span>
			<section className="toast__content">
				<p className="toast__message">{message}</p>
				{subtitle && <p className="toast__subtitle">{subtitle}</p>}
				{actions && actions.length > 0 && (
					<footer className="toast__actions">
						{actions.map((action, i) => (
							<button
								key={i}
								className={`toast__action toast__action--${action.variant || "primary"}`}
								onClick={action.onClick}
							>
								{action.label}
							</button>
						))}
					</footer>
				)}
			</section>
			{onDismiss && (
				<button className="toast__close" onClick={onDismiss} aria-label="Dismiss">
					<X size={14} />
				</button>
			)}
		</motion.article>
	)
}
