"use client";
import React from 'react'
import EditProfile from '@/component/EditProfile'
import { useParams } from 'next/navigation'
const page = () => {

  const {username} = useParams();
  return (
    <div>
        <EditProfile  username={username}/>
    </div>
  )
}

export default page
