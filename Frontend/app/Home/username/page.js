"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export default function HomePage() {
  const [completedStories, setcompletedStories] = useState([]);
  const [ongoingStories, setongoingStories] = useState([]);

  // Reusable empty state card
  const EmptyState = ({ message, gradientFrom, gradientTo, textColor }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className={`flex flex-col items-center justify-center p-8 rounded-2xl bg-gradient-to-b from-[${gradientFrom}] to-[${gradientTo}] border border-[#2a2a40] shadow-lg max-w-md w-full`}
    >
      <p className={`text-xl font-semibold ${textColor} text-center`}>
        {message}
      </p>
      <span className="text-gray-400 text-sm mt-2 text-center">
        Start creating your first story to see it here!
      </span>
    </motion.div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 space-y-20 mt-10">
      {/* Completed Stories */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, amount: 0.3 }}
      >
        <h2 className="text-3xl font-bold mb-6 text-blue-400 text-center">
          Completed User Stories
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 w-full">
          {completedStories.length === 0 && (
            <div className="col-span-full flex justify-center">
              <EmptyState
                message="No completed stories yet"
                gradientFrom="#1a1a2e"
                gradientTo="#0f0f1a"
                textColor="text-blue-400"
              />
            </div>
          )}
          {completedStories.length !== 0 &&
            completedStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.7 }}
                viewport={{ once: true, amount: 0.4 }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0px 0px 20px rgba(59,130,246,0.4)",
                }}
                className="p-6 rounded-2xl bg-gradient-to-b from-[#141422] to-[#0f0f1a] border border-[#1e1e2f] cursor-pointer"
              >
                <h3 className="text-xl font-semibold mb-2 text-blue-300">
                  {story.title}
                </h3>
                <p className="text-gray-400 text-sm mb-3">{story.description}</p>
                <span className="text-sm text-gray-500 italic">
                  You play as:{" "}
                  <span className="text-gray-300">{story.character}</span>
                </span>
              </motion.div>
            ))}
        </div>
      </motion.div>

      {/* Ongoing Stories */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, amount: 0.3 }}
      >
        <h2 className="text-3xl font-bold mb-6 text-purple-400 text-center">
          Ongoing User Stories
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 w-full">
          {ongoingStories.length === 0 && (
            <div className="col-span-full flex justify-center">
              <EmptyState
                message="No ongoing stories yet"
                gradientFrom="#241432"
                gradientTo="#0f0f1a"
                textColor="text-purple-400"
              />
            </div>
          )}
          {ongoingStories.length !== 0 &&
            ongoingStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.7 }}
                viewport={{ once: true, amount: 0.4 }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0px 0px 20px rgba(168,85,247,0.4)",
                }}
                className="p-6 rounded-2xl bg-gradient-to-b from-[#141422] to-[#0f0f1a] border border-[#1e1e2f] cursor-pointer"
              >
                <h3 className="text-xl font-semibold mb-2 text-purple-300">
                  {story.title}
                </h3>
                <p className="text-gray-400 text-sm mb-3">{story.description}</p>
                <span className="text-sm text-gray-500 italic">
                  You play as:{" "}
                  <span className="text-gray-300">{story.character}</span>
                </span>
              </motion.div>
            ))}
        </div>
      </motion.div>
    </div>
  );
}
