import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Registration failed");
      return;
    }

    setSuccessMessage("Account created! Check your email to verify, then log in.");
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4 relative overflow-hidden">
      <motion.div
        className="absolute w-72 h-72 rounded-full bg-accent/20 blur-3xl pointer-events-none"
        style={{ top: "15%" }}
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.08, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="w-full max-w-sm relative">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-2xl font-bold text-stone-100 tracking-tight">
            Project Camp
          </h1>
          <p className="text-stone-500 text-sm mt-1">Create your account</p>
        </motion.div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl shadow-sm p-8">
          {error && (
            <div className="mb-4 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 text-sm text-emerald-400 bg-emerald-950/50 border border-emerald-900 rounded-lg px-3 py-2">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourusername"
                className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>

            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              className="w-full bg-accent text-stone-950 font-semibold rounded-lg py-2.5 hover:opacity-90 transition-opacity"
            >
              Create account
            </motion.button>
          </form>
        </div>

        <p className="text-center text-sm text-stone-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-accent font-medium hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;