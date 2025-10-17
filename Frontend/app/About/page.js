"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">
      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-4xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mt-10"
      >
        About Our App
      </motion.h1>

      {/* Intro paragraph */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, amount: 0.5 }}
        className="text-lg leading-relaxed text-gray-300 text-center"
      >
        Welcome to our interactive storytelling app — a place where you set the
        stage, step into a character, and watch entire worlds unfold
        dynamically. No need for endless preparation or writing marathons — just
        pure, spontaneous adventures powered by AI.
      </motion.p>

      {/* Cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.4 }}
          whileHover={{
            scale: 1.05,
            boxShadow: "0px 0px 20px rgba(59,130,246,0.5)",
          }}
          className="p-6 rounded-2xl bg-gradient-to-b from-[#141422] to-[#0f0f1a] border border-[#1e1e2f] cursor-pointer"
        >
          <h2 className="text-xl font-semibold mb-3 text-blue-400">
            Why We Built This
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Fanfiction, RPG campaigns, and D&D sessions are amazing but can also
            be time-consuming and sometimes feel a little rigid. We wanted to
            create a faster, more playful way to jump into those same
            experiences — without losing the spark of creativity.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          viewport={{ once: true, amount: 0.4 }}
          whileHover={{
            scale: 1.05,
            boxShadow: "0px 0px 20px rgba(168,85,247,0.5)",
          }}
          className="p-6 rounded-2xl bg-gradient-to-b from-[#141422] to-[#0f0f1a] border border-[#1e1e2f] cursor-pointer"
        >
          <h2 className="text-xl font-semibold mb-3 text-purple-400">
            The AI Twist
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            By leaning into AI’s sporadic nature, stories become unpredictable
            and exciting. You don’t just play along — you discover, adapt, and
            shape narratives that surprise even you.
          </p>
        </motion.div>
      </div>

      {/* Future section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        viewport={{ once: true, amount: 0.4 }}
        whileHover={{
          scale: 1.02,
          boxShadow: "0px 0px 25px rgba(236,72,153,0.4)",
        }}
        className="p-6 rounded-2xl bg-gradient-to-b from-[#141422] to-[#0f0f1a] border border-[#1e1e2f] cursor-pointer"
      >
        <h2 className="text-xl font-semibold mb-3 text-pink-400">
          What’s Coming Next
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          We’re working on multiplayer modes, deeper character creation, and
          tools that make every playthrough unique. Whether you’re a fanfic
          writer, a roleplayer, or a D&D enthusiast, you’ll find our app a fun
          and refreshing way to tell stories with friends — or just for
          yourself.
        </p>
      </motion.div>

      <ToastContainer />
    </div>
  );
}
