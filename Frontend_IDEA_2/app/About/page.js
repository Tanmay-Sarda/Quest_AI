"use client";

export default function AboutPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full py-24 px-2 box-border bg-black text-gray-200">
      {/* Outer Terminal Frame */}
      <div
        className="terminal-border max-w-[95%] w-full sm:w-4/5 lg:w-2/3 rounded-2xl shadow-lg overflow-hidden"
        style={{ border: "1px solid #00ff99" }}
      >
        <div className="terminal-content p-8 sm:p-10 bg-[#0a0a0a] rounded-2xl">
          {/* Title */}
          <h2 className="terminal-title text-3xl font-bold text-center mb-6 bg-gradient-to-r from-[#00ffcc] to-[#00ffaa] bg-clip-text text-transparent">
            ABOUT QUEST-AI
          </h2>

          {/* Description */}
          <p className="text-center mb-8 text-gray-300 leading-relaxed">
            Welcome to our interactive storytelling app — a place where you set
            the stage, step into a character, and watch entire worlds unfold
            dynamically.
          </p>

          {/* Two Cards */}
          <div className="flex flex-col gap-6">
            {/* Card 1 */}
            <div
              className="terminal-border p-5 sm:p-6 rounded-xl bg-[#111] hover:shadow-[0_0_20px_#8ce5c2ff] hover:scale-103 transition-all duration-300"
              style={{ border: "1px solid #00ff99" }}
            >
              <h3 className="terminal-title text-xl font-semibold mb-3 text-[#00ff99]">
                Why We Built This
              </h3>
              <p className="text-gray-300">
                &gt; We wanted a faster, more playful way to jump into RPG
                campaigns and fanfiction without the time-consuming setup.
              </p>
            </div>

            {/* Card 2 */}
            <div
              className="terminal-border p-5 sm:p-6 rounded-xl bg-[#111] hover:shadow-[0_0_20px_#8ce5c2ff] hover:scale-103 transition-all duration-300"
              style={{ border: "1px solid #00ffaa" }}
            >
              <h3 className="terminal-title text-xl font-semibold mb-3 text-[#00ffaa]">
                The AI Twist
              </h3>
              <p className="text-gray-300">
                &gt; By leaning into AI's sporadic nature, stories become
                unpredictable. You don't just play along — you discover and
                shape surprising narratives.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}