import { Suspense } from 'react';
import { Card } from '@/components/ui';
import { SignUpForm } from './sign-up-form';

export default function SignUpPage() {
  return (
    <Suspense fallback={<Card>Loading…</Card>}>
      <SignUpForm />
    </Suspense>
  );
}
