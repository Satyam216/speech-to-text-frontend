import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mic,
  Upload,
  LogOut,
  LogIn,
  UserPlus,
  Copy,
  CheckCircle,
  StopCircle,
  FileText,
  Download,
  Github,
  Linkedin,
} from "lucide-react";
import { API_URL } from "../api/apiConfig";

export default function Dashboard() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [userEmail, setUserEmail] = useState("");
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [audioURL, setAudioURL] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);

  // keep your token/email logic as-is
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) {
      setToken(t);
      try {
        const payload = JSON.parse(atob(t.split(".")[1]));
        setUserEmail(payload.email);
      } catch {
        setUserEmail("User");
      }
    }
  }, []);

  // drawWave - unchanged logic, adapted to responsive canvas sizing
  const drawWave = () => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;
    const ctx = canvas.getContext("2d");

    // make canvas pixel-dense and sized to container
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(300, Math.floor(rect.width * dpr));
    canvas.height = Math.max(120, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = rect.width;
    const H = rect.height;

    analyser.fftSize = analyser.fftSize || 2048;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteTimeDomainData(dataArray);

      // Clear (soft)
      ctx.clearRect(0, 0, W, H);

      // subtle background overlay (makes waveform stand out)
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(0, 0, W, H);

      // gradient stroke (contrast on your background)
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, "rgba(0,200,255,0.98)");
      grad.addColorStop(0.5, "rgba(124,58,237,0.95)");
      grad.addColorStop(1, "rgba(24,120,255,0.92)");

      // main waveform
      ctx.lineWidth = 2.8;
      ctx.strokeStyle = grad;
      ctx.beginPath();

      const sliceWidth = W / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * H) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(W, H / 2);
      ctx.stroke();

      // glow overlay for soft bloom
      ctx.lineWidth = 12;
      ctx.strokeStyle = "rgba(0,230,255,0.06)";
      ctx.beginPath();
      x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * H) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(W, H / 2);
      ctx.stroke();

      rafRef.current = requestAnimationFrame(draw);
    };

    cancelAnimationFrame(rafRef.current);
    draw();
  };

  // Recording logic unchanged
  const startRecording = async () => {
    if (!token) return setError("Please login first to record audio!");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setChunks([]);
      setAudioURL(null);
      setTranscription("");
      setError("");

      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      drawWave();

      const mr = new MediaRecorder(stream);
      let localChunks = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) localChunks.push(e.data);
      };

      mr.onstop = async () => {
        const blob = new Blob(localChunks, { type: "audio/webm; codecs=opus" });
        const localURL = URL.createObjectURL(blob);
        setAudioURL(localURL);
        // force reload audio element
        if (audioRef.current) {
          audioRef.current.src = localURL;
          audioRef.current.key = localURL;
          audioRef.current.load();
        }

        stream.getTracks().forEach((t) => t.stop());
        cancelAnimationFrame(rafRef.current);
        if (audioCtxRef.current) audioCtxRef.current.close();

        // upload/blobs logic kept same
        await uploadAudio(blob);
      };

      mr.start();
      setMediaRecorder(mr);
      setRecording(true);
    } catch (err) {
      console.error(err);
      setError("🎤 Microphone access denied or unavailable!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  // Upload logic unchanged
  const uploadAudio = async (fileOrBlob) => {
    const token = localStorage.getItem("token");
    if (!token) return setError("⚠️ Please login first to upload audio!");
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("audio", fileOrBlob, `audio-${Date.now()}.webm`);

      const res = await fetch(`${API_URL}/api/audio/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setAudioURL(data.audioUrl);
      setTranscription(data.transcription_text);
    } catch (err) {
      console.error(err);
      setError("Upload or transcription failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) return setError("❌ Only audio files allowed!");
    uploadAudio(file);
  };

  // UI helpers
  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcription || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const downloadTranscript = () => {
    const blob = new Blob([transcription || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/dashboard");
  };

  // canvas responsiveness: resize when container changed
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      // set style height adapted to viewport
      if (window.innerWidth < 640) {
        canvas.style.height = "160px";
      } else if (window.innerWidth < 1024) {
        canvas.style.height = "180px";
      } else {
        canvas.style.height = "220px";
      }
      // redraw (drawWave will compute pixel ratio & sizes)
      if (analyserRef.current) drawWave();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line
  }, []);

  return (
    <div className="min-h-screen relative text-white">
      {/* full-screen background image (ensure file in public/images/dashboard-background.jpg) */}
      <div
        className="fixed inset-0 -z-30 bg-center bg-cover"
        style={{
          backgroundImage: "url('/images/dashboard-background.jpg')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          filter: "brightness(0.34) contrast(1.06) saturate(0.95)",
          transform: "scale(1.01)",
        }}
      />

      {/* animated gradient overlay for nice contrast (keeps image visible) */}
      <div
        className="fixed inset-0 -z-20 pointer-events-none"
        style={{
          background:
            "linear-gradient(120deg, rgba(3,169,244,0.06), rgba(124,58,237,0.06), rgba(0,230,255,0.03))",
          backgroundSize: "300% 300%",
          animation: "moveGradient 18s ease-in-out infinite",
          mixBlendMode: "overlay",
        }}
      />
      <style>{`@keyframes moveGradient{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}`}</style>

      {/* main content wrapper */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* header */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold tracking-wide">
              <span className="text-white">Speech</span>
              <span className="text-cyan-400">ToText</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {token ? (
              <>
                <span className="text-sm text-gray-200 hidden sm:inline">{userEmail}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md text-sm"
                >
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center gap-2 px-3 py-2 border border-white/20 rounded-md hover:bg-white/5"
                >
                  <LogIn size={14} /> Login
                </Link>
                <Link
                  to="/signup"
                  className="hidden sm:inline-flex items-center gap-2 px-3 py-2 bg-white text-black rounded-md hover:bg-gray-200"
                >
                  <UserPlus size={14} /> Sign Up
                </Link>

                {/* small-screen buttons */}
                <Link
                  to="/login"
                  className="inline-flex sm:hidden items-center gap-2 px-3 py-2 border border-white/20 rounded-md hover:bg-white/5"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex sm:hidden items-center gap-2 px-3 py-2 bg-white text-black rounded-md hover:bg-gray-200"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </header>

        {/* hero */}
        <section className="text-center mt-6">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-sky-400 drop-shadow-[0_8px_30px_rgba(0,200,255,0.08)]">
            No typing. No limits. Just speak.
          </h1>
          <p className="mt-3 text-gray-300 max-w-2xl mx-auto px-2">
            A modern <span className="text-white font-semibold">Speech-to-Text Conversion</span> app
            that turns your spoken words into text in real time.
          </p>
        </section>

        {/* controls card */}
        <main className="mt-10">
          <div className="rounded-2xl overflow-hidden bg-black/40 border border-white/6 shadow-xl p-5">
            <div className="rounded-xl bg-black/35 border border-white/6 p-4">
              <h3 className="text-lg font-semibold text-center mb-4 flex items-center justify-center gap-2">
                <FileText className="text-cyan-300" /> Record or Upload Audio
              </h3>

              {/* waveform box */}
              <div className="rounded-lg bg-black/60 p-3 mb-4 min-h-[140px]">
                <canvas
                  ref={canvasRef}
                  className="w-full block rounded h-36 md:h-48"
                  aria-label="waveform"
                />
              </div>

              {/* controls - responsive: full width on mobile */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {!recording ? (
                  <button
                    onClick={startRecording}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-3 rounded-full font-semibold shadow-lg transition"
                  >
                    <Mic size={18} /> Start Recording
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg transition"
                  >
                    <StopCircle size={18} /> Stop Recording
                  </button>
                )}

                <label className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white/6 hover:bg-white/10 px-5 py-3 rounded-full cursor-pointer">
                  <Upload size={18} className="text-cyan-300" /> Upload Audio
                  <input type="file" accept="audio/*" onChange={handleFile} className="hidden" />
                </label>
              </div>

              {error && <p className="text-center text-red-400 mt-4">{error}</p>}
              {loading && <p className="text-center text-white/80 mt-4">Processing...</p>}
            </div>
          </div>
        </main>

        {/* transcription block */}
        <section className="mt-8">
          <div className="rounded-2xl bg-black/35 border border-white/6 p-4 shadow-2xl">
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold flex items-center gap-3">
                  <FileText className="text-cyan-300" /> Transcription
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Your transcript will appear below. Edit, copy, or download as needed.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-black px-3 py-2 rounded-md"
                >
                  {copied ? <CheckCircle size={16} /> : <Copy size={16} />}{" "}
                  <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
                </button>
                <button
                  onClick={downloadTranscript}
                  className="flex items-center gap-2 bg-white/6 hover:bg-white/10 px-3 py-2 rounded-md"
                >
                  <Download size={16} /> <span className="hidden sm:inline">Download</span>
                </button>
              </div>
            </div>

            <div className="mt-4">
              <textarea
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                placeholder={loading ? "Processing your speech..." : "Transcript will appear here..."}
                className="w-full min-h-[200px] md:min-h-[320px] resize-y bg-transparent outline-none text-gray-100 p-4 rounded-lg border border-white/8"
                style={{ fontSize: 15, lineHeight: 1.6 }}
              />
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <audio
                  // use key to force reload when URL changes
                  key={audioURL || "no-audio"}
                  ref={audioRef}
                  src={audioURL || ""}
                  controls
                  className="w-full sm:w-72"
                />
                <div className="text-sm text-gray-400 hidden sm:block">Play recorded / uploaded audio</div>
              </div>
            </div>
          </div>
        </section>

        {/* footer */}
        <footer className="mt-10 pb-12 text-center text-gray-300">
          <p className="max-w-3xl mx-auto">
            Our Speech-to-Text app turns spoken words into editable text — fast and accurate.
          </p>
          <div className="flex items-center justify-center gap-6 mt-4">
            <a href="https://github.com/Satyam216" target="_blank" rel="noopener noreferrer">
              <Github className="hover:text-cyan-400 transition" size={20} />
            </a>
            <a href="https://linkedin.com/in/satyamjain216" target="_blank" rel="noopener noreferrer">
              <Linkedin className="hover:text-cyan-400 transition" size={20} />
            </a>
          </div>
          <p className="mt-4 text-sm">© {new Date().getFullYear()} SpeechToText — Let your voice take the lead.</p>
        </footer>
      </div>
    </div>
  );
}
