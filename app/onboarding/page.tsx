"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Onboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // 1. Form State
  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    gender: "Male",
    gradYear: "",
    height: "",
    weight: ""
  });

  // 2. Check Login Status
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth"); // Not logged in? Kick them out.
      } else {
        setUser(session.user);
      }
    };
    getUser();
  }, [router]);

  // 3. Handle Input Changes
  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 4. Submit to Database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          dob: formData.dob,
          gender: formData.gender,
          graduation_year: parseInt(formData.gradYear),
          height: formData.height,
          weight: formData.weight
        })
        .eq('id', user.id);

      if (error) throw error;

      // Success! Go to Dashboard
      router.push("/");
      
    } catch (error: any) {
      alert("Error saving profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-2xl">
        <h1 className="text-3xl font-bold text-yellow-400 mb-2">COMPLETE PROFILE</h1>
        <p className="text-gray-400 text-sm mb-8">
          One last step to personalize your experience.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">FULL NAME</label>
            <input
              name="fullName"
              type="text"
              required
              placeholder="e.g. Sahas User"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-yellow-500 outline-none"
            />
          </div>

          {/* DOB & Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">DATE OF BIRTH</label>
              <input
                name="dob"
                type="date"
                required
                value={formData.dob}
                onChange={handleChange}
                className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-yellow-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">GENDER</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-yellow-500 outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Graduation Year */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">GRADUATION YEAR</label>
            <input
              name="gradYear"
              type="number"
              required
              placeholder="e.g. 2026"
              value={formData.gradYear}
              onChange={handleChange}
              className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-yellow-500 outline-none"
            />
          </div>

          {/* Height & Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">HEIGHT</label>
              <input
                name="height"
                type="text"
                required
                placeholder="e.g. 5'11"
                value={formData.height}
                onChange={handleChange}
                className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-yellow-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">WEIGHT (KG)</label>
              <input
                name="weight"
                type="text"
                required
                placeholder="e.g. 75"
                value={formData.weight}
                onChange={handleChange}
                className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-yellow-500 outline-none"
              />
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 rounded-lg mt-6 transition-all"
          >
            {loading ? "SAVING..." : "ENTER THE GRIND 🚀"}
          </button>

        </form>
      </div>
    </div>
  );
}