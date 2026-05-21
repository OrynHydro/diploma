'use client'
import Chatbot from "./Chatbot/Chatbot";
import { Footer } from "./Footer/Footer";
import Header from "./Header/Header";
import ScrollToTop from "./ScrollToTop/ScrollToTop"
import { usePathname } from "next/navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    
    const isAdminPage = pathname.startsWith('/admin')

    return (
        <section>
            {!isAdminPage && (
                <>
                    <Header />
                    <Chatbot />
                    <ScrollToTop />
                </>
            )}
            
            {children}
            
            {!isAdminPage && (
                <Footer />
            )}
        </section>
    )
}