import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@utils/auth";

export function LoginPage() {
  const handleLogin = async () => {
    await signInWithPopup(auth, provider);
  };

  return (
    <div>
      <button onClick={handleLogin} type="button">
        login
      </button>
    </div>
  );
}
