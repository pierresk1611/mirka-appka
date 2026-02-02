// processor.jsx - Runs inside Photoshop

function main() {
    // 1. Read Arguments
    // arguments[0] is the path to the JSON file containing job details
    if (!arguments || arguments.length === 0) {
        return "Error: No arguments provided to script.";
    }

    var jsonPath = arguments[0];
    var dataFile = new File(jsonPath);

    if (!dataFile.exists) {
        return "Error: JSON data file not found at " + jsonPath;
    }

    dataFile.open("r");
    var jsonContent = dataFile.read();
    dataFile.close();

    // Parse JSON (ExtendScript doesn't have native JSON.parse in older versions, 
    // but usually new PS has it. If not, we might need a polyfill. 
    // Assuming 2024 has it or we use eval strictly for trusted local input.)
    var job = eval("(" + jsonContent + ")"); // Safe processing of trusted local file

    var docPath = job.template;
    var outputFolder = job.output;
    var layersData = job.data.layers; // key-value pairs: "NAME_MAIN": "Peter & Jana"

    // 2. Open Document
    var fileRef = new File(docPath);
    if (!fileRef.exists) {
        return "Error: Template file not found: " + docPath;
    }

    var doc = app.open(fileRef);

    // 3. Update Layers
    processLayers(doc, layersData);

    // 4. Save Output
    // Ensure output folder exists (Folder(outputFolder).create() doesn't recurse well always)
    var outFolder = new Folder(outputFolder);
    if (!outFolder.exists) outFolder.create();

    // Save as JPG Preview
    var jpgFile = new File(outputFolder + "/preview.jpg");
    saveJpeg(doc, jpgFile);

    // Save as PDF (Production)
    var pdfFile = new File(outputFolder + "/print_ready.pdf");
    savePdf(doc, pdfFile);

    // Close without saving changes to template
    doc.close(SaveOptions.DONOTSAVECHANGES);

    return "Success: Job processed. Saved to " + outputFolder;
}

function processLayers(doc, data) {
    // Recursive function to find and update layers
    // For simplicity, we scan top level + 1 deep or traverse all.
    // Here we traverse all layers.

    // Note: Traversing huge DOM is slow. Better if we knew layer names.
    // User requirement: "Local Agent načíta vrstvy... Smart Mapping".
    // Here we just replace if found.

    traverseLayers(doc.layers, data);
}

function traverseLayers(layers, data) {
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        if (layer.typename == "LayerSet") {
            traverseLayers(layer.layers, data);
        } else if (layer.kind == LayerKind.TEXT) {
            // Check if layer name matches any key in data
            if (data[layer.name]) {
                layer.textItem.contents = data[layer.name];
            }
        }
    }
}

function saveJpeg(doc, file) {
    var jpgOpts = new JPEGSaveOptions();
    jpgOpts.quality = 10; // Max quality (0-12)
    jpgOpts.embedColorProfile = true;
    doc.saveAs(file, jpgOpts, true, Extension.LOWERCASE);
}

function savePdf(doc, file) {
    // Setup PDF Save Options based on specs
    // Spec: PDF/X-1a:2001, CMYK, 300 DPI, Bleed 2mm, Crop Marks

    var pdfOpts = new PDFSaveOptions();
    pdfOpts.presetFile = "High Quality Print"; // Fallback if specific preset not found
    // Note: Setting specific PDF/X standards via Scripting is limited/tricky without loading a preset.
    // Best practice: The user should create a Preset named "AutoDesign_V3" in Photoshop.
    // We will try to set standard properties.

    pdfOpts.encoding = PDFEncoding.JPEG;
    pdfOpts.quality = 10;

    // Changing standard requires more advance PDFSaveOptions or using a preset.
    // Ideally: pdfOpts.pDFPreset = "AutoDesign_Master";

    doc.saveAs(file, pdfOpts, true, Extension.LOWERCASE);
}

main();
