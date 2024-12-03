import { useAppDispatch } from "@/hooks/use-app-dispatch";
import useToast from "@/hooks/use-toast";
import { authSignIn, authSignOut } from "@/stores/auth/auth.slice";
import { resetCourse } from "@/stores/course/course.slice";
import { RecoverPasswordProps } from "@/types/auth/recover-password";
import { SignInProps } from "@/types/auth/signin";
import { SignUpProps } from "@/types/auth/signup";
import { VerfiyCodeProps } from "@/types/auth/verify-code";
import { ChildrenNodeProps } from "@/types/children";
import { removeToken } from "@/utils/token";
import axios, { AxiosError } from "axios";
import { createContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";

type AuthProviderProps = ChildrenNodeProps;

export interface AuthContextProps {
  signIn: (credentials: SignInProps, redirectUrl: string) => Promise<void>;
  signUp: (credentials: Omit<SignUpProps, "confirmPassword">) => Promise<void>;
  signOut: () => Promise<void>;
  verifyCode: (credentials: VerfiyCodeProps) => Promise<void>;
  resetPassword: (newPassword: RecoverPasswordProps) => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps>({
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  verifyCode: async () => {},
  resetPassword: async () => {},
});

const AuthProvider = ({ children }: AuthProviderProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { successToast, errorToast } = useToast();

  const signIn = useCallback(
    async (credentials: SignInProps, redirectUrl: string) => {
      try {
        const {
          data: { user, tokens },
        } = await axios.post("/auth/signin", credentials);
        dispatch(authSignIn(user));
        localStorage.setItem("token", tokens.accessToken);
        localStorage.setItem("userId", `${user.userId}`);
        successToast("Sign in successfully");
        if (redirectUrl && redirectUrl.trim()) {
          navigate(-1);
        } else {
          navigate("/");
        }
      } catch (error) {
        if (error instanceof AxiosError && error.response) {
          const { message, status, ...rest } = error.response.data;
          errorToast(message);
          if (rest.data && status === "failed") {
            const {
              data: { userVerification },
            } = rest;
            if (userVerification) {
              navigate(
                `/verify?id=${userVerification.id}&userId=${userVerification.userId}`,
              );
            }
          }
        }
        throw error;
      }
    },
    [dispatch, errorToast, navigate, successToast],
  );

  const signUp = useCallback(
    async (credentials: Omit<SignUpProps, "confirmPassword">) => {
      try {
        const {
          data: { userVerification },
        } = await axios.post("/auth/signup", credentials);
        successToast("Sign up successfully");
        navigate(
          `/verify?id=${userVerification.id}&userId=${userVerification.userId}`,
        );
      } catch (error) {
        console.error("Sign-up failed: ", error);
        throw error;
      }
    },
    [navigate, successToast],
  );

  const signOut = useCallback(async () => {
    try {
      await axios.post("/auth/signout");
      removeToken("token");
      dispatch(authSignOut());
      dispatch(resetCourse());
      successToast("Sign out successfully");
    } catch (error) {
      console.log("Sign-out failed: ", error);
      throw error;
    }
  }, [dispatch, successToast]);

  const verifyCode = useCallback(
    async (credentials: VerfiyCodeProps) => {
      try {
        const {
          data: { user, tokens },
        } = await axios.post("/auth/validation/verify", credentials);
        dispatch(authSignIn(user));
        localStorage.setItem("token", tokens.accessToken);
        navigate("/");
      } catch (error) {
        console.log("Verify code failed: ", error);
        throw error;
      }
    },
    [dispatch, navigate],
  );

  const resetPassword = useCallback(
    async (tokens: RecoverPasswordProps) => {
      try {
        await axios.post("/auth/reset-password", tokens);
        successToast("Reset password successfully");
      } catch (error) {
        console.log("Reset password failed: ", error);
        throw error;
      }
    },
    [successToast],
  );

  return (
    <AuthContext.Provider
      value={{ signIn, signUp, signOut, verifyCode, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
