import classes from "@components/TodoPage.module.css";
import {
  IconDots,
  IconLogout,
  IconPaperclip,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import {
  Button,
  Flex,
  Title,
  Text,
  Badge,
  SimpleGrid,
  Menu,
  ActionIcon,
  useMatches,
  Avatar,
  Container,
} from "@mantine/core";
import { auth } from "@utils/auth";

const todos: Todo[] = [
  {
    id: "todo-1",
    title: "Todo 1",
    description: "This is an example todo item",
    priority: "high",
    tags: [
      { id: "tag-1", title: "Tag 1" },
      { id: "tag-2", title: "Tag 2" },
    ],
    attachments: [],
    created_at: new Date(),
  },
  {
    id: "todo-2",
    title: "Todo 2",
    description: "This is an example todo item",
    priority: "low",
    tags: [],
    attachments: [{ id: "attachment-1", title: "Attachment 1" }],
    created_at: new Date(),
  },
  {
    id: "todo-3",
    title: "Todo 3",
    description: "This is an example todo item",
    priority: "medium",
    tags: [],
    attachments: [],
    created_at: new Date(),
  },
  {
    id: "todo-4",
    title: "Todo 4",
    description: "This is an example todo item",
    priority: "medium",
    tags: [],
    attachments: [],
    created_at: new Date(),
  },
];

export function TodoPage() {
  const cols = useMatches({
    lg: 3,
    base: 1,
    sm: 3,
    xs: 1,
  });
  const user = auth.currentUser!;

  return (
    <Container component="main">
      <Flex p="lg" justify="start" wrap="wrap" direction="column" gap="lg">
        <Flex align="center">
          <Title order={1}>Todos</Title>

          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <Avatar
                ml="auto"
                src={user.photoURL}
                alt={user.displayName ?? "user profile"}
              />
            </Menu.Target>

            <Menu.Dropdown>
              {user.displayName && <Menu.Label>{user.displayName}</Menu.Label>}
              {user.email && (
                <Menu.Label lh={0.2} mb="xs">
                  {user.email}
                </Menu.Label>
              )}
              <Menu.Item
                onClick={async () => await auth.signOut()}
                leftSection={<IconLogout size={14} />}
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Flex>
        <Flex justify="space-between">
          <Title order={2}>My Todos</Title>
          <Button leftSection={<IconPlus size={18} />}>Add Todo</Button>
        </Flex>
        <SimpleGrid cols={cols}>
          {todos.map((todo) => (
            <TodoCard key={todo.id} todo={todo} />
          ))}
        </SimpleGrid>
      </Flex>
    </Container>
  );
}

type TodoPriority = "high" | "medium" | "low";

type Tag = {
  id: string;
  title: string;
};

type Attachment = {
  id: string;
  title: string;
};

export type Todo = {
  id: string;
  title: string;
  description: string;
  priority: TodoPriority;
  tags: Tag[];
  attachments: Attachment[];
  created_at: Date;
};

const priorityLabel: Record<TodoPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const priorityColor: Record<TodoPriority, string> = {
  high: "red",
  medium: "blue",
  low: "green",
};

function TodoCard({ todo }: { todo: Todo }) {
  return (
    <Flex className={classes.card} direction="column">
      <img src="https://picsum.photos/300/200" alt="todo image" />
      <Flex p="md" direction="column" gap="xs">
        <Flex align="center" gap="sm">
          <Title style={{ fontWeight: 500 }} order={3}>
            {todo.title}
          </Title>
          <Badge
            variant="light"
            className={classes.badge}
            color={priorityColor[todo.priority]}
          >
            {priorityLabel[todo.priority]}
          </Badge>

          <Menu shadow="md" width={120} position="bottom-end">
            <Menu.Target>
              <ActionIcon color="gray" ml="auto" variant="light" size="sm">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item leftSection={<IconPencil size={14} />}>Edit</Menu.Item>
              <Menu.Item leftSection={<IconTrash size={14} />}>
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Flex>
        <Text size="md">{todo.description}</Text>
        {todo.tags.length > 0 && (
          <Flex mt="sm" wrap="wrap" gap="xs">
            {todo.tags.map((tag) => (
              <Badge
                color="gray"
                variant="dot"
                className={classes.badge}
                key={tag.id}
              >
                {tag.title}
              </Badge>
            ))}
          </Flex>
        )}
        {todo.attachments.length > 0 && (
          <Flex mt="sm" wrap="wrap" gap="xs">
            {todo.attachments.map((tag) => (
              <Badge
                component="button"
                color="gray"
                variant="outline"
                leftSection={<IconPaperclip size={14} />}
                className={classes.badge}
                key={tag.id}
              >
                {tag.title}
              </Badge>
            ))}
          </Flex>
        )}
      </Flex>
      <Flex mt="auto" px="md" py="sm" className={classes.foot}>
        <Text size="xs">Created just now</Text>
      </Flex>
    </Flex>
  );
}
