import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import { Flex, Loader, MantineProvider } from "@mantine/core";
import { TodoPage } from "@components/TodoPage";
import { LoginPage } from "@components/LoginPage";
import { auth } from "@utils/auth";
import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@utils/backend";

export default function App() {
  const [ready, setReady] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  useEffect(() => {
    auth.onAuthStateChanged(() => {
      setCurrentUser(auth.currentUser);
      auth.currentUser?.getIdToken().then(console.log)
      setReady(true);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        {ready ? (
          <BrowserRouter>
            <Routes>
              {!currentUser ? (
                <>
                  <Route path="/" element={<Navigate to="/login" />} />
                  <Route path="/login" element={<LoginPage />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<TodoPage />} />
                  <Route path="/login" element={<Navigate to="/" />} />
                </>
              )}
            </Routes>
          </BrowserRouter>
        ) : (
          <Flex h="100dvh" justify="center" align="center">
            <Loader color="blue" />
          </Flex>
        )}
      </MantineProvider>
    </QueryClientProvider>
  );
}
