import { useTypedSelector } from "./useTypedSelector";

export const useChat = () => {
  const { messages, user } = useTypedSelector(state => state.chat);
  return { messages, user };
};