export const dynamic = 'force-dynamic';

export default function TestPage() {
    return (
        <div className="p-10">
            <h1 className="text-3xl font-bold text-green-600">Deployment Works!</h1>
            <p>Timestamp: {new Date().toISOString()}</p>
        </div>
    );
}
