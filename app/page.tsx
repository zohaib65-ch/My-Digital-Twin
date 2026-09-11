import type { Metadata } from 'next';
import { ChatContainer } from '@/components/chat/chat-container';

export const metadata: Metadata = {
  title: 'Muhammad Zohaib | AI Digital Twin',
  description:
    'Interactive AI Digital Twin of Muhammad Zohaib — Full-Stack Web Developer & MERN/Vue.js Engineer. Explore 8+ live production websites, technical skills, and freelance availability.',
};

export default function HomePage() {
  return <ChatContainer />;
}
