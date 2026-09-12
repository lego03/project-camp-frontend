import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Colors for pie chart slices - one per status
const STATUS_COLORS = {
  todo: "#78716c",       // stone
  in_progress: "#f59e0b", // amber
  done: "#10b981",        // emerald
};

function ProjectAnalytics({ projectId, refreshkey }) {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/analytics`,
        { method: "GET", credentials: "include" },
      );

      if (!response.ok) return; // fail safely, same defensive habit as before

      const data = await response.json();
      setAnalytics(data.data);
    };

    fetchAnalytics();
  }, [projectId, refreshkey]);

  if (!analytics) {
    return <p className="text-stone-500 text-sm">Loading analytics...</p>;
  }

  return (
    <div className="mb-10">
      <h2 className="font-display text-lg font-bold text-stone-100 mb-4">Analytics</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
          <p className="text-xs text-stone-500 mb-1">Total Tasks</p>
          <p className="text-2xl font-bold text-stone-100">{analytics.totalTasks}</p>
        </div>
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
          <p className="text-xs text-stone-500 mb-1">Completion Rate</p>
          <p className="text-2xl font-bold text-accent">{analytics.completionRate}%</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Pie chart: status breakdown */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
          <p className="text-sm font-medium text-stone-300 mb-3">Status Breakdown</p>
          {analytics.statusBreakdown.length === 0 ? (
            <p className="text-stone-500 text-sm">No tasks yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={analytics.statusBreakdown}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={(entry) => entry._id}
                >
                  {analytics.statusBreakdown.map((entry) => (
                    <Cell key={entry._id} fill={STATUS_COLORS[entry._id] || "#78716c"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart: workload per assignee */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
          <p className="text-sm font-medium text-stone-300 mb-3">Workload by Member</p>
          {analytics.workloadBreakdown.length === 0 ? (
            <p className="text-stone-500 text-sm">No tasks assigned yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.workloadBreakdown}>
                <XAxis dataKey="_id" stroke="#78716c" fontSize={12} />
                <YAxis stroke="#78716c" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectAnalytics;