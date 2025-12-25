"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Dashboard() {
  const router = useRouter();

  // --- STATE ---
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState("Grinder");
  const [loadingUser, setLoadingUser] = useState(true);

  // Data
  const [dailyWorkouts, setDailyWorkouts] = useState<any[]>([]);
  const [announcement, setAnnouncement] = useState<string | null>(null); // Store admin message
  const [noWorkoutToday, setNoWorkoutToday] = useState(false); // Flag for "No upload"

  // Gamification
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [alreadyCompletedToday, setAlreadyCompletedToday] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // AI Helper
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<string | null>(null);

  // --- INITIAL LOAD ---
  useEffect(() => {
    const initData = async () => {
      // 1. Auth Check
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth"); return; }
      setUser(session.user);

      // 2. Profile Fetch
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_streak, last_workout_date, full_name')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        if (!profile.full_name) { router.push("/onboarding"); return; }
        setUserName(profile.full_name);
        setStreak(profile.current_streak || 0);
        if (profile.last_workout_date === new Date().toISOString().split('T')[0]) {
          setAlreadyCompletedToday(true);
        }
      }

      // 3. Workout Fetch
      const today = new Date().toISOString().split('T')[0];
      const { data: workoutData } = await supabase
        .from('workouts')
        .select('content, message') // <--- Get content AND message
        .eq('date', today)
        .single();

      if (!workoutData) {
        // CASE 1: Admin hasn't uploaded ANYTHING
        setNoWorkoutToday(true);
        setDailyWorkouts([]);
      } else {
        // CASE 2: Admin uploaded something
        setNoWorkoutToday(false);
        setAnnouncement(workoutData.message); // Set message if it exists
        setDailyWorkouts(workoutData.content || []); // Set workouts if they exist
      }

      setLoadingUser(false);
    };

    initData();
  }, [router]);

  // --- ACTIONS (Same as before) ---
  const openLeaderboard = async () => {
    setShowLeaderboard(true);
    const { data } = await supabase
      .from('profiles').select('full_name, current_streak')
      .order('current_streak', { ascending: false }).limit(20);
    if (data) setLeaderboard(data);
  };

  const handleLevelUp = async () => {
    if (alreadyCompletedToday) return;
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('profiles').update({ current_streak: streak + 1, last_workout_date: today }).eq('id', user.id);
    setStreak((prev) => prev + 1);
    setAlreadyCompletedToday(true);
    alert("🔥 STREAK SAVED!");
  };

  const toggleWorkout = (id: number) => {
    let newCompleted;
    if (completed.includes(id)) {
      newCompleted = completed.filter((item) => item !== id);
      setCompleted(newCompleted); setScore(score - 10);
    } else {
      newCompleted = [...completed, id];
      setCompleted(newCompleted); setScore(score + 10);
      if (newCompleted.length === dailyWorkouts.length && dailyWorkouts.length > 0 && !alreadyCompletedToday) {
         handleLevelUp();
      }
    }
  };

  const askAI = async (workoutName: string, id: number) => {
    setLoadingId(id); setActiveWorkout(workoutName); setExplanation(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: `Explain "${workoutName}" in 2 sentences + YouTube link.` }),
      });
      const data = await res.json();
      setExplanation(data.output);
    } catch { alert("AI sleeping."); } finally { setLoadingId(null); }
  };

  if (loadingUser) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans relative">
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-10 border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">SAHAS GRINDSET</h1>
          <p className="text-gray-400 text-sm mt-1">Welcome, <span className="text-white font-bold">{userName}</span></p>
        </div>
        <div className="flex gap-3 text-center items-center">
          <button onClick={openLeaderboard} className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg border border-gray-600 transition-all">🏆</button>
          <div className="bg-gray-800 p-3 rounded-lg">
            <p className="text-xs text-gray-400">STREAK</p>
            <p className="text-2xl font-bold text-orange-500">🔥 {streak}</p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4">Today's Mission</h2>

        {/* SCENARIO 1: ADMIN HAS NOT UPLOADED ANYTHING */}
        {noWorkoutToday && (
          <div className="p-8 rounded-xl bg-gray-800 border-2 border-dashed border-gray-600 text-center">
            <h3 className="text-gray-400 font-bold text-lg">💤 No workout by Technical Head today</h3>
            <p className="text-gray-500 text-sm mt-2">Check back later or take a rest day.</p>
          </div>
        )}

        {/* SCENARIO 2: ANNOUNCEMENT MESSAGE EXISTS */}
        {announcement && (
          <div className="p-6 mb-6 rounded-xl bg-yellow-900/30 border border-yellow-500/50">
            <h3 className="text-yellow-400 font-bold flex items-center gap-2">📢 ANNOUNCEMENT</h3>
            <p className="text-gray-200 mt-2 whitespace-pre-wrap">{announcement}</p>
          </div>
        )}

        {/* SCENARIO 3: WORKOUT LIST EXISTS */}
        {dailyWorkouts.length > 0 && (
          <div className="space-y-4">
            {dailyWorkouts.map((workout) => (
              <div key={workout.id} className={`p-4 rounded-xl flex items-center justify-between border-2 transition-all ${completed.includes(workout.id) ? "bg-green-900/20 border-green-500/50" : "bg-gray-800 border-gray-700"}`}>
                <div className="flex items-center gap-4">
                  <input type="checkbox" checked={completed.includes(workout.id)} onChange={() => toggleWorkout(workout.id)} className="w-6 h-6 accent-green-500 cursor-pointer" />
                  <div>
                    <h3 className={`font-bold ${completed.includes(workout.id) ? "line-through text-gray-500" : "text-white"}`}>{workout.name}</h3>
                    <p className="text-xs text-gray-400">{workout.reps}</p>
                  </div>
                </div>
                <button onClick={() => askAI(workout.name, workout.id)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">?</button>
              </div>
            ))}
          </div>
        )}

        {/* AI EXPLANATION POPUP */}
        {explanation && (
          <div className="mt-8 p-6 bg-blue-900/30 border border-blue-500/30 rounded-xl">
            <h3 className="text-lg font-bold text-blue-300 mb-2">🤖 AI Coach</h3>
            <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{explanation}</div>
            <a href={`https://www.youtube.com/results?search_query=how+to+do+${activeWorkout}`} target="_blank" rel="noreferrer" className="mt-4 block text-blue-400 underline text-sm font-bold">Watch on YouTube ↗</a>
          </div>
        )}

        <button onClick={async () => { await supabase.auth.signOut(); router.push("/auth"); }} className="mt-10 w-full text-center text-gray-500 text-xs hover:text-white">Sign Out</button>
      </main>

      {/* LEADERBOARD MODAL (Same as before) */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 w-full max-w-md rounded-2xl border border-gray-700 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-yellow-400">🏆 TOP GRINDERS</h2>
              <button onClick={() => setShowLeaderboard(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {leaderboard.map((player, index) => (
                <div key={index} className={`flex justify-between items-center p-3 rounded-lg ${player.full_name === userName ? "bg-yellow-900/30 border border-yellow-500/30" : "bg-gray-800"}`}>
                  <div className="flex items-center gap-3"><span className={`font-bold w-6 text-center ${index < 3 ? "text-yellow-400" : "text-gray-500"}`}>#{index + 1}</span><span className="font-semibold text-white">{player.full_name}</span></div>
                  <span className="text-orange-400 font-bold">🔥 {player.current_streak}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}