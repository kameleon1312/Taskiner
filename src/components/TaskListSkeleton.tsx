import { motion } from "framer-motion";

interface Props {
  count?: number;
}

export default function TaskListSkeleton({ count = 4 }: Props) {
  return (
    <motion.ul
      className="task-list task-skeleton"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.li
          key={i}
          className="task-skeleton__item"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.055, duration: 0.22 }}
        >
          {/* Checkbox placeholder */}
          <div className="task-skeleton__circle" />

          {/* Content placeholder */}
          <div className="task-skeleton__content">
            <div
              className="task-skeleton__line task-skeleton__line--title"
              style={{ width: `${58 + (i % 3) * 12}%` }}
            />
            {i % 2 === 0 && (
              <div className="task-skeleton__line task-skeleton__line--meta" />
            )}
          </div>

          {/* Action placeholder */}
          <div className="task-skeleton__action" />
        </motion.li>
      ))}
    </motion.ul>
  );
}
