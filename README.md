# 🧾 SmartSplit — Smart Receipt Bill Splitter

Split bills fairly with proportional GST/tax allocation, tip calculation, and one-tap UPI payments. No more equal splits when your items aren't equal.

---

## The Problem

Apps like GPay split bills **equally** — everyone pays the same. But real bills aren't equal:
- You ordered the expensive main course, your friend had just a coffee
- GST/tax gets ignored or split blindly
- Someone ends up subsidising everyone else

**SmartSplit** scans your receipt, lets you assign each item to the right people, and calculates exactly what each person owes — including proportional GST, tip, and direct UPI payment links.

---

## Features

### Core
- **OCR Receipt Scanning** — upload a photo and Tesseract.js extracts text right in your browser (no server, no API keys)
- **Manual Entry** — skip scanning and enter items by hand
- **Multi-Receipt Support** — add multiple receipts to one split; per-receipt and combined totals
- **Editable Items Table** — fix OCR mistakes, add/remove items, edit prices inline
- **Proportional GST** — each person's GST share = (their subtotal / bill subtotal) × total GST; last person absorbs rounding so totals always add up
- **Accurate Totals** — all amounts rounded to 2 decimal places; rounding remainder absorbed so `sum == grand total` exactly
- **100% Client-Side** — nothing leaves your device

### UPI Payments (NEW)
- **4 App Deep Links per payment** — GPay, PhonePe, Paytm, and generic UPI buttons open the native payment app directly on mobile
- **QR Code fallback** — toggle a scannable QR code on any payment (useful on desktop)
- **UPI ID Autocomplete** — type `@` in any UPI field to see a filtered dropdown of 14 common handles (`@okaxis`, `@ybl`, `@paytm`, etc.)
- **Mobile Number as UPI ID** — toggle to mobile number mode; enter a 10-digit number and the app auto-generates `{number}@upi` with live validation
- **Persistent UPI IDs** — UPI IDs are saved to `localStorage` by friend name and auto-populated next time the same name is added

### Tip Calculator (NEW)
- Add a tip in **₹ or %** with quick-select buttons for 5%, 10%, 15%, 20%
- Three **fairness modes**:
  - **Equal** — everyone pays the same tip amount
  - **Proportional** — tip is split based on each person's item subtotal
  - **Progressive** — big spenders tip more; formula: `(subtotal^1.5 / Σsubtotals^1.5) × total_tip`
- **Live preview** shows each person's tip share as you change the mode or amount
- Tip is included in each person's final total and breakdown

### "I Didn't Eat That" Mode (NEW)
- **Assignment Mode toggle** in the Assign Items step:
  - **"I had this"** (default) — tap names to add them to an item
  - **"I didn't have this"** — everyone starts assigned; tap a name to mark them as skipped (shown with a red ✗)
- Shows a count: "3 of 4 people splitting this item"
- Mode is remembered in `localStorage`

### Settlement Optimizer (NEW)
- **Who paid the bill?** dropdown in the Add Friends step — one person is the bill payer; everyone else owes them
- **Minimum Transactions** section in the summary — greedy algorithm reduces the number of payments needed
- Arrow visualization: `Rahul → ₹450 → Priya`
- Each settlement card has:
  - GPay / PhonePe / Paytm / Other UPI payment buttons
  - WhatsApp share button with pre-filled message
  - "Mark as Paid" toggle (saved to `localStorage`, cleared on New Split)
- Comparison text: "Optimized from N → M transactions — saved Z payments!"

### Sharing
- **Per-person WhatsApp share** — pre-filled message with itemised breakdown, GST, tip, and total
- **Full group WhatsApp share** — everyone's breakdown in one message
- **Copy Summary** — copies the full breakdown to clipboard

---

## How It Works

1. **Upload** — drag-and-drop or tap to select a receipt image, or enter items manually
2. **Review Items** — fix OCR mistakes; set GST as a fixed amount or % (5/12/18/28% slabs available)
3. **Add Friends** — add names with optional UPI IDs; select who paid the bill
4. **Assign Items** — choose "I had this" or "I didn't have this" mode; set tip amount and fairness mode
5. **Summary** — per-person breakdown with GST share, tip share, UPI payment buttons, and QR codes
6. **Settle Up** — optimised payment plan showing minimum transactions needed

### Key Formulas

```
# Proportional GST
person_gst = (person_subtotal / total_subtotal) × total_GST

# Proportional tip
person_tip = (person_subtotal / total_subtotal) × total_tip

# Progressive tip
person_tip = (person_subtotal^1.5 / Σ all_subtotals^1.5) × total_tip

# Grand total per person
person_total = person_subtotal + person_gst + person_tip
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| UI framework | React 19 + Vite |
| Styling | Tailwind CSS v3 |
| OCR | Tesseract.js (browser-based) |
| QR Codes | qrcode.react |
| State | React useState (no Redux) |
| Persistence | localStorage (UPI IDs, mode, settled payments) |
| Runtime | Browser only — no backend |

---

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Project Structure

```
src/
├── components/
│   ├── Stepper.jsx          # 5-step progress bar
│   ├── ReceiptUpload.jsx    # Drag-drop + Tesseract OCR
│   ├── ReceiptsManager.jsx  # Multi-receipt manager
│   ├── ItemsTable.jsx       # Editable items + GST input
│   ├── FriendManager.jsx    # Add/remove friends, UPI IDs, bill payer
│   ├── ItemAssignment.jsx   # Per-item assignment + tip calculator
│   ├── SplitSummary.jsx     # Final breakdown, UPI buttons, settlement optimizer
│   └── LicensePage.jsx      # In-app license viewer
├── utils/
│   └── parseReceipt.js      # OCR text parser + split calculator (items, GST, tip)
├── App.jsx                  # Root component, state management
└── main.jsx
```

---

## UPI Deep Link Formats

| App | Scheme |
|-----|--------|
| GPay | `tez://upi/pay?pa=…&pn=…&am=…&cu=INR&tn=SmartSplit` |
| PhonePe | `phonepe://pay?pa=…&pn=…&am=…&cu=INR` |
| Paytm | `paytmmp://pay?pa=…&pn=…&am=…&cu=INR` |
| Generic UPI | `upi://pay?pa=…&pn=…&am=…&cu=INR&tn=SmartSplit+Bill+Share` |

QR codes contain the generic `upi://` link — scan from any UPI app.

---

## Roadmap

- [ ] **Mobile app** via Capacitor (iOS + Android)
- [ ] **Better OCR** — integrate Google Vision or Apple Live Text on mobile
- [ ] **Split history** — save past bills locally with browse/search
- [ ] **Multi-currency** support
- [ ] **Share link** — generate a link friends can open to see their total
- [ ] **Multiple bill payers** — handle cases where multiple people paid different parts

---

## License

This project is licensed under the **PolyForm Noncommercial License 1.0.0**.

You may use, modify, and distribute this software for **noncommercial purposes only** — including personal use, research, education, and use by nonprofit/government organisations. Commercial use of any kind is not permitted without explicit written permission from the author.

Full license text: [LICENSE](./LICENSE)
Canonical URL: https://polyformproject.org/licenses/noncommercial/1.0.0
