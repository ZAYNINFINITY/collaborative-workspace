import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Input,
  Text,
  VStack,
  HStack,
  useColorModeValue,
  Alert,
  AlertIcon,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import { FaDownload, FaTrash, FaSave } from "react-icons/fa";
import API from "../api";
import { socket } from "../socket";

const DocumentEditor = ({ workspaceId, document, onClose, onUpdate }) => {
  const [data, setData] = useState(document.data || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cursors, setCursors] = useState({});
  const [myCursor, setMyCursor] = useState(null);
  const [saveStatus, setSaveStatus] = useState("saved");
  const saveTimeoutRef = useRef(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const debouncedSave = (currentData) => {
    setSaveStatus("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await API.put(`/workspaces/${workspaceId}/documents/${document._id}`, {
          data: currentData,
        });
        setSaveStatus("saved");
      } catch (err) {
        console.error("Auto-save error:", err);
        setSaveStatus("error");
      }
    }, 1500);
  };

  const bg = "rgba(26, 26, 31, 0.8)";
  const borderColor = "rgba(255, 255, 255, 0.05)";
  const inputBg = "rgba(59, 130, 246, 0.1)";

  useEffect(() => {
    if (!document || !workspaceId) return;

    // Join document room
    socket.emit("joinWorkspace", { workspaceId });

    // Listen for real-time updates
    socket.on("document:cellUpdated", ({ documentId, cell, value, userId }) => {
      if (documentId === document._id) {
        setData((prev) => {
          const newData = [...prev];
          const [row, col] = cell.split("-").map(Number);
          if (!newData[row]) newData[row] = [];
          newData[row][col] = value;
          return newData;
        });
      }
    });

    socket.on("document:cursorMoved", ({ documentId, cursor, userId }) => {
      if (documentId === document._id) {
        setCursors((prev) => ({
          ...prev,
          [userId]: cursor,
        }));
      }
    });

    return () => {
      socket.off("document:cellUpdated");
      socket.off("document:cursorMoved");
    };
  }, [document, workspaceId]);

  const handleCellChange = (row, col, value) => {
    const newData = [...data];
    if (!newData[row]) newData[row] = [];
    newData[row][col] = value;
    setData(newData);

    // Emit real-time update
    socket.emit("document:edit", {
      workspaceId,
      documentId: document._id,
      cell: `${row}-${col}`,
      value,
      userId: "current-user", // Replace with actual user ID
    });

    // Auto-save via debouncing
    debouncedSave(newData);
  };

  const handleCellFocus = (row, col) => {
    const cursor = { row, col };
    setMyCursor(cursor);

    socket.emit("document:cursor", {
      workspaceId,
      documentId: document._id,
      cursor,
      userId: "current-user", // Replace with actual user ID
    });
  };

  const addRow = () => {
    const newData = [...data, []];
    setData(newData);
    debouncedSave(newData);
  };

  const addColumn = () => {
    const newData = data.map((row) => [...row, ""]);
    setData(newData);
    debouncedSave(newData);
  };

  const saveDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      await API.put(`/workspaces/${workspaceId}/documents/${document._id}`, {
        data,
      });
      onUpdate && onUpdate();
    } catch (err) {
      setError("Failed to save document");
      console.error("Save error:", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async () => {
    try {
      const response = await API.get(
        `/workspaces/${workspaceId}/documents/${document._id}/download`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${document.name}.${document.type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Failed to download document");
      console.error("Download error:", err);
    }
  };

  const deleteDocument = async () => {
    try {
      setLoading(true);
      await API.delete(`/workspaces/${workspaceId}/documents/${document._id}`);
      onClose && onClose();
    } catch (err) {
      setError("Failed to delete document");
      console.error("Delete error:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderCell = (row, col) => {
    const cellId = `${row}-${col}`;
    const isMyCursor = myCursor && myCursor.row === row && myCursor.col === col;
    const otherCursors = Object.entries(cursors).filter(
      ([userId, cursor]) =>
        cursor.row === row && cursor.col === col && userId !== "current-user",
    );

    return (
      <Box
        key={cellId}
        position="relative"
        borderRight="1px solid"
        borderBottom="1px solid"
        borderColor={borderColor}
        minW="120px"
        minH="40px"
      >
        <Input
          value={data[row]?.[col] || ""}
          onChange={(e) => handleCellChange(row, col, e.target.value)}
          onFocus={() => handleCellFocus(row, col)}
          bg={inputBg}
          border="none"
          borderRadius={0}
          size="sm"
          fontSize="sm"
          _focus={{ bg: "white", boxShadow: "0 0 0 2px blue.500" }}
        />
        {isMyCursor && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            border="2px solid blue"
            pointerEvents="none"
            zIndex={10}
          />
        )}
        {otherCursors.map(([userId]) => (
          <Box
            key={userId}
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            border="2px solid red"
            pointerEvents="none"
            zIndex={5}
          />
        ))}
      </Box>
    );
  };

  const maxCols = Math.max(...data.map((row) => row.length), 1);
  const maxRows = data.length;

  return (
    <Box bg={bg} rounded="lg" p={6} boxShadow="lg" maxW="100%" overflow="auto">
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Text fontSize="xl" fontWeight="bold">
              {document.name}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {document.type.toUpperCase()} • {maxRows} rows × {maxCols} columns
            </Text>
          </VStack>
          <HStack align="center" spacing={4}>
            {saveStatus === "saving" && (
              <Text fontSize="xs" color="gray.400">
                Saving...
              </Text>
            )}
            {saveStatus === "error" && (
              <Text fontSize="xs" color="red.400">
                Save Failed
              </Text>
            )}
            {saveStatus === "saved" && (
              <Text fontSize="xs" color="green.400">
                Saved
              </Text>
            )}
            <HStack>
              <Tooltip label="Save">
                <IconButton
                  icon={<FaSave />}
                  onClick={saveDocument}
                  isLoading={loading || saveStatus === "saving"}
                  colorScheme="blue"
                  size="sm"
                />
              </Tooltip>
              <Tooltip label="Download">
                <IconButton
                  icon={<FaDownload />}
                  onClick={downloadDocument}
                  colorScheme="green"
                  size="sm"
                />
              </Tooltip>
              <Tooltip label="Delete">
                <IconButton
                  icon={<FaTrash />}
                  onClick={deleteDocument}
                  colorScheme="red"
                  size="sm"
                />
              </Tooltip>
            </HStack>
          </HStack>
        </HStack>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Box overflow="auto" maxH="60vh">
          <Box
            display="inline-block"
            border="1px solid"
            borderColor={borderColor}
          >
            {/* Header row with column letters */}
            <Box display="flex">
              <Box
                minW="40px"
                minH="40px"
                bg={inputBg}
                borderRight="1px solid"
                borderBottom="1px solid"
                borderColor={borderColor}
                display="flex"
                alignItems="center"
                justifyContent="center"
              />
              {Array.from({ length: maxCols }, (_, col) => (
                <Box
                  key={`header-${col}`}
                  minW="120px"
                  minH="40px"
                  bg={inputBg}
                  borderRight="1px solid"
                  borderBottom="1px solid"
                  borderColor={borderColor}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="bold"
                  fontSize="sm"
                >
                  {String.fromCharCode(65 + col)}
                </Box>
              ))}
            </Box>

            {/* Data rows */}
            {Array.from({ length: maxRows }, (_, row) => (
              <Box key={`row-${row}`} display="flex">
                {/* Row number */}
                <Box
                  minW="40px"
                  minH="40px"
                  bg={inputBg}
                  borderRight="1px solid"
                  borderBottom="1px solid"
                  borderColor={borderColor}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="bold"
                  fontSize="sm"
                >
                  {row + 1}
                </Box>
                {/* Data cells */}
                {Array.from({ length: maxCols }, (_, col) =>
                  renderCell(row, col),
                )}
              </Box>
            ))}
          </Box>
        </Box>

        <HStack>
          <Button
            onClick={addRow}
            size="sm"
            colorScheme="blue"
            variant="outline"
          >
            Add Row
          </Button>
          <Button
            onClick={addColumn}
            size="sm"
            colorScheme="blue"
            variant="outline"
          >
            Add Column
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default DocumentEditor;
