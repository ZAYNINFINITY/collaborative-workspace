import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useDisclosure,
  Avatar,
  Collapse,
  Divider,
  Flex,
  Badge,
} from "@chakra-ui/react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  FaPlus,
  FaCalendarAlt,
  FaPaperclip,
  FaComment,
  FaChevronDown,
  FaChevronUp,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import API from "../api";
import { socket } from "../socket";

const KanbanBoard = ({ workspaceId, tasks, onTaskUpdate }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    assignee: "",
    deadline: "",
  });
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [members, setMembers] = useState([]);
  const [documents, setDocuments] = useState([]);

  // ✨ Gemini Color Tokens
  const textPrimary = "white";
  // const "rgba(255, 255, 255, 0.7)" = "rgba(255, 255, 255, 0.7)";
  const textTertiary = "rgba(255, 255, 255, 0.5)";
  const cardBg = "rgba(26, 26, 31, 0.5)";
  const columnBg = "rgba(255, 255, 255, 0.02)";
  const columnOpacity = 0.4;

  useEffect(() => {
    // Fetch workspace members and documents for task assignment and attachments
    const fetchWorkspaceData = async () => {
      try {
        const res = await API.get(`/workspaces/${workspaceId}`);
        setMembers(res.data.workspace.members || []);
        setDocuments(res.data.documents || []);
      } catch (err) {
        // Error handled by parent component
      }
    };

    fetchWorkspaceData();

    // Listen for real-time task updates
    socket.on("workspace:taskUpdated", (data) => {
      if (data.workspaceId === workspaceId) {
        onTaskUpdate(data.task);
      }
    });

    socket.on("workspace:taskCreated", (data) => {
      if (data.workspaceId === workspaceId) {
        onTaskUpdate(data.task);
      }
    });

    socket.on("workspace:taskDeleted", (data) => {
      if (data.workspaceId === workspaceId) {
        onTaskUpdate({ _id: data.taskId, deleted: true });
      }
    });

    return () => {
      socket.off("workspace:taskUpdated");
      socket.off("workspace:taskCreated");
      socket.off("workspace:taskDeleted");
    };
  }, [workspaceId, onTaskUpdate]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const task = tasks.find((t) => t._id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId;
    const newOrder = destination.index;

    try {
      // Update task status and order
      await API.put(`/workspaces/${workspaceId}/tasks/${task._id}`, {
        status: newStatus,
        order: newOrder,
      });

      // Optimistically update local state
      const updatedTask = { ...task, status: newStatus, order: newOrder };
      onTaskUpdate(updatedTask);
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const handleCreateTask = async () => {
    try {
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        assignee: newTask.assignee || null,
        deadline: newTask.deadline || null,
      };

      const res = await API.post(`/workspaces/${workspaceId}/tasks`, taskData);
      onTaskUpdate(res.data);

      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        assignee: "",
        deadline: "",
      });
      onClose();
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const handleEditTask = async (taskId, updates) => {
    try {
      const res = await API.put(
        `/workspaces/${workspaceId}/tasks/${taskId}`,
        updates,
      );
      onTaskUpdate(res.data);
    } catch (err) {
      console.error("Failed to edit task:", err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await API.delete(`/workspaces/${workspaceId}/tasks/${taskId}`);
      onTaskUpdate({ _id: taskId, deleted: true });
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#ef4444"; // Red
      case "medium":
        return "#fbbf24"; // Amber
      case "low":
        return "#10b981"; // Green
      default:
        return "#3b82f6"; // Blue
    }
  };

  const getPriorityBgColor = (priority) => {
    switch (priority) {
      case "high":
        return "rgba(239, 68, 68, 0.2)";
      case "medium":
        return "rgba(251, 191, 36, 0.2)";
      case "low":
        return "rgba(16, 185, 129, 0.2)";
      default:
        return "rgba(59, 130, 246, 0.2)";
    }
  };

  const getPriorityborderColor = (priority) => {
    switch (priority) {
      case "high":
        return "rgba(239, 68, 68, 0.3)";
      case "medium":
        return "rgba(251, 191, 36, 0.3)";
      case "low":
        return "rgba(16, 185, 129, 0.3)";
      default:
        return "rgba(59, 130, 246, 0.3)";
    }
  };

  const getDeadlineStatus = (deadline) => {
    if (!deadline) return null;

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0)
      return {
        status: "Overdue",
        color: "#ef4444",
        bgColor: "rgba(239, 68, 68, 0.2)",
      };
    if (daysLeft === 0)
      return {
        status: "Today",
        color: "#fbbf24",
        bgColor: "rgba(251, 191, 36, 0.2)",
      };
    if (daysLeft <= 3)
      return {
        status: "Urgent",
        color: "#f97316",
        bgColor: "rgba(249, 115, 22, 0.2)",
      };

    return null;
  };

  const groupedTasks = {
    todo: tasks
      .filter((t) => t.status === "todo")
      .sort((a, b) => a.order - b.order),
    in_progress: tasks
      .filter((t) => t.status === "in_progress")
      .sort((a, b) => a.order - b.order),
    done: tasks
      .filter((t) => t.status === "done")
      .sort((a, b) => a.order - b.order),
  };

  // ✨ Glasmorphic Task Card
  const TaskCard = ({ task, index }) => {
    const deadlineStatus = getDeadlineStatus(task.deadline);
    const isExpanded = expandedTasks.has(task._id);

    return (
      <Draggable draggableId={task._id} index={index}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            bg={cardBg}
            borderWidth="1px"
            borderColor="rgba(255, 255, 255, 0.05)"
            borderRadius="12px"
            p={3}
            mb={2}
            boxShadow={
              snapshot.isDragging
                ? "0 16px 32px rgba(0, 0, 0, 0.6)"
                : "0 4px 16px rgba(0, 0, 0, 0.4)"
            }
            transition="all 0.2s ease"
            _hover={{
              bg: "rgba(26, 26, 31, 0.7)",
              borderColor: "rgba(255, 255, 255, 0.1)",
              boxShadow:
                "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.2)",
            }}
          >
            <VStack align="stretch" spacing={2}>
              <Flex align="center" justify="space-between">
                <Text
                  fontWeight="600"
                  fontSize="sm"
                  color={textPrimary}
                  noOfLines={2}
                >
                  {task.title}
                </Text>
                <HStack spacing={1}>
                  <Badge
                    bg={getPriorityBgColor(task.priority)}
                    borderColor={getPriorityborderColor(task.priority)}
                    border="1px solid"
                    color={getPriorityColor(task.priority)}
                    fontSize="xs"
                    fontWeight="600"
                  >
                    {task.priority}
                  </Badge>
                  {deadlineStatus && (
                    <Badge
                      bg={deadlineStatus.bgColor}
                      borderColor={`${deadlineStatus.color}40`}
                      border="1px solid"
                      color={deadlineStatus.color}
                      fontSize="xs"
                      fontWeight="600"
                    >
                      {deadlineStatus.status}
                    </Badge>
                  )}
                </HStack>
              </Flex>

              {task.description && (
                <Text fontSize="xs" color={"rgba(255, 255, 255, 0.7)"} noOfLines={2}>
                  {task.description}
                </Text>
              )}

              <Flex align="center" justify="space-between">
                <HStack spacing={2}>
                  {task.assignee && (
                    <HStack spacing={1}>
                      <Avatar
                        size="xs"
                        name={
                          task.assignee.displayName || task.assignee.username
                        }
                      />
                      <Text fontSize="xs" color={textTertiary}>
                        {task.assignee.displayName || task.assignee.username}
                      </Text>
                    </HStack>
                  )}
                  {task.deadline && (
                    <HStack spacing={1} color={textTertiary}>
                      <FaCalendarAlt size="10px" />
                      <Text fontSize="xs">
                        {new Date(task.deadline).toLocaleDateString()}
                      </Text>
                    </HStack>
                  )}
                </HStack>

                <HStack spacing={1} color={textTertiary}>
                  {task.attachments && task.attachments.length > 0 && (
                    <HStack spacing={1}>
                      <FaPaperclip size="10px" />
                      <Text fontSize="xs">{task.attachments.length}</Text>
                    </HStack>
                  )}
                  {task.comments && task.comments.length > 0 && (
                    <HStack spacing={1}>
                      <FaComment size="10px" />
                      <Text fontSize="xs">{task.comments.length}</Text>
                    </HStack>
                  )}
                </HStack>
              </Flex>

              <Button
                size="xs"
                variant="ghost"
                justifyContent="flex-start"
                onClick={() => {
                  setExpandedTasks((prev) => {
                    const next = new Set(prev);
                    if (next.has(task._id)) {
                      next.delete(task._id);
                    } else {
                      next.add(task._id);
                    }
                    return next;
                  });
                }}
                rightIcon={
                  isExpanded ? (
                    <FaChevronUp size="12px" />
                  ) : (
                    <FaChevronDown size="12px" />
                  )
                }
              >
                {isExpanded ? "Hide" : "Show"} Details
              </Button>

              <Collapse in={isExpanded} animateOpacity>
                <Box>
                  <Divider my={2} borderColor="rgba(255, 255, 255, 0.1)" />

                  <VStack align="stretch" spacing={2}>
                    {task.comments && task.comments.length > 0 && (
                      <Box>
                        <Text
                          fontSize="xs"
                          fontWeight="600"
                          color={"rgba(255, 255, 255, 0.7)"}
                          mb={1}
                        >
                          Comments
                        </Text>
                        <VStack align="stretch" spacing={1}>
                          {task.comments.slice(0, 3).map((comment) => (
                            <Box
                              key={comment._id}
                              fontSize="xs"
                              color={textTertiary}
                              p={2}
                              bg="rgba(255, 255, 255, 0.02)"
                              borderRadius="6px"
                            >
                              {comment.text}
                            </Box>
                          ))}
                        </VStack>
                      </Box>
                    )}

                    <HStack spacing={2}>
                      <Button
                        size="xs"
                        leftIcon={<FaEdit />}
                        bg="rgba(59, 130, 246, 0.2)"
                        color="#3b82f6"
                        border="1px solid rgba(59, 130, 246, 0.3)"
                        _hover={{ bg: "rgba(59, 130, 246, 0.3)" }}
                        onClick={() => setSelectedTask(task)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        leftIcon={<FaTrash />}
                        bg="rgba(239, 68, 68, 0.2)"
                        color="#ef4444"
                        border="1px solid rgba(239, 68, 68, 0.3)"
                        _hover={{ bg: "rgba(239, 68, 68, 0.3)" }}
                        onClick={() => handleDeleteTask(task._id)}
                      >
                        Delete
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
              </Collapse>
            </VStack>
          </Box>
        )}
      </Draggable>
    );
  };

  // ✨ Ghost Translucent Task Column
  const TaskColumn = ({ title, taskIds, droppableId }) => (
    <Box flex="1" minH="500px">
      <Box
        bg={columnBg}
        borderWidth="1px"
        borderColor="rgba(255, 255, 255, 0.05)"
        borderRadius="16px"
        opacity={columnOpacity}
        p={3}
        mb={4}
        transition="all 0.3s ease"
        _hover={{
          opacity: 0.5,
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}
      >
        <HStack justify="space-between" mb={3}>
          <Text fontWeight="600" fontSize="sm" color={textPrimary}>
            {title}
          </Text>
          <Badge
            bg="rgba(59, 130, 246, 0.2)"
            color="#3b82f6"
            border="1px solid rgba(59, 130, 246, 0.3)"
            fontSize="xs"
            fontWeight="600"
          >
            {taskIds.length}
          </Badge>
        </HStack>

        <Droppable droppableId={droppableId}>
          {(provided, snapshot) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              minH="400px"
              bg={
                snapshot.isDraggingOver
                  ? "rgba(59, 130, 246, 0.1)"
                  : "transparent"
              }
              borderRadius="12px"
              p={2}
              transition="all 0.2s ease"
            >
              {taskIds.map((task, index) => (
                <TaskCard key={task._id} task={task} index={index} />
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </Box>
    </Box>
  );

  return (
    <Box>
      {/* ✨ Header */}
      <HStack justify="space-between" align="center" mb={6}>
        <Text fontSize="lg" fontWeight="700" color={textPrimary}>
          Task Board
        </Text>
        <Button
          leftIcon={<FaPlus />}
          bg="rgba(59, 130, 246, 0.2)"
          border="1px solid rgba(59, 130, 246, 0.3)"
          color="#3b82f6"
          size="sm"
          transition="all 0.2s ease"
          _hover={{
            bg: "rgba(59, 130, 246, 0.3)",
            boxShadow: "0 0 30px rgba(59, 130, 246, 0.3)",
          }}
          onClick={onOpen}
        >
          Add Task
        </Button>
      </HStack>

      {/* ✨ Kanban Columns */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <HStack align="start" spacing={4}>
          <TaskColumn
            title="To Do"
            taskIds={groupedTasks.todo}
            droppableId="todo"
          />
          <TaskColumn
            title="In Progress"
            taskIds={groupedTasks.in_progress}
            droppableId="in_progress"
          />
          <TaskColumn
            title="Done"
            taskIds={groupedTasks.done}
            droppableId="done"
          />
        </HStack>
      </DragDropContext>

      {/* Create Task Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent
          bg="rgba(26, 26, 31, 0.95)"
          borderColor="rgba(255, 255, 255, 0.1)"
        >
          <ModalHeader color={textPrimary}>Create New Task</ModalHeader>
          <ModalCloseButton color={"rgba(255, 255, 255, 0.7)"} />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel color={"rgba(255, 255, 255, 0.7)"}>Title</FormLabel>
                <Input
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  placeholder="Enter task title"
                  bg="rgba(255, 255, 255, 0.05)"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  color={textPrimary}
                />
              </FormControl>

              <FormControl>
                <FormLabel color={"rgba(255, 255, 255, 0.7)"}>Description</FormLabel>
                <Textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  placeholder="Enter task description"
                  bg="rgba(255, 255, 255, 0.05)"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  color={textPrimary}
                />
              </FormControl>

              <FormControl>
                <FormLabel color={"rgba(255, 255, 255, 0.7)"}>Priority</FormLabel>
                <Select
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask({ ...newTask, priority: e.target.value })
                  }
                  bg="rgba(255, 255, 255, 0.05)"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  color={textPrimary}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel color={"rgba(255, 255, 255, 0.7)"}>Assignee</FormLabel>
                <Select
                  value={newTask.assignee}
                  onChange={(e) =>
                    setNewTask({ ...newTask, assignee: e.target.value })
                  }
                  bg="rgba(255, 255, 255, 0.05)"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  color={textPrimary}
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.user._id} value={member.user._id}>
                      {member.user.displayName || member.user.username}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel color={"rgba(255, 255, 255, 0.7)"}>Deadline</FormLabel>
                <Input
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) =>
                    setNewTask({ ...newTask, deadline: e.target.value })
                  }
                  bg="rgba(255, 255, 255, 0.05)"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  color={textPrimary}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={onClose}
              color={"rgba(255, 255, 255, 0.7)"}
            >
              Cancel
            </Button>
            <Button
              bg="rgba(59, 130, 246, 0.2)"
              color="#3b82f6"
              border="1px solid rgba(59, 130, 246, 0.3)"
              onClick={handleCreateTask}
            >
              Create Task
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Task Modal */}
      {selectedTask && (
        <Modal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)}>
          <ModalOverlay />
          <ModalContent
            bg="rgba(26, 26, 31, 0.95)"
            borderColor="rgba(255, 255, 255, 0.1)"
          >
            <ModalHeader color={textPrimary}>Edit Task</ModalHeader>
            <ModalCloseButton color={"rgba(255, 255, 255, 0.7)"} />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel color={"rgba(255, 255, 255, 0.7)"}>Title</FormLabel>
                  <Input
                    value={selectedTask.title}
                    onChange={(e) =>
                      setSelectedTask({
                        ...selectedTask,
                        title: e.target.value,
                      })
                    }
                    bg="rgba(255, 255, 255, 0.05)"
                    borderColor="rgba(255, 255, 255, 0.1)"
                    color={textPrimary}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={"rgba(255, 255, 255, 0.7)"}>Description</FormLabel>
                  <Textarea
                    value={selectedTask.description || ""}
                    onChange={(e) =>
                      setSelectedTask({
                        ...selectedTask,
                        description: e.target.value,
                      })
                    }
                    bg="rgba(255, 255, 255, 0.05)"
                    borderColor="rgba(255, 255, 255, 0.1)"
                    color={textPrimary}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={"rgba(255, 255, 255, 0.7)"}>Priority</FormLabel>
                  <Select
                    value={selectedTask.priority || "medium"}
                    onChange={(e) =>
                      setSelectedTask({
                        ...selectedTask,
                        priority: e.target.value,
                      })
                    }
                    bg="rgba(255, 255, 255, 0.05)"
                    borderColor="rgba(255, 255, 255, 0.1)"
                    color={textPrimary}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel color={"rgba(255, 255, 255, 0.7)"}>Assignee</FormLabel>
                  <Select
                    value={selectedTask.assignee?._id || ""}
                    onChange={(e) =>
                      setSelectedTask({
                        ...selectedTask,
                        assignee: e.target.value,
                      })
                    }
                    bg="rgba(255, 255, 255, 0.05)"
                    borderColor="rgba(255, 255, 255, 0.1)"
                    color={textPrimary}
                  >
                    <option value="">Unassigned</option>
                    {members.map((member) => (
                      <option key={member.user._id} value={member.user._id}>
                        {member.user.displayName || member.user.username}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel color={"rgba(255, 255, 255, 0.7)"}>Deadline</FormLabel>
                  <Input
                    type="date"
                    value={
                      selectedTask.deadline
                        ? new Date(selectedTask.deadline)
                          .toISOString()
                          .split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setSelectedTask({
                        ...selectedTask,
                        deadline: e.target.value,
                      })
                    }
                    bg="rgba(255, 255, 255, 0.05)"
                    borderColor="rgba(255, 255, 255, 0.1)"
                    color={textPrimary}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="ghost"
                mr={3}
                onClick={() => setSelectedTask(null)}
                color={"rgba(255, 255, 255, 0.7)"}
              >
                Cancel
              </Button>
              <Button
                bg="rgba(59, 130, 246, 0.2)"
                color="#3b82f6"
                border="1px solid rgba(59, 130, 246, 0.3)"
                onClick={() => {
                  handleEditTask(selectedTask._id, {
                    title: selectedTask.title,
                    description: selectedTask.description,
                    priority: selectedTask.priority,
                    assignee: selectedTask.assignee,
                    deadline: selectedTask.deadline,
                  });
                  setSelectedTask(null);
                }}
              >
                Save Changes
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

export default KanbanBoard;


