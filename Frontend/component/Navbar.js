"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useParams } from "next/navigation";
export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const {username} = useParams();
  const [decodedUsername, setDecodedUsername] = useState("");


  useEffect(() => {
    // Check for accessToken and username in localStorage
    const token = localStorage.getItem("accessToken");
    setIsLoggedIn(!!token);
    if (username) {
      // Decode in case it contains special characters like %40
      setDecodedUsername(decodeURIComponent(username));
    }
  });

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("accessToken");
    setTimeout(() => {
      toast.info("Redirecting to Sign in page...");
    }, 0);
    router.push("/Sign_in");
  };

  return (
    <nav className="w-full fixed top-0 left-0 bg-black border-b border-purple-500/40 shadow-md shadow-purple-900/50 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Website Name */}
        <div
          onClick={() => router.push("/")}
          className="text-2xl font-bold cursor-pointer hover:text-indigo-400 transition"
        >
          Quest-AI
        </div>

        {/* Right Side Buttons */}
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
              {/* --- NEW HOME BUTTON ADDED HERE --- */}
              <button
                onClick={() => {
                  if (username) {
                    router.push(`/Home/${decodedUsername}`);
                  } else {
                    toast.error("Could not find user, please sign in again.");
                  }
                }}
                className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-lg px-5 py-2.5 text-center me-2 mb-2"
              >
                Home
              </button>
              {/* --- END OF NEW HOME BUTTON --- */}

              <button
                onClick={() => {
                  toast.info("Redirecting to Edit Profile page...");
                  router.push( `/EditProfile/${decodedUsername}`);
                }}
                className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-lg px-5 py-2.5 text-center me-2 mb-2"
              >
                Edit Profile
              </button>

              <button
                onClick={() => {
                  toast.info("Redirecting to Story Creation page...");
                  router.push( `/Story_Form/${decodedUsername}`);
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
      {/* Toast notifications */}
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
