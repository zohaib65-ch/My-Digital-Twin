import type { Metadata } from 'next';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

export const metadata: Metadata = {
  title: 'Admin | Ask My Digital Twin',
  description: 'Manage the knowledge base, trigger ingestion, and monitor system health.',
};

export default function AdminPage() {
  return <AdminDashboard />;
}
