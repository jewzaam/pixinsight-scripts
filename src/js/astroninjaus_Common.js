//STF settings:
// Shadows clipping point in (normalized) MAD units from the median.
#define DEFAULT_AUTOSTRETCH_SCLIP -2.8
// Target mean background in the [0,1] range.
#define DEFAULT_AUTOSTRETCH_TGBND 0.25


// COPIED from EZ Suite! (So I don't need dependencies)
function doSTF(view, stf = null, unlinked = false) {
	var transformation = [
		[0, 1, 0.5, 0, 1],
		[0, 1, 0.5, 0, 1],
		[0, 1, 0.5, 0, 1],
		[0, 1, 0.5, 0, 1]];

	if (stf == null) {
		//get values from the image to calculate STF
		var median = view.computeOrFetchProperty("Median");
		var mad = view.computeOrFetchProperty("MAD");

		//set variables
		let targetBackground = DEFAULT_AUTOSTRETCH_TGBND;
		let shadowsClipping = DEFAULT_AUTOSTRETCH_SCLIP;

		if ((!unlinked && !view.image.isGrayscale) || view.image.isGrayscale) {
			// calculate STF settings based on DeLinear Script
			var clipping = (1 + mad.at(0) != 1) ?
				Math.range(median.at(0) + shadowsClipping * mad.at(0), 0.0, 1.0) : 0.0;
			var targetMedian = Math.mtf(targetBackground, median.at(0) - clipping);

			transformation[0] = [clipping, 1, targetMedian, 0, 1];
			if(!view.image.isGrayscale) {
				transformation[1] = [clipping, 1, targetMedian, 0, 1];
				transformation[2] = [clipping, 1, targetMedian, 0, 1];
			}
		} else {
			for (let i = 0; i < 3; i++) {
				// calculate STF settings based on DeLinear Script
				var clipping = (1 + mad.at(i) != 1) ?
					Math.range(median.at(i) + shadowsClipping * mad.at(i), 0.0, 1.0) : 0.0;
				var targetMedian = Math.mtf(targetBackground, median.at(i) - clipping);

				transformation[i] = [clipping, 1, targetMedian, 0, 1];
			}
		}
	} else {
		transformation = stf;
	}

	var STFunction = new ScreenTransferFunction();
	STFunction.STF = transformation;

	STFunction.executeOn(view);

	return transformation;
}

// COPIED from EZ Suite! (So I don't need dependencies)
function doHistogramTransformation(view) {
	var HT = new HistogramTransformation;

	if (view.image.isGrayscale) {
		//get values from STF
		var clipping = view.stf[0][1];
		var median = view.stf[0][0];
		HT.H = [[0, 0.5, 1.0, 0, 1.0],
		[0, 0.5, 1.0, 0, 1.0],
		[0, 0.5, 1.0, 0, 1.0],
		[clipping, median, 1.0, 0, 1.0],
		[0, 0.5, 1.0, 0, 1.0]];
	} else {
		HT.H = [[view.stf[0][1], view.stf[0][0], 1.0, 0, 1.0],
		[view.stf[1][1], view.stf[1][0], 1.0, 0, 1.0],
		[view.stf[2][1], view.stf[2][0], 1.0, 0, 1.0],
		[0, 0.5, 1.0, 0, 1.0],
		[0, 0.5, 1.0, 0, 1.0]];
	}

	view.beginProcess();
	HT.executeOn(view.image);
	view.endProcess();
}

// COPIED from EZ Suite! (So I don't need dependencies)
function doResetSTF(view) {
	let transformation = [
		[0, 1, 0.5, 0, 1],
		[0, 1, 0.5, 0, 1],
		[0, 1, 0.5, 0, 1],
		[0, 1, 0.5, 0, 1]];

	let STFunction = new ScreenTransferFunction();
	STFunction.STF = transformation;

	STFunction.executeOn(view);

	return transformation;
}

// COPIED from EZ Suite! (So I don't need dependencies)
// and modified to use mean for thresholds
function doBinarize(view, mean_multiplier=1) {
	let binarize = new Binarize;

	var t = view.image.mean() * mean_multiplier;
	Console.writeln("Binarize: image mean = " + view.image.mean());
	Console.writeln("Binarize: multiplier = " + mean_multiplier);
	Console.writeln("Binarize: threshold = " + t);

	binarize.thresholdRK = t;
	binarize.thresholdG = t;
	binarize.thresholdB = t;
	binarize.isGlobal = true;

	binarize.executeOn(view);
}

// COPIED from EZ Suite! (So I don't need dependencies)
function doConvolve(view) {
	let convolve = new Convolution;
	convolve.mode = Convolution.prototype.Parametric;
	convolve.sigma = 4.50;
	convolve.shape = 2.00;
	convolve.aspectRatio = 1.00;
	convolve.rotationAngle = 0.00;
	convolve.filterSource = "";
	convolve.rescaleHighPass = false;
	convolve.viewId = "";

	convolve.executeOn(view);
}

