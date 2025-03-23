import { IconLogout, IconPlus } from "@tabler/icons-react";
import {
  Button,
  Flex,
  Title,
  SimpleGrid,
  Menu,
  useMatches,
  Avatar,
  Container,
  Loader,
  Text,
} from "@mantine/core";
import { auth } from "@utils/auth";
import { Todo, TodoCard } from "@components/Todo";
import { useQuery } from "@tanstack/react-query";
import { endpoints, Paginated, query } from "@utils/backend";
import { useDisclosure } from "@mantine/hooks";
import { TodoForm } from "./TodoForm";

export function TodoPage() {
  const user = auth.currentUser!;
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);
  const { isLoading, error, data } = useQuery({
    queryKey: [user.uid, "todo-list"],
    queryFn: () =>
      query<Paginated<Todo>>(endpoints.listTodos, { page: 1, perPage: 10 }),
  });

  const cols = useMatches({
    lg: 3,
    base: 1,
    sm: 3,
    xs: 1,
  });

  return (
    <Container component="main" mih="100dvh">
      <Flex
        p="lg"
        justify="start"
        wrap="wrap"
        direction="column"
        gap="lg"
        mih="100dvh"
      >
        <Header />
        <Flex justify="space-between">
          <Title order={2}>My Todos</Title>
          <Button onClick={openModal} leftSection={<IconPlus size={18} />}>
            Add Todo
          </Button>
          <TodoForm opened={modalOpened} close={closeModal} />
        </Flex>

        {isLoading ? (
          <Flex align="center" justify="center" flex={1}>
            <Loader />
          </Flex>
        ) : error !== null ? (
          <Flex align="center" justify="center" flex={1}>
            <Text>There was an error while loading. Please try again</Text>
          </Flex>
        ) : (
          <SimpleGrid cols={cols}>
            {data!.items.map((todo) => (
              <TodoCard key={todo.id} todo={todo} />
            ))}
          </SimpleGrid>
        )}
      </Flex>
    </Container>
  );
}

function Header() {
  const user = auth.currentUser!;

  return (
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
  );
}
