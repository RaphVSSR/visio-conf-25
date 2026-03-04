import { createContext, FC, PropsWithChildren, useCallback, useContext, useRef, useState } from "react"
import { AnimatePresence } from "framer-motion"
import { Toast, type ToastAction, type ToastVariant } from "design-system/components/Toast/Toast"

type ToastItem = {
	id: string
	message: string
	variant: ToastVariant
	subtitle?: string
	actions?: ToastAction[]
}

type ToastContextType = {
	addToast: (toast: Omit<ToastItem, "id"> & { duration?: number }) => string
	removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast(): ToastContextType {
	const context = useContext(ToastContext)
	if (!context) throw new Error("useToast must be used within a ToastProvider")
	return context
}

export const ToastProvider: FC<PropsWithChildren> = ({ children }) => {

	const [toasts, setToasts] = useState<ToastItem[]>([])
	const counterRef = useRef(0)

	const removeToast = useCallback((id: string) => {
		setToasts(prev => prev.filter(t => t.id !== id))
	}, [])

	const addToast = useCallback((toast: Omit<ToastItem, "id"> & { duration?: number }) => {
		const id = `toast-${++counterRef.current}`
		setToasts(prev => [...prev, { ...toast, id }])
		const duration = toast.duration ?? 5000
		if (duration > 0) setTimeout(() => removeToast(id), duration)
		return id
	}, [removeToast])

	return (
		<ToastContext.Provider value={{ addToast, removeToast }}>
			{children}
			<aside className="globalToastContainer" aria-live="polite">
				<AnimatePresence mode="popLayout">
					{toasts.map(toast => (
						<Toast
							key={toast.id}
							message={toast.message}
							variant={toast.variant}
							subtitle={toast.subtitle}
							actions={toast.actions}
							onDismiss={() => removeToast(toast.id)}
						/>
					))}
				</AnimatePresence>
			</aside>
		</ToastContext.Provider>
	)
}
