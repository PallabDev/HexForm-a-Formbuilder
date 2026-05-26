import { z } from "zod";
import { userService } from "../../services";
import { authenticatedProcedure, publicProcedure, router } from "../../trpc";
import { clearAuthenticationCookie, setAuthenticationCookies } from "../../utils/cookie";
import { generatePath } from "../../utils/path-generator";
import {
  createUserWithEmailAndPasswordInuptModel,
  CreateUserWithEmailAndPasswordOutputModel,
  getLoggedInUserInfoInputModel,
  getLoggedInUserInfoOutputModel,
  signInUserWitEmailAndPasswordInputModel,
  SignInUserWitEmailAndPasswordOutputModel,
} from "./model";
const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");

export const authRouter = router({
  createUserWithEmailAndPassword: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/createUserWitEmailAndPassword"),
        tags: TAGS,
      },
    }) // not a trpc part
    .input(createUserWithEmailAndPasswordInuptModel)
    .output(CreateUserWithEmailAndPasswordOutputModel)
    .mutation(async ({ input, ctx }) => {
      const { fullName, email, password } = input;
      const { id, token } = await userService.createUserWithEmailAndPassword({
        fullName,
        email,
        password,
      });
      setAuthenticationCookies(ctx, token);
      return {
        id,
        // token  we have to send this too if the client on not for web (like mobile devices)
      };
    }),

  signInUserWithEmailAndPassword: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/signInUserWitEmailAndPassword"),
        tags: TAGS,
      },
    })
    .input(signInUserWitEmailAndPasswordInputModel)
    .output(SignInUserWitEmailAndPasswordOutputModel)
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;
      const { id, token } = await userService.signInUserWithEmailAndPassword({ email, password });
      setAuthenticationCookies(ctx, token);
      return {
        id,
      };
    }),

  getLoggedInUserInfo: authenticatedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/getLoggedInUserInfo"),
        tags: TAGS,
      },
    })
    .input(getLoggedInUserInfoInputModel)
    .output(getLoggedInUserInfoOutputModel)
    .query(async ({ ctx }) => {
      return {
        id: ctx.user.id,
        email: ctx.user.email,
        fullName: ctx.user.fullName,
        profileImageUrl: ctx.user.profileImageUrl,
      };
    }),

  signOut: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/signOut"),
        tags: TAGS,
      },
    })
    .input(z.object({}).optional())
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx }) => {
      clearAuthenticationCookie(ctx);
      return { success: true };
    }),
});
