"use client"

import React from 'react'
import { useAppContext } from "@/context/AppContext"
import HomeAdmin from '@/components/admin/HomeAdmin'

function page() {
  const { currentUser } = useAppContext()
  return (
    <HomeAdmin user={currentUser} />
  )
}

export default page