'use client'
import Chatbot from "./Chatbot/Chatbot";
import Header from "./Header/Header";
import { usePathname } from "next/navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname()
	return (
		<section>
			{/* {pathname !== '/auth' && (
				<div>
					
				</div>
			// )} */}
			<Header />
					<Chatbot />
			
			{children}
		</section>
	)
}
