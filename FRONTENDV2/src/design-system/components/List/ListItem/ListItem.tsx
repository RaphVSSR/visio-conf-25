import React, { FC, PropsWithChildren } from "react"
import { HTMLMotionProps, motion } from "framer-motion"
import "./ListItem.scss"

export type ListItemProps = PropsWithChildren<{
	accentColor?: string
	onClick?: () => void
}> & Omit<HTMLMotionProps<"li">, "style" | "onClick">

export const ListItem: FC<ListItemProps> = ({
	accentColor,
	onClick,
	children,
	...rest
}) => {
	const interactive = typeof onClick === "function"
	return (
		<motion.li
			className={`listItem${interactive ? " listItem--interactive" : ""}`}
			whileHover={interactive ? { scale: 1.01 } : undefined}
			style={accentColor ? { "--listItem-accent": accentColor } as React.CSSProperties : undefined}
			onClick={onClick}
			{...rest}
		>
			{children}
		</motion.li>
	)
}
