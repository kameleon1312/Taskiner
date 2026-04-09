import { useMemo } from "react";
import { motion } from "framer-motion";
import { useTaskStore } from "../stores/useTaskStore";

const QUOTES = [
  { text: "Wielkie rzeczy składają się z małych kroków.",             author: "Lao Tzu"           },
  { text: "Nie czekaj na idealny moment. Działaj teraz.",             author: "Napoleon Hill"      },
  { text: "Dyscyplina to most między celami a osiągnięciami.",        author: "Jim Rohn"           },
  { text: "Zacznij od tego co możliwe — odkryjesz niemożliwe.",       author: "Francis z Asyżu"   },
  { text: "Skupienie to klucz do wszystkiego co wielkie.",            author: "Anonymous"          },
  { text: "Twój czas jest ograniczony. Nie trać go cudzym życiem.",   author: "Steve Jobs"         },
  { text: "Małe kroki każdego dnia prowadzą do wielkich zmian.",      author: "Anonymous"          },
  { text: "Produktywność to robienie właściwych rzeczy, nie wszystkich.", author: "Tim Ferriss"   },
  { text: "Jeden wykonany krok wart jest tysiąca planów.",            author: "Przysłowie"         },
  { text: "Im lepiej zaczniesz dzień, tym lepszy będzie wieczór.",    author: "Anonymous"          },
  { text: "Energia podąża za uwagą. Kieruj ją mądrze.",              author: "Anonymous"          },
  { text: "Sukces to suma małych wysiłków powtarzanych każdego dnia.", author: "Robert Collier"   },
  { text: "Nie musisz być świetny, żeby zacząć. Musisz zacząć, żeby być świetny.", author: "Zig Ziglar" },
  { text: "Każdy dzień to nowa szansa, żeby zmienić swoje życie.",    author: "Anonymous"          },
];

const DAY_OF_WEEK = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
const GREETINGS   = [
  "Dobry poranek",
  "Dzień dobry",
  "Cześć",
  "Dobry wieczór",
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 10) return GREETINGS[0];
  if (h < 14) return GREETINGS[1];
  if (h < 18) return GREETINGS[2];
  return GREETINGS[3];
}

interface Props {
  onClose: () => void;
}

export default function MorningRitual({ onClose }: Props) {
  const tasks = useTaskStore((s) => s.tasks);

  const active    = tasks.filter((t) => !t.completed).length;
  const today     = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const quote     = QUOTES[dayOfYear % QUOTES.length];

  const dateStr = today.toLocaleDateString("pl-PL", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
  });

  const greeting = getGreeting();

  const dateFormatted = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return (
    <motion.div
      className="morning"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.45 }}
    >
      {/* Ambient glows */}
      <div className="morning__glow morning__glow--top"    aria-hidden="true" />
      <div className="morning__glow morning__glow--bottom" aria-hidden="true" />

      {/* Sun */}
      <motion.div
        className="morning__sun"
        animate={{
          scale:   [1, 1.08, 1],
          opacity: [0.85, 1, 0.85],
          rotate:  [0, 8, -4, 0],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        ☀️
      </motion.div>

      {/* Greeting */}
      <motion.h2
        className="morning__greeting"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {greeting}!
      </motion.h2>

      <motion.p
        className="morning__date"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18 }}
      >
        {dateFormatted}
      </motion.p>

      {/* Quote card */}
      <motion.div
        className="morning__quote"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.28 }}
      >
        <p className="morning__quote-text">„{quote.text}"</p>
        <p className="morning__quote-author">— {quote.author}</p>
      </motion.div>

      {/* Active tasks stat */}
      {active > 0 && (
        <motion.div
          className="morning__tasks-pill"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.4, type: "spring", stiffness: 400, damping: 28 }}
        >
          <span className="morning__tasks-icon">📋</span>
          <span>
            {active} {active === 1 ? "zadanie czeka" : active < 5 ? "zadania czekają" : "zadań czeka"}
          </span>
        </motion.div>
      )}

      {active === 0 && (
        <motion.div
          className="morning__tasks-pill morning__tasks-pill--clear"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.4 }}
        >
          <span className="morning__tasks-icon">✅</span>
          <span>Wszystko ukończone!</span>
        </motion.div>
      )}

      {/* CTA */}
      <motion.button
        className="morning__cta"
        onClick={onClose}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.52, type: "spring", stiffness: 380, damping: 30 }}
      >
        Zacznij dzień 🚀
      </motion.button>
    </motion.div>
  );
}
