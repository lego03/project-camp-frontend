import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ProjectAnalytics from "../components/ProjectAnalytics";
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
	useEffect(() => {
		const fetchProject = async () => {
			const response = await fetch(
				`${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}`,
				{
					method: "GET",
					credentials: "include",
				},
			);
			const data = await response.json();
			setProject(data.data);
		};
		fetchProject();
	}, [projectId]);

	useEffect(() => {
		const fetchTasks = async () => {
			const response = await fetch(
				`${import.meta.env.VITE_API_BASE_URL}/tasks/${projectId}`,
				{
					method: "GET",
					credentials: "include",
				},
			);
			const data = await response.json();
			setTasks(data.data);
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
		};
		fetchMembers();
	}, [projectId]);

	const currentUserMembership = members.find(
		(member) => member.user._id === user._id,
	);
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

		// FIX: this page has a `tasks` array, not a single `task` object —
		// find the one task that changed, leave every other task in the array untouched.
		// Same pattern as the subtask-toggle logic in TaskDetailPage.
		setTasks((prevTasks) =>
			prevTasks.map((task) =>
				task._id === taskId ? { ...task, status: newStatus } : task,
			),
		);
		setAnalyticsRefreshKey((prev) => prev + 1); // trigger analytics refresh
	};
	const handleCreateTask = async (e) => {
		e.preventDefault();

		const response = await fetch(
			`${import.meta.env.VITE_API_BASE_URL}/tasks/${projectId}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					title: newTaskTitle,
					description: newTaskDescription,
					assignedTo: newTaskAssignedTo || undefined,
					dueDate: newTaskDueDate || undefined,
				}),
			},
		);

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

	const statusStyles = {
		todo: "bg-stone-800 text-stone-300",
		in_progress: "bg-amber-900/40 text-amber-300",
		done: "bg-emerald-900/40 text-emerald-300",
	};

	if (!project) {
		return (
			<div className="min-h-screen bg-stone-950 flex items-center justify-center">
				<p className="text-stone-500">Loading project...</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-stone-950">
			<header className="bg-stone-900 border-b border-stone-800">
				{statusError && (
					<p className="text-sm text-red-400 mb-2">{statusError}</p>
				)}
				<div className="max-w-5xl mx-auto px-6 py-4">
					<Link
						to="/projects"
						className="text-sm text-stone-400 hover:text-accent transition-colors"
					>
						← Back to Projects
					</Link>
				</div>
			</header>

			<main className="max-w-5xl mx-auto px-6 py-10">
				{/* Project header */}
				<div className="mb-10">
					<h1 className="font-display text-2xl font-bold text-stone-100">
						{project.name}
					</h1>
					<p className="text-stone-400 mt-1">{project.description}</p>
					<ProjectAnalytics
						projectId={projectId}
						refreshkey={analyticsRefreshKey}
					/>
				</div>

				<div className="grid lg:grid-cols-3 gap-8">
					{/* Left column: Tasks (wider) */}
					<div className="lg:col-span-2">
						<h2 className="font-display text-lg font-bold text-stone-100 mb-4">
							Tasks
						</h2>

						{tasks.length === 0 ? (
							<p className="text-stone-500 text-sm mb-6">No tasks yet.</p>
						) : (
							<div className="space-y-2 mb-6">
								{tasks.map((task) => (
									<div
										key={task._id}
										onClick={() =>
											navigate(`/projects/${projectId}/tasks/${task._id}`)
										}
										className="w-full text-left bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 flex items-center justify-between hover:border-accent transition-colors cursor-pointer"
									>
										<span className="text-stone-100 font-medium">
											{task.title}
										</span>
										<select
											value={task.status}
											onChange={(e) =>
												handleStatusChange(task._id, e.target.value)
											}
											onClick={(e) => e.stopPropagation()}
											className="text-xs font-medium rounded-full px-2.5 py-1 bg-stone-800 text-stone-200 border border-stone-700"
										>
											<option value="todo">todo</option>
											<option value="in_progress">in_progress</option>
											<option value="done">done</option>
										</select>
									</div>
								))}
							</div>
						)}

						{(currentUserRole === "admin" ||
							currentUserRole === "project_admin") && (
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

					{/* Right column: Members (narrower sidebar) */}
					<div>
						<h2 className="font-display text-lg font-bold text-stone-100 mb-4">
							Members
						</h2>
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
