"use client";

export default function AboutPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full py-24 px-4">
      {/* Outer Terminal Frame */}
      <div
        className="terminal-border w-full max-w-[95%] sm:w-4/5 lg:w-2/3 rounded-2xl shadow-lg overflow-hidden"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="terminal-content p-8 sm:p-10" style={{ backgroundColor: "var(--terminal-bg)" }}>
          {/* Title */}
          <h2
            className="terminal-title text-3xl font-bold text-center mb-6 sm:text-3xl text-2xl"
            style={{ color: "var(--user-color)" }}
          >
            ABOUT QUEST-AI
          </h2>

          {/* Description */}
          <p className="text-center mb-8 leading-relaxed sm:text-lg text-base px-1" style={{ color: "var(--text-color)", opacity: 0.8 }}>
            Welcome to our interactive storytelling app — a place where you set
            the stage, step into a character, and watch entire worlds unfold
            dynamically.
          </p>

          {/* Cards */}
          <div className="flex flex-col gap-6">
            {/* Card 1 */}
            <div
              className="terminal-border p-5 sm:p-6 rounded-xl 
                hover:shadow-[0_0_20px_#8ce5c2ff]
                hover:scale-[1.03]
                transition-all duration-300"
                style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}
            >
              <h3 className="terminal-title text-xl sm:text-xl text-lg font-semibold mb-3" style={{ color: "var(--user-color)" }}>
                Why We Built This
              </h3>

              <p className="sm:text-base text-sm" style={{ color: "var(--text-color)", opacity: 0.8 }}>
                &gt; We wanted a faster, more playful way to jump into RPG
                campaigns and fanfiction without the time-consuming setup.
              </p>
            </div>

            {/* Card 2 */}
            <div
              className="terminal-border p-5 sm:p-6 rounded-xl
                hover:shadow-[0_0_20px_#8ce5c2ff]
                hover:scale-[1.03]
                transition-all duration-300"
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}
            >
              <h3 className="terminal-title text-xl sm:text-xl text-lg font-semibold mb-3" style={{ color: "var(--user-color)" }}>
                The AI Twist
              </h3>

              <p className="sm:text-base text-sm" style={{ color: "var(--text-color)", opacity: 0.8 }}>
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
