import React, { FC, HTMLAttributes, PropsWithChildren } from 'react'
import { HTMLMotionProps, motion } from 'framer-motion'
import { icons, MessageSquare } from 'lucide-react';
import { LucideIcons } from '../LucideIcons/LucideIcons';
import "./Card.scss"

export type CardProps = PropsWithChildren<(

	| {
		icon: keyof typeof icons,
		iconPosition: "left" | "right",
		iconSize: number,
	}
	| {
		icon?: undefined,
		iconPosition?: undefined,
		iconSize?: undefined,
	}
)> & HTMLMotionProps<"div">;

export const Card: FC<CardProps> = ({

	icon,
	iconPosition,
	iconSize,
	children,
	...props

}) => {
  return (
	
	<motion.div
		className="card"
		whileHover={{ scale: 1.02 }}
		{...props}
	>
		{icon && iconPosition === 'left' && <LucideIcons name={icon} className='cardIco' size={iconSize}/>}
		{children}
		{icon && iconPosition === 'right' && <LucideIcons name={icon} className='cardIco' size={iconSize}/>}

	</motion.div>

  )
}
