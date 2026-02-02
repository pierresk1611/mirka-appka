"use client";

import React, { useState } from 'react';
import { Save, ArrowRight, Layers } from 'lucide-react';

interface LayerMapping {
    originalLayer: string;
    targetTag: string;
}

const STANDARD_TAGS = [
    'NAME_MAIN', 'DATE_MAIN', 'TIME_MAIN', 'PLACE_MAIN',
    'QUOTE_TOP', 'BODY_TEXT', 'BODY_FULL'
];

interface MappingEditorProps {
    templateName: string;
    psdLayers: string[];
    initialMapping?: Record<string, string>;
    onSave: (mapping: Record<string, string>) => void;
}

export default function MappingEditor({ templateName, psdLayers, initialMapping = {}, onSave }: MappingEditorProps) {
    const [mapping, setMapping] = useState<Record<string, string>>(initialMapping);

    const handleTagChange = (layer: string, tag: string) => {
        setMapping(prev => ({ ...prev, [layer]: tag }));
    };

    const handleSave = () => {
        onSave(mapping);
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
            <div className="flex items-center space-x-3 mb-6">
                <div className="bg-purple-100 p-2 rounded-lg">
                    <Layers className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Smart Mapping: {templateName}</h3>
                    <p className="text-sm text-gray-500">Map original PSD layers to system tags.</p>
                </div>
            </div>

            <div className="space-y-4">
                {psdLayers.map((layer) => (
                    <div key={layer} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-md">
                        <div className="flex-1">
                            <span className="text-xs font-mono text-gray-400 block">PSD Layer</span>
                            <span className="font-medium text-gray-700">{layer}</span>
                        </div>

                        <ArrowRight className="w-5 h-5 text-gray-300" />

                        <div className="flex-1">
                            <label className="text-xs font-mono text-gray-400 block mb-1">Maps To System Tag</label>
                            <select
                                className="w-full border-gray-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
                                value={mapping[layer] || ''}
                                onChange={(e) => handleTagChange(layer, e.target.value)}
                            >
                                <option value="">-- Unmapped --</option>
                                {STANDARD_TAGS.map(tag => (
                                    <option key={tag} value={tag}>{tag}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
                >
                    <Save className="w-4 h-4 mr-2" />
                    Save Mapping Manifest
                </button>
            </div>
        </div>
    );
}
