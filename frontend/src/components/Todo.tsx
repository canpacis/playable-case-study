import classes from "@components/Todo.module.css";
import {
  IconDots,
  IconPaperclip,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import {
  Flex,
  Title,
  Text,
  Badge,
  Menu,
  ActionIcon,
  Image,
} from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import {
  mutate,
  method,
  endpoints,
  queryClient,
  ImageUpload,
  FileUpload,
} from "@utils/backend";
import { auth } from "@utils/auth";
import { formatDate } from "@utils/misc";
import { TodoForm } from "./TodoForm";
import { useDisclosure } from "@mantine/hooks";

export type TodoPriority = "high" | "medium" | "low";

export type Tag = {
  id: string;
  title: string;
};

export type Todo = {
  id: string;
  title: string;
  description: string;
  image: ImageUpload | null;
  priority: TodoPriority;
  // tags: Tag[];
  attachments: FileUpload[];
  createdAt: Date;
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

export function TodoCard({ todo }: { todo: Todo }) {
  const user = auth.currentUser!;

  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  const deleteMutation = useMutation({
    mutationFn: () => mutate(endpoints.deleteTodo(todo.id), method.Delete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [user.uid, "todo-list"] });
    },
  });

  return (
    <Flex className={classes.card} direction="column">
      {todo.image !== null && (
        <Image src={todo.image.thumbnail} alt="todo image" />
      )}
      <Flex p="md" direction="column" gap="xs">
        <Flex align="center" gap="sm">
          <Title lineClamp={2} style={{ fontWeight: 500 }} order={3}>
            {todo.title}
          </Title>

          <Menu shadow="md" width={120} position="bottom-end">
            <Menu.Target>
              <ActionIcon color="gray" ml="auto" variant="light" size="sm">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                onClick={openModal}
                leftSection={<IconPencil size={14} />}
              >
                Edit
              </Menu.Item>
              <Menu.Item
                onClick={() => deleteMutation.mutate()}
                leftSection={<IconTrash size={14} />}
              >
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Flex>
        <Text lineClamp={4} size="md">
          {todo.description}
        </Text>
        {/* {todo.tags.length > 0 && (
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
        )} */}
        {todo.attachments.length > 0 && (
          <Flex mt="sm" wrap="wrap" gap="xs">
            {todo.attachments.map((attachment) => (
              <Badge
                component="a"
                href={attachment.url}
                download
                target="_blank"
                color="gray"
                variant="outline"
                leftSection={<IconPaperclip size={14} />}
                className={classes.badge}
                style={{ cursor: "pointer" }}
                key={attachment.id}
              >
                {attachment.originalName}
              </Badge>
            ))}
          </Flex>
        )}
      </Flex>
      <Flex
        mt="auto"
        px="md"
        py="sm"
        className={classes.foot}
        align="center"
        justify="space-between"
      >
        <Text size="xs">{formatDate(new Date(todo.createdAt))}</Text>
        <Badge
          variant="light"
          className={classes.badge}
          color={priorityColor[todo.priority]}
        >
          {priorityLabel[todo.priority]}
        </Badge>
      </Flex>
      <TodoForm opened={modalOpened} close={closeModal} defaultValue={todo} />
    </Flex>
  );
}
