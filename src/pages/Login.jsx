import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, resetPasswordByEmail } from "../api/authApi"; // keep your API funcs
import { LogIn } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Forgot-password modal state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetStage, setResetStage] = useState("enterEmail"); // enterEmail | setNew
  const [resetError, setResetError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingReset, setLoadingReset] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser(email, password);
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  // Forgot flow: Step 1: check email exists
  const handleCheckEmail = async (e) => {
    e?.preventDefault();
    setResetError("");
    setResetSuccessMsg("");
    if (!forgotEmail) return setResetError("Please enter your email");
    setLoadingReset(true);
    try {
      const res = await resetPasswordByEmail(forgotEmail, "check");
      if (res && res.exists) {
        setResetStage("setNew");
      } else {
        setResetError("Email is not registered");
      }
    } catch (err) {
      setResetError(err.message || "Server error");
    } finally {
      setLoadingReset(false);
    }
  };

  // Step 2: set new password
  const handleSetNewPassword = async (e) => {
    e?.preventDefault();
    setResetError("");
    setResetSuccessMsg("");
    if (!newPassword || !confirmPassword) return setResetError("Please fill both fields");
    if (newPassword !== confirmPassword) return setResetError("Passwords do not match");
    setLoadingReset(true);
    try {
      const res = await resetPasswordByEmail(forgotEmail, "reset", { newPassword });
      if (res && res.updated) {
        setResetSuccessMsg("Password updated successfully. Please login with new password.");
        setResetStage("enterEmail");
        setTimeout(() => {
          setShowForgot(false);
          setResetSuccessMsg("");
          setForgotEmail("");
          setNewPassword("");
          setConfirmPassword("");
        }, 1800);
      } else {
        setResetError("Unable to update password");
      }
    } catch (err) {
      setResetError(err.message || "Server error");
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <div className="relative flex flex-col justify-center items-center min-h-screen overflow-hidden">
      {/* VIDEO BACKGROUND: put video file at public/loginBackground.mp4 */}
      <video
        className="absolute inset-0 w-full h-full object-cover -z-10"
        src="video/loginBackground.mp4"        /* <-- put your file at public/loginBackground.mp4 */
        autoPlay
        muted
        loop
        playsInline
      />

      {/* dark overlay so card stays readable */}
      <div className="absolute inset-0 bg-black/60 -z-5" />

      {/* Quote on top */}
      {/* Quote on top */}
      <div className="relative z-10 text-center px-4 mt-[-60px] mb-10">
        <h1
          className="text-4xl sm:text-5xl font-extrabold 
          bg-gradient-to-r from-cyan-300 via-white to-blue-400 
          bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(0,255,255,0.3)] 
          tracking-tight"
          style={{
            textShadow: "0px 0px 15px rgba(0, 255, 255, 0.4)",
          }}
        >
          Turn your voice into text — effortlessly.
        </h1>
      </div>


      {/* Login Card */}
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

        <div className="flex justify-between items-center mt-4">
          <p className="text-center text-gray-200 text-sm">
            Don’t have an account?{" "}
            <span
              onClick={() => navigate("/signup")}
              className="text-white font-semibold cursor-pointer hover:underline"
            >
              Sign Up
            </span>
          </p>

          <button
            onClick={() => { setShowForgot(true); setResetStage("enterEmail"); setForgotEmail(""); setResetError(""); }}
            className="text-sm text-cyan-300 hover:underline"
          >
            Forgot Password?
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowForgot(false)} />
          <div className="relative z-60 bg-white/6 backdrop-blur-md border border-white/20 rounded-xl p-6 w-full max-w-md text-white">
            <h3 className="text-xl font-semibold mb-3">Reset Password</h3>

            {resetSuccessMsg && (
              <p className="bg-emerald-600/40 p-2 rounded mb-3 text-sm">{resetSuccessMsg}</p>
            )}

            {resetStage === "enterEmail" && (
              <form onSubmit={handleCheckEmail} className="flex flex-col gap-3">
                <p className="text-sm text-gray-300">Enter the email associated with your account.</p>
                <input
                  type="email"
                  placeholder="Email"
                  className="p-3 rounded bg-white/10 outline-none"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
                {resetError && <p className="text-sm text-red-400">{resetError}</p>}
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowForgot(false)} className="px-4 py-2 rounded bg-white/10">Cancel</button>
                  <button type="submit" disabled={loadingReset} className="px-4 py-2 rounded bg-cyan-500 text-black font-semibold">
                    {loadingReset ? "Checking..." : "Next"}
                  </button>
                </div>
              </form>
            )}

            {resetStage === "setNew" && (
              <form onSubmit={handleSetNewPassword} className="flex flex-col gap-3">
                <p className="text-sm text-gray-300">Set a new password for <span className="font-medium">{forgotEmail}</span></p>
                <input
                  type="password"
                  placeholder="New password"
                  className="p-3 rounded bg-white/10 outline-none"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm password"
                  className="p-3 rounded bg-white/10 outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {resetError && <p className="text-sm text-red-400">{resetError}</p>}
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => { setResetStage("enterEmail"); setResetError(""); }} className="px-4 py-2 rounded bg-white/10">Back</button>
                  <button type="submit" disabled={loadingReset} className="px-4 py-2 rounded bg-cyan-500 text-black font-semibold">
                    {loadingReset ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
