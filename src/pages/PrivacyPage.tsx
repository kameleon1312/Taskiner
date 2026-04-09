import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function PrivacyPage() {
  return (
    <div className="app">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="privacy-header">
          <Link to="/settings" aria-label="Wróć">←</Link>
          <h1 className="page-title" style={{ margin: 0 }}>Polityka prywatności</h1>
        </div>

        <p className="privacy-meta">Ostatnia aktualizacja: 8 kwietnia 2026 r.</p>

        <section className="privacy-section">
          <h2>1. Informacje ogólne</h2>
          <p>
            Taskiner to aplikacja do zarządzania zadaniami działająca w całości lokalnie
            na Twoim urządzeniu. Nie posiadamy serwerów, kont użytkowników ani żadnej
            infrastruktury chmurowej. Twoje dane nigdy nie opuszczają Twojego urządzenia.
          </p>
        </section>

        <section className="privacy-section">
          <h2>2. Jakie dane przechowujemy</h2>
          <p>Wszystkie dane są zapisywane wyłącznie w pamięci lokalnej przeglądarki (localStorage):</p>
          <ul>
            <li>Zadania, podzadania, notatki i terminy</li>
            <li>Nawyki i historia ich wykonania</li>
            <li>Sesje fokus i statystyki aktywności</li>
            <li>Kategorie, ustawienia motywu i preferencje powiadomień</li>
            <li>Nazwa użytkownika i zdjęcie profilowe (przechowywane lokalnie jako Base64)</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>3. Czego NIE robimy</h2>
          <ul>
            <li>Nie zbieramy żadnych danych osobowych</li>
            <li>Nie wysyłamy żadnych danych na zewnętrzne serwery</li>
            <li>Nie używamy plików cookie do śledzenia</li>
            <li>Nie udostępniamy danych stronom trzecim</li>
            <li>Nie wymagamy zakładania konta</li>
            <li>Nie wyświetlamy reklam</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>4. Powiadomienia</h2>
          <p>
            Jeśli wyrazisz zgodę na powiadomienia, aplikacja korzysta z API przeglądarki
            (Service Worker Notifications) wyłącznie do wysyłania przypomnień o terminach
            zadań i serii aktywności. Zgoda jest opcjonalna i możesz ją wycofać w dowolnym
            momencie w ustawieniach systemu lub w ustawieniach aplikacji.
          </p>
        </section>

        <section className="privacy-section">
          <h2>5. Pliki cache i Service Worker</h2>
          <p>
            Aplikacja używa Service Workera do działania offline. Pliki cache zawierają
            wyłącznie kod aplikacji (JavaScript, CSS, ikony) — nie zawierają danych użytkownika.
          </p>
        </section>

        <section className="privacy-section">
          <h2>6. Zdjęcie profilowe</h2>
          <p>
            Jeśli dodasz własne zdjęcie profilowe, jest ono kompresowane i przechowywane
            wyłącznie lokalnie na Twoim urządzeniu w formacie Base64. Zdjęcie nie jest
            przesyłane nigdzie poza urządzeniem.
          </p>
        </section>

        <section className="privacy-section">
          <h2>7. Eksport i import danych</h2>
          <p>
            Funkcja eksportu tworzy plik JSON na Twoim urządzeniu zawierający Twoje zadania.
            Plik pozostaje w pełni pod Twoją kontrolą — aplikacja nie ma do niego dostępu
            po zapisaniu.
          </p>
        </section>

        <section className="privacy-section">
          <h2>8. Usuwanie danych</h2>
          <p>Wszystkie dane możesz usunąć w dowolnym momencie przez:</p>
          <ul>
            <li>Ustawienia przeglądarki → Wyczyść dane witryny</li>
            <li>Na Androidzie: Ustawienia → Aplikacje → Taskiner → Wyczyść dane</li>
            <li>Odinstalowanie aplikacji usuwa wszystkie dane trwale</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>9. Dzieci</h2>
          <p>
            Aplikacja nie jest skierowana do dzieci poniżej 13 roku życia i nie zbiera
            świadomie żadnych informacji od dzieci.
          </p>
        </section>

        <section className="privacy-section">
          <h2>10. Kontakt</h2>
          <p>
            W przypadku pytań dotyczących prywatności skontaktuj się z twórcą aplikacji:
            <br />
            <strong>Szymon Pochopień</strong>
          </p>
        </section>
      </motion.div>
    </div>
  );
}
