"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";


export default function SignUpPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", profilePicture: "" });
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async(e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      toast.error("⚠️ All fields are required!");
      return;
    }

    if(form.password.length < 6){
      toast.error("⚠️ Password must be at least 6 characters long!");
      return;
    }
  
    try{
      // Here you would typically send 'form' data to your backend API
      const res=await fetch('http://localhost:3000/api/v1/user/register',{
        method:'POST',
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify({
          username:form.name,
          email:form.email,
          password:form.password,
          profilePicture:form.profilePicture
        })
      });
      const data=await res.json();
      if(res.status>=200 && res.status<300){
        toast.success("✅ Registration successful! Redirecting to Sign In...");

        setTimeout(() => {
          router.push('/Sign_in');
        }, 2000);
        setForm({ name: "", email: "", password: "", profilePicture: "" });
      }else{
        console.log(data);
       toast.error("⚠️Error: " + (data.message || "Registration Cancle"));

      }
    }catch(error){
      console.error("Registration error:", error);
      toast.error("⚠️Error: "+error.message);
    }
    
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0a0a14] via-[#0b0f1c] to-[#0a0a14] text-white overflow-hidden">
      {/* Auth card */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 10 }}
        transition={{ duration: 1 }}
        className="relative z-10 w-full max-w-md rounded-2xl bg-white/10 p-8 shadow-xl backdrop-blur-xl"
      >
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-center mb-2"
        >
          Begin Your Journey 🚀
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-gray-300 mb-6"
        >
          Create an account to start storytelling.
        </motion.p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <motion.input
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            type="text"
            name='name'
            required={true}
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your name"
            className="w-full rounded-xl bg-white/20 px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 hover:bg-white/30 hover:shadow-lg hover:shadow-indigo-500/30"
          />


          {/* Email */}
          <motion.input
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5}}
              type="email"
              name='email'
              required={true}
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full rounded-xl bg-white/20 px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 hover:bg-white/30 hover:shadow-lg hover:shadow-indigo-500/30"
            />

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="relative"
          >
            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              type={showPassword ? "text" : "password"}
              required={true}
              placeholder="Enter your password"
              className="w-full rounded-xl bg-white/20 px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 hover:bg-white/30 hover:shadow-lg hover:shadow-indigo-500/30"
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
          
          {/* Profile Picture Upload (Optional) */}
          <motion.input
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            type="text"
            name="profilePicture"
            placeholder="Enter the image URL"
            className="w-full rounded-xl bg-white/20 px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 hover:bg-white/30 hover:shadow-lg hover:shadow-indigo-500/30"
          />

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            type="submit"
            className="w-full rounded-xl bg-indigo-500 px-4 py-3 font-semibold hover:bg-indigo-600 transition"
          >
            Sign Up
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
