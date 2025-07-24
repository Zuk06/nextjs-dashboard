import AcmeLogo from '@/app/ui/acme-logo';
import LoginForm from '@/app/ui/login-form';
import { Suspense } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
};

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex h-15 w-full items-end rounded-lg bg-blue-500 p-3 md:h-17">
          <div className="w-32 text-white md:w-36">
            <AcmeLogo />
          </div>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="text-sm text-gray-500 mt-2">
          User test for login :
          <br />
          Email: <span className="font-bold">user@nextmail.com</span>
          <br />
          Password: <span className="font-bold">123456</span>
        </p>
      </div>
    </main>
  );
}