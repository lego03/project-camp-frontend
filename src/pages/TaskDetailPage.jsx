import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

function TaskDetailPage() {
  const { projectId, taskId } = useParams();
  const [task, setTask] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  // 🚀 New State for Manual Subtask Input
  const [manualTitle, setManualTitle] = useState("");
  const [isAddingManual, setIsAddingManual] = useState(false);

  // Helper function to re-fetch task from DB
  const fetchTask = async () => {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/tasks/${projectId}/t/${taskId}`,
      { method: "GET", credentials: "include" },
    );
    const data = await response.json();
    setTask(data.data);
  };

  useEffect(() => {
    fetchTask();
  }, [projectId, taskId]);

  // Handle toggling subtask completion
  const handleToggleSubtask = async (subtaskId, currentStatus) => {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/tasks/${projectId}/st/${subtaskId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isCompleted: !currentStatus }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      console.log("Failed to update subtask:", data.message);
      return;
    }

    setTask((prevTask) => ({
      ...prevTask,
      subtasks: prevTask.subtasks.map((subtask) =>
        subtask._id === subtaskId ? { ...subtask, isCompleted: !currentStatus } : subtask,
      ),
    }));
  };

  // 🚀 Manual Subtask Creation Function
  const handleAddManualSubtask = async (e) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    setIsAddingManual(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/tasks/${projectId}/t/${taskId}/subtasks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ title: manualTitle.trim() }),
        }
      );

      if (response.ok) {
        setManualTitle(""); // Clear input
        await fetchTask(); // Refresh task list
      } else {
        const data = await response.json();
        alert(data.message || "Failed to add subtask");
      }
    } catch (error) {
      console.error("Error adding subtask:", error);
    } finally {
      setIsAddingManual(false);
    }
  };

  // 🚀 AI Subtask Generation Function
  const handleGenerateAISubtasks = async () => {
    if (!task) return;
    setIsGeneratingAI(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/tasks/ai-subtasks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: task.title,
            description: task.description,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to generate AI subtasks");
        setIsGeneratingAI(false);
        return;
      }

      const generatedTitles = data.data;

      // Save each generated subtask to MongoDB
      for (const title of generatedTitles) {
        await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/tasks/${projectId}/t/${taskId}/subtasks`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ title }),
          }
        );
      }

      await fetchTask();

    } catch (error) {
      console.error("AI Subtask Error:", error);
      alert("Something went wrong while generating subtasks.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const statusStyles = {
    todo: "bg-stone-800 text-stone-300",
    in_progress: "bg-amber-900/40 text-amber-300",
    done: "bg-emerald-900/40 text-emerald-300",
  };

  if (!task) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <p className="text-stone-500">Loading task...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950">
      <header className="bg-stone-900 border-b border-stone-800">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link
            to={`/projects/${projectId}`}
            className="text-sm text-stone-400 hover:text-stone-200 transition-colors"
          >
            ← Back to Project
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-display text-2xl font-bold text-stone-100">{task.title}</h1>
          <span
            className={`text-xs font-medium rounded-full px-2.5 py-1 ${statusStyles[task.status] || statusStyles.todo}`}
          >
            {task.status}
          </span>
        </div>
        <p className="text-stone-400 mb-8">{task.description}</p>

        {/* Section Title */}
        <h2 className="font-display text-lg font-bold text-stone-100 mb-4">Subtasks</h2>

        {/* 🚀 Manual Input Form + AI Button Bar */}
        <form onSubmit={handleAddManualSubtask} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Add a subtask"
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-stone-700 transition-colors"
          />
          
          {/* Manual Add Button */}
          <button
            type="submit"
            disabled={isAddingManual || !manualTitle.trim()}
            className="bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isAddingManual ? "Adding..." : "+ Add"}
          </button>

          {/* AI Generation Button */}
          <button
            type="button"
            onClick={handleGenerateAISubtasks}
            disabled={isGeneratingAI}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isGeneratingAI ? "✨ Generating..." : "✨ Generate with AI"}
          </button>
        </form>

        {/* Subtasks List */}
        {task.subtasks.length === 0 ? (
          <div className="bg-stone-900/50 border border-dashed border-stone-800 rounded-xl p-6 text-center">
            <p className="text-stone-500 text-sm mb-1">No subtasks yet.</p>
            <p className="text-stone-600 text-xs">Type a subtask above or click "✨ Generate with AI"!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {task.subtasks.map((subtask) => (
              <label
                key={subtask._id}
                className="flex items-center gap-3 bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 cursor-pointer hover:border-stone-700 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={subtask.isCompleted}
                  onChange={() => handleToggleSubtask(subtask._id, subtask.isCompleted)}
                  className="w-4 h-4 accent-indigo-500 rounded"
                />
                <span
                  className={
                    subtask.isCompleted
                      ? "text-stone-500 line-through"
                      : "text-stone-200"
                  }
                >
                  {subtask.title}
                </span>
              </label>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default TaskDetailPage;