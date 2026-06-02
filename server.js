import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static assets from production React build
app.use(express.static(path.join(__dirname, "dist")));

const MAX_SEATS = 3;
const MAX_WAITING = 5;

// Global buffer for DSA compiler/execution logs
let dsaLogs = [
  "[System] Initializing Railway Reservation System...",
  "[LinkedList] Created empty Confirmed Passengers list (head = nullptr).",
  "[Queue] Created empty Waiting Queue (front = nullptr, rear = nullptr).",
];

const addLog = (text) => {
  const timestamp = new Date().toLocaleTimeString();
  dsaLogs.push(`[${timestamp}] ${text}`);
  if (dsaLogs.length > 50) {
    dsaLogs.shift();
  }
};

// ==========================================
// DATA STRUCTURES (C++ DSA Simulation)
// ==========================================

// Singly Linked List Node
class Node {
  constructor(id, name, seatNo) {
    this.id = id;
    this.name = name;
    this.seatNo = seatNo;
    this.next = null;
  }
}

// Singly Linked List for Confirmed Passengers
class LinkedList {
  constructor() {
    this.head = null;
    this.size = 0;
  }

  insert(id, name, seatNo) {
    const newNode = new Node(id, name, seatNo);
    if (!this.head) {
      this.head = newNode;
      addLog(`[LinkedList] Head node created. ID: ${id}, Name: "${name}", Seat: ${seatNo}`);
    } else {
      let current = this.head;
      let steps = 1;
      while (current.next) {
        current = current.next;
        steps++;
      }
      current.next = newNode;
      addLog(`[LinkedList] Traversed ${steps} node(s). Appended ID: ${id}, Name: "${name}", Seat: ${seatNo} at the tail.`);
    }
    this.size++;
  }

  remove(id) {
    if (!this.head) {
      addLog(`[LinkedList] Warning: Attempted removal on empty list.`);
      return null;
    }

    if (this.head.id === id) {
      const removed = this.head;
      this.head = this.head.next;
      this.size--;
      addLog(`[LinkedList] Removed head node. ID: ${id}, Name: "${removed.name}", Seat: ${removed.seatNo} freed.`);
      return removed;
    }

    let current = this.head;
    let prev = null;
    let steps = 1;
    while (current && current.id !== id) {
      prev = current;
      current = current.next;
      steps++;
    }

    if (current) {
      prev.next = current.next;
      this.size--;
      addLog(`[LinkedList] Traversed ${steps} nodes. Found and unlinked ID: ${id}, Name: "${current.name}", Seat: ${current.seatNo} freed.`);
      return current;
    }

    addLog(`[LinkedList] Traversed entire list (${steps} nodes). Passenger ID: ${id} not found.`);
    return null;
  }

  find(id) {
    let current = this.head;
    let steps = 0;
    while (current) {
      steps++;
      if (current.id === id) {
        addLog(`[LinkedList] Linear search: ID ${id} found after ${steps} steps.`);
        return current;
      }
      current = current.next;
    }
    addLog(`[LinkedList] Linear search: ID ${id} NOT found after traversing ${steps} nodes.`);
    return null;
  }

  toArray() {
    const arr = [];
    let current = this.head;
    while (current) {
      arr.push({ id: current.id, name: current.name, seatNo: current.seatNo });
      current = current.next;
    }
    return arr;
  }
}

// Queue Node
class QueueNode {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.next = null;
  }
}

// FIFO Queue for Waiting List
class Queue {
  constructor() {
    this.front = null;
    this.rear = null;
    this.size = 0;
  }

  enqueue(id, name) {
    const newNode = new QueueNode(id, name);
    if (!this.rear) {
      this.front = this.rear = newNode;
      addLog(`[Queue] Queue empty. Enqueued at Front & Rear. ID: ${id}, Name: "${name}"`);
    } else {
      this.rear.next = newNode;
      this.rear = newNode;
      addLog(`[Queue] Enqueued at Rear. ID: ${id}, Name: "${name}" (Position: ${this.size + 1})`);
    }
    this.size++;
  }

