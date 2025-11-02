"use client";
import { useEffect } from 'react';
import React from 'react'
import EditProfile from '@/component/EditProfile'
import { useParams,useRouter } from 'next/navigation'
const page = () => {
  const router=useRouter();

  useEffect(() => {
   if(!sessionStorage.getItem("accessToken")){
      showToast("User not authenticated");
      setTimeout(() => {router.push('/Sign_in')}, 2000);
      return;
     }
  },[] )

  const {username} = useParams();
  return (
    <div>
        <EditProfile  username={username}/>
    </div>
  )
}

export default page
