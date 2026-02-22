import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  Grid,
  GridItem,
  Badge,
} from "@chakra-ui/react";
import { FaCode, FaGithub } from "react-icons/fa";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import API from "../api";
import { socket } from "../socket";
import DocumentEditor from "../components/DocumentEditor";
import ChatRoom from "../components/ChatRoom";
import UserPresence from "../components/UserPresence";
import ProgressWidget from "../components/dashboard/ProgressWidget";
import ActivityFeed from "../components/dashboard/ActivityFeed";
import MembersWidget from "../components/dashboard/MembersWidget";
import FileUploadsWidget from "../components/dashboard/FileUploadsWidget";
import DeadlineWidget from "../components/dashboard/DeadlineWidget";
import ChatPreviewWidget from "../components/dashboard/ChatPreviewWidget";
import Sidebar from "../components/Sidebar";
import KanbanBoard from "../components/KanbanBoard";
// Team Collaboration: Manage workspace members and invitations
import TeamManagement from "../components/TeamManagement";

const Workspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("overview");

  const bg = "transparent";
  const cardBg = "rgba(26, 26, 31, 0.8)";
  const borderColor = "rgba(255, 255, 255, 0.05)";

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    const fetchWorkspace = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await API.get(`/workspaces/${id}`);
        if (!isMounted) return;

        setWorkspace(res.data.workspace);
        setNotes(res.data.notes || []);
        setTasks(res.data.tasks || []);
        setMessages(res.data.messages || []);
        setDocuments(res.data.documents || []);

        if (!selectedDocumentId && res.data.documents?.length) {
          setSelectedDocumentId(res.data.documents[0]._id);
        }
      } catch (err) {
        if (!isMounted) return;

        if (err.response?.status === 401) {
          navigate("/", { replace: true });
          return;
        }

        if (err.response?.status === 403 || err.response?.status === 404) {
          setError(err.response.data?.msg || "Unable to load workspace.");
        } else {
          setError("Failed to load workspace. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchWorkspace();

    // Join workspace for real-time collab
    socket.emit("joinWorkspace", { workspaceId: id });

    // Listen for new messages
    socket.on("message:new", (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    // --- Document Listeners ---
    socket.on("workspace:documentCreated", (data) => {
      if (data.workspaceId === id) {
        setDocuments((prev) => [data.document, ...prev]);
        if (!selectedDocumentId) setSelectedDocumentId(data.document._id);
      }
    });

    socket.on("workspace:documentUpdated", (data) => {
      if (data.workspaceId === id) {
        setDocuments((prev) =>
          prev.map((doc) => (doc._id === data.documentId ? data.document : doc))
        );
      }
    });

    socket.on("workspace:documentDeleted", (data) => {
      if (data.workspaceId === id) {
        setDocuments((prev) => prev.filter((doc) => doc._id !== data.documentId));
        if (selectedDocumentId === data.documentId) setSelectedDocumentId(null);
      }
    });

    // Listen for document cell edit events
    socket.on("document:cellUpdated", ({ documentId, cell, value, userId }) => {
      if (selectedDocumentId === documentId) {
        setDocuments((prev) =>
          prev.map((doc) => {
            if (doc._id === documentId) {
              const newData = [...(doc.data || [])];
              const [row, col] = cell.split("-").map(Number);
              if (!newData[row]) newData[row] = [];
              newData[row][col] = value;
              return { ...doc, data: newData };
            }
            return doc;
          }),
        );
      }
    });

    // --- Note Listeners ---
    socket.on("workspace:noteCreated", (data) => {
      if (data.workspaceId === id) {
        setNotes((prev) => [data.note, ...prev]);
      }
    });

    socket.on("workspace:noteUpdated", (data) => {
      if (data.workspaceId === id) {
        setNotes((prev) =>
          prev.map((note) => (note._id === data.note._id ? data.note : note))
        );
      }
    });

    socket.on("workspace:noteDeleted", (data) => {
      if (data.workspaceId === id) {
        setNotes((prev) => prev.filter((note) => note._id !== data.noteId));
      }
    });

    return () => {
      isMounted = false;
      socket.emit("leaveWorkspace", { workspaceId: id });
      socket.off("message:new");
      socket.off("document:cellUpdated");
      socket.off("workspace:documentCreated");
      socket.off("workspace:documentUpdated");
      socket.off("workspace:documentDeleted");
      socket.off("workspace:noteCreated");
      socket.off("workspace:noteUpdated");
      socket.off("workspace:noteDeleted");
    };
  }, [id, navigate, selectedDocumentId]);

  const selectedDocument = useMemo(
    () => documents.find((d) => d._id === selectedDocumentId) || null,
    [documents, selectedDocumentId],
  );

  const handleMessageSent = (message) => {
    setMessages((prev) => {
      if (prev.some((m) => m._id === message._id)) {
        return prev;
      }
      return [...prev, message];
    });
  };

  return (
    <Box minH="100vh" bg={bg}>
      <Box maxW="7xl" mx="auto" py={8} px={4}>
        <HStack justify="space-between" align="center" mb={6}>
          <VStack align="start" spacing={1}>
            <Heading size="lg">{workspace?.name || "Workspace"}</Heading>
            {workspace?.description && (
              <Text fontSize="sm" color="gray.500">
                {workspace.description}
              </Text>
            )}
            {workspace?.currentUserRole && (
              <Badge colorScheme="blue" fontSize="xs">
                {workspace.currentUserRole}
              </Badge>
            )}
          </VStack>
          <Button as={RouterLink} to="/workspaces" variant="ghost" size="sm">
            Back to workspaces
          </Button>
        </HStack>

        {loading && (
          <Box py={20} textAlign="center">
            <Spinner size="lg" />
          </Box>
        )}

        {!loading && error && (
          <Alert status="error" mb={6}>
            <AlertIcon />
            {error}
          </Alert>
        )}

        {!loading && !error && workspace && (
          <Flex align="flex-start" gap={6}>
            <Sidebar
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />
            <Box flex="1" minW={0} p={6}>
              {activeSection === "overview" && (
                <VStack align="stretch" spacing={6}>
                  {/* Project Metadata */}
                  <Box
                    bg={cardBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                    rounded="lg"
                    p={6}
                  >
                    <VStack align="start" spacing={4}>
                      <Heading size="md">Project Overview</Heading>
                      <Text fontSize="sm" color="gray.600">
                        {workspace.description || "No description provided."}
                      </Text>
                      <HStack spacing={4}>
                        <Badge colorScheme="blue" fontSize="sm">
                          Created{" "}
                          {new Date(workspace.createdAt).toLocaleDateString()}
                        </Badge>
                        {workspace.deadline && (
                          <Badge colorScheme="orange" fontSize="sm">
                            Deadline:{" "}
                            {new Date(workspace.deadline).toLocaleDateString()}
                          </Badge>
                        )}
                      </HStack>
                    </VStack>
                  </Box>

                  {/* Dashboard Widgets Grid */}
                  <Grid
                    templateColumns={{
                      base: "1fr",
                      md: "repeat(2, 1fr)",
                      lg: "repeat(3, 1fr)",
                    }}
                    gap={6}
                  >
                    <GridItem>
                      <DeadlineWidget
                        deadline={workspace.deadline}
                        loading={loading}
                      />
                    </GridItem>
                    <GridItem>
                      <ProgressWidget tasks={tasks} loading={loading} />
                    </GridItem>
                    <GridItem>
                      <MembersWidget
                        members={workspace.members || []}
                        loading={loading}
                      />
                    </GridItem>
                    <GridItem>
                      <ActivityFeed
                        workspaceId={workspace._id}
                        loading={loading}
                      />
                    </GridItem>
                    <GridItem>
                      <FileUploadsWidget
                        documents={documents}
                        loading={loading}
                      />
                    </GridItem>
                    <GridItem>
                      <ChatPreviewWidget
                        messages={messages}
                        loading={loading}
                      />
                    </GridItem>
                  </Grid>
                </VStack>
              )}

              {activeSection === "chat" && (
                <VStack align="stretch" spacing={6}>
                  <UserPresence workspaceId={workspace._id} />
                  <ChatRoom
                    workspaceId={workspace._id}
                    messages={messages}
                    onMessageSent={handleMessageSent}
                  />
                </VStack>
              )}

              {activeSection === "tasks" && (
                <KanbanBoard
                  workspaceId={workspace._id}
                  tasks={tasks}
                  onTaskUpdate={(updatedTask) => {
                    if (updatedTask.deleted) {
                      setTasks((prev) =>
                        prev.filter((t) => t._id !== updatedTask._id),
                      );
                    } else {
                      setTasks((prev) =>
                        prev.map((t) =>
                          t._id === updatedTask._id ? updatedTask : t,
                        ),
                      );
                    }
                  }}
                />
              )}

              {activeSection === "files" && (
                <Box
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                  rounded="lg"
                  p={4}
                >
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between" align="center">
                      <Heading size="sm">Documents</Heading>
                      {documents.length > 0 && (
                        <HStack spacing={2}>
                          {documents.map((doc) => (
                            <Badge
                              key={doc._id}
                              as="button"
                              onClick={() => setSelectedDocumentId(doc._id)}
                              variant={
                                doc._id === selectedDocumentId
                                  ? "solid"
                                  : "subtle"
                              }
                              colorScheme={
                                doc._id === selectedDocumentId ? "blue" : "gray"
                              }
                            >
                              {doc.name}
                            </Badge>
                          ))}
                        </HStack>
                      )}
                    </HStack>

                    {documents.length === 0 && (
                      <Text fontSize="sm" color="gray.500">
                        No documents yet. Upload CSV/XLSX/XLS for realtime
                        collaboration or PDF for storage/download.
                      </Text>
                    )}

                    {selectedDocument && (
                      <DocumentEditor
                        workspaceId={workspace._id}
                        document={selectedDocument}
                        onUpdate={() => {
                          API.get(`/workspaces/${workspace._id}`).then(
                            (res) => {
                              setDocuments(res.data.documents || []);
                            },
                          );
                        }}
                      />
                    )}
                  </VStack>
                </Box>
              )}

              {activeSection === "notes" && (
                <Box
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                  rounded="lg"
                  p={4}
                >
                  <Heading size="sm" mb={3}>
                    Notes
                  </Heading>
                  {notes.length === 0 ? (
                    <Text fontSize="sm" color="gray.500">
                      No notes yet. Use the API to create notes for this
                      workspace.
                    </Text>
                  ) : (
                    <VStack align="stretch" spacing={3}>
                      {notes.map((note) => (
                        <Box
                          key={note._id}
                          borderWidth="1px"
                          borderColor={borderColor}
                          rounded="md"
                          p={3}
                        >
                          <Text fontSize="sm">{note.content}</Text>
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            {note.author?.displayName ||
                              note.author?.username ||
                              "Unknown"}{" "}
                            ·{" "}
                            {new Date(note.updatedAt).toLocaleString(
                              undefined,
                              {
                                dateStyle: "short",
                                timeStyle: "short",
                              },
                            )}
                          </Text>
                        </Box>
                      ))}
                    </VStack>
                  )}
                </Box>
              )}

              {activeSection === "activity" && (
                <ActivityFeed workspaceId={workspace._id} loading={false} />
              )}

              {/* Team Collaboration: Team Management Section */}
              {activeSection === "team" && (
                <TeamManagement
                  workspaceId={workspace._id}
                  currentUserRole={workspace.currentUserRole}
                  onUpdate={() => {
                    // Reload workspace to get updated members
                    API.get(`/workspaces/${workspace._id}`).then((res) => {
                      setWorkspace(res.data.workspace);
                    });
                  }}
                />
              )}

              {activeSection === "code" && (
                <Box
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                  rounded="lg"
                  p={4}
                >
                  <VStack align="center" spacing={4} py={20}>
                    <FaCode size="48px" color="gray" />
                    <Heading size="md" color="gray.500">
                      Code Collaboration
                    </Heading>
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      Advanced coding features will be available in Phase 3.
                      <br />
                      For now, connect GitHub repositories from the Repositories
                      page.
                    </Text>
                    <Button
                      as={RouterLink}
                      to="/repos"
                      colorScheme="blue"
                      leftIcon={<FaGithub />}
                    >
                      View Repositories
                    </Button>
                  </VStack>
                </Box>
              )}
            </Box>
          </Flex>
        )}
      </Box>
    </Box>
  );
};

export default Workspace;


