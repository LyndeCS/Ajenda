import React, { useState, useEffect } from "react";
import TaskView from "./TaskView";
import ScheduleView from "./ScheduleView";
import { nanoid } from "nanoid";
import "./css/App.css";

const LOCAL_STORAGE_KEY = "ajenda.tasks";

const currentDate = new Date();

function App() {
	const [tasks, setTasks] = useState([]);

	function addTask(desc) {
		const newTask = {
			id: "task-" + nanoid(),
			desc: desc,
			completed: false,
			category: "unscheduled",
			startDate: "",
			endDate: "",
		};
		setTasks([...tasks, newTask]);
	}

	function saveTask(id, desc, scheduledStart, scheduledEnd) {
		const updatedTasks = tasks.map((task) => {
			if (id === task.id) {
				return {
					...task,
					desc: desc,
					startDate: scheduledStart,
					endDate: scheduledEnd,
				};
			}
			return task;
		});
		setTasks(updatedTasks);
	}

	function completeTask(id) {
		const updatedTasks = tasks.map((task) => {
			if (id === task.id) {
				return {
					...task,
					completed: !task.completed,
					category: !task.completed ? "completed" : task.category,
				};
			}
			return task;
		});
		setTasks(updatedTasks);
	}

	function deleteTask(id) {
		const taskToDelete = tasks.find((task) => task.id === id);

		// prompt to confirm delete if task has description
		if (taskToDelete.desc) {
			if (window.confirm("Delete?")) {
				setTasks(tasks.filter((task) => task.id !== id));
			}
		}

		// delete task without prompt if it has no description
		else {
			setTasks(tasks.filter((task) => task.id !== id));
		}
	}

	function countTasks(category) {
		const count = tasks.filter((task) => task.category === category).length;
		return count;
	}

	function scheduleTask(input) {
		console.log(input);
	}

	function sortTasks() {
		const incompleteTasks = tasks.filter((task) => !task.completed);
		const completedTasks = tasks.filter((task) => task.completed);
		const sortedTasks = [...incompleteTasks, ...completedTasks];
		setTasks(sortedTasks);
	}

	useEffect(() => {
		const storedTasks = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
		if (storedTasks) setTasks(storedTasks);
	}, []);
	useEffect(() => {
		localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
	}, [tasks]);

	return (
		<div className="App">
			<TaskView
				tasks={tasks}
				addTask={addTask}
				deleteTask={deleteTask}
				saveTask={saveTask}
				completeTask={completeTask}
				sortTasks={sortTasks}
				countTasks={countTasks}
				scheduleTask={scheduleTask}
			/>
			<ScheduleView tasks={tasks} />
		</div>
	);
}

export default App;
