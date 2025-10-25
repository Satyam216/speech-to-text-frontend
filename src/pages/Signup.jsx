import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupUser } from "../api/authApi";
import { UserPlus, Eye, EyeOff } from "lucide-react"; // added Eye / EyeOff

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // <-- toggle state
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await signupUser(email, password);
      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="relative flex justify-center items-center min-h-screen bg-cover bg-center bg-no-repeat">
      <video
        className="absolute inset-0 w-full h-full object-cover -z-10"
        src="video/loginBackground.mp4"        /* <-- put your file at public/loginBackground.mp4 */
        autoPlay
        muted
        loop
        playsInline
      />
      
      {/* overlay for gradient dark tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-gray-800/70"></div>

      {/* Transparent glass form */}
      <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-sm text-white">
        <div className="flex items-center justify-center gap-2 mb-6">
          <UserPlus className="text-white" size={28} />
          <h2 className="text-3xl font-bold">Create Account</h2>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            className="p-3 rounded-lg bg-white/20 placeholder-gray-300 text-white border border-white/30 focus:ring-2 focus:ring-white outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* password input with eye toggle */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="p-3 rounded-lg bg-white/20 placeholder-gray-300 text-white border border-white/30 focus:ring-2 focus:ring-white outline-none w-full pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-200 hover:text-white"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center bg-black/30 py-1 rounded-md">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
          >
            Sign Up
          </button>
        </form>

        <p className="text-center mt-5 text-gray-200">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-white font-semibold cursor-pointer hover:underline"
          >
            Log In
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;
