import { useState, useEffect } from "react";

const PASSWORD = "luland12"; // Change this

export default function ProtectedRoute({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem("wikiAuth") === "true") {
      setAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (input === PASSWORD) {
      sessionStorage.setItem("wikiAuth", "true");
      setAuthenticated(true);
    } else {
      alert("Incorrect password");
      setInput("");
    }
  };

  if (authenticated) {
    return children;
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{color: "black"}}>Password Required</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter password"
            autoFocus
          />

          <br /><br />

          <button type="submit">
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1,
};

const modalStyle = {
  background: "white",
  padding: "2rem",
  borderRadius: "8px",
  minWidth: "320px",
  textAlign: "center",
};