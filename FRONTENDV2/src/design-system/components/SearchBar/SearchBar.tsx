import React, { HTMLAttributes } from 'react'
import { Search } from 'lucide-react'
import "./SearchBar.scss"

export type SearchBarProps<suggestingType> = { 
	
	placeholder: string

} & (

	| {

		dDownNeeded: "true",
		suggestingList: suggestingType[],
	}

	| {

		dDownNeeded: "false",
		suggestingList?: undefined,

	}
) & HTMLAttributes<HTMLDivElement>;

export const SearchBar = <suggestingTypeFromParent,>({

	dDownNeeded,
	placeholder,
	...props

}: SearchBarProps<suggestingTypeFromParent>) => {

	return (

		//TODO: Gérer l'utilisation de la searchbar si pas de dropdown requis
		<>
			<div {...props} className='searchBar'>
				<Search className="searchIcon" size={16} />
				<input
					className="searchInput"
					type="text"
					placeholder={placeholder}
				/>
			</div>
			{dDownNeeded === "true" && <div className="searchSuggestions">


			</div>}
		</>
	)
}
