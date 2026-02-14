# 🌌 Gemini-Inspired Implementation Guide

## Phase 1: CSS Foundation & Theme Setup

### Updated `frontend/src/index.css`

```css
/* ✨ Gemini Design System - Deep-Space Dark Theme */

:root {
  /* Primary Colors - Deep Space */
  --dark-bg-primary: #0e0e10;
  --dark-bg-secondary: #1a1a1f;
  --dark-bg-tertiary: #27272d;

  /* Accent Colors - Gemini Inspired */
  --accent-cyan: #00d9ff;
  --accent-violet: #9333ea;
  --accent-electric-blue: #3b82f6;
  --accent-amber: #fbbf24;
  --accent-emerald: #10b981;

  /* Glassmorphic Borders */
  --border-glow-low: rgba(255, 255, 255, 0.05);
  --border-glow-high: rgba(255, 255, 255, 0.1);

  /* Text Opacity Layers */
  --text-primary: rgba(255, 255, 255, 1);
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-tertiary: rgba(255, 255, 255, 0.5);
  --text-quaternary: rgba(255, 255, 255, 0.3);

  /* Typography */
  --font-family:
    "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* Spacing (8px grid) */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;

  /* Radius (Soft, Organic) */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Shadows & Glows */
  --shadow-xs: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-sm: 0 4px 16px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 8px 32px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.6);

  --glow-cyan: 0 0 30px rgba(0, 217, 255, 0.15);
  --glow-violet: 0 0 40px rgba(147, 51, 234, 0.2);
  --glow-blue: 0 0 50px rgba(59, 130, 246, 0.15);

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-spring: 350ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--dark-bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
}

/* ✨ Glassmorphic Card Base */
.glassmorphic-card {
  background: rgba(26, 26, 31, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-glow-low);
  border-radius: var(--radius-lg);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    var(--shadow-md);
  transition: all var(--transition-base);
}

.glassmorphic-card:hover {
  background: rgba(26, 26, 31, 0.9);
  border-color: var(--border-glow-high);
  transform: scale(1.02);
}

/* ✨ Micro-animations */
@keyframes gemini-pulse {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

@keyframes glow-fade {
  0% {
    box-shadow: 0 0 20px rgba(0, 217, 255, 0);
  }
  50% {
    box-shadow: 0 0 30px rgba(0, 217, 255, 0.2);
  }
  100% {
    box-shadow: 0 0 20px rgba(0, 217, 255, 0);
  }
}

@keyframes float-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-in-left {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ✨ Text Hierarchy */
h1,
.heading-xl {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.6px;
  color: var(--text-primary);
}

h2,
.heading-lg {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: var(--text-primary);
}

h3,
.heading-md {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

h4,
.heading-sm {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

p,
.body-md {
  font-size: 14px;
  font-weight: 400;
  color: var(--text-secondary);
  line-height: 1.6;
}

.body-sm,
small {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-tertiary);
}

/* ✨ Metadata (Dimmed) */
.metadata {
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: 400;
}

/* ✨ Status Tags */
.status-tag {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  border: 1px solid;
  transition: all var(--transition-base);
}

.status-tag.in-progress {
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.3);
  color: var(--accent-amber);
}

.status-tag.completed {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
  color: var(--accent-emerald);
}

.status-tag.pending {
  background: rgba(147, 51, 234, 0.1);
  border-color: rgba(147, 51, 234, 0.3);
  color: var(--accent-violet);
}

/* ✨ Accessibility - Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ✨ Scrollbar Styling */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--dark-bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
```

---

## Phase 2: Updated Sidebar (Floating Pill-Style)

### `frontend/src/components/Sidebar.jsx`

