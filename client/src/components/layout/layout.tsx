'use client'
import Chatbot from "./Chatbot/Chatbot";
import Header from "./Header/Header";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<section>
			<Header />
					<Chatbot />
			
			{children}
		</section>
	)
}
