import { z } from "zod";

export const createUserWithEmailAndPasswordInput = z.object({
    fullName: z.string().min(5).describe("Full name of the user"),
    email: z.email().describe("Email address of the user"),
    password: z.string().min(5).describe("Password of the user")

})

export type CreateUserWithEmailAndPasswordInputType = z.infer<typeof createUserWithEmailAndPasswordInput>



export const generateUserTokenPayload = z.object({
    id: z.string().describe("uuid of the user")
})

export type generateUserTokenPayloadType = z.infer<typeof generateUserTokenPayload>

export const signInUserWithEmailAndPasswordInput = z.object({
    email: z.email().describe("email of the user"),
    password: z.string().min(5).describe("password of the user")
})

export type SignInUserWithEmailAndPasswordInputType = z.infer<typeof signInUserWithEmailAndPasswordInput>