```jsx
import React, { useState } from "react";
import {
  Box,
  VStack,
  Button,
  Text,
  Icon,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FaHome,
  FaComment,
  FaTasks,
  FaFileAlt,
  FaStickyNote,
  FaHistory,
  FaCode,
  FaUsers,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const Sidebar = ({ activeSection, onSectionChange }) => {
  const [isOpen, setIsOpen] = useState(true);

  // ✨ Gemini Color Tokens
  const bg = "rgba(26, 26, 31, 0.8)";
  const hoverBg = "rgba(59, 130, 246, 0.15)";
  const activeBg = "rgba(59, 130, 246, 0.25)";
  const activeGlow = "0 0 30px rgba(59, 130, 246, 0.3)";

  const sections = [
    {
      key: "overview",
      label: "Overview",
      icon: FaHome,
      tooltip: "Workspace overview and statistics",
    },
    {
      key: "chat",
      label: "Chat",
      icon: FaComment,
      tooltip: "Team messaging and discussions",
    },
    {
      key: "tasks",
      label: "Tasks",
      icon: FaTasks,
      tooltip: "Kanban board and task management",
    },
    {
      key: "files",
      label: "Files",
      icon: FaFileAlt,
      tooltip: "File uploads and document storage",
    },
    {
      key: "notes",
      label: "Notes",
      icon: FaStickyNote,
      tooltip: "Quick notes and documentation",
    },
    {
      key: "activity",
      label: "Activity",
      icon: FaHistory,
      tooltip: "Recent workspace activity feed",
    },
    {
      key: "team",
      label: "Team",
      icon: FaUsers,
      tooltip: "Manage team members and invitations",
    },
    {
      key: "code",
      label: "Code",
      icon: FaCode,
      tooltip: "Code repositories and integration",
    },
  ];

  return (
    <>
      {/* ✨ Floating Pill-Style Sidebar */}
      <Box
        position="fixed"
        left="20px"
        top="20px"
        width={isOpen ? "200px" : "68px"}
        bg={bg}
        backdropFilter="blur(12px)"
        border="1px solid rgba(255, 255, 255, 0.05)"
        borderRadius="24px"
        p={3}
        minH="auto"
        maxH="calc(100vh - 40px)"
        overflowY="auto"
        boxShadow="0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
        zIndex={100}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        display="flex"
        flexDirection="column"
      >
        {/* ✨ Top Spacer & Toggle */}
        <Box display="flex" justifyContent="flex-end" mb={isOpen ? 3 : 2}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsOpen(!isOpen)}
            _hover={{
              bg: "rgba(255, 255, 255, 0.1)",
              boxShadow: "0 0 20px rgba(0, 217, 255, 0.2)",
            }}
            icon={isOpen ? <FaTimes /> : <FaBars />}
          />
        </Box>

        {/* ✨ Navigation Pills */}
        <VStack align="stretch" spacing={2} flex={1}>
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.key;

            return (
              <Tooltip
                key={section.key}
                label={section.tooltip}
                placement="right"
                openDelay={200}
                isDisabled={isOpen}
              >
                <Button
                  w="full"
                  justifyContent={isOpen ? "flex-start" : "center"}
                  leftIcon={<Icon size={18} />}
                  onClick={() => onSectionChange(section.key)}
                  bg={isActive ? activeBg : "transparent"}
                  border="1px solid"
                  borderColor={
                    isActive ? "rgba(59, 130, 246, 0.5)" : "transparent"
                  }
                  fontWeight={isActive ? "600" : "500"}
                  color={isActive ? "#3B82F6" : "rgba(255, 255, 255, 0.7)"}
                  fontSize="sm"
                  borderRadius="12px"
                  height="44px"
                  transition="all 0.2s ease"
                  _hover={{
                    bg: hoverBg,
                    borderColor: "rgba(59, 130, 246, 0.3)",
                    boxShadow: activeGlow,
                    transform: "translateX(4px)",
                  }}
                  _activeLink={{
                    bg: activeBg,
                    boxShadow: activeGlow,
                  }}
                >
                  {isOpen && <Text ml={2}>{section.label}</Text>}
                </Button>
              </Tooltip>
            );
          })}
        </VStack>
      </Box>

      {/* ✨ Overlay for mobile menu close */}
      {isOpen && (
        <Box
          position="fixed"
          inset={0}
          zIndex={50}
          display={{ base: "block", md: "none" }}
          onClick={() => setIsOpen(false)}
          bg="rgba(0, 0, 0, 0.4)"
        />
      )}
    </>
  );
};

export default Sidebar;
```

**Key Enhancements:**

