import { AdminLoginPage } from '@/components/admin/admin-login-page';
import { NoIndex } from '@/components/shared/no-index';

export default function AdminLogin() {
  return (
    <>
      <NoIndex title='Admin Login | Photify' />
      <AdminLoginPage />
    </>
  );
}
