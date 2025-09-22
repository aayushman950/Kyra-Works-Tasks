import React, { useState } from "react";
import "./App.css";

function App() {
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleFetch() {
    try {
      setError(null);
      setData(null);
      setLoading(true);

      const res = await fetch("http://localhost:4000/api/data");

      if (!res.ok) {
        if (res.status >= 500) {
          throw new Error("ServerError");
        }
        throw new Error("UnknownError");
      }

      const json = await res.json();
      setData(json.message);
    } catch (err) {
      const message = err.message || "";

      if (message.includes("Network") || message.includes("Failed to fetch")) {
        setError("Couldn’t connect to the server. Please check if the server is running.");
      } else if (message.includes("Server")) {
        setError("The server is having trouble. Please try again later.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally { 
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <h2>User Friendly Error Messages Task</h2>
      <button onClick={handleFetch} disabled={loading}>
        Fetch Data
      </button>

      {loading && <div className="loading">loading...</div>}
      {error && <div className="error-box">{error}</div>}
      {data && <div className="success-box">{data}</div>}
    </div>
  );
}

export default App;