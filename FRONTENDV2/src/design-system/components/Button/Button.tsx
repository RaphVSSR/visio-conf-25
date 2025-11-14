import { FC, PropsWithChildren } from 'react'
import { HTMLMotionProps, motion } from 'framer-motion';
import "./Button.scss"
import {LucideIcons} from '../LucideIcons/LucideIcons';
import { icons } from 'lucide-react';

export type ButtonProps = {

	text: string,

} & (| {
		icon: keyof typeof icons,
		iconPosition: "left" | "right",
		iconSize: number,
	}
	| {
		icon?: undefined,
		iconPosition?: undefined,
		iconSize?: undefined,

	}) & HTMLMotionProps<"button">;

export const Button: FC<ButtonProps> = ({

	icon,
	iconPosition,
	iconSize,
	text,
	...props

}) => {
  return (
	
	<motion.button
		className="btn"
		{...props}
	>
		{icon && iconPosition === 'left' && <LucideIcons name={icon} className='btnIco' size={iconSize}/>}
		<span>{text}</span>
		{icon && iconPosition === 'right' && <LucideIcons name={icon} className='btnIco' size={iconSize}/>}

	</motion.button>

  )
}