- ✨ Floating position with rounded pill aesthetic (24px radius)
- ✨ Glassmorphic background with blur effect
- ✨ Active pill highlighting with cyan glow
- ✨ Collapse/expand toggle for mobile responsiveness
- ✨ Hover effects with subtle glow and translate
- ✨ Smooth 0.3s transitions between states

---

## Phase 3: Glassmorphic Cards

### Card Component Template

```jsx
// ✨ Reusable Glassmorphic Card Component

const GlassmorphicCard = ({
  children,
  isHoverable = true,
  glow = "blue",
  ...props
}) => {
  const glowColor =
    {
      cyan: "0 0 30px rgba(0, 217, 255, 0.15)",
      violet: "0 0 40px rgba(147, 51, 234, 0.2)",
      blue: "0 0 50px rgba(59, 130, 246, 0.15)",
    }[glow] || "none";

  return (
    <Box
      bg="rgba(26, 26, 31, 0.8)"
      backdropFilter="blur(12px)"
      border="1px solid rgba(255, 255, 255, 0.05)"
      borderRadius="16px"
      padding="24px"
      boxShadow={`inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 8px 32px rgba(0, 0, 0, 0.4)`}
      transition="all 0.2s ease"
      _hover={
        isHoverable && {
          bg: "rgba(26, 26, 31, 0.9)",
          borderColor: "rgba(255, 255, 255, 0.1)",
          transform: "scale(1.02)",
          boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.1), ${glowColor}, 0 8px 32px rgba(0, 0, 0, 0.5)`,
        }
      }
      {...props}
    >
      {children}
    </Box>
  );
};

