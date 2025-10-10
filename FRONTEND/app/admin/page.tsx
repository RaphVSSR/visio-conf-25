"use client"

import React from 'react'
import HomeAdmin from "@/components/admin/HomeAdmin"
import { useAppContext } from "@/context/AppContext"

function page() {
  const { currentUser } = useAppContext()
  return (
    <HomeAdmin user={currentUser} />
  )
}

export default page