import { Suspense } from 'react';
import { Card } from '@/components/ui';
import { SignInForm } from './sign-in-form';

export default function SignInPage() {
  return (
    <Suspense fallback={<Card>Loading…</Card>}>
      <SignInForm />
    </Suspense>
  );
}
