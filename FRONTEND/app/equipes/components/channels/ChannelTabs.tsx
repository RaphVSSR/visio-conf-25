"use client"
import { useRef, useEffect, useState } from "react"
import styles from "./ChannelTabs.module.css"
import { HashIcon, Lock, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import type { Channel } from "@/types/Channel"
import { useAppContext } from "@/context/AppContext"

interface ChannelTabsProps {
    channels: Channel[]
    selectedChannel: Channel | null
    onSelectChannel: (channel: Channel) => void
    onCreateChannel: () => void
    onChannelDeleted?: (deletedChannelId: string) => void
}

export default function ChannelTabs({
    channels,
    selectedChannel,
    onSelectChannel,
    onCreateChannel,
    onChannelDeleted,
}: ChannelTabsProps) {
    const tabsContainerRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)

    // Trier les canaux par nom
    const sortedChannels = [...channels].sort((a, b) =>
        a.name.localeCompare(b.name)
    )

    // Check scroll capabilities
    const updateScrollButtons = () => {
        if (tabsContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } =
                tabsContainerRef.current
            setCanScrollLeft(scrollLeft > 0)
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
        }
    }

    // Scroll functions
    const scrollLeft = () => {
        if (tabsContainerRef.current) {
            tabsContainerRef.current.scrollBy({
                left: -200,
                behavior: "smooth",
            })
        }
    }

    const scrollRight = () => {
        if (tabsContainerRef.current) {
            tabsContainerRef.current.scrollBy({ left: 200, behavior: "smooth" })
        }
    }

    // Update scroll buttons on mount and when channels change
    useEffect(() => {
        updateScrollButtons()

        const container = tabsContainerRef.current
        if (container) {
            container.addEventListener("scroll", updateScrollButtons)
            return () =>
                container.removeEventListener("scroll", updateScrollButtons)
        }
    }, [sortedChannels])

    // Handle window resize
    useEffect(() => {
        const handleResize = () => updateScrollButtons()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    // Faire défiler jusqu'au canal sélectionné
    useEffect(() => {
        if (selectedChannel && tabsContainerRef.current) {
            const selectedTab = tabsContainerRef.current.querySelector(
                `[data-channel-id="${selectedChannel.id}"]`
            ) as HTMLElement
            if (selectedTab) {
                const containerRect =
                    tabsContainerRef.current.getBoundingClientRect()
                const tabRect = selectedTab.getBoundingClientRect()

                if (
                    tabRect.left < containerRect.left ||
                    tabRect.right > containerRect.right
                ) {
                    selectedTab.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                        inline: "center",
                    })
                }
            }
        }
    }, [selectedChannel])

    return (
        <div className={styles.container}>
            {/* Left navigation button */}
            {canScrollLeft && (
                <div className={styles.navigationButtons}>
                    <button
                        className={styles.navButton}
                        onClick={scrollLeft}
                        aria-label="Faire défiler vers la gauche"
                    >
                        <ChevronLeft size={16} />
                    </button>
                </div>
            )}

            <div
                className={styles.tabsContainer}
                ref={tabsContainerRef}
                onScroll={updateScrollButtons}
            >
                {sortedChannels.map((channel) => (
                    <div
                        key={channel.id}
                        data-channel-id={channel.id}
                        className={`${styles.tab} ${
                            selectedChannel?.id === channel.id
                                ? styles.selected
                                : ""
                        }`}
                        onClick={() => onSelectChannel(channel)}
                    >
                        <div className={styles.tabIcon}>
                            {channel.isPublic ? (
                                <HashIcon size={16} />
                            ) : (
                                <Lock size={16} />
                            )}
                        </div>
                        <span className={styles.tabName}>{channel.name}</span>
                    </div>
                ))}
            </div>

            {/* Right navigation button */}
            {canScrollRight && (
                <div className={styles.navigationButtons}>
                    <button
                        className={styles.navButton}
                        onClick={scrollRight}
                        aria-label="Faire défiler vers la droite"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}

            <div className={styles.tabsAddWrapper}>
                <button className={styles.addTab} onClick={onCreateChannel}>
                    <Plus size={16} />
                </button>
            </div>
        </div>
    )
}
