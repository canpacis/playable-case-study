import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@utils/auth";

export function LoginPage() {
  const handleLogin = async () => {
    const credentials = await signInWithPopup(auth, provider);
    console.log(credentials);
  };

  return (
    <div>
      <button onClick={handleLogin} type="button">
        login
      </button>
    </div>
  );
}
