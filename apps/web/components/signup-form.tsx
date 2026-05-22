"use client"

import { useForm } from "react-hook-form"
import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { useSignup } from "~/hooks/api/auth"
import Link from "next/link"
import { useRouter } from "next/router"

export type SignupFormValues = {
    fullName: string
    email: string
    password: string
    confirmPassword: string
}



export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"div">) {


    // signup hook
    const { createUserWithEmailAndPasswordAsync, error } = useSignup()
    const router = useRouter()

    const { register, handleSubmit } = useForm<SignupFormValues>({
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    })
    async function handleSignupSubmit(values: SignupFormValues) {


        // if values.password & values.confirmPassword are not same show an error
        if (values.password !== values.confirmPassword) {
            alert("Passwords do not match")
            return
        }
        const { id } = await createUserWithEmailAndPasswordAsync({
            email: values.email,
            fullName: values.fullName,
            password: values.password
        })

        if (!id) {
            alert(error)
            return
        }
        router.replace("/")


    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Create your account</CardTitle>
                    <CardDescription>
                        Enter your email below to create your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(handleSignupSubmit)} noValidate>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    autoComplete="name"
                                    {...register("fullName", { required: true })}
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    autoComplete="email"
                                    {...register("email", { required: true })}
                                />
                            </Field>
                            <Field>
                                <Field className="grid grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel htmlFor="password">Password</FieldLabel>
                                        <Input
                                            id="password"
                                            type="password"
                                            autoComplete="new-password"
                                            {...register("password", { required: true })}
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="confirm-password">
                                            Confirm Password
                                        </FieldLabel>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            autoComplete="new-password"
                                            {...register("confirmPassword", { required: true })}
                                        />
                                    </Field>
                                </Field>
                                <FieldDescription>
                                    Must be at least 8 characters long.
                                </FieldDescription>
                            </Field>
                            <Field>
                                <Button type="submit">Create Account</Button>
                                <FieldDescription className="text-center">
                                    Already have an account? <Link href="/signin">Sign in</Link>

                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
            <FieldDescription className="px-6 text-center">
                By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
                and <a href="#">Privacy Policy</a>.
            </FieldDescription>
        </div>
    )
}
