import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import ProjectDetailPage from "./pages/ProjectDetailPage.jsx";
import TaskDetailPage from "./pages/TaskDetailPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
// App's job has changed: it no longer renders the login form or the
// projects list directly. Instead, it just:
//   1. Checks if someone is already logged in (the current-user check)
//   2. Decides which page to show based on the URL + login status

function App() {
	const [user, setUser] = useState(null);
	const [checkingAuth, setCheckingAuth] = useState(true);

	useEffect(() => {
		const checkLoggedIn = async () => {
			const response = await fetch(
				`${import.meta.env.VITE_API_BASE_URL}/auth/current-user`,
				{
					method: "POST",
					credentials: "include",
				},
			);

			if (response.ok) {
				const data = await response.json();
				setUser(data.data);
			}
			setCheckingAuth(false);
		};

		checkLoggedIn();
	}, []);

	if (checkingAuth) {
		return <p>Loading...</p>;
	}

	return (
		<BrowserRouter>
			<Routes>
				<Route
					path="/login"
					element={
						user ? <Navigate to="/projects" /> : <LoginPage setUser={setUser} />
					}
				/>
				<Route
					path="/projects"
					element={
						user ? (
							<ProjectsPage user={user} setUser={setUser} />
						) : (
							<Navigate to="/login" />
						)
					}
				/>
				<Route
					path="*"
					element={<Navigate to={user ? "/projects" : "/login"} />}
				/>

				<Route
  path="/projects/:projectId"
  element={user ? <ProjectDetailPage user={user} /> : <Navigate to="/login" />}
/>

				<Route
  						path="/projects/:projectId/tasks/:taskId"
  						element={user ? <TaskDetailPage /> : <Navigate to="/login" />}
				/>

				<Route path="/register" element={user ? <Navigate to="/projects" /> : <RegisterPage />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
