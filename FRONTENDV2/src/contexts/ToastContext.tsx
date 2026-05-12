import { createContext, FC, PropsWithChildren, ReactNode, useCallback, useContext, useState } from "react"
import { AnimatePresence } from "framer-motion"
import { Toast, type ToastAction, type ToastVariant } from "design-system/components/Toast/Toast"

type ToastItem = {
	name: string
	body?: ReactNode
	message?: string
	variant?: ToastVariant
	subtitle?: string
	actions?: ToastAction[]
}

type ToastContextType = {
	showToast: (item: ToastItem) => void
	removeToast: (name: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast(): ToastContextType {
	const context = useContext(ToastContext)
	if (!context) throw new Error("useToast must be used within a ToastProvider")
	return context
}

export const ToastProvider: FC<PropsWithChildren> = ({ children }) => {

	const [items, setItems] = useState<ToastItem[]>([])

	const removeToast = useCallback((name: string) => {
		setItems(list => list.filter(item => item.name !== name))
	}, [])

	const showToast = useCallback((item: ToastItem) => {
		setItems(list => [...list.filter(prev => prev.name !== item.name), item])
	}, [])

	return (
		<ToastContext.Provider value={{ showToast, removeToast }}>
			{children}
			<AnimatePresence mode="popLayout">
				{items.map(item => (
					<Toast
						key={item.name}
						message={item.message}
						variant={item.variant}
						subtitle={item.subtitle}
						actions={item.actions}
						onDismiss={() => removeToast(item.name)}
					>
						{item.body}
					</Toast>
				))}
			</AnimatePresence>
		</ToastContext.Provider>
	)
}
