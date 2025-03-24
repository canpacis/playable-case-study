import { IconLogout, IconPlus, IconSearch } from "@tabler/icons-react";
import {
  Button,
  Flex,
  Title,
  Menu,
  useMatches,
  Avatar,
  Container,
  Loader,
  Text,
  TextInput,
  Pagination,
  MultiSelect,
} from "@mantine/core";
import { auth } from "@utils/auth";
import { TodoCard } from "@components/Todo";
import { useQuery } from "@tanstack/react-query";
import { endpoints, Paginated, query, Tag, Todo } from "@utils/backend";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { TodoForm } from "./TodoForm";
import { useMemo, useState } from "react";

function chunkToMasonryLayout(items: Todo[], cols: number) {
  const columns: Todo[][] = Array.from({ length: cols }, () => []);

  items.forEach((item, index) => {
    columns[index % cols].push(item);
  });

  return columns;
}

export function TodoPage() {
  const user = auth.currentUser!;
  const perPage = 9;
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [debouncedSearch] = useDebouncedValue(searchValue, 200);

  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);
  const { isLoading, error, data } = useQuery({
    queryKey: [user.uid, "todo-list", page],
    queryFn: () =>
      query<Paginated<Todo>>(endpoints.listTodos, {
        page: page,
        perPage: perPage,
      }),
  });

  const {
    isLoading: tagsLoading,
    data: tagData,
    error: tagsError,
  } = useQuery({
    queryKey: [user.uid, "tags"],
    queryFn: () => query<Tag[]>(endpoints.listTags),
  });

  const { isLoading: searchLoading, data: searchData } = useQuery({
    queryKey: [user.uid, "search", debouncedSearch],
    queryFn: () => query<Todo[]>(endpoints.search, { q: debouncedSearch }),
  });

  const { isLoading: filterLoading, data: filterData } = useQuery({
    queryKey: [user.uid, "filter", filters],
    queryFn: () => query<Todo[]>(endpoints.filter, { t: filters.join(",") }),
  });

  const cols = useMatches({
    lg: 3,
    base: 1,
    sm: 3,
    xs: 1,
  });

  const layout = useMemo(() => {
    if (filters.length > 0 && filterData) {
      return chunkToMasonryLayout(filterData ?? [], cols);
    }
    if (debouncedSearch.length > 0 && searchData) {
      return chunkToMasonryLayout(searchData ?? [], cols);
    }
    return chunkToMasonryLayout(data?.items ?? [], cols);
  }, [data, searchData, cols, debouncedSearch, filters, filterData]);

  const isPaginated = filters.length === 0 && debouncedSearch.length === 0;

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
        <Flex gap="sm">
          <TextInput
            flex={1}
            leftSection={<IconSearch size={14} />}
            placeholder="Search todos"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <MultiSelect
            maw={300}
            disabled={tagsLoading || tagsError !== null}
            placeholder="Pick tags to filter"
            onChange={setFilters}
            data={(tagData ?? []).map((tag) => ({
              label: tag.title,
              value: tag.id,
            }))}
          />
        </Flex>

        {isLoading || searchLoading || filterLoading ? (
          <Flex align="center" justify="center" flex={1}>
            <Loader />
          </Flex>
        ) : error !== null ? (
          <Flex align="center" justify="center" flex={1}>
            <Text>There was an error while loading. Please try again</Text>
          </Flex>
        ) : (
          <>
            <Flex gap="md">
              {layout.flat().length === 0 ? (
                <Flex flex={1} align="center" justify="center">
                  <Text size="sm" c="dimmed">
                    No todos here
                  </Text>
                </Flex>
              ) : (
                layout.map((column, i) => (
                  <Flex gap="md" direction="column" flex={1} key={i}>
                    {column.map((todo) => (
                      <TodoCard key={todo.id} todo={todo} />
                    ))}
                  </Flex>
                ))
              )}
            </Flex>
            {isPaginated && (
              <Flex mt="auto" justify="center">
                <Pagination
                  value={page}
                  onChange={setPage}
                  total={Math.ceil((data?.total ?? 1) / perPage)}
                />
              </Flex>
            )}
          </>
        )}
      </Flex>
    </Container>
  );
}

function Header() {
  const user = auth.currentUser!;

  return (
    <Flex align="center">
      <Title order={1}>TaskPilot</Title>

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
