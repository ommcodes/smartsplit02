# 🧾 SmartSplit — Smart Receipt Bill Splitter

Split bills fairly with proportional GST/tax allocation. No more equal splits when your items aren't equal.

![Screenshot placeholder](./public/screenshot-placeholder.png)

---

## The Problem

Apps like GPay split bills **equally** — everyone pays the same. But real bills aren't equal:
- You ordered the expensive main course, your friend had just a coffee
- GST/tax gets ignored or split blindly
- Someone ends up subsidising everyone else

**SmartSplit** scans your receipt, lets you assign each item to the right people, and calculates exactly what each person owes — including a **proportional share of GST**.

---

## Features

- **OCR Receipt Scanning** — upload a photo and Tesseract.js extracts text right in your browser (no server, no API keys)
- **Editable Items Table** — fix OCR mistakes, add/remove items, edit prices
- **Friend Management** — add friends with coloured chips; min. 2 to split
- **Per-Item Assignment** — tap who shared each item; shared items are split equally among assignees
- **Proportional GST** — each person's GST share = (their subtotal / bill subtotal) × total GST
- **Accurate Totals** — rounding handled so individual totals always sum to the grand total
- **Copy Summary** — one-tap copy to share the breakdown via WhatsApp/message
- **100% Client-Side** — nothing leaves your device

---

## Tech Stack

| Layer | Tech |
|-------|------|
| UI framework | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| OCR | Tesseract.js (browser-based) |
| State | React useState (no Redux) |
| Runtime | Browser only — no backend |

---

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## How It Works

1. **Upload** — drag-and-drop or tap to select a receipt image (JPG/PNG)
2. **Scan** — Tesseract.js runs OCR in your browser; regex parser extracts item names, prices, and GST
3. **Review Items** — fix any OCR mistakes in an editable table; adjust the GST amount
4. **Add Friends** — type names, add as many people as you need
5. **Assign Items** — for each item, tap which friends shared it
6. **Summary** — each person's card shows their items, proportional GST, and final total

### Proportional GST Formula

```
person_gst = (person_subtotal / total_items_subtotal) × total_GST
```

The last person absorbs any rounding remainder so that `sum(all gst shares) == total_GST` exactly.

---

## Project Structure

```
src/
├── components/
│   ├── Stepper.jsx        # 5-step progress bar
│   ├── ReceiptUpload.jsx  # Drag-drop + Tesseract OCR
│   ├── ItemsTable.jsx     # Editable items + GST
│   ├── FriendManager.jsx  # Add/remove friends
│   ├── ItemAssignment.jsx # Per-item assignment UI
│   └── SplitSummary.jsx   # Final breakdown cards
├── utils/
│   └── parseReceipt.js    # OCR text parser + split calculator
├── App.jsx                # Root component, state management
└── main.jsx
```

---

## Roadmap

- [ ] **Mobile app** via Capacitor (iOS + Android)
- [ ] **Better OCR** — integrate Google Vision or Apple Live Text on mobile
- [ ] **UPI deep links** — tap to pay your share directly via GPay/PhonePe
- [ ] **Split history** — save past bills locally
- [ ] **Multi-currency** support
- [ ] **Share link** — generate a link friends can open to see their total

---

## License

MIT
