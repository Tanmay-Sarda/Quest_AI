"use client";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Navbar({ params }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const routeParams = useParams();
  const searchParams = useSearchParams();
  const username = routeParams?.username || searchParams.get("username");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = async () => {
    

    try{
      const res=await fetch('http://localhost:3000/api/v1/user/logout',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':`Bearer ${localStorage.getItem('accessToken')}`
      }
    })
      
    const data=await res.json();
      if(res.status>=200 && res.status<300){
        toast.success("✅ Logout successful! Redirecting to Sign In...");
       
        setTimeout(() => {
          setIsLoggedIn(false);
          localStorage.removeItem("accessToken");
          router.push('/Sign_in');
        }, 2000);

      }else{
        console.log(data);
        toast.error("⚠️Error: "+data.message)
      }

    }catch(error){
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  return (
    <nav className="w-full fixed top-0 left-0 bg-black border-b border-purple-500/40 shadow-md shadow-purple-900/50 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div
          onClick={() => router.push("/")}
          className="text-2xl font-bold cursor-pointer hover:text-indigo-400 transition"
        >
          Quest-AI
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => {
              toast.info("Redirecting to About page...");
              router.push("/About");
            }}
            className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-lg px-5 py-2.5 text-center me-2 mb-2"
          >
            About Us
          </button>

          {!isLoggedIn ? (
            <>
              <button
                onClick={() => {
                  toast.info("Redirecting to Sign up page...");
                  router.push("/");
                }}
                className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-lg px-5 py-2.5 text-center me-2 mb-2"
              >
                Sign Up
              </button>
              <button
                onClick={() => {
                  toast.info("Redirecting to Sign in page...");
                  router.push("/Sign_in");
                }}
                className="text-white h-auto bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-lg px-5 py-2.5 text-center me-2 mb-2"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  toast.info("Redirecting to Story Creation page...");
                  router.push(`/Story_Form/${username}`);
                }}
                className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-lg px-5 py-2.5 text-center me-2 mb-2"
              >
                Create Story
              </button>
              <button
                onClick={handleLogout}
                className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-lg px-5 py-2.5 text-center me-2 mb-2"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="dark"
      />
    </nav>
  );
}
