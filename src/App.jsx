import { useState, useEffect, useRef } from "react";
import "./App.css";

export default function App() {
  const [confirmed, setConfirmed] = useState([]);
  const [waiting, setWaiting] = useState([]);
  const [maxSeats, setMaxSeats] = useState(3);
  const [maxWaiting, setMaxWaiting] = useState(5);
  const [logs, setLogs] = useState([]);

  // Form states
  const [bookId, setBookId] = useState("");
  const [bookName, setBookName] = useState("");
  const [cancelId, setCancelId] = useState("");
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  // Custom Toast State
  const [toasts, setToasts] = useState([]);

  // Terminal Auto-Scroll Ref
  const terminalEndRef = useRef(null);

  // Fetch current system state from backend
  const fetchState = async () => {
    try {
      const res = await fetch("/api/passengers");
      if (res.ok) {
        const data = await res.json();
        setConfirmed(data.confirmed || []);
        setWaiting(data.waiting || []);
        setMaxSeats(data.maxSeats || 3);
        setMaxWaiting(data.maxWaiting || 5);
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to connect to backend:", err);
      addToast("error", "Cannot connect to server. Ensure backend is running!");
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Scroll to bottom of terminal whenever logs update
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Add a self-dismissing toast message
  const addToast = (type, text) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Helper to categorize log styles
  const getLogClass = (logText) => {
    if (!logText || typeof logText !== "string") return "";
    if (logText.includes("[LinkedList]")) return "ll";
    if (logText.includes("[Queue]")) return "queue";
    if (logText.includes("[System]")) return "system";
    if (logText.toLowerCase().includes("warning") || logText.toLowerCase().includes("error") || logText.toLowerCase().includes("reject")) {
      return "error";
    }
    return "";
  };

  // Extract log content without timestamp
  const parseLogContent = (logText) => {
    if (!logText || typeof logText !== "string") return "";
    const match = logText.match(/^\[\d{1,2}:\d{2}:\d{2}\s?(?:AM|PM)?\]\s(.*)/i);
    return match ? match[1] : logText;
  };

  // Extract log timestamp
  const parseLogTimestamp = (logText) => {
    if (!logText || typeof logText !== "string") return "--:--:--";
    const match = logText.match(/^\[(\d{1,2}:\d{2}:\d{2}\s?(?:AM|PM)?)\]/i);
    return match ? match[1] : "--:--:--";
  };

  // API Call: Book a Ticket
  const bookTicket = async () => {
    const idNum = parseInt(bookId);
    if (!bookId || isNaN(idNum) || idNum <= 0) {
      addToast("error", "Passenger ID must be a positive integer.");
      return;
    }
    if (!bookName.trim()) {
      addToast("error", "Passenger Name cannot be empty.");
      return;
    }

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idInput: bookId, name: bookName }),
      });

      const data = await res.json();
      if (res.ok) {
        setConfirmed(data.confirmed);
        setWaiting(data.waiting);
        setLogs(data.logs);
        
        if (data.status === "confirmed") {
          addToast("success", data.message);
        } else {
          addToast("info", data.message);
        }
        setBookId("");
        setBookName("");
      } else {
        addToast("error", data.error || "Booking failed.");
      }
    } catch (err) {
      console.error(err);
      addToast("error", "Server connection error during booking.");
    }
  };

  // API Call: Cancel a Ticket
  const cancelTicket = async () => {
    const idNum = parseInt(cancelId);
    if (!cancelId || isNaN(idNum) || idNum <= 0) {
      addToast("error", "Please enter a valid passenger ID.");
      return;
    }

    try {
      const res = await fetch("/api/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idInput: cancelId }),
      });

      const data = await res.json();
      if (res.ok) {
        setConfirmed(data.confirmed);
        setWaiting(data.waiting);
        setLogs(data.logs);
        addToast("success", data.message);
        setCancelId("");
        // Reset search result if it was the cancelled passenger
        if (searchResult && parseInt(searchResult.passenger?.id) === idNum) {
          setSearchResult(null);
        }
      } else {
        addToast("error", data.error || "Cancellation failed.");
      }
    } catch (err) {
      console.error(err);
      addToast("error", "Server connection error during cancellation.");
    }
  };

  // API Call: Search Passenger
  const searchPassenger = async () => {
    const idNum = parseInt(searchId);
    if (!searchId || isNaN(idNum) || idNum <= 0) {
      addToast("error", "Please enter a valid ID to search.");
      return;
    }

    try {
      const res = await fetch(`/api/search/${searchId}`);
      const data = await res.json();
      if (res.ok) {
        setSearchResult(data);
        setLogs(data.logs);
        if (data.found) {
          addToast("success", `Passenger found! Status: ${data.status.toUpperCase()}`);
        } else {
          addToast("error", "Passenger not found in database.");
        }
      } else {
        addToast("error", data.error || "Search operation failed.");
      }
    } catch (err) {
      console.error(err);
      addToast("error", "Server connection error during lookup.");
    }
  };

  // API Call: Reset System Database
  const resetSystem = async () => {
    if (!window.confirm("Are you sure you want to completely reset all seats and waitlists? This clears both LinkedList and Queue data structures.")) {
      return;
    }
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setConfirmed(data.confirmed);
        setWaiting(data.waiting);
        setLogs(data.logs);
        setSearchResult(null);
        addToast("success", "System data structures successfully reset!");
      } else {
        addToast("error", "Reset failed.");
      }
    } catch (err) {
      console.error(err);
      addToast("error", "Server connection error during system reset.");
    }
  };

  return (
    <div className="app">
      {/* Fizz Background Particles */}
      <div className="fizzy-bg">
        <span className="bubble"></span>
        <span className="bubble"></span>
        <span className="bubble"></span>
        <span className="bubble"></span>
        <span className="bubble"></span>
        <span className="bubble"></span>
        <span className="bubble"></span>
        <span className="bubble"></span>
        <span className="bubble"></span>
        <span className="bubble"></span>
      </div>

      {/* Floating Glassmorphic Toast Notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">
              {t.type === "success" && "✅"}
              {t.type === "error" && "⚠️"}
              {t.type === "info" && "ℹ️"}
            </span>
            <span className="toast-text">{t.text}</span>
          </div>
        ))}
      </div>

      {/* Glassmorphic Sticky Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="brand-badge">🚂</div>
            <div>
              <h1>Greenline Express</h1>
              <p className="subtitle">Full-Stack Railway Reservation (DSA)</p>
            </div>
          </div>
          
          {/* Dynamic Stats Indicators */}
          <div className="stats-bar">
            <div className="stat">
              <span className="stat-num">{confirmed.length}</span>
              <span className="stat-label">Confirmed</span>
            </div>
            <div className="stat-div" />
            <div className="stat">
              <span className="stat-num avail">{maxSeats - confirmed.length}</span>
              <span className="stat-label">Available</span>
            </div>
            <div className="stat-div" />
            <div className="stat">
              <span className="stat-num waiting">{waiting.length}</span>
              <span className="stat-label">Waiting</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main">
        
        {/* Seat Map Visualizer */}
        <section className="card">
          <div className="btn-reset-wrap">
            <button className="btn-reset" onClick={resetSystem}>
              🔄 Reset System
            </button>
          </div>
          <h2 className="card-title">
            <span className="card-title-icon">🪑</span> Train Seat Map
          </h2>
          
          <div className="seat-grid">
            {Array.from({ length: maxSeats }, (_, i) => {
              const seatNo = i + 1;
              const passenger = confirmed.find((p) => p.seatNo === seatNo);
              const taken = !!passenger;
              return (
                <div key={seatNo} className={`seat ${taken ? "seat-taken" : "seat-free"}`}>
                  <div className="seat-num">Seat {seatNo}</div>
                  {taken ? (
                    <>
                      <div className="seat-name">{passenger.name}</div>
                      <div className="seat-id">ID: {passenger.id}</div>
                    </>
                  ) : (
                    <div className="seat-avail">Available</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="seat-legend">
            <span>
              <span className="dot dot-free" /> Available
            </span>
            <span>
              <span className="dot dot-taken" /> Confirmed (Linked List Tail)
            </span>
            <span className="seat-info">
              Max Seats: <strong>{maxSeats}</strong> | Max Waiting Queue: <strong>{maxWaiting}</strong>
            </span>
          </div>
        </section>

        {/* Dashboard 2-Column Actions Panel */}
        <div className="two-col">
          
          {/* Action: Book Ticket */}
          <section className="card">
            <h2 className="card-title">
              <span className="card-title-icon">🎫</span> Book Reservation
            </h2>
            <div className="form-group">
              <label>Passenger Unique ID</label>
              <div className="input-container">
                <span className="input-icon">🔑</span>
                <input
                  type="number"
                  placeholder="e.g., 204"
                  value={bookId}
                  onChange={(e) => setBookId(e.target.value)}
                  min="1"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Passenger Full Name</label>
              <div className="input-container">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  placeholder="e.g., Safran Nasir"
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && bookTicket()}
                />
              </div>
            </div>
            <p className="hint">
              Allocates next seat sequentially (Linked List tail). If seats are full, pushes to FIFO Queue.
            </p>
            <button className="btn btn-primary" onClick={bookTicket}>
              Confirm & Book
            </button>
          </section>

          {/* Action: Cancel Ticket & Search List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Cancel Card */}
            <section className="card" style={{ flex: 1 }}>
              <h2 className="card-title">
                <span className="card-title-icon">❌</span> Cancel Ticket
              </h2>
              <div className="form-group">
                <label>Passenger ID to Cancel</label>
                <div className="input-container">
                  <span className="input-icon">🗑️</span>
                  <input
                    type="number"
                    placeholder="Enter ID to remove"
                    value={cancelId}
                    onChange={(e) => setCancelId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && cancelTicket()}
                    min="1"
                  />
                </div>
              </div>
              <p className="hint">
                Removes node from Linked List. Auto-promotes front of waiting Queue to the freed seat immediately.
              </p>
              <button className="btn btn-danger" onClick={cancelTicket}>
                Cancel Reservation
              </button>
            </section>

            {/* Search Passenger Card */}
            <section className="card" style={{ flex: 1 }}>
              <h2 className="card-title">
                <span className="card-title-icon">🔍</span> Search Passenger
              </h2>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Passenger ID</label>
                <div className="input-container">
                  <span className="input-icon">🕵️</span>
                  <input
                    type="number"
                    placeholder="Search by ID..."
                    value={searchId}
                    onChange={(e) => {
                      setSearchId(e.target.value);
                      setSearchResult(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && searchPassenger()}
                    min="1"
                  />
                </div>
              </div>
              <button className="btn btn-secondary" onClick={searchPassenger}>
                Start Search
              </button>

              {searchResult && (
                <div
                  className={`search-result ${
                    searchResult.found ? "result-found" : "result-error"
                  }`}
                >
                  {searchResult.found ? (
                    <>
                      <strong>
                        {searchResult.status === "confirmed"
                          ? "✅ CONFIRMED PASSENGER FOUND"
                          : "🕐 WAITING LIST PASSENGER FOUND"}
                      </strong>
                      <p>👤 <strong>Name:</strong> {searchResult.passenger.name}</p>
                      <p>🔑 <strong>ID:</strong> {searchResult.passenger.id}</p>
                      {searchResult.status === "confirmed" ? (
                        <p>🪑 <strong>Seat Assignment:</strong> Seat {searchResult.passenger.seatNo}</p>
                      ) : (
                        <p>⏳ <strong>Queue Position:</strong> Position #{searchResult.passenger.position}</p>
                      )}
                    </>
                  ) : (
                    <p>❌ {searchResult.message}</p>
                  )}
                </div>
              )}
            </section>

          </div>
        </div>

        {/* Dynamic Lists Panel: Confirmed (Linked List) vs Waiting (FIFO Queue Node Flow) */}
        <div className="two-col">
          
          {/* Confirmed Passenger List (Singly Linked List Display) */}
          <section className="card">
            <h2 className="card-title">
              <span className="card-title-icon">🔗</span> Confirmed Passengers
              <span className="badge">
                {confirmed.length}/{maxSeats}
              </span>
            </h2>
            {confirmed.length === 0 ? (
              <p className="empty-msg">No active confirmed tickets. Train is empty.</p>
            ) : (
              <div className="table-wrap">
                <table className="ptable">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Seat Pod</th>
                      <th>DSA Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {confirmed.map((p, idx) => (
                      <tr key={p.id}>
                        <td>{idx + 1}</td>
                        <td>{p.id}</td>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td>
                          <span className="seat-badge">Seat {p.seatNo}</span>
                        </td>
                        <td>
                          <span className="status-confirmed">Confirmed</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Waiting Queue Visual Node Flow (FIFO Queue Visual Representation) */}
          <section className="card">
            <h2 className="card-title">
              <span className="card-title-icon">📦</span> FIFO Waiting Queue
              <span className="badge">
                {waiting.length}/{maxWaiting}
              </span>
            </h2>
            {waiting.length === 0 ? (
              <p className="empty-msg">Waiting list is empty. There are no queued passengers.</p>
            ) : (
              <div className="queue-flow">
                {waiting.map((p, idx) => (
                  <div className="queue-node" key={p.id}>
                    <div className="queue-pos">#{idx + 1}</div>
                    <div className="queue-pinfo">
                      <span className="queue-pname">{p.name}</span>
                      <span className="queue-pid">Passenger ID: {p.id}</span>
                    </div>
                    <div className="queue-tag">
                      {idx === 0 ? "FRONT (Next)" : idx === waiting.length - 1 ? "REAR" : "QUEUED"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Retro DSA C++ Compilation / Console Simulator */}
        <section className="card terminal-console">
          <div className="terminal-header">
            <div className="terminal-title">
              <span className="terminal-indicator"></span> C++ Compiler Simulation & Data Structure Logs
            </div>
            <div className="terminal-buttons">
              <span className="terminal-dot close"></span>
              <span className="terminal-dot minimize"></span>
              <span className="terminal-dot maximize"></span>
            </div>
          </div>
          <div className="terminal-body">
            {logs.map((log, index) => (
              <div key={index} className={`terminal-line ${getLogClass(log)}`}>
                <span className="terminal-line-meta">[{parseLogTimestamp(log)}]</span>
                <span className="terminal-line-content">{parseLogContent(log)}</span>
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>
        </section>

        {/* DSA Concepts Classroom Insight */}
        <section className="card dsa-card">
          <h2 className="card-title" style={{ color: "var(--cola-amber)" }}>
            <span className="card-title-icon" style={{ color: "var(--cola-amber)" }}>📚</span> Academic DSA Lab Notes
          </h2>
          <div className="dsa-grid">
            <div className="dsa-item">
              <h3>🔗 Singly Linked List</h3>
              <p>
                Confirmed tickets represent nodes in a <code>Singly Linked List</code>. Booking performs <code>insertAtTail()</code> (runs in <code>O(N)</code> to traverse or <code>O(1)</code> if storing tail ref). Ticket cancellation traverses the list, unlinks the node, and frees allocated memory dynamically.
              </p>
            </div>
            <div className="dsa-item">
              <h3>📦 FIFO Queue (Waiting Queue)</h3>
              <p>
                When seats are full, passengers enter a <code>FIFO (First In First Out) Queue</code>. New passengers are added at the <code>rear</code>. When a seat becomes free due to cancellation, the passenger at the <code>front</code> is dequeued and promoted to confirmed status.
              </p>
            </div>
            <div className="dsa-item">
              <h3>🔍 Linear & FIFO Search</h3>
              <p>
                Passenger lookup uses <code>Linear Search</code>. The system traverses confirmed nodes sequentially from the <code>head</code>, then searches the queue from <code>front</code> to <code>rear</code> comparing passenger IDs. Average time complexity is <code>O(N)</code>.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer Branding */}
      <footer className="footer">
        <p>
          <span className="footer-highlight">Greenline Express Railway Reservation System</span> — A Full-Stack academic project built with React and Express.
        </p>
        <p style={{ marginTop: "0.4rem", opacity: 0.6 }}>
          Designed for Asjad Sajjad (0028) · Yasir Nasir (0078) · Safran (0052) | Department of Computer Science, Section A-2
        </p>
      </footer>
    </div>
  );
}
