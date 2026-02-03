export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <div className="p-10">
            <h1 className="text-3xl font-bold text-blue-600">Dynamic Route Works!</h1>
            <p>ID: {id}</p>
            <p>Timestamp: {new Date().toISOString()}</p>
        </div>
    );
}
