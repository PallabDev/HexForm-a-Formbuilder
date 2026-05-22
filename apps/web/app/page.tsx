"use client"

import { useEffect } from "react";
import { useUser } from "~/hooks/api/auth";
import { useRouter } from "next/navigation"


export default function Home() {
    const router = useRouter();

    const { user, isLoading } = useUser();

    useEffect(() => {
        if (user && user.id) {

            router.replace("/dashboard")
        }
        else {
            router.replace("/signin")
        }
    }, [user])
    return (

        <main className="min-h-screen min-w-screen flex justify-center items-center">
            {isLoading && (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
            )
            }
        </main>
    );
}
