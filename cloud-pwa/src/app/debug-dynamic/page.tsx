export const dynamic = 'force-dynamic';

export default function DebugDynamicPage() {
    return (
        <div className="p-10">
            <h1 className="text-3xl font-bold text-purple-600">Dynamic Rendering (No Params) Works!</h1>
            <p>This page is rendered on demand.</p>
            <p>Timestamp: {new Date().toISOString()}</p>
        </div>
    );
}
