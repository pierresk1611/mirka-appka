// Photoshop JSX Script - Open and Fill
// This script is called from the local agent

function main() {
    if (arguments.length === 0) return;

    var jsonFile = new File(arguments[0]);
    if (!jsonFile.exists) return;

    jsonFile.open('r');
    var job = eval('(' + jsonFile.read() + ')');
    jsonFile.close();

    if (!job.template || !new File(job.template).exists) {
        alert("Template not found: " + job.template);
        return;
    }

    // Open the document
    var doc = app.open(new File(job.template));
    app.activeDocument = doc;

    // Process Layers
    processLayers(doc, job.data.layers, job.data.mappings);

    return "Document opened and filled: " + doc.name;
}

function processLayers(parent, layersData, mappings) {
    for (var i = 0; i < parent.layers.length; i++) {
        var layer = parent.layers[i];

        if (layer.typename === "LayerSet") {
            processLayers(layer, layersData, mappings);
        } else if (layer.kind === LayerKind.TEXT) {
            var layerName = layer.name;
            var systemKey = mappings[layerName] || layerName;

            if (layersData[systemKey]) {
                layer.textItem.contents = layersData[systemKey];
            }
        }
    }
}

main();
