"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {useRouter} from 'next/navigation';
export default function SignInPage() {
  const [form, setform] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
 const router=useRouter();
  const handleSubmit = async(e) => {
    e.preventDefault();

    try {
      const res=await fetch('http://localhost:3000/api/v1/user/login',{
        method:'POST',
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify({
          email:form.email,
          password:form.password
        }),
        // credentials:'include' // Include cookies in the request
      });
      const data=await res.json();
      if(res.status>=200 && res.status<300){
        //set accessToken in localStorage
        console.log("Access Token:", data.data.user.accessToken);
        localStorage.setItem('accessToken', data.data.user.accessToken);
        
        //Toast success message
        toast.success("✅ Sign in successful! Redirecting to Home...");

        setTimeout(() => {
          router.push(`/Home`);
        }, 2000);
        setform({ email: "", password: "" });
      }else{
        toast.error("⚠️ "+(data.message || 'Sign in failed'));
      }

    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("⚠️Error: "+error.message);
    }
  };

  const handleChange = (e) => {
    setform({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0a0a14] via-[#0b0f1c] to-[#0a0a14] text-white overflow-hidden">
      {/* auth card */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: -10 }}
        transition={{ duration: 1 }}
        className="relative z-10 w-full max-w-md rounded-2xl bg-white/10 p-8 shadow-xl backdrop-blur-xl"
      >
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-center justify-center mb-2 flex gap-3 items-center"
        >
          <img
            className="invert-100 h-[50px] w-[100px]"
            src="/welcome.png"
            alt=""
          />
          Welcome Back
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-gray-300 mb-6"
        >
          Continue your story by signing in.
        </motion.p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <motion.input
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-xl bg-white/20 px-4 py-3 text-white placeholder-gray-300 focus:outline-none transition-all duration-300 hover:bg-white/30 hover:shadow-lg hover:shadow-indigo-500/30"
          />

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="relative"
          >
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full rounded-xl bg-white/20 px-4 py-3 text-white placeholder-gray-300 focus:outline-none transition-all duration-300 hover:bg-white/30 hover:shadow-lg hover:shadow-indigo-500/30"
            />
            {form.password.length !== 0 && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 text-sm text-gray-300"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            )}
          </motion.div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            type="submit"
            className="w-full rounded-xl bg-indigo-500 px-4 py-3 font-semibold hover:bg-indigo-600 transition"
          >
            Sign In
          </motion.button>
        </form>
      </motion.div>

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
    </div>
  );
}
