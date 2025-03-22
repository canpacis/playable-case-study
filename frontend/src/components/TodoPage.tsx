import classes from "@components/TodoPage.module.css";
import { IconPlus } from "@tabler/icons-react";
import { Button, Flex, Title, Text, Badge } from "@mantine/core";

const todos: Todo[] = [
  {
    id: "todo-1",
    title: "Todo 1",
    description: "This is an example todo item",
    priority: "high",
    created_at: new Date(),
  },
  {
    id: "todo-2",
    title: "Todo 2",
    description: "This is an example todo item",
    priority: "low",
    created_at: new Date(),
  },
  {
    id: "todo-3",
    title: "Todo 3",
    description: "This is an example todo item",
    priority: "medium",
    created_at: new Date(),
  },
];

export function TodoPage() {
  return (
    <Flex p="lg" justify="start" wrap="wrap" direction="column" gap="lg">
      <Title order={1}>Todos</Title>
      <Flex justify="space-between">
        <Title order={2}>My Todos</Title>
        <Button leftSection={<IconPlus size={18} />}>Add Todo</Button>
      </Flex>
      <Flex gap="md">
        {todos.map((todo) => (
          <TodoCard key={todo.id} todo={todo} />
        ))}
      </Flex>
    </Flex>
  );
}

type TodoPriority = "high" | "medium" | "low";

export type Todo = {
  id: string;
  title: string;
  description: string;
  priority: TodoPriority;
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
      <Flex p="md" direction="column" gap="xs">
        <Title style={{ fontWeight: 500 }} order={3}>
          {todo.title}
        </Title>
        <Text>{todo.description}</Text>
        <Badge
          variant="light"
          className={classes.badge}
          color={priorityColor[todo.priority]}
        >
          {priorityLabel[todo.priority]}
        </Badge>
      </Flex>
      <Flex px="md" py="sm" className={classes.foot}>
        <Text size="xs">Created just now</Text>
      </Flex>
    </Flex>
  );
}
