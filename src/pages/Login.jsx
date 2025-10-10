import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";
import { LogIn } from "lucide-react"; // 👌 clean icon

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser(email, password);
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      className="relative flex flex-col justify-center items-center min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/images/background.jpg')",
      }}
    >
      {/* gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-gray-900/80"></div>

      {/* Quote on top */}
      <div className="relative z-10 text-center mb-10 px-4">
        <h1 className="animate-fadeIn text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
            Turn your voice into text — effortlessly.
        </h1>
      </div>

      {/* Login Form Card */}
      <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-sm text-white">
        <div className="flex items-center justify-center gap-2 mb-6">
          <LogIn className="text-white" size={28} />
          <h2 className="text-3xl font-bold">Welcome Back</h2>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            className="p-3 rounded-lg bg-white/20 placeholder-gray-300 text-white border border-white/30 focus:ring-2 focus:ring-white outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="p-3 rounded-lg bg-white/20 placeholder-gray-300 text-white border border-white/30 focus:ring-2 focus:ring-white outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-red-400 text-sm text-center bg-black/30 py-1 rounded-md">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
          >
            Log In
          </button>
        </form>

        <p className="text-center mt-5 text-gray-200">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            className="text-white font-semibold cursor-pointer hover:underline"
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
