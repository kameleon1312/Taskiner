import { motion } from "framer-motion";
import "../styles/splash.scss";

const CHARS = ["T", "A", "S", "K", "I", "N", "E", "R"];

export default function SplashScreen() {
  return (
    <motion.div
      className="splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Ambient glows */}
      <div className="splash__glow splash__glow--top" />
      <div className="splash__glow splash__glow--bottom" />

      {/* SVG "T" signature */}
      <div className="splash__svg-wrap">
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="splash__svg"
        >
          <defs>
            <linearGradient id="tGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <filter id="tGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Horizontal bar of T */}
          <motion.path
            d="M 12,38 L 108,38"
            stroke="url(#tGrad)"
            strokeWidth="9"
            strokeLinecap="round"
            filter="url(#tGlow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { duration: 0.55, delay: 0.2, ease: "easeInOut" },
              opacity: { duration: 0.01, delay: 0.2 },
            }}
          />

          {/* Vertical bar of T */}
          <motion.path
            d="M 60,38 L 60,106"
            stroke="url(#tGrad)"
            strokeWidth="9"
            strokeLinecap="round"
            filter="url(#tGlow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { duration: 0.5, delay: 0.75, ease: "easeInOut" },
              opacity: { duration: 0.01, delay: 0.75 },
            }}
          />
        </svg>

        {/* Glow burst after drawing completes */}
        <motion.div
          className="splash__burst"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.6, 0], opacity: [0, 0.45, 0] }}
          transition={{ duration: 0.7, delay: 1.26, ease: "easeOut" }}
        />
      </div>

      {/* Wordmark — staggered characters */}
      <div className="splash__wordmark">
        {CHARS.map((ch, i) => (
          <motion.span
            key={i}
            className="splash__char"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1.32 + i * 0.048, ease: "easeOut" }}
          >
            {ch}
          </motion.span>
        ))}
        <motion.span
          className="splash__tm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.65 }}
          transition={{ duration: 0.3, delay: 1.75 }}
        >
          ™
        </motion.span>
      </div>

      {/* Tagline */}
      <motion.p
        className="splash__tagline"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 1.9 }}
      >
        Organize smarter. Work cleaner.
      </motion.p>

      {/* Pulsing dots */}
      <motion.div
        className="splash__dots"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 2.15 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="splash__dot"
            animate={{ scale: [1, 1.55, 1], opacity: [0.35, 1, 0.35] }}
            transition={{
              duration: 0.9,
              delay: i * 0.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
