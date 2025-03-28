import classes from "@components/TodoForm.module.css";
import {
  IconPaperclip,
  IconPhoto,
  IconPlus,
  IconSparkles,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import {
  Button,
  Flex,
  Text,
  Modal,
  Group,
  Select,
  LoadingOverlay,
  Box,
  Image,
  ActionIcon,
  Tooltip,
  FileButton,
  UnstyledButton,
  Loader,
  MultiSelect,
} from "@mantine/core";
import { Dropzone, FileWithPath, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { auth } from "@utils/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AIRecommendation,
  endpoints,
  FileUpload,
  ImageUpload,
  method,
  mutate,
  query,
  queryClient,
  Tag,
  Todo,
  TodoPriority,
  upload,
} from "@utils/backend";
import { useDebouncedCallback, useLocalStorage } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { useEffect, useState } from "react";

type TodoForm = {
  image: ImageUpload | null;
  title: string;
  description: string;
  priority: TodoPriority | "";
  attachments: FileUpload[];
  tags: string[];
};

function prompt(form: TodoForm, tagData: Tag[]): AIRecommendation {
  return {
    title: form.title,
    description: form.description,
    priority: form.priority as TodoPriority,
    tags: form.tags
      .map((id) => tagData.find((tag) => tag.id === id)?.title)
      .filter((tag) => tag !== undefined),
  };
}

export function TodoForm({
  opened,
  close,
  defaultValue,
}: {
  opened: boolean;
  close: () => void;
  defaultValue?: Todo;
}) {
  const user = auth.currentUser!;
  const isEditing = !!defaultValue;
  const [uploadLoading, setUploadLoading] = useState(false);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [lastForm, setLastForm] = useLocalStorage<TodoForm | null>({
    key: "last-create-form",
    defaultValue: null,
  });

  const {
    isLoading: tagsLoading,
    data: tagData,
    error: tagsError,
  } = useQuery({
    queryKey: [user.uid, "tags"],
    queryFn: () => query<Tag[]>(endpoints.listTags),
  });

  // if (tagError) {
  //   notifications.show({
  //     title: "Error",
  //     message: "There was an error loading the tags",
  //   });
  // }

  const createTag = useMutation({
    mutationFn: (title: string) =>
      mutate<Tag>(endpoints.createTag, method.Post, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [user.uid, "tags"],
      });
    },
  });

  let initialValues: TodoForm;
  if (defaultValue) {
    initialValues = {
      ...defaultValue,
      tags: defaultValue.tags.map((tag) => tag.title),
    };
  } else {
    if (lastForm) {
      initialValues = lastForm;
    } else {
      initialValues = {
        image: null,
        title: "",
        description: "",
        priority: "",
        attachments: [],
        tags: [],
      };
    }
  }

  const recommendation = useMutation({
    mutationFn: (prompt: AIRecommendation) => {
      return mutate<AIRecommendation>(endpoints.recommend, method.Post, prompt);
    },
  });

  const updateValues = useDebouncedCallback((values: TodoForm) => {
    recommendation.mutate(prompt(values, tagData ?? []));
  }, 1000);

  const form = useForm<TodoForm>({
    initialValues: initialValues,
    validate: {
      title: (value) => (value.length > 1 ? null : "Title is too short"),
      description: (value) =>
        value.length > 0 ? null : "Description is required",
      priority: (value) =>
        ["high", "medium", "low"].includes(value)
          ? null
          : "Please pick a priorty",
    },
    onValuesChange: updateValues,
  });

  const create = useMutation({
    mutationFn: async (body: TodoForm) => {
      return await mutate(endpoints.createTodo, method.Post, {
        ...body,
        recommendation: recommendation.data,
        attachments: body.attachments.map((a) => a.id),
      });
    },
    onSuccess: () => {
      form.reset();
      close();
      queryClient.invalidateQueries({
        queryKey: [user.uid, "todo-list"],
      });
    },
  });

  const update = useMutation({
    mutationFn: async (body: TodoForm) => {
      if (!defaultValue) {
        throw new Error("Todo not found");
      }
      return await mutate(endpoints.updateTodo(defaultValue.id), method.Patch, {
        ...body,
        recommendation: recommendation.data ?? defaultValue.recommendation,
        attachments: body.attachments.map((a) => a.id),
      });
    },
    onSuccess: () => {
      form.reset();
      close();
      queryClient.invalidateQueries({
        queryKey: [user.uid, "todo-list"],
      });
    },
  });

  useEffect(() => {
    setLastForm(form.getValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  useEffect(() => {
    if (createTag.data) {
      form.insertListItem("tags", createTag.data.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createTag.data]);

  const handleImageDrop = async (files: FileWithPath[]) => {
    try {
      setUploadLoading(true);
      const image = await upload<ImageUpload>(endpoints.uploadImage, files[0]);
      form.setFieldValue("image", image);
    } catch (error) {
      console.log(error);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    try {
      setAttachmentLoading(true);
      const response = await upload<FileUpload>(endpoints.uploadFile, file);
      form.insertListItem("attachments", response);
    } catch (error) {
      console.log(error);
    } finally {
      setAttachmentLoading(false);
    }
  };

  const handleSubmit = (values: TodoForm) => {
    const copy = structuredClone(values);
    const data = Object.assign(copy, {
      image: copy.image?.id || undefined,
    });

    if (isEditing) {
      update.mutate(data);
    } else {
      create.mutate(data);
    }
  };

  return (
    <Modal
      closeOnClickOutside={false}
      opened={opened}
      onClose={close}
      size="lg"
      title="Create a new Todo"
    >
      <Flex direction="column" gap="sm">
        {form.values.image !== null ? (
          <TodoImage
            url={form.values.image.original}
            clear={() => form.setFieldValue("image", null)}
          />
        ) : (
          <Box pos="relative">
            <LoadingOverlay
              visible={uploadLoading}
              zIndex={1000}
              overlayProps={{ radius: "sm", blur: 2 }}
            />
            <Dropzone
              disabled={uploadLoading}
              onDrop={handleImageDrop}
              onReject={(files) => console.log("rejected files", files)}
              maxSize={5 * 1024 ** 2}
              multiple={false}
              accept={IMAGE_MIME_TYPE}
            >
              <Group
                justify="center"
                gap="xl"
                mih={180}
                style={{ pointerEvents: "none" }}
              >
                <Dropzone.Accept>
                  <IconUpload
                    size={52}
                    color="var(--mantine-color-blue-6)"
                    stroke={1.5}
                  />
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <IconX
                    size={52}
                    color="var(--mantine-color-red-6)"
                    stroke={1.5}
                  />
                </Dropzone.Reject>
                <Dropzone.Idle>
                  <IconPhoto
                    size={52}
                    color="var(--mantine-color-dimmed)"
                    stroke={1.5}
                  />
                </Dropzone.Idle>

                <div className={classes.dropzone_text}>
                  <Text inline>Drag images here or click to select files</Text>
                  <Text size="sm" c="dimmed" inline mt={7}>
                    Attach an image that should not exceed 5mb
                  </Text>
                </div>
              </Group>
            </Dropzone>
          </Box>
        )}

        <Box pos="relative">
          <LoadingOverlay
            visible={create.isPending || update.isPending}
            zIndex={1000}
            overlayProps={{ radius: "sm", blur: 2 }}
          />
          <form className={classes.form} onSubmit={form.onSubmit(handleSubmit)}>
            {/* <TextInput
              withAsterisk
              label="Title"
              placeholder="Todo title"
              key={form.key("title")}
              {...form.getInputProps("title")}
            /> */}
            <EnhancedInput
              label="Title"
              placeholder="Todo title"
              value={form.values.title}
              setValue={(value) => form.setFieldValue("title", value)}
              recommendation={
                recommendation.data ? recommendation.data.title : ""
              }
              loading={recommendation.isPending}
            />
            <EnhancedTextarea
              label="Description"
              placeholder="Explain what you need to do"
              value={form.values.description}
              setValue={(value) => form.setFieldValue("description", value)}
              recommendation={
                recommendation.data ? recommendation.data.description : ""
              }
              loading={recommendation.isPending}
            />
            <Select
              withAsterisk
              label="Priority"
              placeholder="Pick value"
              data={[
                { label: "High", value: "high" },
                { label: "Medium", value: "medium" },
                { label: "Low", value: "low" },
              ]}
              key={form.key("priority")}
              {...form.getInputProps("priority")}
            />
            <MultiSelect
              label="Tags"
              placeholder="Add tags to organize your todos"
              disabled={tagsLoading || tagsError !== null}
              value={form.values.tags}
              onChange={(values) => form.setFieldValue("tags", values)}
              data={(tagData ?? []).map((tag) => ({
                label: tag.title,
                value: tag.id,
              }))}
            />
            <Flex gap="sm" wrap="wrap">
              {form.values.attachments.length === 0 ? (
                <FileButton onChange={handleFileUpload}>
                  {(props) => (
                    <Button
                      variant="light"
                      leftSection={<IconPaperclip size={14} />}
                      {...props}
                    >
                      Attach a file
                    </Button>
                  )}
                </FileButton>
              ) : (
                <>
                  {form.values.attachments.map((attachment, i) => (
                    <Box
                      pos="relative"
                      key={attachment.id}
                      className={classes.attachment}
                      bg="var(--mantine-color-gray-2)"
                    >
                      <IconPaperclip size={32} />
                      <Text size="xs" lineClamp={3}>
                        {attachment.originalName}
                      </Text>
                      <Tooltip label="Remove attchment">
                        <ActionIcon
                          top={4}
                          right={4}
                          size="sm"
                          pos="absolute"
                          variant="light"
                          color="red"
                          onClick={() => form.removeListItem("attachments", i)}
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Box>
                  ))}
                  <FileButton onChange={handleFileUpload}>
                    {(props) => (
                      <ActionIcon
                        {...props}
                        variant="light"
                        className={classes.attach_button}
                      >
                        <IconPlus size={32} />
                      </ActionIcon>
                    )}
                  </FileButton>
                </>
              )}
            </Flex>
            <Button
              loading={
                create.isPending ||
                update.isPending ||
                recommendation.isPending ||
                uploadLoading ||
                attachmentLoading
              }
              type="submit"
            >
              {defaultValue ? "Update Todo" : "Create Todo"}
            </Button>
            {isEditing && form.isDirty() && (
              <Button
                onClick={() => form.setValues(initialValues)}
                variant="light"
              >
                Reset
              </Button>
            )}
          </form>
        </Box>
      </Flex>
    </Modal>
  );
}

function TodoImage({ url, clear }: { url: string; clear: () => void }) {
  return (
    <Box pos="relative">
      <Image radius="md" src={url} />
      <Tooltip label="Remove image">
        <ActionIcon
          onClick={clear}
          pos="absolute"
          color="gray"
          variant="light"
          top={12}
          right={12}
        >
          <IconX size={18} />
        </ActionIcon>
      </Tooltip>
    </Box>
  );
}

// Should probably do a forward ref but alas
type EnhancedInputProps = {
  placeholder: string;
  value: string;
  setValue: (value: string) => void;
  recommendation: string;
  label: string;
  loading: boolean;
};

function EnhancedInput({
  placeholder,
  value,
  setValue,
  recommendation,
  label,
  loading,
}: EnhancedInputProps) {
  return (
    <label title={label}>
      <Flex direction="column" gap={2}>
        <Text size="sm" fw={500}>
          {label}
        </Text>
        <Flex
          className={classes.unstyled_input_wrapper}
          wrap="nowrap"
          align="center"
        >
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            type="text"
          />
          {loading && (
            <UnstyledButton ml={4}>
              <Loader size={10} />
            </UnstyledButton>
          )}
          {recommendation.length > 0 && (
            <UnstyledButton
              my="auto"
              onClick={() => setValue(recommendation)}
              ml={4}
            >
              <Text size="sm" c="dimmed">
                <span>{recommendation}</span>
                <IconSparkles style={{ marginLeft: 4 }} size={12} />
              </Text>
            </UnstyledButton>
          )}
        </Flex>
      </Flex>
    </label>
  );
}

function EnhancedTextarea({
  placeholder,
  value,
  setValue,
  recommendation,
  label,
  loading,
}: EnhancedInputProps) {
  return (
    <label title={label}>
      <Flex direction="column" gap={2}>
        <Text size="sm" fw={500}>
          {label}
        </Text>
        <Box
          className={[
            classes.unstyled_input_wrapper,
            classes.unstyled_textarea_wrapper,
          ].join(" ")}
        >
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
          />
          {loading && (
            <UnstyledButton ml={4}>
              <Loader size={10} />
            </UnstyledButton>
          )}
          {recommendation.length > 0 && (
            <UnstyledButton onClick={() => setValue(recommendation)} ml={4}>
              <Text size="sm" c="dimmed">
                <span>{recommendation}</span>
                <IconSparkles style={{ marginLeft: 4 }} size={12} />
              </Text>
            </UnstyledButton>
          )}
        </Box>
      </Flex>
    </label>
  );
}
