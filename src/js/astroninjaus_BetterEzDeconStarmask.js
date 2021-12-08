#feature-id  astroninja.us > Better EZ Decon StarMask

#define ID                 "BetterEzDeconStarmask"
#define TITLE              "Better EZ Decon StarMask"
#define VERSION            "0.0.1"
#define AUTHOR             "Naveen Malik"

#feature-info use StarXTerminator in conjuction with StarNet to create a better mask


#include "astroninjaus_Common.js"


function mainCreateDeconStarMask() {
    // auto stretches the current active view using ez scripts
    var window = ImageWindow.activeWindow;
    if ( !window )
    {
       (new MessageBox( "There is no active image window!",
                        TITLE, StdIcon_Error, StdButton_Ok )).execute();
       return;
    }

	Console.show();
	Console.writeln("Creating mask for deconvolution...")
 
	// work on a clone,
	var maskId = format("_ez_Decon_%s_StarMask_better", window.currentView.id);
	var mask;

	if (window.currentView.image.isColor) {
		var RGBWS = new RGBWorkingSpace;
		RGBWS.channels = [ // Y, x, y
		   [1.000000, 0.648431, 0.330856],
		   [1.000000, 0.321152, 0.597871],
		   [1.000000, 0.155886, 0.066044]
		];
		RGBWS.gamma = 2.20;
		RGBWS.sRGBGamma = true;
		RGBWS.applyGlobalRGBWS = false;
		RGBWS.executeOn(window.currentView)
		
		var lumExtraction = new ChannelExtraction;
		lumExtraction.colorSpace = ChannelExtraction.prototype.CIELab;
		lumExtraction.channels = [
			[true, ""],
			[false, ""],
			[false, ""]
		];
		lumExtraction.sampleFormat = ChannelExtraction.prototype.SameAsSource;
		lumExtraction.executeOn(window.currentView);
		mask = ImageWindow.activeWindow.currentView;
		mask.id = maskId;
		
		// create L and show it (won't be edited, this can be deconvolved)
		lum = cloneView(mask, format("%s_L", window.currentView.id)).mainView
		doSTF(lum);
		lum.window.show()
	} else {
		mask = cloneView(window.currentView, maskId).mainView;
	}
	mask.window.show();

	var binarize_multiplier_starnet = 1;
	var binarize_multiplier_xterm = 4; // starxterm results in lower mean, multiply

	// apply stf
	doSTF(mask);
	// apply ht
	doHistogramTransformation(mask);
	// reset stf
	doResetSTF(mask);
	// extract stars
	var useStarNet = Parameters.has("use_starnet") ? Parameters.getBoolean("use_starnet") : true;
	var useStarXTerminator = Parameters.has("use_starxterminator") ? Parameters.getBoolean("use_starxterminator") : true;
	var starnetStarsWindow;
	var starxtermStarsWindow;
	var PM;
	if (useStarNet) {
		starnetStarsWindow = doExtractStars_StarNet(mask);
	}
	if (useStarXTerminator) {
		starxtermStarsWindow = doExtractStars_StarXTerminator(mask);
	}
	if (useStarNet) {
		PM = new PixelMath;
		PM.expression = format("%s", starnetStarsWindow.mainView.id);
		PM.executeOn(mask);
		doBinarize(mask, binarize_multiplier_starnet);
	}
	if (useStarXTerminator) {
		PM = new PixelMath;
		PM.expression = format("%s", starxtermStarsWindow.mainView.id);
		PM.executeOn(mask);
		doBinarize(mask, binarize_multiplier_xterm);
	}	
	if(useStarNet && useStarXTerminator) {
		// using both, binarize each starless independently before combining
		doBinarize(starnetStarsWindow.mainView, binarize_multiplier_starnet);
		doBinarize(starxtermStarsWindow.mainView, binarize_multiplier_xterm); 
		// do not rescale
		PM = new PixelMath;
		PM.expression = format("%s + %s", starnetStarsWindow.mainView.id, starxtermStarsWindow.mainView.id);
		PM.executeOn(mask);
	}
	if (useStarNet) {
		starnetStarsWindow.forceClose();
	}
	if (useStarXTerminator) {
		starxtermStarsWindow.forceClose();
	}
	// dialate
	doDilate(mask);
	// convolve
	doConvolve(mask);
	// dialate
	doDilate(mask);

	Console.hide();
}

mainCreateDeconStarMask();

