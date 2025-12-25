"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminPanel() {
  const [weeklyGoal, setWeeklyGoal] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  // --- 1. GENERATE WORKOUT ---
  const generateSchedule = async () => {
    if (!weeklyGoal) return alert("Please enter a goal first!");
    
    setIsGenerating(true);
    setGeneratedPlan(null);

    // UPDATED PROMPT: Listens to user numbers, defaults to 6-7 if silent
    const prompt = `
      I am the head coach. The goal/instruction for today is: "${weeklyGoal}".
      
      Create a detailed workout plan for today based on that instruction.
      If the instruction mentions a number of exercises (e.g. "10 workouts"), generate exactly that many.
      If no number is mentioned, default to 6-7 effective exercises.
      
      Return ONLY a raw JSON Array. Do not wrap it in markdown like \`\`\`json.
      
      Each object MUST strictly use these lowercase keys: "id", "name", "reps".
      
      Example format:
      [
        {"id": 1, "name": "Diamond Pushups", "reps": "3 sets of 12"},
        {"id": 2, "name": "Plank", "reps": "3 sets of 45s"}
      ]
    `;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: prompt }),
      });

      const data = await response.json();
      console.log("AI Raw Response:", data.output);

      // Robust Parsing: Find the JSON array inside the text
      const start = data.output.indexOf("[");
      const end = data.output.lastIndexOf("]");
      
      if (start === -1 || end === -1) {
        throw new Error("AI did not return a valid JSON array.");
      }

      const cleanJson = data.output.substring(start, end + 1);
      const parsedPlan = JSON.parse(cleanJson);
      setGeneratedPlan(parsedPlan);

    } catch (error: any) {
      console.error(error);
      alert("AI Error: " + error.message + ". Check Console.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- 2. PUBLISH WORKOUT ---
  const publishWorkout = async () => {
    if (!generatedPlan) return;
    const today = new Date().toISOString().split('T')[0];

    // Clean data before sending (fix capitalization issues)
    const cleanContent = generatedPlan.map((ex: any, index: number) => ({
      id: index + 1,
      // Fallback: If AI used 'Exercise' or 'Title' instead of 'name', find it.
      name: ex.name || ex.Name || ex.Exercise || ex.title || "Unknown Exercise",
      reps: ex.reps || ex.Reps || ex.Duration || "Do until failure"
    }));

    const { error } = await supabase.from('workouts').upsert([ 
      { 
        date: today, 
        title: weeklyGoal.substring(0, 50) + "...", 
        content: cleanContent, // Send the cleaned data
        message: null // Clear announcement if posting workout
      }
    ], { onConflict: 'date' });

    if (error) alert("Error: " + error.message);
    else alert("✅ WORKOUT PUBLISHED!");
  };

  // --- 3. POST ANNOUNCEMENT ONLY ---
  const postAnnouncement = async () => {
    if (!announcement) return;
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase.from('workouts').upsert([ 
      { 
        date: today, 
        title: "Announcement", 
        content: [], // Clear workout checkboxes
        message: announcement 
      }
    ], { onConflict: 'date' });

    if (error) alert("Error: " + error.message);
    else alert("📢 ANNOUNCEMENT POSTED!");
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <h1 className="text-4xl font-bold text-red-600 mb-8">ADMIN COMMAND CENTER 🛠️</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* LEFT: WORKOUT GENERATOR */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <h2 className="text-xl font-bold text-gray-400 mb-4">🏋️ GENERATE WORKOUT</h2>
          <textarea
            value={weeklyGoal}
            onChange={(e) => setWeeklyGoal(e.target.value)}
            className="w-full h-32 bg-gray-800 text-white p-4 rounded-lg border border-gray-700 focus:border-red-500 outline-none mb-4"
            placeholder="Goal: Destroy Legs (or 'Give me 10 ab exercises')..."
          />
          <button onClick={generateSchedule} disabled={isGenerating} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg mb-4">
            {isGenerating ? "THINKING..." : "GENERATE PLAN"}
          </button>
          
          {generatedPlan && (
            <button onClick={publishWorkout} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg">
              PUBLISH WORKOUT 🚀
            </button>
          )}
        </div>

        {/* RIGHT: PREVIEW & ANNOUNCEMENTS */}
        <div className="space-y-6">
          
          {/* PREVIEW BOX */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
             <h2 className="text-xl font-bold text-gray-400 mb-4">PREVIEW</h2>
             {generatedPlan ? (
               <div className="space-y-3 max-h-60 overflow-y-auto">
                 {generatedPlan.map((ex: any, i: number) => (
                   <div key={i} className="bg-gray-800 p-3 rounded flex justify-between items-center border border-gray-700">
                     <span className="font-bold text-white">
                       {ex.name || ex.Name || ex.Exercise || "Unnamed"}
                     </span>
                     <span className="text-gray-400 text-sm">
                       {ex.reps || ex.Reps || "---"}
                     </span>
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-gray-600 italic">Plan will appear here...</p>
             )}
          </div>

          {/* ANNOUNCEMENT BOX */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">📢 ANNOUNCEMENT</h2>
            <textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="w-full h-24 bg-gray-800 text-white p-4 rounded-lg border border-gray-700 focus:border-yellow-500 outline-none mb-4"
              placeholder="Post a message (Clears workout)..."
            />
            <button onClick={postAnnouncement} className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 rounded-lg">
              POST MESSAGE
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}