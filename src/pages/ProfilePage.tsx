import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "../stores/useUIStore";

const AVATAR_OPTIONS = [
  "🙂","😎","🧑‍💻","🧑‍🎨","🧑‍🏫","🦊","🐱","🦁",
  "🐯","🐻","🐼","🐸","🦋","🌟","🔥","⚡",
  "🎯","🚀","🎸","🌿","☕","🎨","🏆","💎",
];

// Crop + resize to 160×160 JPEG to keep localStorage footprint small
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const SIZE = 160;
        const canvas = document.createElement("canvas");
        canvas.width  = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext("2d")!;
        // Center-crop to square
        const side = Math.min(img.width, img.height);
        const sx   = (img.width  - side) / 2;
        const sy   = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const isPhoto = (v: string) => v.startsWith("data:");

export default function ProfilePage() {
  const navigate = useNavigate();
  const { userName, userAvatar, setUserName, setUserAvatar } = useUIStore();

  const [name,        setName]        = useState(userName);
  const [avatar,      setAvatar]      = useState(userAvatar);
  const [saved,       setSaved]       = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setUserName(name.trim());
    setUserAvatar(avatar);
    setSaved(true);
    setTimeout(() => navigate("/tasks"), 900);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setUploading(true);
    setUploadError(false);
    try {
      const dataUrl = await compressImage(file);
      setAvatar(dataUrl);
    } catch {
      setUploadError(true);
    } finally {
      setUploading(false);
      // reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="app">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
      >
        {/* Header */}
        <div className="profile-page__header">
          <motion.button
            className="profile-page__back"
            onClick={() => navigate("/tasks")}
            whileTap={{ scale: 0.88 }}
            aria-label="Wróć"
          >
            ←
          </motion.button>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Profil</h1>
        </div>

        {/* Avatar preview */}
        <motion.div
          className="profile-page__preview"
          animate={saved ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          <div className="profile-page__big-avatar">
            {isPhoto(avatar) ? (
              <img src={avatar} alt="Avatar" className="profile-page__avatar-photo" />
            ) : (
              avatar
            )}
          </div>
          <p className="profile-page__preview-name">
            {name.trim() || "Brak nazwy"}
          </p>
          {name.trim() && (
            <p className="profile-page__preview-sub">Witaj z powrotem! 👋</p>
          )}
        </motion.div>

        {/* Name input */}
        <div className="profile-page__section">
          <label className="profile-page__label">Imię lub pseudonim</label>
          <input
            className="profile-page__input"
            type="text"
            placeholder="np. Marek"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            maxLength={24}
            autoFocus
          />
          {name.length > 0 && (
            <span className="profile-page__char-count">{name.length}/24</span>
          )}
        </div>

        {/* Photo upload */}
        <div className="profile-page__section">
          <label className="profile-page__label">Zdjęcie z galerii</label>
          <motion.label
            className={`profile-upload-btn${uploading ? " loading" : ""}${isPhoto(avatar) ? " has-photo" : ""}`}
            whileTap={{ scale: 0.97 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            {uploading
              ? "⏳ Przetwarzanie…"
              : isPhoto(avatar)
              ? "📷 Zmień zdjęcie"
              : "📷 Dodaj zdjęcie"}
          </motion.label>
          {uploadError && (
            <p className="profile-upload-error">
              Nie udało się wczytać zdjęcia. Spróbuj inny plik.
            </p>
          )}
          {isPhoto(avatar) && !uploadError && (
            <button
              className="profile-upload-clear"
              onClick={() => setAvatar("🙂")}
              type="button"
            >
              Usuń zdjęcie
            </button>
          )}
        </div>

        {/* Emoji avatar picker */}
        <div className="profile-page__section">
          <label className="profile-page__label">Lub wybierz emoji</label>
          <div className="profile-avatar-grid">
            {AVATAR_OPTIONS.map((av) => (
              <motion.button
                key={av}
                className={`profile-avatar-btn${avatar === av ? " profile-avatar-btn--active" : ""}`}
                onClick={() => setAvatar(av)}
                whileTap={{ scale: 0.88 }}
                type="button"
                aria-label={`Avatar: ${av}`}
                aria-pressed={avatar === av}
              >
                {av}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Save */}
        <motion.button
          className="profile-page__save"
          onClick={handleSave}
          whileTap={{ scale: 0.96 }}
          type="button"
          disabled={saved || uploading}
        >
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.span
                key="saved"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                ✓ Zapisano — powrót…
              </motion.span>
            ) : (
              <motion.span
                key="save"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Zapisz profil
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>
    </div>
  );
}
