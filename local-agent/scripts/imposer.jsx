// imposer.jsx - Imposition Script for Adobe Illustrator

function main() {
    if (arguments.length === 0) return "Error: No arguments";

    var jsonPath = arguments[0];
    var dataFile = new File(jsonPath);
    dataFile.open("r");
    var conf = eval("(" + dataFile.read() + ")");
    dataFile.close();

    // conf: { sheet: "SRA3", items: [ "path/to/1.pdf", "path/to/2.pdf" ], layout: { rows, cols, cellW, cellH, startX, startY } }

    // 1. Create New Document
    // Preset SRA3 or Custom
    var preset = new DocumentPreset();
    preset.width = 450 * 2.834645; // mm to points
    preset.height = 320 * 2.834645;
    preset.units = RulerUnits.Millimeters;
    preset.title = "Imposition_Sheet";
    preset.colorMode = DocumentColorSpace.CMYK;

    var doc = app.documents.addDocument(DocumentColorSpace.CMYK, preset);

    // 2. Loop and Place
    var items = conf.items;
    var idx = 0;

    var startX = 10; // mm
    var startY = 10; // mm
    var gapX = 2;
    var gapY = 2;

    var rows = conf.layout.rows;
    var cols = conf.layout.cols;

    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            if (idx >= items.length) break;

            var pdfPath = items[idx];
            var f = new File(pdfPath);

            if (f.exists) {
                var placed = doc.placedItems.add();
                placed.file = f;

                // Position (Illustrator uses Points, and origin is specific)
                // Top-Left logic requires conversion
                var x = (startX + (c * (placed.width / 2.8346 + gapX))) * 2.8346;
                // Y in AI is bottom-up or top-down depending on version/scripting? 
                // Usually Top is 0 or Height.
                // PlacedItem.position = [x, y]. y is positive upwards usually? 
                // Let's assume standard [left, top] coordinate system for scripting where top is positive relative to origin?
                // Actually AI scripting is tricky with coordinates. 
                // Simple placement:
                placed.left = x;
                placed.top = -(startY + (r * (placed.height / 2.8346 + gapY))) * 2.8346; // Negative usually works relative to top-left 0,0 if artboard is there
            }

            idx++;
        }
    }

    return "Success: Imposition created with " + idx + " items.";
}

main();
