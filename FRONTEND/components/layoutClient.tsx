'use client'

import { usePathname } from 'next/navigation'
import Menu from "@/components/Menu"

export default function MenuWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isAuthPage = pathname === '/login' || pathname === '/signup'

    if (isAuthPage) {
        return <>{children}</>
    }

    return <Menu>{children}</Menu>
}