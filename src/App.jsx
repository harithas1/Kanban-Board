import { useEffect, useState } from "react";
import { CirclePlus, Edit, Pencil, Trash, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function KanbanBoard() {
  const [tasks, setTasks] = useState({});
  const [draggedTask, setDraggedTask] = useState(null);
  const [addTask, setAddTask] = useState({ add: false, column: "" });
  const [newTask, setNewTask] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [newColumnName, setNewColumnName] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("kanban-tasks-v2");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setTasks(parsed);
        }
      } catch (e) {
        console.error("Failed to parse tasks:", e);
      }
    } else {
      setTasks({ "To Do": [], "In Progress": [], Done: [] });
    }
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem("kanban-tasks-v2", JSON.stringify(tasks));
    }
  }, [tasks, hasLoaded]);

  const handleAddTask = (columnName) =>
    setAddTask({ add: true, column: columnName });

  const addNewTask = (e, column) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const newTaskObj = { id: uuidv4(), text: newTask.trim() };
    setTasks((prev) => ({
      ...prev,
      [column]: [...prev[column], newTaskObj],
    }));
    setNewTask("");
    setAddTask({ add: false, column: "" });
  };

  const handleEditSave = (column, taskId) => {
    if (!editedText.trim()) return;
    setTasks((prev) => ({
      ...prev,
      [column]: prev[column].map((t) =>
        t.id === taskId ? { ...t, text: editedText } : t
      ),
    }));
    setEditingTask(null);
    setEditedText("");
  };

  const handleDeleteTask = (column, taskId) => {
    setTasks((prev) => ({
      ...prev,
      [column]: prev[column].filter((t) => t.id !== taskId),
    }));
  };

  const handleDeleteColumn = (column) => {
    const updated = { ...tasks };
    delete updated[column];
    setTasks(updated);
  };

  const handleAddColumn = (e) => {
    e.preventDefault();
    const name = newColumnName.trim();
    if (!name || tasks[name]) return;
    setTasks((prev) => ({ ...prev, [name]: [] }));
    setNewColumnName("");
  };

  const handleDragStart = (task, column) => {
    setDraggedTask({ task, column });
  };

  const handleDrop = (targetColumn) => {
    if (!draggedTask) return;
    const { task, column: fromColumn } = draggedTask;
    if (fromColumn === targetColumn) return;

    setTasks((prev) => {
      const updated = { ...prev };
      updated[fromColumn] = updated[fromColumn].filter((t) => t.id !== task.id);
      updated[targetColumn] = [...updated[targetColumn], task];
      return updated;
    });

    setDraggedTask(null);
  };

  const getColumnColor = (column) => {
    const baseColors = {
      "To Do": "bg-rose-200",
      "In Progress": "bg-blue-200",
      "Done": "bg-green-200",
    };
    return baseColors[column] || "text-gray-500";
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 p-6 font-sans">
      {/* Add Column Form */}
      <form
        onSubmit={handleAddColumn}
        className="flex gap-2 items-center bg-white shadow-sm rounded-lg p-4 max-w-xl mx-auto mb-6 border"
      >
        <input
          type="text"
          placeholder="New Column"
          value={newColumnName}
          onChange={(e) => setNewColumnName(e.target.value)}
          className="flex-1 border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition font-semibold"
        >
          Add Column
        </button>
      </form>

      {/* Columns Grid */}
      <div className="w-full max-w-screen-2xl mx-auto px-4 grid gap-6 grid-cols-[repeat(auto-fit,minmax(204px,1fr))]">
        {Object.entries(tasks).map(([column, taskList]) => (
          <Card
            key={column}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(column)}
            className="flex flex-col border shadow-md"
          >
            <CardHeader
              className={`flex flex-row items-center justify-between p-4 border-b ${getColumnColor(
                column
              )}`}
            >
              <CardTitle className="text-lg font-bold truncate">
                {column}
              </CardTitle>
              <div className="flex gap-2">
                <CirclePlus
                  className="text-blue-500 cursor-pointer hover:text-blue-700"
                  onClick={() => handleAddTask(column)}
                />
                <Trash2
                  className="text-red-500 cursor-pointer hover:text-red-700"
                  onClick={() => handleDeleteColumn(column)}
                />
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4 p-4 pb-2 overflow-y-auto flex-grow">
              {taskList.map((task) => (
                <Card
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task, column)}
                  className="relative p-4 pb-10 border-gray-600 shadow-sm bg-white text-black cursor-grab hover:shadow-md border-2 rounded-md transition"
                >
                  {/* Label */}
                  <div
                    className={`absolute top-2 right-2 p-0.5 text-xs font-semibold ${getColumnColor(
                      column
                    )}`}
                  >
                    {column}
                  </div>

                  {/* Task Content */}
                  {editingTask?.id === task.id ? (
                    <input
                      className="mt-6 w-full text-sm p-2 border rounded focus:outline-none"
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      onBlur={() => handleEditSave(column, task.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEditSave(column, task.id);
                        if (e.key === "Escape") {
                          setEditingTask(null);
                          setEditedText("");
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <div
                      className="mt-6 text-sm pr-2"
                      onDoubleClick={() => {
                        setEditingTask(task);
                        setEditedText(task.text);
                      }}
                    >
                      {task.text}
                    </div>
                  )}

                  {/* Footer Buttons */}
                  <div className="absolute bottom-2 right-2 flex gap-2 text-gray-600">
                    <Edit
                      className="w-4 h-4 cursor-pointer hover:text-black"
                      onClick={() => {
                        setEditingTask(task);
                        setEditedText(task.text);
                      }}
                    />
                    <Trash
                      className="w-4 h-4 cursor-pointer hover:text-red-500"
                      onClick={() => handleDeleteTask(column, task.id)}
                    />
                  </div>
                </Card>
              ))}

              {/* Add Task Form */}
              {addTask.add && addTask.column === column && (
                <form
                  onSubmit={(e) => addNewTask(e, column)}
                  className="bg-gray-100 p-2 rounded-md flex flex-col gap-2 shadow-inner"
                >
                  <input
                    className="p-2 border rounded focus:outline-none"
                    placeholder="New task"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                  />
                  <button
                    type="submit"
                    className={`text-white px-3 py-1 rounded-md font-semibold ${
                      newTask.trim()
                        ? "bg-blue-500 hover:bg-blue-600"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                    disabled={!newTask.trim()}
                  >
                    Add Task
                  </button>
                </form>
              )}
            </CardContent>

            <CardFooter
              className={`text-xs text-gray-500 px-4 py-2 border-t flex justify-end ${getColumnColor(
                column
              )}`}
            >
              {taskList.length} {taskList.length === 1 ? "task" : "tasks"}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
