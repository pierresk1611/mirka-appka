import React from 'react';
import ClientOrderDetail from './ClientOrderDetail';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    await params; // Ensure params are awaited for Next.js 15 compatibility
    return <ClientOrderDetail />;
}
