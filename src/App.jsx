import { useState } from "react";
import "./App.css";

const MAX_SEATS = 3;
const MAX_WAITING = 5;

export default function App() {
  const [confirmed, setConfirmed] = useState([]);
  const [waiting, setWaiting] = useState([]);
  const [seatTaken, setSeatTaken] = useState(Array(MAX_SEATS + 1).fill(false));

  const [bookId, setBookId] = useState("");
  const [bookName, setBookName] = useState("");
  const [cancelId, setCancelId] = useState("");
  const [searchId, setSearchId] = useState("");
  const [msg, setMsg] = useState(null);
  const [searchResult, setSearchResult] = useState(null);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const getFreeSeat = (seats) => {
    for (let i = 1; i <= MAX_SEATS; i++) {
      if (!seats[i]) return i;
    }
    return -1;
  };

  const idExists = (id, conf, wait) =>
    conf.some((p) => p.id === id) || wait.some((p) => p.id === id);

  const bookTicket = () => {
    const id = parseInt(bookId);
    if (!bookId || isNaN(id) || id <= 0) { showMsg("error", "ID must be a positive number."); return; }
    if (!bookName.trim()) { showMsg("error", "Name cannot be empty."); return; }
    if (idExists(id, confirmed, waiting)) { showMsg("error", `ID ${id} already exists in the system!`); return; }

    if (confirmed.length < MAX_SEATS) {
      const newSeats = [...seatTaken];
      const seatNo = getFreeSeat(newSeats);
      if (seatNo === -1) { showMsg("error", "System error: no free seat."); return; }
      newSeats[seatNo] = true;
      setSeatTaken(newSeats);
      setConfirmed([...confirmed, { id, name: bookName.trim(), seatNo }]);
      showMsg("success", `Ticket Confirmed! Seat No: ${seatNo} assigned to ${bookName.trim()}`);
    } else if (waiting.length < MAX_WAITING) {
      setWaiting([...waiting, { id, name: bookName.trim() }]);
      showMsg("info", `Seats full. ${bookName.trim()} added to Waiting List (Position ${waiting.length + 1})`);
    } else {
      showMsg("error", "Waiting List is Full! Cannot book ticket.");
    }
    setBookId(""); setBookName("");
  };

  const cancelTicket = () => {
    const id = parseInt(cancelId);
    if (!cancelId || isNaN(id) || id <= 0) { showMsg("error", "Enter a valid passenger ID."); return; }
    const idx = confirmed.findIndex((p) => p.id === id);
    if (idx === -1) { showMsg("error", `Passenger ID ${id} not found in confirmed list.`); return; }

    const freedSeat = confirmed[idx].seatNo;
    const newSeats = [...seatTaken];
    newSeats[freedSeat] = false;
    const newConfirmed = confirmed.filter((_, i) => i !== idx);

    let newWaiting = [...waiting];
    let extraMsg = "";
    if (newWaiting.length > 0) {
      const promote = newWaiting[0];
      newWaiting = newWaiting.slice(1);
      newSeats[freedSeat] = true;
      newConfirmed.push({ id: promote.id, name: promote.name, seatNo: freedSeat });
      extraMsg = ` ${promote.name} moved from Waiting to Seat ${freedSeat}!`;
    }

    setSeatTaken(newSeats); setConfirmed(newConfirmed); setWaiting(newWaiting);
    showMsg("success", `Ticket cancelled for Seat ${freedSeat}.${extraMsg}`);
    setCancelId("");
  };

  const searchPassenger = () => {
    const id = parseInt(searchId);
    if (!searchId || isNaN(id) || id <= 0) { showMsg("error", "Enter a valid ID to search."); return; }
    const conf = confirmed.find((p) => p.id === id);
    if (conf) { setSearchResult({ type: "confirmed", ...conf }); return; }
    const wait = waiting.find((p) => p.id === id);
    if (wait) {
      const pos = waiting.findIndex((p) => p.id === id) + 1;
      setSearchResult({ type: "waiting", ...wait, position: pos });
      return;
    }
    setSearchResult({ type: "notfound", id });
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="train-icon">🚂</span>
            <div>
              <h1>Railway Reservation System</h1>
              <p className="subtitle">DSA Project — Linked List & Queue</p>
            </div>
          </div>
          <div className="stats-bar">
            <div className="stat"><span className="stat-num">{confirmed.length}</span><span className="stat-label">Booked</span></div>
            <div className="stat-div" />
            <div className="stat"><span className="stat-num">{MAX_SEATS - confirmed.length}</span><span className="stat-label">Available</span></div>
            <div className="stat-div" />
            <div className="stat"><span className="stat-num">{waiting.length}</span><span className="stat-label">Waiting</span></div>
          </div>
        </div>
      </header>

      {msg && <div className={`toast toast-${msg.type}`}>{msg.text}</div>}

      <main className="main">
        <section className="card">
          <h2 className="card-title">🪑 Train Seat Map</h2>
          <div className="seat-grid">
            {Array.from({ length: MAX_SEATS }, (_, i) => {
              const seatNo = i + 1;
              const passenger = confirmed.find((p) => p.seatNo === seatNo);
              const taken = seatTaken[seatNo];
              return (
                <div key={seatNo} className={`seat ${taken ? "seat-taken" : "seat-free"}`}>
                  <div className="seat-num">Seat {seatNo}</div>
                  {taken && passenger ? (
                    <><div className="seat-name">{passenger.name}</div><div className="seat-id">ID: {passenger.id}</div></>
                  ) : (
                    <div className="seat-avail">Available</div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="seat-legend">
            <span><span className="dot dot-free" /> Free</span>
            <span><span className="dot dot-taken" /> Booked</span>
            <span className="seat-info">Max Seats: {MAX_SEATS} | Max Waiting: {MAX_WAITING}</span>
          </div>
        </section>

        <div className="two-col">
          <section className="card">
            <h2 className="card-title">🎫 Book Ticket</h2>
            <div className="form-group">
              <label>Passenger ID</label>
              <input type="number" placeholder="e.g. 101" value={bookId} onChange={(e) => setBookId(e.target.value)} min="1" />
            </div>
            <div className="form-group">
              <label>Passenger Name</label>
              <input type="text" placeholder="e.g. Ahmed Ali" value={bookName} onChange={(e) => setBookName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && bookTicket()} />
            </div>
            <button className="btn btn-primary" onClick={bookTicket}>Book Ticket</button>
          </section>

          <section className="card">
            <h2 className="card-title">❌ Cancel Ticket</h2>
            <div className="form-group">
              <label>Passenger ID to Cancel</label>
              <input type="number" placeholder="Enter ID" value={cancelId} onChange={(e) => setCancelId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && cancelTicket()} min="1" />
            </div>
            <p className="hint">If someone is in the waiting list, they will automatically get the freed seat.</p>
            <button className="btn btn-danger" onClick={cancelTicket}>Cancel Ticket</button>
          </section>

          <section className="card">
            <h2 className="card-title">🔍 Search Passenger</h2>
            <div className="form-group">
              <label>Passenger ID</label>
              <input type="number" placeholder="Enter ID to search" value={searchId} onChange={(e) => { setSearchId(e.target.value); setSearchResult(null); }} onKeyDown={(e) => e.key === "Enter" && searchPassenger()} min="1" />
            </div>
            <button className="btn btn-secondary" onClick={searchPassenger}>Search</button>
            {searchResult && (
              <div className={`search-result ${searchResult.type === "notfound" ? "result-error" : "result-found"}`}>
                {searchResult.type === "confirmed" && (<><strong>✅ Confirmed Passenger</strong><p>Name: {searchResult.name}</p><p>Seat No: {searchResult.seatNo}</p><p>ID: {searchResult.id}</p></>)}
                {searchResult.type === "waiting" && (<><strong>🕐 In Waiting List</strong><p>Name: {searchResult.name}</p><p>Queue Position: #{searchResult.position}</p><p>ID: {searchResult.id}</p></>)}
                {searchResult.type === "notfound" && <p>❌ No passenger found with ID {searchResult.id}</p>}
              </div>
            )}
          </section>

          <section className="card">
            <h2 className="card-title">🕐 Waiting List <span className="badge">{waiting.length}/{MAX_WAITING}</span></h2>
            {waiting.length === 0 ? <p className="empty-msg">Waiting list is empty.</p> : (
              <div className="passenger-list">
                {waiting.map((p, idx) => (
                  <div className="passenger-row waiting-row" key={p.id}>
                    <div className="pos">#{idx + 1}</div>
                    <div className="pinfo"><span className="pname">{p.name}</span><span className="pid">ID: {p.id}</span></div>
                    <div className="status-waiting">Waiting</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="card">
          <h2 className="card-title">✅ Confirmed Passengers <span className="badge">{confirmed.length}/{MAX_SEATS}</span></h2>
          {confirmed.length === 0 ? <p className="empty-msg">No confirmed passengers yet.</p> : (
            <div className="table-wrap">
              <table className="ptable">
                <thead><tr><th>#</th><th>ID</th><th>Name</th><th>Seat</th><th>Status</th></tr></thead>
                <tbody>
                  {confirmed.map((p, idx) => (
                    <tr key={p.id}>
                      <td>{idx + 1}</td><td>{p.id}</td><td>{p.name}</td>
                      <td><span className="seat-badge">Seat {p.seatNo}</span></td>
                      <td><span className="status-confirmed">Confirmed</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card dsa-card">
          <h2 className="card-title">📚 DSA Concepts Used</h2>
          <div className="dsa-grid">
            <div className="dsa-item"><h3>🔗 Linked List</h3><p>Confirmed passengers stored as a <strong>Singly Linked List</strong>. Each node points to the next. Booking appends to the tail; cancellation traverses and removes nodes — same as C++ <code>Passenger*</code> class.</p></div>
            <div className="dsa-item"><h3>📦 Queue (FIFO)</h3><p>Waiting passengers stored as a <strong>Queue</strong>. When a seat is freed, <code>moveFromWaiting()</code> dequeues the front passenger and promotes them — FIFO order maintained exactly.</p></div>
            <div className="dsa-item"><h3>🔍 Linear Search</h3><p>Passenger lookup traverses nodes one by one comparing IDs — mirrors the C++ <code>while(temp && temp-&gt;id != id)</code> loop for both confirmed and waiting lists.</p></div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>Railway Reservation System | DSA Project | Asjad Sajjad · Yasir Nasir · Safran | Section A-2</p>
      </footer>
    </div>
  );
}
