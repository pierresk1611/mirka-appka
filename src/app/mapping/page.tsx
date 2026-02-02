"use client";

import React from 'react';
import MappingEditor from '@/components/MappingEditor';

export default function MappingPage() {
    const handleSave = (mapping: Record<string, string>) => {
        console.log('Saved mapping:', mapping);
        alert('Mapping saved! (Mock)');
    };

    // Mock PSD Layers detected by Local Agent
    const mockPsdLayers = [
        'Layer 1',
        'Text Copy 2',
        'Datum',
        'Miesto konania'
    ];

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <MappingEditor
                templateName="JSO_15_OLD_VERSION"
                psdLayers={mockPsdLayers}
                onSave={handleSave}
            />
        </div>
    );
}
