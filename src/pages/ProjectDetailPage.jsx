import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ProjectAnalytics from "../components/ProjectAnalytics";

// Small themed loader — a single "ember" pulsing, instead of plain text.
// Used until ALL of project/tasks/members have loaded, so the page
// appears once, fully formed, rather than piece by piece.
function CampLoader() {
  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center gap-4">
      <motion.div
        className="w-4 h-4 rounded-full bg-accent"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.25, 0.8] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <p className="text-stone-500 text-sm">Setting up camp...</p>
    </div>
  );
}

const COLUMNS = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "done", label: "Done" },
];

function ProjectDetailPage({ user }) {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [statusError, setStatusError] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const [analyticsRefreshKey, setAnalyticsRefreshKey] = useState(0);
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  // NEW: track each fetch's completion separately, so we can wait for
  // ALL of them before showing the page — this is what fixes the
  // "content pops in piece by piece" problem.
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [membersLoaded, setMembersLoaded] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      setProject(data.data);
    };
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    const fetchTasks = async () => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tasks/${projectId}`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      setTasks(data.data);
      setTasksLoaded(true); // mark done regardless, so we don't hang forever on an error
    };
    fetchTasks();
  }, [projectId]);

  useEffect(() => {
    const fetchMembers = async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/members`,
        { method: "GET", credentials: "include" },
      );
      const data = await response.json();
      setMembers(data.data);
      setMembersLoaded(true);
    };
    fetchMembers();
  }, [projectId]);

  const currentUserMembership = members.find((member) => member.user._id === user._id);
  const currentUserRole = currentUserMembership?.role;

  const handleStatusChange = async (taskId, newStatus) => {
    setStatusError("");

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/tasks/${projectId}/t/${taskId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      setStatusError(data.message || "Failed to update status");
      return;
    }

    setTasks((prevTasks) =>
      prevTasks.map((task) => (task._id === taskId ? { ...task, status: newStatus } : task)),
    );
    setAnalyticsRefreshKey((prev) => prev + 1);
  };

  // NEW: runs when a drag ends anywhere in the board.
  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside any column entirely — do nothing.
    if (!destination) return;

    // Dropped back in the exact same spot — nothing actually changed.
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // destination.droppableId is one of "todo" / "in_progress" / "done" —
    // exactly matching your task status values, which is why we chose
    // those specific strings as the Droppable IDs. Reuse the exact same
    // status-update logic as before — dragging is just a different way
    // of triggering the same change.
    handleStatusChange(draggableId, destination.droppableId);
  };

  // NEW: delete a task
  const handleDeleteTask = async (taskId) => {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/tasks/${projectId}/t/${taskId}`,
      { method: "DELETE", credentials: "include" },
    );

    if (!response.ok) {
      const data = await response.json();
      setStatusError(data.message || "Failed to delete task");
      return;
    }

    setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));
    setAnalyticsRefreshKey((prev) => prev + 1);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tasks/${projectId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: newTaskTitle,
        description: newTaskDescription,
        assignedTo: newTaskAssignedTo || undefined,
        dueDate: newTaskDueDate || undefined,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.log("Failed to create task:", data.message);
      return;
    }

    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskAssignedTo("");
    setNewTaskDueDate("");
    setTasks((prev) => [...prev, data.data]);
    setAnalyticsRefreshKey((prev) => prev + 1);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/members`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: newMemberEmail, role: newMemberRole }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      console.log("Failed to add member:", data.message);
      return;
    }

    setNewMemberEmail("");
    setNewMemberRole("member");

    const membersResponse = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/members`,
      { method: "GET", credentials: "include" },
    );
    const membersData = await membersResponse.json();
    setMembers(membersData.data);
  };

  // Wait for EVERYTHING before rendering the real page — this is the fix
  // for the "task list appears, then analytics pops in below it" issue.
  const pageReady = project && tasksLoaded && membersLoaded;

  if (!pageReady) {
    return <CampLoader />;
  }

  return (
    <div className="min-h-screen bg-stone-950">
      <header className="bg-stone-900 border-b border-stone-800">
        {statusError && <p className="text-sm text-red-400 mb-2 px-6 pt-2">{statusError}</p>}
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link to="/projects" className="text-sm text-stone-400 hover:text-accent transition-colors">
            ← Back to Projects
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="font-display text-2xl font-bold text-stone-100">{project.name}</h1>
          <p className="text-stone-400 mt-1">{project.description}</p>
          <ProjectAnalytics projectId={projectId} refreshkey={analyticsRefreshKey} />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="font-display text-lg font-bold text-stone-100 mb-4">Tasks</h2>

            {/* NEW: Kanban board replacing the flat list */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {COLUMNS.map((col) => (
                  <Droppable droppableId={col.id} key={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`bg-stone-900/40 border rounded-xl p-3 min-h-[160px] transition-colors ${
                          snapshot.isDraggingOver ? "border-accent" : "border-stone-800"
                        }`}
                      >
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-3 px-1">
                          {col.label}{" "}
                          <span className="text-stone-600">
                            {tasks.filter((t) => t.status === col.id).length}
                          </span>
                        </h3>
                        <div className="space-y-2">
                          {tasks
                            .filter((t) => t.status === col.id)
                            .map((task, index) => (
                              <Draggable draggableId={task._id} index={index} key={task._id}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() =>
                                      navigate(`/projects/${projectId}/tasks/${task._id}`)
                                    }
                                    className={`bg-stone-900 border rounded-lg p-3 cursor-pointer transition-colors ${
                                      snapshot.isDragging
                                        ? "border-accent shadow-lg"
                                        : "border-stone-800 hover:border-accent"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="text-sm font-medium text-stone-100">
                                        {task.title}
                                      </span>
                                      {(currentUserRole === "admin" ||
                                        currentUserRole === "project_admin") && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTask(task._id);
                                          }}
                                          className="text-stone-600 hover:text-red-400 transition-colors text-xs shrink-0"
                                          title="Delete task"
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-stone-500">
                                      {task.assignedTo?.username && (
                                        <span>{task.assignedTo.username}</span>
                                      )}
                                      {task.dueDate && (
                                        <span>
                                          ·{" "}
                                          {new Date(task.dueDate).toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                          })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>

            {(currentUserRole === "admin" || currentUserRole === "project_admin") && (
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
                <h3 className="font-display font-bold text-stone-100 mb-3 text-sm">
                  Create a New Task
                </h3>
                <form onSubmit={handleCreateTask} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Task title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  />
                  <select
                    value={newTaskAssignedTo}
                    onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                    className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-stone-100 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  >
                    <option value="">Unassigned</option>
                    {members.map((member) => (
                      <option key={member.user._id} value={member.user._id}>
                        {member.user.username}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-stone-100 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  />
                  <button
                    type="submit"
                    className="bg-accent text-stone-950 font-semibold rounded-lg px-4 py-2 hover:opacity-90 transition-opacity text-sm"
                  >
                    Create Task
                  </button>
                </form>
              </div>
            )}
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-stone-100 mb-4">Members</h2>
            <div className="space-y-2 mb-6">
              {members.map((member) => (
                <div
                  key={member.user._id}
                  className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <span className="text-stone-200 text-sm font-medium">
                    {member.user.username}
                  </span>
                  <span className="text-xs text-stone-500">{member.role}</span>
                </div>
              ))}
            </div>

            {currentUserRole === "admin" && (
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
                <h3 className="font-display font-bold text-stone-100 mb-3 text-sm">
                  Add a Member
                </h3>
                <form onSubmit={handleAddMember} className="space-y-3">
                  <input
                    type="email"
                    placeholder="Member's email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-sm"
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-stone-100 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-sm"
                  >
                    <option value="member">Member</option>
                    <option value="project_admin">Project Admin</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-accent text-stone-950 font-semibold rounded-lg px-4 py-2 hover:opacity-90 transition-opacity text-sm"
                  >
                    Add Member
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProjectDetailPage;