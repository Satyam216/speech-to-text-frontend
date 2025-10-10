import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [serverStatus, setServerStatus] = useState("");

  // Check JWT token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // (Optional) decode email from token payload (simple version)
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserEmail(payload.email);
    } catch {
      setUserEmail("User");
    }

    // Test backend connection
    fetch(import.meta.env.VITE_BACKEND_URL + "/")
      .then((res) =>
        res.ok ? setServerStatus("🟢 Connected to backend") : setServerStatus("🔴 Backend not reachable")
      )
      .catch(() => setServerStatus("🔴 Backend not reachable"));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center p-6 text-white">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center">
        <h1 className="text-3xl font-bold mb-4">🎧 Welcome to Your Dashboard</h1>
        <p className="text-lg mb-2">Hello, <span className="font-semibold">{userEmail || "User"}</span> 👋</p>
        <p className="text-sm mb-6 text-gray-200">{serverStatus}</p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => alert("Upload feature coming soon 🚀")}
            className="bg-indigo-600 hover:bg-indigo-700 transition-all text-white py-3 px-6 rounded-xl font-medium w-full sm:w-auto"
          >
            Upload Audio
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 transition-all text-white py-3 px-6 rounded-xl font-medium w-full sm:w-auto"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
