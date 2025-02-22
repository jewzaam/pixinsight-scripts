// Custom version to allow headless execution.

var NAME = "astroninja.us EZ Soft Stretch";
var VERSION = "0.0.1";
var AUTHOR = "Naveen Malik";
var ABOUT_HTML = "<b>Wrapper around EZ Soft Stretch to allow headless execution.</b>";
var PREREQUISITES = [
	"Image is cropped properly",
	"Image is not stretched (image is linear)",
	"Image is color calibrated (RGB)"
];
var USAGES = ["Apply to view you wish to stretch"
];
var NOTES = ["Intended for consistent and easy stretching."];

// Override main() so it's a noop.  This is defined in EX_Common.js
function main() {
	// FULLNAME = NAME + " v" + VERSION; // It seems that var is not always set properly in declaration

	checkForOverrides();
	onInit();
	CurrentProcessingInfo = generateProcessingInfo();

	dialog = new myDialog(FULLNAME, AUTHOR);
	customizeDialog(dialog);
	dialog.onExecute = function() {
		dialog.recalculateAll();
		dialog.updateTimer.start();
		dialog.loadInitialView();
	}

	new ElveteekLogger(this, VERSION, NAME, "EZ Processing Suite").printElveteekLogo();

	jsAbortable = true;

    mainWindow = View.viewById(CurrentProcessingInfo.mainViewId).window;
    execute(mainWindow);

	// #endregion Main
	delete Array.prototype.removeItem;
	delete Object.prototype.printPropertiesDebug;
}

#include "E:\Dropbox\Family Room\Astrophotography\Downloads\PixInsight\ez-processing-suite\EZ_SoftStretch.js"

