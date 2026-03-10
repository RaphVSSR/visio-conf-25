
import { FC, useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Hash, Lock, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Channel } from "pages/Teams/Teams.types";
import "./ChannelTabs.scss";


// ─── Types ───────────────────────────────────────────────

export interface ChannelTabsProps {
	channels: Channel[];
	selectedChannel: Channel | null;
	onSelectChannel: (channel: Channel) => void;
	onCreateChannel: () => void;
}


// ─── Component ───────────────────────────────────────────

export const ChannelTabs: FC<ChannelTabsProps> = ({
	channels,
	selectedChannel,
	onSelectChannel,
	onCreateChannel,
}) => {
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);

	const sortedChannels = useMemo(
		() => [...channels].sort((a, b) => a.name.localeCompare(b.name)),
		[channels]
	);

	const updateScrollIndicators = useCallback(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		setCanScrollLeft(container.scrollLeft > 0);
		setCanScrollRight(
			container.scrollLeft + container.clientWidth < container.scrollWidth - 1
		);
	}, []);

	useEffect(() => {
		updateScrollIndicators();

		const container = scrollContainerRef.current;
		if (!container) return;

		const resizeObserver = new ResizeObserver(updateScrollIndicators);
		resizeObserver.observe(container);
		container.addEventListener("scroll", updateScrollIndicators);

		return () => {
			resizeObserver.disconnect();
			container.removeEventListener("scroll", updateScrollIndicators);
		};
	}, [updateScrollIndicators, channels]);

	const handleScroll = (direction: "left" | "right") => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const scrollAmount = 200;
		container.scrollBy({
			left: direction === "left" ? -scrollAmount : scrollAmount,
			behavior: "smooth",
		});
	};

	return (
		<div className="channel-tabs">
			{canScrollLeft && (
				<button
					className="channel-tabs__scroll-button channel-tabs__scroll-button--left"
					onClick={() => handleScroll("left")}
					aria-label="Défiler vers la gauche"
				>
					<ChevronLeft size={16} />
				</button>
			)}

			<div
				className="channel-tabs__container"
				ref={scrollContainerRef}
			>
				{sortedChannels.map((channel) => (
					<button
						key={channel.id}
						className={`channel-tabs__tab ${
							selectedChannel?.id === channel.id ? "channel-tabs__tab--selected" : ""
						}`}
						onClick={() => onSelectChannel(channel)}
					>
						{channel.isPublic ? (
							<Hash size={14} className="channel-tabs__tab-icon" />
						) : (
							<Lock size={14} className="channel-tabs__tab-icon" />
						)}
						<span className="channel-tabs__tab-name">{channel.name}</span>
					</button>
				))}
			</div>

			{canScrollRight && (
				<button
					className="channel-tabs__scroll-button channel-tabs__scroll-button--right"
					onClick={() => handleScroll("right")}
					aria-label="Défiler vers la droite"
				>
					<ChevronRight size={16} />
				</button>
			)}

			<button
				className="channel-tabs__add-button"
				onClick={onCreateChannel}
				title="Créer un channel"
			>
				<Plus size={16} />
			</button>
		</div>
	);
};
