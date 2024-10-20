import Image from "next/image";
import { subscribe } from '../actions2'
import * as React from "react";

async function InstallPrompt() {

    // どのページにランディングされてもサービスワーカーが登録されるように、
    // 全ページでこのスクリプトが実行されるようにしたほうが無難です。
    if (typeof window !== 'undefined') {
        if (window.navigator.serviceWorker !== undefined) {
            window.navigator.serviceWorker.register('/sw.js');
        }
    }    

    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
                <div className="flex gap-4 items-center flex-col sm:flex-row">
                    <button
                        className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
                        onClick={subscribe}
                    >
                        <Image
                            className="dark:invert"
                            src="https://nextjs.org/icons/vercel.svg"
                            alt="Vercel logomark"
                            width={20}
                            height={20}
                        />
                        Deploy now
                    </button>
                </div>
            </main>

        </div>
    )
}

export default function Page() {
    return (
        <div>
            <InstallPrompt />
        </div>
    )
}
