#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>

#feature-id  astroninja.us > Save All Views

#define ID                 "SaveAllViews"
#define TITLE              "Save All Views"
#define VERSION            "0.0.1"
#define AUTHOR             "Naveen Malik"

#feature-info save active views, based on https://pixinsight.com/forum/index.php?threads/save-all-open-views.23363/

// Define the output directory (change the path as needed)
let outputDirectory = "E:/temp/PI_WBPP/saved_views";

// Ensure the output directory ends with a slash
if (!outputDirectory.endsWith("/")) {
    outputDirectory += "/";
}

// Get all image windows in the current workspace
let windows = ImageWindow.windows;

// Loop through each window and save the view
for (let i = 0; i < windows.length; ++i) {
    let window = windows[i];
    let view = window.mainView;

    // Construct the output file path
    let outputPath = outputDirectory + view.id + ".bmp";

    // Save the window
    window.saveAs(outputPath, false, false, false, false);
    console.writeln("Saved view: " + view.id + " to " + outputPath);
}

console.writeln("All views have been saved.");