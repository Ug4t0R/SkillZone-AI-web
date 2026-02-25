# SkillZone Reborn 🎮

Moderní, hi-tech redesign webu pro herní klub SkillZone. Tato aplikace je postavena na Reactu a využívá umělou inteligenci Google Gemini pro generování obsahu a interaktivního chatbota "Skillera".

## 🚀 Funkce

*   **Moderní UI/UX:** Cyberpunk/Hi-Tech design s Tailwind CSS.
*   **Interaktivní Mapa:** Taktický a satelitní pohled na pobočky.
*   **AI Chatbot (Skiller):** Integrovaný asistent poháněný Google Gemini API.
*   **CMS Funkce:** DevTools panel pro správu obsahu (historie, akce, pravidla) přímo v prohlížeči.
*   **Cloud Sync:** Integrace se Supabase pro persistenci dat.
*   **Live Feed:** Simulovaný (nebo AI generovaný) živý přenos dění v herně.

## 🛠️ Technologie

*   **Frontend:** React 19, TypeScript, Vite
*   **Styling:** Tailwind CSS
*   **Ikony:** Lucide React
*   **AI:** @google/genai (Gemini 2.5 Flash)
*   **Databáze:** Supabase

## 📦 Instalace a Spuštění

1.  **Instalace závislostí:**
    ```bash
    npm install
    ```

2.  **Spuštění:**
    ```bash
    npm run dev
    ```

## 🔧 Dev Tools (CMS)

Aplikace obsahuje vestavěný vývojářský panel pro správu obsahu bez nutnosti zasahovat do kódu.

1.  **Otevření:** Klikněte na malé červené tlačítko v pravém horním rohu webu (pod navigací).
2.  **Funkce:**
    *   **Database:** Synchronizace lokálních změn do cloudu (Supabase).
    *   **Neural:** Nastavení osobnosti AI Skillera (System Prompt).
    *   **Chats:** Historie konverzací s botem.
    *   **Boss:** Editace profilu majitele.
    *   **Locs/Events/Story:** Editor obsahu webu.

## ☁️ Backend (Supabase)

Pro plnou funkčnost persistencí dat je třeba:
1.  Založit projekt na [Supabase](https://supabase.com/).
2.  V DevMenu (záložka Database) vložit URL a Anon Key.
3.  Spustit SQL skript (dostupný v DevMenu) pro vytvoření tabulek.

---
*Vytvořeno s pomocí Google Gemini API.*