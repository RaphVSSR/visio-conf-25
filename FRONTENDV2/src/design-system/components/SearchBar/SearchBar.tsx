import React, { FC, HTMLAttributes, useRef, useState } from 'react'
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
	suggestingList,
	placeholder,
	...props

}: SearchBarProps<suggestingTypeFromParent>) => {

	const [filteredValue, setFilteredValue] = useState<typeof suggestingList | null>(null);
	const suggestingData = useRef<typeof suggestingList | null>(null);

	return (

		//TODO: Gérer l'utilisation de la searchbar si pas de dropdown requis
		<>
			<div {...props} className='searchBar'>
				<Search className="searchIcon" size={16} />
				<input
					className="searchInput"
					type="text"
					placeholder={placeholder}
					//value={searchQuery}
					//onChange={handleSearch}
				/>
				{/*{searchQuery && (
					<button
						onClick={clearSearch}
						className="clearButton"
					>
						<X size={16} />
					</button>
				)}*/}
			</div>
			{dDownNeeded === "true" && <div className="searchSuggestions">


			</div>}
		</>
	)
}
