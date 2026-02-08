#target photoshop

function main() {
    if (arguments.length < 2) return;

    var psdPath = arguments[0];
    var dataPath = arguments[1]; // Path to JSON file with data and mappings
    var outputPath = arguments[2]; // Path to save the PNG

    var file = new File(psdPath);
    if (!file.exists) return;

    // Load data from JSON file
    var dataFile = new File(dataPath);
    dataFile.open('r');
    var jsonRaw = dataFile.read();
    dataFile.close();

    // Basic JSON parser (Photoshop JSX is old)
    var job = eval('(' + jsonRaw + ')');
    var aiData = job.ai_data || {};
    var mappings = job.mappings || {};

    var doc = open(file);

    // Fill layers
    for (var layerName in mappings) {
        var systemKey = mappings[layerName];
        var value = aiData[systemKey];
        if (value) {
            try {
                var layer = doc.layers.getByName(layerName);
                if (layer.kind == LayerKind.TEXT) {
                    layer.textItem.contents = value;
                }
            } catch (e) {
                // Layer not found or not text
            }
        }
    }

    // Export to PNG
    var pngFile = new File(outputPath);
    var pngOptions = new PNGSaveOptions();
    doc.saveAs(pngFile, pngOptions, true, Extension.LOWERCASE);

    // Close without saving changes to the template
    doc.close(SaveOptions.DONOTSAVECHANGES);
}

main();
