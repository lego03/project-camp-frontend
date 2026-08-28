import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function ProjectsPage({ user, setUser }) {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      setProjects(data.data);
    };
    fetchProjects();
  }, []);

  const handleLogout = async () => {
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    navigate("/login");
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: newProjectName, description: newProjectDescription }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.log("Failed to create project:", data.message);
      return;
    }

    setNewProjectName("");
    setNewProjectDescription("");
    setProjects((prev) => [...prev, { project: data.data, role: "admin" }]);
  };

  return (
    <div className="min-h-screen bg-stone-950">
      <header className="bg-stone-900 border-b border-stone-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-display text-lg font-bold text-stone-100">Project Camp</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-stone-500">
              Hi, <span className="font-medium text-stone-300">{user.username}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-stone-300 hover:text-stone-100 border border-stone-700 rounded-lg px-3 py-1.5 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-bold text-stone-100">Your Projects</h2>
        </div>

        {projects.length === 0 ? (
          <p className="text-stone-500 text-sm mb-10">
            No projects yet — create your first one below.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {projects.map((item) => (
              <button
                key={item.project._id}
                onClick={() => navigate(`/projects/${item.project._id}`)}
                className="text-left bg-stone-900 border border-stone-800 rounded-xl p-5 hover:border-accent hover:shadow-sm transition-all"
              >
                <h3 className="font-semibold text-stone-100 mb-1">{item.project.name}</h3>
                <p className="text-sm text-stone-500 line-clamp-2 mb-3">
                  {item.project.description || "No description"}
                </p>
                <span className="inline-block text-xs font-medium text-accent bg-accent/10 rounded-full px-2.5 py-1">
                  {item.role}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 max-w-md">
          <h3 className="font-display font-bold text-stone-100 mb-4">Create a New Project</h3>
          <form onSubmit={handleCreateProject} className="space-y-3">
            <input
              type="text"
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            />
            <input
              type="text"
              placeholder="Description"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            />
            <button
              type="submit"
              className="bg-accent text-stone-950 font-semibold rounded-lg px-4 py-2 hover:opacity-90 transition-opacity"
            >
              Create Project
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default ProjectsPage;