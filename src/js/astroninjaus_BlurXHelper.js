#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include "C:\Program Files\PixInsight\src\scripts\mschuster\FWHMEccentritity\FWHMEccentricity.js"
#include "astroninjaus_Common.js"


#feature-id  astroninja.us > BlurX Helper

#define ID                 "BlurXHelper"
#define TITLE              "BlurX Helper"
#define VERSION            "0.0.1"
#define AUTHOR             "Naveen Malik"

#feature-info calculates Median FWHM and uses for PSF Diameter in BlurX

// override from FWHMEx script to not make dialog not show
function main() {
    console.hide();
    parameters.loadSettings();
 
    var parametersDialog = new parametersDialogPrototype();
//    parametersDialog.execute();
 
    // Workaround to avoid image window close crash in 1.8 RC7.
    parametersDialog.viewList.currentView =
       parametersDialog.viewListNullCurrentView;
 
    parameters.storeSettings();
 }

function mainBlurXHelper() {

    parameters.sharpen_stars = Parameters.has("sharpen_stars") ? Parameters.getReal("sharpen_stars") : 0.25;
    parameters.sharpen_nonstellar = Parameters.has("sharpen_nonstellar") ? Parameters.getReal("sharpen_nonstellar") : 0.9;
    parameters.ai_file = Parameters.has("ai_file") ? Parameters.getString("ai_file") : "C:/Program Files/PixInsight/library/BlurXTerminator.2.pb";

    globalMeasure();

    Console.writeln("Running BlurXTerminator with the following:")
    Console.writeln(format("Median FWHM: %f", parameters.medianFWHM))
    Console.writeln(format("Sharpen Stars: %f", parameters.sharpen_stars))
    Console.writeln(format("Sharpen Nonstellar: %f", parameters.sharpen_nonstellar))
    Console.writeln(format("AI File: %s", parameters.ai_file))

    var P = new BlurXTerminator;
    P.ai_file = parameters.ai_file;
    P.correct_only = false;
    P.correct_first = false;
    P.nonstellar_then_stellar = false;
    P.lum_only = false;
    P.sharpen_stars = parameters.sharpen_stars;
    P.adjust_halos = 0.00;
    P.nonstellar_psf_diameter = parameters.medianFWHM;
    P.auto_nonstellar_psf = false;
    P.sharpen_nonstellar = parameters.sharpen_nonstellar;

    console.show()
    P.executeOn(ImageWindow.activeWindow.currentView)
}

mainBlurXHelper();