// COPIED from EZ Suite! (So I don't need dependencies)
function doDilate(view) {
	let dilute = new MorphologicalTransformation;
	dilute.operator = MorphologicalTransformation.prototype.Dilation;
	dilute.interlacingDistance = 1;
	dilute.lowThreshold = 0.000000;
	dilute.highThreshold = 0.000000;
	dilute.numberOfIterations = 1;
	dilute.amount = 1.00;
	dilute.selectionPoint = 0.50;
	dilute.structureName = "5x5 Circular Structure";
	dilute.structureSize = 5;
	dilute.structureWayTable = [ // mask
		[[
			0x00, 0x01, 0x01, 0x01, 0x00,
			0x01, 0x01, 0x01, 0x01, 0x01,
			0x01, 0x01, 0x01, 0x01, 0x01,
			0x01, 0x01, 0x01, 0x01, 0x01,
			0x00, 0x01, 0x01, 0x01, 0x00
		]]
	];

	dilute.executeOn(view);
}

// returns the window matching the search
function findWindowById(searchIdString) {
	var windowMainViewId = ""
	var window

	Console.writeln(format("Searching for window by id: %s", searchIdString))

	var allWindows = ImageWindow.windows;
    for (var i in allWindows) {
        if (allWindows[i].mainView.id == searchIdString) {
            // found exact match.
            window = allWindows[i]
            windowMainViewId = window.mainView.id
            Console.writeln(format("Window match found: %s", window.mainView.id))
            break
        }
    }

	return window
}

// returns the new window
function cloneView(sourceView, id)
{
	Console.writeln("Creating new view '" + id + "' from '" + sourceView.id + "'");
	var sourceImage = sourceView.image;
	var tmp = new ImageWindow(sourceImage.width,
		sourceImage.height, sourceImage.numberOfChannels, 
		sourceImage.bitsPerSample, sourceImage.isReal, 
		sourceImage.isColor, id);
	var tmpView = tmp.mainView;
	tmpView.beginProcess();
	tmpView.image.apply(sourceImage);
	tmpView.endProcess();
	return tmp;
}

function doExtractStars_StarNet(sourceView) {
	// to control the output mask don't create stars, we will do with PixelMath

	// extract stars with StarNet
	var starnetStarlessWindow = cloneView(sourceView, format("_%s_starnet_starless", sourceView.id));
	starnetStarlessWindow.show();
	let starNet = new StarNet();
	starNet.stride = 0;
	starNet.executeOn(starnetStarlessWindow.mainView);
	var starnetStarsWindow = cloneView(sourceView, format("_%s_starnet_stars", sourceView.id));
	starnetStarsWindow.show()
	var PM = new PixelMath;
	PM.expression = format("%s - %s", sourceView.id, starnetStarlessWindow.mainView.id);
	PM.executeOn(starnetStarsWindow.mainView);
	starnetStarlessWindow.forceClose();

	return starnetStarsWindow;
}

function doExtractStars_StarNet1(sourceView) {
	return doExtractStars_StarNet(sourceView);
}

function doExtractStars_StarNet2(sourceView) {
	// to control the output mask don't create stars, we will do with PixelMath
	Console.writeln("Removing stars with StarNet2!")
	// extract stars with StarNet
	var starnetStarlessWindow = cloneView(sourceView, format("_%s_starnet2_starless", sourceView.id));
	starnetStarlessWindow.show();
	let starNet = new StarNet2();
	starNet.stride = StarNet2.prototype.defStride;
	starNet.mask = false;
	starNet.linear = true;
	starNet.executeOn(starnetStarlessWindow.mainView);
	var starnetStarsWindow = cloneView(sourceView, format("_%s_starnet2_stars", sourceView.id));
	starnetStarsWindow.show()
	var PM = new PixelMath;
	PM.expression = format("%s - %s", sourceView.id, starnetStarlessWindow.mainView.id);
	PM.executeOn(starnetStarsWindow.mainView);
	starnetStarlessWindow.forceClose();

	return starnetStarsWindow;
}

function doExtractStars_StarXTerminator(sourceView, destinationView) {
	// extract stars with StarXterminator2
	var starxtermStarlesssWindow = cloneView(sourceView, format("_%s_starxterm_starless", sourceView.id));
	starxtermStarlesssWindow.show();
	var starX = new StarXTerminator;
	starX.stars = false;
	starX.unscreen = false;
	starX.overlap = 0.2;
	starX.executeOn(starxtermStarlesssWindow.mainView);
	var starxtermStarsWindow = cloneView(sourceView, format("_%s_starxterm_stars", sourceView.id));
	starxtermStarsWindow.show()
	var PM = new PixelMath;
	PM.expression = format("%s - %s", sourceView.id, starxtermStarlesssWindow.mainView.id);
	PM.executeOn(starxtermStarsWindow.mainView);
	starxtermStarlesssWindow.forceClose();

	return starxtermStarsWindow;
}

function doInvert(view) {
	var invert = new Invert;
	invert.executeOn(view);
}
