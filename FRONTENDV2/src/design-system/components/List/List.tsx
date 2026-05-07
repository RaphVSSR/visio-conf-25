import React, { FC, PropsWithChildren } from "react"
import { HTMLMotionProps, motion } from "framer-motion"
import "./List.scss"

export type ListVariant = "rows" | "grid"

export type ListProps = PropsWithChildren<{
	variant?: ListVariant
}> & Omit<HTMLMotionProps<"ul">, "style">

export const List: FC<ListProps> = ({
	variant = "rows",
	children,
	...rest
}) => {
	return (
		<motion.ul className={`list list--${variant}`} {...rest}>
			{children}
		</motion.ul>
	)
}

export { ListItem } from "./ListItem/ListItem"
export type { ListItemProps } from "./ListItem/ListItem"
