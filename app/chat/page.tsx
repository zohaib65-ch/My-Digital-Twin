import type { Metadata } from 'next';
import { ChatContainer } from '@/components/chat/chat-container';

export const metadata: Metadata = {
  title: 'Chat | Ask My Digital Twin',
  description:
    'Ask questions about Muhammad Zohaib — skills, projects, experience, services, and more.',
};

export default function ChatPage() {
  return <ChatContainer />;
}
