# 🚂 Railway Reservation System

A full web-based Railway Reservation Management System built with **React.js** (Vite), translating a C++ DSA project into an interactive website.

**DSA Project by:**
- Asjad Sajjad (0028)
- Yasir Nasir (0078)
- Safran (0052)
- Section A-2

---

## Features

| Feature | Description |
|---------|-------------|
| 🎫 Book Ticket | Assigns the next available seat (Seats 1–3). If full, adds to Waiting List |
| ❌ Cancel Ticket | Removes passenger by ID; auto-promotes first Waiting passenger to freed seat |
| 🔍 Search Passenger | Finds passenger in Confirmed or Waiting list by ID |
| 🪑 Seat Map | Visual real-time map showing which seats are free or taken |
| ✅ Confirmed List | Table of all confirmed passengers with seat numbers |
| 🕐 Waiting List | Queue showing passengers waiting for a seat |

## DSA Concepts Used

- **Singly Linked List** → Confirmed passengers (book/cancel = insert/delete nodes)
- **Queue (FIFO)** → Waiting passengers (enqueue on full, dequeue on cancellation)
- **Linear Search** → Passenger lookup by ID

## Configuration

In `src/App.jsx`:
```js
const MAX_SEATS = 3;    // Maximum seats on the train
const MAX_WAITING = 5;  // Maximum waiting list size
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Build for Production

```bash
npm run build
```
