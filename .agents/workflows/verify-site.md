---
description: Complete site verification checklist — run this before every deployment or after major changes
---

# Full Site Verification Workflow

// turbo-all

## Prerequisites
1. Make sure the dev server is running (`npm run dev` in the project root)
2. Identify the correct port (usually 1336 or 5173)

## Step 1: Build Check
Run `npm run build` and confirm exit code 0 with no TypeScript errors.

## Step 2: Homepage & Navigation
Open the site in the browser and verify:
- [ ] Homepage loads with hero, stats, and CTA
- [ ] "Pobočky & Mapa" loads with interactive map
- [ ] "Story" loads with timeline
- [ ] "Ceník" loads with pricing tables
- [ ] "Spolupráce" loads with B2B section
- [ ] "CHCI PŘIJÍT" / booking page loads with mission cards

## Step 3: Language Switcher
- [ ] Click language flag in navbar — dropdown opens with all 8 flags (🇨🇿🇸🇰🇬🇧🇩🇪🇵🇱🇷🇺🇺🇦🇻🇳)
- [ ] Switch to EN — all text changes to English
- [ ] Switch back to CS

## Step 4: Mini-Games (CRITICAL — previously missed!)
- [ ] Click "🎯 AIM CHALLENGE" button → game menu appears (NOT black screen)
- [ ] Click START → countdown 3-2-1-GO → targets appear and are clickable
- [ ] Close game with X button
- [ ] Click "⚡ REACTION" button → reaction game loads
- [ ] Play one round → results screen shows
- [ ] Close game

## Step 5: Theme & Mode Toggles
- [ ] Toggle dark/light mode — site switches themes
- [ ] Toggle 🧠 Gen Z mode — text changes to brainrot style
- [ ] Toggle 🏢 Corporate mode — text changes to formal style
- [ ] Disable both modes

## Step 6: DevMenu
- [ ] Click Terminal icon → DevMenu opens
- [ ] Switch through ALL tabs: Dashboard, Content, Feed, Analytics, Neural (Brain), Rivals
- [ ] Verify language selector in DevMenu sidebar shows flags
- [ ] Close DevMenu

## Step 7: Coming Soon Page (if enabled)
- [ ] Navigate to /coming-soon
- [ ] Verify branch cards, voucher promo (no asterisk), profile QR code
- [ ] Test VIP code input in footer

## Step 8: Footer & Misc
- [ ] Scroll to footer — all links work
- [ ] Check Skiller chatbot opens
- [ ] Check weather widget (bottom-right)

## Step 9: Console Audit
- [ ] Open browser console
- [ ] Navigate through ALL pages from steps 2-7
- [ ] Report any JavaScript errors (ignore minor CORS/GTM warnings)

## Step 10: Mobile Responsiveness
- [ ] Resize browser to mobile width (~375px)
- [ ] Verify hamburger menu works
- [ ] Verify mobile language flag selector
- [ ] Verify mini-games work on small screen
