import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

function TaskDetailPage() {
  const { projectId, taskId } = useParams();
  const [task, setTask] = useState(null);

  useEffect(() => {
    const fetchTask = async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/tasks/${projectId}/t/${taskId}`,
        { method: "GET", credentials: "include" },
      );
      const data = await response.json();
      setTask(data.data);
    };
    fetchTask();
  }, [projectId, taskId]);

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
            className="text-sm text-stone-400 hover:text-accent transition-colors"
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

        <h2 className="font-display text-lg font-bold text-stone-100 mb-4">Subtasks</h2>

        {task.subtasks.length === 0 ? (
          <p className="text-stone-500 text-sm">No subtasks yet.</p>
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
                  className="w-4 h-4 accent-accent rounded"
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