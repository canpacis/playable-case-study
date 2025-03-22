import "@mantine/core/styles.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import { Flex, Loader, MantineProvider } from "@mantine/core";
import { TodoPage } from "@components/TodoPage";
import { LoginPage } from "@components/LoginPage";
import { auth } from "@utils/auth";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function App() {
  const [ready, setReady] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  useEffect(() => {
    auth.onAuthStateChanged(() => {
      setCurrentUser(auth.currentUser);
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