  dequeue() {
    if (!this.front) {
      addLog(`[Queue] Warning: Attempted dequeue on empty waiting list.`);
      return null;
    }
    const temp = this.front;
    this.front = this.front.next;
    if (!this.front) {
      this.rear = null;
    }
    this.size--;
    addLog(`[Queue] Dequeued from Front. ID: ${temp.id}, Name: "${temp.name}" promoted.`);
    return temp;
  }

  find(id) {
    let current = this.front;
    let steps = 0;
    while (current) {
      steps++;
      if (current.id === id) {
        addLog(`[Queue] Search: ID ${id} found in waiting list at position ${steps}.`);
        return { passenger: current, position: steps };
      }
      current = current.next;
    }
    return null;
  }

  toArray() {
    const arr = [];
    let current = this.front;
    while (current) {
      arr.push({ id: current.id, name: current.name });
      current = current.next;
    }
    return arr;
  }
}

// ==========================================
// APP STATE INITIALIZATION
// ==========================================
const confirmedList = new LinkedList();
const waitingQueue = new Queue();

// Load some mock starting data to showcase system aesthetics
confirmedList.insert(101, "Yasir Nasir", 1);
confirmedList.insert(102, "Safran Khan", 2);
addLog("[System] Preloaded demo passenger logs for interactive dashboard visualization.");

// Helper function to check if ID exists
const idExists = (id) => {
  return confirmedList.toArray().some((p) => p.id === id) || 
         waitingQueue.toArray().some((p) => p.id === id);
};

// Helper function to find next available seat sequentially (1 to MAX_SEATS)
const getFreeSeat = () => {
  const takenSeats = confirmedList.toArray().map((p) => p.seatNo);
  for (let i = 1; i <= MAX_SEATS; i++) {
    if (!takenSeats.includes(i)) return i;
  }
  return -1;
};

// ==========================================
// REST API ENDPOINTS
// ==========================================

// Get system state & logs
app.get("/api/passengers", (req, res) => {
  res.json({
    confirmed: confirmedList.toArray(),
    waiting: waitingQueue.toArray(),
    maxSeats: MAX_SEATS,
    maxWaiting: MAX_WAITING,
    logs: dsaLogs,
  });
});

// Book a ticket
app.post("/api/book", (req, res) => {
  const { idInput, name } = req.body;
  const id = parseInt(idInput);

  if (isNaN(id) || id <= 0) {
    addLog(`[System] Rejected booking: Invalid ID format.`);
    return res.status(400).json({ error: "Passenger ID must be a positive integer." });
  }
  if (!name || !name.trim()) {
    addLog(`[System] Rejected booking: Empty passenger name.`);
    return res.status(400).json({ error: "Passenger Name cannot be empty." });
  }
  if (idExists(id)) {
    addLog(`[System] Rejected booking: ID ${id} already exists.`);
    return res.status(400).json({ error: `Passenger ID ${id} is already in the system.` });
  }

  // Check if seats are available
  if (confirmedList.size < MAX_SEATS) {
    const seatNo = getFreeSeat();
    if (seatNo === -1) {
      addLog(`[System] Internal error: Seats reported free but no seat number found.`);
      return res.status(500).json({ error: "No free seats found." });
    }
    confirmedList.insert(id, name.trim(), seatNo);
    return res.json({
      status: "confirmed",
      message: `Ticket Confirmed! Seat ${seatNo} allocated to ${name.trim()}`,
      confirmed: confirmedList.toArray(),
      waiting: waitingQueue.toArray(),
      logs: dsaLogs,
    });
  } 
  
  // Confirmed seats full, try waiting queue
  if (waitingQueue.size < MAX_WAITING) {
    waitingQueue.enqueue(id, name.trim());
    return res.json({
      status: "waiting",
      message: `Seats Full! ${name.trim()} added to the Waiting List.`,
      confirmed: confirmedList.toArray(),
      waiting: waitingQueue.toArray(),
      logs: dsaLogs,
    });
  }

  // Waiting queue is full
  addLog(`[System] Rejected booking: Confirm seats and waiting queue are full.`);
  return res.status(400).json({ error: "Train reservation and waiting lists are completely full!" });
});

