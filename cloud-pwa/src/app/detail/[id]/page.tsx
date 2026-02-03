export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <div className="p-10 text-center">
            <h1 className="text-3xl font-bold text-green-600">Order Route Works!</h1>
            <p className="text-xl mt-4">Loaded ID: {id}</p>
            <p className="text-gray-500 mt-2">Timestamp: {new Date().toISOString()}</p>
            <a href="/" className="text-blue-500 underline mt-8 block">Go Back</a>
        </div>
    );
}
