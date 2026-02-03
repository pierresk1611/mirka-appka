export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <h1 style={{ color: 'blue' }}>DEBUG: Order Page Loaded</h1>
            <p>ID: {id}</p>
            <p>If you see this, routing works. The error is in ClientOrderDetail.</p>
        </div>
    );
}
