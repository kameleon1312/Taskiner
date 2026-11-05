import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskStore } from "../stores/useTaskStore";
import { useCategoryStore } from "../stores/useCategoryStore";
import { useUIStore } from "../stores/useUIStore";
import { tasksToICS, parseICS, shareOrDownloadICS } from "../utils/ical";
import { toast } from "../notifications/toastStore";
import { plural, toDateKey } from "../utils/dateUtils";

const LAST_EXPORT_KEY = "taskiner-ics-last-export";

/**
 * Two-way bridge with external calendars (Google, Apple, Outlook…):
 * export an .ics file with alarms matching Taskiner's reminders, or import
 * events from any .ics file as tasks.
 */
export default function CalendarSync({ compact = false }: { compact?: boolean }) {
  const tasks       = useTaskStore((s) => s.tasks);
  const addTask     = useTaskStore((s) => s.addTask);
  const updateFields = useTaskStore((s) => s.updateTaskFields);
  const categories  = useCategoryStore((s) => s.categories);
  const offsets     = useUIStore((s) => s.notifyOffsets);
  const allDayTime  = useUIStore((s) => s.allDayTime);
  const fileRef     = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(!compact);
  const [includeDone, setIncludeDone] = useState(false);
  const [lastExport, setLastExport] = useState(() => {
    try { return localStorage.getItem(LAST_EXPORT_KEY); } catch { return null; }
  });

  const exportable = tasks.filter((t) => t.deadline && (includeDone || !t.completed)).length;

  const handleExport = async () => {
    if (!exportable) {
      toast({ kind: "info", title: "Brak zadań z terminem", body: "Dodaj termin do zadania, aby pojawiło się w kalendarzu.", ttl: 3500 });
      return;
    }
    const ics = tasksToICS(tasks, { categories, alarmOffsets: offsets, allDayTime, includeCompleted: includeDone });
    const how = await shareOrDownloadICS(ics, `taskiner-${toDateKey(new Date())}.ics`);
    const stamp = new Date().toISOString();
    try { localStorage.setItem(LAST_EXPORT_KEY, stamp); } catch { /* */ }
    setLastExport(stamp);
    toast({
      kind: "success",
      title: how === "shared" ? "Wysłano do kalendarza" : "Pobrano plik kalendarza",
      body: `${exportable} ${plural(exportable, "wydarzenie", "wydarzenia", "wydarzeń")} z przypomnieniami. Otwórz plik, by dodać je do kalendarza.`,
      ttl: 5000,
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const events = parseICS(String(reader.result));
        let added = 0, updated = 0;
        for (const ev of events) {
          // Round-trip: an event exported by Taskiner updates its own task
          const own = ev.taskinerId ? tasks.find((t) => t.id === ev.taskinerId) : undefined;
          if (own) {
            if (own.deadline !== ev.deadline || own.text !== ev.text) {
              updateFields(own.id, { text: ev.text, deadline: ev.deadline });
              updated++;
            }
            continue;
          }
          const dup = tasks.some((t) => t.text === ev.text && t.deadline === ev.deadline);
          if (dup) continue;
          const id = addTask(ev.text, ev.deadline, ev.priority ?? "normal", null, ev.recurring ?? null);
          if (ev.notes) updateFields(id, { notes: ev.notes });
          added++;
        }
        toast({
          kind: added || updated ? "success" : "info",
          title: added || updated ? "Zsynchronizowano z kalendarzem" : "Nic nowego w pliku",
          body: `Dodano ${added}, zaktualizowano ${updated} z ${events.length} wydarzeń.`,
          ttl: 5000,
        });
      } catch {
        toast({ kind: "info", title: "Nie udało się odczytać pliku", body: "Upewnij się, że to plik .ics.", ttl: 4000 });
      }
    };
    reader.readAsText(file);
  };

  return (
    <section className={`cal-sync${compact ? " cal-sync--compact" : ""}`}>
      <button className="cal-sync__head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="cal-sync__icon" aria-hidden>⇄</span>
        <span className="cal-sync__titles">
          <span className="cal-sync__title">Synchronizacja z kalendarzem</span>
          <span className="cal-sync__sub">
            Google · Apple · Outlook
            {lastExport && ` · ostatnio ${new Date(lastExport).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}`}
          </span>
        </span>
        <motion.span className="cal-sync__chev" animate={{ rotate: open ? 180 : 0 }}>⌄</motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: "hidden" }}
          >
            <p className="cal-sync__desc">
              Eksport tworzy wydarzenia z przypomnieniami zgodnymi z Twoimi ustawieniami powiadomień.
              Import dodaje wydarzenia z pliku .ics jako zadania — ponowny import pliku z Taskinera aktualizuje istniejące zadania.
            </p>
            <label className="cal-sync__opt">
              <input type="checkbox" checked={includeDone} onChange={(e) => setIncludeDone(e.target.checked)} />
              <span>Dołącz ukończone</span>
            </label>
            <div className="cal-sync__actions">
              <button className="btn-primary" onClick={handleExport}>
                ⇪ Eksportuj ({exportable})
              </button>
              <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
                ⇩ Importuj .ics
              </button>
              <input ref={fileRef} type="file" accept=".ics,text/calendar" hidden onChange={handleImport} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
