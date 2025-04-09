"use client";

import { useSearchParams } from 'next/navigation';
import CanvasEditor from '@/components/CanvasEditor';

export default function CanvasPage() {
  const searchParams = useSearchParams();
  const question = searchParams.get('question') || '';

  return (
    <div style={{ height: '100vh' }}>
      <CanvasEditor initialData={{ initialQuestion: question }} />
    </div>
  );
}