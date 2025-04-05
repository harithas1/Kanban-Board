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

// No changes to imports...

export default function KanbanBoard() {
  // Same state as before...
  const [tasks, setTasks] = useState({});
  const [draggedTask, setDraggedTask] = useState(null);
  const [addTask, setAddTask] = useState({ add: false, column: "" });
  const [newTask, setNewTask] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [newColumnName, setNewColumnName] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [mobileTaskMove, setMobileTaskMove] = useState(null); // mobile fallback

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

 const handleDragStart = (e, task, column) => {
   e.dataTransfer.setData("text/plain", JSON.stringify({ task, column }));
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

  const moveMobileTask = (targetColumn) => {
    const { task, column } = mobileTaskMove;
    if (column === targetColumn) return;

    setTasks((prev) => {
      const updated = { ...prev };
      updated[column] = updated[column].filter((t) => t.id !== task.id);
      updated[targetColumn] = [...updated[targetColumn], task];
      return updated;
    });

    setMobileTaskMove(null);
  };


  return (
    <div className="min-h-screen w-full bg-gray-100 p-4 font-sans">
      {/* Add Column */}
      <form
        onSubmit={handleAddColumn}
        className="flex gap-2 items-center bg-white shadow-sm rounded-lg p-3 border w-full max-w-xl mx-auto mb-6 overflow-hidden"
      >
        <input
          type="text"
          placeholder="New Column Name"
          value={newColumnName}
          onChange={(e) => setNewColumnName(e.target.value)}
          className="flex-1 min-w-0 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
        />
        <button
          type="submit"
          className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition font-semibold relative group whitespace-nowrap"
        >
          <CirclePlus className="w-4 h-4" />
          <span className="hidden sm:inline">Create</span>
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none">
            Create Column
          </span>
        </button>
      </form>

      {/* Mobile drag fallback */}
      {mobileTaskMove && (
        <div className="fixed z-50 inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded shadow-md max-w-sm w-full">
            <h3 className="font-semibold mb-2 text-center">Move task to:</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {Object.keys(tasks)
                .filter((col) => col !== mobileTaskMove?.column)
                .map((col) => (
                  <button
                    key={col}
                    onClick={() => moveMobileTask(col)}
                    className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
                  >
                    {col}
                  </button>
                ))}
            </div>

            <button
              onClick={() => setMobileTaskMove(null)}
              className="mt-4 text-sm text-gray-500 hover:text-black w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
                  onDragStart={(e) => handleDragStart(e, task, column)}
                  onTouchStart={() => setMobileTaskMove({ task, column })}
                  className={`relative p-4 pb-10 border-gray-600 shadow-sm bg-white text-black cursor-grab hover:shadow-md border rounded-md transition ${
                    draggedTask?.task?.id === task.id ? "bg-gray-200" : ""
                  }`}
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
                      title="Edit task"
                      className="w-4 h-4 cursor-pointer hover:text-black"
                      onClick={() => {
                        setEditingTask(task);
                        setEditedText(task.text);
                      }}
                    />
                    <Trash
                      title="Delete task"
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
