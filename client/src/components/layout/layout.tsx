'use client'
import Chatbot from "./Chatbot/Chatbot";
import Header from "./Header/Header";
import ScrollToTop from "./ScrollToTop/ScrollToTop";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<section>
			<Header />
					<Chatbot />
					<ScrollToTop />
			{children}
		</section>
	)
}