export default GlassmorphicCard;
```

---

## Phase 4: Task Board Redesign (Ghost Columns)

### Ghost Translucent Columns

```jsx
const TaskBoardColumn = ({ status, tasks }) => {
  return (
    <Box
      bg="rgba(39, 39, 45, 0.4)"
      border="1px solid rgba(255, 255, 255, 0.03)"
      backdropFilter="blur(8px)"
      borderRadius="16px"
      padding="20px"
      minH="400px"
      transition="all 0.2s ease"
      _hover={{
        bg: "rgba(39, 39, 45, 0.6)",
        borderColor: "rgba(255, 255, 255, 0.08)",
      }}
    >
      <Heading size="sm" mb={6} color="rgba(255, 255, 255, 1)">
        {status}
      </Heading>

      <VStack spacing={3} align="stretch">
        {tasks.map((task) => (
          <Box
            key={task.id}
            bg="rgba(26, 26, 31, 0.8)"
            backdropFilter="blur(12px)"
            border="1px solid rgba(255, 255, 255, 0.05)"
            borderRadius="12px"
            padding="16px"
            transition="all 0.2s ease"
            cursor="grab"
            _hover={{
              transform: "translateY(-4px)",
              boxShadow: "0 0 30px rgba(59, 130, 246, 0.2)",
              borderColor: "rgba(59, 130, 246, 0.2)",
            }}
          >
            <Text fontWeight="600" mb={2} color="var(--text-primary)">
              {task.title}
            </Text>
            <HStack justify="space-between" mb={3}>
              <Badge className={`status-tag ${task.status.toLowerCase()}`}>
                {task.status}
              </Badge>
              <Text className="metadata">{task.dueDate}</Text>
            </HStack>
            <AvatarGroup size="sm" max={3}>
              {task.assignees.map((assignee) => (
                <Avatar
                  key={assignee.id}
                  name={assignee.name}
                  src={assignee.avatar}
                  _hover={{
                    boxShadow: "0 0 30px rgba(0, 217, 255, 0.3)",
                  }}
                />
              ))}
            </AvatarGroup>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};
```

**Key Features:**

- ✨ 40% opacity columns (ghost effect)
- ✨ Minimal borders with 3% opacity
- ✨ Cards float above columns with hover lift
- ✨ Status tags with soft amber background (10% opacity)
- ✨ Smooth 0.2s transitions throughout

---

## Phase 5: Team Chat (Bubble-less Interface)

### Bubble-less Message Component

```jsx
const ChatMessage = ({ message, isCurrentUser }) => {
  return (
    <Box
      display="flex"
      gap={3}
      mb={6}
      opacity={1}
      animation="float-up 0.3s ease"
    >
      {/* Avatar with glow on hover */}
      <Avatar
        name={message.user.name}
        src={message.user.avatar}
        size="sm"
        flexShrink={0}
        _hover={{
          boxShadow:
            "0 0 30px rgba(0, 217, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        }}
        transition="all 0.2s ease"
      />

      {/* Message container - No bubbles, just whitespace */}
      <Box flex={1}>
        {/* User info and timestamp */}
        <HStack mb={1} spacing={2}>
          <Text fontWeight="600" fontSize="sm" color="var(--text-primary)">
            {message.user.name}
          </Text>
          <Text className="metadata">{message.timestamp}</Text>
        </HStack>

        {/* Message text */}
        <Text
          color="var(--text-secondary)"
          fontSize="14px"
          lineHeight="1.6"
          maxW="600px"
        >
          {message.text}
        </Text>

        {/* Optional: Message actions on hover */}
        <HStack mt={2} spacing={3} opacity={0} _groupHover={{ opacity: 1 }}>
          <Text
            className="metadata"
            cursor="pointer"
            _hover={{ color: "var(--text-primary)" }}
          >
            React
          </Text>
          <Text
            className="metadata"
            cursor="pointer"
            _hover={{ color: "var(--text-primary)" }}
          >
            Reply
          </Text>
        </HStack>
      </Box>
    </Box>
  );
};

// ✨ Gemini-Pulse Typing Indicator
const TypingIndicator = ({ userName }) => {
  return (
    <Box display="flex" gap={2} align="center" mb={4}>
      <Avatar name={userName} size="sm" />
      <HStack spacing={1}>
        <Box
          w="6px"
          h="6px"
          borderRadius="50%"
          bg="var(--accent-cyan)"
          animation="gemini-pulse 1.2s ease-in-out infinite"
        />
        <Box
          w="6px"
          h="6px"
          borderRadius="50%"
          bg="var(--accent-cyan)"
          animation="gemini-pulse 1.2s ease-in-out infinite 0.2s"
        />
        <Box
          w="6px"
          h="6px"
          borderRadius="50%"
          bg="var(--accent-cyan)"
          animation="gemini-pulse 1.2s ease-in-out infinite 0.4s"
        />
      </HStack>
      <Text className="metadata">{userName} is typing...</Text>
    </Box>
  );
};
```

**Key Features:**

- ✨ No message bubbles, only whitespace separation
- ✨ User avatars with subtle cyan glow on hover
- ✨ Metadata (timestamp) in 50% opacity
- ✨ Gemini-pulse typing indicator with cyan dots
- ✨ Message actions appear on hover (opacity 0 → 1)
- ✨ Message container has max-width for readability

---

## Phase 6: Team Management Enhancements

### New Features: Invitations & Role Management

```jsx
// ✨ Invitation Code Display
const InvitationCodeSection = ({ workspaceId, inviteCode }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box
      bg="rgba(26, 26, 31, 0.8)"
      backdropFilter="blur(12px)"
      border="1px solid rgba(0, 217, 255, 0.2)"
      borderRadius="16px"
      padding="24px"
      borderLeftWidth="4px"
      borderLeftColor="var(--accent-cyan)"
      boxShadow="0 0 30px rgba(0, 217, 255, 0.1)"
    >
      <VStack align="start" spacing={4}>
        <VStack align="start" spacing={1}>
          <Heading size="sm" color="var(--text-primary)">
            Share Invitation Code
          </Heading>
          <Text color="var(--text-tertiary)" fontSize="sm">
            Anyone with this code can join your workspace
          </Text>
        </VStack>

        <HStack
          w="full"
          bg="rgba(0, 217, 255, 0.05)"
          border="1px solid rgba(0, 217, 255, 0.2)"
          borderRadius="12px"
          padding="12px 16px"
          justify="space-between"
          _hover={{
            bg: "rgba(0, 217, 255, 0.1)",
          }}
        >
          <Text
            fontFamily="var(--font-mono)"
            fontWeight="600"
            fontSize="16px"
            color="var(--accent-cyan)"
            letterSpacing="2px"
          >
            {inviteCode}
          </Text>
          <Button
            size="sm"
            colorScheme="cyan"
            variant="ghost"
            onClick={handleCopy}
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
        </HStack>

        <Text className="metadata">
          🕐 Expires in 7 days • 👥 Unlimited uses
        </Text>
      </VStack>
    </Box>
  );
};

// ✨ Role Management & Member Grid
const MemberCard = ({ member, onRoleChange, onRemove }) => {
  return (
    <Box
      bg="rgba(26, 26, 31, 0.8)"
      backdropFilter="blur(12px)"
      border="1px solid rgba(255, 255, 255, 0.05)"
      borderRadius="16px"
      padding="20px"
      transition="all 0.2s ease"
      _hover={{
        transform: "translateY(-4px)",
        boxShadow:
          "0 0 30px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        borderColor: "rgba(59, 130, 246, 0.2)",
      }}
    >
      <HStack mb={4} justify="space-between">
        <HStack spacing={3}>
          <Avatar
            name={member.name}
            src={member.avatar}
            size="md"
            boxShadow={
              member.isActive ? "0 0 30px rgba(0, 217, 255, 0.3)" : "none"
            }
          />
          <VStack align="start" spacing={1}>
            <Text fontWeight="600" color="var(--text-primary)">
              {member.name}
            </Text>
            <Text className="metadata">{member.email}</Text>
          </VStack>
        </HStack>
        {member.isActive && (
          <Box
            w="10px"
            h="10px"
            borderRadius="50%"
            bg="var(--accent-emerald)"
            boxShadow="0 0 20px rgba(16, 185, 129, 0.4)"
          />
        )}
      </HStack>

      <HStack justify="space-between">
        <Select
          size="sm"
          w="120px"
          value={member.role}
          onChange={(e) => onRoleChange(member.id, e.target.value)}
          bg="rgba(59, 130, 246, 0.1)"
          border="1px solid rgba(59, 130, 246, 0.2)"
          borderRadius="8px"
        >
          <option value="owner">👑 Owner</option>
          <option value="member">✏️ Member</option>
          <option value="viewer">👁️ Viewer</option>
        </Select>

        <Button
          size="sm"
          variant="ghost"
          colorScheme="red"
          onClick={() => onRemove(member.id)}
          _hover={{
            bg: "rgba(239, 68, 68, 0.1)",
            color: "#EF4444",
          }}
        >
          Remove
        </Button>
      </HStack>
    </Box>
  );
};
```

**New Features:**

- ✨ Invitation code with copy-to-clipboard
- ✨ 7-day expiration timer
- ✨ Member cards with role badges and active indicators
- ✨ "Active now" glow effect on avatars
- ✨ Role management with emoji indicators
- ✨ Smooth transitions on hover

---

## 🎯 Implementation Order

1. **Update CSS** (`index.css`) - Foundation
2. **Update Sidebar** - Navigation transformation
3. **Update Cards** - Apply glassmorphism to all
4. **Update Task Board** - Ghost columns implementation
5. **Update Chat** - Bubble-less interface
6. **Add Features** - Invitations, roles, member lists

---

## ✅ Testing Checklist

- [ ] All colors render correctly (deep-space palette)
- [ ] Glass blur effects work (check browser support)
- [ ] Micro-animations smooth (60fps on dev tools)
- [ ] Hover glows appear as expected
- [ ] Sidebar collapse/expand works
- [ ] Status tags display correctly
- [ ] Chat interface is readable (whitespace hierarchy)
- [ ] Task board columns are visually distinct
- [ ] Member cards display with proper styling
- [ ] Mobile responsiveness (tablet/phone)
- [ ] Dark mode (already dark, but check contrast)
- [ ] Performance (bundle size, animation smoothness)

---

## 📦 Files Modified

- `frontend/src/index.css` - New design tokens
- `frontend/src/components/Sidebar.jsx` - Floating pill nav
- `frontend/src/components/GlassmorphicCard.jsx` - NEW component
- `frontend/src/components/TeamManagement.jsx` - Add invites + roles
- `frontend/src/components/KanbanBoard.jsx` - Ghost columns
- `frontend/src/components/ChatRoom.jsx` - Bubble-less design
- `frontend/src/pages/Dashboard.jsx` - Card styling updates

---

**Next Step:** Review the design and approve color palette, then begin Phase 1 CSS updates!
