import "@mantine/core/styles.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import { MantineProvider } from "@mantine/core";
import { TodoPage } from "@components/TodoPage";
import { LoginPage } from "@components/LoginPage";
import { useLocalStorage } from "@mantine/hooks";

export default function App() {
  const [token] = useLocalStorage({
    key: "id-token",
  });

  console.log(token);

  return (
    <MantineProvider>
      <BrowserRouter>
        <Routes>
          {!token ? (
            <Route path="/" element={<Navigate to="/login" />} />
          ) : (
            <Route path="/" element={<TodoPage />} />
          )}
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}
