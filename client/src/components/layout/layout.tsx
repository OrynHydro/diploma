import Chatbot from "./Chatbot/Chatbot";


export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<section>
            <Chatbot />
			{children}
		</section>
	)
}
