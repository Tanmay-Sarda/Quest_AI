"use client";

export default function AboutPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full py-24 px-4">
      {/* Outer Terminal Frame */}
      <div
        className="terminal-border w-full max-w-[95%] sm:w-4/5 lg:w-2/5 xl:px-48 rounded-2xl shadow-lg overflow-hidden"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div
          className="terminal-content p-8 sm:p-10"
          style={{ backgroundColor: "var(--terminal-bg)" }}
        >
          {/* Title */}
          <h2
            className="terminal-title text-4xl font-bold text-center mb-6 sm:text-4xl text-3xl"
            style={{ color: "var(--user-color)" }}
          >
            ABOUT QUEST-AI
          </h2>

          {/* Description */}
          <p
            className="text-center mb-8 leading-relaxed sm:text-xl text-lg px-1"
            style={{ color: "var(--text-color)", opacity: 0.8 }}
          >
            Welcome to the collaborative dreaming engine. Here, you don't just
            read the story—you hack the narrative. Set your parameters,
            initialize your character, and watch a new reality compile itself in
            real-time.
          </p>

          {/* Cards */}
          <div className="flex flex-col gap-6">
            {/* Card 1: Origin */}
            <div
              className="terminal-border p-5 sm:p-6 rounded-xl 
                hover:shadow-[0_0_20px_#8ce5c2ff]
                hover:scale-[1.03]
                transition-all duration-300"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
              }}
            >
              <h3
                className="terminal-title text-2xl sm:text-2xl text-xl font-semibold mb-3"
                style={{ color: "var(--user-color)" }}
              >
                Why We Built This
              </h3>

              <p
                className="sm:text-lg text-base"
                style={{ color: "var(--text-color)", opacity: 0.8 }}
              >
                &gt; <strong>Death to the Blank Page.</strong> Traditional
                Tabletop RPGs and fanfiction often suffer from "setup fatigue."
                We built Quest-AI to be a frictionless storytelling forge—drop
                in a genre, pick a persona, and let the engine handle the heavy
                lifting of world-building instantly.
              </p>
            </div>

            {/* Card 2: The AI */}
            <div
              className="terminal-border p-5 sm:p-6 rounded-xl
                hover:shadow-[0_0_20px_#8ce5c2ff]
                hover:scale-[1.03]
                transition-all duration-300"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
              }}
            >
              <h3
                className="terminal-title text-2xl sm:text-2xl text-xl font-semibold mb-3"
                style={{ color: "var(--user-color)" }}
              >
                The AI Twist
              </h3>

              <p
                className="sm:text-lg text-base"
                style={{ color: "var(--text-color)", opacity: 0.8 }}
              >
                &gt; <strong>The Dungeon Master is Alive.</strong> We don't use
                rigid scripts. By leaning into the chaotic creativity of LLMs,
                we ensure no two sessions are identical. The AI acts as an
                improvisational partner that reacts to your wildest choices. Try
                to break the game; the narrative will just adapt.
              </p>
            </div>

            {/* Card 3: Multiplayer */}
            <div
              className="terminal-border p-5 sm:p-6 rounded-xl
                hover:shadow-[0_0_20px_#8ce5c2ff]
                hover:scale-[1.03]
                transition-all duration-300"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
              }}
            >
              <h3
                className="terminal-title text-2xl sm:text-2xl text-xl font-semibold mb-3"
                style={{ color: "var(--user-color)" }}
              >
                Multiplayer Protocols
              </h3>

              <p
                className="sm:text-lg text-base"
                style={{ color: "var(--text-color)", opacity: 0.8 }}
              >
                &gt; <strong>Shared Hallucinations.</strong> A hero’s journey is
                lonely; a party’s journey is legendary. We’ve expanded the core
                to support real-time multiplayer synchronization. Invite friends
                to your lobby and co-author the chaos. The AI tracks dynamics
                between players for complex party banter.
              </p>
            </div>

            {/* Card 4: BYOK */}
            <div
              className="terminal-border p-5 sm:p-6 rounded-xl
                hover:shadow-[0_0_20px_#8ce5c2ff]
                hover:scale-[1.03]
                transition-all duration-300"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
              }}
            >
              <h3
                className="terminal-title text-2xl sm:text-2xl text-xl font-semibold mb-3"
                style={{ color: "var(--user-color)" }}
              >
                The BYOK Model
              </h3>

              <div
                className="sm:text-lg text-base"
                style={{ color: "var(--text-color)", opacity: 0.8 }}
              >
                <p className="mb-2">
                  &gt; <strong>Your Key, Your Universe.</strong> Quest-AI
                  operates on a "Bring Your Own Key" architecture for total
                  transparency:
                </p>
                <ul className="list-none pl-2 space-y-1">
                  <li>
                    &gt; <strong>Control:</strong> Connect your own API key
                    (OpenAI, Anthropic, etc).
                  </li>
                  <li>
                    &gt; <strong>Economy:</strong> Pay the provider directly for
                    usage.
                  </li>
                  <li>
                    &gt; <strong>Privacy:</strong> The connection is yours. We
                    provide the interface.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* System Footer */}
          <div
            className="mt-12 text-center text-xs sm:text-sm font-mono tracking-widest animate-pulse"
            style={{ color: "var(--text-color)", opacity: 0.6 }}
          >
            &gt; SYSTEM READY. AWAITING INPUT...
          </div>
        </div>
      </div>
    </div>
  );
}