import classes from "@components/TodoForm.module.css";
import {
  IconPaperclip,
  IconPhoto,
  IconPlus,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import {
  Button,
  Flex,
  Text,
  Modal,
  TextInput,
  Textarea,
  TagsInput,
  Group,
  Select,
  LoadingOverlay,
  Box,
  Image,
  ActionIcon,
  Tooltip,
  FileButton,
} from "@mantine/core";
import { Dropzone, FileWithPath, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { auth } from "@utils/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
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
import { useLocalStorage } from "@mantine/hooks";
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

export function TodoForm({
  opened,
  close,
  defaultValue,
}: {
  opened: boolean;
  close: () => void;
  defaultValue?: Todo;
}) {
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
    error: tagError,
  } = useQuery({
    queryKey: [auth.currentUser?.uid, "tags"],
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
      mutate(endpoints.createTag, method.Post, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [auth.currentUser?.uid, "tags"],
      });
    },
  });

  let initialValues: TodoForm;
  if (defaultValue) {
    initialValues = {
      ...defaultValue,
      tags: [],
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
  });

  const create = useMutation({
    mutationFn: async (body: TodoForm) => {
      return await mutate(endpoints.createTodo, method.Post, {
        ...body,
        attachments: body.attachments.map((a) => a.id),
      });
    },
    onSuccess: () => {
      form.reset();
      close();
      queryClient.invalidateQueries({
        queryKey: [auth.currentUser!.uid, "todo-list"],
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
        attachments: body.attachments.map((a) => a.id),
      });
    },
    onSuccess: () => {
      form.reset();
      close();
      queryClient.invalidateQueries({
        queryKey: [auth.currentUser!.uid, "todo-list"],
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
            <TextInput
              withAsterisk
              label="Title"
              placeholder="Todo title"
              key={form.key("title")}
              {...form.getInputProps("title")}
            />
            <Textarea
              withAsterisk
              rows={4}
              label="Description"
              placeholder="Explain what you need to do"
              key={form.key("description")}
              {...form.getInputProps("description")}
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
            <TagsInput
              label="Press Enter to create a tag"
              description="Organize your todos with tags"
              placeholder="Enter tags"
              key={form.key("tags")}
              onChange={(values) => {
                if (!tagData) {
                  return;
                }

                // Either set the tags form value or create a new tag
                form.setFieldValue(
                  "tags",
                  values
                    .map((tag) => {
                      const found = tagData.find((data) => data.title === tag);
                      if (found) {
                        return found.id;
                      }

                      createTag.mutate(tag);
                      return undefined;
                    })
                    .filter((item) => item !== undefined)
                );
              }}
              disabled={tagsLoading || createTag.isPending || tagError !== null}
              data={tagData?.map((item) => item.title) ?? []}
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
