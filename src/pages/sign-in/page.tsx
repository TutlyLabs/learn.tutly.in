import { SignIn } from "@/components/auth/Signin";
import Providers from "@/utils/providers";

export default function SignInPage() {
  return (
    <Providers>
      <SignIn />
    </Providers>
  );
}
