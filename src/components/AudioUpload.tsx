import { useContext, useState } from "react";
import {
  Button,
  Group,
  Text,
  TextInput,
  Stack,
  Modal,
  Alert,
} from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { useForm } from "@mantine/form";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query"; // Import React Query hooks
import { APIContext } from "@src/App";
import classes from "./AudioUpload.module.css";

const TEXT_SIZE = "md";

export function AudioUpload() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const transcriptApi = useContext(APIContext); // Assuming APIContext is defined in your app
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // Get query client instance
  const [file, setFile] = useState<File | null>(null);

  const form = useForm({
    initialValues: {
      title: "",
    },
    validate: {
      title: (value) => (!value.trim() ? "Title is required" : null),
    },
  });

  const uploadMutation = useMutation({
    // Define the mutation
    mutationFn: ({ title, file }: { title: string; file: File }) =>
      transcriptApi.uploadAudio(title, file),
    onSuccess: (data) => {
      // Invalidate the query to trigger refetch in RecentTranscripts
      queryClient.invalidateQueries({ queryKey: ["recentTranscripts"] });
      setUploadModalOpen(false); // Close modal on success
      form.reset(); // Reset form
      setFile(null); // Clear file state
      navigate(`/transcript/${data.id}`); // Navigate after success
    },
    // onError handled via mutation.error below
  });

  const handleDrop = (files: File[]) => {
    if (files.length > 0 && !uploadMutation.isPending) {
      // Use isPending
      setFile(files[0]);
      const fileName = files[0].name.split(".")[0].replace(/_/g, " ");
      form.setFieldValue("title", fileName);
      uploadMutation.reset(); // Reset mutation state if there was a previous error
      setUploadModalOpen(true);
    }
  };

  const handleCancel = () => {
    setUploadModalOpen(false);
    form.reset();
    setFile(null);
    uploadMutation.reset(); // Reset mutation state
  };

  const handleSubmit = (values: { title: string }) => {
    if (!file) return;
    uploadMutation.mutate({ title: values.title, file }); // Trigger the mutation
  };

  return (
    <>
      <Dropzone
        onDrop={handleDrop}
        accept={[
          "audio/mp3",
          "audio/mp4",
          ".m4a",
          "audio/mpeg",
          "audio/wav",
          "audio/ogg",
        ]}
        maxSize={30 * 1024 * 1024} // 30MB
        disabled={uploadMutation.isPending}
        className={classes.dropzone}
        classNames={{
          inner: classes.dropzoneInner,
        }}
        c="blue"
        variant="light"
      >
        <Group align="center" justify="center" text-align="center">
          <Dropzone.Accept>
            <Text size={TEXT_SIZE} fw={600}>
              Drop your audio file here!
            </Text>
          </Dropzone.Accept>
          <Dropzone.Reject>
            <Text size={TEXT_SIZE} c="red" fw={500}>
              ❌ File type not supported or too large
            </Text>
          </Dropzone.Reject>
          <Dropzone.Idle>
            <Text size={TEXT_SIZE} fw={600}>
              Drop your audio file here!
            </Text>
          </Dropzone.Idle>
        </Group>
      </Dropzone>
      <Modal
        opened={uploadModalOpen}
        onClose={handleCancel} // Use handleCancel for closing
        title="Upload Audio File"
        centered
        closeOnClickOutside={!uploadMutation.isPending} // Use isPending
        withCloseButton={!uploadMutation.isPending} // Use isPending
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {uploadMutation.isError && (
              <Alert color="red" title="Upload Failed">
                {uploadMutation.error instanceof Error
                  ? uploadMutation.error.message
                  : "An unknown error occurred."}
              </Alert>
            )}
            <TextInput
              label="Title"
              placeholder="Enter a title for this transcript"
              {...form.getInputProps("title")}
              data-autofocus
              disabled={uploadMutation.isPending} // Use isPending
            />

            <Text size="sm">Selected file: {file?.name}</Text>

            <Group justify="flex-end" mt="md">
              <Button
                variant="subtle"
                onClick={handleCancel}
                disabled={uploadMutation.isPending}
              >
                {" "}
                {/* Use isPending */}
                Cancel
              </Button>
              <Button type="submit" loading={uploadMutation.isPending}>
                {" "}
                {/* Use isPending */}
                Upload
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
