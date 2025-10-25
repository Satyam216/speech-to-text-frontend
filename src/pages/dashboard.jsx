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

  const drawWave = () => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;
    const ctx = canvas.getContext("2d");
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const draw = () => {
      analyser.getByteTimeDomainData(dataArray);
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#00e0ff";
      ctx.beginPath();
      const sliceWidth = WIDTH / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * HEIGHT) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(WIDTH, HEIGHT / 2);
      ctx.stroke();
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

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
        if (audioRef.current) {
          audioRef.current.src = localURL;
          audioRef.current.load();
        }

        stream.getTracks().forEach((t) => t.stop());
        cancelAnimationFrame(rafRef.current);
        if (audioCtxRef.current) audioCtxRef.current.close();

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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 animate-gradient bg-[radial-gradient(circle_at_30%_20%,rgba(0,255,255,0.15),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(0,120,255,0.15),transparent_40%)]"></div>

      {/* Header */}
      <header className="p-5 flex justify-between items-center max-w-6xl mx-auto w-full relative z-10">
        <h1 className="text-2xl font-bold tracking-wide">
          <span className="text-white">Speech</span>
          <span className="text-cyan-400">ToText</span>
        </h1>
        <div>
          {token ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-300">{userEmail}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 bg-red-500 hover:bg-red-600 px-3 py-2 rounded-lg text-sm"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link
                to="/login"
                className="flex items-center gap-1 border border-white/30 px-3 py-2 rounded-md hover:bg-white hover:text-black transition"
              >
                <LogIn size={16} /> Login
              </Link>
              <Link
                to="/signup"
                className="flex items-center gap-1 bg-white text-black px-3 py-2 rounded-md hover:bg-gray-200 transition"
              >
                <UserPlus size={16} /> Create Account
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center py-10 px-6 max-w-4xl mx-auto z-10">
        <h2 className="text-4xl sm:text-6xl font-extrabold mb-6 leading-tight bg-gradient-to-r from-cyan-300 via-white to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]">
          No typing. No limits. Just speak.
        </h2>
        <p className="text-gray-300 text-lg sm:text-xl mb-8">
          A modern{" "}
          <span className="text-white font-semibold">Speech-to-Text Conversion App</span>{" "}
          that turns your spoken words into text in real time.
        </p>
      </section>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 relative z-10">
        <div className="w-full max-w-5xl bg-white/5 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/10">
          <h2 className="text-xl font-semibold mb-6 text-center flex justify-center items-center gap-2">
            <FileText className="text-cyan-400" /> Record or Upload Audio
          </h2>

          {/* Waveform */}
          <canvas
            ref={canvasRef}
            width={1000}
            height={200}
            className="w-full h-40 rounded-md bg-black/30 mb-6 shadow-inner"
          />

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            {!recording ? (
              <button
                onClick={startRecording}
                className="flex items-center justify-center gap-2 bg-cyan-500 text-black hover:bg-cyan-400 px-6 py-3 rounded-lg font-semibold transition"
              >
                <Mic size={20} /> Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 px-6 py-3 rounded-lg font-semibold transition"
              >
                <StopCircle size={22} /> Stop Recording
              </button>
            )}
            <label className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg font-semibold cursor-pointer transition">
              <Upload size={20} /> Upload Audio
              <input type="file" accept="audio/*" onChange={handleFile} className="hidden" />
            </label>
          </div>

          {loading && <p className="text-center text-white/80 mb-2">⏳ Processing...</p>}
          {error && <p className="text-center text-red-400 mb-2">{error}</p>}

          {/* Transcription */}
          {audioURL && (
            <div className="mt-4 w-full text-center">
              <audio ref={audioRef} src={audioURL} controls className="w-full sm:w-3/4 mx-auto mb-4" />
              <div className="flex justify-center items-center gap-3 mb-3">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <FileText className="text-cyan-400" /> Transcription
                </h3>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 bg-cyan-500 hover:bg-cyan-600 px-3 py-1 rounded text-sm text-black font-semibold"
                >
                  {copied ? <CheckCircle size={16} /> : <Copy size={16} />}{" "}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="bg-black/40 rounded-lg p-3 min-h-[100px] mx-auto max-w-4xl text-gray-100 border border-white/10">
                {transcription || "Processing your speech..."}
              </div>
            </div>
          )}

          {!token && (
            <div className="mt-6 p-4 bg-red-500/60 rounded-md text-center">
              <p className="text-white font-medium">Login first to use recording or upload feature.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-gray-400 text-sm py-6 border-t border-gray-800 mt-10 relative z-10">
        <p className="max-w-3xl mx-auto text-gray-400 px-4">
          Our Speech-to-Text App makes communication effortless — perfect for meetings, lectures, or content creation.
        </p>
        <div className="flex gap-4 mt-4 justify-center">
          <a href="https://github.com/Satyam216" target="_blank" rel="noopener noreferrer">
            <Github className="text-white hover:text-cyan-400 transition" size={22} />
          </a>
          <a href="https://linkedin.com/in/satyamjain216" target="_blank" rel="noopener noreferrer">
            <Linkedin className="text-white hover:text-cyan-400 transition" size={22} />
          </a>
        </div>
        <p className="mt-3">© {new Date().getFullYear()} SpeechToText — Let your voice take the lead.</p>
      </footer>

      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 10s ease infinite;
        }
      `}</style>
    </div>
  );
}