// Cancel a ticket by ID
app.post("/api/cancel", (req, res) => {
  const { idInput } = req.body;
  const id = parseInt(idInput);

  if (isNaN(id) || id <= 0) {
    addLog(`[System] Rejected cancellation: Invalid ID format.`);
    return res.status(400).json({ error: "Please enter a valid passenger ID." });
  }

  // Check confirmed list first
  const cancelledPassenger = confirmedList.remove(id);

  if (cancelledPassenger) {
    const freedSeat = cancelledPassenger.seatNo;
    let promotionMessage = "";

    // Promote the first passenger from waiting queue (FIFO)
    if (waitingQueue.size > 0) {
      const promoted = waitingQueue.dequeue();
      confirmedList.insert(promoted.id, promoted.name, freedSeat);
      promotionMessage = ` ${promoted.name} promoted from Waiting List to Seat ${freedSeat}.`;
      addLog(`[System] Promotion: ${promoted.name} (ID: ${promoted.id}) moved into Seat ${freedSeat}.`);
    }

    return res.json({
      success: true,
      message: `Successfully cancelled ticket for ${cancelledPassenger.name} (Seat ${freedSeat}).${promotionMessage}`,
      confirmed: confirmedList.toArray(),
      waiting: waitingQueue.toArray(),
      logs: dsaLogs,
    });
  }

  // If not in confirmed list, check if they are in the waiting queue
  const waitingSearch = waitingQueue.find(id);
  if (waitingSearch) {
    // Custom queue element removal (helper)
    const originalWaiting = waitingQueue.toArray();
    const updatedWaiting = originalWaiting.filter((p) => p.id !== id);
    
    // Re-initialize queue and refill
    waitingQueue.front = null;
    waitingQueue.rear = null;
    waitingQueue.size = 0;
    updatedWaiting.forEach((p) => waitingQueue.enqueue(p.id, p.name));

    addLog(`[Queue] Removed passenger ID: ${id} directly from Waiting List.`);
    return res.json({
      success: true,
      message: `Successfully removed ID ${id} from Waiting List.`,
      confirmed: confirmedList.toArray(),
      waiting: waitingQueue.toArray(),
      logs: dsaLogs,
    });
  }

  addLog(`[System] Cancellation failed: ID ${id} not found in system.`);
  return res.status(404).json({ error: `Passenger ID ${id} not found in Confirmed or Waiting list.` });
});

// Search passenger details
app.get("/api/search/:id", (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: "Please enter a valid passenger ID." });
  }

  // Search confirmed list (Linear Search)
  const confirmedPassenger = confirmedList.find(id);
  if (confirmedPassenger) {
    return res.json({
      found: true,
      status: "confirmed",
      passenger: {
        id: confirmedPassenger.id,
        name: confirmedPassenger.name,
        seatNo: confirmedPassenger.seatNo,
      },
      logs: dsaLogs,
    });
  }

  // Search waiting list (Linear Search)
  const waitingPassengerSearch = waitingQueue.find(id);
  if (waitingPassengerSearch) {
    return res.json({
      found: true,
      status: "waiting",
      passenger: {
        id: waitingPassengerSearch.passenger.id,
        name: waitingPassengerSearch.passenger.name,
        position: waitingPassengerSearch.position,
      },
      logs: dsaLogs,
    });
  }

  return res.json({
    found: false,
    status: "notfound",
    message: `Passenger ID ${id} could not be found in the system.`,
    logs: dsaLogs,
  });
});

// Reset entire database
app.post("/api/reset", (req, res) => {
  confirmedList.head = null;
  confirmedList.size = 0;
  waitingQueue.front = null;
  waitingQueue.rear = null;
  waitingQueue.size = 0;
  dsaLogs = [
    "[System] System database reset by administrator.",
    "[LinkedList] Re-initialized Confirmed Passengers list (head = nullptr).",
    "[Queue] Re-initialized Waiting Queue (front = nullptr, rear = nullptr).",
  ];
  addLog("[System] System is ready for a fresh round of DSA simulation.");
  res.json({
    confirmed: [],
    waiting: [],
    logs: dsaLogs,
    message: "System data structures successfully reset."
  });
});

// Catch-all middleware to serve the built index.html for React SPA
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Launch Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  addLog(`[System] Server successfully started on port ${PORT}. Listening for REST requests...`);
});
