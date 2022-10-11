import React, { useState, useEffect } from "react";
import TaskView from "./TaskView";
import ScheduleView from "./ScheduleView";
import MobileFooter from "./MobileFooter";
import Navbar from "./Navbar";
import Signup from "./Signup";
import Login from "./Login";
import ForgotPassword from "./ForgotPassword";
import { useAuth } from "./contexts/AuthContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import { db } from "./firebase";
import "./css/App.css";

function App() {
	const [tasks, setTasks] = useState([]);
	const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
	const [taskViewActive, setTaskViewActive] = useState(true);
	const [scheduleViewActive, setScheduleViewActive] = useState(
		isMobile ? false : true
	);
	const { currentUser } = useAuth();

	const handleResize = () => {
		if (window.innerWidth < 768) {
			if (!isMobile) {
				setIsMobile(true);
				setScheduleViewActive(false);
				setTaskViewActive(true);
			}
		} else if (window.innerWidth > 768) {
			setIsMobile(false);
			setTaskViewActive(true);
			setScheduleViewActive(true);
		}
	};

	function addTask(desc) {
		const newTask = {
			desc: desc,
			completed: false,
			category: "unscheduled",
			startDate: "",
			endDate: "",
		};

		db.collection("users")
			.doc(currentUser.uid)
			.collection("tasks")
			.add(newTask);
	}

	function addAppointment(appointment) {
		const newTask = {
			desc: appointment.title,
			completed: false,
			category: "scheduled",
			startDate: appointment.startDate,
			endDate: appointment.endDate,
		};

		db.collection("users")
			.doc(currentUser.uid)
			.collection("tasks")
			.add(newTask);
	}

	function changeAppointment(appointment) {
		const idArr = Object.keys(appointment);
		const id = idArr[0];
		const changes = appointment[id];

		db.collection("users")
			.doc(currentUser.uid)
			.collection("tasks")
			.doc(id)
			.set(
				{
					...changes,
				},
				{ merge: true }
			);
	}

	function deleteAppointment(id) {
		db.collection("users")
			.doc(currentUser.uid)
			.collection("tasks")
			.doc(id)
			.delete();
	}

	function saveTask(id, desc) {
		db.collection("users").doc(currentUser.uid).collection("tasks").doc(id).set(
			{
				desc: desc,
			},
			{ merge: true }
		);
	}

	function scheduleTask(id, scheduledStart, scheduledEnd) {
		db.collection("users").doc(currentUser.uid).collection("tasks").doc(id).set(
			{
				startDate: scheduledStart,
				endDate: scheduledEnd,
				category: "scheduled",
			},
			{ merge: true }
		);
	}

	function completeTask(id) {
		db.collection("users").doc(currentUser.uid).collection("tasks").doc(id).set(
			{
				completed: true,
				category: "completed",
			},
			{ merge: true }
		);
	}

	function uncompleteTask(id) {
		const currTask = tasks.find((task) => task.id === id);

		db.collection("users")
			.doc(currentUser.uid)
			.collection("tasks")
			.doc(id)
			.set(
				{
					completed: false,
					category: currTask.startDate === "" ? "unscheduled" : "scheduled",
				},
				{ merge: true }
			);
	}

	function deleteTask(id) {
		const taskToDelete = tasks.find((task) => task.id === id);

		// prompt to confirm delete if task has description
		if (taskToDelete.desc) {
			if (window.confirm("Delete?")) {
				db.collection("users")
					.doc(currentUser.uid)
					.collection("tasks")
					.doc(id)
					.delete();
			}
		}

		// delete task without prompt if it has no description
		else {
			db.collection("users")
				.doc(currentUser.uid)
				.collection("tasks")
				.doc(id)
				.delete();
		}
	}

	function countTasks(category) {
		const count = tasks.filter((task) => task.category === category).length;
		return count;
	}

	function handleDnd(dndTaskArray) {
		const nonScheduledTasks = tasks.filter(
			(task) => task.category !== "unscheduled"
		);
		setTasks([...nonScheduledTasks, ...dndTaskArray]);
	}

	const handleTaskButton = () => {
		setTaskViewActive(true);
		setScheduleViewActive(false);
	};

	const handleScheduleButton = () => {
		setTaskViewActive(false);
		setScheduleViewActive(true);
	};

	// Check task completion and endDate to determine if past due
	function pastDue(task) {
		// if task is completed, it is not past due
		if (task.completed) {
			return false;
		}

		const endDate = new Date(task.endDate);
		const currentDate = new Date(Date.now());
		if (endDate < currentDate) {
			return true;
		}
		return false;
	}

	// A change to a task will cause a new snapshot and update the [tasks] state
	useEffect(() => {
		db.collection("users")
			.doc(currentUser.uid)
			.collection("tasks")
			.onSnapshot((snapshot) => {
				const taskArr = snapshot.docs.map((doc) => {
					const convertedStartDate =
						doc.data().startDate !== "" ? doc.data().startDate.toDate() : "";
					const convertedEndDate =
						doc.data().endDate !== "" ? doc.data().endDate.toDate() : "";
					return {
						id: doc.id,
						category: doc.data().category,
						completed: doc.data().completed,
						desc: doc.data().desc,
						startDate: convertedStartDate,
						endDate: convertedEndDate,
						//...doc.data(),
					};
				});
				setTasks(taskArr);
			});
	}, []);

	useEffect(() => {
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [isMobile]);

	// check for past due tasks every minute
	// useEffect(() => {
	// 	const interval = setInterval(() => {
	// 		// checks all tasks
	// 		// some tasks may not have start/end date
	// 		const updatedTasks = tasks.map((task) => {
	// 			if (task.category === "scheduled" && pastDue(task)) {
	// 				return {
	// 					...task,
	// 					category: "past",
	// 				};
	// 			}
	// 			return task;
	// 		});
	// 		setTasks(updatedTasks);
	// 	}, 60 * 1000);
	// 	return () => clearInterval(interval);
	// }, [tasks]);

	return (
		<Router>
			<Routes>
				<Route
					path="/"
					element={
						<PrivateRoute>
							<div className="App">
								<Navbar />
								<div className="view-container">
									{taskViewActive && (
										<TaskView
											tasks={tasks}
											addTask={addTask}
											deleteTask={deleteTask}
											saveTask={saveTask}
											completeTask={completeTask}
											uncompleteTask={uncompleteTask}
											countTasks={countTasks}
											scheduleTask={scheduleTask}
											handleDnd={handleDnd}
										/>
									)}
									{scheduleViewActive && (
										<ScheduleView
											appointments={tasks
												.filter((task) => task.category === "scheduled")
												.map((task) => {
													return {
														startDate: task.startDate,
														endDate: task.endDate,
														title: task.desc,
														id: task.id,
													};
												})}
											addAppointment={addAppointment}
											changeAppointment={changeAppointment}
											deleteAppointment={deleteAppointment}
										/>
									)}
								</div>
								{isMobile && (
									<MobileFooter
										addTask={addTask}
										taskViewButton={handleTaskButton}
										scheduleViewButton={handleScheduleButton}
										taskViewActive={taskViewActive}
										scheduleViewActive={scheduleViewActive}
									/>
								)}
							</div>
						</PrivateRoute>
					}
				/>
				<Route path="/signup" element={<Signup />} />
				<Route path="/login" element={<Login />} />
				<Route path="/forgot-password" element={<ForgotPassword />} />
			</Routes>
		</Router>
	);
}

export default App;
